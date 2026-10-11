# 레거시 글 이관 1단계 (사이트맵 필터 + 이관 스크립트 + 시범 이관) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트맵이 공개 글만 담게 고치고, 레거시 Gatsby 글을 노션 DB로 옮기는 재실행 가능한 스크립트를 만든 뒤, 2개 글을 `PublicOnDetail` 상태로 시범 이관한다.

**Architecture:**
- `scripts/migrate-legacy/`는 Next 앱과 분리된 Node 스크립트다.
  - 순수 함수 모듈: 레거시 파싱, slug, 분류 매핑, 마크다운 전처리, 블록 후처리
  - I/O 모듈: 노션 API, 이미지 로딩, 캐시
- 순수 모듈은 `node:test`로 단위 테스트한다. 노션 호출은 가짜 클라이언트로 테스트한다.
- CLI(`index.ts`)는 모듈을 엮기만 한다.

**Tech Stack:**
- Node 24, `tsx`(TS 실행), `node:test`
- `@notionhq/client@4.0.2`(공식 API, 기본 Notion-Version 2022-06-28, `fileUploads` 지원)
- `@tryfabric/martian@1.2.4`(마크다운 → 노션 블록), `gray-matter`

**Spec:** `docs/superpowers/specs/2026-10-11-legacy-blog-migration-design.md`
- 이 계획은 2~6절과 6.5절의 0~2단계를 구현한다.

## Global Constraints

### 이관 대상과 상태
- 이관 대상은 200개다.
  - 제외 규칙: 제목에 `우테코 백엔드 5기`와 `기록`이 모두 있는 글, 또는 제목에 `작성중`이 있는 글.
- 시범 및 일괄 이관 글의 status는 `PublicOnDetail`이다. 이 단계에서 `Public`으로 올리지 않는다.
- 기존 노션 글 29개의 slug, 태그, 본문은 이 단계에서 건드리지 않는다.

### 노션 속성
- 속성 이름(정확히 일치): `title`, `date`, `slug`, `summary`, `category`, `tags`, `series`, `type`, `status`, `author`, `thumbnail`
- 건드리지 않는 속성: `URL`, `발행하기`, `편집모드`, `updatedAt`
- category 매핑: `지식 공유` → `💻 개발`, `문제 해결` → `💻 개발`, `회고` → `💬 회고`
- 허용 태그는 17개다: Java, Spring, 테스트, 데이터베이스, 인프라, 설계, React, 프론트엔드, 웹·네트워크, CS, AI, 게임 개발, UX·디자인, 협업·도구, 우아한테크코스, 프로젝트, 커리어
  - 한 글에 최대 3개를 붙인다.
  - 3개가 넘으면 전체 글에서 사용 수가 적은 태그부터 뺀다.

### slug
- 규칙
  - `[ ] ( ) / & , : ? ! < > { } | # % * + = ~ ^ @ $ ; \` 백틱`은 공백으로 바꾼다.
  - `' " .`은 지운다.
  - 영문은 소문자로 바꾸고, 연속 공백은 `-` 하나로 합친다. 앞뒤 `-`는 지운다.
  - NFC로 정규화한다.
- 겹치면 `-2`, `-3`을 붙인다.
- 날짜 오름차순으로 전체 200개에 대해 정하므로, 시범 이관 때 정한 slug는 일괄 이관 때도 같다.

### 날짜와 사이트 정보
- date: frontmatter 시각을 Asia/Seoul 날짜(`YYYY-MM-DD`)로 변환한다.
- 새 글 주소: `https://amaran-th.vercel.app/${encodeURIComponent(slug)}`
- 옛 글 주소: `https://amaran-th.github.io/${legacyPath}/`
  - `legacyPath`는 `content/blog` 기준 디렉터리 경로이고, NFC로 정규화한다.

### Gatsby 안내 콜아웃
- 대상 제목: `Gatsby 블로그 태그 추가하기`, `Gatsby 블로그 검색엔진 최적화(SEO)하기`, `Gatsby 댓글 기능 추가하기`, `방학 기념 블로그 UI 뜯어고치기`
- 문구: `이 글은 이전 블로그(Gatsby)를 만들던 당시 작성한 글입니다. → ` + 링크 `이전 블로그`(https://amaran-th.github.io)
- 아이콘: 📌

### 비밀값과 커밋
- `NOTION_TOKEN`, `NOTION_PAGE_ID`(블로그 DB ID)는 `.env`에서 읽는다. 토큰을 로그나 파일에 출력하지 않는다.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`을 붙인다.

## Review Focus

1. **코드 안의 특수 문법 보존**
   - 코드 펜스나 인라인 코드 안의 `<br/>`, `<div>`, `![](…)`, `$`는 그대로 남아야 한다.
   - Task 4에서 테스트한다.
2. **NFD/NFC 혼용 경로**
   - macOS에서 만든 한글 파일명과 마크다운 속 이미지 경로의 정규화 방식이 다를 수 있다.
   - 정규화 방식이 달라도 이미지를 찾아야 하고, legacyPath는 NFC여야 한다.
   - Task 2(legacyPath)와 Task 6(이미지 찾기)에서 테스트한다.
3. **노션 제한에 걸리는 긴 본문**
   - 2000자를 넘는 코드 블록, 100개를 넘는 블록, 3단계 이상 중첩 목록도 잘리지 않고 모두 들어가야 한다.
   - Task 5와 Task 6에서 테스트한다.
4. **중단 후 재실행**
   - 페이지를 만든 뒤 본문을 넣다가 실패하면 캐시에 `creating`으로 남는다.
   - 다시 실행하면 새 페이지를 만들지 않고, 그 페이지의 본문을 비운 뒤 다시 채워야 한다.
   - Task 7에서 테스트한다.
5. **UTC 저녁 시각의 날짜**
   - `2023-10-07T16:11:03Z`는 한국 시간으로 10월 8일이다.
   - Task 2에서 테스트한다.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/pages/sitemap.xml.tsx` (수정) | 사이트맵에 Public + Post 글만 넣는다 |
| `tsconfig.json` (수정) | `scripts`를 Next 타입 검사 대상에서 뺀다 |
| `package.json` (수정) | devDependencies 추가, `migrate` / `migrate:test` 스크립트 추가 |
| `.gitignore` (수정) | `scripts/migrate-legacy/.cache/` 제외 |
| `scripts/migrate-legacy/config.ts` | 경로, 상수, 시범 대상, Gatsby 안내 대상 |
| `scripts/migrate-legacy/legacy.ts` | 레거시 글 읽기, frontmatter 파싱, 제외 규칙, KST 날짜 |
| `scripts/migrate-legacy/slug.ts` | slug 생성과 중복 처리 |
| `scripts/migrate-legacy/taxonomy.ts` | category, 태그, 시리즈 매핑과 태그 개수 제한 |
| `scripts/migrate-legacy/markdown.ts` | 마크다운 전처리(이미지를 표시용 URL로 바꾸기, HTML 정리, 코드 보호) |
| `scripts/migrate-legacy/blocks.ts` | martian 변환, 블록 후처리(이미지 교체, 인용 평탄화, 안내 콜아웃) |
| `scripts/migrate-legacy/images.ts` | 로컬/원격 이미지 읽기 |
| `scripts/migrate-legacy/notion.ts` | 요청 간격 조절과 재시도, 파일 업로드, 블록 추가, 페이지 비우기, DB 조회 |
| `scripts/migrate-legacy/properties.ts` | 노션 페이지 속성 객체 만들기 |
| `scripts/migrate-legacy/cache.ts` | `.cache/pages.json` 읽기/쓰기 |
| `scripts/migrate-legacy/migrate.ts` | 글 하나를 옮기는 흐름(만들기 또는 다시 채우기) |
| `scripts/migrate-legacy/index.ts` | CLI. 매핑 보고서와 url-map 생성, dry-run, 실행 |
| `scripts/migrate-legacy/*.test.ts` | 모듈별 테스트 |
| `docs/legacy-mapping.md` (생성물) | 글별 slug, category, 태그, 시리즈 검토용 표 |
| `scripts/migrate-legacy/url-map.json` (생성물) | 옛 주소 → 새 주소 대응표 |

---

### Task 1: 사이트맵에 Public 글만 넣기

**Files:**
- Modify: `src/pages/sitemap.xml.tsx`

**Interfaces:**
- Consumes: `filterPosts(posts)` from `src/libs/utils/notion/filterPosts.ts`
  - 기본값이 status `Public`, type `Post`이고, 미래 날짜, 제목 없는 글, slug 없는 글을 뺀다.

- [ ] **Step 1: 지금 동작 확인**

Run: `grep -n "validPosts" src/pages/sitemap.xml.tsx`
Expected: `posts.filter((post) => post.slug && post.slug.trim() !== "")`만 쓰고 status는 거르지 않는다.

- [ ] **Step 2: filterPosts 적용**

`src/pages/sitemap.xml.tsx`의 import와 필터를 바꾼다.

```tsx
import { GetServerSideProps } from "next"
import { CONFIG } from "site.config"
import { getPosts } from "../apis/notion-client/getPosts"
import { filterPosts } from "src/libs/utils/notion/filterPosts"

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await getPosts()
  // Only list posts that are publicly listed; PublicOnDetail and Private posts
  // (e.g. migration drafts) must not be advertised to crawlers.
  const validPosts = filterPosts(posts).filter(
    (post) => post.slug && post.slug.trim() !== ""
  )
```

나머지(`urls`, 캐시 헤더 등)는 그대로 둔다.

- [ ] **Step 3: 로컬에서 확인**

Run:
```bash
rm -rf .next && (npx next dev -p 3456 > /tmp/dev.log 2>&1 &) ; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3456/ && break; sleep 1; done; curl -s http://localhost:3456/sitemap.xml | grep -c "<loc>"; pkill -f "next dev -p 3456"
```
Expected: `30`. 지금은 모든 글이 Public이라 글 29개 + 홈 1개로 개수가 같다.

- [ ] **Step 4: 커밋**

```bash
git add src/pages/sitemap.xml.tsx
git commit -m "fix: 사이트맵에 공개(Public) 글만 포함

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 스크립트 뼈대와 레거시 글 읽기

**Files:**
- Modify: `package.json`, `tsconfig.json`, `.gitignore`
- Create: `scripts/migrate-legacy/config.ts`, `scripts/migrate-legacy/legacy.ts`
- Test: `scripts/migrate-legacy/legacy.test.ts`

**Interfaces:**
- Produces:
  - `type LegacyPost = { legacyPath: string; dir: string; title: string; date: string; description: string; section: string; category: string; tags: string[]; thumbnailImg?: string; body: string }`
  - `toKstDate(value: unknown): string`
  - `isExcluded(title: string): boolean`
  - `parseLegacyPost(contentRoot: string, file: string): LegacyPost`
  - `loadLegacyPosts(contentRoot: string): LegacyPost[]` (제외 적용, 날짜 → legacyPath 오름차순)
  - `legacyUrl(legacyPath: string): string`
  - `config.ts`의 상수: `REPO_ROOT`, `LEGACY_CONTENT`, `CACHE_DIR`, `SITE_URL`, `OLD_BLOG_URL`, `GATSBY_NOTICE_TITLES`, `PILOT_PATHS`, `MIGRATION_STATUS`

- [ ] **Step 1: 의존성과 스크립트 설정**

Run:
```bash
npm install --save-dev @notionhq/client@4.0.2 @tryfabric/martian@1.2.4 gray-matter@4.0.3 tsx@4.20.3
```
그 다음 yarn이 있으면 `yarn install --mode update-lockfile`, 없으면 `npx yarn@1 install --ignore-scripts`를 실행해 `yarn.lock`도 맞춘다. 두 lockfile을 항상 같이 갱신해 온 레포다.

`package.json`의 `scripts`에 추가한다.
```json
"migrate": "tsx scripts/migrate-legacy/index.ts",
"migrate:test": "node --import tsx --test \"scripts/migrate-legacy/**/*.test.ts\""
```

`tsconfig.json`의 `"exclude"`를 `["node_modules", "scripts"]`로 바꾼다.
- `@notionhq/client@4`의 타입은 TS 5.9로 빌드돼 있어서, 레포의 TS 4.9로 Next가 타입 검사하면 깨질 수 있다.

`.gitignore` 끝에 추가한다.
```
# legacy migration
/scripts/migrate-legacy/.cache/
```

- [ ] **Step 2: config.ts 작성**

```ts
import path from "node:path"

export const REPO_ROOT = path.resolve(__dirname, "../..")
export const LEGACY_ROOT =
  process.env.LEGACY_BLOG_DIR ?? path.resolve(REPO_ROOT, "../amaran-th.github.io")
export const LEGACY_CONTENT = path.join(LEGACY_ROOT, "content/blog")
export const CACHE_DIR = path.join(__dirname, ".cache")

export const SITE_URL = "https://amaran-th.vercel.app"
export const OLD_BLOG_URL = "https://amaran-th.github.io"

// New pages stay off the public list until the batch is reviewed (spec 6.5).
export const MIGRATION_STATUS = "PublicOnDetail"

export const GATSBY_NOTICE_TITLES = [
  "Gatsby 블로그 태그 추가하기",
  "Gatsby 블로그 검색엔진 최적화(SEO)하기",
  "Gatsby 댓글 기능 추가하기",
  "방학 기념 블로그 UI 뜯어고치기",
]

export const PILOT_PATHS = [
  "Java/[DB] Transaction과 Spring Transaction",
  "우테코 5기/[기술부채] 우테코 5기 레벨2 - 3주차",
]
```

- [ ] **Step 3: 실패하는 테스트 작성**

`scripts/migrate-legacy/legacy.test.ts`:
```ts
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
```

- [ ] **Step 4: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./legacy` 모듈을 찾지 못한다(`Cannot find module`).

- [ ] **Step 5: legacy.ts 구현**

```ts
import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { OLD_BLOG_URL } from "./config"

export type LegacyPost = {
  legacyPath: string
  dir: string
  title: string
  date: string
  description: string
  section: string
  category: string
  tags: string[]
  thumbnailImg?: string
  body: string
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function toKstDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`)
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

