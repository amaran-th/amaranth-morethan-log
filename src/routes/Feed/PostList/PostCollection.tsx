import styled from "@emotion/styled"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { CONFIG } from "site.config"
import { TPostCard, categorySlug } from "src/libs/feed"
import { ViewMode } from "src/libs/feed/viewMode"
import { formatDate } from "src/libs/utils"
import PostCard from "./PostCard"

type Props = {
  posts: TPostCard[]
  view: ViewMode
}

const postHref = (post: TPostCard) => `/${encodeURIComponent(post.slug)}`
const postDate = (post: TPostCard) => formatDate(post.date?.start_date || post.createdTime, CONFIG.lang)

const Meta: React.FC<{ post: TPostCard; titleLines: number; showTags?: boolean }> = ({
  post,
  titleLines,
  showTags = false,
}) => {
  const category = post.category?.[0]
  return (
    <div className="meta">
      {category && <p className="category">{categorySlug(category)}</p>}
      <p className="title" style={{ WebkitLineClamp: titleLines }}>
        {post.title}
      </p>
      <div className="sub">
        <span className="date">{postDate(post)}</span>
        {/* Plain labels: the whole row is already a link to the post. */}
        {showTags &&
          post.tags?.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
      </div>
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
              <Meta post={post} titleLines={2} showTags />
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
                <div className="placeholder" aria-hidden />
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
  .sub {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
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
    box-sizing: border-box;
    /* Same height whether or not the row has a thumbnail. */
    min-height: 7.5rem;
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
  .tag {
    flex-shrink: 0;
    padding: 0.0625rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    line-height: 1rem;
    color: ${({ theme }) => theme.colors.gray11};
    background-color: ${({ theme }) => theme.colors.gray5};
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
  /* Posts without a thumbnail get one shared soft gradient. */
  .placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.blue4},
      ${({ theme }) => theme.colors.blue7}
    );
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
