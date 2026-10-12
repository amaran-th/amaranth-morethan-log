import { test } from "node:test"
import assert from "node:assert/strict"
import { CALLOUT_CLOSE, CALLOUT_OPEN, IMAGE_SENTINEL_PREFIX, preprocessMarkdown } from "./markdown"
import {
  Block, markdownToNotionBlocks, missingImageBlock, noticeCallout, postprocessBlocks, uploadedImageBlock,
} from "./blocks"

const text = (rt: any[]) => rt.map((r) => r.text?.content ?? "").join("")

test("sentinel images are replaced by resolved blocks, in order", async () => {
  const blocks = markdownToNotionBlocks(`para\n\n![a](${IMAGE_SENTINEL_PREFIX}0.png)\n\n- item\n\n  ![b](${IMAGE_SENTINEL_PREFIX}1.png)`)
  const seen: number[] = []
  const out = await postprocessBlocks(blocks, async (i) => {
    seen.push(i)
    return i === 0 ? uploadedImageBlock("fu_0") : missingImageBlock("b.png")
  })
  assert.deepEqual(seen, [0, 1])
  const flat = JSON.stringify(out)
  assert.ok(!flat.includes(IMAGE_SENTINEL_PREFIX))
  assert.ok(flat.includes('"file_upload":{"id":"fu_0"}'))
  assert.ok(flat.includes("[이미지 누락: b.png]"))
})

test("non-sentinel external images are kept", async () => {
  const out = await postprocessBlocks(markdownToNotionBlocks("![a](https://i.imgur.com/x.png)"), async () => {
    throw new Error("should not resolve")
  })
  assert.equal(out[0].type, "image")
})

test("quotes with an empty head lift their first paragraph", async () => {
  const [quote] = await postprocessBlocks(markdownToNotionBlocks("> first\n>\n> second"), async () => missingImageBlock(""))
  assert.equal(quote.type, "quote")
  assert.equal(text(quote.quote.rich_text), "first")
  assert.equal(quote.quote.children.length, 1)
  assert.equal(text(quote.quote.children[0].paragraph.rich_text), "second")
})

test("long code and many blocks are not truncated", () => {
  const code = "x".repeat(4500)
  const [block] = markdownToNotionBlocks("```java\n" + code + "\n```")
  assert.equal(block.code.language, "java")
  assert.equal(text(block.code.rich_text), code)
  assert.ok(block.code.rich_text.every((r: any) => r.text.content.length <= 2000))
  const many = Array.from({ length: 150 }, (_, i) => `- i${i}`).join("\n")
  assert.equal(markdownToNotionBlocks(many).length, 150)
})

test("tables, equations, mermaid and h4 convert", () => {
  const blocks = markdownToNotionBlocks("#### h4\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n$$\ny=1\n$$\n\n```mermaid\ngraph TD\n```")
  assert.deepEqual(blocks.map((b) => b.type), ["heading_3", "table", "equation", "code"])
  assert.equal(blocks[3].code.language, "mermaid")
})

test("notice callout links the old blog", () => {
  const block = noticeCallout()
  assert.equal(block.type, "callout")
  assert.equal(block.callout.icon.emoji, "📌")
  assert.equal(text(block.callout.rich_text), "이 글은 이전 블로그(Gatsby)를 만들던 당시 작성한 글입니다. → 이전 블로그")
  assert.equal(block.callout.rich_text[1].text.link.url, "https://amaran-th.github.io")
})

const noImages = async () => {
  throw new Error("no images")
}

test("aside markers become a callout with the leading emoji as icon", async () => {
  const md = preprocessMarkdown("before\n\n<aside>\n⚠️ 첫 문단\n\n```java\nany()\n```\n\n둘째\n</aside>\n\nafter").markdown
  const out = await postprocessBlocks(markdownToNotionBlocks(md), noImages)
  assert.deepEqual(out.map((b) => b.type), ["paragraph", "callout", "paragraph"])
  const callout = out[1].callout
  assert.deepEqual(callout.icon, { type: "emoji", emoji: "⚠️" })
  assert.equal(text(callout.rich_text), "첫 문단")
  assert.deepEqual(callout.children.map((b: Block) => b.type), ["code", "paragraph"])
})

test("a callout without a leading emoji gets the notion default icon", async () => {
  const md = preprocessMarkdown("<aside>\n\n```java\nx\n```\n</aside>").markdown
  const [callout] = await postprocessBlocks(markdownToNotionBlocks(md), noImages)
  assert.equal(callout.type, "callout")
  assert.deepEqual(callout.callout.icon, { type: "emoji", emoji: "💡" })
  assert.deepEqual(callout.callout.rich_text, [])
  assert.equal(callout.callout.children[0].type, "code")
})

test("asides inside list items become callouts inside the item", async () => {
  const md = preprocessMarkdown("- item\n\n    <aside>\n    💡 tip\n    </aside>\n\n- next").markdown
  const out = await postprocessBlocks(markdownToNotionBlocks(md), noImages)
  assert.equal(out.length, 2)
  const [child] = out[0].bulleted_list_item.children
  assert.equal(child.type, "callout")
  assert.equal(text(child.callout.rich_text), "tip")
})

test("unmatched markers never leak into the page", async () => {
  const md = `a\n\n${CALLOUT_CLOSE}\n\n${CALLOUT_OPEN}\n\nb`
  const out = await postprocessBlocks(markdownToNotionBlocks(md), noImages)
  assert.ok(!JSON.stringify(out).includes("MIGRATE_CALLOUT"))
  assert.deepEqual(out.map((b) => b.type), ["paragraph", "callout"])
})

test("text-style symbols get the emoji variation selector notion expects", async () => {
  const md = preprocessMarkdown("<aside>\n⚠ 경고\n</aside>\n\n<aside>\n↔**bold**\n</aside>").markdown
  const out = await postprocessBlocks(markdownToNotionBlocks(md), noImages)
  assert.deepEqual(out.map((b) => b.callout.icon.emoji), ["⚠️", "↔️"])
  assert.equal(text(out[1].callout.rich_text), "bold")
})
