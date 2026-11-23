import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { patient, renderPage, respond, sent } from './support'

beforeEach(() => {
  respond('get', '/pacientes', [])
  respond('post', '/pacientes/busca', [])
  respond('get', '/pacientes/1', patient)
})

it('normalizes a new patient and opens the saved record', async () => {
  respond('post', '/pacientes', patient, 201)
  const user = renderPage('/pacientes/novo')
  await user.type(await screen.findByLabelText('Nome *'), ' Paciente Fictício ')
  await user.type(screen.getByLabelText('CPF'), patient.cpf)
  expect(screen.getByLabelText('CPF')).toHaveValue('123.456.789-09')
  await user.type(screen.getByLabelText('Telefone'), patient.telefone)
  await user.type(screen.getByLabelText('Endereço'), patient.endereco)
  await user.type(screen.getByLabelText('Queixa principal'), patient.queixa_principal)
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('heading', { name: patient.nome })).toBeVisible()
  expect(sent('post', '/pacientes')[0].body).toEqual({ nome: patient.nome, cpf: patient.cpf,
    telefone: patient.telefone, endereco: patient.endereco, queixa_principal: patient.queixa_principal })
})

it('edits an existing patient without treating their own CPF as duplicate', async () => {
  respond('get', '/pacientes', [patient])
  respond('post', '/pacientes/busca', [patient])
  respond('put', '/pacientes/1', patient)
  const user = renderPage('/pacientes/1/editar')
  await waitFor(() => expect(screen.getByLabelText('Nome *')).toHaveValue(patient.nome))
  await user.clear(screen.getByLabelText('Telefone'))
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('heading', { name: patient.nome })).toBeVisible()
  expect(sent('put', '/pacientes/1')[0].body.telefone).toBeNull()
})

it.each([['Pessoa 123', '', 'Nome não pode conter números'],
  ['Pessoa', '123', 'CPF deve ter 11 dígitos'],
  ['Pessoa', '11111111111', 'CPF inválido']])('rejects invalid fields %s %s', async (name, cpf, message) => {
  const user = renderPage('/pacientes/novo')
  await user.type(await screen.findByLabelText('Nome *'), name)
  if (cpf) await user.type(screen.getByLabelText('CPF'), cpf)
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText(message)).toBeVisible()
  expect(sent('post', '/pacientes')).toHaveLength(0)
})

it('warns about repeated names and blocks a duplicate CPF', async () => {
  respond('get', '/pacientes', [patient])
  respond('post', '/pacientes/busca', [patient])
  const user = renderPage('/pacientes/novo')
  await user.type(await screen.findByLabelText('Nome *'), patient.nome)
  expect(await screen.findByText('Já existe um paciente cadastrado com esse nome.')).toBeVisible()
  await user.type(screen.getByLabelText('CPF'), patient.cpf)
  expect(await screen.findByText('Já existe um paciente cadastrado com este CPF.')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  await user.clear(screen.getByPlaceholderText('000.000.000-00'))
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
})
