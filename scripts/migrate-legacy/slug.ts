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

export function assignSlugs(
  posts: { legacyPath: string; title: string }[],
  taken: Set<string>
): Map<string, string> {
  const used = new Set(taken)
  const result = new Map<string, string>()
  for (const post of posts) {
    const base = toSlug(post.title)
    let slug = base
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`
    used.add(slug)
    result.set(post.legacyPath, slug)
  }
  return result
}
