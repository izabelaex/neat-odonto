import { describe, expect, it } from 'vitest'
import { formatarReais, reaisParaCentavos } from '../src/utils/dinheiro'
import { errorMessage } from '../src/api/calendar'

describe('money input in integer cents', () => {
  it.each([['1500', 150000], ['1.500', 150000], ['1500,5', 150050],
    ['R$ 1.500,50', 150050], ['0,01', 1], ['0', 0], ['15.50', 1550]])(
    'converts %s to %i cents', (input, expected) => {
      expect(reaisParaCentavos(input)).toBe(expected)
    })
  it.each(['', null, undefined, '-1', 'abc', '1,234', '1,2,3'])(
    'rejects invalid amount %s', (input) => expect(reaisParaCentavos(input)).toBeNull())
  it('formats cents for display', () => {
    expect(formatarReais(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56')
  })
})

it('shows API text but does not expose structured validation errors', () => {
  expect(errorMessage({ response: { data: { detail: 'Agenda indisponível' } } }, 'Erro')).toBe('Agenda indisponível')
  expect(errorMessage({ response: { data: { detail: [{ msg: 'internal' }] } } }, 'Erro')).toBe('Erro')
  expect(errorMessage(new Error(), 'Erro')).toBe('Erro')
})
