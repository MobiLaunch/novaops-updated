/**
 * electron/dev.cjs — cross-platform Electron dev launcher
 *
 * Named .cjs so it uses CommonJS require() even though package.json
 * has "type":"module". This avoids the ESM/CJS conflict on Windows.
 *
 * Polls for Nuxt to be ready, then spawns Electron.
 * Works on Windows cmd.exe, PowerShell, and bash.
 */
const { spawn } = require('child_process')
const http      = require('http')

const NUXT_URL = process.env.NUXT_URL || 'http://localhost:3000'
const POLL_MS  = 500
const TIMEOUT  = 60_000

function checkReady(resolve, reject, elapsed = 0) {
  http.get(NUXT_URL, (res) => {
    if (res.statusCode < 500) resolve()
    else retry(resolve, reject, elapsed)
  }).on('error', () => retry(resolve, reject, elapsed))
}

function retry(resolve, reject, elapsed) {
  if (elapsed >= TIMEOUT) { reject(new Error(`Timed out waiting for Nuxt at ${NUXT_URL}`)); return }
  setTimeout(() => checkReady(resolve, reject, elapsed + POLL_MS), POLL_MS)
}

console.log(`[electron/dev] Waiting for Nuxt at ${NUXT_URL}…`)

new Promise((res, rej) => checkReady(res, rej))
  .then(() => {
    console.log('[electron/dev] Nuxt ready — launching Electron')
    const electronBin = require('electron')
    const child = spawn(String(electronBin), ['.'], {
      env:   { ...process.env, NUXT_URL },
      stdio: 'inherit',
      shell: false,
    })
    child.on('close', (code) => process.exit(code ?? 0))
  })
  .catch((err) => {
    console.error('[electron/dev] Error:', err.message)
    process.exit(1)
  })
