import { expect, test } from '@playwright/test'

// Sem sessão: ignora o storageState autenticado do resto da suíte (ver
// playwright.config.js) para testar o visitante que ainda não entrou.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Acesso restrito (história 1)', () => {
  test('visitante sem sessão é redirecionado para o login ao tentar acessar o sistema', async ({ page }) => {
    await page.goto('/agenda')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Bem-vinda ao seu consultório' })).toBeVisible()

    await page.goto('/pacientes')
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/consultas')
    await expect(page).toHaveURL(/\/login$/)

    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  })
})
