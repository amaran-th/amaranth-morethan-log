import Head from "next/head"
import { CONFIG } from "site.config"
import MetaConfig from "src/components/MetaConfig"
import { categorySlug, feedPath } from "src/libs/feed"
import { FeedProps } from "src/libs/feed/buildFeed"
import Feed from "src/routes/Feed"
import { NextPageWithLayout } from "src/types"

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: CONFIG.blog.title,
  alternateName: [`${CONFIG.profile.name} 블로그`, CONFIG.profile.name],
  url: `${CONFIG.link}/`,
}

function feedTitle({ filter, page }: FeedProps) {
  const parts = [
    filter.tag && `#${filter.tag}`,
    filter.series && `${filter.series} 시리즈`,
    filter.category && categorySlug(filter.category),
  ].filter(Boolean)
  const base = parts.length ? parts.join(" · ") : undefined
  if (page > 1) return `${base ?? "전체 글"} - ${page}페이지`
  return base ?? CONFIG.blog.title
}

const FeedPage: NextPageWithLayout<FeedProps> = (props) => {
  const path = feedPath(props.filter, props.page)
  const isHome = path === "/"
  return (
    <>
      <MetaConfig
        title={feedTitle(props)}
        description={CONFIG.blog.description}
        image={CONFIG.blog.image}
        type="website"
        url={isHome ? CONFIG.link : `${CONFIG.link}${path}`}
      />
      {isHome && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          />
        </Head>
      )}
      <Feed {...props} />
    </>
  )
}

export default FeedPage
