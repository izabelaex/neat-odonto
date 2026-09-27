import { useState } from 'react'
import { registrarPagamento } from '../api/tratamento'
import { formatarReais, reaisParaCentavos } from '../utils/dinheiro'
import Botao from './Botao'
import Campo from './Campo'
import SelecaoFormaPagamento from './SelecaoFormaPagamento'

function hoje() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/**
 * Registra um pagamento numa parcela. O valor comeca com o que falta pagar,
 * mas a dentista pode trocar por um valor menor (pagamento parcial).
 */
export default function FormularioPagamento({ parcela, onRegistrado, onCancelar }) {
  const restante = parcela.valor_centavos - parcela.valor_pago_centavos
  const [pagamento, setPagamento] = useState({
    valor: formatarReais(restante).replace(/^R\$\s/, ''),
    data: hoje(),
    forma: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  function atualizarCampo(campo, valor) {
    setPagamento((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    const valorCentavos = reaisParaCentavos(pagamento.valor)
    if (!valorCentavos) {
      setErro('Informe o valor pago, por exemplo 150,00.')
      return
    }
    setSalvando(true)
    try {
      const plano = await registrarPagamento(parcela.id, {
        valor_centavos: valorCentavos,
        data_pagamento: pagamento.data,
        forma: pagamento.forma || null,
      })
      onRegistrado(plano)
    } catch (err) {
      const detalhe = err.response?.data?.detail
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível registrar o pagamento.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-md border border-borda bg-superficie p-3">
      <p className="text-sm font-medium text-tinta">
        Pagamento da parcela {parcela.numero} — falta {formatarReais(restante)}
      </p>
      <div className="flex flex-wrap gap-3">
        <div className="w-32">
          <Campo
            rotulo="Valor (R$)"
            value={pagamento.valor}
            onChange={(e) => atualizarCampo('valor', e.target.value)}
            inputMode="decimal"
            required
          />
        </div>
        <div className="w-44">
          <Campo
            rotulo="Data"
            type="date"
            value={pagamento.data}
            onChange={(e) => atualizarCampo('data', e.target.value)}
            required
          />
        </div>
        <div className="w-40">
          <SelecaoFormaPagamento
            value={pagamento.forma}
            onChange={(e) => atualizarCampo('forma', e.target.value)}
          />
        </div>
      </div>

      {erro && <p className="text-sm text-alerta">{erro}</p>}

      <div className="flex gap-3">
        <Botao type="button" variante="secundaria" onClick={onCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Registrar pagamento'}
        </Botao>
      </div>
    </form>
  )
}
