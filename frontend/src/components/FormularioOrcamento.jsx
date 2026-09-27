import { useState } from 'react'
import { alterarOrcamento } from '../api/tratamento'
import { formatarReais, reaisParaCentavos } from '../utils/dinheiro'
import Botao from './Botao'
import Campo from './Campo'

/**
 * Altera o orcamento total, inclusive no meio do tratamento. Parcelas que ja
 * tem pagamento sao mantidas; o restante vira parcelas novas, refeitas pela API.
 */
export default function FormularioOrcamento({ plano, onAlterado, onCancelar }) {
  const mantidas = plano.parcelas.filter((p) => p.pagamentos.length > 0)
  const valorMantido = mantidas.reduce((soma, p) => soma + p.valor_centavos, 0)
  const emAberto = plano.parcelas.length - mantidas.length

  const [valor, setValor] = useState(
    formatarReais(plano.valor_total_centavos).replace(/^R\$\s/, '')
  )
  const [parcelas, setParcelas] = useState(String(Math.max(emAberto, 1)))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    const valorCentavos = reaisParaCentavos(valor)
    if (!valorCentavos) {
      setErro('Informe o valor do orçamento, por exemplo 1.500,00.')
      return
    }
    setSalvando(true)
    try {
      onAlterado(
        await alterarOrcamento(plano.id, {
          valor_total_centavos: valorCentavos,
          numero_parcelas: Number(parcelas),
        })
      )
    } catch (err) {
      const detalhe = err.response?.data?.detail
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível alterar o orçamento.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-md border border-borda bg-superficie p-3">
      {mantidas.length > 0 ? (
        <p className="text-sm text-tintaSuave">
          {mantidas.length === 1
            ? '1 parcela já tem pagamento e será mantida'
            : `${mantidas.length} parcelas já têm pagamento e serão mantidas`}{' '}
          ({formatarReais(valorMantido)}). O restante do novo orçamento será dividido nas
          novas parcelas.
        </p>
      ) : (
        <p className="text-sm text-tintaSuave">As parcelas serão refeitas com o novo valor.</p>
      )}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Campo
            rotulo="Orçamento total (R$)"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="decimal"
            required
          />
        </div>
        <div className="w-40">
          <Campo
            rotulo={mantidas.length > 0 ? 'Novas parcelas' : 'Número de parcelas'}
            type="number"
            min={1}
            max={48}
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
            required
          />
        </div>
      </div>

      {erro && <p className="text-sm text-alerta">{erro}</p>}

      <div className="flex gap-3">
        <Botao type="button" variante="secundaria" onClick={onCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar orçamento'}
        </Botao>
      </div>
    </form>
  )
}
