import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterPaciente } from '../api/pacientes'
import { listarPlanos } from '../api/tratamento'
import Botao from '../components/Botao'
import Cartao from '../components/Cartao'
import FormularioPlano from '../components/FormularioPlano'
import ParcelasPlano from '../components/ParcelasPlano'
import { formatarReais } from '../utils/dinheiro'

const ROTULOS_STATUS = {
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

/**
 * Planos de tratamento do paciente, com orcamento e parcelas (historia 8).
 * Cada plano mostra quantas parcelas combinadas ja foram pagas.
 */
export default function PlanosTratamento() {
  const { id } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [planos, setPlanos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    Promise.all([obterPaciente(id), listarPlanos(id)])
      .then(([dadosPaciente, dadosPlanos]) => {
        setPaciente(dadosPaciente)
        setPlanos(dadosPlanos)
      })
      .catch(() => setErro('Não foi possível carregar os planos de tratamento.'))
      .finally(() => setCarregando(false))
  }, [id])

  if (carregando) {
    return <p className="mx-auto max-w-2xl px-6 py-10 text-tintaSuave">Carregando...</p>
  }
  if (erro) {
    return <p className="mx-auto max-w-2xl px-6 py-10 text-alerta">{erro}</p>
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-tinta">Plano de tratamento</h1>
          <p className="text-tintaSuave">{paciente.nome}</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/pacientes/${id}`}>
            <Botao variante="secundaria">Voltar</Botao>
          </Link>
          {!criando && <Botao onClick={() => setCriando(true)}>Novo plano</Botao>}
        </div>
      </div>

      {criando && (
        <FormularioPlano
          pacienteId={id}
          onCancelar={() => setCriando(false)}
          onCriado={(plano) => {
            setPlanos((atuais) => [plano, ...atuais])
            setCriando(false)
          }}
        />
      )}

      {planos.length === 0 && !criando && (
        <p className="text-tintaSuave">Nenhum plano de tratamento cadastrado ainda.</p>
      )}

      {planos.map((plano) => (
        <Cartao key={plano.id} className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <p className="whitespace-pre-line text-tinta">{plano.procedimentos}</p>
            <span className="shrink-0 text-sm text-tintaSuave">
              {ROTULOS_STATUS[plano.status]}
            </span>
          </div>
          <p>
            <span className="text-tintaSuave">Orçamento: </span>
            {formatarReais(plano.valor_total_centavos)}
          </p>
          <p>
            <span className="text-tintaSuave">Pago: </span>
            {formatarReais(plano.valor_pago_centavos)} ({plano.parcelas_pagas} de{' '}
            {plano.parcelas.length} parcelas)
          </p>
          <ParcelasPlano
            parcelas={plano.parcelas}
            onAtualizado={(atualizado) =>
              setPlanos((atuais) => atuais.map((p) => (p.id === atualizado.id ? atualizado : p)))
            }
          />
        </Cartao>
      ))}
    </main>
  )
}
