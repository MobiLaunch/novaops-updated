/**
 * Splits Tailwind utilities accidentally merged into mdi icon class names
 * e.g. mdi-upload-text-2xl → mdi mdi-upload text-2xl
 */
import fs from 'fs'
import path from 'path'

const MARKERS = [
  '-text-[', '-text-xs', '-text-sm', '-text-base', '-text-lg', '-text-xl',
  '-text-2xl', '-text-3xl', '-text-4xl', '-text-5xl', '-text-9', '-text-10',
  '-text-muted', '-text-white', '-text-foreground', '-text-primary',
  '-text-emerald', '-text-sky', '-text-red', '-text-violet', '-text-amber', '-text-blue',
  '-mr-', '-ml-', '-mt-', '-mb-', '-opacity-', '-block', '-shrink-0', '-animate-',
  '-col-span-', '-leading-', '-font-', '-no-underline', '-uppercase', '-capitalize',
  '-truncate', '-pointer-events-', '-w-', '-h-', '-max-h-', '-min-w-', '-flex-',
  '-inline-flex', '-rounded-', '-bg-', '-border-', '-p-', '-m-', '-gap-', '-hidden',
  '-absolute', '-relative', '-left-', '-right-', '-top-', '-bottom-', '-inset-',
  '-cursor-', '-hover:', '-col-span',
]

function takeUtilitySegment(s) {
  for (const m of MARKERS) {
    if (s.startsWith(m.slice(1))) {
      let i = m.length - 1
      while (i < s.length && s[i] !== '-') i++
      if (m === '-text-[') {
        const end = s.indexOf(']')
        if (end > 0) return { util: s.slice(0, end + 1), rest: s.slice(end + 1).replace(/^-/, '') }
      }
      if (i >= s.length) return { util: s, rest: '' }
      const util = s.slice(0, i)
      const rest = s.slice(i).replace(/^-/, '')
      return { util, rest }
    }
  }
  return { util: '', rest: s }
}

function peelAllUtilities(s) {
  const utils = []
  let rem = s
  while (rem) {
    const { util, rest } = takeUtilitySegment(rem)
    if (!util) break
    utils.push(util)
    rem = rest
  }
  return utils
}

function splitMdiCombo(combo) {
  if (!combo) return { icon: 'mdi-help', utils: [] }

  let earliest = -1
  let markLen = 0
  for (const m of MARKERS) {
    const i = combo.indexOf(m)
    if (i > 0 && (earliest === -1 || i < earliest)) {
      earliest = i
      markLen = m.length
    }
  }

  if (earliest > 0) {
    const icon = combo.slice(0, earliest)
    const utilStr = combo.slice(earliest + 1)
    const utils = peelAllUtilities(utilStr)
    const iconClass = icon.startsWith('mdi-') ? icon : `mdi-${icon}`
    return { icon: iconClass, utils }
  }

  const onlyUtils = peelAllUtilities(combo)
  if (onlyUtils.length) return { icon: '', utils: onlyUtils }

  const iconClass = combo.startsWith('mdi-') ? combo : `mdi-${combo}`
  return { icon: iconClass, utils: [] }
}

function fixMdiClassAttr(match, combo) {
  const { icon, utils } = splitMdiCombo(combo)
  const parts = ['mdi']
  if (icon) parts.push(icon)
  parts.push(...utils)
  return `class="${parts.join(' ')}"`
}

function fixContent(content) {
  let out = content

  out = out.replace(/class="mdi mdi-([^"]+)"/g, (m, combo) => fixMdiClassAttr(m, combo))

  out = out.replace(
    /<i class="mdi mdi-\{\{([^}]+)\}\}"><\/i>/g,
    '<i class="mdi" :class="$1"></i>'
  )

  out = out.replace(
    /<i class="mdi mdi-eIcon\(event\)"><\/i>/g,
    '<i class="mdi" :class="eIcon(event)"></i>'
  )

  return out
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.output', '.git', '.nuxt'].includes(name)) continue
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.vue')) out.push(p)
  }
  return out
}

let n = 0
for (const file of [...walk('pages'), ...walk('components'), ...walk('layouts')]) {
  const before = fs.readFileSync(file, 'utf8')
  const after = fixContent(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    n++
    console.log('fixed', file)
  }
}
console.log('done:', n, 'files')
