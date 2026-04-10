import { GetServerSideProps } from "next"
import { CONFIG } from "site.config"
import { getPosts } from "../apis/notion-client/getPosts"

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let urls: { loc: string; priority: string }[] = [
    { loc: CONFIG.link, priority: "1.0" },
  ]

  try {
    const posts = await getPosts()
    const postUrls = posts
      .filter((post) => post.slug && post.slug.trim() !== "")
      .map((post) => ({
        loc: `${CONFIG.link}/${encodeURIComponent(post.slug)}`,
        priority: "0.7",
      }))
    urls = [...urls, ...postUrls]
  } catch (e) {
    console.error("sitemap: getPosts failed", e)
    // Return a minimal sitemap with just the root URL on error
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

  res.setHeader("Content-Type", "application/xml")
  // Cache on Vercel CDN for 5 min, serve stale up to 10 min while revalidating
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  )
  res.write(sitemap)
  res.end()

  return { props: {} }
}

const SitemapPage = () => null
export default SitemapPage
