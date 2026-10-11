import { test } from "node:test"
import assert from "node:assert/strict"
import { IMAGE_SENTINEL_PREFIX } from "./markdown"
import {
  markdownToNotionBlocks, missingImageBlock, noticeCallout, postprocessBlocks, uploadedImageBlock,
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
