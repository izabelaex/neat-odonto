import { useState } from 'react'
import { deleteEvent, errorMessage } from '../api/calendar'
import Botao from './Botao'

export default function DeleteCalendarEvent({ event, onDeleted, compact = false, small = false }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const buttonSize = compact
    ? '!w-fit !rounded-full !px-1.5 !py-0.5 !text-[11px]'
    : small ? '!rounded-full !px-2 !py-1 !text-xs' : 'rounded-full'
  const deleteTextClass = `font-semibold text-red-600 transition-colors hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300 ${compact || small ? 'text-[11px]' : 'text-xs'}`

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

  return <div className="space-y-2">
    {confirming ? <div className="space-y-3 rounded-xl border border-borda bg-superficie p-3 text-center">
      <p className="text-sm">Excluir “{event.title}” do Google Calendar?
        Esta ação remove este agendamento da agenda.</p>
      <div className={`flex flex-wrap justify-center gap-2 ${compact ? 'flex-col items-center' : ''}`}>
        <Botao className={buttonSize}
          variante="secundaria" disabled={deleting} onClick={() => { setConfirming(false); setError('') }}>
          {compact || small ? 'Manter' : 'Manter agendamento'}
        </Botao>
        <Botao className={buttonSize}
          variante="perigo" disabled={deleting} onClick={remove}>
          {deleting ? 'Excluindo...' : compact || small ? 'Confirmar' : 'Confirmar exclusão'}
        </Botao>
      </div>
    </div> : <button type="button" onClick={() => setConfirming(true)}
      className={deleteTextClass} aria-label={`Excluir agendamento: ${event.title}`}>
      {compact || small ? 'Excluir' : 'Excluir agendamento'}
    </button>}
    {error && <p role="alert" className="text-alerta">{error}</p>}
  </div>
}
