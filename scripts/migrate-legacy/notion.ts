import { APIErrorCode, APIResponseError, Client } from "@notionhq/client"
import type { Block } from "./blocks"
import type { LoadedFile } from "./images"

export type Run = <T>(fn: () => Promise<T>) => Promise<T>
export type NotionApi = Pick<Client, "blocks" | "pages" | "fileUploads" | "databases">

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function isRetryable(err: unknown): boolean {
  if (APIResponseError.isAPIResponseError(err)) {
    return err.code === APIErrorCode.RateLimited || err.code === APIErrorCode.ConflictError || err.status >= 500
  }
  return (err as { code?: string })?.code === "notionhq_client_request_timeout"
}

// Notion allows ~3 requests/second on average. Run every call through one
// serial queue and back off exponentially on rate limits and transient errors.
export function createThrottle({
  minIntervalMs = 350, maxRetries = 6, baseDelayMs = 1000, sleep = defaultSleep,
}: { minIntervalMs?: number; maxRetries?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Run {
  let last = 0
  let chain: Promise<unknown> = Promise.resolve()
  return <T>(fn: () => Promise<T>) => {
    const task = chain.then(async () => {
      for (let attempt = 0; ; attempt++) {
        const wait = last + minIntervalMs - Date.now()
        if (wait > 0) await sleep(wait)
        last = Date.now()
        try {
          return await fn()
        } catch (err) {
          if (attempt >= maxRetries || !isRetryable(err)) throw err
          await sleep(baseDelayMs * 2 ** attempt)
        }
      }
    })
    chain = task.catch(() => undefined)
    return task
  }
}

// Tables must be created together with their rows; every other block gets its
// children appended in a follow-up call, which keeps each request within
// Notion's two-level nesting limit.
const INLINE_CHILDREN = new Set(["table"])

const childrenOf = (b: Block): Block[] => b[b.type]?.children ?? []

function withoutChildren(b: Block): Block {
  if (INLINE_CHILDREN.has(b.type) || !b[b.type]?.children) return b
  const { children, ...rest } = b[b.type]
  return { ...b, [b.type]: rest }
}

export async function appendBlocks(api: NotionApi, run: Run, parentId: string, blocks: Block[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 100) {
    const chunk = blocks.slice(i, i + 100)
    const res = await run(() =>
      api.blocks.children.append({ block_id: parentId, children: chunk.map(withoutChildren) as any })
    )
    if (res.results.length !== chunk.length) {
      throw new Error(`Notion returned ${res.results.length} blocks for ${chunk.length} appended`)
    }
    for (let j = 0; j < chunk.length; j++) {
      const children = childrenOf(chunk[j])
      if (children.length && !INLINE_CHILDREN.has(chunk[j].type)) {
        await appendBlocks(api, run, res.results[j].id, children)
      }
    }
  }
}

export async function clearChildren(api: NotionApi, run: Run, blockId: string): Promise<void> {
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const res = await run(() => api.blocks.children.list({ block_id: blockId, start_cursor: cursor }))
    ids.push(...res.results.map((b) => b.id))
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)
  for (const id of ids) await run(() => api.blocks.delete({ block_id: id }))
}

export async function uploadFile(api: NotionApi, run: Run, file: LoadedFile): Promise<string> {
  const created = await run(() =>
    api.fileUploads.create({ mode: "single_part", filename: file.filename, content_type: file.contentType })
  )
  await run(() =>
    api.fileUploads.send({
      file_upload_id: created.id,
      file: { filename: file.filename, data: new Blob([file.data], { type: file.contentType }) },
    })
  )
  return created.id
}

export async function listDatabasePages(api: NotionApi, run: Run, databaseId: string) {
  const pages: { id: string; slug: string; authorId?: string }[] = []
  let cursor: string | undefined
  do {
    const res: any = await run(() => api.databases.query({ database_id: databaseId, start_cursor: cursor }))
    for (const page of res.results) {
      const slug = (page.properties?.slug?.rich_text ?? []).map((t: any) => t.plain_text).join("")
      pages.push({ id: page.id, slug, authorId: page.properties?.author?.people?.[0]?.id })
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)
  return pages
}

export async function ensureSeriesProperty(api: NotionApi, run: Run, databaseId: string): Promise<void> {
  const db: any = await run(() => api.databases.retrieve({ database_id: databaseId }))
  if (db.properties?.series) return
  await run(() => api.databases.update({ database_id: databaseId, properties: { series: { select: {} } } as any }))
}
