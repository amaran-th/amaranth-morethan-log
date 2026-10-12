import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { OLD_BLOG_URL, THUMBNAIL_FIXES } from "./config"

export type LegacyPost = {
  legacyPath: string
  dir: string
  title: string
  date: string
  description: string
  section: string
  category: string
  tags: string[]
  thumbnailImg?: string
  body: string
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function toKstDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`)
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

export function isExcluded(title: string): boolean {
  return (
    (title.includes("우테코 백엔드 5기") && title.includes("기록")) ||
    title.includes("작성중")
  )
}

function parseTags(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : []
  return list.map((t) => String(t).normalize("NFC").trim()).filter(Boolean)
}

const resolveThumbnail = (dir: string, src: string) => (/^https?:\/\//i.test(src) ? src : path.resolve(dir, src))

export function parseLegacyPost(contentRoot: string, file: string): LegacyPost {
  const { data, content } = matter(fs.readFileSync(file, "utf8"))
  const dir = path.dirname(file)
  const legacyPath = path
    .relative(contentRoot, dir)
    .split(path.sep)
    .join("/")
    .normalize("NFC")
  const thumbnail = THUMBNAIL_FIXES[legacyPath] ?? (data.thumbnailImg ? String(data.thumbnailImg) : undefined)
  const text = (v: unknown) => (v == null ? "" : String(v).normalize("NFC").trim())
  return {
    legacyPath,
    dir,
    title: text(data.title),
    date: toKstDate(data.date),
    description: text(data.description),
    section: text(data.section),
    category: text(data.category),
    tags: parseTags(data.tags),
    thumbnailImg: thumbnail ? resolveThumbnail(dir, thumbnail) : undefined,
    body: content,
  }
}

export function loadLegacyPosts(contentRoot: string): LegacyPost[] {
  const files = (fs.readdirSync(contentRoot, { recursive: true }) as string[])
    .filter((f) => path.basename(f) === "index.md")
    .map((f) => path.join(contentRoot, f))
  return files
    .map((f) => parseLegacyPost(contentRoot, f))
    .filter((p) => !isExcluded(p.title))
    .sort((a, b) => a.date.localeCompare(b.date) || a.legacyPath.localeCompare(b.legacyPath))
}

export const legacyUrl = (legacyPath: string) => `${OLD_BLOG_URL}/${legacyPath}/`
