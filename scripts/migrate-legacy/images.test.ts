import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { loadImage, resolveLocalFile } from "./images"

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "img-"))
fs.writeFileSync(path.join(dir, "data sql.png"), "png")
fs.writeFileSync(path.join(dir, "트랜잭션.jpg".normalize("NFD")), "jpg")

test("resolveLocalFile handles ./, url-encoding and NFC/NFD mismatch", () => {
  assert.equal(resolveLocalFile(dir, "./data sql.png"), path.join(dir, "data sql.png"))
  assert.equal(resolveLocalFile(dir, "data%20sql.png"), path.join(dir, "data sql.png"))
  // APFS matches either normalization itself; other filesystems need the readdir fallback.
  const found = resolveLocalFile(dir, "트랜잭션.jpg".normalize("NFC"))
  assert.ok(found)
  assert.equal(fs.readFileSync(found).toString(), "jpg")
  assert.equal(resolveLocalFile(dir, "missing.png"), undefined)
})

test("loadImage reads local files with a content type", async () => {
  const file = await loadImage({ kind: "local", src: "data sql.png" }, dir)
  assert.equal(file.contentType, "image/png")
  assert.equal(file.filename, "data sql.png")
  assert.equal(file.data.toString(), "png")
  await assert.rejects(loadImage({ kind: "local", src: "missing.png" }, dir), /not found/)
})

test("loadImage downloads remote images and rejects non-images", async () => {
  const okFetch = (async () => new Response("gif", { headers: { "content-type": "image/gif" } })) as typeof fetch
  const file = await loadImage({ kind: "remote", url: "https://i.imgur.com/abc.gif" }, dir, okFetch)
  assert.equal(file.contentType, "image/gif")
  assert.equal(file.filename, "abc.gif")
  const htmlFetch = (async () => new Response("<html>", { headers: { "content-type": "text/html" } })) as typeof fetch
  await assert.rejects(loadImage({ kind: "remote", url: "https://x.com/a.png" }, dir, htmlFetch), /not an image/)
  const notFound = (async () => new Response("", { status: 404 })) as typeof fetch
  await assert.rejects(loadImage({ kind: "remote", url: "https://x.com/a.png" }, dir, notFound), /404/)
})
