import fs from "node:fs"
import path from "node:path"
import { Client } from "@notionhq/client"
import {
  CACHE_DIR, GATSBY_NOTICE_TITLES, LEGACY_CONTENT, MIGRATION_STATUS, PILOT_PATHS, REPO_ROOT, SITE_URL,
} from "./config"
import { legacyUrl, loadLegacyPosts, type LegacyPost } from "./legacy"
import { assignSlugs } from "./slug"
import { capTags, countTags, mapCategory, mapRawTags } from "./taxonomy"
import { preprocessMarkdown } from "./markdown"
import { markdownToNotionBlocks } from "./blocks"
import { createThrottle, ensureSeriesProperty, listDatabasePages } from "./notion"
import { readCache, writeCache } from "./cache"
import { migratePost, type PlannedPost } from "./migrate"

export function planPosts(posts: LegacyPost[], takenSlugs: Set<string>): PlannedPost[] {
  const mapped = posts.map((p) => {
    const m = mapRawTags(p.category, p.tags)
    if (m.unknown.length) throw new Error(`Unknown tags in ${p.legacyPath}: ${m.unknown.join(", ")}`)
    return m
  })
  const counts = countTags(mapped.map((m) => m.tags))
  const slugs = assignSlugs(posts, takenSlugs)
  return posts.map((post, i) => ({
    post,
    props: {
      title: post.title,
      date: post.date,
      slug: slugs.get(post.legacyPath)!,
      summary: post.description,
      category: mapCategory(post.section),
      tags: capTags(mapped[i].tags, counts),
      series: mapped[i].series,
      status: MIGRATION_STATUS,
    },
  }))
}

export function buildUrlMap(planned: PlannedPost[]) {
  return Object.fromEntries(
    planned.map(({ post, props }) => [
      post.legacyPath,
      {
        title: post.title,
        slug: props.slug,
        legacyUrl: legacyUrl(post.legacyPath),
        newUrl: `${SITE_URL}/${encodeURIComponent(props.slug)}`,
      },
    ])
  )
}

export function renderMappingReport(planned: PlannedPost[]): string {
  const rows = planned.map(
    ({ post, props }) =>
      `| ${props.date} | ${post.title.replace(/\|/g, "\\|")} | \`${props.slug}\` | ${props.category} | ${props.tags.join(", ")} | ${props.series ?? ""} |`
  )
  return [
    "# 레거시 글 이관 매핑 (자동 생성)",
    "",
    "> `npm run migrate -- --dry-run`이 생성한다. 직접 고치지 말고 `scripts/migrate-legacy/taxonomy.ts`를 고친 뒤 다시 생성한다.",
    "",
    "| 날짜 | 제목 | slug | category | tags | series |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n")
}

export function selectPosts(
  planned: PlannedPost[],
  args: { all: boolean; pilot: boolean; only: string[] }
): PlannedPost[] {
  if (args.all) return planned
  const wanted = new Set(args.pilot ? PILOT_PATHS : args.only)
  const selected = planned.filter((p) => wanted.has(p.post.legacyPath))
  const missing = [...wanted].filter((w) => !selected.some((p) => p.post.legacyPath === w))
  if (missing.length) throw new Error(`Unknown legacy paths: ${missing.join(", ")}`)
  return selected
}

function parseArgs(argv: string[]) {
  const only: string[] = []
  const flags = new Set<string>()
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--only") only.push(argv[++i].normalize("NFC"))
    else flags.add(argv[i])
  }
  return { only, pilot: flags.has("--pilot"), all: flags.has("--all"), dryRun: flags.has("--dry-run"), force: flags.has("--force") }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_PAGE_ID
  if (!token || !databaseId) throw new Error("NOTION_TOKEN and NOTION_PAGE_ID must be set (.env).")

  const api = new Client({ auth: token })
  const run = createThrottle()
  const cacheFile = path.join(CACHE_DIR, "pages.json")
  const cache = readCache(cacheFile)
  const migratedIds = new Set(Object.values(cache).map((c) => c.pageId.replace(/-/g, "")))

  const dbPages = await listDatabasePages(api, run, databaseId)
  const takenSlugs = new Set(
    dbPages.filter((p) => !migratedIds.has(p.id.replace(/-/g, ""))).map((p) => p.slug).filter(Boolean)
  )
  const authorId = dbPages.find((p) => p.authorId)?.authorId

  const posts = loadLegacyPosts(LEGACY_CONTENT)
  const planned = planPosts(posts, takenSlugs)
  fs.writeFileSync(path.join(REPO_ROOT, "docs/legacy-mapping.md"), renderMappingReport(planned))
  fs.writeFileSync(path.join(__dirname, "url-map.json"), JSON.stringify(buildUrlMap(planned), null, 2) + "\n")
  console.log(`planned ${planned.length} posts; wrote docs/legacy-mapping.md and url-map.json`)

  const selected = selectPosts(planned, args)

  if (args.dryRun) {
    const dryDir = path.join(CACHE_DIR, "dry")
    fs.mkdirSync(dryDir, { recursive: true })
    for (const { post, props } of selected) {
      const { markdown, images } = preprocessMarkdown(post.body)
      const file = path.join(dryDir, `${props.slug}.json`)
      fs.writeFileSync(file, JSON.stringify({ props, images, blocks: markdownToNotionBlocks(markdown) }, null, 2))
      console.log(`dry-run: ${post.legacyPath} -> ${file}`)
    }
    return
  }

  await ensureSeriesProperty(api, run, databaseId)
  const reportFile = path.join(CACHE_DIR, "missing-images.json")
  const report: Record<string, string[]> = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, "utf8")) : {}
  // One broken post must not stop a batch run; rerunning retries only the
  // posts the cache has not marked done.
  const failures: string[] = []
  for (const [i, item] of selected.entries()) {
    console.log(`[${i + 1}/${selected.length}] ${item.post.legacyPath}`)
    let result
    try {
      result = await migratePost(
      {
        api, run, databaseId, cache, force: args.force,
        saveCache: () => writeCache(cacheFile, cache),
        withNotice: GATSBY_NOTICE_TITLES.includes(item.post.title),
        log: (m) => console.log(m),
      },
      { ...item, props: { ...item.props, authorId } as PlannedPost["props"] }
      )
    } catch (err) {
      failures.push(item.post.legacyPath)
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`)
      continue
    }
    if (result.missingImages.length) report[item.post.legacyPath] = result.missingImages
    else delete report[item.post.legacyPath]
    console.log(`  ${SITE_URL}/${encodeURIComponent(item.props.slug)}`)
  }
  if (Object.keys(report).length) {
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`missing images recorded in ${reportFile}`)
  }
  if (failures.length) {
    console.error(`${failures.length} post(s) failed; rerun to retry:\n${failures.join("\n")}`)
    process.exitCode = 1
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
