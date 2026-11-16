import { expect, test } from '@playwright/test'

import { criarPacienteApi } from '../support/api.js'

test.describe('Plano de tratamento e orçamento (história 8)', () => {
  test('cria um plano de tratamento e mostra orçamento e parcelas em aberto', async ({ page, request }) => {
    const paciente = await criarPacienteApi(request, { nome: 'Paciente do Plano de Teste' })

    await page.goto(`/pacientes/${paciente.id}/tratamento`)

    await page.getByRole('button', { name: 'Novo plano' }).click()
    await page.getByLabel('Procedimentos').fill('Canal no 36, restauração no 14')
    await page.getByLabel('Orçamento total (R$)').fill('1.200,00')
    await page.getByLabel('Número de parcelas').fill('3')
    await page.getByRole('button', { name: 'Salvar plano' }).click()

    await expect(page.getByText('Canal no 36, restauração no 14')).toBeVisible()
    // Regex em vez de string fixa: Intl.NumberFormat pode usar espaço normal
    // ou NBSP entre "R$" e o valor, dependendo da versão de ICU do navegador.
    await expect(page.getByText(/Orçamento:\s*R\$\s*1\.200,00/)).toBeVisible()
    await expect(page.getByText(/Pago:\s*R\$\s*0,00\s*\(0 de 3 parcelas\)/)).toBeVisible()
    await expect(page.getByText('Em aberto')).toHaveCount(3)
  })
})
