import type { TPost } from "src/types"

export const PAGE_SIZE = 12

// Only what PostCard renders goes into list-page props, so a page's data stays
// small no matter how many posts the blog has.
export type TPostCard = Pick<TPost, "id" | "slug" | "title" | "date" | "createdTime"> &
  Partial<Pick<TPost, "category" | "tags" | "summary" | "thumbnail">>

const CARD_KEYS = ["id", "slug", "title", "date", "createdTime", "category", "tags", "summary", "thumbnail"] as const

export const toCard = (post: TPost): TPostCard =>
  Object.fromEntries(CARD_KEYS.filter((k) => post[k] !== undefined).map((k) => [k, post[k]])) as TPostCard

export type FeedFilter = { category?: string; tag?: string; series?: string }

const LEADING_EMOJI = /^[\p{Extended_Pictographic}️‍\s]+/u

// Category urls use the name without its emoji ("💻 개발" -> "개발").
export const categorySlug = (category: string) => category.replace(LEADING_EMOJI, "").trim()

export const resolveCategory = (categories: string[], slug: string) =>
  categories.find((c) => categorySlug(c).normalize("NFC") === slug.normalize("NFC"))

export function feedPath({ category, tag, series }: FeedFilter, page: number): string {
  const base = category
    ? `/category/${encodeURIComponent(categorySlug(category))}`
    : tag
      ? `/tag/${encodeURIComponent(tag)}`
      : series
        ? `/series/${encodeURIComponent(series)}`
        : ""
  if (page > 1) return `${base}/page/${page}`
  return base || "/"
}

// "/page/02" or "/page/1.5" must 404 rather than duplicate a real page.
export function parsePage(param: string | string[] | undefined): number | null {
  if (param === undefined) return 1
  if (typeof param !== "string" || !/^[1-9]\d*$/.test(param)) return null
  return Number(param)
}

export function paginate<T>(posts: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  if (page > totalPages) return null
  return { posts: posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, totalPages }
}

export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)
  const out: (number | "…")[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("…")
    out.push(p)
  })
  return out
}

export function searchPosts<T extends Pick<TPostCard, "title" | "summary" | "tags">>(posts: T[], q: string): T[] {
  const needle = q.trim().toLowerCase()
  return posts.filter((p) => `${p.title} ${p.summary ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(needle))
}

const ALL_CATEGORY = "📂 All"

// Old list urls were "/?category=💻 개발" and "/?tag=Spring"; a tag was the
// narrower filter, so it wins when both were set.
export function legacyFeedRedirect({ category, tag }: FeedFilter): string | null {
  if (tag) return feedPath({ tag }, 1)
  if (category) return category === ALL_CATEGORY ? "/" : feedPath({ category }, 1)
  return null
}
