import { expect, test } from '@playwright/test'

import { cpfValidoAleatorio, formatarCpf } from '../support/cpf.js'

test.describe('Cadastro e busca de paciente (histórias 3, 4 e 5)', () => {
  test('cadastra um paciente e encontra ele na lista por nome e por CPF', async ({ page }) => {
    // Sem dígitos: a validação de nome (frontend e API) rejeita números.
    const nome = 'Paciente do Cadastro Teste'
    const cpf = cpfValidoAleatorio()

    await page.goto('/pacientes')
    await page.getByRole('link', { name: 'Novo paciente' }).click()

    await page.getByLabel('Nome *').fill(nome)
    await page.getByLabel('CPF').fill(cpf)
    await page.getByLabel('Telefone').fill('(31) 99999-0000')
    await page.getByLabel('Endereço').fill('Rua Teste, 123')
    await page.getByLabel('Queixa principal').fill('Dor no dente 36')
    await page.getByRole('button', { name: 'Salvar' }).click()

    // Salvar leva para a ficha do paciente recém-criado.
    await expect(page.getByRole('heading', { name: nome })).toBeVisible()
    await expect(page.getByText(`CPF: ${formatarCpf(cpf)}`)).toBeVisible()

    await page.getByRole('link', { name: 'Pacientes' }).click()

    const campoBusca = page.getByPlaceholder('Buscar por nome ou CPF')
    await campoBusca.fill(nome)
    await expect(page.getByRole('link', { name: new RegExp(nome) })).toBeVisible()

    await campoBusca.fill(cpf)
    await expect(page.getByRole('link', { name: new RegExp(nome) })).toBeVisible()
  })
})
