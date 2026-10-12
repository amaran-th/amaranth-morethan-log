import styled from "@emotion/styled"
import React, { useEffect, useState } from "react"
import { TocItem } from "src/libs/utils/notion/toc"

type Props = {
  items: TocItem[]
}

// Space kept above a heading when jumping to it, so the sticky header
// (3rem) does not cover it.
const SCROLL_OFFSET = 80

const anchorOf = (id: string) => document.getElementById(id)

// Outline of the post's headings, shown beside the post on wide screens.
// The heading being read is highlighted as the page scrolls.
const TableOfContents: React.FC<Props> = ({ items }) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current: string | null = null
      for (const item of items) {
        const el = anchorOf(item.id)
        if (el && el.getBoundingClientRect().top <= SCROLL_OFFSET + 8) current = item.id
      }
      setActiveId(current ?? items[0]?.id ?? null)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [items])

  const jump = (event: React.MouseEvent, id: string) => {
    const el = anchorOf(id)
    if (!el) return
    event.preventDefault()
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior: "smooth" })
    history.replaceState(null, "", `#${id}`)
  }

  return (
    <StyledWrapper aria-label="목차">
      <div className="title">목차</div>
      <ol>
        {items.map((item) => (
          <li key={item.id} data-level={item.level}>
            <a
              href={`#${item.id}`}
              data-active={item.id === activeId}
              aria-current={item.id === activeId ? "location" : undefined}
              onClick={(e) => jump(e, item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </StyledWrapper>
  )
}

export default TableOfContents

const StyledWrapper = styled.nav`
  position: sticky;
  top: 5rem;
  max-height: calc(100vh - 7rem);
  overflow-y: auto;
  font-size: 0.8125rem;
  line-height: 1.4;

  .title {
    margin-bottom: 0.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray11};
  }
  ol {
    border-left: 1px solid ${({ theme }) => theme.colors.gray6};
  }
  li[data-level="1"] a {
    padding-left: 1.5rem;
  }
  li[data-level="2"] a {
    padding-left: 2.25rem;
  }
  a {
    display: block;
    margin-left: -1px;
    padding: 0.25rem 0 0.25rem 0.75rem;
    border-left: 2px solid transparent;
    color: ${({ theme }) => theme.colors.gray10};
    transition: color 0.15s ease;
    :hover {
      color: ${({ theme }) => theme.colors.gray12};
    }
    &[data-active="true"] {
      border-left-color: ${({ theme }) => theme.colors.blue9};
      color: ${({ theme }) => theme.colors.blue11};
      font-weight: 600;
    }
  }
`
