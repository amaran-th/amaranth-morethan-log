import styled from "@emotion/styled"
import Link from "next/link"
import React from "react"
import { FeedFilter, feedPath, pageWindow } from "src/libs/feed"

type Props = {
  filter: FeedFilter
  page: number
  totalPages: number
}

const Pagination: React.FC<Props> = ({ filter, page, totalPages }) => {
  if (totalPages <= 1) return null
  return (
    <StyledWrapper aria-label="페이지 이동">
      {page > 1 && (
        <Link className="step" href={feedPath(filter, page - 1)} rel="prev">
          ← 이전
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="gap">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={feedPath(filter, p)}
            aria-current={p === page ? "page" : undefined}
            data-active={p === page}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link className="step" href={feedPath(filter, page + 1)} rel="next">
          다음 →
        </Link>
      )}
    </StyledWrapper>
  )
}

export default Pagination

const StyledWrapper = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  margin: 1.5rem 0 2rem;

  a,
  .gap {
    min-width: 2.25rem;
    padding: 0.375rem 0.625rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    text-align: center;
    color: ${({ theme }) => theme.colors.gray10};
  }
  a:hover {
    background-color: ${({ theme }) => theme.colors.gray4};
  }
  a[data-active="true"] {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray12};
    background-color: ${({ theme }) => theme.colors.gray5};
  }
`
