import { test } from "node:test"
import assert from "node:assert/strict"
import { activityLevel, weekOfYear, weeklyActivity } from "./activity"

test("weekOfYear counts Sunday-started weeks from the year's first day", () => {
  // 2023-01-01 is a Sunday
  assert.equal(weekOfYear("2023-01-01"), 0)
  assert.equal(weekOfYear("2023-01-07"), 0)
  assert.equal(weekOfYear("2023-01-08"), 1)
  // 2022-01-01 is a Saturday: Jan 1 is week 0, Jan 2 (Sunday) starts week 1
  assert.equal(weekOfYear("2022-01-01"), 0)
  assert.equal(weekOfYear("2022-01-02"), 1)
  assert.equal(weekOfYear("2022-12-31"), 52)
})

test("weeklyActivity groups post dates into one row per year, newest first", () => {
  const rows = weeklyActivity(["2023-01-02", "2023-01-03", "2023-01-09", "2025-06-01"], 2025)
  assert.deepEqual(rows.map((r) => r.year), [2025, 2024, 2023])
  const y2023 = rows.find((r) => r.year === 2023)!
  assert.equal(y2023.total, 3)
  assert.equal(y2023.weeks[0], 2)
  assert.equal(y2023.weeks[1], 1)
  assert.equal(y2023.weeks.length, 53)
  assert.equal(rows.find((r) => r.year === 2024)!.total, 0)
})

test("weeklyActivity ignores dates after the current year and bad dates", () => {
  const rows = weeklyActivity(["2027-01-01", "", "nope", "2026-03-01"], 2026)
  assert.deepEqual(rows.map((r) => [r.year, r.total]), [[2026, 1]])
})

test("activityLevel buckets counts into 0..3", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(activityLevel), [0, 1, 2, 3, 3])
})
