import { test } from "node:test"
import assert from "node:assert/strict"
import { buildFeed } from "./buildFeed"

const post = (n: number, over: object = {}) => ({
  id: `${n}`, slug: `p${n}`, title: `Post ${n}`, date: { start_date: "2024-01-01" }, createdTime: "",
  status: ["Public"], type: ["Post"], fullWidth: false, category: ["💻 개발"], tags: ["Java"], ...over,
})
const posts = [
  ...Array.from({ length: 13 }, (_, i) => post(i)),
  post(100, { category: ["✍️ 회고"], tags: ["Pinned", "회고"] }),
] as any[]

test("home page 1 lists 12 cards with counts and pinned posts", () => {
  const r = buildFeed(posts, {})
  assert.equal(r.kind, "props")
  if (r.kind !== "props") return
  assert.equal(r.props.posts.length, 12)
  assert.equal(r.props.totalPages, 2)
  assert.deepEqual(r.props.filter, {})
  assert.deepEqual(r.props.categories, { "📂 All": 14, "💻 개발": 13, "✍️ 회고": 1 })
  assert.equal(r.props.tags.Java, 13)
  assert.deepEqual(r.props.pinned.map((p) => p.id), ["100"])
})

test("pinned posts only show on the home first page", () => {
  const r = buildFeed(posts, { page: "2" })
  assert.ok(r.kind === "props" && r.props.pinned.length === 0 && r.props.posts.length === 2)
})

test("category and tag pages filter by the url value", () => {
  const c = buildFeed(posts, { category: "회고" })
  assert.ok(c.kind === "props" && c.props.filter.category === "✍️ 회고" && c.props.posts.length === 1)
  const t = buildFeed(posts, { tag: "Java" })
  assert.ok(t.kind === "props" && t.props.filter.tag === "Java" && t.props.totalPages === 2)
})

test("unknown filters and pages past the end are not found", () => {
  assert.equal(buildFeed(posts, { category: "없음" }).kind, "notFound")
  assert.equal(buildFeed(posts, { tag: "없음" }).kind, "notFound")
  assert.equal(buildFeed(posts, { page: "3" }).kind, "notFound")
  assert.equal(buildFeed(posts, { page: "02" }).kind, "notFound")
})

test("an explicit page 1 redirects to the list's first page", () => {
  assert.deepEqual(buildFeed(posts, { page: "1" }), { kind: "redirect", destination: "/" })
  assert.deepEqual(buildFeed(posts, { category: "회고", page: "1" }), {
    kind: "redirect", destination: "/category/%ED%9A%8C%EA%B3%A0",
  })
})

test("every list page carries all listed post dates for the activity calendar", () => {
  const r = buildFeed(posts, { tag: "회고" })
  assert.ok(r.kind === "props")
  if (r.kind !== "props") return
  assert.equal(r.props.postDates.length, 14)
  assert.ok(r.props.postDates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))
})

test("series pages list the series oldest first and every page carries series counts", () => {
  const withSeries = [
    post(1, { series: ["S"], date: { start_date: "2024-03-01" } }),
    post(2, { series: ["S"], date: { start_date: "2024-01-01" } }),
    post(3, { series: ["T"] }),
    post(4),
  ] as any[]
  const home = buildFeed(withSeries, {})
  assert.ok(home.kind === "props")
  if (home.kind !== "props") return
  assert.deepEqual(home.props.series, { S: 2, T: 1 })
  const s = buildFeed(withSeries, { series: "S" })
  assert.ok(s.kind === "props")
  if (s.kind !== "props") return
  assert.deepEqual(s.props.filter, { series: "S" })
  assert.deepEqual(s.props.posts.map((p) => p.id), ["2", "1"])
  assert.equal(buildFeed(withSeries, { series: "없음" }).kind, "notFound")
})
