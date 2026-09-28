import { Link } from 'react-router-dom'
import DeleteCalendarEvent from './DeleteCalendarEvent'
import { eventTime } from './CalendarEventList'

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function eventDateKey(event) {
  return event.start?.date || event.start?.dateTime?.slice(0, 10)
}

function eventTimeRange(event) {
  const start = eventTime(event.start)
  return event.end?.dateTime ? `${start}–${eventTime(event.end)}` : start
}

export default function CalendarWeekGrid({ days, events, onDeleted, loading = false }) {
  const today = dateKey(new Date())
  const range = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} a ${days[days.length - 1].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`

  return <div role="region" tabIndex={0} aria-label={`Agendamentos da semana: ${range}`}
    className="overflow-x-auto rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal">
    <div className="grid min-w-[48rem] grid-cols-5 gap-3">
      {days.map((day) => {
        const key = dateKey(day)
        const dayEvents = events.filter((event) => eventDateKey(event) === key)
        const weekday = day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace(/\.$/, '')
        const month = day.toLocaleDateString('pt-BR', { month: 'short' }).replace(/\.$/, '')
        const isToday = key === today
        return <section key={key} aria-label={`${weekday}, ${day.getDate()} de ${month}`}
          className={`min-h-48 rounded-2xl border p-2 sm:p-3 ${isToday ? 'border-principal bg-cartao' : 'border-borda bg-cartao'}`}>
          <header className="mb-3 border-b border-borda pb-2 text-center">
            <p className="text-xs font-medium capitalize text-tintaSuave">{weekday}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${isToday ? 'text-principal' : 'text-tinta'}`}>{day.getDate()}</p>
            <p className="text-xs capitalize text-tintaSuave">{month}</p>
          </header>
          {dayEvents.length === 0 ? <p className="px-1 pt-2 text-center text-xs text-tintaSuave">
            {loading ? ' ' : 'Sem agendamentos'}
          </p> : <ul className="space-y-2">
            {dayEvents.map((event) => <li key={event.id} className="rounded-xl border border-borda bg-borda/50 p-2.5 text-center dark:bg-superficie">
              <h3 className="break-words text-sm font-semibold text-tinta">{event.title}</h3>
              <p className="mt-2 text-xs font-semibold tabular-nums text-principal">{eventTimeRange(event)}</p>
              <div className="mt-4 flex flex-col items-center gap-0">
                {event.can_register && <Link to={`/consultas/nova?agendamento=${encodeURIComponent(event.id)}`}
                  className="inline-flex w-fit rounded-full border border-acao bg-acao px-2.5 py-0.5 text-center text-[11px] font-medium text-white transition-colors hover:bg-principalClara">
                  Registrar consulta
                </Link>}
                <DeleteCalendarEvent event={event} onDeleted={onDeleted} compact />
              </div>
            </li>)}
          </ul>}
        </section>
      })}
    </div>
  </div>
}
