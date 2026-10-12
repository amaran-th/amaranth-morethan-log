import styled from "@emotion/styled"
import Link from "next/link"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { MdChevronLeft, MdChevronRight } from "react-icons/md"
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
const POPUP_WIDTH = 256
const CLOSE_DELAY_MS = 150

// Start (Sunday) and end of a week as "YYYY-MM-DD", clamped to its year.
function weekRange(year: number, week: number) {
  const jan1 = Date.UTC(year, 0, 1)
  const offset = new Date(jan1).getUTCDay()
  const start = Math.max(jan1, jan1 + (week * 7 - offset) * DAY)
  const end = Math.min(Date.UTC(year, 11, 31), jan1 + (week * 7 + 6 - offset) * DAY)
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end) }
}

type Popup = { week: number; count: number; left: number; top: number }

// Weekly "grass" of published posts for one year at a time: each week is a
// tall bar whose shade shows how many posts went out that week. Hovering (or
// tapping) a week opens a popup listing that week's posts, loaded from the
// search index on first use. The popup stays open while the pointer is on it,
// so its links can be clicked.
const ActivityCalendar: React.FC<Props> = ({ postDates }) => {
  const currentYear = new Date().getFullYear()
  const rows = useMemo(() => weeklyActivity(postDates, currentYear), [postDates, currentYear])
  const [year, setYear] = useState(currentYear)
  const [popup, setPopup] = useState<Popup | null>(null)
  const [index, setIndex] = useState<TPostCard[] | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()
  const loading = useRef(false)

  const row = rows.find((r) => r.year === year) ?? rows[0]
  const oldest = rows[rows.length - 1].year

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const loadIndex = () => {
    if (index || loading.current) return
    loading.current = true
    fetch("/api/search-index")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setIndex)
      .catch(() => setIndex([]))
  }

  const cancelClose = () => clearTimeout(closeTimer.current)
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setPopup(null), CLOSE_DELAY_MS)
  }

  const open = (week: number, count: number, bar: HTMLElement) => {
    cancelClose()
    if (!count) return setPopup(null)
    loadIndex()
    const wrapper = wrapperRef.current!.getBoundingClientRect()
    const rect = bar.getBoundingClientRect()
    const center = rect.left + rect.width / 2 - wrapper.left
    // Keep the popup inside the calendar's width.
    const left = Math.min(Math.max(center, POPUP_WIDTH / 2), wrapper.width - POPUP_WIDTH / 2)
    setPopup({ week, count, left, top: rect.bottom - wrapper.top + 8 })
  }

  const changeYear = (next: number) => {
    setYear(next)
    setPopup(null)
  }

  const range = popup ? weekRange(row.year, popup.week) : null
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
    <StyledWrapper ref={wrapperRef}>
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
            <MdChevronLeft />
          </button>
          <span className="year">{row.year}</span>
          <button
            type="button"
            aria-label="다음 해"
            disabled={row.year >= currentYear}
            onClick={() => changeYear(row.year + 1)}
          >
            <MdChevronRight />
          </button>
        </div>
        <span className="total">{row.total}개의 글</span>
      </div>
      <div className="scroll" onScroll={() => setPopup(null)}>
        <div className="chart">
          <div className="weeks" role="row" aria-label={`${row.year}년 주별 글 수`}>
            {row.weeks.map((count, week) => (
              <button
                key={week}
                type="button"
                className="bar"
                data-level={activityLevel(count)}
                data-active={popup?.week === week}
                aria-label={`${weekRange(row.year, week).start} 주, 글 ${count}개`}
                onMouseEnter={(e) => open(week, count, e.currentTarget)}
                onMouseLeave={scheduleClose}
                onFocus={(e) => open(week, count, e.currentTarget)}
                onBlur={scheduleClose}
                onClick={(e) =>
                  popup?.week === week ? setPopup(null) : open(week, count, e.currentTarget)
                }
              />
            ))}
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
      {popup && range && (
        <div
          className="popup"
          role="dialog"
          aria-label={`${range.start} 주의 글`}
          style={{ left: popup.left, top: popup.top, width: POPUP_WIDTH }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onFocus={cancelClose}
          onBlur={scheduleClose}
        >
          <div className="popup-head">
            {formatDate(range.start, CONFIG.lang)} ~ {formatDate(range.end, CONFIG.lang)}
          </div>
          <div className="popup-label">글 목록 ({popup.count})</div>
          {!index && <p className="muted">불러오는 중…</p>}
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
  position: relative;
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
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        padding: 0;
        border-radius: 0.5rem;
        font-size: 1.125rem;
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
    /* Drawn inside the bar: an outline would be clipped by the scroll box. */
    &[data-active="true"] {
      box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.gray12};
    }
  }

  > .popup {
    position: absolute;
    z-index: 30;
    transform: translateX(-50%);
    padding: 0.75rem 0.875rem;
    border-radius: 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.gray6};
    background-color: ${({ theme }) => theme.colors.gray1};
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    font-size: 0.8125rem;

    .popup-head {
      color: ${({ theme }) => theme.colors.gray10};
    }
    .popup-label {
      margin: 0.5rem 0 0.25rem;
      padding-top: 0.5rem;
      border-top: 1px solid ${({ theme }) => theme.colors.gray5};
      font-weight: 700;
      color: ${({ theme }) => theme.colors.blue11};
    }
    .muted {
      color: ${({ theme }) => theme.colors.gray10};
    }
    ul {
      padding-left: 1.125rem;
      list-style: disc;
    }
    li::marker {
      color: ${({ theme }) => theme.colors.blue9};
    }
    li a {
      display: block;
      padding: 0.25rem 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: ${({ theme }) => theme.colors.gray12};
      :hover {
        text-decoration: underline;
      }
    }
  }
`
