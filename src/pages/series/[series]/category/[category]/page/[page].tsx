import FeedPage from "src/routes/Feed/FeedPage"
import { getFeedStaticPaths, getFeedStaticProps } from "src/routes/Feed/getFeedStaticProps"

export const getStaticPaths = getFeedStaticPaths
export const getStaticProps = getFeedStaticProps
export default FeedPage
