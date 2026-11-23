import { screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { account, renderPage, respond, sent } from './support'

function appointment() {
  const date = new Date()
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { id: 'event', title: 'Limpeza', patient_name: 'Paciente Fictício', can_register: true,
    start: { dateTime: `${day}T10:00:00-03:00` }, end: { dateTime: `${day}T11:00:00-03:00` } }
}

it('loads pages, switches week/day, navigates dates and refreshes', async () => {
  respond('get', '/agenda/eventos', { items: [appointment()], next_page_token: 'next' })
  const user = renderPage('/agenda')
  expect(await screen.findByText('Limpeza')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Registrar consulta' })).toHaveAttribute('href', '/consultas/nova?agendamento=event')
  respond('get', '/agenda/eventos', { items: [], next_page_token: null })
  await user.click(screen.getByRole('button', { name: 'Carregar mais' }))
  await waitFor(() => expect(sent('get', '/agenda/eventos').at(-1).params.page_token).toBe('next'))
  respond('get', '/agenda/eventos', { items: [appointment()] })
  await user.click(screen.getByRole('button', { name: 'Semana' }))
  expect(await screen.findByRole('region', { name: 'Agendamentos da semana', exact: true })).toBeVisible()
  await waitFor(() => expect(screen.getByText('Limpeza')).toBeVisible())
  const interval = sent('get', '/agenda/eventos').at(-1).params
  expect((new Date(interval.end) - new Date(interval.start)) / 86400000).toBe(5)
  await user.click(screen.getByRole('button', { name: 'Próxima semana' }))
  await user.click(screen.getByRole('button', { name: 'Hoje', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Dia', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Próximo dia' }))
  await user.click(screen.getByRole('button', { name: 'Atualizar agenda' }))
  expect(screen.getByRole('button', { name: 'Dia', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

it('requires confirmation and updates the list after deleting an event', async () => {
  respond('get', '/agenda/eventos', { items: [appointment()] })
  respond('delete', '/agenda/eventos/event', {}, 500)
  const user = renderPage('/agenda')
  await user.click(await screen.findByRole('button', { name: 'Excluir agendamento: Limpeza' }))
  await user.click(screen.getByRole('button', { name: 'Manter', exact: true }))
  expect(sent('delete', '/agenda/eventos/event')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Excluir agendamento: Limpeza' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível excluir')
  respond('delete', '/agenda/eventos/event', null, 204)
  await user.click(screen.getByRole('button', { name: 'Confirmar', exact: true }))
  expect(await screen.findByRole('status')).toHaveTextContent('Agendamento excluído')
  expect(screen.queryByText('Limpeza')).not.toBeInTheDocument()
})

it('offers separate calendar consent when disconnected', async () => {
  respond('get', '/auth/me', { ...account, calendar_connected: false })
  renderPage('/agenda?error=configuration')
  expect(await screen.findByRole('link', { name: 'Conectar Google Agenda' })).toHaveAttribute('href',
    'http://localhost:8000/auth/google/calendar')
  expect(screen.getByRole('alert')).toHaveTextContent('sendo configurada')
  expect(sent('get', '/agenda/eventos')).toHaveLength(0)
})

it('requests reconnection when the token expires', async () => {
  respond('get', '/agenda/eventos', { detail: 'Reconecte sua conta' }, 409)
  renderPage('/agenda')
  expect(await screen.findByRole('alert')).toHaveTextContent('Reconecte sua conta')
  expect(screen.getByRole('link', { name: 'Conectar Google Agenda' })).toBeVisible()
})
