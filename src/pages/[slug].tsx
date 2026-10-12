import Detail from "src/routes/Detail"
import { filterPosts } from "src/libs/utils/notion"
import { CONFIG } from "site.config"
import { NextPageWithLayout } from "../types"
import CustomError from "src/routes/Error"
import { getRecordMap, getPosts } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import { GetStaticProps } from "next"
import Head from "next/head"
import { queryKey } from "src/constants/queryKey"
import { QueryClient, dehydrate } from "@tanstack/react-query"
import usePostQuery from "src/hooks/usePostQuery"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"
import { findAdjacentPosts } from "src/libs/feed/adjacent"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

export const getStaticPaths = async () => {
  const posts = await getPosts()
  const filteredPost = filterPosts(posts, filter)

  return {
    paths: filteredPost.map((row) => `/${row.slug}`),
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug

  const posts = await getPosts()
  // A fresh client per page: the shared module-level client kept every post
  // rendered earlier in the same process and dehydrated all of them into this
  // page's props.
  const queryClient = new QueryClient()

  const detailPosts = filterPosts(posts, filter)
  const postDetail = detailPosts.find((t: any) => t.slug === slug)
  if (!postDetail) return { notFound: true }
  const recordMap = await getRecordMap(postDetail.id)

  const adjacent =
    postDetail.type[0] === "Post" ? findAdjacentPosts(filterPosts(posts), postDetail) : {}

  await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => ({
    ...postDetail,
    recordMap,
    adjacent,
  }))

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: CONFIG.revalidateTime,
  }
}

const DetailPage: NextPageWithLayout = () => {
  const post = usePostQuery()

  if (!post) return <CustomError />

  const image =
    post.thumbnail ||
    `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(post.title)}.png`

  const date = post.date?.start_date || post.createdTime || ""
  const isArticle = post.type[0] === "Post"

  const meta = {
    title: post.title,
    date: new Date(date).toISOString(),
    image: image,
    description: post.summary || "",
    type: isArticle ? "article" : "website",
    url: `${CONFIG.link}/${encodeURIComponent(post.slug)}`,
  } as const

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    author: {
      "@type": "Person",
      name: CONFIG.profile.name,
      url: CONFIG.link,
    },
    image: meta.image,
    url: meta.url,
    mainEntityOfPage: meta.url,
    inLanguage: CONFIG.lang,
  }

  return (
    <>
      <MetaConfig {...meta} />
      {isArticle && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(blogPostingJsonLd),
            }}
          />
        </Head>
      )}
      <Detail />
    </>
  )
}

DetailPage.getLayout = (page) => {
  return <>{page}</>
}

export default DetailPage
