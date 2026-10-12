import type { TPost } from "src/types"

export type TSeriesPost = { slug: string; title: string; date: string }
export type TSeries = { name: string; index: number; posts: TSeriesPost[] }

const dateOf = (post: TPost) => post.date?.start_date || post.createdTime

// The series box lists the listed posts of the current post's series, oldest
// first. An unlisted current post (PublicOnDetail) is placed by its date.
export function findSeries(listed: TPost[], current: TPost): TSeries | null {
  const name = current.series?.[0]
  if (!name) return null
  const members = [...listed.filter((p) => p.id !== current.id && p.series?.includes(name)), current].sort(
    (a, b) => new Date(dateOf(a)).getTime() - new Date(dateOf(b)).getTime()
  )
  if (members.length < 2) return null
  return {
    name,
    index: members.findIndex((p) => p.id === current.id),
    posts: members.map((p) => ({ slug: p.slug, title: p.title, date: dateOf(p) })),
  }
}
