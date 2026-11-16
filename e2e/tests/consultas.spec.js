import { expect, test } from '@playwright/test'

import { criarPacienteApi } from '../support/api.js'
import { definirDataParaHoje } from '../support/calendario.js'

test.describe('Registro de consulta com esterilização (histórias 6 e 7)', () => {
  test('registra uma consulta com identificação do pacote por texto e ela aparece na lista', async ({
    page,
    request,
  }) => {
    // Paciente pronto via API: o cadastro em si já é coberto por pacientes.spec.js.
    const paciente = await criarPacienteApi(request, { nome: 'Paciente da Consulta Teste' })

    await page.goto('/consultas/nova')

    await page.getByLabel('Buscar e selecionar paciente (obrigatório)').fill(paciente.nome)
    await page.getByRole('button', { name: new RegExp(paciente.nome) }).click()

    // Os dois seletores de data ficam com o mesmo rótulo acessível ("Selecionar
    // data") até que uma data seja escolhida — por isso cada .first() pega o
    // próximo campo ainda vazio, na ordem em que aparecem no formulário.
    const botaoSelecionarData = page.getByRole('button', { name: 'Selecionar data', exact: true })
    await definirDataParaHoje(page, botaoSelecionarData.first())

    await page.getByLabel('Procedimentos realizados').fill('Limpeza e aplicação de flúor')

    await page.getByLabel('Identificação do pacote ou lote').fill('Pacote 42 / Lote 7')
    await page.getByLabel('Ciclo').fill('Ciclo 134')
    await definirDataParaHoje(page, botaoSelecionarData.first())
    await page.getByLabel('Responsável pela esterilização').fill('Dra. Izabela')

    await page.getByRole('button', { name: 'Salvar consulta' }).click()

    await expect(page).toHaveURL(/\/consultas$/)
    await expect(page.getByRole('status')).toHaveText('Consulta e esterilização salvas.')

    await expect(page.getByRole('heading', { name: paciente.nome })).toBeVisible()
    await expect(page.getByText('Procedimentos: Limpeza e aplicação de flúor')).toBeVisible()
    await expect(page.getByText('Pacote/lote: Pacote 42 / Lote 7')).toBeVisible()
    await expect(page.getByText('Ciclo: Ciclo 134')).toBeVisible()
    await expect(page.getByText('Responsável: Dra. Izabela')).toBeVisible()
  })
})
