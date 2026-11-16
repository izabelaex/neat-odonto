import { BACKEND_URL, FRONTEND_URL } from './env.js'

/**
 * Cria um paciente direto pela API, para testes que não estão avaliando o
 * cadastro em si (ver pacientes.spec.js) e só precisam de um paciente pronto.
 *
 * O header Origin é necessário porque a API rejeita escritas sem ele
 * (backend/app/auth/sessions.py), como proteção contra requisições forjadas.
 */
export async function criarPacienteApi(request, dados = {}) {
  const resposta = await request.post(`${BACKEND_URL}/pacientes`, {
    headers: { origin: FRONTEND_URL },
    data: {
      // Sem dígitos: a validação de nome (frontend e API) rejeita números
      // ("E2E" tem um "2" — por isso o nome usa só "teste").
      nome: 'Paciente de teste automatizado',
      telefone: null,
      cpf: null,
      endereco: null,
      queixa_principal: null,
      ...dados,
    },
  })
  if (!resposta.ok()) {
    throw new Error(`Falha ao criar paciente de teste via API: ${resposta.status()} ${await resposta.text()}`)
  }
  return resposta.json()
}
