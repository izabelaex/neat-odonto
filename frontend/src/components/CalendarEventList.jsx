import { Link } from 'react-router-dom'
import DeleteCalendarEvent from './DeleteCalendarEvent'

export function eventTime(value) {
  if (value?.dateTime) return new Date(value.dateTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', ...(value.timeZone ? { timeZone: value.timeZone } : {}),
  })
  if (value?.date) return 'Dia inteiro'
  return 'Horário não informado'
}

export default function CalendarEventList({ events, onDeleted, loading = false }) {
  if (!events.length) return <div className="rounded-2xl border border-dashed border-borda bg-cartao px-6 py-10 text-center">
    <p role={loading ? 'status' : undefined} className="text-tintaSuave">
      {loading ? 'Carregando agenda...' : 'Nenhum agendamento neste dia.'}
    </p>
  </div>
  return <ol className="overflow-hidden rounded-2xl border border-borda bg-cartao divide-y divide-borda" aria-label="Agendamentos do dia">
    {events.map((event) => <li key={event.id} className="grid grid-cols-[minmax(0,1fr)_6rem] gap-4 p-4">
      <div className="min-w-0">
        <h3 className="font-semibold text-tinta">{event.title}</h3>
        <p className="mt-1 text-sm text-tintaSuave">{event.patient_name || 'Paciente não informado'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {event.can_register && <Link to={`/consultas/nova?agendamento=${encodeURIComponent(event.id)}`}
            className="rounded-full border border-acao bg-acao px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-principalClara">
            Registrar consulta
          </Link>}
          <DeleteCalendarEvent event={event} onDeleted={onDeleted} small />
        </div>
      </div>
      <div className="pt-0.5 text-right">
        <time dateTime={event.start.dateTime || event.start.date} className="text-sm font-semibold tabular-nums text-principal">
          {eventTime(event.start)}{event.end?.dateTime && ` – ${eventTime(event.end)}`}
        </time>
      </div>
    </li>)}
  </ol>
}
