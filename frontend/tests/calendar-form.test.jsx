import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import CalendarEventForm from '../src/components/CalendarEventForm'
import { chooseToday, patient, renderComponent, respond, sent } from './support'

async function fillAppointment(user) {
  respond('post', '/pacientes/busca', [patient])
  await user.type(screen.getByLabelText('Paciente'), 'Fictício')
  await user.click(await screen.findByRole('option', { name: /Paciente Fictício/ }))
  await user.type(screen.getByLabelText('Procedimento'), ' Avaliação ')
  await chooseToday(user)
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: '10:00' } })
}

it('links the patient and leaves omitted end time for the API default', async () => {
  const created = vi.fn()
  respond('post', '/agenda/eventos', { id: 'event' }, 201)
  const user = renderComponent(<CalendarEventForm onCreated={created} />)
  await fillAppointment(user)
  await user.click(screen.getByRole('button', { name: 'Agendar consulta' }))
  await waitFor(() => expect(created).toHaveBeenCalledOnce())
  const payload = sent('post', '/agenda/eventos')[0].body
  expect(payload).toMatchObject({ patient_id: 1, title: 'Avaliação' })
  expect(payload).not.toHaveProperty('end')
  expect(new Date(payload.start).getHours()).toBe(10)
  expect(payload.request_id).toMatch(/^[\da-f-]{36}$/)
  expect(screen.getByLabelText('Procedimento')).toHaveValue('')
})

it('rejects reversed times and reuses the idempotency key after a failed request', async () => {
  respond('post', '/agenda/eventos', { detail: 'Google indisponível' }, 503)
  const created = vi.fn()
  const user = renderComponent(<CalendarEventForm onCreated={created} />)
  await fillAppointment(user)
  fireEvent.change(screen.getByLabelText('Término'), { target: { value: '09:00' } })
  await user.click(screen.getByRole('button', { name: 'Agendar consulta' }))
  expect(screen.getByRole('alert')).toHaveTextContent('término deve ser posterior')
  expect(sent('post', '/agenda/eventos')).toHaveLength(0)
  fireEvent.change(screen.getByLabelText('Término'), { target: { value: '11:30' } })
  await user.click(screen.getByRole('button', { name: 'Agendar consulta' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Google indisponível')
  respond('post', '/agenda/eventos', { id: 'event' }, 201)
  await user.click(screen.getByRole('button', { name: 'Agendar consulta' }))
  await waitFor(() => expect(created).toHaveBeenCalledOnce())
  const [first, retry] = sent('post', '/agenda/eventos')
  expect(retry.body.request_id).toBe(first.body.request_id)
  expect(new Date(retry.body.end) - new Date(retry.body.start)).toBe(90 * 60000)
})

it('requires selection from the search results, not just typed text', async () => {
  respond('post', '/pacientes/busca', [])
  const user = renderComponent(<CalendarEventForm onCreated={vi.fn()} />)
  await user.type(screen.getByLabelText('Paciente'), 'Desconhecido')
  expect(await screen.findByText('Nenhum paciente encontrado.')).toBeVisible()
  await user.type(screen.getByLabelText('Procedimento'), 'Avaliação')
  await chooseToday(user)
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: '10:00' } })
  await user.click(screen.getByRole('button', { name: 'Agendar consulta' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Selecione o paciente')
  expect(sent('post', '/agenda/eventos')).toHaveLength(0)
})

it('reports patient search failure', async () => {
  respond('post', '/pacientes/busca', {}, 500)
  const user = renderComponent(<CalendarEventForm onCreated={vi.fn()} />)
  await user.type(screen.getByLabelText('Paciente'), 'Pessoa')
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível buscar pacientes')
})
