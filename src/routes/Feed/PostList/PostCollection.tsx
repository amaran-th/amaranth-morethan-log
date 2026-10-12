import styled from "@emotion/styled"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { CONFIG } from "site.config"
import { getColorClassByName } from "src/components/Category"
import { TPostCard, categorySlug } from "src/libs/feed"
import { ViewMode } from "src/libs/feed/viewMode"
import { formatDate } from "src/libs/utils"
import PostCard from "./PostCard"

type Props = {
  posts: TPostCard[]
  view: ViewMode
}

const EMOJI = /^\p{Extended_Pictographic}️?/u

const postHref = (post: TPostCard) => `/${encodeURIComponent(post.slug)}`
const postDate = (post: TPostCard) => formatDate(post.date?.start_date || post.createdTime, CONFIG.lang)

const Meta: React.FC<{ post: TPostCard; titleLines: number }> = ({ post, titleLines }) => {
  const category = post.category?.[0]
  return (
    <div className="meta">
      {category && <p className="category">{categorySlug(category)}</p>}
      <p className="title" style={{ WebkitLineClamp: titleLines }}>
        {post.title}
      </p>
      <p className="date">{postDate(post)}</p>
    </div>
  )
}

// Square stand-in for posts without a thumbnail: the category's colour and emoji.
const Placeholder: React.FC<{ post: TPostCard }> = ({ post }) => {
  const category = post.category?.[0] ?? ""
  return (
    <div className="placeholder" style={{ backgroundColor: getColorClassByName(category) }}>
      <span className="emoji">{category.match(EMOJI)?.[0] ?? "📝"}</span>
      <span className="placeholder-title">{post.title}</span>
    </div>
  )
}

// Renders a page of posts as feed cards, a compact list, or a gallery grid.
const PostCollection: React.FC<Props> = ({ posts, view }) => {
  if (view === "feed") {
    return (
      <div className="my-2">
        {posts.map((post) => (
          <PostCard key={post.id} data={post} />
        ))}
      </div>
    )
  }

  if (view === "list") {
    return (
      <StyledList>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={postHref(post)}>
              <Meta post={post} titleLines={2} />
              {post.thumbnail && (
                <div className="thumb">
                  <Image src={post.thumbnail} alt="" fill sizes="96px" css={{ objectFit: "cover" }} />
                </div>
              )}
            </Link>
          </li>
        ))}
      </StyledList>
    )
  }

  return (
    <StyledGallery>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={postHref(post)}>
            <div className="thumb">
              {post.thumbnail ? (
                <Image
                  src={post.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 240px"
                  css={{ objectFit: "cover" }}
                />
              ) : (
                <Placeholder post={post} />
              )}
            </div>
            <Meta post={post} titleLines={2} />
          </Link>
        </li>
      ))}
    </StyledGallery>
  )
}

export default PostCollection

const metaStyles = `
  .meta {
    min-width: 0;
    flex: 1;
  }
  .category,
  .date {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  .title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0.125rem 0;
    font-weight: 500;
  }
`

const StyledList = styled.ul`
  ${metaStyles}
  margin: 0.5rem 0 1.5rem;

  li {
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray6};
  }
  a {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0 -0.5rem;
    padding: 0.75rem 0.5rem;
    border-radius: 0.5rem;
    transition: background-color 0.15s ease;
    :hover {
      background-color: ${({ theme }) => theme.colors.gray3};
    }
  }
  .category,
  .date {
    color: ${({ theme }) => theme.colors.gray10};
  }
  .title {
    font-size: 1rem;
    line-height: 1.5rem;
    color: ${({ theme }) => theme.colors.gray12};
  }
  .thumb {
    position: relative;
    flex-shrink: 0;
    width: 6rem;
    height: 6rem;
    overflow: hidden;
    border-radius: 0.375rem;
    background-color: ${({ theme }) => theme.colors.gray4};
  }
`

const StyledGallery = styled.ul`
  ${metaStyles}
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem 1rem;
  margin: 0.5rem 0 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  a {
    display: block;
    :hover .thumb > * {
      transform: scale(1.05);
    }
    :hover .title {
      color: ${({ theme }) => theme.colors.gray11};
    }
  }
  .thumb {
    position: relative;
    aspect-ratio: 1;
    margin-bottom: 0.5rem;
    overflow: hidden;
    border-radius: 0.5rem;
    background-color: ${({ theme }) => theme.colors.gray4};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    > * {
      transition: transform 0.2s ease;
    }
  }
  .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.875rem;
    .emoji {
      font-size: 1.75rem;
    }
    .placeholder-title {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 0.9375rem;
      font-weight: 700;
      line-height: 1.3;
      color: rgba(0, 0, 0, 0.75);
    }
  }
  .category,
  .date {
    color: ${({ theme }) => theme.colors.gray10};
  }
  .title {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: ${({ theme }) => theme.colors.gray12};
  }
`
