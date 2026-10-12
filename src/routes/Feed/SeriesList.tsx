import styled from "@emotion/styled"
import Link from "next/link"
import React from "react"
import { Emoji } from "src/components/Emoji"
import { feedPath } from "src/libs/feed"

type Props = {
  series: Record<string, number>
  current?: string
}

// Series names with their post counts; each links to the series' list page.
const SeriesList: React.FC<Props> = ({ series, current }) => {
  const names = Object.keys(series).sort((a, b) => series[b] - series[a] || a.localeCompare(b))
  if (!names.length) return null
  return (
    <StyledWrapper>
      <div className="top">
        <Emoji>📚</Emoji> Series
      </div>
      <ul className="list">
        {names.map((name) => (
          <li key={name}>
            <Link href={name === current ? "/" : feedPath({ series: name }, 1)} data-active={name === current}>
              <span className="name">{name}</span>
              <span className="count">{series[name]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </StyledWrapper>
  )
}

export default SeriesList

const StyledWrapper = styled.div`
  margin-bottom: 1.5rem;

  .top {
    padding: 0.25rem;
    margin-bottom: 0.75rem;
  }
  .list a {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem 1rem;
    margin: 0.25rem 0;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: ${({ theme }) => theme.colors.gray10};

    :hover {
      background-color: ${({ theme }) => theme.colors.gray4};
    }
    &[data-active="true"] {
      color: ${({ theme }) => theme.colors.gray12};
      background-color: ${({ theme }) => theme.colors.gray4};
    }
    .name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .count {
      flex-shrink: 0;
      color: ${({ theme }) => theme.colors.gray9};
    }
  }
`
