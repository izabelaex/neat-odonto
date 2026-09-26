import { formatarReais } from '../utils/dinheiro'
import { rotuloFormaPagamento } from './SelecaoFormaPagamento'

/** "2026-09-25" -> "25/09/2026" */
function formatarData(dataIso) {
  return dataIso.split('-').reverse().join('/')
}

/**
 * Todos os pagamentos recebidos no plano, do mais recente para o mais antigo,
 * com a parcela a que cada um se refere.
 */
export default function HistoricoPagamentos({ parcelas }) {
  const pagamentos = parcelas
    .flatMap((parcela) => parcela.pagamentos.map((pagamento) => ({ ...pagamento, parcela })))
    .sort((a, b) => b.data_pagamento.localeCompare(a.data_pagamento) || b.id - a.id)

  return (
    <div className="border-t border-borda pt-3">
      <h3 className="mb-2 text-sm font-medium text-tintaSuave">Pagamentos recebidos</h3>
      {pagamentos.length === 0 ? (
        <p className="text-sm text-tintaSuave">Nenhum pagamento registrado ainda.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {pagamentos.map((pagamento) => (
            <li key={pagamento.id} className="flex flex-wrap gap-x-2 text-tinta">
              <span>{formatarData(pagamento.data_pagamento)}</span>
              <span className="text-tintaSuave">·</span>
              <span>
                Parcela {pagamento.parcela.numero}/{parcelas.length}
              </span>
              <span className="text-tintaSuave">·</span>
              <span className="font-medium">{formatarReais(pagamento.valor_centavos)}</span>
              <span className="text-tintaSuave">·</span>
              <span>{rotuloFormaPagamento(pagamento.forma)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
