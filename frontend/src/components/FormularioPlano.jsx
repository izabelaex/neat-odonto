import { useState } from 'react'
import { criarPlano } from '../api/tratamento'
import { reaisParaCentavos } from '../utils/dinheiro'
import Botao from './Botao'
import Campo from './Campo'
import Cartao from './Cartao'

const PLANO_VAZIO = { procedimentos: '', valor: '', parcelas: '1' }

/**
 * Formulario de novo plano de tratamento. A dentista informa o orcamento total
 * e em quantas parcelas foi combinado; a API divide o valor entre as parcelas.
 */
export default function FormularioPlano({ pacienteId, onCriado, onCancelar }) {
  const [plano, setPlano] = useState(PLANO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  function atualizarCampo(campo, valor) {
    setPlano((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    const valorCentavos = reaisParaCentavos(plano.valor)
    if (!valorCentavos) {
      setErro('Informe o valor do orçamento, por exemplo 1.500,00.')
      return
    }
    setSalvando(true)
    try {
      const criado = await criarPlano(pacienteId, {
        procedimentos: plano.procedimentos,
        valor_total_centavos: valorCentavos,
        numero_parcelas: Number(plano.parcelas),
      })
      onCriado(criado)
    } catch (err) {
      const detalhe = err.response?.data?.detail
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível salvar o plano.')
      setSalvando(false)
    }
  }

  return (
    <Cartao as="form" onSubmit={salvar} className="space-y-4">
      <h2 className="text-lg font-semibold text-tinta">Novo plano de tratamento</h2>
      <Campo
        rotulo="Procedimentos"
        as="textarea"
        rows={4}
        value={plano.procedimentos}
        onChange={(e) => atualizarCampo('procedimentos', e.target.value)}
        placeholder="Ex.: canal no 36, restauração no 14"
        required
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo
            rotulo="Orçamento total (R$)"
            value={plano.valor}
            onChange={(e) => atualizarCampo('valor', e.target.value)}
            placeholder="1.500,00"
            inputMode="decimal"
            required
          />
        </div>
        <div className="w-40">
          <Campo
            rotulo="Número de parcelas"
            type="number"
            min={1}
            max={48}
            value={plano.parcelas}
            onChange={(e) => atualizarCampo('parcelas', e.target.value)}
            required
          />
        </div>
      </div>

      {erro && <p className="text-alerta">{erro}</p>}

      <div className="flex justify-end gap-3">
        <Botao type="button" variante="secundaria" onClick={onCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar plano'}
        </Botao>
      </div>
    </Cartao>
  )
}
