import { useState } from 'react'
import { deleteEvent, errorMessage } from '../api/calendar'
import Botao from './Botao'

export default function DeleteCalendarEvent({ event, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setDeleting(true)
    setError('')
    try {
      await deleteEvent(event.id)
      onDeleted(event.id)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível excluir o agendamento. Tente novamente.'))
    } finally { setDeleting(false) }
  }

  return <div className="space-y-2 pt-3">
    {confirming ? <div className="space-y-3 rounded-md border border-borda bg-superficie p-3">
      <p className="text-sm">Excluir “{event.title}” do Google Calendar?
        Esta ação remove este agendamento da agenda.</p>
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundaria" disabled={deleting} onClick={() => { setConfirming(false); setError('') }}>
          Manter agendamento
        </Botao>
        <Botao variante="perigo" disabled={deleting} onClick={remove}>
          {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
        </Botao>
      </div>
    </div> : <Botao variante="perigo" onClick={() => setConfirming(true)}
      aria-label={`Excluir agendamento: ${event.title}`}>Excluir agendamento</Botao>}
    {error && <p role="alert" className="text-alerta">{error}</p>}
  </div>
}
