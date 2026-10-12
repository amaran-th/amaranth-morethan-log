import { test } from "node:test"
import assert from "node:assert/strict"
import {
  PAGE_SIZE, categorySlug, feedPath, legacyFeedRedirect, pageWindow, paginate, parsePage, resolveCategory, searchPosts, toCard,
} from "./index"

const card = (n: number, over: object = {}) => ({
  id: `${n}`, slug: `p${n}`, title: `Post ${n}`, date: { start_date: "2024-01-01" }, createdTime: "", tags: [], ...over,
})

test("categorySlug drops the leading emoji", () => {
  assert.equal(categorySlug("💻 개발"), "개발")
  assert.equal(categorySlug("✍️ 회고"), "회고")
  assert.equal(categorySlug("개발"), "개발")
})

test("feedPath builds list urls, page 1 has no /page suffix", () => {
  assert.equal(feedPath({}, 1), "/")
  assert.equal(feedPath({}, 3), "/page/3")
  assert.equal(feedPath({ category: "💻 개발" }, 1), "/category/%EA%B0%9C%EB%B0%9C")
  assert.equal(feedPath({ category: "💻 개발" }, 2), "/category/%EA%B0%9C%EB%B0%9C/page/2")
  assert.equal(feedPath({ tag: "C#" }, 2), "/tag/C%23/page/2")
})

test("parsePage accepts only canonical positive integers", () => {
  assert.equal(parsePage("2"), 2)
  assert.equal(parsePage(undefined), 1)
  for (const bad of ["0", "-1", "02", "1.5", "x", ["2"]]) assert.equal(parsePage(bad as any), null)
})

test("resolveCategory finds the category for a url slug", () => {
  assert.equal(resolveCategory(["💻 개발", "✍️ 회고"], "회고"), "✍️ 회고")
  assert.equal(resolveCategory(["💻 개발"], "없음"), undefined)
})

test("paginate slices 12 per page and rejects pages past the end", () => {
  const posts = Array.from({ length: 25 }, (_, i) => card(i))
  assert.equal(PAGE_SIZE, 12)
  assert.deepEqual(paginate(posts, 1)!.posts.map((p) => p.id), posts.slice(0, 12).map((p) => p.id))
  assert.equal(paginate(posts, 3)!.posts.length, 1)
  assert.equal(paginate(posts, 3)!.totalPages, 3)
  assert.equal(paginate(posts, 4), null)
  assert.deepEqual(paginate([], 1), { posts: [], page: 1, totalPages: 1 })
})

test("pageWindow shows all pages when few, else ends and neighbours", () => {
  assert.deepEqual(pageWindow(2, 5), [1, 2, 3, 4, 5])
  assert.deepEqual(pageWindow(1, 20), [1, 2, "…", 20])
  assert.deepEqual(pageWindow(10, 20), [1, "…", 9, 10, 11, "…", 20])
  assert.deepEqual(pageWindow(19, 20), [1, "…", 18, 19, 20])
  assert.deepEqual(pageWindow(3, 20), [1, 2, 3, 4, "…", 20])
})

test("searchPosts matches title, summary and tags case-insensitively", () => {
  const posts = [card(1, { title: "Spring IoC" }), card(2, { summary: "jpa 정리" }), card(3, { tags: ["Java"] })]
  assert.deepEqual(searchPosts(posts, "spring").map((p) => p.id), ["1"])
  assert.deepEqual(searchPosts(posts, "JPA").map((p) => p.id), ["2"])
  assert.deepEqual(searchPosts(posts, "java").map((p) => p.id), ["3"])
})

test("legacyFeedRedirect maps old query urls to the new paths", () => {
  assert.equal(legacyFeedRedirect({ category: "💻 개발" }), "/category/%EA%B0%9C%EB%B0%9C")
  assert.equal(legacyFeedRedirect({ category: "📂 All" }), "/")
  assert.equal(legacyFeedRedirect({ tag: "Spring", category: "💻 개발" }), "/tag/Spring")
  assert.equal(legacyFeedRedirect({}), null)
})

test("toCard keeps only what a post card renders", () => {
  const full = { ...card(1, { category: ["💻 개발"], summary: "s", thumbnail: "t" }), status: ["Public"], type: ["Post"], fullWidth: false, author: [] }
  assert.deepEqual(Object.keys(toCard(full as any)).sort(), ["category", "createdTime", "date", "id", "slug", "summary", "tags", "thumbnail", "title"])
})

test("toCard omits missing fields so next can serialize the props", () => {
  const sparse = { id: "1", slug: "p", title: "T", date: { start_date: "2024-01-01" }, createdTime: "", status: ["Public"], type: ["Post"], fullWidth: false }
  const result = toCard(sparse as any)
  assert.ok(Object.values(result).every((v) => v !== undefined))
  assert.deepEqual(Object.keys(result).sort(), ["createdTime", "date", "id", "slug", "title"])
})

test("feedPath builds series urls", () => {
  assert.equal(feedPath({ series: "기술 부채" }, 1), "/series/%EA%B8%B0%EC%88%A0%20%EB%B6%80%EC%B1%84")
  assert.equal(feedPath({ series: "UX 개선안" }, 2), "/series/UX%20%EA%B0%9C%EC%84%A0%EC%95%88/page/2")
})
