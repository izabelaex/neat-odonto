import { screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import FormularioPlano from '../src/components/FormularioPlano'
import FormularioOrcamento from '../src/components/FormularioOrcamento'
import FormularioPagamento from '../src/components/FormularioPagamento'
import { installment, plan, renderComponent, respond, sent } from './support'

it.each(['plan', 'budget', 'payment'])('rejects zero and reports API failure in %s', async (kind) => {
  const done = vi.fn()
  const cancel = vi.fn()
  const components = {
    plan: <FormularioPlano pacienteId={1} onCriado={done} onCancelar={cancel} />,
    budget: <FormularioOrcamento plano={plan} onAlterado={done} onCancelar={cancel} />,
    payment: <FormularioPagamento parcela={installment} onRegistrado={done} onCancelar={cancel} />,
  }
  const user = renderComponent(components[kind])
  const isPayment = kind === 'payment'
  const input = screen.getByLabelText(isPayment ? 'Valor (R$)' : 'Orçamento total (R$)')
  const button = screen.getByRole('button', { name: isPayment ? 'Registrar pagamento' : kind === 'plan' ? 'Salvar plano' : 'Salvar orçamento' })
  if (kind === 'plan') await user.type(screen.getByLabelText('Procedimentos'), 'Limpeza')
  await user.clear(input)
  await user.type(input, '0')
  await user.click(button)
  expect(await screen.findByText(/Informe o valor/)).toBeVisible()
  expect(done).not.toHaveBeenCalled()
  const url = isPayment ? '/parcelas/1/pagamentos' : kind === 'plan' ? '/pacientes/1/planos-tratamento' : '/planos-tratamento/1/orcamento'
  const method = kind === 'budget' ? 'put' : 'post'
  respond(method, url, { detail: 'Valor recusado pelo servidor' }, 422)
  await user.clear(input)
  await user.type(input, '100,00')
  await user.click(button)
  expect(await screen.findByText('Valor recusado pelo servidor')).toBeVisible()
  expect(button).toBeEnabled()
  expect(sent(method, url)).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(cancel).toHaveBeenCalledOnce()
})

it('preserves paid installments when editing a budget', async () => {
  const paid = { ...installment, pagamentos: [{ id: 1 }] }
  const onAlterado = vi.fn()
  respond('put', '/planos-tratamento/1/orcamento', plan)
  const user = renderComponent(<FormularioOrcamento plano={{ ...plan, parcelas: [paid] }} onAlterado={onAlterado} />)
  expect(screen.getByText(/1 parcela já tem pagamento e será mantida/)).toBeVisible()
  await user.clear(screen.getByLabelText('Novas parcelas'))
  await user.type(screen.getByLabelText('Novas parcelas'), '2')
  await user.click(screen.getByRole('button', { name: 'Salvar orçamento' }))
  expect(onAlterado).toHaveBeenCalledWith(plan)
  expect(sent('put', '/planos-tratamento/1/orcamento')[0].body.numero_parcelas).toBe(2)
})
