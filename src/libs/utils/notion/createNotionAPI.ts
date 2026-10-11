import { NotionAPI } from "notion-client"

// Notion's Cloudflare blocks requests carrying got's default User-Agent
// ("got (https://github.com/sindresorhus/got)") with a 403 challenge page.
// Send a browser-like User-Agent on every notion-client request instead.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

// Every notion-client request is a POST, which got never retries by default.
// Builds prerender many pages at once and hit Notion's rate limit (429), so
// retry rate-limited and transient errors with got's exponential backoff.
const RETRY = {
  limit: 5,
  methods: ["POST" as const],
  statusCodes: [429, 500, 502, 503, 504],
}

class NotionAPIWithUserAgent extends NotionAPI {
  fetch<T>(params: Parameters<NotionAPI["fetch"]>[0]): Promise<T> {
    return super.fetch<T>({
      ...params,
      headers: { "User-Agent": USER_AGENT, ...params.headers },
      gotOptions: { retry: RETRY, ...params.gotOptions },
    })
  }
}

export const createNotionAPI = () => new NotionAPIWithUserAgent()
