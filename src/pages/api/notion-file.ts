import { NextApiRequest, NextApiResponse } from "next"
import { NotionAPI } from "notion-client"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { blockId, url } = req.query

  if (
    !blockId ||
    typeof blockId !== "string" ||
    !url ||
    typeof url !== "string"
  ) {
    return res.status(400).json({ error: "Missing blockId or url" })
  }

  try {
    const api = new NotionAPI()
    const { signedUrls } = await api.getSignedFileUrls([
      {
        permissionRecord: {
          table: "block",
          id: blockId,
        },
        url,
      },
    ])

    if (signedUrls?.[0]) {
      res.redirect(307, signedUrls[0])
    } else {
      res.status(500).json({ error: "Failed to get signed URL" })
    }
  } catch {
    res.status(500).json({ error: "Internal server error" })
  }
}
