import { markdownToBlocks } from "@tryfabric/martian"
import { CALLOUT_CLOSE, CALLOUT_OPEN, IMAGE_SENTINEL_PREFIX } from "./markdown"
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

const markerOf = (block: Block): string | undefined => {
  if (block.type !== "paragraph") return undefined
  const content = (block.paragraph.rich_text ?? []).map((r: any) => r.text?.content ?? "").join("").trim()
  return content === CALLOUT_OPEN || content === CALLOUT_CLOSE ? content : undefined
}

const LEADING_EMOJI = /^\s*(\p{Extended_Pictographic}\uFE0F?)\s*/u

// The first paragraph becomes the callout's text, minus a leading emoji that
// Notion's export kept as plain text; without one, Notion's default 💡 is used.
function toCallout(body: Block[]): Block {
  let [first, ...rest] = body
  let icon = "💡"
  let richText: any[] = []
  if (first?.type === "paragraph") {
    richText = [...(first.paragraph.rich_text ?? [])]
    const head = richText[0]?.text?.content as string | undefined
    const emoji = head?.match(LEADING_EMOJI)
    if (emoji) {
      // Notion rejects bare text-style symbols such as "⚠" as icons.
      icon = /\p{Emoji_Presentation}|\uFE0F/u.test(emoji[1]) ? emoji[1] : `${emoji[1]}\uFE0F`
      richText[0] = { ...richText[0], text: { ...richText[0].text, content: head!.slice(emoji[0].length) } }
      if (!richText[0].text.content) richText.shift()
    }
    rest = [...(first.paragraph.children ?? []), ...rest]
  } else if (first) {
    rest = body
  }
  return {
    object: "block",
    type: "callout",
    callout: { icon: { type: "emoji", emoji: icon }, rich_text: richText, ...(rest.length ? { children: rest } : {}) },
  }
}

// Folds marker paragraphs at one nesting level into callouts. An open marker
// without its close wraps the rest of the level; a stray close is dropped.
function foldCallouts(blocks: Block[]): Block[] {
  const out: Block[] = []
  const stack: Block[][] = []
  for (const block of blocks) {
    const marker = markerOf(block)
    if (marker === CALLOUT_OPEN) stack.push([])
    else if (marker === CALLOUT_CLOSE) {
      const body = stack.pop()
      if (body) (stack.at(-1) ?? out).push(toCallout(body))
    } else (stack.at(-1) ?? out).push(block)
  }
  while (stack.length) {
    const callout = toCallout(stack.pop()!)
    ;(stack.at(-1) ?? out).push(callout)
  }
  return out
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
  return foldCallouts(out)
}
