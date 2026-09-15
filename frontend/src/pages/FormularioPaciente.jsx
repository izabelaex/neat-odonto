import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { atualizarPaciente, criarPaciente, obterPaciente } from '../api/pacientes'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'

const PACIENTE_VAZIO = { nome: '', telefone: '', cpf: '', endereco: '', queixa_principal: '' }

/**
 * Formulario de cadastro e edicao de paciente (historia 3). A mesma tela
 * serve para os dois casos: sem :id na rota cria, com :id edita.
 */
export default function FormularioPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = Boolean(id)

  const [paciente, setPaciente] = useState(PACIENTE_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!editando) return
    obterPaciente(id)
      .then((dados) => setPaciente({ ...PACIENTE_VAZIO, ...dados }))
      .catch(() => setErro('Não foi possível carregar o paciente.'))
      .finally(() => setCarregando(false))
  }, [id, editando])

  function atualizarCampo(campo, valor) {
    setPaciente((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const dados = {
      nome: paciente.nome,
      telefone: paciente.telefone || null,
      cpf: paciente.cpf || null,
      endereco: paciente.endereco || null,
      queixa_principal: paciente.queixa_principal || null,
    }
    try {
      const salvo = editando ? await atualizarPaciente(id, dados) : await criarPaciente(dados)
      navigate(`/pacientes/${salvo.id}`)
    } catch (err) {
      const detalhe = err.response?.data?.detail
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível salvar o paciente.')
      setSalvando(false)
    }
  }

  if (carregando) {
    return <p className="mx-auto max-w-2xl px-6 py-10 text-tintaSuave">Carregando...</p>
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-tinta">
        {editando ? 'Editar paciente' : 'Novo paciente'}
      </h1>

      <Cartao as="form" onSubmit={salvar} className="space-y-4">
        <Campo
          rotulo="Nome"
          value={paciente.nome}
          onChange={(e) => atualizarCampo('nome', e.target.value)}
          required
        />
        <Campo
          rotulo="CPF"
          value={paciente.cpf ?? ''}
          onChange={(e) => atualizarCampo('cpf', e.target.value)}
          placeholder="Somente números"
          inputMode="numeric"
        />
        <Campo
          rotulo="Telefone"
          value={paciente.telefone ?? ''}
          onChange={(e) => atualizarCampo('telefone', e.target.value)}
        />
        <Campo
          rotulo="Endereço"
          value={paciente.endereco ?? ''}
          onChange={(e) => atualizarCampo('endereco', e.target.value)}
        />
        <Campo
          rotulo="Queixa principal (anamnese)"
          as="textarea"
          rows={4}
          value={paciente.queixa_principal ?? ''}
          onChange={(e) => atualizarCampo('queixa_principal', e.target.value)}
        />

        {erro && <p className="text-alerta">{erro}</p>}

        <div className="flex justify-end gap-3">
          <Botao type="button" variante="secundaria" onClick={() => navigate(-1)}>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Botao>
        </div>
      </Cartao>
    </main>
  )
}
