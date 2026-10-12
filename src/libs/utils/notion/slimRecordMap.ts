import type { ExtendedRecordMap } from "notion-types"

// Fields Notion keeps for collaborative editing and navigation that the
// renderer never reads. crdt_data alone repeats every block's text and was
// over half of a post page's data.
const DROPPED_BLOCK_FIELDS = [
  "crdt_data",
  "crdt_format_version",
  "nav_parent_id",
  "nav_parent_table",
  "last_edited_time",
]
const DROPPED_TABLES = ["automation", "automation_action"]

const slimBlock = (block: Record<string, unknown>) => {
  const copy = { ...block }
  for (const field of DROPPED_BLOCK_FIELDS) delete copy[field]
  return copy
}

// Returns a copy of the record map with only what react-notion-x renders.
// Handles both block shapes: { value } and the CRDT v1 { value: { value } }.
export function slimRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  const block: Record<string, any> = {}
  for (const [id, entry] of Object.entries(recordMap.block as Record<string, any>)) {
    const outer = entry?.value
    block[id] =
      outer && typeof outer === "object" && "value" in outer && typeof outer.value === "object"
        ? { ...entry, value: { ...outer, value: slimBlock(outer.value) } }
        : { ...entry, value: outer ? slimBlock(outer) : outer }
  }
  const slim: Record<string, unknown> = { ...recordMap, block }
  for (const table of DROPPED_TABLES) delete slim[table]
  return slim as unknown as ExtendedRecordMap
}
