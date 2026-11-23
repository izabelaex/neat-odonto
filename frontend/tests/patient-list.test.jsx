import { screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { patient, renderPage, respond, sent } from './support'

it('searches CPF in the POST body and clears the filter', async () => {
  respond('get', '/pacientes', [patient])
  respond('post', '/pacientes/busca', [])
  const user = renderPage('/pacientes')
  expect(await screen.findByText(patient.nome)).toBeVisible()
  const search = screen.getByPlaceholderText('Buscar por nome ou CPF')
  await user.type(search, '12345678909')
  expect(await screen.findByText('Nenhum paciente encontrado.')).toBeVisible()
  expect(sent('post', '/pacientes/busca').at(-1).body).toEqual({ termo: '12345678909' })
  await user.clear(search)
  expect(await screen.findByText(patient.nome)).toBeVisible()
})

it('requires confirmation before deleting and removes the item on success', async () => {
  respond('get', '/pacientes', [{ ...patient, telefone: '' }])
  respond('delete', '/pacientes/1', null, 204)
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const user = renderPage('/pacientes')
  await user.click(await screen.findByRole('button', { name: 'Excluir' }))
  expect(sent('delete', '/pacientes/1')).toHaveLength(0)
  confirm.mockReturnValue(true)
  await user.click(screen.getByRole('button', { name: 'Excluir' }))
  await waitFor(() => expect(screen.queryByText(patient.nome)).not.toBeInTheDocument())
})

it.each(['load', 'delete'])('reports patient %s failure', async (operation) => {
  respond('get', '/pacientes', operation === 'load' ? {} : [patient], operation === 'load' ? 500 : 200)
  respond('delete', '/pacientes/1', {}, 500)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const user = renderPage('/pacientes')
  if (operation === 'delete') await user.click(await screen.findByRole('button', { name: 'Excluir' }))
  expect(await screen.findByText(/Não foi possível .* paciente/)).toBeVisible()
})
