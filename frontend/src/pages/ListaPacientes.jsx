import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarPacientes, listarPacientes } from '../api/pacientes'
import Botao from '../components/Botao'
import Cartao from '../components/Cartao'

/**
 * Lista de pacientes com busca por nome ou CPF (historias 4 e 5).
 *
 * Sem termo digitado, mostra a lista completa (GET /pacientes). Com termo,
 * usa a busca rapida (POST /pacientes/busca), que casa nome ou CPF — o CPF
 * nunca aparece em querystring de URL.
 */
export default function ListaPacientes() {
  const [termo, setTermo] = useState('')
  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    const termoAtual = termo.trim()
    const idTimeout = setTimeout(() => {
      setCarregando(true)
      setErro(null)
      const requisicao = termoAtual ? buscarPacientes(termoAtual) : listarPacientes()
      requisicao
        .then(setPacientes)
        .catch(() => setErro('Não foi possível carregar os pacientes.'))
        .finally(() => setCarregando(false))
    }, 300)
    return () => clearTimeout(idTimeout)
  }, [termo])

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-tinta">Pacientes</h1>
        <Link to="/pacientes/novo">
          <Botao>Novo paciente</Botao>
        </Link>
      </div>

      <input
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar por nome ou CPF"
        className="mb-6 w-full rounded-md border border-borda bg-cartao px-3 py-2 text-tinta"
      />

      {erro && <p className="text-alerta">{erro}</p>}
      {!erro && carregando && <p className="text-tintaSuave">Carregando...</p>}
      {!erro && !carregando && pacientes.length === 0 && (
        <p className="text-tintaSuave">Nenhum paciente encontrado.</p>
      )}

      <ul className="space-y-3">
        {pacientes.map((paciente) => (
          <li key={paciente.id}>
            <Link to={`/pacientes/${paciente.id}`}>
              <Cartao className="transition-colors hover:border-principalClara">
                <p className="font-medium text-tinta">{paciente.nome}</p>
                <p className="text-sm text-tintaSuave">
                  {paciente.telefone || 'Sem telefone cadastrado'}
                </p>
              </Cartao>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
