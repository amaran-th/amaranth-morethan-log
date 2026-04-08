import { getPosts } from "../apis/notion-client/getPosts"
import { CONFIG } from "site.config"
import { GetServerSideProps } from "next"

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await getPosts()

  const urls = [
    { loc: CONFIG.link, priority: "1.0" },
    ...posts.map((post) => ({
      loc: `${CONFIG.link}/${post.slug}`,
      priority: "0.7",
    })),
  ]

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
  res.write(sitemap)
  res.end()

  return { props: {} }
}

const SitemapPage = () => null
export default SitemapPage
