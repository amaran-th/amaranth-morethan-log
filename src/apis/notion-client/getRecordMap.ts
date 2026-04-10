import { NotionAPI } from "notion-client"
import { getPageContentBlockIds } from "notion-utils"

// Flatten CRDT v1 block format: newer Notion API wraps block data under an
// extra .value layer ({ value: actualBlock }). react-notion-x v6 doesn't
// handle this, so we flatten before passing to the renderer.
function normalizeBlocks(recordMap: any) {
  for (const id of Object.keys(recordMap.block)) {
    const entry = recordMap.block[id] as any
    if (entry?.value?.value) {
      entry.value = entry.value.value
    }
  }
}

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)

  // Step 1: normalize all already-fetched blocks
  normalizeBlocks(recordMap)

  // Step 2: notion-client's internal fetchMissingBlocks loop ran before
  // normalization, so getPageContentBlockIds couldn't traverse children in
  // CRDT v1 format. Now that blocks are normalized, fetch any that are
  // referenced in content arrays but not yet in recordMap.block.
  for (;;) {
    const allIds = getPageContentBlockIds(recordMap)
    const missingIds = allIds.filter((id) => !recordMap.block[id])
    if (!missingIds.length) break

    const result = await (api as any).getBlocks(missingIds)
    const newBlocks = result?.recordMap?.block ?? {}
    Object.assign(recordMap.block, newBlocks)
    normalizeBlocks(recordMap)
  }

  // Step 3: re-run URL signing now that blocks are in the correct format.
  // notion-client's internal addSignedUrls ran before normalization and
  // produced no results because block.value.type was undefined in CRDT v1.
  await (api as any).addSignedUrls({
    recordMap,
    contentBlockIds: getPageContentBlockIds(recordMap),
  })

  // Step 4: for video/audio blocks with "attachment:uuid:filename" URLs that
  // notion-client skips signing, replace with a proxy URL so the browser can
  // fetch a fresh signed URL on each request.
  const blockIds = getPageContentBlockIds(recordMap)
  blockIds.forEach((id) => {
    const block = recordMap.block[id]?.value
    if (!block || !["video", "audio"].includes(block.type)) return
    if (recordMap.signed_urls[id]) return // already signed

    const source = block.properties?.source?.[0]?.[0]
    if (!source || !source.startsWith("attachment:")) return

    recordMap.signed_urls[id] = `/api/notion-file?blockId=${id}&url=${encodeURIComponent(source)}`
  })

  return recordMap
}
