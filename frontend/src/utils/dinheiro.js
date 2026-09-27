/**
 * Conversao entre centavos (como a API guarda dinheiro) e o texto em reais
 * que a dentista le e digita. A conta e feita so com inteiros: nada de float.
 */

const formatoReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 123456 -> "R$ 1.234,56" */
export function formatarReais(centavos) {
  return formatoReais.format(centavos / 100)
}

/**
 * Le o valor digitado e devolve centavos, ou null se nao for um valor valido.
 * Aceita "1500", "1.500", "1500,5", "1.500,50" e "R$ 1.500,50".
 */
export function reaisParaCentavos(texto) {
  let limpo = String(texto ?? '').replace(/[R$\s]/g, '')
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.')
  } else if (!/\.\d{1,2}$/.test(limpo)) {
    limpo = limpo.replace(/\./g, '')
  }
  const partes = limpo.match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!partes) return null
  const [, reais, centavos = ''] = partes
  return Number(reais) * 100 + Number(centavos.padEnd(2, '0'))
}
