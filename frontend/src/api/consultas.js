import client from './client'

export function listarConsultas({ pacienteId, data } = {}) {
  const caminho = pacienteId ? `/pacientes/${pacienteId}/consultas` : '/consultas'
  return client.get(caminho, { params: data ? { data } : {} }).then((r) => r.data)
}

export function obterConsulta(id) {
  return client.get(`/consultas/${id}`).then((r) => r.data)
}

export function criarConsulta(pacienteId, dados) {
  return client.post(`/pacientes/${pacienteId}/consultas`, dados).then((r) => r.data)
}

export function atualizarConsulta(id, dados) {
  return client.put(`/consultas/${id}`, dados).then((r) => r.data)
}

export function urlFotoEsterilizacao(id) {
  return `${client.defaults.baseURL}/consultas/${id}/esterilizacao/foto`
}
