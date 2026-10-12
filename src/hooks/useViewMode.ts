import { useEffect, useState } from "react"
import { ViewMode, parseViewMode } from "src/libs/feed/viewMode"

const STORAGE_KEY = "feed-view-mode"

// The list view mode is a per-browser convenience: remembered in
// localStorage when available, "feed" otherwise (private windows, SSR).
const useViewMode = (): [ViewMode, (mode: ViewMode) => void] => {
  const [mode, setMode] = useState<ViewMode>("feed")

  useEffect(() => {
    try {
      setMode(parseViewMode(window.localStorage.getItem(STORAGE_KEY)))
    } catch {}
  }, [])

  const update = (next: ViewMode) => {
    setMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }

  return [mode, update]
}

export default useViewMode
