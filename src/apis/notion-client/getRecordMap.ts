import { NotionAPI } from "notion-client"
import { getPageContentBlockIds } from "notion-utils"

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)

  // notion-client skips "attachment:uuid:filename" URLs when signing.
  // For video/audio blocks these URLs are used directly by the browser,
  // so replace them with a proxy URL that fetches a fresh signed URL on each request.
  const blockIds = getPageContentBlockIds(recordMap)
  blockIds.forEach((id) => {
    const block = recordMap.block[id]?.value
    if (!block || !["video", "audio"].includes(block.type)) return
    if (recordMap.signed_urls[id]) return // already signed by notion-client

    const source = block.properties?.source?.[0]?.[0]
    if (!source || !source.startsWith("attachment:")) return

    recordMap.signed_urls[id] = `/api/notion-file?blockId=${id}&url=${encodeURIComponent(source)}`
  })

  return recordMap
}
