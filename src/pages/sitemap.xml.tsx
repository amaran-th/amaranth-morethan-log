import { GetServerSideProps } from "next"
import { getServerSideSitemap, ISitemapField } from "next-sitemap"
import { CONFIG } from "site.config"
import { getPosts } from "../apis/notion-client/getPosts"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const posts = await getPosts()
  const dynamicPaths = posts
    .filter((post) => post.slug && post.slug.trim() !== "")
    .map((post) => `${CONFIG.link}/${encodeURIComponent(post.slug)}`)

  // Create an array of fields, each with a loc and lastmod
  const fields: ISitemapField[] = dynamicPaths.map((path) => ({
    loc: path,
    lastmod: new Date().toISOString(),
    priority: 0.7,
    changefreq: "daily",
  }))

  // Include the site root separately
  fields.unshift({
    loc: CONFIG.link,
    lastmod: new Date().toISOString(),
    priority: 1.0,
    changefreq: "daily",
  })

  return getServerSideSitemap(ctx, fields)
}

// Default export to prevent next.js errors
export default () => {}
