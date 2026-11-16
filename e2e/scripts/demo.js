import { spawnSync } from 'node:child_process'

/**
 * Roda a suíte com o navegador visível e devagar (PW_SLOWMO), para acompanhar
 * ao vivo numa apresentação. Um script em vez de só documentar a env var
 * porque "set" de variável de ambiente muda de sintaxe entre PowerShell e
 * bash — assim funciona igual nos dois.
 */
const resultado = spawnSync('npx', ['playwright', 'test', '--headed'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PW_SLOWMO: process.env.PW_SLOWMO || '600' },
})

process.exit(resultado.status ?? 1)
