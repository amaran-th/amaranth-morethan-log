import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { isExcluded, loadLegacyPosts, parseLegacyPost, toKstDate, legacyUrl } from "./legacy"
import { LEGACY_CONTENT } from "./config"

function makeTree(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-"))
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  return root
}

const POST = `---
title: "[DB] Transaction과 Spring Transaction"
date: "2023-10-07T16:11:03.284Z"
description: "Transaction의 격리 수준"
section: "지식 공유"
category: "Java"
tags:
  - 우아한 테크코스
  - Java
thumbnailImg: "../thumbnail.jpg"
---

# 이론
본문
`

test("toKstDate converts UTC evening to the next Seoul day", () => {
  assert.equal(toKstDate("2023-10-07T16:11:03.284Z"), "2023-10-08")
  assert.equal(toKstDate("2023-10-07T10:00:00.000Z"), "2023-10-07")
  assert.equal(toKstDate(new Date("2023-01-01T00:00:00Z")), "2023-01-01")
  assert.throws(() => toKstDate("not a date"))
})

test("isExcluded matches weekly logs and unfinished posts only", () => {
  assert.equal(isExcluded("우테코 백엔드 5기 레벨 1 - 1주차(2.7~2.10) 기록"), true)
  assert.equal(isExcluded("Ch1. 개발환경 설정(작성중)"), true)
  assert.equal(isExcluded("[기술부채] 우테코 5기 레벨2 - 3주차"), false)
  assert.equal(isExcluded("레벨1 레벨 로그"), false)
})

test("parseLegacyPost reads frontmatter and resolves thumbnail", () => {
  const root = makeTree({ "Java/[DB] Transaction/index.md": POST })
  const post = parseLegacyPost(root, path.join(root, "Java/[DB] Transaction/index.md"))
  assert.equal(post.legacyPath, "Java/[DB] Transaction")
  assert.equal(post.title, "[DB] Transaction과 Spring Transaction")
  assert.equal(post.date, "2023-10-08")
  assert.equal(post.section, "지식 공유")
  assert.equal(post.category, "Java")
  assert.deepEqual(post.tags, ["우아한 테크코스", "Java"])
  assert.equal(post.thumbnailImg, path.join(root, "Java/thumbnail.jpg"))
  assert.match(post.body, /# 이론/)
})

test("parseLegacyPost accepts inline and comma-string tags", () => {
  const root = makeTree({
    "a/index.md": `---\ntitle: a\ndate: "2023-01-01"\ntags: ["x", "y"]\n---\n`,
    "b/index.md": `---\ntitle: b\ndate: "2023-01-01"\ntags: "x, y"\n---\n`,
  })
  assert.deepEqual(parseLegacyPost(root, path.join(root, "a/index.md")).tags, ["x", "y"])
  assert.deepEqual(parseLegacyPost(root, path.join(root, "b/index.md")).tags, ["x", "y"])
})

test("legacyPath is NFC even when the directory name is NFD", () => {
  const nfd = "자바".normalize("NFD")
  const root = makeTree({ [`${nfd}/글/index.md`]: POST })
  const [post] = loadLegacyPosts(root)
  assert.equal(post.legacyPath, "자바/글".normalize("NFC"))
  assert.equal(legacyUrl(post.legacyPath), `https://amaran-th.github.io/${"자바/글".normalize("NFC")}/`)
})

test("loadLegacyPosts applies exclusions and sorts by date", () => {
  const mk = (title: string, date: string) => `---\ntitle: "${title}"\ndate: "${date}"\n---\n`
  const root = makeTree({
    "x/b/index.md": mk("B", "2023-02-01T00:00:00Z"),
    "x/a/index.md": mk("A", "2023-01-01T00:00:00Z"),
    "x/w/index.md": mk("우테코 백엔드 5기 레벨 1 - 1주차 기록", "2023-01-15T00:00:00Z"),
  })
  assert.deepEqual(loadLegacyPosts(root).map((p) => p.title), ["A", "B"])
})

test("real legacy blog yields exactly 200 posts", { skip: !fs.existsSync(LEGACY_CONTENT) }, () => {
  assert.equal(loadLegacyPosts(LEGACY_CONTENT).length, 200)
})

test("parseLegacyPost keeps a remote thumbnail url as is", () => {
  const url = "https://blog.kakaocdn.net/dn/x/img.png"
  const root = makeTree({ "Java/R/index.md": POST.replace('"../thumbnail.jpg"', `"${url}"`) })
  assert.equal(parseLegacyPost(root, path.join(root, "Java/R/index.md")).thumbnailImg, url)
})

test("parseLegacyPost applies known thumbnail typo fixes", () => {
  const legacyPath = "React/SSR(Server Side Rendering)과 CSR(Client Side Rendering)"
  const root = makeTree({ [`${legacyPath}/index.md`]: POST.replace('"../thumbnail.jpg"', '"./scr.png"') })
  assert.equal(parseLegacyPost(root, path.join(root, legacyPath, "index.md")).thumbnailImg, path.join(root, legacyPath, "csr.png"))
})
