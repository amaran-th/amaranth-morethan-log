import { test } from "node:test"
import assert from "node:assert/strict"
import { ALLOWED_TAGS, TAG_MAP, capTags, countTags, mapCategory, mapRawTags } from "./taxonomy"

test("every mapped tag is one of the 17 allowed tags", () => {
  assert.equal(ALLOWED_TAGS.length, 17)
  for (const [from, to] of Object.entries(TAG_MAP)) {
    if (to.kind === "tag") assert.ok(ALLOWED_TAGS.includes(to.value), `${from} -> ${to.value}`)
  }
})

test("mapCategory maps sections and rejects unknown ones", () => {
  assert.equal(mapCategory("지식 공유"), "💻 개발")
  assert.equal(mapCategory("문제 해결"), "💻 개발")
  assert.equal(mapCategory("회고"), "💬 회고")
  assert.throws(() => mapCategory("잡담"))
})

test("mapRawTags merges category and tags, dedupes, extracts series", () => {
  assert.deepEqual(mapRawTags("Java", ["우아한 테크코스", "Java", "데이터베이스"]), {
    tags: ["Java", "우아한테크코스", "데이터베이스"],
    series: undefined,
    unknown: [],
  })
  assert.deepEqual(mapRawTags("우테코 5기", ["기술 부채", "Spring", "우아한 테크코스"]), {
    tags: ["우아한테크코스", "Spring"],
    series: "기술 부채",
    unknown: [],
  })
})

test("mapRawTags is case-insensitive, drops noise and reports unknown", () => {
  assert.deepEqual(mapRawTags("주저리주저리", ["kerdy", "TIL", "회고글", "새로운태그"]), {
    tags: ["프로젝트"],
    series: undefined,
    unknown: ["새로운태그"],
  })
})

test("capTags keeps the most used tags", () => {
  const counts = countTags([["Spring", "Java"], ["Spring"], ["Spring", "AI"], ["Java", "CS"]])
  assert.deepEqual(capTags(["AI", "CS", "Java", "Spring"], counts), ["Spring", "Java", "CS"])
  assert.deepEqual(capTags(["AI"], counts), ["AI"])
})
