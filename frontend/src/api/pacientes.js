import client from './client'

/**
 * Chamadas da API relacionadas a pacientes. Nenhuma tela deve chamar
 * o client HTTP direto — tudo passa por aqui.
 *
 * A busca por nome ou CPF usa POST (buscarPacientes), não GET: o termo
 * pode ser um CPF, que nunca deve ir em querystring de URL nem em log
 * de acesso (ver AGENTS.md, seção 3).
 */

export function listarPacientes(nome) {
  return client.get('/pacientes', { params: nome ? { nome } : {} }).then((r) => r.data)
}

export function buscarPacientes(termo) {
  return client.post('/pacientes/busca', { termo }).then((r) => r.data)
}

export function obterPaciente(id) {
  return client.get(`/pacientes/${id}`).then((r) => r.data)
}

export function criarPaciente(dados) {
  return client.post('/pacientes', dados).then((r) => r.data)
}

export function atualizarPaciente(id, dados) {
  return client.put(`/pacientes/${id}`, dados).then((r) => r.data)
}

export function adicionarDocumento(id, { tipo, descricao, arquivo }) {
  const form = new FormData()
  form.append('tipo', tipo)
  if (descricao) form.append('descricao', descricao)
  form.append('arquivo', arquivo)
  return client
    .post(`/pacientes/${id}/documentos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export function removerDocumento(pacienteId, documentoId) {
  return client.delete(`/pacientes/${pacienteId}/documentos/${documentoId}`)
}

export function urlDocumento(pacienteId, documentoId) {
  return `${client.defaults.baseURL}/pacientes/${pacienteId}/documentos/${documentoId}/arquivo`
}
