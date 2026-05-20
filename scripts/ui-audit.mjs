#!/usr/bin/env node
/**
 * NovaOps layout/UI audit — run: node scripts/ui-audit.mjs
 * Exits 1 if critical issues found (Vuetify remnants, broken icons).
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SCAN_DIRS = ['pages', 'components', 'layouts']

const CHECKS = [
  {
    id: 'vuetify-components',
    severity: 'critical',
    label: 'Vuetify components (<v-*)',
    re: /<v-[a-z]/gi,
  },
  {
    id: 'vuetify-theme-vars',
    severity: 'critical',
    label: 'Vuetify theme CSS vars (--v-theme-)',
    re: /--v-theme-/,
  },
  {
    id: 'broken-mdi-mashed',
    severity: 'high',
    label: 'MDI classes merged with utilities',
    re: /class="mdi mdi-[a-z0-9-]*(?:text-|mr-|ml-|opacity|block|shrink|animate|col-span)-/,
  },
  {
    id: 'broken-mdi-template',
    severity: 'critical',
    label: 'Broken dynamic MDI (mustache in class)',
    re: /mdi mdi-\{\{/,
  },
  {
    id: 'vuetify-layout-classes',
    severity: 'medium',
    label: 'Vuetify layout classes (d-flex, pa-, ma-, etc.)',
    re: /\b(d-flex|d-none|pa-\d|ma-\d|text-medium-emphasis|font-weight-black|justify-space-between|flex-grow-1)\b/,
  },
  {
    id: 'missing-mdi-base',
    severity: 'low',
    label: 'Icon without mdi base class',
    re: /<i class="(?!mdi )[^"]*mdi-[a-z]/,
  },
]

function walk(relDir, out = []) {
  const full = path.join(ROOT, relDir)
  if (!fs.existsSync(full)) return out
  for (const name of fs.readdirSync(full)) {
    if (['node_modules', '.output', '.git', '.nuxt'].includes(name)) continue
    const rel = path.join(relDir, name).replace(/\\/g, '/')
    const p = path.join(ROOT, rel)
    if (fs.statSync(p).isDirectory()) walk(rel, out)
    else if (p.endsWith('.vue')) out.push(rel)
  }
  return out
}

function lineHits(content, re) {
  const hits = []
  const lines = content.split('\n')
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g'
  for (let i = 0; i < lines.length; i++) {
    const lineRe = new RegExp(re.source, flags)
    let m
    while ((m = lineRe.exec(lines[i])) !== null) {
      hits.push({ line: i + 1, snippet: lines[i].trim().slice(0, 120) })
      if (!flags.includes('g')) break
    }
  }
  return hits
}

const files = SCAN_DIRS.flatMap(d => walk(d))
const findings = []
const byCheck = Object.fromEntries(CHECKS.map(c => [c.id, []]))

for (const file of files) {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8')
  for (const check of CHECKS) {
    const hits = lineHits(content, check.re)
    if (hits.length) {
      const entry = { file, count: hits.length, samples: hits.slice(0, 3) }
      byCheck[check.id].push(entry)
      findings.push({ ...check, ...entry })
    }
  }
  const skipPageShell = ['pages/login.vue', 'pages/register.vue', 'pages/lock.vue', 'pages/index.vue', 'pages/intro.vue', 'pages/pos.vue', 'pages/profile-setup.vue', 'pages/auth/']
  if (file.startsWith('pages/') && !content.includes('page-shell') && !content.includes('<NuxtLayout')) {
    const hasTemplate = content.includes('<template>')
    if (hasTemplate && !skipPageShell.some(p => file === p || file.startsWith(p))) {
      byCheck['page-shell'] = byCheck['page-shell'] || []
      if (!byCheck['page-shell'].find(e => e.file === file)) {
        byCheck['page-shell'].push({ file, count: 1, samples: [{ line: 1, snippet: 'Page may lack .page-shell wrapper' }] })
      }
    }
  }
}

// Summary
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
console.log('# NovaOps UI Audit\n')
console.log(`Scanned ${files.length} Vue files in ${SCAN_DIRS.join(', ')}\n`)

let exitCode = 0
for (const check of CHECKS) {
  const items = byCheck[check.id] || []
  if (!items.length) continue
  if (check.severity === 'critical') exitCode = 1
  const total = items.reduce((s, i) => s + i.count, 0)
  console.log(`## ${check.severity.toUpperCase()}: ${check.label}`)
  console.log(`**${total}** matches in **${items.length}** file(s)\n`)
  for (const item of items.sort((a, b) => b.count - a.count).slice(0, 15)) {
    console.log(`- \`${item.file}\` (${item.count})`)
    for (const s of item.samples) console.log(`  - L${s.line}: ${s.snippet}`)
  }
  if (items.length > 15) console.log(`- … and ${items.length - 15} more files`)
  console.log('')
}

const pageShell = byCheck['page-shell'] || []
if (pageShell.length) {
  console.log('## SUGGESTION: Missing page-shell')
  for (const item of pageShell) console.log(`- \`${item.file}\``)
  console.log('')
}

const vuetifyFiles = (byCheck['vuetify-components'] || []).map(i => i.file)
if (vuetifyFiles.length) {
  console.log('## Migration priority (Vuetify pages)')
  vuetifyFiles.sort().forEach(f => console.log(`- ${f}`))
  console.log('')
}

console.log('---')
console.log(`Total issue groups: ${findings.length}`)
console.log('Re-run after fixes: `node scripts/ui-audit.mjs`')
process.exit(exitCode)
