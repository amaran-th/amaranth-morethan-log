import { GetStaticPaths, GetStaticProps } from "next"
import { CONFIG } from "site.config"
import { getPosts } from "src/apis"
import { FeedParams, FeedProps, buildFeed } from "src/libs/feed/buildFeed"
import { filterPosts } from "src/libs/utils/notion"

// List pages are rendered on first request and then kept fresh by ISR, so a
// build does not read Notion once per list page.
export const getFeedStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: "blocking" })

export const getFeedStaticProps: GetStaticProps<FeedProps> = async ({ params }) => {
  const result = buildFeed(filterPosts(await getPosts()), (params ?? {}) as FeedParams)
  const revalidate = CONFIG.revalidateTime
  if (result.kind === "notFound") return { notFound: true, revalidate }
  if (result.kind === "redirect") return { redirect: { destination: result.destination, permanent: true } }
  return { props: result.props, revalidate }
}
