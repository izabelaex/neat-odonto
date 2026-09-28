import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getEvent } from '../api/calendar'
import { atualizarConsulta, criarConsulta, obterConsulta, urlFotoEsterilizacao } from '../api/consultas'
import { buscarPacientes } from '../api/pacientes'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'
import CalendarDatePicker from '../components/CalendarDatePicker'
import SeletorArquivo from '../components/SeletorArquivo'

const ESTERILIZACAO_VAZIA = {
  identificacao_pacote: '', ciclo: '', data_ciclo: '', responsavel: '',
}

function diaDoEvento(inicio) {
  if (inicio.date) return inicio.date
  const data = new Date(inicio.dateTime)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export default function FormularioConsulta() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const editando = Boolean(id)
  const eventId = editando ? null : params.get('agendamento')
  const [agendamento, setAgendamento] = useState(null)
  const [paciente, setPaciente] = useState(location.state?.paciente || null)
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState([])
  const [data, setData] = useState('')
  const [procedimentos, setProcedimentos] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [esterilizacao, setEsterilizacao] = useState(ESTERILIZACAO_VAZIA)
  const [fotoExistente, setFotoExistente] = useState(false)
  const [foto, setFoto] = useState(null)
  const [removerFoto, setRemoverFoto] = useState(false)
  const [carregando, setCarregando] = useState(editando || Boolean(eventId))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroBusca, setErroBusca] = useState('')
  const [buscandoPaciente, setBuscandoPaciente] = useState(false)

  useEffect(() => {
    if (!editando) return
    obterConsulta(id)
      .then((consulta) => {
        setPaciente({ id: consulta.paciente_id, nome: consulta.paciente_nome })
        setData(consulta.data)
        setProcedimentos(consulta.procedimentos_realizados || '')
        setObservacoes(consulta.observacoes || '')
        if (consulta.esterilizacao) {
          setEsterilizacao({
            identificacao_pacote: consulta.esterilizacao.identificacao_pacote || '',
            ciclo: consulta.esterilizacao.ciclo,
            data_ciclo: consulta.esterilizacao.data_ciclo,
            responsavel: consulta.esterilizacao.responsavel,
          })
          setFotoExistente(consulta.esterilizacao.tem_foto)
        }
      })
      .catch(() => setErro('Não foi possível carregar a consulta.'))
      .finally(() => setCarregando(false))
  }, [id, editando])

  useEffect(() => {
    if (!eventId) return
    let ativo = true
    getEvent(eventId)
      .then((evento) => {
        if (!ativo) return
        setAgendamento(evento)
        setData(diaDoEvento(evento.start))
        if (evento.patient_id && evento.patient_name) {
          setPaciente({ id: evento.patient_id, nome: evento.patient_name })
        }
      })
      .catch(() => { if (ativo) setErro('Não foi possível carregar este agendamento. Volte à agenda e tente novamente.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [eventId])

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

  function alterarEsterilizacao(campo, valor) {
    setEsterilizacao((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!paciente) {
      setErro('Selecione o paciente na lista de resultados.')
      return
    }
    if (!data || !esterilizacao.data_ciclo) {
      setErro('Informe a data da consulta e a data do ciclo de esterilização.')
      return
    }
    if (!esterilizacao.identificacao_pacote.trim() && !foto && !(fotoExistente && !removerFoto)) {
      setErro('Identifique o pacote por texto ou foto.')
      return
    }
    setSalvando(true)
    setErro('')
    const form = new FormData()
    form.append('data', data)
    form.append('procedimentos_realizados', procedimentos)
    form.append('observacoes', observacoes)
    Object.entries(esterilizacao).forEach(([campo, valor]) => {
      if (valor) form.append(campo, valor)
    })
    if (foto) form.append('foto_pacote', foto)
    if (removerFoto) form.append('remover_foto', 'true')
    if (editando) form.append('paciente_id', String(paciente.id))
    if (eventId) form.append('google_event_id', eventId)

    try {
      if (editando) await atualizarConsulta(id, form)
      else await criarConsulta(paciente.id, form)
      const aviso = eventId
        ? 'Consulta registrada. O agendamento saiu desta agenda e permanece no Google Calendar.'
        : 'Consulta e esterilização salvas.'
      navigate('/consultas', { state: { aviso } })
    } catch (falha) {
      setErro(typeof falha.response?.data?.detail === 'string'
        ? falha.response.data.detail : 'Não foi possível salvar a consulta.')
      setSalvando(false)
    }
  }

  if (carregando) return <p className="mx-auto max-w-2xl px-6 py-10">Carregando...</p>
  if ((editando || eventId) && erro && !data) return <p role="alert" className="mx-auto max-w-2xl px-6 py-10 text-alerta">{erro}</p>

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{editando ? 'Editar consulta' : eventId ? 'Registrar consulta agendada' : 'Nova consulta'}</h1>
      <Cartao as="form" onSubmit={salvar} className="space-y-5">
        {agendamento && <p className="rounded-md bg-superficie p-3 text-sm">
          Agendamento: <strong>{agendamento.title}</strong>. Ele continuará no Google Calendar após o registro.
        </p>}
        <section className="space-y-2">
          <h2 className="font-semibold">Paciente</h2>
          {paciente && <div className="flex flex-wrap items-baseline gap-x-2">
            <p>Selecionado: <strong>{paciente.nome}</strong></p>
            <button type="button" className="text-xs text-tintaSuave underline" onClick={() => {
              setPaciente(null)
              setTermo('')
              setResultados([])
            }}>Alterar paciente</button>
          </div>}
          {!paciente && <>
            <Campo rotulo="Buscar e selecionar paciente (obrigatório)" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Digite o nome ou CPF e escolha um resultado" />
            {erroBusca && <p role="alert" className="text-alerta">{erroBusca}</p>}
            {termo.trim() && !buscandoPaciente && !erroBusca && resultados.length === 0 && <p className="text-sm text-tintaSuave">Nenhum paciente encontrado.</p>}
            {termo.trim() && resultados.length > 0 && (
              <ul className="rounded-md border border-borda">
                {resultados.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="w-full px-3 py-2 text-left hover:bg-superficie" onClick={() => { setPaciente(item); setTermo(''); setResultados([]) }}>
                      {item.nome}{item.telefone ? ` — ${item.telefone}` : ''}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>}
        </section>

        <CalendarDatePicker label="Data da consulta" value={data} onChange={setData} required className="w-full" />
        <Campo rotulo="Procedimentos realizados" as="textarea" rows={4} value={procedimentos} onChange={(e) => setProcedimentos(e.target.value)} required />
        <Campo rotulo="Observações (opcional)" as="textarea" rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />

        <section className="space-y-3 border-t border-borda pt-5">
          <h2 className="text-lg font-semibold">Esterilização</h2>
          <p className="text-sm text-tintaSuave">Informe ciclo, data, responsável e identificação do pacote por texto ou foto.</p>
          <Campo rotulo="Identificação do pacote ou lote" value={esterilizacao.identificacao_pacote} onChange={(e) => alterarEsterilizacao('identificacao_pacote', e.target.value)} />
          {fotoExistente && !removerFoto && <a className="text-principal underline" href={urlFotoEsterilizacao(id)} target="_blank" rel="noreferrer">Ver foto atual</a>}
          {fotoExistente && (
            <label className="block text-sm"><input type="checkbox" checked={removerFoto} onChange={(e) => { setRemoverFoto(e.target.checked); if (e.target.checked) setFoto(null) }} /> Remover foto atual</label>
          )}
          <SeletorArquivo label="Foto do pacote" accept="image/jpeg,image/png,image/webp"
            hint="JPG, PNG ou WebP" disabled={removerFoto} file={foto} onChange={setFoto} />
          <Campo rotulo="Ciclo" value={esterilizacao.ciclo} onChange={(e) => alterarEsterilizacao('ciclo', e.target.value)} required maxLength={60} />
          <CalendarDatePicker label="Data do ciclo" value={esterilizacao.data_ciclo} required className="w-full"
            onChange={(date) => alterarEsterilizacao('data_ciclo', date)} />
          <Campo rotulo="Responsável pela esterilização" value={esterilizacao.responsavel} onChange={(e) => alterarEsterilizacao('responsavel', e.target.value)} required maxLength={120} />
        </section>

        {erro && <p role="alert" className="text-alerta">{erro}</p>}
        <div className="flex justify-end gap-3">
          <Botao type="button" variante="secundaria" onClick={() => navigate('/consultas')}>Cancelar</Botao>
          <Botao type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar consulta'}</Botao>
        </div>
      </Cartao>
    </main>
  )
}
