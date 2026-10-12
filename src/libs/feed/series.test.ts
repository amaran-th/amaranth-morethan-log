import { test } from "node:test"
import assert from "node:assert/strict"
import { findSeries } from "./series"

const post = (slug: string, date: string, series?: string, over: object = {}) => ({
  id: slug, slug, title: slug.toUpperCase(), date: { start_date: date }, createdTime: "",
  status: ["Public"], type: ["Post"], fullWidth: false, ...(series ? { series: [series] } : {}), ...over,
})
const listed = [
  post("c", "2024-03-01", "S"), post("x", "2024-02-15"), post("b", "2024-02-01", "S"), post("a", "2024-01-01", "S"),
] as any[]

test("findSeries lists the series oldest first with the current index", () => {
  assert.deepEqual(findSeries(listed, listed[2]), {
    name: "S",
    index: 1,
    posts: [
      { slug: "a", title: "A", date: "2024-01-01" },
      { slug: "b", title: "B", date: "2024-02-01" },
      { slug: "c", title: "C", date: "2024-03-01" },
    ],
  })
})

test("a post outside any series has no series box", () => {
  assert.equal(findSeries(listed, listed[1]), null)
})

test("an unlisted post still sees its listed series and its own place", () => {
  const hidden = post("h", "2024-02-20", "S", { status: ["PublicOnDetail"] }) as any
  const s = findSeries(listed, hidden)!
  assert.deepEqual(s.posts.map((p) => p.slug), ["a", "b", "h", "c"])
  assert.equal(s.index, 2)
})

test("a series of one post is not shown", () => {
  assert.equal(findSeries([post("only", "2024-01-01", "Solo")] as any[], post("only", "2024-01-01", "Solo") as any), null)
})
