import { NotionAPI } from "notion-client"

// Notion's Cloudflare blocks requests carrying got's default User-Agent
// ("got (https://github.com/sindresorhus/got)") with a 403 challenge page.
// Send a browser-like User-Agent on every notion-client request instead.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

class NotionAPIWithUserAgent extends NotionAPI {
  fetch<T>(params: Parameters<NotionAPI["fetch"]>[0]): Promise<T> {
    return super.fetch<T>({
      ...params,
      headers: { "User-Agent": USER_AGENT, ...params.headers },
    })
  }
}

export const createNotionAPI = () => new NotionAPIWithUserAgent()
