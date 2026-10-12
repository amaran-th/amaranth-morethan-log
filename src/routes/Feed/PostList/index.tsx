import React, { useEffect, useState } from "react"
import { TPostCard, searchPosts } from "src/libs/feed"
import { ViewMode } from "src/libs/feed/viewMode"
import PostCollection from "./PostCollection"

type Props = {
  posts: TPostCard[]
  q: string
  view: ViewMode
}

// Search covers every post, not just this page: the index of all cards is
// fetched on the first keystroke and results are shown on one screen.
const PostList: React.FC<Props> = ({ posts, q, view }) => {
  const searching = q.trim() !== ""
  const [index, setIndex] = useState<TPostCard[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!searching || index || failed) return
    fetch("/api/search-index")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setIndex)
      .catch(() => setFailed(true))
  }, [searching, index, failed])

  if (searching && !index && !failed) {
    return <p className="my-2 text-gray-500 dark:text-gray-300">Searching…</p>
  }
  const shown = searching ? searchPosts(index ?? posts, q) : posts

  if (!shown.length) return <p className="my-2 text-gray-500 dark:text-gray-300">Nothing! 😺</p>
  return <PostCollection posts={shown} view={view} />
}

export default PostList
