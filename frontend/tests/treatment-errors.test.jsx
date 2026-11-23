import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { patient, plan, renderPage, respond } from './support'

it('reports plan load failure', async () => {
  respond('get', '/pacientes/1', patient)
  respond('get', '/pacientes/1/planos-tratamento', {}, 500)
  renderPage('/pacientes/1/tratamento')
  expect(await screen.findByText('Não foi possível carregar os planos de tratamento.')).toBeVisible()
})

it('keeps plan and payment visible after failed removal or status change', async () => {
  const payment = { id: 3, valor_centavos: 10000, data_pagamento: '2026-10-10', forma: null }
  respond('get', '/pacientes/1', patient)
  respond('get', '/pacientes/1/planos-tratamento', [{ ...plan, parcelas_pagas: 1,
    parcelas: [{ ...plan.parcelas[0], quitada: true, pagamentos: [payment] }] }])
  respond('delete', '/planos-tratamento/1', {}, 500)
  respond('delete', '/pagamentos/3', {}, 500)
  respond('put', '/planos-tratamento/1', {}, 500)
  const user = renderPage('/pacientes/1/tratamento')
  await user.selectOptions(await screen.findByLabelText('Situação do plano'), 'cancelado')
  expect(await screen.findByText('Não foi possível alterar a situação.')).toBeVisible()
  expect(screen.getByText('Paga')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Remover' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar remoção' }))
  expect(await screen.findByText(/Não foi possível remover o pagamento/)).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Excluir plano' }))
  expect(screen.getByText(/o pagamento registrado também serão apagados/)).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  expect(await screen.findByText(/Não foi possível excluir o plano/)).toBeVisible()
  expect(screen.getByText('Limpeza')).toBeVisible()
})
