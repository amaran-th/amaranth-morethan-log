import type { TCategories, TPost, TTags } from "src/types"
import { DEFAULT_CATEGORY } from "../../constants"
import { FeedFilter, TPostCard, feedPath, paginate, parsePage, resolveCategory, toCard } from "./index"

export type FeedProps = {
  posts: TPostCard[]
  page: number
  totalPages: number
  filter: FeedFilter
  categories: TCategories
  tags: TTags
  series: Record<string, number>
  pinned: TPostCard[]
  // "YYYY-MM-DD" of every listed post, for the weekly activity calendar
  postDates: string[]
}

export type FeedParams = { category?: string; tag?: string; series?: string; page?: string }

export type FeedResult =
  | { kind: "props"; props: FeedProps }
  | { kind: "notFound" }
  | { kind: "redirect"; destination: string }

function count(values: (string[] | undefined)[]) {
  const counts: Record<string, number> = {}
  for (const v of values.flat()) if (v) counts[v] = (counts[v] ?? 0) + 1
  return counts
}

// `posts` are the publicly listed posts, newest first.
export function buildFeed(posts: TPost[], params: FeedParams): FeedResult {
  const allCategories = count(posts.map((p) => p.category))
  const tags = count(posts.map((p) => p.tags))
  const series = count(posts.map((p) => p.series))

  // The tag or series picks the scope; a category can then narrow it.
  let filter: FeedFilter = {}
  if (params.tag !== undefined) {
    if (!tags[params.tag]) return { kind: "notFound" }
    filter = { tag: params.tag }
  } else if (params.series !== undefined) {
    if (!series[params.series]) return { kind: "notFound" }
    filter = { series: params.series }
  }
  if (params.category !== undefined) {
    const category = resolveCategory(Object.keys(allCategories), params.category)
    if (!category) return { kind: "notFound" }
    filter = { ...filter, category }
  }

  if (params.page === "1") return { kind: "redirect", destination: feedPath(filter, 1) }
  const page = parsePage(params.page)
  if (!page) return { kind: "notFound" }

  const scoped = posts.filter((p) =>
    filter.tag ? p.tags?.includes(filter.tag) : filter.series ? p.series?.includes(filter.series) : true
  )
  const matching = filter.category ? scoped.filter((p) => p.category?.includes(filter.category!)) : scoped
  const sliced = paginate(matching, page)
  if (!sliced) return { kind: "notFound" }

  const isHome = !filter.category && !filter.tag && !filter.series && page === 1
  return {
    kind: "props",
    props: {
      posts: sliced.posts.map(toCard),
      page,
      totalPages: sliced.totalPages,
      filter,
      // Counts within the current tag or series, so the menu matches the list.
      categories: { [DEFAULT_CATEGORY]: scoped.length, ...count(scoped.map((p) => p.category)) },
      tags,
      series,
      pinned: isHome ? posts.filter((p) => p.tags?.includes("Pinned")).map(toCard) : [],
      postDates: posts.map((p) => (p.date?.start_date || new Date(p.createdTime).toISOString()).slice(0, 10)),
    },
  }
}
