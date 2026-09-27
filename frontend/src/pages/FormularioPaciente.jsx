import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  atualizarPaciente,
  buscarPacientes,
  criarPaciente,
  listarPacientes,
  obterPaciente,
} from '../api/pacientes'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'

const PACIENTE_VAZIO = { nome: '', telefone: '', cpf: '', endereco: '', queixa_principal: '' }
const ERROS_VAZIOS = { nome: '', cpf: '' }

function formatarCpfEntrada(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function cpfValido(digitos) {
  if (digitos.length !== 11 || new Set(digitos).size === 1) return false
  const digitoVerificador = (parcial) => {
    let soma = 0
    let peso = parcial.length + 1
    for (const d of parcial) {
      soma += Number(d) * peso
      peso -= 1
    }
    const resto = (soma * 10) % 11
    return String(resto < 10 ? resto : 0)
  }
  const d1 = digitoVerificador(digitos.slice(0, 9))
  const d2 = digitoVerificador(digitos.slice(0, 9) + d1)
  return digitos.slice(-2) === d1 + d2
}

function validarNome(nome) {
  const valor = nome.trim()
  if (!valor) return 'Nome é obrigatório'
  if (/\d/.test(valor)) return 'Nome não pode conter números'
  return ''
}

function validarCpfFormato(digitos) {
  if (!digitos) return ''
  if (digitos.length !== 11) return 'CPF deve ter 11 dígitos'
  if (!cpfValido(digitos)) return 'CPF inválido'
  return ''
}

function extrairErroDeCampo(err, campo) {
  const detalhe = err.response?.data?.detail
  if (!Array.isArray(detalhe)) return null
  const item = detalhe.find((d) => d.loc?.includes(campo))
  return item ? item.msg.replace(/^Value error,\s*/, '') : null
}

/**
 * Formulario de cadastro e edicao de paciente (historia 3). A mesma tela
 * serve para os dois casos: sem :id na rota cria, com :id edita.
 *
 * Validações locais (formato do CPF, nome sem números, CPF/nome já
 * cadastrados) rodam antes de enviar, para dar feedback imediato — o
 * backend continua sendo a autoridade final (ver schemas/paciente.py).
 */
export default function FormularioPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = Boolean(id)

  const [paciente, setPaciente] = useState(PACIENTE_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erroGeral, setErroGeral] = useState(null)
  const [erros, setErros] = useState(ERROS_VAZIOS)
  const [avisoNome, setAvisoNome] = useState('')

  useEffect(() => {
    if (!editando) return
    obterPaciente(id)
      .then((dados) =>
        setPaciente({ ...PACIENTE_VAZIO, ...dados, cpf: formatarCpfEntrada(dados.cpf || '') }),
      )
      .catch(() => setErroGeral('Não foi possível carregar o paciente.'))
      .finally(() => setCarregando(false))
  }, [id, editando])

  // Nome já cadastrado: aviso, não bloqueia — nomes iguais podem ser pessoas diferentes.
  useEffect(() => {
    if (carregando) return
    const nome = paciente.nome.trim()
    if (!nome || validarNome(nome)) {
      setAvisoNome('')
      return
    }
    const idTimeout = setTimeout(() => {
      listarPacientes(nome)
        .then((resultado) => {
          const duplicado = resultado.some(
            (p) => p.nome.toLowerCase() === nome.toLowerCase() && String(p.id) !== id,
          )
          setAvisoNome(duplicado ? 'Já existe um paciente cadastrado com esse nome.' : '')
        })
        .catch(() => {})
    }, 400)
    return () => clearTimeout(idTimeout)
  }, [paciente.nome, carregando, id])

  // CPF já cadastrado: bloqueia, já que CPF precisa ser único. Só valida o
  // formato quando o CPF está completo — evita erro a cada dígito digitado.
  useEffect(() => {
    if (carregando) return
    const digitos = paciente.cpf.replace(/\D/g, '')
    if (digitos.length < 11) {
      setErros((atual) => (atual.cpf ? { ...atual, cpf: '' } : atual))
      return
    }
    const erroFormato = validarCpfFormato(digitos)
    if (erroFormato) {
      setErros((atual) => ({ ...atual, cpf: erroFormato }))
      return
    }
    const idTimeout = setTimeout(() => {
      buscarPacientes(digitos)
        .then((resultado) => {
          const duplicado = resultado.some((p) => String(p.id) !== id)
          setErros((atual) => ({
            ...atual,
            cpf: duplicado ? 'Já existe um paciente cadastrado com este CPF.' : '',
          }))
        })
        .catch(() => {})
    }, 400)
    return () => clearTimeout(idTimeout)
  }, [paciente.cpf, carregando, id])

  function atualizarCampo(campo, valor) {
    setPaciente((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(e) {
    e.preventDefault()
    const erroNome = validarNome(paciente.nome)
    const erroCpf = validarCpfFormato(paciente.cpf.replace(/\D/g, ''))
    if (erroNome || erroCpf || erros.cpf) {
      setErros({ nome: erroNome, cpf: erroCpf || erros.cpf })
      return
    }

    setSalvando(true)
    setErroGeral(null)
    const dados = {
      nome: paciente.nome.trim(),
      telefone: paciente.telefone || null,
      cpf: paciente.cpf.replace(/\D/g, '') || null,
      endereco: paciente.endereco || null,
      queixa_principal: paciente.queixa_principal || null,
    }
    try {
      const salvo = editando ? await atualizarPaciente(id, dados) : await criarPaciente(dados)
      navigate(`/pacientes/${salvo.id}`)
    } catch (err) {
      const detalhe = err.response?.data?.detail
      if (err.response?.status === 409) {
        setErros((atual) => ({ ...atual, cpf: detalhe }))
      } else if (Array.isArray(detalhe)) {
        setErros({
          nome: extrairErroDeCampo(err, 'nome') ?? '',
          cpf: extrairErroDeCampo(err, 'cpf') ?? '',
        })
      } else {
        setErroGeral('Não foi possível salvar o paciente.')
      }
      setSalvando(false)
    }
  }

  if (carregando) {
    return <p className="mx-auto max-w-2xl px-6 py-10 text-tintaSuave">Carregando...</p>
  }

  const temErroBloqueante = Boolean(erros.nome || erros.cpf)

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-tinta">
        {editando ? 'Editar paciente' : 'Novo paciente'}
      </h1>
      <p className="mb-6 text-sm text-tintaSuave">
        Campos com <span className="text-alerta">*</span> são obrigatórios.
      </p>

      <Cartao as="form" onSubmit={salvar} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tintaSuave">
            Dados pessoais
          </h2>

          <Campo
            rotulo="Nome *"
            value={paciente.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            erro={erros.nome}
            required
          />
          {!erros.nome && avisoNome && <p className="-mt-2 text-xs text-alerta">{avisoNome}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              rotulo="CPF"
              value={paciente.cpf}
              onChange={(e) => atualizarCampo('cpf', formatarCpfEntrada(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              erro={erros.cpf}
            />
            <Campo
              rotulo="Telefone"
              value={paciente.telefone ?? ''}
              onChange={(e) => atualizarCampo('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Campo
            rotulo="Endereço"
            value={paciente.endereco ?? ''}
            onChange={(e) => atualizarCampo('endereco', e.target.value)}
          />
        </div>

        <div className="space-y-4 border-t border-borda pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tintaSuave">
            Anamnese
          </h2>
          <Campo
            rotulo="Queixa principal"
            as="textarea"
            rows={4}
            value={paciente.queixa_principal ?? ''}
            onChange={(e) => atualizarCampo('queixa_principal', e.target.value)}
          />
        </div>

        {erroGeral && <p className="text-sm text-alerta">{erroGeral}</p>}

        <div className="flex justify-end gap-3 border-t border-borda pt-4">
          <Botao type="button" variante="secundaria" onClick={() => navigate(-1)}>
            Cancelar
          </Botao>
          <Botao type="submit" disabled={salvando || temErroBloqueante}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Botao>
        </div>
      </Cartao>
    </main>
  )
}
