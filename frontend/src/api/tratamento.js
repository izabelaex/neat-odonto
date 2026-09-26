import client from './client'

/**
 * Chamadas da API do plano de tratamento, parcelas e pagamentos (historia 8).
 * Nenhuma tela deve chamar o client HTTP direto — tudo passa por aqui.
 *
 * Valores monetarios vao e voltam como inteiros em centavos.
 */

export function listarPlanos(pacienteId) {
  return client.get(`/pacientes/${pacienteId}/planos-tratamento`).then((r) => r.data)
}

export function criarPlano(pacienteId, dados) {
  return client.post(`/pacientes/${pacienteId}/planos-tratamento`, dados).then((r) => r.data)
}

export function atualizarPlano(planoId, dados) {
  return client.put(`/planos-tratamento/${planoId}`, dados).then((r) => r.data)
}

/** Refaz orcamento e parcelas. A API recusa se o plano ja tiver pagamentos. */
export function alterarOrcamento(planoId, dados) {
  return client.put(`/planos-tratamento/${planoId}/orcamento`, dados).then((r) => r.data)
}

export function removerPlano(planoId) {
  return client.delete(`/planos-tratamento/${planoId}`)
}

/** Devolve o plano inteiro, com os totais ja recalculados. */
export function registrarPagamento(parcelaId, dados) {
  return client.post(`/parcelas/${parcelaId}/pagamentos`, dados).then((r) => r.data)
}

/** Devolve o plano inteiro, com os totais ja recalculados. */
export function removerPagamento(pagamentoId) {
  return client.delete(`/pagamentos/${pagamentoId}`).then((r) => r.data)
}
