import { test } from "node:test"
import assert from "node:assert/strict"
import { buildToc } from "./toc"

const block = (id: string, type: string, title?: string, content?: string[]) => ({
  value: { id, type, ...(title ? { properties: { title: [[title]] } } : {}), ...(content ? { content } : {}) },
})
const nested = (b: ReturnType<typeof block>) => ({ value: b }) // CRDT v1: { value: { value } }

test("buildToc lists headings in page order with levels starting at 0", () => {
  const recordMap: any = {
    block: {
      "page-1": block("page-1", "page", "Post", ["h-1", "p-1", "cl-1", "h-3"]),
      "h-1": block("h-1", "sub_header", "Intro"),
      "p-1": block("p-1", "text", "body"),
      "cl-1": block("cl-1", "column_list", undefined, ["c-1"]),
      "c-1": block("c-1", "column", undefined, ["h-2"]),
      "h-2": nested(block("h-2", "sub_sub_header", "In a column")),
      "h-3": block("h-3", "sub_header", "End"),
    },
  }
  assert.deepEqual(buildToc(recordMap, "page-1"), [
    { id: "h1", text: "Intro", level: 0 },
    { id: "h2", text: "In a column", level: 1 },
    { id: "h3", text: "End", level: 0 },
  ])
})

test("buildToc returns nothing for a page without headings or blocks", () => {
  assert.deepEqual(buildToc({ block: {} } as any, "missing"), [])
  const recordMap: any = { block: { p: block("p", "page", "x", ["t"]), t: block("t", "text", "only text") } }
  assert.deepEqual(buildToc(recordMap, "p"), [])
})
