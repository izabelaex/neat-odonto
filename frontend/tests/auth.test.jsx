import { act, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { account, renderPage, respond, sent } from './support'

it('redirects unauthenticated users and explains denied accounts', async () => {
  respond('get', '/auth/me', {}, 401)
  const user = renderPage('/login?error=account_denied')
  expect(await screen.findByRole('alert')).toHaveTextContent('conta retornada não foi autorizada')
  expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeEnabled()
  await user.tab()
})

it('recovers from a session failure without showing private content', async () => {
  respond('get', '/auth/me', {}, 503)
  const user = renderPage('/pacientes')
  expect(await screen.findByText(/Não foi possível acessar o sistema/)).toBeVisible()
  respond('get', '/auth/me', {}, 401)
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
})

it('retries configuration errors and disables unconfigured login', async () => {
  respond('get', '/auth/me', {}, 401)
  respond('get', '/auth/status', {}, 503)
  const user = renderPage('/login?error=unknown')
  expect(await screen.findByText(/Não foi possível conectar ao sistema/)).toBeVisible()
  respond('get', '/auth/status', { configured: false })
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('status')).toHaveTextContent('está sendo configurado')
  expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeDisabled()
})

it('changes theme, closes the account menu, and logs out', async () => {
  respond('get', '/auth/me', { ...account, calendar_connected: false })
  respond('post', '/auth/logout', null, 204)
  const user = renderPage('/login')
  const menu = await screen.findByRole('button', { name: /Menu da conta/ })
  await user.click(menu)
  await user.click(screen.getByRole('button', { name: 'Ativar modo escuro' }))
  expect(localStorage.getItem('neat-odonto-theme')).toBe('dark')
  await user.click(screen.getByRole('button', { name: 'Ativar modo claro' }))
  expect(document.documentElement).not.toHaveClass('dark')
  await user.keyboard('{Escape}')
  expect(menu).toHaveFocus()
  await user.click(menu)
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
  expect(sent('post', '/auth/logout')).toHaveLength(1)
})

it('keeps the session on logout failure and reacts to expiration', async () => {
  respond('get', '/auth/me', { ...account, calendar_connected: false })
  respond('post', '/auth/logout', {}, 500)
  const user = renderPage('/unknown')
  await user.click(await screen.findByRole('button', { name: /Menu da conta/ }))
  await user.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível sair')
  act(() => window.dispatchEvent(new Event('session-expired')))
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible())
})
