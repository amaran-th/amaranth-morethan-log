import { test } from "node:test"
import assert from "node:assert/strict"
import { IMAGE_SENTINEL_PREFIX, preprocessMarkdown } from "./markdown"

const S = (n: number) => `${IMAGE_SENTINEL_PREFIX}${n}.png`

test("markdown images become sentinels with recorded sources", () => {
  const { markdown, images } = preprocessMarkdown(
    `a ![x](data_sql.png) b\n\n![y](https://i.imgur.com/0F1Xg65.png "t")\n\n![z](./dir/c.jpg)`
  )
  assert.equal(markdown, `a ![x](${S(0)}) b\n\n![y](${S(1)})\n\n![z](${S(2)})`)
  assert.deepEqual(images, [
    { kind: "local", src: "data_sql.png" },
    { kind: "remote", url: "https://i.imgur.com/0F1Xg65.png" },
    { kind: "local", src: "./dir/c.jpg" },
  ])
})

test("html img tags become markdown images", () => {
  const { markdown, images } = preprocessMarkdown(`<img src="a.png" width="300"/>\n<img alt="b" src='https://x.com/b.gif'>`)
  assert.equal(markdown, `![](${S(0)})\n\n![b](${S(1)})`)
  assert.deepEqual(images, [
    { kind: "local", src: "a.png" },
    { kind: "remote", url: "https://x.com/b.gif" },
  ])
})

test("image-only lines are split from the line above so lists keep them", () => {
  // martian silently drops an image that continues a list item without a blank line
  // (148 such lines in the legacy blog); a blank line makes it a child block instead.
  assert.equal(preprocessMarkdown("1. item\n   ![b](b.png)").markdown, `1. item\n\n   ![b](${S(0)})`)
  assert.equal(preprocessMarkdown("text\n\n![b](b.png)").markdown, `text\n\n![b](${S(0)})`)
})

test("br becomes a newline, br inside table rows becomes a space", () => {
  assert.equal(preprocessMarkdown("a<br/>b<br>c").markdown, "a\nb\nc")
  assert.equal(preprocessMarkdown("| a<br/>b | c |").markdown, "| a b | c |")
})

test("layout html tags are unwrapped and comments removed", () => {
  assert.equal(
    preprocessMarkdown(`<div align="center">\n\n**hi**\n\n</div>\n<span style="x">t</span><!-- note -->`).markdown,
    "\n\n**hi**\n\n\nt"
  )
})

test("fenced and inline code are left untouched", () => {
  const md = "```html\n<div><br/>![a](b.png)</div>\n```\n`<br/>` and `![a](b.png)`\n~~~\n<span>$x$</span>\n~~~"
  const { markdown, images } = preprocessMarkdown(md)
  assert.equal(markdown, md)
  assert.deepEqual(images, [])
})
