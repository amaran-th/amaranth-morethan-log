import { test } from "node:test"
import assert from "node:assert/strict"
import { findAdjacentPosts } from "./adjacent"

const post = (slug: string, date: string, over: object = {}) => ({
  id: slug, slug, title: slug.toUpperCase(), date: { start_date: date }, createdTime: "",
  status: ["Public"], type: ["Post"], fullWidth: false, ...over,
})
// newest first, as getPosts returns them
const listed = [post("c", "2024-03-01"), post("b", "2024-02-01"), post("a", "2024-01-01")] as any[]

test("prev is the older post and next the newer one", () => {
  assert.deepEqual(findAdjacentPosts(listed, listed[1]), {
    prev: { slug: "a", title: "A", date: "2024-01-01" },
    next: { slug: "c", title: "C", date: "2024-03-01" },
  })
})

test("the oldest post has no prev and the newest no next", () => {
  assert.deepEqual(findAdjacentPosts(listed, listed[2]), { next: { slug: "b", title: "B", date: "2024-02-01" } })
  assert.deepEqual(findAdjacentPosts(listed, listed[0]), { prev: { slug: "b", title: "B", date: "2024-02-01" } })
})

test("an unlisted post gets its listed neighbours by date", () => {
  const hidden = post("h", "2024-02-15", { status: ["PublicOnDetail"] }) as any
  assert.deepEqual(findAdjacentPosts(listed, hidden), {
    prev: { slug: "b", title: "B", date: "2024-02-01" },
    next: { slug: "c", title: "C", date: "2024-03-01" },
  })
})

test("posts without a date fall back to created time", () => {
  const undated = post("u", "", { date: undefined, createdTime: "2024-02-20T00:00:00Z" }) as any
  assert.equal(findAdjacentPosts(listed, undated).next?.slug, "c")
})

test("listed posts sharing a date follow the list order instead of looping", () => {
  const same = [post("y", "2024-01-01"), post("x", "2024-01-01")] as any[]
  assert.equal(findAdjacentPosts(same, same[0]).prev?.slug, "x")
  assert.equal(findAdjacentPosts(same, same[1]).next?.slug, "y")
  assert.equal(findAdjacentPosts(same, same[1]).prev, undefined)
})
