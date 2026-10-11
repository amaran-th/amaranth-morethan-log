import { markdownToBlocks } from "@tryfabric/martian"
import { IMAGE_SENTINEL_PREFIX } from "./markdown"
import { OLD_BLOG_URL } from "./config"

export type Block = { type: string; [key: string]: any }

const plain = (content: string, link?: string) => ({
  type: "text",
  text: link ? { content, link: { url: link } } : { content },
})

export function markdownToNotionBlocks(markdown: string): Block[] {
  // Chunking to Notion's limits happens when appending (notion.ts), so never
  // let martian silently drop content.
  return markdownToBlocks(markdown, {
    strictImageUrls: false,
    notionLimits: { truncate: false },
  }) as Block[]
}

export const uploadedImageBlock = (fileUploadId: string): Block => ({
  object: "block",
  type: "image",
  image: { type: "file_upload", file_upload: { id: fileUploadId } },
})

export const missingImageBlock = (label: string): Block => ({
  object: "block",
  type: "paragraph",
  paragraph: { rich_text: [plain(`[이미지 누락: ${label}]`)] },
})

export const noticeCallout = (): Block => ({
  object: "block",
  type: "callout",
  callout: {
    icon: { type: "emoji", emoji: "📌" },
    rich_text: [
      plain("이 글은 이전 블로그(Gatsby)를 만들던 당시 작성한 글입니다. → "),
      plain("이전 블로그", OLD_BLOG_URL),
    ],
  },
})

function sentinelIndex(block: Block): number | undefined {
  const url: string | undefined = block.type === "image" ? block.image?.external?.url : undefined
  if (!url?.startsWith(IMAGE_SENTINEL_PREFIX)) return undefined
  return Number(url.slice(IMAGE_SENTINEL_PREFIX.length).replace(/\.png$/, ""))
}

// martian emits quotes as an empty text head plus paragraph children, which
// renders as a blank quote line; lift the first paragraph into the head.
function liftQuoteHead(block: Block): Block {
  const quote = block.quote
  const [first, ...rest] = quote.children ?? []
  const headIsEmpty = (quote.rich_text ?? []).every((r: any) => !r.text?.content)
  if (!headIsEmpty || first?.type !== "paragraph") return block
  return { ...block, quote: { ...quote, rich_text: first.paragraph.rich_text, children: rest } }
}

export async function postprocessBlocks(
  blocks: Block[],
  resolveImage: (index: number) => Promise<Block>
): Promise<Block[]> {
  const out: Block[] = []
  for (const original of blocks) {
    const index = sentinelIndex(original)
    if (index !== undefined) {
      out.push(await resolveImage(index))
      continue
    }
    let block = original.type === "quote" ? liftQuoteHead(original) : original
    const children = block[block.type]?.children
    if (Array.isArray(children) && children.length && block.type !== "table") {
      block = { ...block, [block.type]: { ...block[block.type], children: await postprocessBlocks(children, resolveImage) } }
    }
    out.push(block)
  }
  return out
}
