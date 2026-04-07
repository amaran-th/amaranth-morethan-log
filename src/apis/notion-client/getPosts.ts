import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  const response = await api.getPage(id)
  id = idToUuid(id)

  // notion-client v6 doesn't support Notion's CRDT v1 block format, where block
  // data is nested under an extra .value layer. As a result, collection_query is
  // never populated. We detect this and manually query the collection.
  if (Object.keys(response.collection_query).length === 0) {
    const rootEntry = response.block[id] as any
    const rootBlock = rootEntry?.value?.value ?? rootEntry?.value
    const collectionId: string = rootBlock?.collection_id
    const viewIds: string[] = rootBlock?.view_ids ?? []
    for (const viewId of viewIds) {
      const viewEntry = (response.collection_view[viewId] as any)
      const viewData = viewEntry?.value?.value ?? viewEntry?.value
      try {
        const result = await (api as any).getCollectionData(collectionId, viewId, viewData)
        if (result?.recordMap?.block) Object.assign(response.block, result.recordMap.block)
        response.collection_query[collectionId] = {
          ...(response.collection_query[collectionId] ?? {}),
          [viewId]: result?.result?.reducerResults,
        }
      } catch (e) {
        console.warn("Failed to query collection:", e)
      }
    }
  }

  const collectionValue = Object.values(response.collection)[0]?.value as any
  const collection = collectionValue?.value ?? collectionValue
  const block = response.block
  const schema = collection?.schema

  const blockValue = (block[id].value as any)?.value ?? block[id].value
  const rawMetadata = blockValue

  // Check Type
  if (
    rawMetadata?.type !== "collection_view_page" &&
    rawMetadata?.type !== "collection_view"
  ) {
    return []
  } else {
    // Construct Data
    const pageIds = getAllPageIds(response)
    const data = []
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      const properties = (await getPageProperties(id, block, schema)) || null
      // Add fullwidth, createdtime to properties
      const pageBlockValue = (block[id].value as any)?.value ?? block[id].value
      properties.createdTime = new Date(
        pageBlockValue?.created_time
      ).toString()
      properties.fullWidth =
        (pageBlockValue?.format as any)?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    const posts = data as TPosts
    return posts
  }
}
