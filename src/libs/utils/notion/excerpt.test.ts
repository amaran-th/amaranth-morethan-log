import { test } from "node:test"
import assert from "node:assert/strict"
import { buildExcerpt, pickDescription } from "./excerpt"

const block = (id: string, type: string, title?: string, content?: string[]) => ({
  value: { id, type, ...(title ? { properties: { title: [[title]] } } : {}), ...(content ? { content } : {}) },
})

const recordMap: any = {
  block: {
    page: block("page", "page", "Post", ["h", "t1", "code", "img", "t2", "list"]),
    h: block("h", "sub_header", "서론"),
    t1: block("t1", "text", "스프링에서 트랜잭션을   다루는 방법을 정리한다."),
    code: block("code", "code", "const a = 1"),
    img: block("img", "image"),
    t2: { value: { value: { id: "t2", type: "text", properties: { title: [["격리 수준과 ", [["b"]]], ["전파 옵션"]] } } } },
    list: block("list", "bulleted_list", "첫 번째 항목"),
  },
}

test("buildExcerpt joins body text in order, skipping headings, code and media", () => {
  assert.equal(
    buildExcerpt(recordMap, "page", 200),
    "스프링에서 트랜잭션을 다루는 방법을 정리한다. 격리 수준과 전파 옵션 첫 번째 항목"
  )
})

test("buildExcerpt cuts long text at a word boundary with an ellipsis", () => {
  const out = buildExcerpt(recordMap, "page", 20)
  assert.ok(out.length <= 20, out)
  assert.equal(out, "스프링에서 트랜잭션을 다루는 방법을…")
  // a word that would be cut in half is dropped
  assert.equal(buildExcerpt(recordMap, "page", 17), "스프링에서 트랜잭션을 다루는…")
})

test("pickDescription keeps a real summary and replaces empty or stub ones", () => {
  assert.equal(pickDescription("트랜잭션의 격리 수준과 전파 옵션에 대해 알아보자", "본문"), "트랜잭션의 격리 수준과 전파 옵션에 대해 알아보자")
  assert.equal(pickDescription("", "본문 요약"), "본문 요약")
  assert.equal(pickDescription("우테코 6주차 기술 부채", "본문 요약"), "우테코 6주차 기술 부채 - 본문 요약")
  assert.equal(pickDescription(undefined, ""), "")
})
