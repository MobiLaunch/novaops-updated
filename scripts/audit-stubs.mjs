#!/usr/bin/env node
/**
 * Scans the NovaOps repo for likely stubs, placeholders, and dead navigation targets.
 * Run: npm run audit:stubs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const EXT = new Set(['.vue', '.ts', '.js', '.mjs'])
const SKIP = new Set(['node_modules', '.nuxt', 'dist', '.output', 'coverage'])

const PATTERNS = [
  { name: 'TODO/FIXME', re: /\b(TODO|FIXME)\b/ },
  { name: 'coming soon', re: /coming soon/i },
  { name: 'not implemented', re: /not implemented/i },
  { name: 'stub', re: /\bstub\b/i },
  { name: 'empty catch', re: /catch\s*\([^)]*\)\s*\{\s*\}/ },
]

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue
    const p = path.join(dir, name.name)
    if (name.isDirectory()) {
      if (SKIP.has(name.name)) continue
      walk(p, out)
    } else if (EXT.has(path.extname(name.name))) {
      out.push(p)
    }
  }
  return out
}

const files = walk(root)
const hits = []

for (const file of files) {
  const rel = path.relative(root, file)
  if (file === path.join(root, 'scripts', 'audit-stubs.mjs')) continue
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) {
        hits.push({ file: rel, line: i + 1, rule: name, text: line.trim().slice(0, 160) })
        break
      }
    }
  }
}

const pageRoot = path.join(root, 'pages')
const topVue = fs.readdirSync(pageRoot).filter((f) => f.endsWith('.vue')).map((f) => f.replace(/\.vue$/, ''))
const topDirs = fs
  .readdirSync(pageRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

function segmentHasPage(seg) {
  if (!seg) return true
  if (topVue.includes(seg)) return true
  if (topDirs.includes(seg)) return true
  return false
}

const routeRef = /(?:navigateTo|router\.push)\(\s*['`](\/[a-z0-9-]+)['`]/gi
const deadRoutes = new Map()
for (const file of files) {
  const rel = path.relative(root, file)
  if (!rel.startsWith(`pages${path.sep}`) && !rel.startsWith(`components${path.sep}`)) continue
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    continue
  }
  let m
  while ((m = routeRef.exec(text)) !== null) {
    const seg = m[1].slice(1).split('/')[0]
    if (!segmentHasPage(seg)) deadRoutes.set(m[1], rel)
  }
}

console.log('--- Pattern hits (review manually) ---')
if (hits.length === 0) console.log('(none)')
else {
  for (const h of hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    console.log(`${h.file}:${h.line} [${h.rule}] ${h.text}`)
  }
}

console.log('\n--- Possible missing pages (heuristic) ---')
if (deadRoutes.size === 0) console.log('(none)')
else {
  for (const [route, from] of [...deadRoutes.entries()].sort()) {
    console.log(`${route} referenced from ${from}`)
  }
}

console.log(`\nDone. ${hits.length} pattern lines, ${deadRoutes.size} route hints.`)
