import { test } from "node:test"
import assert from "node:assert/strict"
import { APIErrorCode, APIResponseError } from "@notionhq/client"
import { appendBlocks, clearChildren, createThrottle, isRetryable } from "./notion"

const noSleep = async () => {}
const para = (t: string, children?: any[]) => ({
  object: "block", type: "paragraph",
  paragraph: { rich_text: [{ type: "text", text: { content: t } }], ...(children ? { children } : {}) },
})
const rateLimited = () =>
  new APIResponseError({ code: APIErrorCode.RateLimited, status: 429, message: "slow down", headers: {}, rawBodyText: "" } as any)

function fakeApi() {
  const calls: { parent: string; children: any[] }[] = []
  let id = 0
  const api: any = {
    blocks: {
      children: {
        append: async ({ block_id, children }: any) => {
          calls.push({ parent: block_id, children })
          return { results: children.map(() => ({ id: `b${id++}` })) }
        },
        list: async () => ({ results: [{ id: "old1" }, { id: "old2" }], has_more: false, next_cursor: null }),
      },
      delete: async ({ block_id }: any) => { calls.push({ parent: `delete:${block_id}`, children: [] }) },
    },
  }
  return { api, calls }
}

test("throttle retries rate-limited calls then succeeds", async () => {
  const run = createThrottle({ minIntervalMs: 0, sleep: noSleep })
  let attempts = 0
  const value = await run(async () => {
    if (++attempts < 3) throw rateLimited()
    return "ok"
  })
  assert.equal(value, "ok")
  assert.equal(attempts, 3)
})

test("throttle does not retry validation errors", async () => {
  const run = createThrottle({ minIntervalMs: 0, sleep: noSleep })
  let attempts = 0
  const err = new APIResponseError({ code: APIErrorCode.ValidationError, status: 400, message: "bad", headers: {}, rawBodyText: "" } as any)
  await assert.rejects(run(async () => { attempts++; throw err }))
  assert.equal(attempts, 1)
  assert.equal(isRetryable(err), false)
})

test("appendBlocks sends chunks of 100 and nests children in later calls", async () => {
  const { api, calls } = fakeApi()
  const run = createThrottle({ minIntervalMs: 0, sleep: noSleep })
  const blocks = Array.from({ length: 150 }, (_, i) => para(`p${i}`))
  blocks[120] = para("parent", [para("child", [para("grandchild")])])
  await appendBlocks(api, run, "page", blocks)
  assert.equal(calls[0].parent, "page")
  assert.equal(calls[0].children.length, 100)
  assert.equal(calls[1].children.length, 50)
  assert.equal(calls[1].children[20].paragraph.children, undefined)
  assert.equal(calls[2].parent, "b120")
  assert.equal(calls[2].children[0].paragraph.children, undefined)
  assert.equal(calls[3].parent, "b150")
  assert.equal(calls.length, 4)
})

test("appendBlocks keeps table rows inline", async () => {
  const { api, calls } = fakeApi()
  const table = { object: "block", type: "table", table: { table_width: 1, has_column_header: true, has_row_header: false, children: [{ type: "table_row", table_row: { cells: [[]] } }] } }
  await appendBlocks(api, createThrottle({ minIntervalMs: 0, sleep: noSleep }), "page", [table])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].children[0].table.children.length, 1)
})

test("clearChildren deletes every child block", async () => {
  const { api, calls } = fakeApi()
  await clearChildren(api, createThrottle({ minIntervalMs: 0, sleep: noSleep }), "page")
  assert.deepEqual(calls.map((c) => c.parent), ["delete:old1", "delete:old2"])
})
