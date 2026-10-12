// Weekly post counts for the home page's grass calendar: one row per year,
// one cell per Sunday-started week. Dates are "YYYY-MM-DD" strings, read as
// calendar dates so the timezone of the server never shifts a post's week.

const parse = (date: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return { y, utc: Date.UTC(y, mo - 1, d) }
}

const DAY = 24 * 60 * 60 * 1000

export function weekOfYear(date: string): number {
  const p = parse(date)
  if (!p) return -1
  const jan1 = Date.UTC(p.y, 0, 1)
  const dayOfYear = Math.round((p.utc - jan1) / DAY)
  return Math.floor((dayOfYear + new Date(jan1).getUTCDay()) / 7)
}

export type ActivityRow = { year: number; weeks: number[]; total: number }

export function weeklyActivity(dates: string[], currentYear: number): ActivityRow[] {
  const valid = dates.map(parse).filter((p): p is NonNullable<typeof p> => !!p && p.y <= currentYear)
  const firstYear = Math.min(currentYear, ...valid.map((p) => p.y))
  const rows: ActivityRow[] = []
  for (let year = currentYear; year >= firstYear; year--) {
    const weeks = new Array(weekOfYear(`${year}-12-31`) + 1).fill(0)
    rows.push({ year, weeks, total: 0 })
  }
  dates.forEach((date) => {
    const p = parse(date)
    if (!p || p.y > currentYear) return
    const row = rows.find((r) => r.year === p.y)!
    row.weeks[weekOfYear(date)]++
    row.total++
  })
  return rows
}

export const activityLevel = (count: number) => Math.min(count, 3)
