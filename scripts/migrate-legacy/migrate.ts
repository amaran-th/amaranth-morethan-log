import type { LegacyPost } from "./legacy"
import type { PageCache } from "./cache"
import { buildProperties, type PageProps } from "./properties"
import { imageSource, preprocessMarkdown } from "./markdown"
import {
  markdownToNotionBlocks, missingImageBlock, noticeCallout, postprocessBlocks, uploadedImageBlock,
} from "./blocks"
import { appendBlocks, clearChildren, uploadFile, type NotionApi, type Run } from "./notion"
import { loadImage as defaultLoadImage } from "./images"

export type PlannedPost = { post: LegacyPost; props: Omit<PageProps, "thumbnailUploadId"> }

type Deps = {
  api: NotionApi
  run: Run
  databaseId: string
  cache: PageCache
  saveCache: () => void
  withNotice: boolean
  force: boolean
  loadImage?: typeof defaultLoadImage
  log: (msg: string) => void
}

export async function migratePost(deps: Deps, { post, props }: PlannedPost) {
  const { api, run, cache, log } = deps
  const loadImage = deps.loadImage ?? defaultLoadImage
  const cached = cache[post.legacyPath]
  if (cached?.state === "done" && !deps.force) {
    log(`skip (already migrated): ${post.legacyPath}`)
    return { pageId: cached.pageId, skipped: true, missingImages: [] as string[] }
  }

  const missingImages: string[] = []
  const upload = async (source: Parameters<typeof loadImage>[0]) => {
    try {
      return await uploadFile(api, run, await loadImage(source, post.dir))
    } catch (err) {
      const label = source.kind === "local" ? source.src : source.url
      missingImages.push(label)
      log(`image failed: ${label} (${(err as Error).message})`)
      return undefined
    }
  }

  // Uploads must be attached within an hour, so upload right before writing.
  const thumbnailUploadId = post.thumbnailImg
    ? await upload(imageSource(post.thumbnailImg))
    : undefined
  const properties = buildProperties({ ...props, thumbnailUploadId })

  let pageId: string
  if (cached) {
    pageId = cached.pageId
    await run(() => api.pages.update({ page_id: pageId, properties }))
    await clearChildren(api, run, pageId)
  } else {
    const page = await run(() =>
      api.pages.create({ parent: { database_id: deps.databaseId }, properties })
    )
    pageId = page.id
  }
  cache[post.legacyPath] = { pageId, slug: props.slug, state: "creating" }
  deps.saveCache()

  const { markdown, images } = preprocessMarkdown(post.body)
  const blocks = await postprocessBlocks(markdownToNotionBlocks(markdown), async (i) => {
    const id = await upload(images[i])
    const source = images[i]
    return id ? uploadedImageBlock(id) : missingImageBlock(source.kind === "local" ? source.src : source.url)
  })
  await appendBlocks(api, run, pageId, deps.withNotice ? [noticeCallout(), ...blocks] : blocks)

  cache[post.legacyPath] = { pageId, slug: props.slug, state: "done" }
  deps.saveCache()
  log(`migrated: ${post.legacyPath} -> ${props.slug}${missingImages.length ? ` (${missingImages.length} missing images)` : ""}`)
  return { pageId, skipped: false, missingImages }
}
