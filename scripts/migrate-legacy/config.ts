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

// Thumbnails whose frontmatter path does not match the file in the folder
// (broken on the legacy blog too); keyed by legacyPath.
export const THUMBNAIL_FIXES: Record<string, string> = {
  "React/SSR(Server Side Rendering)과 CSR(Client Side Rendering)": "./csr.png",
  "주저리주저리/[회고] 개발자 강연을 듣고 '나'를 탐구하는 시간 갖기": "./비온뒤맑음.png",
}
