import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { BACKEND_PORT, BACKEND_URL, DATABASE_URL, FRONTEND_PORT, FRONTEND_URL, TEST_EMAIL } from './support/env.js'
import { encerrar, esperarUrl, resolvePython } from './support/processo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKEND_DIR = path.join(__dirname, '..', 'backend')
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend')
const AUTH_DIR = path.join(__dirname, '.auth')
const STORAGE_STATE_PATH = path.join(AUTH_DIR, 'storageState.json')

export default async function globalSetup() {
  const python = resolvePython(BACKEND_DIR)

  const dbPath = path.join(BACKEND_DIR, 'e2e_test.db')
  rmSync(dbPath, { force: true })

  const envBanco = { ...process.env, DATABASE_URL, ALLOWED_GOOGLE_EMAILS: TEST_EMAIL }

  execFileSync(python, ['-m', 'alembic', 'upgrade', 'head'], {
    cwd: BACKEND_DIR,
    env: envBanco,
    stdio: 'inherit',
  })

  const saida = execFileSync(python, [path.join(__dirname, 'scripts', 'seed_session.py')], {
    cwd: BACKEND_DIR,
    env: { ...envBanco, E2E_TEST_EMAIL: TEST_EMAIL },
    encoding: 'utf-8',
  })
  const { token } = JSON.parse(saida.trim().split('\n').pop())

  mkdirSync(AUTH_DIR, { recursive: true })
  writeFileSync(
    STORAGE_STATE_PATH,
    JSON.stringify({
      cookies: [
        {
          name: 'neat_session',
          value: token,
          domain: 'localhost',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 8 * 3600,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    }),
  )

  const backend = spawn(
    python,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)],
    {
      cwd: BACKEND_DIR,
      env: { ...envBanco, FRONTEND_URL, COOKIE_SECURE: 'false' },
      stdio: 'inherit',
    },
  )
  await esperarUrl(`${BACKEND_URL}/saude`, 30_000)

  const frontend = spawn(
    process.execPath,
    [path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(FRONTEND_PORT)],
    {
      cwd: FRONTEND_DIR,
      env: { ...process.env, VITE_API_URL: BACKEND_URL },
      stdio: 'inherit',
    },
  )
  await esperarUrl(FRONTEND_URL, 30_000)

  return async function globalTeardown() {
    encerrar(frontend)
    encerrar(backend)
  }
}
