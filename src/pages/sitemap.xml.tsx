import { GetServerSideProps } from "next"
import { CONFIG } from "site.config"
import { getPosts } from "../apis/notion-client/getPosts"

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await getPosts()
  const validPosts = posts.filter(
    (post) => post.slug && post.slug.trim() !== ""
  )

  const urls = [
    `<url>
      <loc>${CONFIG.link}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>`,
    ...validPosts.map(
      (post) => `<url>
        <loc>${CONFIG.link}/${encodeURIComponent(post.slug)}</loc>
        <lastmod>${new Date(post.date.start_date).toISOString()}</lastmod>
      </url>`
    ),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("")}
  </urlset>`

  res.setHeader("Content-Type", "application/xml")
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate")

  res.end(sitemap) // 🔥 write 제거

  return { props: {} }
}

const SitemapPage = () => null
export default SitemapPage
