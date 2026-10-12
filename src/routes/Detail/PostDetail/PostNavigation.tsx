import styled from "@emotion/styled"
import Link from "next/link"
import React from "react"
import { CONFIG } from "site.config"
import { TAdjacentPost, TAdjacentPosts } from "src/libs/feed/adjacent"
import { formatDate } from "src/libs/utils"

type Props = {
  adjacent?: TAdjacentPosts
}

const Row: React.FC<{ label: string; post: TAdjacentPost; rel: "prev" | "next" }> = ({ label, post, rel }) => (
  <Link className="row" href={`/${encodeURIComponent(post.slug)}`} rel={rel}>
    <span className="label">{label}</span>
    <span className="title">{post.title}</span>
    <span className="date">{formatDate(post.date, CONFIG.lang)}</span>
  </Link>
)

// Older/newer post links shown under the comments, Tistory style.
const PostNavigation: React.FC<Props> = ({ adjacent }) => {
  if (!adjacent?.prev && !adjacent?.next) return null
  return (
    <StyledWrapper aria-label="이전 글, 다음 글">
      {adjacent.prev && <Row label="이전 글" post={adjacent.prev} rel="prev" />}
      {adjacent.next && <Row label="다음 글" post={adjacent.next} rel="next" />}
    </StyledWrapper>
  )
}

export default PostNavigation

const StyledWrapper = styled.nav`
  margin-top: 2.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray7};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray7};

  .row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0.5rem;
    color: ${({ theme }) => theme.colors.gray12};

    & + .row {
      border-top: 1px solid ${({ theme }) => theme.colors.gray5};
    }
    :hover .title {
      text-decoration: underline;
    }
  }
  .label {
    flex-shrink: 0;
    width: 4rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray10};
  }
  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .date {
    flex-shrink: 0;
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.gray10};

    @media (max-width: 480px) {
      display: none;
    }
  }
`
