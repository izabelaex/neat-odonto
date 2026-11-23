import { screen } from '@testing-library/react'
import { chooseToday, patient, respond } from './support'

export const consultation = { id: 1, paciente_id: 1, paciente_nome: patient.nome,
  data: '2026-10-10', procedimentos_realizados: 'Avaliação', observacoes: 'Retorno',
  esterilizacao: { identificacao_pacote: 'Lote teste', ciclo: 'Ciclo teste',
    data_ciclo: '2026-10-09', responsavel: 'Responsável fictício', tem_foto: true } }

export async function fillConsultation(user) {
  respond('post', '/pacientes/busca', [patient])
  await user.type(await screen.findByLabelText('Buscar e selecionar paciente (obrigatório)'), 'Fictício')
  await user.click(await screen.findByRole('button', { name: /Paciente Fictício/ }))
  await chooseToday(user, 0)
  await user.type(screen.getByLabelText('Procedimentos realizados'), 'Avaliação')
  await user.type(screen.getByLabelText('Observações (opcional)'), 'Retorno')
  await user.type(screen.getByLabelText('Ciclo'), 'Ciclo teste')
  await chooseToday(user, 1)
  await user.type(screen.getByLabelText('Responsável pela esterilização'), 'Responsável fictício')
}
