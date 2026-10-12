import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeCodeFences, resolveCodeLanguage } from "./codeLanguage"

test("languages martian does not know are mapped to notion ones", () => {
  assert.equal(resolveCodeLanguage("jsx", ""), "javascript")
  assert.equal(resolveCodeLanguage("tsx", ""), "typescript")
  assert.equal(resolveCodeLanguage("marakdown", ""), "markdown")
  assert.equal(resolveCodeLanguage("conf", ""), "shell")
  assert.equal(resolveCodeLanguage("gradle", ""), "groovy")
  assert.equal(resolveCodeLanguage("Java", ""), "java")
})

test("untagged code is guessed from its first line, or left untagged", () => {
  assert.equal(resolveCodeLanguage("", "npm install recoil\n"), "bash")
  assert.equal(resolveCodeLanguage("", "    ps -ef | grep 'x'\n"), "bash")
  assert.equal(resolveCodeLanguage("", "\n     alter table member drop partition p2;\n"), "sql")
  assert.equal(resolveCodeLanguage("", "select * from member partition(p1);"), "sql")
  assert.equal(resolveCodeLanguage("", "  implementation 'org.jsoup:jsoup:1.13.1'"), "groovy")
  assert.equal(resolveCodeLanguage("", "dependencies {\n  x\n}"), "groovy")
  assert.equal(resolveCodeLanguage("", "  └── src\n      ├── main"), "")
  assert.equal(resolveCodeLanguage("", "https://api.github.com/user"), "")
  assert.equal(resolveCodeLanguage("", "💡 npm install lodash.kebabcase"), "")
})

test("fence openings are rewritten, closings and bodies are untouched", () => {
  const md = "a\n\n```jsx\nconst a = 1\n```\n\n- item\n  ```\n  npm install x\n  ```\n\n````java\n```\n````\n"
  assert.equal(
    normalizeCodeFences(md),
    "a\n\n```javascript\nconst a = 1\n```\n\n- item\n  ```bash\n  npm install x\n  ```\n\n````java\n```\n````\n"
  )
})

test("an unclosed fence is left as is", () => {
  assert.equal(normalizeCodeFences("```jsx\nx"), "```jsx\nx")
})
