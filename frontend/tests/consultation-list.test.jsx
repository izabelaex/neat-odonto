import { screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { chooseToday, patient, renderPage, respond, sent } from './support'
import { consultation } from './consultation-support'

it('shows clinical history, filters by patient and date, then clears filters', async () => {
  respond('get', '/consultas', [consultation])
  respond('post', '/pacientes/busca', [patient])
  respond('get', '/pacientes/1/consultas', [consultation])
  const user = renderPage('/consultas')
  expect(await screen.findByRole('heading', { name: patient.nome })).toBeVisible()
  expect(screen.getByText('10/10/2026')).toBeVisible()
  expect(screen.getByText('Ciclo: Ciclo teste')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Ver foto do pacote' })).toHaveAttribute('href',
    'http://localhost:8000/consultas/1/esterilizacao/foto')
  await user.type(screen.getByLabelText('Buscar paciente por nome ou CPF'), 'Fictício')
  await user.click(await screen.findByRole('button', { name: /Paciente Fictício/ }))
  await waitFor(() => expect(sent('get', '/pacientes/1/consultas')).toHaveLength(1))
  await chooseToday(user)
  await waitFor(() => expect(sent('get', '/pacientes/1/consultas').at(-1).params.data).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  await user.click(screen.getByRole('button', { name: 'Limpar data' }))
  await user.click(screen.getByRole('button', { name: 'Ver todos os pacientes' }))
  await waitFor(() => expect(sent('get', '/consultas').at(-1).params).toEqual({}))
})

it('shows empty results and search errors', async () => {
  respond('get', '/consultas', [])
  respond('post', '/pacientes/busca', [])
  const user = renderPage('/consultas')
  expect(await screen.findByText('Nenhuma consulta encontrada.')).toBeVisible()
  await user.type(screen.getByLabelText('Buscar paciente por nome ou CPF'), 'Ausente')
  expect(await screen.findByText('Nenhum paciente encontrado.')).toBeVisible()
  respond('post', '/pacientes/busca', {}, 500)
  await user.type(screen.getByLabelText('Buscar paciente por nome ou CPF'), ' x')
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível buscar pacientes')
})

it('reports a failed history request', async () => {
  respond('get', '/consultas', {}, 500)
  renderPage('/consultas')
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as consultas')
})
