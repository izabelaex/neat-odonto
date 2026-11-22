import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import App from '../src/App'
import client from '../src/api/client'

export const patient = { id: 1, nome: 'Paciente Fictício', cpf: '12345678909',
  telefone: '31999990000', endereco: 'Rua de Teste', queixa_principal: 'Retorno', documentos: [] }
export const account = { name: 'Dentista Teste', email: 'dentist@example.test', calendar_connected: true }
export const installment = { id: 1, numero: 1, valor_centavos: 10000,
  valor_pago_centavos: 0, quitada: false, pagamentos: [] }
export const plan = { id: 1, procedimentos: 'Limpeza', status: 'em_andamento',
  valor_total_centavos: 10000, valor_pago_centavos: 0, parcelas_pagas: 0, parcelas: [installment] }
const handlers = new Map()
const unexpected = []
const originalAdapter = client.defaults.adapter
export const requests = []

// Keep the actual API modules and Axios interceptors; replace only HTTP transport.
export function respond(method, url, data, status = 200) {
  handlers.set(`${method.toLowerCase()} ${url}`, { data, status })
}

beforeEach(() => {
  handlers.clear(); requests.length = 0; unexpected.length = 0
  respond('get', '/auth/me', account)
  respond('get', '/auth/status', { configured: true })
  client.defaults.adapter = vi.fn(async (config) => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    requests.push({ ...config, body })
    const key = `${config.method} ${config.url}`
    const handler = handlers.get(key)
    if (!handler) { unexpected.push(key); throw new Error(`Unhandled request: ${key}`) }
    const data = typeof handler.data === 'function' ? await handler.data(config) : handler.data
    const response = { data, status: handler.status, config, headers: {}, statusText: '' }
    if (handler.status >= 400) throw Object.assign(new Error('HTTP error'), { response })
    return response
  })
})

afterEach(() => {
  client.defaults.adapter = originalAdapter
  expect(unexpected, 'Every HTTP request must have an explicit test response').toEqual([])
})

export function renderPage(path) {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>)
  return user
}

export function renderComponent(element) {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{element}</MemoryRouter>)
  return userEvent.setup()
}

export async function chooseToday(user, index = 0) {
  await user.click(screen.getAllByRole('button', { name: /Selecionar data/ })[index])
  await user.click(screen.getByRole('button', { name: 'Ir para hoje' }))
}

export function sent(method, url) {
  return requests.filter((r) => r.method === method && r.url === url)
}
