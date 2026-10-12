import { test } from "node:test"
import assert from "node:assert/strict"
import { VIEW_MODES, parseViewMode } from "./viewMode"

test("parseViewMode accepts only known modes and falls back to feed", () => {
  assert.deepEqual(VIEW_MODES, ["feed", "list", "gallery"])
  assert.equal(parseViewMode("gallery"), "gallery")
  assert.equal(parseViewMode("list"), "list")
  for (const bad of [null, "", "grid", "LIST"]) assert.equal(parseViewMode(bad), "feed")
})
