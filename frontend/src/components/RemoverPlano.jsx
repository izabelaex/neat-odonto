import { useState } from 'react'
import { removerPlano } from '../api/tratamento'
import Botao from './Botao'

/**
 * Exclui o plano com confirmacao na propria tela. Parcelas e pagamentos
 * do plano sao apagados junto, por isso o aviso diz quantos pagamentos existem.
 */
export default function RemoverPlano({ plano, onRemovido }) {
  const [confirmando, setConfirmando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState(null)

  const totalPagamentos = plano.parcelas.reduce((soma, p) => soma + p.pagamentos.length, 0)
  const aviso =
    totalPagamentos === 0
      ? 'As parcelas do plano também serão apagadas.'
      : totalPagamentos === 1
        ? 'As parcelas e o pagamento registrado também serão apagados.'
        : `As parcelas e os ${totalPagamentos} pagamentos registrados também serão apagados.`

  async function remover() {
    setRemovendo(true)
    setErro(null)
    try {
      await removerPlano(plano.id)
      onRemovido(plano.id)
    } catch {
      setErro('Não foi possível excluir o plano. Tente novamente.')
      setRemovendo(false)
    }
  }

  if (!confirmando) {
    return (
      <div className="flex justify-end">
        <Botao variante="perigo" onClick={() => setConfirmando(true)}>
          Excluir plano
        </Botao>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-md border border-borda bg-superficie p-3">
      <p className="text-sm">
        Excluir este plano de tratamento? {aviso} Esta ação não pode ser desfeita.
      </p>
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundaria" disabled={removendo} onClick={() => setConfirmando(false)}>
          Manter plano
        </Botao>
        <Botao variante="perigo" disabled={removendo} onClick={remover}>
          {removendo ? 'Excluindo...' : 'Confirmar exclusão'}
        </Botao>
      </div>
      {erro && <p className="text-alerta">{erro}</p>}
    </div>
  )
}
