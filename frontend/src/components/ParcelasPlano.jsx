import { useState } from 'react'
import { formatarReais } from '../utils/dinheiro'
import Botao from './Botao'
import FormularioPagamento from './FormularioPagamento'

function situacao(parcela) {
  if (parcela.quitada) return { rotulo: 'Paga', cor: 'text-ok' }
  if (parcela.valor_pago_centavos > 0) return { rotulo: 'Paga em parte', cor: 'text-alerta' }
  return { rotulo: 'Em aberto', cor: 'text-alerta' }
}

/**
 * Parcelas combinadas de um plano: valor, quanto ja entrou e a situacao de
 * cada uma. Uma parcela pode receber varios pagamentos (pagamento parcial).
 */
export default function ParcelasPlano({ parcelas, onAtualizado }) {
  const [parcelaAberta, setParcelaAberta] = useState(null)

  return (
    <div className="space-y-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-tintaSuave">
          <tr className="border-b border-borda">
            <th className="py-2 font-medium">Parcela</th>
            <th className="py-2 font-medium">Valor</th>
            <th className="py-2 font-medium">Pago</th>
            <th className="py-2 font-medium">Situação</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {parcelas.map((parcela) => {
            const { rotulo, cor } = situacao(parcela)
            return (
              <tr key={parcela.id} className="border-b border-borda last:border-0">
                <td className="py-2">
                  {parcela.numero}/{parcelas.length}
                </td>
                <td className="py-2">{formatarReais(parcela.valor_centavos)}</td>
                <td className="py-2">{formatarReais(parcela.valor_pago_centavos)}</td>
                <td className={`py-2 font-medium ${cor}`}>{rotulo}</td>
                <td className="py-2 text-right">
                  {!parcela.quitada && (
                    <Botao variante="secundaria" onClick={() => setParcelaAberta(parcela)}>
                      Registrar pagamento
                    </Botao>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {parcelaAberta && (
        <FormularioPagamento
          key={parcelaAberta.id}
          parcela={parcelaAberta}
          onCancelar={() => setParcelaAberta(null)}
          onRegistrado={(plano) => {
            setParcelaAberta(null)
            onAtualizado(plano)
          }}
        />
      )}
    </div>
  )
}
