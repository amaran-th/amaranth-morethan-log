// Fence languages martian does not recognise fall back to "plain text", which
// drops highlighting on the blog; map the ones the legacy posts use.
const ALIASES: Record<string, string> = {
  jsx: "javascript",
  tsx: "typescript",
  marakdown: "markdown",
  conf: "shell",
  gradle: "groovy",
}

// Untagged fences (43 in the legacy blog) are guessed from their first line;
// anything unmatched (directory trees, URLs, logs) stays plain text.
const GUESSES: [RegExp, string][] = [
  [/^(\$\s+)?(npm|npx|yarn|git|ps|docker|curl|sudo|cd|ls)\s/, "bash"],
  [/^(select|insert|update|delete|create|alter|drop)\s/i, "sql"],
  [/^(implementation|testImplementation|compile|dependencies)\b/, "groovy"],
]

export function resolveCodeLanguage(info: string, body: string): string {
  const lang = info.trim().toLowerCase()
  if (lang) return ALIASES[lang] ?? lang
  const first = body.split("\n").find((line) => line.trim() !== "")?.trim() ?? ""
  return GUESSES.find(([pattern]) => pattern.test(first))?.[1] ?? ""
}

const OPENING = /^([ \t]*)(`{3,}|~{3,})[ \t]*([^\s`]*)[ \t]*$/

export function normalizeCodeFences(md: string): string {
  const lines = md.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(OPENING)
    if (!open) continue
    const [, indent, fence, info] = open
    const closing = new RegExp(`^[ \\t]*${fence[0] === "`" ? "`" : "~"}{${fence.length},}[ \\t]*$`)
    const end = lines.findIndex((line, j) => j > i && closing.test(line))
    if (end === -1) break
    const lang = resolveCodeLanguage(info, lines.slice(i + 1, end).join("\n"))
    lines[i] = `${indent}${fence}${lang}`
    i = end
  }
  return lines.join("\n")
}
