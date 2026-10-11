import fs from "node:fs"
import path from "node:path"
import type { ImageSource } from "./markdown"

export type LoadedFile = { filename: string; contentType: string; data: Buffer }

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
}
const EXT_BY_TYPE = Object.fromEntries(Object.entries(TYPES).map(([e, t]) => [t, e]))

export function resolveLocalFile(dir: string, src: string): string | undefined {
  let decoded = src
  try { decoded = decodeURIComponent(src) } catch {}
  for (const candidate of [src, decoded]) {
    const full = path.resolve(dir, candidate)
    if (fs.existsSync(full)) return full
    const parent = path.dirname(full)
    if (!fs.existsSync(parent)) continue
    const wanted = path.basename(full).normalize("NFC")
    const match = fs.readdirSync(parent).find((f) => f.normalize("NFC") === wanted)
    if (match) return path.join(parent, match)
  }
  return undefined
}

export async function loadImage(source: ImageSource, dir: string, fetchFn: typeof fetch = fetch): Promise<LoadedFile> {
  if (source.kind === "local") {
    const file = resolveLocalFile(dir, source.src)
    if (!file) throw new Error(`Local image not found: ${source.src}`)
    const contentType = TYPES[path.extname(file).toLowerCase()]
    if (!contentType) throw new Error(`Unsupported image type: ${file}`)
    return { filename: path.basename(file).normalize("NFC"), contentType, data: fs.readFileSync(file) }
  }
  const res = await fetchFn(source.url, {
    headers: { "User-Agent": "Mozilla/5.0 (legacy-blog-migration)" },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${source.url}`)
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim()
  if (!contentType.startsWith("image/")) throw new Error(`Remote file is not an image (${contentType}): ${source.url}`)
  const base = path.basename(new URL(source.url).pathname) || "image"
  const filename = path.extname(base) ? base : `${base}${EXT_BY_TYPE[contentType] ?? ""}`
  return { filename, contentType, data: Buffer.from(await res.arrayBuffer()) }
}
