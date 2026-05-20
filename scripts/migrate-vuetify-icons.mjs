import fs from 'fs'
import path from 'path'

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.output' || name === '.git') continue
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.vue')) out.push(p)
  }
  return out
}

function migrateIcons(content) {
  let s = content
  s = s.replace(/<v-app[^>]*>\s*/g, '')
  s = s.replace(/\s*<\/v-app>/g, '')
  s = s.replace(/<v-icon([^>]*)\/>/gi, (_, attrs) => {
    const iconM = attrs.match(/icon=["']([^"']+)["']/i)
    if (iconM) {
      const cls = iconM[1].startsWith('mdi') ? iconM[1] : `mdi-${iconM[1]}`
      return `<i class="mdi ${cls.replace(/^mdi-/, 'mdi-')}"></i>`.replace('mdi mdi-', 'mdi ')
    }
    return '<i class="mdi mdi-help-circle-outline"></i>'
  })
  s = s.replace(/<v-icon([^>]*)>([^<]*)<\/v-icon>/gi, (_, attrs, inner) => {
    const t = inner.trim()
    const cls = t.startsWith('mdi') ? t : `mdi-${t}`
    return `<i class="mdi ${cls}"></i>`
  })
  return s
}

const roots = ['pages', 'components']
let n = 0
for (const root of roots) {
  if (!fs.existsSync(root)) continue
  for (const file of walk(root)) {
    const before = fs.readFileSync(file, 'utf8')
    if (!before.includes('<v-')) continue
    const after = migrateIcons(before)
    if (after !== before) {
      fs.writeFileSync(file, after)
      console.log('icons:', file)
      n++
    }
  }
}
console.log('patched', n, 'files')
