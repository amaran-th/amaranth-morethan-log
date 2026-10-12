// Shares one in-flight or recent result between callers; a rejected call is
// dropped so the next caller retries instead of reusing the failure.
export function memoizeAsync<T>(fn: () => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  let cached: { at: number; promise: Promise<T> } | undefined
  return (): Promise<T> => {
    if (!cached || now() - cached.at >= ttlMs) {
      const promise = fn()
      const entry = { at: now(), promise }
      cached = entry
      promise.catch(() => {
        if (cached === entry) cached = undefined
      })
    }
    return cached.promise
  }
}
