export const VIEW_MODES = ["feed", "list", "gallery"] as const
export type ViewMode = (typeof VIEW_MODES)[number]

export const parseViewMode = (value: string | null | undefined): ViewMode =>
  (VIEW_MODES as readonly string[]).includes(value ?? "") ? (value as ViewMode) : "feed"
