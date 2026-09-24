import Cartao from './Cartao'
import DeleteCalendarEvent from './DeleteCalendarEvent'

function eventTime(value) {
  if (value.dateTime) return new Date(value.dateTime).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  if (value.date) return `${value.date.split('-').reverse().join('/')} · Dia inteiro`
  return 'Horário não informado'
}

export default function CalendarEventList({ events, onDeleted }) {
  if (!events.length) return <Cartao><p className="text-tintaSuave">Nenhum agendamento neste período.</p></Cartao>
  return <ul className="space-y-3" aria-label="Agendamentos">
    {events.map((event) => <li key={event.id}>
      <Cartao className="space-y-1">
        <h3 className="font-semibold">{event.title}</h3>
        <p className="text-sm text-tintaSuave">{eventTime(event.start)}
          {event.end.dateTime && ` até ${eventTime(event.end)}`}</p>
        <DeleteCalendarEvent event={event} onDeleted={onDeleted} />
      </Cartao>
    </li>)}
  </ul>
}
