import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Helpers de processo usados pelo global-setup.js: achar o Python do venv do
 * backend, esperar um servidor responder, e encerrar os processos de teste no
 * fim — com cuidado extra no Windows, onde kill() sozinho às vezes não
 * derruba o processo a tempo do próximo "npm test" religar a mesma porta.
 */
export function resolvePython(backendDir) {
  const windows = path.join(backendDir, '.venv', 'Scripts', 'python.exe')
  const unix = path.join(backendDir, '.venv', 'bin', 'python')
  if (existsSync(windows)) return windows
  if (existsSync(unix)) return unix
  throw new Error(
    'Virtualenv do backend não encontrado em backend/.venv. Siga o SETUP.md (criar venv e ' +
      '"pip install -r requirements.txt") antes de rodar os testes E2E.',
  )
}

export async function esperarUrl(url, timeoutMs) {
  const limite = Date.now() + timeoutMs
  let ultimoErro
  while (Date.now() < limite) {
    try {
      await fetch(url)
      return
    } catch (erro) {
      ultimoErro = erro
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }
  throw new Error(`Tempo esgotado esperando ${url} responder: ${ultimoErro}`)
}

export function encerrar(processo) {
  if (!processo || processo.exitCode !== null) return
  processo.kill()
  if (process.platform !== 'win32') return
  try {
    execFileSync('taskkill', ['/pid', String(processo.pid), '/T', '/F'], { stdio: 'ignore' })
  } catch {
    // processo já pode ter encerrado sozinho com o kill() acima
  }
}
