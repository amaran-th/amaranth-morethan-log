import fs from "node:fs"
import path from "node:path"

export type PageCache = Record<string, { pageId: string; slug: string; state: "creating" | "done" }>

export function readCache(file: string): PageCache {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {}
}

export function writeCache(file: string, cache: PageCache): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2))
  fs.renameSync(tmp, file)
}
