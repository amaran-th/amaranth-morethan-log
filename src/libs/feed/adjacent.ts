import type { TPost } from "src/types"

export type TAdjacentPost = { slug: string; title: string; date: string }
export type TAdjacentPosts = { prev?: TAdjacentPost; next?: TAdjacentPost }

const dateOf = (post: TPost) => post.date?.start_date || post.createdTime
const toAdjacent = (post: TPost): TAdjacentPost => ({ slug: post.slug, title: post.title, date: dateOf(post) })

// `listed` are the publicly listed posts. "prev" is the next older post and
// "next" the next newer one. The current post may be unlisted (PublicOnDetail);
// it still gets listed neighbours, but listed posts never point to it.
export function findAdjacentPosts(listed: TPost[], current: TPost): TAdjacentPosts {
  const index = listed.findIndex((p) => p.id === current.id)
  if (index !== -1) {
    // The list is already newest first; following it keeps same-date posts
    // in a consistent chain.
    const result: TAdjacentPosts = {}
    if (listed[index + 1]) result.prev = toAdjacent(listed[index + 1])
    if (listed[index - 1]) result.next = toAdjacent(listed[index - 1])
    return result
  }
  const time = (post: TPost) => new Date(dateOf(post)).getTime()
  const others = listed.filter((p) => p.id !== current.id).sort((a, b) => time(a) - time(b))
  const at = time(current)
  const older = others.filter((p) => time(p) <= at)
  const newer = others.filter((p) => time(p) > at)
  const result: TAdjacentPosts = {}
  if (older.length) result.prev = toAdjacent(older[older.length - 1])
  if (newer.length) result.next = toAdjacent(newer[0])
  return result
}
