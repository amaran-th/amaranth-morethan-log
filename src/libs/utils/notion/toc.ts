import type { ExtendedRecordMap } from "notion-types"

export type TocItem = { id: string; text: string; level: number }

const HEADING_LEVEL: Record<string, number> = { header: 0, sub_header: 1, sub_sub_header: 2 }
// Headings inside columns still belong to the page's outline.
const CONTAINERS = new Set(["column_list", "column"])

// Notion's CRDT v1 format nests block data one level deeper.
const blockOf = (recordMap: ExtendedRecordMap, id: string): any => {
  const entry = (recordMap.block[id] as any)?.value
  return entry?.value ?? entry
}

const titleOf = (block: any): string =>
  (block?.properties?.title ?? []).map((chunk: any[]) => chunk[0]).join("").trim()

// Headings of a page in reading order. `id` matches the anchor element
// react-notion-x renders for each heading (the block id without dashes).
export function buildToc(recordMap: ExtendedRecordMap, pageId: string): TocItem[] {
  const items: { id: string; text: string; raw: number }[] = []
  const walk = (ids: string[]) => {
    for (const id of ids) {
      const block = blockOf(recordMap, id)
      if (!block) continue
      if (block.type in HEADING_LEVEL) {
        const text = titleOf(block)
        if (text) items.push({ id: block.id.replace(/-/g, ""), text, raw: HEADING_LEVEL[block.type] })
      } else if (CONTAINERS.has(block.type)) {
        walk(block.content ?? [])
      }
    }
  }
  walk(blockOf(recordMap, pageId)?.content ?? [])
  const top = Math.min(...items.map((i) => i.raw))
  return items.map(({ id, text, raw }) => ({ id, text, level: raw - top }))
}
