export type PageProps = {
  title: string
  date: string
  slug: string
  summary: string
  category: string
  tags: string[]
  series?: string
  status: string
  authorId?: string
  thumbnailUploadId?: string
}

const richText = (content: string) => [{ type: "text", text: { content } }]

// Property names match the blog database exactly. URL, 발행하기, 편집모드 and
// updatedAt are deliberately never written.
export function buildProperties(p: PageProps): Record<string, any> {
  const props: Record<string, any> = {
    title: { title: richText(p.title) },
    date: { date: { start: p.date } },
    slug: { rich_text: richText(p.slug) },
    summary: { rich_text: p.summary ? richText(p.summary) : [] },
    category: { select: { name: p.category } },
    tags: { multi_select: p.tags.map((name) => ({ name })) },
    type: { select: { name: "Post" } },
    status: { select: { name: p.status } },
  }
  if (p.series) props.series = { select: { name: p.series } }
  if (p.authorId) props.author = { people: [{ id: p.authorId }] }
  if (p.thumbnailUploadId) {
    props.thumbnail = { files: [{ type: "file_upload", file_upload: { id: p.thumbnailUploadId }, name: "thumbnail" }] }
  }
  return props
}
