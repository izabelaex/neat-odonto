import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getEvent } from '../api/calendar'
import { atualizarConsulta, criarConsulta, obterConsulta, urlFotoEsterilizacao } from '../api/consultas'
import { buscarPacientes } from '../api/pacientes'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'

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
      .then((evento) => { if (ativo) { setAgendamento(evento); setData(diaDoEvento(evento.start)) } })
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

  return null
}
