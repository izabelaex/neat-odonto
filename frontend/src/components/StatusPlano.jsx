import { useState } from 'react'
import { atualizarPlano } from '../api/tratamento'

const OPCOES_STATUS = [
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'concluido', rotulo: 'Concluído' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
]

/**
 * Situacao do plano, alteravel direto no cartao. Salva assim que a dentista
 * escolhe outra opcao; a API devolve o plano atualizado.
 */
export default function StatusPlano({ plano, onAtualizado }) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function alterar(e) {
    setSalvando(true)
    setErro(null)
    try {
      onAtualizado(await atualizarPlano(plano.id, { status: e.target.value }))
    } catch {
      setErro('Não foi possível alterar a situação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="shrink-0 text-right">
      <select
        aria-label="Situação do plano"
        value={plano.status}
        onChange={alterar}
        disabled={salvando}
        className="rounded-md border border-borda bg-cartao px-2 py-1 text-sm text-tinta"
      >
        {OPCOES_STATUS.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
      {erro && <p className="mt-1 text-sm text-alerta">{erro}</p>}
    </div>
  )
}
