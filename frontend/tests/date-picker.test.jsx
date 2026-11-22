import { useState } from 'react'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import CalendarDatePicker from '../src/components/CalendarDatePicker'
import { renderComponent } from './support'

function Picker() {
  const [value, setValue] = useState('2026-10-15')
  return <><CalendarDatePicker value={value} onChange={setValue} clearable label="Data" required />
    <output aria-label="Data escolhida">{value}</output></>
}

it('navigates months and selects a local date without UTC conversion', async () => {
  const user = renderComponent(<Picker />)
  await user.click(screen.getByRole('button', { name: /Selecionar data/ }))
  await user.click(screen.getByRole('button', { name: 'Próximo mês' }))
  expect(screen.getByRole('heading')).toHaveTextContent('novembro de 2026')
  await user.click(screen.getByRole('button', { name: 'Mês anterior' }))
  await user.click(screen.getByRole('button', { name: /16 de outubro de 2026/ }))
  expect(screen.getByLabelText('Data escolhida')).toHaveTextContent('2026-10-16')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('clears, selects today, and closes when clicking outside', async () => {
  const user = renderComponent(<Picker />)
  await user.click(screen.getByRole('button', { name: /Selecionar data/ }))
  await user.click(screen.getByRole('button', { name: 'Limpar' }))
  expect(screen.getByLabelText('Data escolhida')).toBeEmptyDOMElement()
  await user.click(screen.getByRole('button', { name: 'Selecionar data' }))
  await user.click(screen.getByRole('button', { name: 'Ir para hoje' }))
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  expect(screen.getByLabelText('Data escolhida')).toHaveTextContent(today)
  await user.click(screen.getByRole('button', { name: /Selecionar data/ }))
  await user.click(document.body)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
