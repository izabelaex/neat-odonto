import { screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { patient, renderPage, respond, sent } from './support'

it('uploads a document as multipart, reloads the record and removes the document', async () => {
  const document = { id: 5, tipo: 'radiografia', descricao: 'Retorno' }
  respond('get', '/pacientes/1', patient)
  respond('post', '/pacientes/1/documentos', document, 201)
  respond('delete', '/pacientes/1/documentos/5', null, 204)
  const user = renderPage('/pacientes/1')
  await screen.findByRole('heading', { name: patient.nome })
  expect(screen.getByRole('button', { name: 'Adicionar documento' })).toBeDisabled()
  await user.selectOptions(screen.getByLabelText('Tipo'), 'radiografia')
  await user.type(screen.getByLabelText('Descrição (opcional)'), 'Retorno')
  const file = new File(['synthetic-image'], 'teste.png', { type: 'image/png' })
  // The file input is intentionally hidden behind the custom file picker.
  await user.upload(window.document.querySelector('input[type=file]'), file)
  expect(screen.getByText('teste.png')).toBeVisible()
  respond('get', '/pacientes/1', { ...patient, documentos: [document] })
  await user.click(screen.getByRole('button', { name: 'Adicionar documento' }))
  expect(await screen.findByRole('link', { name: 'Radiografia — Retorno' })).toHaveAttribute('href',
    'http://localhost:8000/pacientes/1/documentos/5/arquivo')
  const body = sent('post', '/pacientes/1/documentos')[0].body
  expect(body.get('tipo')).toBe('radiografia')
  expect(body.get('descricao')).toBe('Retorno')
  expect(body.get('arquivo').name).toBe('teste.png')
  respond('get', '/pacientes/1', patient)
  await user.click(screen.getByRole('button', { name: 'Excluir' }))
  expect(await screen.findByText('Nenhum documento enviado ainda.')).toBeVisible()
})

it('shows missing optional data and reports upload failure', async () => {
  respond('get', '/pacientes/1', { ...patient, cpf: null, telefone: '', endereco: '', queixa_principal: '' })
  respond('post', '/pacientes/1/documentos', {}, 500)
  const user = renderPage('/pacientes/1')
  await screen.findByText('Nenhum documento enviado ainda.')
  expect(screen.getByText('Não registrada')).toBeVisible()
  await user.upload(document.querySelector('input[type=file]'), new File(['test'], 'foto.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Adicionar documento' }))
  expect(await screen.findByText('Não foi possível enviar o documento.')).toBeVisible()
})

it('reports a record load failure', async () => {
  respond('get', '/pacientes/1', {}, 404)
  renderPage('/pacientes/1')
  await waitFor(() => expect(screen.getByText('Não foi possível carregar o paciente.')).toBeVisible())
})