export function isExcluded(title: string): boolean {
  return (
    (title.includes("우테코 백엔드 5기") && title.includes("기록")) ||
    title.includes("작성중")
  )
}

function parseTags(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : []
  return list.map((t) => String(t).normalize("NFC").trim()).filter(Boolean)
}

export function parseLegacyPost(contentRoot: string, file: string): LegacyPost {
  const { data, content } = matter(fs.readFileSync(file, "utf8"))
  const dir = path.dirname(file)
  const legacyPath = path
    .relative(contentRoot, dir)
    .split(path.sep)
    .join("/")
    .normalize("NFC")
  const text = (v: unknown) => (v == null ? "" : String(v).normalize("NFC").trim())
  return {
    legacyPath,
    dir,
    title: text(data.title),
    date: toKstDate(data.date),
    description: text(data.description),
    section: text(data.section),
    category: text(data.category),
    tags: parseTags(data.tags),
    thumbnailImg: data.thumbnailImg ? path.resolve(dir, String(data.thumbnailImg)) : undefined,
    body: content,
  }
}

export function loadLegacyPosts(contentRoot: string): LegacyPost[] {
  const files = (fs.readdirSync(contentRoot, { recursive: true }) as string[])
    .filter((f) => path.basename(f) === "index.md")
    .map((f) => path.join(contentRoot, f))
  return files
    .map((f) => parseLegacyPost(contentRoot, f))
    .filter((p) => !isExcluded(p.title))
    .sort((a, b) => a.date.localeCompare(b.date) || a.legacyPath.localeCompare(b.legacyPath))
}

export const legacyUrl = (legacyPath: string) => `${OLD_BLOG_URL}/${legacyPath}/`
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS(테스트 7개). 레거시 레포가 `../amaran-th.github.io`에 있으면 200개 검사도 실행된다.

- [ ] **Step 7: 커밋**

