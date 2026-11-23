import { screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderPage, respond, sent } from './support'
import { consultation, fillConsultation } from './consultation-support'

it('requires package identification and sends a consultation with a photo', async () => {
  respond('post', '/pacientes/1/consultas', consultation, 201)
  respond('get', '/consultas', [consultation])
  const user = renderPage('/consultas/nova')
  await fillConsultation(user)
  await user.click(screen.getByRole('button', { name: 'Salvar consulta' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Identifique o pacote por texto ou foto')
  expect(sent('post', '/pacientes/1/consultas')).toHaveLength(0)
  await user.upload(document.querySelector('input[type=file]'), new File(['fixture'], 'lote.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Salvar consulta' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Consulta e esterilização salvas')
  const form = sent('post', '/pacientes/1/consultas')[0].body
  expect(form.get('foto_pacote').name).toBe('lote.png')
  expect(form.get('procedimentos_realizados')).toBe('Avaliação')
  expect(form.get('ciclo')).toBe('Ciclo teste')
  expect(form.get('google_event_id')).toBeNull()
})

it('edits a consultation and explicitly removes its old photo', async () => {
  respond('get', '/consultas/1', consultation)
  respond('put', '/consultas/1', consultation)
  respond('get', '/consultas', [consultation])
  const user = renderPage('/consultas/1/editar')
  expect(await screen.findByRole('link', { name: 'Ver foto atual' })).toHaveAttribute('href',
    'http://localhost:8000/consultas/1/esterilizacao/foto')
  await user.click(screen.getByLabelText('Remover foto atual'))
  expect(screen.getByRole('button', { name: 'Escolher arquivo' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Salvar consulta' }))
  expect(await screen.findByRole('status')).toHaveTextContent('salvas')
  expect(sent('put', '/consultas/1')[0].body.get('remover_foto')).toBe('true')
  expect(sent('put', '/consultas/1')[0].body.get('paciente_id')).toBe('1')
})

it('prefills an appointment and links the clinical record without deleting Google event', async () => {
  respond('get', '/agenda/eventos/event', { id: 'event', title: 'Avaliação',
    patient_id: 1, patient_name: 'Paciente Fictício', start: { date: '2026-10-10' } })
  respond('post', '/pacientes/1/consultas', consultation, 201)
  respond('get', '/consultas', [consultation])
  const user = renderPage('/consultas/nova?agendamento=event')
  await screen.findByRole('heading', { name: 'Registrar consulta agendada' })
  await user.type(screen.getByLabelText('Procedimentos realizados'), 'Avaliação')
  await user.type(screen.getByLabelText('Ciclo'), 'Ciclo teste')
  await user.type(screen.getByLabelText('Identificação do pacote ou lote'), 'Lote teste')
  await user.type(screen.getByLabelText('Responsável pela esterilização'), 'Responsável')
  await user.click(screen.getAllByRole('button', { name: /Selecionar data/ })[1])
  await user.click(screen.getByRole('button', { name: 'Ir para hoje' }))
  await user.click(screen.getByRole('button', { name: 'Salvar consulta' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('permanece no Google Calendar'))
  expect(sent('post', '/pacientes/1/consultas')[0].body.get('google_event_id')).toBe('event')
  expect(sent('delete', '/agenda/eventos/event')).toHaveLength(0)
})
