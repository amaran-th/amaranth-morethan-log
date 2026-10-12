import { test } from "node:test"
import assert from "node:assert/strict"
import { buildUrlMap, planPosts, renderMappingReport, selectPosts } from "./index"
import type { LegacyPost } from "./legacy"

const post = (over: Partial<LegacyPost>): LegacyPost => ({
  legacyPath: "x/a", dir: "/x/a", title: "A", date: "2023-01-01", description: "",
  section: "지식 공유", category: "Java", tags: [], body: "", ...over,
})

test("planPosts maps category, caps tags, extracts series and assigns slugs", () => {
  const planned = planPosts(
    [
      post({ legacyPath: "s/1", title: "[Spring] IoC", category: "Spring", tags: ["우아한 테크코스", "JPA", "Java", "테스트", "기술 부채"] }),
      post({ legacyPath: "s/2", title: "Spring IoC", category: "Spring", tags: ["우아한 테크코스"], section: "회고" }),
    ],
    new Set()
  )
  assert.equal(planned[0].props.slug, "spring-ioc")
  assert.equal(planned[1].props.slug, "spring-ioc-2")
  assert.equal(planned[0].props.category, "💻 개발")
  assert.equal(planned[1].props.category, "💬 회고")
  assert.deepEqual(planned[0].props.tags, ["Spring", "우아한테크코스", "Java"])
  assert.equal(planned[0].props.series, "기술 부채")
  assert.equal(planned[0].props.status, "PublicOnDetail")
})

test("planPosts fails on unknown tags", () => {
  assert.throws(() => planPosts([post({ tags: ["처음보는태그"] })], new Set()), /처음보는태그/)
})

test("url map and report use encoded new URLs and list every post", () => {
  const planned = planPosts([post({ legacyPath: "Java/[DB] 트랜잭션", title: "[DB] 트랜잭션" })], new Set())
  const map = buildUrlMap(planned)
  assert.deepEqual(map["Java/[DB] 트랜잭션"], {
    title: "[DB] 트랜잭션",
    slug: "db-트랜잭션",
    legacyUrl: "https://amaran-th.github.io/Java/[DB] 트랜잭션/",
    newUrl: `https://amaran-th.vercel.app/${encodeURIComponent("db-트랜잭션")}`,
  })
  const report = renderMappingReport(planned)
  assert.match(report, /\| 2023-01-01 \| \[DB\] 트랜잭션 \| `db-트랜잭션` \| 💻 개발 \| Java \|  \|/)
})

test("selectPosts picks every planned post with --all, else the named ones", () => {
  const planned = planPosts([post({ legacyPath: "a/1", title: "One" }), post({ legacyPath: "a/2", title: "Two" })], new Set())
  assert.deepEqual(selectPosts(planned, { all: true, pilot: false, only: [] }).map((p) => p.post.legacyPath), ["a/1", "a/2"])
  assert.deepEqual(selectPosts(planned, { all: false, pilot: false, only: ["a/2"] }).map((p) => p.post.legacyPath), ["a/2"])
  assert.throws(() => selectPosts(planned, { all: false, pilot: false, only: ["nope"] }), /Unknown legacy paths: nope/)
})
