import styled from "@emotion/styled"
import Link from "next/link"
import React, { useEffect, useRef } from "react"
import { MdChevronLeft, MdChevronRight } from "react-icons/md"
import { CONFIG } from "site.config"
import { TSeries } from "src/libs/feed/series"
import { formatDate } from "src/libs/utils"

type Props = {
  series: TSeries
}

// Posts of the current post's series as a horizontal, snapping card strip.
// The current post's card is marked by colour and starts in view; arrows move
// one card at a time.
const SeriesCarousel: React.FC<Props> = ({ series }) => {
  const trackRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const card = track?.children[series.index] as HTMLElement | undefined
    if (!track || !card) return
    // Scroll the strip only; scrollIntoView would also move the page.
    track.scrollLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2
  }, [series])

  const move = (direction: -1 | 1) => {
    const track = trackRef.current
    const card = track?.children[0] as HTMLElement | undefined
    if (!track || !card) return
    track.scrollBy({ left: direction * (card.clientWidth + 12), behavior: "smooth" })
  }

  return (
    <StyledWrapper aria-label={`${series.name} 시리즈`}>
      <div className="head">
        <span className="name">📚 {series.name}</span>
        <span className="position">
          {series.index + 1} / {series.posts.length}
        </span>
        <div className="arrows">
          <button type="button" aria-label="이전 카드" onClick={() => move(-1)}>
            <MdChevronLeft />
          </button>
          <button type="button" aria-label="다음 카드" onClick={() => move(1)}>
            <MdChevronRight />
          </button>
        </div>
      </div>
      <ol className="track" ref={trackRef}>
        {series.posts.map((post, i) => {
          const current = i === series.index
          return (
            <li key={post.slug} className="card" data-current={current}>
              <Link href={`/${encodeURIComponent(post.slug)}`} aria-current={current ? "page" : undefined}>
                <span className="order">{i + 1}편</span>
                <span className="title">{post.title}</span>
                <span className="date">{formatDate(post.date, CONFIG.lang)}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </StyledWrapper>
  )
}

export default SeriesCarousel

const StyledWrapper = styled.section`
  margin-top: 2.5rem;

  .head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    .name {
      font-weight: 700;
    }
    .position {
      font-size: 0.8125rem;
      color: ${({ theme }) => theme.colors.gray10};
    }
    .arrows {
      display: flex;
      gap: 0.25rem;
      margin-left: auto;
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border-radius: 9999px;
        font-size: 1.25rem;
        color: ${({ theme }) => theme.colors.gray11};
        background-color: ${({ theme }) => theme.colors.gray3};
        :hover {
          background-color: ${({ theme }) => theme.colors.gray5};
        }
      }
    }
  }

  .track {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
  }

  .card {
    flex: 0 0 12.5rem;
    scroll-snap-align: center;

    a {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      box-sizing: border-box;
      height: 100%;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid ${({ theme }) => theme.colors.gray6};
      background-color: ${({ theme }) => theme.colors.gray2};
      :hover {
        border-color: ${({ theme }) => theme.colors.gray8};
      }
    }
    &[data-current="true"] a {
      border-color: ${({ theme }) => theme.colors.blue8};
      background-color: ${({ theme }) => theme.colors.blue3};
    }
    .order {
      font-size: 0.75rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray10};
    }
    &[data-current="true"] .order {
      color: ${({ theme }) => theme.colors.blue11};
    }
    .title {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 0.9375rem;
      font-weight: 600;
      line-height: 1.35;
      color: ${({ theme }) => theme.colors.gray12};
    }
    .date {
      margin-top: auto;
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.gray10};
    }
  }
`
