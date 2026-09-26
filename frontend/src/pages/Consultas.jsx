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

  return null
}
