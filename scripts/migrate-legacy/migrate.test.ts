import { test } from "node:test"
import assert from "node:assert/strict"
import { buildProperties } from "./properties"
import { migratePost, type PlannedPost } from "./migrate"
import type { PageCache } from "./cache"
import { createThrottle } from "./notion"

const run = createThrottle({ minIntervalMs: 0, sleep: async () => {} })

function fakeApi(opts: { failAppendOnce?: boolean } = {}) {
  const log: string[] = []
  let failNext = opts.failAppendOnce ?? false
  let n = 0
  const api: any = {
    pages: {
      create: async (args: any) => { log.push(`create:${args.properties.slug.rich_text[0].text.content}`); return { id: "page1" } },
      update: async (args: any) => { log.push(`update:${args.page_id}`); return {} },
    },
    blocks: {
      children: {
        append: async ({ children }: any) => {
          if (failNext) { failNext = false; throw new Error("network down") }
          log.push(`append:${children.length}`)
          return { results: children.map(() => ({ id: `b${n++}` })) }
        },
        list: async () => ({ results: [{ id: "old" }], has_more: false, next_cursor: null }),
      },
      delete: async () => { log.push("delete") },
    },
    fileUploads: {
      create: async () => ({ id: `fu${n++}` }),
      send: async () => { log.push("upload") },
    },
  }
  return { api, log }
}

const planned: PlannedPost = {
  post: {
    legacyPath: "Java/a", dir: "/nowhere", title: "A", date: "2023-10-08", description: "d",
    section: "지식 공유", category: "Java", tags: [], body: "hello\n\n![x](missing.png)",
  },
  props: { title: "A", date: "2023-10-08", slug: "a", summary: "d", category: "💻 개발", tags: ["Java"], status: "PublicOnDetail" },
}

function deps(api: any, cache: PageCache, extra: Partial<Parameters<typeof migratePost>[0]> = {}) {
  return {
    api, run, databaseId: "db", cache, saveCache: () => {}, withNotice: false, force: false,
    loadImage: async () => { throw new Error("Local image not found: missing.png") },
    log: () => {}, ...extra,
  }
}

test("buildProperties maps every field to Notion property shapes", () => {
  const props = buildProperties({ ...planned.props, series: "기술 부채", authorId: "u1", thumbnailUploadId: "fu9" })
  assert.equal(props.title.title[0].text.content, "A")
  assert.deepEqual(props.date, { date: { start: "2023-10-08" } })
  assert.equal(props.slug.rich_text[0].text.content, "a")
  assert.deepEqual(props.category, { select: { name: "💻 개발" } })
  assert.deepEqual(props.tags, { multi_select: [{ name: "Java" }] })
  assert.deepEqual(props.series, { select: { name: "기술 부채" } })
  assert.deepEqual(props.type, { select: { name: "Post" } })
  assert.deepEqual(props.status, { select: { name: "PublicOnDetail" } })
  assert.deepEqual(props.author, { people: [{ id: "u1" }] })
  assert.deepEqual(props.thumbnail.files[0].file_upload, { id: "fu9" })
  assert.equal("URL" in props, false)
})

test("buildProperties omits empty optional fields", () => {
  const props = buildProperties(planned.props)
  assert.equal("series" in props, false)
  assert.equal("author" in props, false)
  assert.equal("thumbnail" in props, false)
})

test("new post: creates page, appends body, reports missing images, marks done", async () => {
  const { api, log } = fakeApi()
  const cache: PageCache = {}
  const result = await migratePost(deps(api, cache), planned)
  assert.deepEqual(log, ["create:a", "append:2"])
  assert.deepEqual(result.missingImages, ["missing.png"])
  assert.deepEqual(cache["Java/a"], { pageId: "page1", slug: "a", state: "done" })
})

test("done post is skipped unless forced", async () => {
  const { api, log } = fakeApi()
  const cache: PageCache = { "Java/a": { pageId: "page1", slug: "a", state: "done" } }
  assert.equal((await migratePost(deps(api, cache), planned)).skipped, true)
  assert.deepEqual(log, [])
  await migratePost(deps(api, cache, { force: true }), planned)
  assert.deepEqual(log, ["update:page1", "delete", "append:2"])
})

test("interrupted post is refilled on the same page, not duplicated", async () => {
  const { api, log } = fakeApi({ failAppendOnce: true })
  const cache: PageCache = {}
  await assert.rejects(migratePost(deps(api, cache), planned), /network down/)
  assert.equal(cache["Java/a"].state, "creating")
  await migratePost(deps(api, cache), planned)
  assert.deepEqual(log, ["create:a", "update:page1", "delete", "append:2"])
  assert.equal(cache["Java/a"].state, "done")
})

test("notice callout is prepended when requested", async () => {
  const { api } = fakeApi()
  const appended: any[] = []
  api.blocks.children.append = async ({ children }: any) => {
    appended.push(...children)
    return { results: children.map((_: any, i: number) => ({ id: `x${i}` })) }
  }
  await migratePost(deps(api, {}, { withNotice: true }), planned)
  assert.equal(appended[0].type, "callout")
})
