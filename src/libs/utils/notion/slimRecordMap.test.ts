import { test } from "node:test"
import assert from "node:assert/strict"
import { slimRecordMap } from "./slimRecordMap"

const fullBlock = {
  id: "b1",
  type: "text",
  properties: { title: [["hello"]] },
  format: { block_color: "gray" },
  content: ["c1"],
  parent_id: "p1",
  parent_table: "block",
  space_id: "s1",
  created_time: 1,
  crdt_data: { title: { huge: "copy of the text" } },
  crdt_format_version: 1,
  nav_parent_id: "p1",
  nav_parent_table: "block",
  last_edited_time: 2,
}
const kept = {
  id: "b1",
  type: "text",
  properties: { title: [["hello"]] },
  format: { block_color: "gray" },
  content: ["c1"],
  parent_id: "p1",
  parent_table: "block",
  space_id: "s1",
  created_time: 1,
}

test("slimRecordMap drops Notion's editing data from plain and CRDT v1 blocks", () => {
  const recordMap: any = {
    block: {
      b1: { role: "reader", value: { ...fullBlock } },
      b2: { spaceId: "s1", value: { value: { ...fullBlock, id: "b2" }, role: "reader" } },
    },
    collection: { c: { value: { name: "db" } } },
    automation: { a: { value: {} } },
    automation_action: { x: { value: {} } },
    notion_user: {},
  }
  const slim: any = slimRecordMap(recordMap)
  assert.deepEqual(slim.block.b1, { role: "reader", value: kept })
  assert.deepEqual(slim.block.b2, { spaceId: "s1", value: { value: { ...kept, id: "b2" }, role: "reader" } })
  assert.deepEqual(slim.collection, recordMap.collection)
  assert.equal("automation" in slim, false)
  assert.equal("automation_action" in slim, false)
  // the input is left untouched
  assert.ok(recordMap.block.b1.value.crdt_data)
})
