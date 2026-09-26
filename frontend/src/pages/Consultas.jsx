import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listarConsultas, urlFotoEsterilizacao } from '../api/consultas'
import { buscarPacientes } from '../api/pacientes'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'

function dataBrasileira(data) {
  return data.split('-').reverse().join('/')
}

export default function Consultas() {
  const location = useLocation()
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState([])
  const [paciente, setPaciente] = useState(null)
  const [data, setData] = useState('')
  const [consultas, setConsultas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroBusca, setErroBusca] = useState('')
  const [buscandoPaciente, setBuscandoPaciente] = useState(false)

  useEffect(() => {
    setResultados([])
    setErroBusca('')
    setBuscandoPaciente(Boolean(termo.trim()))
    if (!termo.trim()) {
      return
    }
    let ativo = true
    const timer = setTimeout(() => {
      buscarPacientes(termo.trim())
        .then((lista) => { if (ativo) setResultados(lista) })
        .catch(() => { if (ativo) setErroBusca('Não foi possível buscar pacientes.') })
        .finally(() => { if (ativo) setBuscandoPaciente(false) })
    }, 300)
    return () => { ativo = false; clearTimeout(timer) }
  }, [termo])

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    listarConsultas({ pacienteId: paciente?.id, data })
      .then((lista) => { if (ativo) setConsultas(lista) })
      .catch(() => { if (ativo) setErro('Não foi possível carregar as consultas.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [paciente?.id, data])

  function selecionarPaciente(item) {
    setPaciente(item)
    setTermo('')
    setResultados([])
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-tinta">Consultas</h1>
        <Link to="/consultas/nova" state={{ paciente }} className="rounded-md bg-principal px-4 py-2 text-sm font-medium text-white hover:bg-principalClara">
          Nova consulta
        </Link>
      </div>

      {location.state?.aviso && <p role="status" className="rounded-md bg-cartao p-3 text-tinta">{location.state.aviso}</p>}

      <Cartao className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Campo
              rotulo="Buscar paciente por nome ou CPF"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Digite o nome ou CPF"
            />
            {erroBusca && <p role="alert" className="text-alerta">{erroBusca}</p>}
            {termo.trim() && !buscandoPaciente && !erroBusca && resultados.length === 0 && <p className="mt-2 text-sm text-tintaSuave">Nenhum paciente encontrado.</p>}
            {termo.trim() && resultados.length > 0 && (
              <ul className="mt-2 rounded-md border border-borda bg-cartao">
                {resultados.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => selecionarPaciente(item)} className="w-full px-3 py-2 text-left hover:bg-superficie">
                      {item.nome}{item.telefone ? ` — ${item.telefone}` : ''}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Campo rotulo="Filtrar por data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {paciente && <span>Paciente: <strong>{paciente.nome}</strong></span>}
          {paciente && <Botao variante="secundaria" type="button" onClick={() => setPaciente(null)}>Ver todos os pacientes</Botao>}
          {data && <Botao variante="secundaria" type="button" onClick={() => setData('')}>Limpar data</Botao>}
        </div>
      </Cartao>

      {erro && <p role="alert" className="text-alerta">{erro}</p>}
      {!erro && carregando && <p className="text-tintaSuave">Carregando...</p>}
      {!erro && !carregando && consultas.length === 0 && <p className="text-tintaSuave">Nenhuma consulta encontrada.</p>}

      {!erro && !carregando && (
        <ul className="space-y-4">
          {consultas.map((consulta) => (
            <li key={consulta.id}>
              <Cartao className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{consulta.paciente_nome}</h2>
                    <p className="text-sm text-tintaSuave">{dataBrasileira(consulta.data)}</p>
                  </div>
                  <Link to={`/consultas/${consulta.id}/editar`} className="rounded-md border border-borda bg-cartao px-4 py-2 text-sm font-medium hover:bg-superficie">Editar</Link>
                </div>
                {consulta.procedimentos_realizados && <p className="whitespace-pre-wrap"><strong>Procedimentos:</strong> {consulta.procedimentos_realizados}</p>}
                {consulta.observacoes && <p className="whitespace-pre-wrap"><strong>Observações:</strong> {consulta.observacoes}</p>}
                {consulta.esterilizacao ? (
                  <div className="space-y-1 border-t border-borda pt-3">
                    <h3 className="font-semibold">Esterilização</h3>
                    {consulta.esterilizacao.identificacao_pacote && <p>Pacote/lote: {consulta.esterilizacao.identificacao_pacote}</p>}
                    {consulta.esterilizacao.tem_foto && <a className="text-principal underline" href={urlFotoEsterilizacao(consulta.id)} target="_blank" rel="noreferrer">Ver foto do pacote</a>}
                    <p>Ciclo: {consulta.esterilizacao.ciclo}</p>
                    <p>Data do ciclo: {dataBrasileira(consulta.esterilizacao.data_ciclo)}</p>
                    <p>Responsável: {consulta.esterilizacao.responsavel}</p>
                  </div>
                ) : <p className="border-t border-borda pt-3 text-alerta">Sem registro de esterilização</p>}
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
