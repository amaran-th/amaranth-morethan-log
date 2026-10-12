import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "src/apis"
import { toCard } from "src/libs/feed"
import { filterPosts } from "src/libs/utils/notion"

// Every listed post's card, for client-side search across all pages.
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const cards = filterPosts(await getPosts()).map(toCard)
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400")
    res.status(200).json(cards)
  } catch {
    res.status(500).json({ error: "failed to load posts" })
  }
}
