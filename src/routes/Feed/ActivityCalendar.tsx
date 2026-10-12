import styled from "@emotion/styled"
import Link from "next/link"
import React, { useMemo, useState } from "react"
import { CONFIG } from "site.config"
import { Emoji } from "src/components/Emoji"
import { TPostCard } from "src/libs/feed"
import { activityLevel, weekOfYear, weeklyActivity } from "src/libs/feed/activity"
import { formatDate } from "src/libs/utils"

type Props = {
  postDates: string[]
}

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
const DAY = 24 * 60 * 60 * 1000

// Start (Sunday) and end of a week as "YYYY-MM-DD", clamped to its year.
function weekRange(year: number, week: number) {
  const jan1 = Date.UTC(year, 0, 1)
  const offset = new Date(jan1).getUTCDay()
  const start = Math.max(jan1, jan1 + (week * 7 - offset) * DAY)
  const end = Math.min(Date.UTC(year, 11, 31), jan1 + (week * 7 + 6 - offset) * DAY)
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end) }
}

// Weekly "grass" of published posts for one year at a time: each week is a
// tall bar whose shade shows how many posts went out that week. Clicking a
// week lists its posts, loaded from the search index on first use.
const ActivityCalendar: React.FC<Props> = ({ postDates }) => {
  const currentYear = new Date().getFullYear()
  const rows = useMemo(() => weeklyActivity(postDates, currentYear), [postDates, currentYear])
  const [year, setYear] = useState(currentYear)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [index, setIndex] = useState<TPostCard[] | null>(null)

  const row = rows.find((r) => r.year === year) ?? rows[0]
  const oldest = rows[rows.length - 1].year

  const changeYear = (next: number) => {
    setYear(next)
    setSelectedWeek(null)
  }

  const select = (week: number, count: number) => {
    if (!count) return
    setSelectedWeek((w) => (w === week ? null : week))
    if (!index) {
      fetch("/api/search-index")
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then(setIndex)
        .catch(() => setIndex([]))
    }
  }

  const range = selectedWeek !== null ? weekRange(row.year, selectedWeek) : null
  const weekPosts =
    range && index
      ? index.filter((p) => {
          const d = p.date?.start_date ?? ""
          return d >= range.start && d <= range.end
        })
      : []
  const monthStarts = MONTHS.map((_, m) =>
    weekOfYear(`${row.year}-${String(m + 1).padStart(2, "0")}-01`)
  )

  return (
    <StyledWrapper>
      <div className="top">
        <span>
          <Emoji>🌱</Emoji> Posts
        </span>
        <div className="year-nav">
          <button
            type="button"
            aria-label="이전 해"
            disabled={row.year <= oldest}
            onClick={() => changeYear(row.year - 1)}
          >
            ‹
          </button>
          <span className="year">{row.year}</span>
          <button
            type="button"
            aria-label="다음 해"
            disabled={row.year >= currentYear}
            onClick={() => changeYear(row.year + 1)}
          >
            ›
          </button>
        </div>
        <span className="total">{row.total}개의 글</span>
      </div>
      <div className="scroll">
        <div className="chart">
          <div className="weeks" role="row" aria-label={`${row.year}년 주별 글 수`}>
            {row.weeks.map((count, week) => {
              const r = weekRange(row.year, week)
              return (
                <button
                  key={week}
                  type="button"
                  className="bar"
                  data-level={activityLevel(count)}
                  data-active={selectedWeek === week}
                  title={`${formatDate(r.start, CONFIG.lang)} 주 · 글 ${count}개`}
                  aria-label={`${r.start} 주, 글 ${count}개`}
                  onClick={() => select(week, count)}
                />
              )
            })}
          </div>
          <div className="months">
            {MONTHS.map((label, m) => (
              <span key={label} style={{ gridColumnStart: monthStarts[m] + 1 }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="legend">
        적음
        {[0, 1, 2, 3].map((level) => (
          <span key={level} className="bar" data-level={level} />
        ))}
        많음
      </div>
      {range && (
        <div className="week">
          <div className="week-title">
            {formatDate(range.start, CONFIG.lang)} ~ {formatDate(range.end, CONFIG.lang)}
          </div>
          {!index && <p className="muted">불러오는 중…</p>}
          {index && !weekPosts.length && <p className="muted">글이 없어요.</p>}
          <ul>
            {weekPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </StyledWrapper>
  )
}

export default ActivityCalendar

const StyledWrapper = styled.div`
  margin-bottom: 2rem;

  > .top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem;
    margin-bottom: 0.75rem;

    .year-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
      button {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.5rem;
        font-size: 1rem;
        line-height: 1;
        color: ${({ theme }) => theme.colors.gray11};
        :hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.gray4};
        }
        :disabled {
          opacity: 0.3;
          cursor: default;
        }
      }
      .year {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
    }
    .total {
      min-width: 4.5rem;
      text-align: right;
      font-size: 0.8125rem;
      color: ${({ theme }) => theme.colors.gray10};
    }
  }

  > .scroll {
    overflow-x: auto;
  }
  .chart {
    min-width: 26rem;
  }
  .weeks,
  .months {
    display: grid;
    grid-template-columns: repeat(54, 1fr);
    column-gap: 2px;
  }
  .months {
    margin-top: 0.25rem;
    font-size: 0.6875rem;
    color: ${({ theme }) => theme.colors.gray10};
    span {
      grid-row: 1;
      white-space: nowrap;
    }
  }

  .bar {
    display: block;
    width: 100%;
    height: 2.75rem;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background-color: ${({ theme }) => theme.colors.gray4};
    cursor: pointer;

    &[data-level="1"] {
      background-color: ${({ theme }) => theme.colors.blue6};
    }
    &[data-level="2"] {
      background-color: ${({ theme }) => theme.colors.blue8};
    }
    &[data-level="3"] {
      background-color: ${({ theme }) => theme.colors.blue10};
    }
    &[data-level="0"] {
      cursor: default;
    }
    &[data-active="true"] {
      outline: 2px solid ${({ theme }) => theme.colors.gray12};
      outline-offset: 1px;
    }
  }

  > .legend {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 3px;
    margin-top: 0.5rem;
    font-size: 0.6875rem;
    color: ${({ theme }) => theme.colors.gray10};
    .bar {
      width: 6px;
      height: 14px;
      cursor: default;
    }
  }

  > .week {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background-color: ${({ theme }) => theme.colors.gray3};
    font-size: 0.875rem;
    .week-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .muted {
      color: ${({ theme }) => theme.colors.gray10};
    }
    li {
      padding: 0.125rem 0;
      a:hover {
        text-decoration: underline;
      }
    }
  }
`
