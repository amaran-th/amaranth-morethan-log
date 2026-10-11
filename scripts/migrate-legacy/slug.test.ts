import { test } from "node:test"
import assert from "node:assert/strict"
import { assignSlugs, toSlug } from "./slug"

test("toSlug follows the spec rules", () => {
  assert.equal(toSlug("[Java] Mockito 사용법(기본)"), "java-mockito-사용법-기본")
  assert.equal(toSlug("[Spring] Spring 프로젝트 CI/CD 적용하기"), "spring-spring-프로젝트-ci-cd-적용하기")
  assert.equal(toSlug("[Github] Issue & PR Template 설정하기"), "github-issue-pr-template-설정하기")
  assert.equal(toSlug("[Next.js] next-auth로 카카오 로그인"), "nextjs-next-auth로-카카오-로그인")
  assert.equal(toSlug("왜 '테스트'를 하나요?"), "왜-테스트를-하나요")
  assert.equal(toSlug("List&Dictionary 사용법"), "list-dictionary-사용법")
})

test("toSlug returns NFC", () => {
  assert.equal(toSlug("자바 기초".normalize("NFD")), "자바-기초".normalize("NFC"))
})

test("toSlug rejects titles with nothing left", () => {
  assert.throws(() => toSlug("[]()?"))
})

test("assignSlugs avoids taken slugs and duplicates", () => {
  const slugs = assignSlugs(
    [
      { legacyPath: "a", title: "Spring IoC" },
      { legacyPath: "b", title: "[Spring] IoC" },
      { legacyPath: "c", title: "기존 글" },
    ],
    new Set(["기존-글"])
  )
  assert.deepEqual([...slugs.entries()], [
    ["a", "spring-ioc"],
    ["b", "spring-ioc-2"],
    ["c", "기존-글-2"],
  ])
})
