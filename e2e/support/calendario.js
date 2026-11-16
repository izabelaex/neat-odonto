/**
 * Preenche um CalendarDatePicker (frontend/src/components/CalendarDatePicker.jsx)
 * com a data de hoje. O componente não tem <input type="date">: é um botão que
 * abre um calendário próprio, com um atalho "Ir para hoje" que evita ter que
 * navegar mês a dia.
 */
export async function definirDataParaHoje(page, botaoAbrirCalendario) {
  await botaoAbrirCalendario.click()
  await page
    .getByRole('dialog', { name: 'Selecionar data da agenda' })
    .getByRole('button', { name: 'Ir para hoje' })
    .click()
}
