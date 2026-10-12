const SEPARATORS = /[\[\]()\/&,:?!<>{}|#%*+=~^@$;\\`]/g
const REMOVED = /['".]/g

export function toSlug(title: string): string {
  const slug = title
    .normalize("NFC")
    .replace(REMOVED, "")
    .replace(SEPARATORS, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  if (!slug) throw new Error(`Title produces an empty slug: ${title}`)
  return slug
}

// `pinned` holds slugs already written to Notion (from the migration cache).
// They never change on a rerun, so url-map.json keeps matching the live pages.
export function assignSlugs(
  posts: { legacyPath: string; title: string }[],
  taken: Set<string>,
  pinned: Map<string, string> = new Map()
): Map<string, string> {
  const used = new Set([...taken, ...pinned.values()])
  const result = new Map<string, string>()
  for (const post of posts) {
    const fixed = pinned.get(post.legacyPath)
    if (fixed) {
      result.set(post.legacyPath, fixed)
      continue
    }
    const base = toSlug(post.title)
    let slug = base
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`
    used.add(slug)
    result.set(post.legacyPath, slug)
  }
  return result
}
