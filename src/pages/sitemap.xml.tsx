import { GetServerSideProps } from "next"
import { CONFIG } from "site.config"
import { getPosts } from "../apis/notion-client/getPosts"
import { filterPosts } from "src/libs/utils/notion/filterPosts"
import { feedPath } from "src/libs/feed"

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await getPosts()
  // Only list posts that are publicly listed; PublicOnDetail and Private posts
  // (e.g. migration drafts) must not be advertised to crawlers.
  const validPosts = filterPosts(posts).filter(
    (post) => post.slug && post.slug.trim() !== ""
  )

  // First page of every category, tag and series list; later pages are reached by
  // following the pagination links.
  const listPaths = [
    ...new Set(validPosts.flatMap((post) => post.category ?? [])),
  ]
    .map((category) => feedPath({ category }, 1))
    .concat(
      [...new Set(validPosts.flatMap((post) => post.tags ?? []))].map((tag) =>
        feedPath({ tag }, 1)
      )
    )
    .concat(
      [...new Set(validPosts.flatMap((post) => post.series ?? []))].map(
        (series) => feedPath({ series }, 1)
      )
    )

  const urls = [
    `<url>
      <loc>${CONFIG.link}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>`,
    ...validPosts.map(
      (post) => `<url>
        <loc>${CONFIG.link}/${encodeURIComponent(post.slug)}</loc>
        <lastmod>${new Date(
          post.date?.start_date || post.createdTime
        ).toISOString()}</lastmod>
      </url>`
    ),
    ...listPaths.map(
      (path) => `<url>
        <loc>${CONFIG.link}${path}</loc>
      </url>`
    ),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("")}
  </urlset>`

  res.setHeader("Content-Type", "application/xml")
  // Building the sitemap queries Notion, which is slow and sometimes fails or
  // rate-limits. Cache it on the CDN and keep serving the last good copy while
  // it refreshes, so crawlers don't hit a 500 when Notion is having trouble.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  )

  res.end(sitemap) // 🔥 write 제거

  return { props: {} }
}

const SitemapPage = () => null
export default SitemapPage
