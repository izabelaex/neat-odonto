import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  adicionarDocumento,
  obterPaciente,
  removerDocumento,
  urlDocumento,
} from '../api/pacientes'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'

const TIPOS_DOCUMENTO = [
  { valor: 'foto', rotulo: 'Foto' },
  { valor: 'radiografia', rotulo: 'Radiografia' },
]

const DOCUMENTO_VAZIO = { tipo: 'foto', descricao: '', arquivo: null }

function formatarCpf(cpf) {
  if (!cpf) return 'Não informado'
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Ficha do paciente (historia 3): dados pessoais, anamnese e documentos
 * clinicos. Upload e remocao de documentos acontecem aqui, depois que o
 * paciente ja existe (documento pertence a um paciente com id).
 */
export default function FichaPaciente() {
  const { id } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [novoDocumento, setNovoDocumento] = useState(DOCUMENTO_VAZIO)
  const [enviando, setEnviando] = useState(false)

  function carregar() {
    setCarregando(true)
    obterPaciente(id)
      .then(setPaciente)
      .catch(() => setErro('Não foi possível carregar o paciente.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  async function enviarDocumento(e) {
    e.preventDefault()
    if (!novoDocumento.arquivo) return
    setEnviando(true)
    try {
      await adicionarDocumento(id, novoDocumento)
      setNovoDocumento(DOCUMENTO_VAZIO)
      carregar()
    } catch {
      setErro('Não foi possível enviar o documento.')
    } finally {
      setEnviando(false)
    }
  }

  async function excluirDocumento(documentoId) {
    await removerDocumento(id, documentoId)
    carregar()
  }

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
          <Link to={`/pacientes/${id}/tratamento`}>
            <Botao variante="secundaria">Plano de tratamento</Botao>
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

      <Cartao>
        <h2 className="mb-4 text-lg font-semibold text-tinta">Documentos clínicos</h2>

        {paciente.documentos.length === 0 && (
          <p className="mb-4 text-tintaSuave">Nenhum documento enviado ainda.</p>
        )}
        <ul className="mb-4 space-y-2">
          {paciente.documentos.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-md border border-borda px-3 py-2"
            >
              <a
                href={urlDocumento(id, doc.id)}
                target="_blank"
                rel="noreferrer"
                className="text-principal hover:underline"
              >
                {doc.tipo === 'foto' ? 'Foto' : 'Radiografia'}
                {doc.descricao ? ` — ${doc.descricao}` : ''}
              </a>
              <Botao variante="perigo" type="button" onClick={() => excluirDocumento(doc.id)}>
                Excluir
              </Botao>
            </li>
          ))}
        </ul>

        <form onSubmit={enviarDocumento} className="space-y-3 border-t border-borda pt-4">
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-sm font-medium text-tintaSuave">Tipo</span>
              <select
                value={novoDocumento.tipo}
                onChange={(e) =>
                  setNovoDocumento((atual) => ({ ...atual, tipo: e.target.value }))
                }
                className="w-full rounded-md border border-borda bg-cartao px-3 py-2 text-tinta"
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex-1">
              <Campo
                rotulo="Descrição (opcional)"
                value={novoDocumento.descricao}
                onChange={(e) =>
                  setNovoDocumento((atual) => ({ ...atual, descricao: e.target.value }))
                }
              />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setNovoDocumento((atual) => ({ ...atual, arquivo: e.target.files[0] }))
            }
            className="block w-full text-sm text-tintaSuave"
          />
          <Botao type="submit" disabled={enviando || !novoDocumento.arquivo}>
            {enviando ? 'Enviando...' : 'Adicionar documento'}
          </Botao>
        </form>
      </Cartao>
    </main>
  )
}
