import { useState } from 'react'
import { removerPagamento } from '../api/tratamento'
import { formatarReais } from '../utils/dinheiro'
import Botao from './Botao'

/**
 * Remove um pagamento lancado por engano, com confirmacao na propria tela.
 * A API devolve o plano com os totais recalculados.
 */
export default function RemoverPagamento({ pagamento, onRemovido }) {
  const [confirmando, setConfirmando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState(null)

  async function remover() {
    setRemovendo(true)
    setErro(null)
    try {
      onRemovido(await removerPagamento(pagamento.id))
    } catch {
      setErro('Não foi possível remover o pagamento. Tente novamente.')
      setRemovendo(false)
    }
  }

  if (!confirmando) {
    return (
      <Botao variante="perigo" onClick={() => setConfirmando(true)}>
        Remover
      </Botao>
    )
  }

  return (
    <div className="w-full space-y-2 rounded-md border border-borda bg-superficie p-3">
      <p>
        Remover o pagamento de {formatarReais(pagamento.valor_centavos)}? A parcela volta a
        constar como não paga nesse valor.
      </p>
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundaria" disabled={removendo} onClick={() => setConfirmando(false)}>
          Manter pagamento
        </Botao>
        <Botao variante="perigo" disabled={removendo} onClick={remover}>
          {removendo ? 'Removendo...' : 'Confirmar remoção'}
        </Botao>
      </div>
      {erro && <p className="text-alerta">{erro}</p>}
    </div>
  )
}
