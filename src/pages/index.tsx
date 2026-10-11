import { dehydrate } from "@tanstack/react-query"
import { GetStaticProps } from "next"
import Head from "next/head"
import MetaConfig from "src/components/MetaConfig"
import { queryKey } from "src/constants/queryKey"
import { queryClient } from "src/libs/react-query"
import { filterPosts } from "src/libs/utils/notion"
import Feed from "src/routes/Feed"
import { CONFIG } from "../../site.config"
import { getPosts } from "../apis"
import { NextPageWithLayout } from "../types"

export const getStaticProps: GetStaticProps = async () => {
  const posts = filterPosts(await getPosts())
  await queryClient.prefetchQuery(queryKey.posts(), () => posts)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: CONFIG.revalidateTime,
  }
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: CONFIG.blog.title,
  alternateName: [`${CONFIG.profile.name} 블로그`, CONFIG.profile.name],
  url: `${CONFIG.link}/`,
}

const FeedPage: NextPageWithLayout = () => {
  const meta = {
    title: CONFIG.blog.title,
    description: CONFIG.blog.description,
    image: CONFIG.blog.image,
    type: "website",
    url: CONFIG.link,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </Head>
      <Feed />
    </>
  )
}

export default FeedPage
