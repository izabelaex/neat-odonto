import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderPage, respond, sent } from './support'

it.each([[409, 'CPF já cadastrado', 'CPF já cadastrado'],
  [422, [{ loc: ['body', 'nome'], msg: 'Value error, Nome recusado' }], 'Nome recusado'],
  [500, null, 'Não foi possível salvar o paciente.']])(
  'shows server validation for HTTP %i', async (status, detail, message) => {
    respond('get', '/pacientes', [])
    respond('post', '/pacientes', { detail }, status)
    const user = renderPage('/pacientes/novo')
    await user.type(await screen.findByLabelText('Nome *'), 'Pessoa')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(message)).toBeVisible()
    expect(sent('post', '/pacientes')).toHaveLength(1)
  })

it('explains failure to load a patient for editing', async () => {
  respond('get', '/pacientes/1', {}, 404)
  renderPage('/pacientes/1/editar')
  expect(await screen.findByText('Não foi possível carregar o paciente.')).toBeVisible()
})
