import { normalizeCodeFences } from "./codeLanguage"

export type ImageSource = { kind: "local"; src: string } | { kind: "remote"; url: string }

// martian only emits image blocks for URLs that look like images, so the
// sentinel needs a real-looking host and an image extension.
export const IMAGE_SENTINEL_PREFIX = "https://migrate.example.com/img/"

// Notion exports callouts as <aside>; CommonMark treats the first paragraph
// after <aside> as raw HTML and martian drops it. Markers survive conversion
// as plain paragraphs and postprocessBlocks (blocks.ts) folds them into callouts.
export const CALLOUT_OPEN = "MIGRATE_CALLOUT_OPEN"
export const CALLOUT_CLOSE = "MIGRATE_CALLOUT_CLOSE"
// martian drops thematic breaks; this marker becomes a divider block.
export const DIVIDER = "MIGRATE_DIVIDER"

const FENCE_LINE = /^[ \t]*(`{3,}|~{3,})/
const ASIDE_LINE = /^([ \t]*)(<aside>)?(.*?)(<\/aside>)?[ \t]*$/i

const THEMATIC_BREAK = /^([ \t]*)(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/

// Line pass over prose (fenced code is skipped) that turns <aside> into callout
// markers and thematic breaks into divider markers. A "---" right under a text
// line is a setext heading underline, not a break, so it is left alone.
function convertBlockMarkers(md: string): string {
  let fence: string | undefined
  const lines = md.split("\n")
  return lines
    .map((line, i) => {
      const marker = line.match(FENCE_LINE)?.[1]
      if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
        fence = fence ? undefined : marker
        return line
      }
      if (fence) return line
      const rule = line.match(THEMATIC_BREAK)
      if (rule && (!line.includes("-") || i === 0 || lines[i - 1].trim() === "")) {
        return `\n${rule[1]}${DIVIDER}\n`
      }
      const m = line.match(ASIDE_LINE)
      if (!m || (!m[2] && !m[4])) return line
      const [, indent, open, body, close] = m
      const pieces = [open && CALLOUT_OPEN, body.trim(), close && CALLOUT_CLOSE].filter(Boolean)
      return `\n${pieces.map((piece) => indent + piece).join("\n\n")}\n`
    })
    .join("\n")
}

const FENCE = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[ \t]*$/gm
const INLINE_CODE = /(`+)[^`\n]+?\1/g
const MD_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g
const HTML_IMG = /<img\b[^>]*>/gi
const LAYOUT_TAGS = /<\/?(div|span|p|center|font|section|article|figure|figcaption|nav|a\s+name=[^>]*)\b[^>]*>/gi
const BOLD_TAG = /<\/?(?:b|strong)>/gi
// Anything still shaped like a tag would be raw HTML to martian, which drops it
// (e.g. "List<Student>"); escape it so it stays as text. Autolinks such as
// <https://…> are left alone.
const TAG_LIKE = /(?<![\\`])<(\/?[A-Za-z][\w-]*)(?![\w-]*:)([^<>\n]*)>/g
const COMMENT = /<!--[\s\S]*?-->/g

function attr(tag: string, name: string): string {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? ""
}

export const imageSource = (src: string): ImageSource =>
  /^https?:\/\//i.test(src) ? { kind: "remote", url: src } : { kind: "local", src }

function transformText(text: string, images: ImageSource[], escapedHtml: string[]): string {
  const register = (alt: string, src: string) => {
    images.push(imageSource(src))
    return `![${alt}](${IMAGE_SENTINEL_PREFIX}${images.length - 1}.png)`
  }
  return text
    .replace(COMMENT, "")
    // A src-less tag is prose naming the tag ("<img> 태그"), not an image.
    .replace(HTML_IMG, (tag) => (attr(tag, "src") ? register(attr(tag, "alt"), attr(tag, "src")) : `\`${tag}\``))
    .replace(MD_IMAGE, (whole, alt: string, src: string) =>
      src.startsWith(IMAGE_SENTINEL_PREFIX) ? whole : register(alt, src)
    )
    .split("\n")
    .map((line) =>
      line.replace(/<\/?br\s*\/?>/gi, line.trimStart().startsWith("|") ? " " : "\n")
    )
    .join("\n")
    .replace(LAYOUT_TAGS, "")
    .replace(BOLD_TAG, "**")
    .replace(TAG_LIKE, (tag, name: string, rest: string) => {
      escapedHtml.push(tag)
      return `\\<${name}${rest}>`
    })
}

function mapOutside(text: string, pattern: RegExp, fn: (chunk: string) => string): string {
  let out = ""
  let last = 0
  for (const m of text.matchAll(pattern)) {
    out += fn(text.slice(last, m.index)) + m[0]
    last = m.index! + m[0].length
  }
  return out + fn(text.slice(last))
}

const IMAGE_ONLY_LINE = new RegExp(`^\\s*!\\[[^\\]]*\\]\\(${IMAGE_SENTINEL_PREFIX.replace(/[.]/g, "\\.")}\\d+\\.png\\)\\s*$`)

function separateImageLines(text: string): string {
  const lines = text.split("\n")
  return lines
    .map((line, i) => (i > 0 && IMAGE_ONLY_LINE.test(line) && lines[i - 1].trim() !== "" ? `\n${line}` : line))
    .join("\n")
}

export function preprocessMarkdown(md: string): { markdown: string; images: ImageSource[]; escapedHtml: string[] } {
  const images: ImageSource[] = []
  const escapedHtml: string[] = []
  const transformed = mapOutside(convertBlockMarkers(normalizeCodeFences(md)), FENCE, (prose) =>
    mapOutside(prose, INLINE_CODE, (text) => transformText(text, images, escapedHtml))
  )
  // Sentinels only exist outside code, so a second pass over prose is safe.
  const markdown = mapOutside(transformed, FENCE, separateImageLines)
  return { markdown, images, escapedHtml }
}
