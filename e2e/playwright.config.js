import { defineConfig } from '@playwright/test'

import { FRONTEND_URL } from './support/env.js'

/**
 * Suíte de testes E2E (TP2). Sobe backend e frontend num banco e em portas
 * isoladas (ver global-setup.js) para não misturar com dados reais de
 * desenvolvimento, e roda sequencialmente: são poucos testes e todos
 * escrevem no mesmo SQLite.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './global-setup.js',
  use: {
    baseURL: FRONTEND_URL,
    storageState: './.auth/storageState.json',
    trace: 'retain-on-failure',
    // PW_SLOWMO (ms de pausa entre cada ação) deixa a execução acompanhável
    // ao vivo, sem precisar reescrever os testes. Ver script "test:demo".
    launchOptions: { slowMo: Number(process.env.PW_SLOWMO) || 0 },
  },
})