```bash
git add package.json package-lock.json yarn.lock tsconfig.json .gitignore scripts/migrate-legacy/config.ts scripts/migrate-legacy/legacy.ts scripts/migrate-legacy/legacy.test.ts
git commit -m "feat: 레거시 글 이관 스크립트 뼈대와 레거시 글 파서 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: slug와 분류 매핑

**Files:**
- Create: `scripts/migrate-legacy/slug.ts`, `scripts/migrate-legacy/taxonomy.ts`
- Test: `scripts/migrate-legacy/slug.test.ts`, `scripts/migrate-legacy/taxonomy.test.ts`

**Interfaces:**
- Consumes: `LegacyPost` (Task 2)
- Produces:
  - `toSlug(title: string): string`
  - `assignSlugs(posts: { legacyPath: string; title: string }[], taken: Set<string>): Map<string, string>`
    - 키는 legacyPath. 입력 순서대로 slug를 정한다.
  - `ALLOWED_TAGS: readonly string[]`
  - `mapCategory(section: string): string`
  - `mapRawTags(category: string, tags: string[]): { tags: string[]; series?: string; unknown: string[] }`
  - `countTags(mapped: string[][]): Map<string, number>`
  - `capTags(tags: string[], counts: Map<string, number>, max?: number): string[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/migrate-legacy/slug.test.ts`:
```ts
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
```

`scripts/migrate-legacy/taxonomy.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./slug`, `./taxonomy` 모듈을 찾지 못한다.

- [ ] **Step 3: slug.ts 구현**

```ts
const SEPARATORS = /[\[\]()\/&,:?!<>{}|#%*+=~^@$;\\`]/g
const REMOVED = /['".]/g

export function toSlug(title: string): string {
  const slug = title
    .normalize("NFC")
    .replace(REMOVED, "")
    .replace(SEPARATORS, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  if (!slug) throw new Error(`Title produces an empty slug: ${title}`)
  return slug
}

export function assignSlugs(
  posts: { legacyPath: string; title: string }[],
  taken: Set<string>
): Map<string, string> {
  const used = new Set(taken)
  const result = new Map<string, string>()
  for (const post of posts) {
    const base = toSlug(post.title)
    let slug = base
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`
    used.add(slug)
    result.set(post.legacyPath, slug)
  }
  return result
}
```

- [ ] **Step 4: taxonomy.ts 구현**

```ts
export const ALLOWED_TAGS = [
  "Java", "Spring", "테스트", "데이터베이스", "인프라", "설계", "React", "프론트엔드",
  "웹·네트워크", "CS", "AI", "게임 개발", "UX·디자인", "협업·도구", "우아한테크코스",
  "프로젝트", "커리어",
] as const

type Target = { kind: "tag"; value: string } | { kind: "series"; value: string } | { kind: "drop" }
const tag = (value: (typeof ALLOWED_TAGS)[number]): Target => ({ kind: "tag", value })
const series = (value: string): Target => ({ kind: "series", value })
const drop: Target = { kind: "drop" }

// Keys are legacy categories, legacy tags and current-blog tags (spec section 4).
// Lookups are case-insensitive.
export const TAG_MAP: Record<string, Target> = {
  // Java
  "java": tag("Java"), "string": tag("Java"), "제네릭": tag("Java"), "thread": tag("Java"),
  "vo": tag("Java"), "함수형 프로그래밍": tag("Java"),
  // Spring
  "spring": tag("Spring"), "jpa": tag("Spring"), "aop": tag("Spring"),
  // 테스트
  "테스트": tag("테스트"), "test": tag("테스트"), "junit5": tag("테스트"), "학습 테스트": tag("테스트"),
  "mockito": tag("테스트"), "성능 테스트": tag("테스트"),
  // 데이터베이스
  "database": tag("데이터베이스"), "데이터베이스": tag("데이터베이스"),
  "데이터베이스 성능": tag("데이터베이스"), "mysql": tag("데이터베이스"), "정규화": tag("데이터베이스"),
  // 인프라
  "인프라": tag("인프라"), "배포": tag("인프라"), "aws": tag("인프라"), "cicd": tag("인프라"),
  "docker": tag("인프라"), "자동화": tag("인프라"),
  // 설계
  "소프트웨어 설계": tag("설계"), "디자인 패턴": tag("설계"), "소프트웨어 아키텍처": tag("설계"),
  "ddd": tag("설계"), "uml": tag("설계"), "소프트웨어 공학": tag("설계"),
  "개발 방법론": tag("설계"), "방법론": tag("설계"),
  // React
  "react": tag("React"), "recoil": tag("React"), "상태관리 라이브러리": tag("React"),
  "커스텀 훅": tag("React"),
  // 프론트엔드
  "javascript": tag("프론트엔드"), "typescript": tag("프론트엔드"), "nextjs": tag("프론트엔드"),
  "next.js": tag("프론트엔드"), "webpack": tag("프론트엔드"), "three.js": tag("프론트엔드"),
  "라이브러리": tag("프론트엔드"), "프론트엔드": tag("프론트엔드"), "frontend": tag("프론트엔드"),
  "프론트엔드 라이브러리": tag("프론트엔드"), "node": tag("프론트엔드"), "브라우저": tag("프론트엔드"),
  "seo": tag("프론트엔드"), "gatsby": tag("프론트엔드"), "ui": tag("프론트엔드"),
  // 웹·네트워크
  "web": tag("웹·네트워크"), "http": tag("웹·네트워크"), "네트워크": tag("웹·네트워크"),
  "websocket": tag("웹·네트워크"), "실시간 통신": tag("웹·네트워크"), "auth": tag("웹·네트워크"),
  "보안": tag("웹·네트워크"), "graphql": tag("웹·네트워크"), "크롤링": tag("웹·네트워크"),
  // CS
  "cs": tag("CS"), "운영체제": tag("CS"), "자료구조": tag("CS"), "컴퓨터 공학": tag("CS"),
  "알고리즘": tag("CS"), "algorithm": tag("CS"), "코딩 테스트": tag("CS"), "graph": tag("CS"),
  // AI
  "머신러닝": tag("AI"), "딥러닝": tag("AI"),
  // 게임 개발
  "unity": tag("게임 개발"), "c#": tag("게임 개발"),
  // UX·디자인
  "ux": tag("UX·디자인"), "ui 디자인": tag("UX·디자인"), "figma": tag("UX·디자인"),
  "디자인 시스템": tag("UX·디자인"), "sw-css": tag("UX·디자인"),
  // 협업·도구
  "github": tag("협업·도구"), "git": tag("협업·도구"), "형상 관리 툴": tag("협업·도구"),
  "markdown": tag("협업·도구"), "협업": tag("협업·도구"), "페어 프로그래밍": tag("협업·도구"),
  "발표 스터디": tag("협업·도구"), "notion": tag("협업·도구"),
  // 우아한테크코스
  "우아한 테크코스": tag("우아한테크코스"), "우테코 5기": tag("우아한테크코스"),
  // 프로젝트 (legacy BDD posts are all about the BDD dev community)
  "kerdy": tag("프로젝트"), "두레": tag("프로젝트"), "장작": tag("프로젝트"),
  "유스콘": tag("프로젝트"), "프로젝트": tag("프로젝트"), "bdd": tag("프로젝트"),
  // 커리어
  "실무": tag("커리어"), "일을:하자": tag("커리어"), "자기계발": tag("커리어"),
  "생산성": tag("커리어"), "계획": tag("커리어"), "로드맵": tag("커리어"), "근황": tag("커리어"),
  "글쓰기": tag("커리어"), "도서": tag("커리어"), "독후감": tag("커리어"),
  // series
  "기술 부채": series("기술 부채"),
  "java 언어로 배우는 디자인 패턴 입문": series("Java 언어로 배우는 디자인 패턴 입문"),
  "스터디 운영 일지 시리즈": series("스터디 운영 일지"),
  "일일 기술토크 시리즈": series("일일 기술토크"),
  "ux 개선안 시리즈": series("UX 개선안"),
  "인터랙션 만들기 시리즈": series("인터랙션 만들기"),
  // dropped
  "지식 공유": drop, "회고": drop, "회고글": drop, "til": drop, "random": drop, "시리즈": drop,
  "트러블 슈팅": drop, "트러블슈팅": drop, "주저리주저리": drop, "blog": drop,
}

const CATEGORY_BY_SECTION: Record<string, string> = {
  "지식 공유": "💻 개발",
  "문제 해결": "💻 개발",
  "회고": "💬 회고",
}

export function mapCategory(section: string): string {
  const category = CATEGORY_BY_SECTION[section]
  if (!category) throw new Error(`Unknown legacy section: "${section}"`)
  return category
}

export function mapRawTags(category: string, tags: string[]) {
  const result = { tags: [] as string[], series: undefined as string | undefined, unknown: [] as string[] }
  for (const raw of [category, ...tags]) {
    if (!raw) continue
    const target = TAG_MAP[raw.normalize("NFC").trim().toLowerCase()]
    if (!target) result.unknown.push(raw)
    else if (target.kind === "tag" && !result.tags.includes(target.value)) result.tags.push(target.value)
    else if (target.kind === "series") result.series ??= target.value
  }
  return result
}

export function countTags(mapped: string[][]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const tags of mapped) for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return counts
}

export function capTags(tags: string[], counts: Map<string, number>, max = 3): string[] {
  return [...tags]
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || ALLOWED_TAGS.indexOf(a as never) - ALLOWED_TAGS.indexOf(b as never))
    .slice(0, max)
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS.

- [ ] **Step 6: 실제 레거시 글에 모르는 태그가 없는지 확인**

Run:
```bash
npx tsx -e 'import {loadLegacyPosts} from "./scripts/migrate-legacy/legacy"; import {LEGACY_CONTENT} from "./scripts/migrate-legacy/config"; import {mapRawTags, mapCategory} from "./scripts/migrate-legacy/taxonomy"; const u=new Set<string>(); for (const p of loadLegacyPosts(LEGACY_CONTENT)) { mapCategory(p.section); mapRawTags(p.category,p.tags).unknown.forEach(t=>u.add(t)) } console.log([...u])'
```
Expected: `[]`
- 모르는 태그가 나오면 스펙 4절의 의도에 맞게 `TAG_MAP`에 추가한다.
- 판단이 애매하면 사용자에게 묻는다.

- [ ] **Step 7: 커밋**

```bash
git add scripts/migrate-legacy/slug.ts scripts/migrate-legacy/slug.test.ts scripts/migrate-legacy/taxonomy.ts scripts/migrate-legacy/taxonomy.test.ts
git commit -m "feat: 이관용 slug 규칙과 카테고리·태그·시리즈 매핑 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 마크다운 전처리

**Files:**
- Create: `scripts/migrate-legacy/markdown.ts`
- Test: `scripts/migrate-legacy/markdown.test.ts`

**Interfaces:**
- Produces:
  - `type ImageSource = { kind: "local"; src: string } | { kind: "remote"; url: string }`
  - 이미지 한 개만 있는 줄 바로 위가 빈 줄이 아니면 빈 줄을 넣는다.
    - martian은 빈 줄 없이 목록 항목에 이어지는 이미지를 조용히 버린다(직접 확인함).
    - 레거시에는 이런 줄이 148개 있다.
  - `IMAGE_SENTINEL_PREFIX = "https://migrate.example.com/img/"`
  - `preprocessMarkdown(md: string): { markdown: string; images: ImageSource[] }`
    - 이미지 n번은 `${IMAGE_SENTINEL_PREFIX}${n}.png` URL로 바뀐다.
    - `.png` 확장자가 없으면 martian이 이미지를 문단 텍스트로 바꿔 버린다(직접 확인함).
    - local `src`는 마크다운에 적힌 경로 그대로다. 실제 파일 찾기는 Task 6에서 한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/migrate-legacy/markdown.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { IMAGE_SENTINEL_PREFIX, preprocessMarkdown } from "./markdown"

const S = (n: number) => `${IMAGE_SENTINEL_PREFIX}${n}.png`

test("markdown images become sentinels with recorded sources", () => {
  const { markdown, images } = preprocessMarkdown(
    `a ![x](data_sql.png) b\n\n![y](https://i.imgur.com/0F1Xg65.png "t")\n\n![z](./dir/c.jpg)`
  )
  assert.equal(markdown, `a ![x](${S(0)}) b\n\n![y](${S(1)})\n\n![z](${S(2)})`)
  assert.deepEqual(images, [
    { kind: "local", src: "data_sql.png" },
    { kind: "remote", url: "https://i.imgur.com/0F1Xg65.png" },
    { kind: "local", src: "./dir/c.jpg" },
  ])
})

test("html img tags become markdown images", () => {
  const { markdown, images } = preprocessMarkdown(`<img src="a.png" width="300"/>\n<img alt="b" src='https://x.com/b.gif'>`)
  assert.equal(markdown, `![](${S(0)})\n\n![b](${S(1)})`)
  assert.deepEqual(images, [
    { kind: "local", src: "a.png" },
    { kind: "remote", url: "https://x.com/b.gif" },
  ])
})

test("image-only lines are split from the line above so lists keep them", () => {
  // martian silently drops an image that continues a list item without a blank line
  // (148 such lines in the legacy blog); a blank line makes it a child block instead.
  assert.equal(preprocessMarkdown("1. item\n   ![b](b.png)").markdown, `1. item\n\n   ![b](${S(0)})`)
  assert.equal(preprocessMarkdown("text\n\n![b](b.png)").markdown, `text\n\n![b](${S(0)})`)
})

test("br becomes a newline, br inside table rows becomes a space", () => {
  assert.equal(preprocessMarkdown("a<br/>b<br>c").markdown, "a\nb\nc")
  assert.equal(preprocessMarkdown("| a<br/>b | c |").markdown, "| a b | c |")
})

test("layout html tags are unwrapped and comments removed", () => {
  assert.equal(
    preprocessMarkdown(`<div align="center">\n\n**hi**\n\n</div>\n<span style="x">t</span><!-- note -->`).markdown,
    "\n\n**hi**\n\n\nt"
  )
})

test("fenced and inline code are left untouched", () => {
  const md = "```html\n<div><br/>![a](b.png)</div>\n```\n`<br/>` and `![a](b.png)`\n~~~\n<span>$x$</span>\n~~~"
  const { markdown, images } = preprocessMarkdown(md)
  assert.equal(markdown, md)
  assert.deepEqual(images, [])
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./markdown` 모듈을 찾지 못한다.

- [ ] **Step 3: markdown.ts 구현**

```ts
export type ImageSource = { kind: "local"; src: string } | { kind: "remote"; url: string }

// martian only emits image blocks for URLs that look like images, so the
// sentinel needs a real-looking host and an image extension.
export const IMAGE_SENTINEL_PREFIX = "https://migrate.example.com/img/"

const FENCE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm
const INLINE_CODE = /(`+)[^`\n]+?\1/g
const MD_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g
const HTML_IMG = /<img\b[^>]*>/gi
const LAYOUT_TAGS = /<\/?(div|span|p|center|font|section|article|figure|figcaption|a\s+name=[^>]*)\b[^>]*>/gi
const COMMENT = /<!--[\s\S]*?-->/g

function attr(tag: string, name: string): string {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? ""
}

function transformText(text: string, images: ImageSource[]): string {
  const register = (alt: string, src: string) => {
    images.push(/^https?:\/\//i.test(src) ? { kind: "remote", url: src } : { kind: "local", src })
    return `![${alt}](${IMAGE_SENTINEL_PREFIX}${images.length - 1}.png)`
  }
  return text
    .replace(COMMENT, "")
    .replace(HTML_IMG, (tag) => register(attr(tag, "alt"), attr(tag, "src")))
    .replace(MD_IMAGE, (whole, alt: string, src: string) =>
      src.startsWith(IMAGE_SENTINEL_PREFIX) ? whole : register(alt, src)
    )
    .split("\n")
    .map((line) =>
      line.replace(/<br\s*\/?>/gi, line.trimStart().startsWith("|") ? " " : "\n")
    )
    .join("\n")
    .replace(LAYOUT_TAGS, "")
}

function mapOutside(text: string, pattern: RegExp, fn: (chunk: string) => string): string {
  let out = ""
  let last = 0
  for (const m of text.matchAll(pattern)) {
    out += fn(text.slice(last, m.index)) + m[0]
    last = m.index! + m[0].length
  }
  return out + fn(text.slice(last))
}

const IMAGE_ONLY_LINE = new RegExp(`^\\s*!\\[[^\\]]*\\]\\(${IMAGE_SENTINEL_PREFIX.replace(/[.]/g, "\\.")}\\d+\\.png\\)\\s*$`)

function separateImageLines(text: string): string {
  const lines = text.split("\n")
  return lines
    .map((line, i) => (i > 0 && IMAGE_ONLY_LINE.test(line) && lines[i - 1].trim() !== "" ? `\n${line}` : line))
    .join("\n")
}

export function preprocessMarkdown(md: string): { markdown: string; images: ImageSource[] } {
  const images: ImageSource[] = []
  const transformed = mapOutside(md, FENCE, (prose) =>
    mapOutside(prose, INLINE_CODE, (text) => transformText(text, images))
  )
  // Sentinels only exist outside code, so a second pass over prose is safe.
  const markdown = mapOutside(transformed, FENCE, separateImageLines)
  return { markdown, images }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS.
- `layout html tags` 테스트의 기대 문자열이 줄바꿈 개수만 다르게 실패하면 구현을 맞추지 말고 기대값을 확인한다.
- 판단 기준은 `<div>`와 `</div>` 태그만 지워지고 앞뒤 줄바꿈은 그대로 남는 것이다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/migrate-legacy/markdown.ts scripts/migrate-legacy/markdown.test.ts
git commit -m "feat: 이관용 마크다운 전처리(이미지 치환, HTML 정리, 코드 보호) 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 노션 블록 변환과 후처리

**Files:**
- Create: `scripts/migrate-legacy/blocks.ts`
- Test: `scripts/migrate-legacy/blocks.test.ts`

**Interfaces:**
- Consumes: `IMAGE_SENTINEL_PREFIX` (Task 4)
- Produces:
  - `type Block = { type: string; [key: string]: any }`
  - `markdownToNotionBlocks(markdown: string): Block[]`
    - martian을 `{ strictImageUrls: false, notionLimits: { truncate: false } }`로 호출한다.
  - `postprocessBlocks(blocks: Block[], resolveImage: (index: number) => Promise<Block>): Promise<Block[]>`
    - 표시용 URL 이미지 블록을 교체하고, 빈 인용 블록을 평탄화한다.
  - `noticeCallout(): Block`
  - `missingImageBlock(label: string): Block`
  - `uploadedImageBlock(fileUploadId: string): Block`

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/migrate-legacy/blocks.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { IMAGE_SENTINEL_PREFIX } from "./markdown"
import {
  markdownToNotionBlocks, missingImageBlock, noticeCallout, postprocessBlocks, uploadedImageBlock,
} from "./blocks"

const text = (rt: any[]) => rt.map((r) => r.text?.content ?? "").join("")

test("sentinel images are replaced by resolved blocks, in order", async () => {
  const blocks = markdownToNotionBlocks(`para\n\n![a](${IMAGE_SENTINEL_PREFIX}0.png)\n\n- item\n\n  ![b](${IMAGE_SENTINEL_PREFIX}1.png)`)
  const seen: number[] = []
  const out = await postprocessBlocks(blocks, async (i) => {
    seen.push(i)
    return i === 0 ? uploadedImageBlock("fu_0") : missingImageBlock("b.png")
  })
  assert.deepEqual(seen, [0, 1])
  const flat = JSON.stringify(out)
  assert.ok(!flat.includes(IMAGE_SENTINEL_PREFIX))
  assert.ok(flat.includes('"file_upload":{"id":"fu_0"}'))
  assert.ok(flat.includes("[이미지 누락: b.png]"))
})

test("non-sentinel external images are kept", async () => {
  const out = await postprocessBlocks(markdownToNotionBlocks("![a](https://i.imgur.com/x.png)"), async () => {
    throw new Error("should not resolve")
  })
  assert.equal(out[0].type, "image")
})

test("quotes with an empty head lift their first paragraph", async () => {
  const [quote] = await postprocessBlocks(markdownToNotionBlocks("> first\n>\n> second"), async () => missingImageBlock(""))
  assert.equal(quote.type, "quote")
  assert.equal(text(quote.quote.rich_text), "first")
  assert.equal(quote.quote.children.length, 1)
  assert.equal(text(quote.quote.children[0].paragraph.rich_text), "second")
})

test("long code and many blocks are not truncated", () => {
  const code = "x".repeat(4500)
  const [block] = markdownToNotionBlocks("```java\n" + code + "\n```")
  assert.equal(block.code.language, "java")
  assert.equal(text(block.code.rich_text), code)
  assert.ok(block.code.rich_text.every((r: any) => r.text.content.length <= 2000))
  const many = Array.from({ length: 150 }, (_, i) => `- i${i}`).join("\n")
  assert.equal(markdownToNotionBlocks(many).length, 150)
})

test("tables, equations, mermaid and h4 convert", () => {
  const blocks = markdownToNotionBlocks("#### h4\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n$$\ny=1\n$$\n\n```mermaid\ngraph TD\n```")
  assert.deepEqual(blocks.map((b) => b.type), ["heading_3", "table", "equation", "code"])
  assert.equal(blocks[3].code.language, "mermaid")
})

test("notice callout links the old blog", () => {
  const block = noticeCallout()
  assert.equal(block.type, "callout")
  assert.equal(block.callout.icon.emoji, "📌")
  assert.equal(text(block.callout.rich_text), "이 글은 이전 블로그(Gatsby)를 만들던 당시 작성한 글입니다. → 이전 블로그")
  assert.equal(block.callout.rich_text[1].text.link.url, "https://amaran-th.github.io")
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./blocks` 모듈을 찾지 못한다.

- [ ] **Step 3: blocks.ts 구현**

```ts
import { markdownToBlocks } from "@tryfabric/martian"
import { IMAGE_SENTINEL_PREFIX } from "./markdown"
import { OLD_BLOG_URL } from "./config"

export type Block = { type: string; [key: string]: any }

const plain = (content: string, link?: string) => ({
  type: "text",
  text: link ? { content, link: { url: link } } : { content },
})

export function markdownToNotionBlocks(markdown: string): Block[] {
  // Chunking to Notion's limits happens when appending (notion.ts), so never
  // let martian silently drop content.
  return markdownToBlocks(markdown, {
    strictImageUrls: false,
    notionLimits: { truncate: false },
  }) as Block[]
}

export const uploadedImageBlock = (fileUploadId: string): Block => ({
  object: "block",
  type: "image",
  image: { type: "file_upload", file_upload: { id: fileUploadId } },
})

export const missingImageBlock = (label: string): Block => ({
  object: "block",
  type: "paragraph",
  paragraph: { rich_text: [plain(`[이미지 누락: ${label}]`)] },
})

export const noticeCallout = (): Block => ({
  object: "block",
  type: "callout",
  callout: {
    icon: { type: "emoji", emoji: "📌" },
    rich_text: [
      plain("이 글은 이전 블로그(Gatsby)를 만들던 당시 작성한 글입니다. → "),
      plain("이전 블로그", OLD_BLOG_URL),
    ],
  },
})

function sentinelIndex(block: Block): number | undefined {
  const url: string | undefined = block.type === "image" ? block.image?.external?.url : undefined
  if (!url?.startsWith(IMAGE_SENTINEL_PREFIX)) return undefined
  return Number(url.slice(IMAGE_SENTINEL_PREFIX.length).replace(/\.png$/, ""))
}

// martian emits quotes as an empty text head plus paragraph children, which
// renders as a blank quote line; lift the first paragraph into the head.
function liftQuoteHead(block: Block): Block {
  const quote = block.quote
  const [first, ...rest] = quote.children ?? []
  const headIsEmpty = (quote.rich_text ?? []).every((r: any) => !r.text?.content)
  if (!headIsEmpty || first?.type !== "paragraph") return block
  return { ...block, quote: { ...quote, rich_text: first.paragraph.rich_text, children: rest } }
}

export async function postprocessBlocks(
  blocks: Block[],
  resolveImage: (index: number) => Promise<Block>
): Promise<Block[]> {
  const out: Block[] = []
  for (const original of blocks) {
    const index = sentinelIndex(original)
    if (index !== undefined) {
      out.push(await resolveImage(index))
      continue
    }
    let block = original.type === "quote" ? liftQuoteHead(original) : original
    const children = block[block.type]?.children
    if (Array.isArray(children) && children.length && block.type !== "table") {
      block = { ...block, [block.type]: { ...block[block.type], children: await postprocessBlocks(children, resolveImage) } }
    }
    out.push(block)
  }
  return out
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS.
- 인용 테스트가 실패하면 martian이 `> first\n>\n> second`를 어떤 구조로 내보내는지 `console.log(JSON.stringify(...))`로 확인한다.
- 그 구조에 맞게 `liftQuoteHead`만 고친다. 테스트의 기대 결과는 바꾸지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/migrate-legacy/blocks.ts scripts/migrate-legacy/blocks.test.ts
git commit -m "feat: 마크다운을 노션 블록으로 변환하고 이미지·인용·안내 콜아웃 후처리

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 노션 API 계층과 이미지 로딩

**Files:**
- Create: `scripts/migrate-legacy/notion.ts`, `scripts/migrate-legacy/images.ts`
- Test: `scripts/migrate-legacy/notion.test.ts`, `scripts/migrate-legacy/images.test.ts`

**Interfaces:**
- Consumes: `Block` (Task 5), `ImageSource` (Task 4)
- Produces:
  - `type Run = <T>(fn: () => Promise<T>) => Promise<T>`
  - `createThrottle(opts?: { minIntervalMs?: number; maxRetries?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> }): Run`
  - `isRetryable(err: unknown): boolean`
  - `type NotionApi = Pick<Client, "blocks" | "pages" | "fileUploads" | "databases">`
  - `appendBlocks(api: NotionApi, run: Run, parentId: string, blocks: Block[]): Promise<void>`
  - `clearChildren(api: NotionApi, run: Run, blockId: string): Promise<void>`
  - `uploadFile(api: NotionApi, run: Run, file: LoadedFile): Promise<string>` (file_upload id를 반환)
  - `listDatabasePages(api: NotionApi, run: Run, databaseId: string): Promise<{ id: string; slug: string; authorId?: string }[]>`
  - `ensureSeriesProperty(api: NotionApi, run: Run, databaseId: string): Promise<void>`
  - `images.ts`
    - `type LoadedFile = { filename: string; contentType: string; data: Buffer }`
    - `resolveLocalFile(dir: string, src: string): string | undefined`
    - `loadImage(source: ImageSource, dir: string, fetchFn?: typeof fetch): Promise<LoadedFile>` (실패하면 throw)

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/migrate-legacy/notion.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { APIErrorCode, APIResponseError } from "@notionhq/client"
import { appendBlocks, clearChildren, createThrottle, isRetryable } from "./notion"

const noSleep = async () => {}
const para = (t: string, children?: any[]) => ({
  object: "block", type: "paragraph",
  paragraph: { rich_text: [{ type: "text", text: { content: t } }], ...(children ? { children } : {}) },
})
const rateLimited = () =>
  new APIResponseError({ code: APIErrorCode.RateLimited, status: 429, message: "slow down", headers: {}, rawBodyText: "" } as any)

function fakeApi() {
  const calls: { parent: string; children: any[] }[] = []
  let id = 0
  const api: any = {
    blocks: {
      children: {
        append: async ({ block_id, children }: any) => {
          calls.push({ parent: block_id, children })
          return { results: children.map(() => ({ id: `b${id++}` })) }
        },
        list: async () => ({ results: [{ id: "old1" }, { id: "old2" }], has_more: false, next_cursor: null }),
      },
      delete: async ({ block_id }: any) => { calls.push({ parent: `delete:${block_id}`, children: [] }) },
    },
  }
  return { api, calls }
}

test("throttle retries rate-limited calls then succeeds", async () => {
  const run = createThrottle({ minIntervalMs: 0, sleep: noSleep })
  let attempts = 0
  const value = await run(async () => {
    if (++attempts < 3) throw rateLimited()
    return "ok"
  })
  assert.equal(value, "ok")
  assert.equal(attempts, 3)
})

test("throttle does not retry validation errors", async () => {
  const run = createThrottle({ minIntervalMs: 0, sleep: noSleep })
  let attempts = 0
  const err = new APIResponseError({ code: APIErrorCode.ValidationError, status: 400, message: "bad", headers: {}, rawBodyText: "" } as any)
  await assert.rejects(run(async () => { attempts++; throw err }))
  assert.equal(attempts, 1)
  assert.equal(isRetryable(err), false)
})

test("appendBlocks sends chunks of 100 and nests children in later calls", async () => {
  const { api, calls } = fakeApi()
  const run = createThrottle({ minIntervalMs: 0, sleep: noSleep })
  const blocks = Array.from({ length: 150 }, (_, i) => para(`p${i}`))
  blocks[120] = para("parent", [para("child", [para("grandchild")])])
  await appendBlocks(api, run, "page", blocks)
  assert.equal(calls[0].parent, "page")
  assert.equal(calls[0].children.length, 100)
  assert.equal(calls[1].children.length, 50)
  assert.equal(calls[1].children[20].paragraph.children, undefined)
  assert.equal(calls[2].parent, "b120")
  assert.equal(calls[2].children[0].paragraph.children, undefined)
  assert.equal(calls[3].parent, "b150")
  assert.equal(calls.length, 4)
})

test("appendBlocks keeps table rows inline", async () => {
  const { api, calls } = fakeApi()
  const table = { object: "block", type: "table", table: { table_width: 1, has_column_header: true, has_row_header: false, children: [{ type: "table_row", table_row: { cells: [[]] } }] } }
  await appendBlocks(api, createThrottle({ minIntervalMs: 0, sleep: noSleep }), "page", [table])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].children[0].table.children.length, 1)
})

test("clearChildren deletes every child block", async () => {
  const { api, calls } = fakeApi()
  await clearChildren(api, createThrottle({ minIntervalMs: 0, sleep: noSleep }), "page")
  assert.deepEqual(calls.map((c) => c.parent), ["delete:old1", "delete:old2"])
})
```

`scripts/migrate-legacy/images.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { loadImage, resolveLocalFile } from "./images"

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "img-"))
fs.writeFileSync(path.join(dir, "data sql.png"), "png")
fs.writeFileSync(path.join(dir, "트랜잭션.jpg".normalize("NFD")), "jpg")

test("resolveLocalFile handles ./, url-encoding and NFC/NFD mismatch", () => {
  assert.equal(resolveLocalFile(dir, "./data sql.png"), path.join(dir, "data sql.png"))
  assert.equal(resolveLocalFile(dir, "data%20sql.png"), path.join(dir, "data sql.png"))
  assert.equal(resolveLocalFile(dir, "트랜잭션.jpg".normalize("NFC")), path.join(dir, "트랜잭션.jpg".normalize("NFD")))
  assert.equal(resolveLocalFile(dir, "missing.png"), undefined)
})

test("loadImage reads local files with a content type", async () => {
  const file = await loadImage({ kind: "local", src: "data sql.png" }, dir)
  assert.equal(file.contentType, "image/png")
  assert.equal(file.filename, "data sql.png")
  assert.equal(file.data.toString(), "png")
  await assert.rejects(loadImage({ kind: "local", src: "missing.png" }, dir), /not found/)
})

test("loadImage downloads remote images and rejects non-images", async () => {
  const okFetch = (async () => new Response("gif", { headers: { "content-type": "image/gif" } })) as typeof fetch
  const file = await loadImage({ kind: "remote", url: "https://i.imgur.com/abc.gif" }, dir, okFetch)
  assert.equal(file.contentType, "image/gif")
  assert.equal(file.filename, "abc.gif")
  const htmlFetch = (async () => new Response("<html>", { headers: { "content-type": "text/html" } })) as typeof fetch
  await assert.rejects(loadImage({ kind: "remote", url: "https://x.com/a.png" }, dir, htmlFetch), /not an image/)
  const notFound = (async () => new Response("", { status: 404 })) as typeof fetch
  await assert.rejects(loadImage({ kind: "remote", url: "https://x.com/a.png" }, dir, notFound), /404/)
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./notion`, `./images` 모듈을 찾지 못한다.

- [ ] **Step 3: images.ts 구현**

```ts
import fs from "node:fs"
import path from "node:path"
import type { ImageSource } from "./markdown"

export type LoadedFile = { filename: string; contentType: string; data: Buffer }

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
}
const EXT_BY_TYPE = Object.fromEntries(Object.entries(TYPES).map(([e, t]) => [t, e]))

export function resolveLocalFile(dir: string, src: string): string | undefined {
  let decoded = src
  try { decoded = decodeURIComponent(src) } catch {}
  for (const candidate of [src, decoded]) {
    const full = path.resolve(dir, candidate)
    if (fs.existsSync(full)) return full
    const parent = path.dirname(full)
    if (!fs.existsSync(parent)) continue
    const wanted = path.basename(full).normalize("NFC")
    const match = fs.readdirSync(parent).find((f) => f.normalize("NFC") === wanted)
    if (match) return path.join(parent, match)
  }
  return undefined
}

export async function loadImage(source: ImageSource, dir: string, fetchFn: typeof fetch = fetch): Promise<LoadedFile> {
  if (source.kind === "local") {
    const file = resolveLocalFile(dir, source.src)
    if (!file) throw new Error(`Local image not found: ${source.src}`)
    const contentType = TYPES[path.extname(file).toLowerCase()]
    if (!contentType) throw new Error(`Unsupported image type: ${file}`)
    return { filename: path.basename(file).normalize("NFC"), contentType, data: fs.readFileSync(file) }
  }
  const res = await fetchFn(source.url, {
    headers: { "User-Agent": "Mozilla/5.0 (legacy-blog-migration)" },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${source.url}`)
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim()
  if (!contentType.startsWith("image/")) throw new Error(`Remote file is not an image (${contentType}): ${source.url}`)
  const base = path.basename(new URL(source.url).pathname) || "image"
  const filename = path.extname(base) ? base : `${base}${EXT_BY_TYPE[contentType] ?? ""}`
  return { filename, contentType, data: Buffer.from(await res.arrayBuffer()) }
}
```

- [ ] **Step 4: notion.ts 구현**

```ts
import { APIErrorCode, APIResponseError, Client } from "@notionhq/client"
import type { Block } from "./blocks"
import type { LoadedFile } from "./images"

export type Run = <T>(fn: () => Promise<T>) => Promise<T>
export type NotionApi = Pick<Client, "blocks" | "pages" | "fileUploads" | "databases">

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function isRetryable(err: unknown): boolean {
  if (APIResponseError.isAPIResponseError(err)) {
    return err.code === APIErrorCode.RateLimited || err.code === APIErrorCode.ConflictError || err.status >= 500
  }
  return (err as { code?: string })?.code === "notionhq_client_request_timeout"
}

// Notion allows ~3 requests/second on average. Run every call through one
// serial queue and back off exponentially on rate limits and transient errors.
export function createThrottle({
  minIntervalMs = 350, maxRetries = 6, baseDelayMs = 1000, sleep = defaultSleep,
}: { minIntervalMs?: number; maxRetries?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Run {
  let last = 0
  let chain: Promise<unknown> = Promise.resolve()
  return <T>(fn: () => Promise<T>) => {
    const task = chain.then(async () => {
      for (let attempt = 0; ; attempt++) {
        const wait = last + minIntervalMs - Date.now()
        if (wait > 0) await sleep(wait)
        last = Date.now()
        try {
          return await fn()
        } catch (err) {
          if (attempt >= maxRetries || !isRetryable(err)) throw err
          await sleep(baseDelayMs * 2 ** attempt)
        }
      }
    })
    chain = task.catch(() => undefined)
    return task
  }
}

// Tables must be created together with their rows; every other block gets its
// children appended in a follow-up call, which keeps each request within
// Notion's two-level nesting limit.
const INLINE_CHILDREN = new Set(["table"])

const childrenOf = (b: Block): Block[] => b[b.type]?.children ?? []

function withoutChildren(b: Block): Block {
  if (INLINE_CHILDREN.has(b.type) || !b[b.type]?.children) return b
  const { children, ...rest } = b[b.type]
  return { ...b, [b.type]: rest }
}

export async function appendBlocks(api: NotionApi, run: Run, parentId: string, blocks: Block[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 100) {
    const chunk = blocks.slice(i, i + 100)
    const res = await run(() =>
      api.blocks.children.append({ block_id: parentId, children: chunk.map(withoutChildren) as any })
    )
    if (res.results.length !== chunk.length) {
      throw new Error(`Notion returned ${res.results.length} blocks for ${chunk.length} appended`)
    }
    for (let j = 0; j < chunk.length; j++) {
      const children = childrenOf(chunk[j])
      if (children.length && !INLINE_CHILDREN.has(chunk[j].type)) {
        await appendBlocks(api, run, res.results[j].id, children)
      }
    }
  }
}

export async function clearChildren(api: NotionApi, run: Run, blockId: string): Promise<void> {
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const res = await run(() => api.blocks.children.list({ block_id: blockId, start_cursor: cursor }))
    ids.push(...res.results.map((b) => b.id))
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)
  for (const id of ids) await run(() => api.blocks.delete({ block_id: id }))
}

export async function uploadFile(api: NotionApi, run: Run, file: LoadedFile): Promise<string> {
  const created = await run(() =>
    api.fileUploads.create({ mode: "single_part", filename: file.filename, content_type: file.contentType })
  )
  await run(() =>
    api.fileUploads.send({
      file_upload_id: created.id,
      file: { filename: file.filename, data: new Blob([file.data], { type: file.contentType }) },
    })
  )
  return created.id
}

export async function listDatabasePages(api: NotionApi, run: Run, databaseId: string) {
  const pages: { id: string; slug: string; authorId?: string }[] = []
  let cursor: string | undefined
  do {
    const res: any = await run(() => api.databases.query({ database_id: databaseId, start_cursor: cursor }))
    for (const page of res.results) {
      const slug = (page.properties?.slug?.rich_text ?? []).map((t: any) => t.plain_text).join("")
      pages.push({ id: page.id, slug, authorId: page.properties?.author?.people?.[0]?.id })
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)
  return pages
}

export async function ensureSeriesProperty(api: NotionApi, run: Run, databaseId: string): Promise<void> {
  const db: any = await run(() => api.databases.retrieve({ database_id: databaseId }))
  if (db.properties?.series) return
  await run(() => api.databases.update({ database_id: databaseId, properties: { series: { select: {} } } as any }))
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS.
- `APIResponseError` 생성자 인자가 맞지 않아 타입 에러나 런타임 에러가 나면 `node_modules/@notionhq/client/build/src/errors.d.ts`의 생성자 시그니처를 확인한다.
- 그 시그니처에 맞게 테스트의 헬퍼(`rateLimited` 등)만 고친다.

- [ ] **Step 6: 커밋**

```bash
git add scripts/migrate-legacy/notion.ts scripts/migrate-legacy/notion.test.ts scripts/migrate-legacy/images.ts scripts/migrate-legacy/images.test.ts
git commit -m "feat: 이관용 노션 API 계층(요청 제한, 블록 추가, 파일 업로드)과 이미지 로더 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 글 하나 이관 흐름 (속성, 캐시, 재실행)

**Files:**
- Create: `scripts/migrate-legacy/properties.ts`, `scripts/migrate-legacy/cache.ts`, `scripts/migrate-legacy/migrate.ts`
- Test: `scripts/migrate-legacy/migrate.test.ts`

**Interfaces:**
- Consumes:
  - `LegacyPost` (Task 2)
  - `preprocessMarkdown` (Task 4)
  - `markdownToNotionBlocks`, `postprocessBlocks`, `noticeCallout`, `missingImageBlock`, `uploadedImageBlock` (Task 5)
  - `appendBlocks`, `clearChildren`, `uploadFile`, `Run`, `NotionApi` (Task 6)
  - `loadImage` (Task 6)
- Produces:
  - `type PageProps = { title: string; date: string; slug: string; summary: string; category: string; tags: string[]; series?: string; status: string; authorId?: string; thumbnailUploadId?: string }`
  - `buildProperties(p: PageProps): Record<string, any>`
  - `type PageCache = Record<string, { pageId: string; slug: string; state: "creating" | "done" }>`
  - `readCache(file: string): PageCache`
  - `writeCache(file: string, cache: PageCache): void`
  - `type PlannedPost = { post: LegacyPost; props: Omit<PageProps, "thumbnailUploadId"> }`
  - `migratePost(deps: { api: NotionApi; run: Run; databaseId: string; cache: PageCache; saveCache: () => void; withNotice: boolean; force: boolean; loadImage?: typeof loadImage; log: (msg: string) => void }, planned: PlannedPost): Promise<{ pageId: string; skipped: boolean; missingImages: string[] }>`

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/migrate-legacy/migrate.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildProperties } from "./properties"
import { migratePost, type PlannedPost } from "./migrate"
import type { PageCache } from "./cache"
import { createThrottle } from "./notion"

const run = createThrottle({ minIntervalMs: 0, sleep: async () => {} })

function fakeApi(opts: { failAppendOnce?: boolean } = {}) {
  const log: string[] = []
  let failNext = opts.failAppendOnce ?? false
  let n = 0
  const api: any = {
    pages: {
      create: async (args: any) => { log.push(`create:${args.properties.slug.rich_text[0].text.content}`); return { id: "page1" } },
      update: async (args: any) => { log.push(`update:${args.page_id}`); return {} },
    },
    blocks: {
      children: {
        append: async ({ children }: any) => {
          if (failNext) { failNext = false; throw new Error("network down") }
          log.push(`append:${children.length}`)
          return { results: children.map(() => ({ id: `b${n++}` })) }
        },
        list: async () => ({ results: [{ id: "old" }], has_more: false, next_cursor: null }),
      },
      delete: async () => { log.push("delete") },
    },
    fileUploads: {
      create: async () => ({ id: `fu${n++}` }),
      send: async () => { log.push("upload") },
    },
  }
  return { api, log }
}

const planned: PlannedPost = {
  post: {
    legacyPath: "Java/a", dir: "/nowhere", title: "A", date: "2023-10-08", description: "d",
    section: "지식 공유", category: "Java", tags: [], body: "hello\n\n![x](missing.png)",
  },
  props: { title: "A", date: "2023-10-08", slug: "a", summary: "d", category: "💻 개발", tags: ["Java"], status: "PublicOnDetail" },
}

function deps(api: any, cache: PageCache, extra: Partial<Parameters<typeof migratePost>[0]> = {}) {
  return {
    api, run, databaseId: "db", cache, saveCache: () => {}, withNotice: false, force: false,
    loadImage: async () => { throw new Error("Local image not found: missing.png") },
    log: () => {}, ...extra,
  }
}

test("buildProperties maps every field to Notion property shapes", () => {
  const props = buildProperties({ ...planned.props, series: "기술 부채", authorId: "u1", thumbnailUploadId: "fu9" })
  assert.equal(props.title.title[0].text.content, "A")
  assert.deepEqual(props.date, { date: { start: "2023-10-08" } })
  assert.equal(props.slug.rich_text[0].text.content, "a")
  assert.deepEqual(props.category, { select: { name: "💻 개발" } })
  assert.deepEqual(props.tags, { multi_select: [{ name: "Java" }] })
  assert.deepEqual(props.series, { select: { name: "기술 부채" } })
  assert.deepEqual(props.type, { select: { name: "Post" } })
  assert.deepEqual(props.status, { select: { name: "PublicOnDetail" } })
  assert.deepEqual(props.author, { people: [{ id: "u1" }] })
  assert.deepEqual(props.thumbnail.files[0].file_upload, { id: "fu9" })
  assert.equal("URL" in props, false)
})

test("buildProperties omits empty optional fields", () => {
  const props = buildProperties(planned.props)
  assert.equal("series" in props, false)
  assert.equal("author" in props, false)
  assert.equal("thumbnail" in props, false)
})

test("new post: creates page, appends body, reports missing images, marks done", async () => {
  const { api, log } = fakeApi()
  const cache: PageCache = {}
  const result = await migratePost(deps(api, cache), planned)
  assert.deepEqual(log, ["create:a", "append:2"])
  assert.deepEqual(result.missingImages, ["missing.png"])
  assert.deepEqual(cache["Java/a"], { pageId: "page1", slug: "a", state: "done" })
})

test("done post is skipped unless forced", async () => {
  const { api, log } = fakeApi()
  const cache: PageCache = { "Java/a": { pageId: "page1", slug: "a", state: "done" } }
  assert.equal((await migratePost(deps(api, cache), planned)).skipped, true)
  assert.deepEqual(log, [])
  await migratePost(deps(api, cache, { force: true }), planned)
  assert.deepEqual(log, ["update:page1", "delete", "append:2"])
})

test("interrupted post is refilled on the same page, not duplicated", async () => {
  const { api, log } = fakeApi({ failAppendOnce: true })
  const cache: PageCache = {}
  await assert.rejects(migratePost(deps(api, cache), planned), /network down/)
  assert.equal(cache["Java/a"].state, "creating")
  await migratePost(deps(api, cache), planned)
  assert.deepEqual(log, ["create:a", "update:page1", "delete", "append:2"])
  assert.equal(cache["Java/a"].state, "done")
})

test("notice callout is prepended when requested", async () => {
  const { api } = fakeApi()
  const appended: any[] = []
  api.blocks.children.append = async ({ children }: any) => {
    appended.push(...children)
    return { results: children.map((_: any, i: number) => ({ id: `x${i}` })) }
  }
  await migratePost(deps(api, {}, { withNotice: true }), planned)
  assert.equal(appended[0].type, "callout")
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./properties`, `./migrate`, `./cache` 모듈을 찾지 못한다.

- [ ] **Step 3: properties.ts 구현**

```ts
export type PageProps = {
  title: string
  date: string
  slug: string
  summary: string
  category: string
  tags: string[]
  series?: string
  status: string
  authorId?: string
  thumbnailUploadId?: string
}

const richText = (content: string) => [{ type: "text", text: { content } }]

// Property names match the blog database exactly. URL, 발행하기, 편집모드 and
// updatedAt are deliberately never written.
export function buildProperties(p: PageProps): Record<string, any> {
  const props: Record<string, any> = {
    title: { title: richText(p.title) },
    date: { date: { start: p.date } },
    slug: { rich_text: richText(p.slug) },
    summary: { rich_text: p.summary ? richText(p.summary) : [] },
    category: { select: { name: p.category } },
    tags: { multi_select: p.tags.map((name) => ({ name })) },
    type: { select: { name: "Post" } },
    status: { select: { name: p.status } },
  }
  if (p.series) props.series = { select: { name: p.series } }
  if (p.authorId) props.author = { people: [{ id: p.authorId }] }
  if (p.thumbnailUploadId) {
    props.thumbnail = { files: [{ type: "file_upload", file_upload: { id: p.thumbnailUploadId }, name: "thumbnail" }] }
  }
  return props
}
```

- [ ] **Step 4: cache.ts 구현**

```ts
import fs from "node:fs"
import path from "node:path"

export type PageCache = Record<string, { pageId: string; slug: string; state: "creating" | "done" }>

export function readCache(file: string): PageCache {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {}
}

export function writeCache(file: string, cache: PageCache): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2))
  fs.renameSync(tmp, file)
}
```

- [ ] **Step 5: migrate.ts 구현**

```ts
import type { LegacyPost } from "./legacy"
import type { PageCache } from "./cache"
import { buildProperties, type PageProps } from "./properties"
import { preprocessMarkdown } from "./markdown"
import {
  markdownToNotionBlocks, missingImageBlock, noticeCallout, postprocessBlocks, uploadedImageBlock,
} from "./blocks"
import { appendBlocks, clearChildren, uploadFile, type NotionApi, type Run } from "./notion"
import { loadImage as defaultLoadImage } from "./images"

export type PlannedPost = { post: LegacyPost; props: Omit<PageProps, "thumbnailUploadId"> }

type Deps = {
  api: NotionApi
  run: Run
  databaseId: string
  cache: PageCache
  saveCache: () => void
  withNotice: boolean
  force: boolean
  loadImage?: typeof defaultLoadImage
  log: (msg: string) => void
}

export async function migratePost(deps: Deps, { post, props }: PlannedPost) {
  const { api, run, cache, log } = deps
  const loadImage = deps.loadImage ?? defaultLoadImage
  const cached = cache[post.legacyPath]
  if (cached?.state === "done" && !deps.force) {
    log(`skip (already migrated): ${post.legacyPath}`)
    return { pageId: cached.pageId, skipped: true, missingImages: [] as string[] }
  }

  const missingImages: string[] = []
  const upload = async (source: Parameters<typeof loadImage>[0]) => {
    try {
      return await uploadFile(api, run, await loadImage(source, post.dir))
    } catch (err) {
      const label = source.kind === "local" ? source.src : source.url
      missingImages.push(label)
      log(`image failed: ${label} (${(err as Error).message})`)
      return undefined
    }
  }

  // Uploads must be attached within an hour, so upload right before writing.
  const thumbnailUploadId = post.thumbnailImg
    ? await upload({ kind: "local", src: post.thumbnailImg })
    : undefined
  const properties = buildProperties({ ...props, thumbnailUploadId })

  let pageId: string
  if (cached) {
    pageId = cached.pageId
    await run(() => api.pages.update({ page_id: pageId, properties }))
    await clearChildren(api, run, pageId)
  } else {
    const page = await run(() =>
      api.pages.create({ parent: { database_id: deps.databaseId }, properties })
    )
    pageId = page.id
  }
  cache[post.legacyPath] = { pageId, slug: props.slug, state: "creating" }
  deps.saveCache()

  const { markdown, images } = preprocessMarkdown(post.body)
  const blocks = await postprocessBlocks(markdownToNotionBlocks(markdown), async (i) => {
    const id = await upload(images[i])
    const source = images[i]
    return id ? uploadedImageBlock(id) : missingImageBlock(source.kind === "local" ? source.src : source.url)
  })
  await appendBlocks(api, run, pageId, deps.withNotice ? [noticeCallout(), ...blocks] : blocks)

  cache[post.legacyPath] = { pageId, slug: props.slug, state: "done" }
  deps.saveCache()
  log(`migrated: ${post.legacyPath} -> ${props.slug}${missingImages.length ? ` (${missingImages.length} missing images)` : ""}`)
  return { pageId, skipped: false, missingImages }
}
```

참고: 테스트의 `post.thumbnailImg`는 비어 있어서 썸네일 업로드가 일어나지 않는다. 그래서 기대 로그에 `upload`가 없다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add scripts/migrate-legacy/properties.ts scripts/migrate-legacy/cache.ts scripts/migrate-legacy/migrate.ts scripts/migrate-legacy/migrate.test.ts
git commit -m "feat: 글 하나를 노션 페이지로 이관하는 흐름과 재실행 캐시 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CLI, 매핑 보고서, dry-run

**Files:**
- Create: `scripts/migrate-legacy/index.ts`
- Test: `scripts/migrate-legacy/plan.test.ts`
- 생성물: `docs/legacy-mapping.md`, `scripts/migrate-legacy/url-map.json`

**Interfaces:**
- Consumes: Task 2~7의 모든 공개 함수
- Produces:
  - `planPosts(posts: LegacyPost[], takenSlugs: Set<string>): PlannedPost[]` (`index.ts`에서 export)
    - 전체 글의 태그 개수를 센 뒤 태그를 3개로 줄인다. 날짜 순서대로 slug를 정한다.
  - `renderMappingReport(planned: PlannedPost[]): string`
  - `buildUrlMap(planned: PlannedPost[]): Record<string, { title: string; slug: string; legacyUrl: string; newUrl: string }>`
  - CLI 옵션
    - `--pilot` | `--only <legacyPath>`(반복 가능) | `--all`
    - `--dry-run`, `--force`
    - `--all`은 이 단계에서 막는다. 일괄 이관은 2단계 계획에서 연다.

- [ ] **Step 1: 실패하는 테스트 작성**

`scripts/migrate-legacy/plan.test.ts`:
```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildUrlMap, planPosts, renderMappingReport } from "./index"
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run migrate:test`
Expected: FAIL. `./index`에 `planPosts`가 없다.

- [ ] **Step 3: index.ts 구현**

```ts
import fs from "node:fs"
import path from "node:path"
import { Client } from "@notionhq/client"
import {
  CACHE_DIR, GATSBY_NOTICE_TITLES, LEGACY_CONTENT, MIGRATION_STATUS, PILOT_PATHS, REPO_ROOT, SITE_URL,
} from "./config"
import { legacyUrl, loadLegacyPosts, type LegacyPost } from "./legacy"
import { assignSlugs } from "./slug"
import { capTags, countTags, mapCategory, mapRawTags } from "./taxonomy"
import { preprocessMarkdown } from "./markdown"
import { markdownToNotionBlocks } from "./blocks"
import { createThrottle, ensureSeriesProperty, listDatabasePages } from "./notion"
import { readCache, writeCache } from "./cache"
import { migratePost, type PlannedPost } from "./migrate"

export function planPosts(posts: LegacyPost[], takenSlugs: Set<string>): PlannedPost[] {
  const mapped = posts.map((p) => {
    const m = mapRawTags(p.category, p.tags)
    if (m.unknown.length) throw new Error(`Unknown tags in ${p.legacyPath}: ${m.unknown.join(", ")}`)
    return m
  })
  const counts = countTags(mapped.map((m) => m.tags))
  const slugs = assignSlugs(posts, takenSlugs)
  return posts.map((post, i) => ({
    post,
    props: {
      title: post.title,
      date: post.date,
      slug: slugs.get(post.legacyPath)!,
      summary: post.description,
      category: mapCategory(post.section),
      tags: capTags(mapped[i].tags, counts),
      series: mapped[i].series,
      status: MIGRATION_STATUS,
    },
  }))
}

export function buildUrlMap(planned: PlannedPost[]) {
  return Object.fromEntries(
    planned.map(({ post, props }) => [
      post.legacyPath,
      {
        title: post.title,
        slug: props.slug,
        legacyUrl: legacyUrl(post.legacyPath),
        newUrl: `${SITE_URL}/${encodeURIComponent(props.slug)}`,
      },
    ])
  )
}

export function renderMappingReport(planned: PlannedPost[]): string {
  const rows = planned.map(
    ({ post, props }) =>
      `| ${props.date} | ${post.title.replace(/\|/g, "\\|")} | \`${props.slug}\` | ${props.category} | ${props.tags.join(", ")} | ${props.series ?? ""} |`
  )
  return [
    "# 레거시 글 이관 매핑 (자동 생성)",
    "",
    "> `npm run migrate -- --dry-run`이 생성한다. 직접 고치지 말고 `scripts/migrate-legacy/taxonomy.ts`를 고친 뒤 다시 생성한다.",
    "",
    "| 날짜 | 제목 | slug | category | tags | series |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n")
}

function parseArgs(argv: string[]) {
  const only: string[] = []
  const flags = new Set<string>()
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--only") only.push(argv[++i].normalize("NFC"))
    else flags.add(argv[i])
  }
  return { only, pilot: flags.has("--pilot"), all: flags.has("--all"), dryRun: flags.has("--dry-run"), force: flags.has("--force") }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.all) throw new Error("--all is disabled until the pilot is approved (phase 2 plan).")
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_PAGE_ID
  if (!token || !databaseId) throw new Error("NOTION_TOKEN and NOTION_PAGE_ID must be set (.env).")

  const api = new Client({ auth: token })
  const run = createThrottle()
  const cacheFile = path.join(CACHE_DIR, "pages.json")
  const cache = readCache(cacheFile)
  const migratedIds = new Set(Object.values(cache).map((c) => c.pageId.replace(/-/g, "")))

  const dbPages = await listDatabasePages(api, run, databaseId)
  const takenSlugs = new Set(
    dbPages.filter((p) => !migratedIds.has(p.id.replace(/-/g, ""))).map((p) => p.slug).filter(Boolean)
  )
  const authorId = dbPages.find((p) => p.authorId)?.authorId

  const posts = loadLegacyPosts(LEGACY_CONTENT)
  const planned = planPosts(posts, takenSlugs)
  fs.writeFileSync(path.join(REPO_ROOT, "docs/legacy-mapping.md"), renderMappingReport(planned))
  fs.writeFileSync(path.join(__dirname, "url-map.json"), JSON.stringify(buildUrlMap(planned), null, 2) + "\n")
  console.log(`planned ${planned.length} posts; wrote docs/legacy-mapping.md and url-map.json`)

  const wanted = new Set(args.pilot ? PILOT_PATHS : args.only)
  const selected = planned.filter((p) => wanted.has(p.post.legacyPath))
  const missing = [...wanted].filter((w) => !selected.some((p) => p.post.legacyPath === w))
  if (missing.length) throw new Error(`Unknown legacy paths: ${missing.join(", ")}`)

  if (args.dryRun) {
    const dryDir = path.join(CACHE_DIR, "dry")
    fs.mkdirSync(dryDir, { recursive: true })
    for (const { post, props } of selected) {
      const { markdown, images } = preprocessMarkdown(post.body)
      const file = path.join(dryDir, `${props.slug}.json`)
      fs.writeFileSync(file, JSON.stringify({ props, images, blocks: markdownToNotionBlocks(markdown) }, null, 2))
      console.log(`dry-run: ${post.legacyPath} -> ${file}`)
    }
    return
  }

  await ensureSeriesProperty(api, run, databaseId)
  const report: Record<string, string[]> = {}
  for (const item of selected) {
    const result = await migratePost(
      {
        api, run, databaseId, cache, force: args.force,
        saveCache: () => writeCache(cacheFile, cache),
        withNotice: GATSBY_NOTICE_TITLES.includes(item.post.title),
        log: (m) => console.log(m),
      },
      { ...item, props: { ...item.props, authorId } as PlannedPost["props"] }
    )
    if (result.missingImages.length) report[item.post.legacyPath] = result.missingImages
    console.log(`  ${SITE_URL}/${encodeURIComponent(item.props.slug)}`)
  }
  if (Object.keys(report).length) {
    fs.writeFileSync(path.join(CACHE_DIR, "missing-images.json"), JSON.stringify(report, null, 2))
    console.log(`missing images recorded in ${path.join(CACHE_DIR, "missing-images.json")}`)
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
```

`migratePost`의 `props` 타입은 `Omit<PageProps, "thumbnailUploadId">`이다. 그래서 `authorId`를 그대로 넘길 수 있다. 위의 캐스트는 `tsx`가 타입 검사를 하지 않으므로 의미 표시용이다.

`.env` 로딩:
- `tsx`는 `.env`를 자동으로 읽지 않는다.
- `package.json`의 `migrate` 스크립트를 `"tsx --env-file=.env scripts/migrate-legacy/index.ts"`로 바꾼다. tsx는 Node의 `--env-file`을 그대로 넘긴다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run migrate:test`
Expected: PASS.

- [ ] **Step 5: 실제 데이터로 dry-run**

Run: `npm run migrate -- --pilot --dry-run`
Expected
- `planned 200 posts`가 출력된다.
- dry-run 파일 2개가 생긴다.
- `docs/legacy-mapping.md`에 200행이 생긴다.

다음도 확인한다.
- `grep -c "^| 20" docs/legacy-mapping.md` → `200`
- dry 파일 두 개의 `images` 개수가 원문 이미지 수와 같다.
  - Transaction 글: imgur 이미지 수(`grep -o "imgur" <원문> | wc -l`)와 같아야 한다.
  - 3주차 글: 로컬 이미지 5개가 있어야 한다.

- [ ] **Step 6: 커밋**

```bash
git add package.json scripts/migrate-legacy/index.ts scripts/migrate-legacy/plan.test.ts docs/legacy-mapping.md scripts/migrate-legacy/url-map.json
git commit -m "feat: 이관 CLI와 매핑 보고서, url-map, dry-run 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: 사용자 검토 요청 (차단 지점)**

시범 이관 전에 사용자에게 `docs/legacy-mapping.md`의 태그와 시리즈 배정을 훑어봐 달라고 요청한다. 피드백이 있으면 `taxonomy.ts`를 고치고 다시 생성한다.

---

### Task 9: 시범 이관과 확인

**Files:**
- 코드 변경 없음. 튜닝이 필요하면 해당 모듈을 테스트와 함께 고친다.

- [ ] **Step 1: 시범 이관 실행**

Run: `npm run migrate -- --pilot`
Expected
- `migrated: Java/[DB] Transaction과 Spring Transaction -> db-transaction과-spring-transaction`
- `migrated: 우테코 5기/[기술부채] 우테코 5기 레벨2 - 3주차 -> 기술부채-우테코-5기-레벨2-3주차`
- 새 주소 2개가 출력되고, `missing images`는 없다.

실패하면 다음 순서로 처리한다.
1. 노션 에러 메시지를 읽는다.
2. 원인이 되는 블록 구조를 dry-run JSON에서 찾는다.
3. 그 경우를 재현하는 테스트를 해당 모듈 테스트에 추가하고 고친다.
4. `npm run migrate -- --pilot --force`로 다시 실행한다.

- [ ] **Step 2: 노션에서 확인**
- DB에 새 페이지 2개가 `PublicOnDetail`, `💻 개발`로 생겼는지 확인한다.
- 3주차 글에 `series = 기술 부채`가 들어 있고, 썸네일이 보이는지 확인한다.

- [ ] **Step 3: 로컬 블로그에서 렌더링 확인**

Run:
```bash
rm -rf .next && (npx next dev -p 3456 > /tmp/dev.log 2>&1 &) ; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3456/ && break; sleep 1; done
for s in "db-transaction과-spring-transaction" "기술부채-우테코-5기-레벨2-3주차"; do
  u="http://localhost:3456/$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$s")"
  curl -s "$u" -o /tmp/p.html -w "%{http_code} " ; grep -o 'class="notion-asset-wrapper' /tmp/p.html | wc -l; grep -c "notion-table" /tmp/p.html
done
curl -s http://localhost:3456/ | grep -c "db-transaction"   # 0: 목록에 보이지 않아야 함
curl -s http://localhost:3456/sitemap.xml | grep -c "db-transaction"   # 0
```
Expected
- 두 글 모두 `200`이 나온다.
- 이미지 래퍼 수가 원문 이미지 수와 같다.
- 표가 1개 이상 있다.
- 목록과 사이트맵에는 0개가 나온다.

- [ ] **Step 4: 사용자 육안 검수 (차단 지점)**

사용자에게 로컬 주소 2개와 원본 레거시 글 주소 2개를 나란히 주고 다음 항목을 확인해 달라고 요청한다.
- 제목 구조, 코드 하이라이트, 표, 인용, 이미지 크기
- 줄바꿈: 한 줄 줄바꿈이 노션에서 줄바꿈으로 보이는 문제(스펙 6.2)
- 중첩 목록

피드백은 항목마다 다음 순서로 처리한다.
1. 테스트를 추가한다.
2. 수정한다.
3. `--pilot --force`로 다시 올린다.
4. 다시 확인한다.

- [ ] **Step 5: 2차 시범 (수식/mermaid)**

```bash
grep -l '^\$\$\|```mermaid' -r ../amaran-th.github.io/content/blog --include=index.md
```
- 위 명령으로 수식 블록이나 mermaid가 있는 글을 찾는다.
- 그중 제외 대상이 아닌 글 하나를 `npm run migrate -- --only "<legacyPath>"`로 올리고, Step 3~4처럼 확인한다.

- [ ] **Step 6: 배포 사이트 확인 후 1단계 마무리**
- 시범 이관이 승인되면 `main`을 push한다. Task 1~8의 커밋이 올라간다.
- 배포 사이트에서 시범 글 slug 주소가 열리는지(ISR fallback) 확인한다.
- 사이트맵에 시범 글이 없는지 확인한다.
- 튜닝 결과와 남은 이슈를 스펙 문서 6.2절 표에 반영하고 커밋한다.
