import { NextRequest, NextResponse } from "next/server"
import { legacyFeedRedirect } from "src/libs/feed"

// Old list urls filtered with "/?category=…" and "/?tag=…"; send them to the
// new static list pages. Category values carry an emoji, so next.config
// redirects cannot rewrite them.
export function middleware(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const destination = legacyFeedRedirect({
    category: params.get("category") ?? undefined,
    tag: params.get("tag") ?? undefined,
  })
  if (!destination) return NextResponse.next()
  return NextResponse.redirect(new URL(destination, req.url), 308)
}

export const config = { matcher: "/" }
