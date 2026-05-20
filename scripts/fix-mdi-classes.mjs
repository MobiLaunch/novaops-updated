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

function fix(content) {
  return content.replace(/class="mdi ([^"]+)"/g, (_, rest) => {
    const normalized = rest.trim().replace(/\s+/g, '-')
    const icon = normalized.startsWith('mdi-') ? normalized : `mdi-${normalized}`
    return `class="mdi ${icon}"`
  })
}

let n = 0
for (const file of [...walk('pages'), ...walk('components')]) {
  const before = fs.readFileSync(file, 'utf8')
  const after = fix(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    n++
  }
}
console.log('fixed', n, 'files')
