import { test } from "node:test"
import assert from "node:assert/strict"
import { memoizeAsync } from "./memoize"

test("memoizeAsync shares one call within the ttl and refreshes after it", async () => {
  let now = 0
  let calls = 0
  const get = memoizeAsync(async () => ++calls, 1000, () => now)
  assert.deepEqual(await Promise.all([get(), get()]), [1, 1])
  now = 999
  assert.equal(await get(), 1)
  now = 1000
  assert.equal(await get(), 2)
})

test("memoizeAsync forgets a failed call so the next one retries", async () => {
  let calls = 0
  const get = memoizeAsync(async () => {
    if (++calls === 1) throw new Error("boom")
    return calls
  }, 1000, () => 0)
  await assert.rejects(get(), /boom/)
  assert.equal(await get(), 2)
})
