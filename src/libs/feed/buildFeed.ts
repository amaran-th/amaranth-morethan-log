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
  const categoryCounts = count(posts.map((p) => p.category))
  const tags = count(posts.map((p) => p.tags))
  const series = count(posts.map((p) => p.series))

  let filter: FeedFilter = {}
  if (params.category !== undefined) {
    const category = resolveCategory(Object.keys(categoryCounts), params.category)
    if (!category) return { kind: "notFound" }
    filter = { category }
  } else if (params.tag !== undefined) {
    if (!tags[params.tag]) return { kind: "notFound" }
    filter = { tag: params.tag }
  } else if (params.series !== undefined) {
    if (!series[params.series]) return { kind: "notFound" }
    filter = { series: params.series }
  }

  if (params.page === "1") return { kind: "redirect", destination: feedPath(filter, 1) }
  const page = parsePage(params.page)
  if (!page) return { kind: "notFound" }

  const matching = posts.filter((p) =>
    filter.category
      ? p.category?.includes(filter.category)
      : filter.tag
        ? p.tags?.includes(filter.tag)
        : filter.series
          ? p.series?.includes(filter.series)
          : true
  )
  // A series is read in order, so its page lists the oldest post first.
  if (filter.series) matching.reverse()
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
      categories: { [DEFAULT_CATEGORY]: posts.length, ...categoryCounts },
      tags,
      series,
      pinned: isHome ? posts.filter((p) => p.tags?.includes("Pinned")).map(toCard) : [],
      postDates: posts.map((p) => (p.date?.start_date || new Date(p.createdTime).toISOString()).slice(0, 10)),
    },
  }
}
