export type ImageSource = { kind: "local"; src: string } | { kind: "remote"; url: string }

// martian only emits image blocks for URLs that look like images, so the
// sentinel needs a real-looking host and an image extension.
export const IMAGE_SENTINEL_PREFIX = "https://migrate.example.com/img/"

const FENCE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm
const INLINE_CODE = /(`+)[^`\n]+?\1/g
const MD_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g
const HTML_IMG = /<img\b[^>]*>/gi
const LAYOUT_TAGS = /<\/?(div|span|p|center|font|section|article|figure|figcaption|a\s+name=[^>]*)\b[^>]*>/gi
const COMMENT = /<!--[\s\S]*?-->/g

function attr(tag: string, name: string): string {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? ""
}

function transformText(text: string, images: ImageSource[]): string {
  const register = (alt: string, src: string) => {
    images.push(/^https?:\/\//i.test(src) ? { kind: "remote", url: src } : { kind: "local", src })
    return `![${alt}](${IMAGE_SENTINEL_PREFIX}${images.length - 1}.png)`
  }
  return text
    .replace(COMMENT, "")
    .replace(HTML_IMG, (tag) => register(attr(tag, "alt"), attr(tag, "src")))
    .replace(MD_IMAGE, (whole, alt: string, src: string) =>
      src.startsWith(IMAGE_SENTINEL_PREFIX) ? whole : register(alt, src)
    )
    .split("\n")
    .map((line) =>
      line.replace(/<br\s*\/?>/gi, line.trimStart().startsWith("|") ? " " : "\n")
    )
    .join("\n")
    .replace(LAYOUT_TAGS, "")
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

export function preprocessMarkdown(md: string): { markdown: string; images: ImageSource[] } {
  const images: ImageSource[] = []
  const transformed = mapOutside(md, FENCE, (prose) =>
    mapOutside(prose, INLINE_CODE, (text) => transformText(text, images))
  )
  // Sentinels only exist outside code, so a second pass over prose is safe.
  const markdown = mapOutside(transformed, FENCE, separateImageLines)
  return { markdown, images }
}
