import type { ExtendedRecordMap } from "notion-types"

// Blocks whose text reads as prose; headings, code and media are skipped.
const TEXT_TYPES = new Set(["text", "bulleted_list", "numbered_list", "quote", "callout", "toggle", "to_do"])
const CONTAINERS = new Set(["column_list", "column"])
// A summary shorter than this ("우테코 6주차 기술 부채") says little in search results.
const MIN_SUMMARY_LENGTH = 15

const blockOf = (recordMap: ExtendedRecordMap, id: string): any => {
  const entry = (recordMap.block[id] as any)?.value
  return entry?.value ?? entry
}

const textOf = (block: any): string =>
  (block?.properties?.title ?? []).map((chunk: any[]) => chunk[0]).join("").replace(/\s+/g, " ").trim()

// The opening prose of a page, at most maxLength characters, cut at a word
// boundary with "…" when shortened. Used as a fallback meta description.
export function buildExcerpt(recordMap: ExtendedRecordMap, pageId: string, maxLength = 150): string {
  const parts: string[] = []
  let length = 0
  const walk = (ids: string[]) => {
    for (const id of ids) {
      if (length > maxLength) return
      const block = blockOf(recordMap, id)
      if (!block) continue
      if (TEXT_TYPES.has(block.type)) {
        const text = textOf(block)
        if (text) {
          parts.push(text)
          length += text.length + 1
        }
      } else if (CONTAINERS.has(block.type)) {
        walk(block.content ?? [])
      }
    }
  }
  walk(blockOf(recordMap, pageId)?.content ?? [])
  const text = parts.join(" ")
  if (text.length <= maxLength) return text
  let cut = text.slice(0, maxLength - 1)
  if (text[maxLength - 1] !== " ") cut = cut.slice(0, Math.max(cut.lastIndexOf(" "), 0))
  return `${cut.trim()}…`
}

// Meta description: the post's own summary when it says enough, otherwise
// the summary extended (or replaced) by the opening of the post.
export function pickDescription(summary: string | undefined, excerpt: string): string {
  const own = summary?.trim() ?? ""
  if (own.length >= MIN_SUMMARY_LENGTH) return own
  if (!own) return excerpt
  return excerpt ? `${own} - ${excerpt}` : own
}
