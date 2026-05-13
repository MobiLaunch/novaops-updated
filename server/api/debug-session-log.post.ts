import { appendFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Dev-only: append one NDJSON line for Cursor debug sessions (workspace log file). */
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const body = await readBody(event)
  const line = JSON.stringify(body ?? {}) + '\n'
  await appendFile(join(process.cwd(), 'debug-99a5f1.log'), line, 'utf8')
  return { ok: true }
})
