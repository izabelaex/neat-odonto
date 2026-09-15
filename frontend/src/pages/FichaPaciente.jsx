import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obterPaciente } from '../api/pacientes'
import Botao from '../components/Botao'
import Cartao from '../components/Cartao'

function formatarCpf(cpf) {
  if (!cpf) return 'Não informado'
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Ficha do paciente (historia 3): dados pessoais e anamnese.
 */
export default function FichaPaciente() {
  const { id } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  function carregar() {
    setCarregando(true)
    obterPaciente(id)
      .then(setPaciente)
      .catch(() => setErro('Não foi possível carregar o paciente.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  if (carregando) {
    return <p className="mx-auto max-w-2xl px-6 py-10 text-tintaSuave">Carregando...</p>
  }
  if (erro || !paciente) {
    return (
      <p className="mx-auto max-w-2xl px-6 py-10 text-alerta">
        {erro || 'Paciente não encontrado.'}
      </p>
    )
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-tinta">{paciente.nome}</h1>
        <div className="flex gap-3">
          <Link to="/pacientes">
            <Botao variante="secundaria">Voltar</Botao>
          </Link>
          <Link to={`/pacientes/${id}/editar`}>
            <Botao>Editar</Botao>
          </Link>
        </div>
      </div>

      <Cartao className="space-y-2">
        <p>
          <span className="text-tintaSuave">CPF: </span>
          {formatarCpf(paciente.cpf)}
        </p>
        <p>
          <span className="text-tintaSuave">Telefone: </span>
          {paciente.telefone || 'Não informado'}
        </p>
        <p>
          <span className="text-tintaSuave">Endereço: </span>
          {paciente.endereco || 'Não informado'}
        </p>
        <p>
          <span className="text-tintaSuave">Queixa principal: </span>
          {paciente.queixa_principal || 'Não registrada'}
        </p>
      </Cartao>
    </main>
  )
}