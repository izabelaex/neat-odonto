import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { googleCalendarUrl } from '../api/auth'
import { errorMessage, listEvents } from '../api/calendar'
import { useAuth } from '../auth/AuthProvider'
import Botao from '../components/Botao'
import Cartao from '../components/Cartao'
import CalendarDatePicker from '../components/CalendarDatePicker'
import CalendarEventForm from '../components/CalendarEventForm'
import CalendarEventList from '../components/CalendarEventList'
import CalendarWeekGrid from '../components/CalendarWeekGrid'

function today() {
  const now = new Date()
  return dateValue(now)
}

function dateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function selectedPeriod(value, view) {
  const [year, month, day] = value.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  if (!Number.isFinite(start.getTime())) return null
  if (view === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + (view === 'week' ? 5 : 1))
  return { start, end }
}

function periodDescription(period, view) {
  const options = { day: '2-digit', month: 'short' }
  if (view === 'day') return period.start.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const lastDay = new Date(period.end)
  lastDay.setDate(lastDay.getDate() - 1)
  return `${period.start.toLocaleDateString('pt-BR', options)} – ${lastDay.toLocaleDateString('pt-BR', { ...options, year: 'numeric' })}`
}

function shiftDate(value, amount) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + amount)
  return dateValue(date)
}

function Arrow({ direction }) {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    {direction === 'left' ? <path d="m12.5 4.5-5.5 5.5 5.5 5.5" /> : <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />}
    <path d={direction === 'left' ? 'M7.5 10h9' : 'M3.5 10h9'} />
  </svg>
}

function DateNavigation({ date, view, loading, onChange }) {
  const step = view === 'week' ? 7 : 1
  return <button type="button" aria-label={view === 'week' ? 'Próxima semana' : 'Próximo dia'}
      className="rounded-full p-2 text-tintaSuave transition-colors hover:bg-superficie hover:text-tinta disabled:opacity-50"
      disabled={loading || !date} onClick={() => onChange(shiftDate(date, step))}>
    <Arrow direction="right" />
  </button>
}

export default function Agenda() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [date, setDate] = useState(today)
  const [view, setView] = useState('day')
  const [events, setEvents] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reconnect, setReconnect] = useState(!user.calendar_connected)
  const version = useRef(0)

  async function load(pageToken = null) {
    const current = ++version.current
    setError(''); setLoading(true)
    if (!pageToken) { setEvents([]); setNextPage(null) }
    const period = selectedPeriod(date, view)
    if (!period) { setLoading(false); return }
    try {
      const data = await listEvents(period.start.toISOString(), period.end.toISOString(), pageToken)
      if (version.current !== current) return
      setEvents((old) => pageToken ? [...old, ...data.items] : data.items)
      setNextPage(data.next_page_token)
      setReconnect(false)
    } catch (err) {
      if (version.current !== current) return
      setError(errorMessage(err, 'Não foi possível carregar a agenda.'))
      if (err.response?.status === 409) setReconnect(true)
    } finally { if (version.current === current) setLoading(false) }
  }

  useEffect(() => {
    if (user.calendar_connected) load()
    return () => { version.current++ }
  }, [date, view, user.calendar_connected])

  const period = selectedPeriod(date, view)
  const days = period && view === 'week'
    ? Array.from({ length: 5 }, (_, index) => {
      const day = new Date(period.start)
      day.setDate(day.getDate() + index)
      return day
    }) : []
  const handleDeleted = (id) => {
    setEvents((current) => current.filter((event) => event.id !== id))
    setNotice('Agendamento excluído do Google Calendar.')
  }
  const handleDateChange = (value) => { setDate(value); setNotice('') }
  const form = <CalendarEventForm onCreated={() => {
    setNotice('Agendamento criado no Google. Consulte o período selecionado para vê-lo.'); load()
  }} />

  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
    {params.get('error') && <p role="alert" className="rounded-xl border border-alerta/30 bg-cartao px-4 py-3 text-sm text-alerta">{params.get('error') === 'configuration'
      ? 'A conexão com Google Agenda ainda está sendo configurada.'
      : 'A conexão não foi concluída. Autorize a agenda com a mesma conta do login.'}</p>}
    {notice && <p role="status" className="rounded-xl border border-principal/20 bg-cartao px-4 py-3 text-sm text-principal">{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-alerta/30 bg-cartao px-4 py-3 text-sm text-alerta">{error}</p>}

    {reconnect ? <Cartao className="space-y-3 rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold">Conecte sua agenda</h2>
      <p className="text-tintaSuave">Autorize o Google Agenda para consultar seus horários e criar agendamentos aqui.</p>
      <p className="text-sm text-tintaSuave">Seus pacientes continuam disponíveis no menu Pacientes.</p>
      <a href={googleCalendarUrl} className="inline-flex rounded-full bg-acao px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-principalClara">
        Conectar Google Agenda</a>
    </Cartao> : <>
      <section aria-label="Controles da agenda" className="rounded-2xl border border-borda bg-cartao p-3 shadow-sm sm:px-4 sm:py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <CalendarDatePicker value={date} onChange={handleDateChange} disabled={loading} />
            <Botao type="button" variante="secundaria" className="h-9 !rounded-full px-3 py-1.5" disabled={loading || !date}
              onClick={() => handleDateChange(today())}>Hoje</Botao>
            <DateNavigation date={date} view={view} loading={loading} onChange={handleDateChange} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-superficie p-1" role="group" aria-label="Visualização da agenda">
              {['day', 'week'].map((option) => <button key={option} type="button" aria-pressed={view === option}
                onClick={() => { setView(option); setNotice('') }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${view === option ? 'bg-borda text-principal shadow-sm dark:bg-cartao' : 'text-tintaSuave hover:text-tinta'}`}>
                {option === 'day' ? 'Dia' : 'Semana'}
              </button>)}
            </div>
            <Botao variante="secundaria" aria-label="Atualizar agenda" title="Atualizar agenda"
              className="!inline-flex h-12 w-12 items-center justify-center rounded-full !border-0 !bg-transparent !p-0 !text-tintaSuave transition-colors hover:!bg-transparent hover:!text-principal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal"
              disabled={loading || !date} onClick={() => load()}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={`h-8 w-8 ${loading ? 'animate-spin' : ''}`}>
                <path d="M20 11a8 8 0 0 0-14.8-3L4 10M4 5v5h5M4 13a8 8 0 0 0 14.8 3L20 14m0 5v-5h-5"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Botao>
          </div>
        </div>
        {period && <p className="mt-3 border-t border-borda pt-3 text-xs font-medium capitalize text-tintaSuave">
          {periodDescription(period, view)}
        </p>}
      </section>

      {view === 'day' ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 space-y-3" aria-label="Agendamentos do dia">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span aria-hidden="true" />
            <h2 className="text-center text-lg font-semibold text-tinta">Atendimentos</h2>
            <span className="justify-self-end rounded-full bg-superficie px-3 py-1 text-xs font-medium text-tintaSuave">
              {events.length} {events.length === 1 ? 'agendamento' : 'agendamentos'}
            </span>
          </div>
          <CalendarEventList events={events} loading={loading} onDeleted={handleDeleted} />
          {nextPage && <Botao variante="secundaria" className="rounded-full" disabled={loading} onClick={() => load(nextPage)}>Carregar mais</Botao>}
        </section>
        <section aria-label="Criar agendamento" className="lg:sticky lg:top-6">{form}</section>
      </div> : <div className="space-y-6">
        <section className="space-y-3" aria-label="Agendamentos da semana">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span aria-hidden="true" />
            <h2 className="text-center text-lg font-semibold text-tinta">Semana</h2>
            <span className="justify-self-end rounded-full bg-superficie px-3 py-1 text-xs font-medium text-tintaSuave">
              {events.length} {events.length === 1 ? 'agendamento' : 'agendamentos'}
            </span>
          </div>
          {loading && <p role="status" className="text-sm text-tintaSuave">Carregando agenda...</p>}
          {days.length === 5 ? <CalendarWeekGrid days={days} events={events} onDeleted={handleDeleted} loading={loading} />
            : <p className="rounded-2xl border border-dashed border-borda bg-cartao px-6 py-10 text-center text-sm text-tintaSuave">
              Selecione uma data para exibir a semana.
            </p>}
          {nextPage && <Botao variante="secundaria" className="rounded-full" disabled={loading} onClick={() => load(nextPage)}>Carregar mais</Botao>}
        </section>
        <section aria-label="Criar agendamento" className="mx-auto w-full max-w-3xl">{form}</section>
      </div>}
    </>}
  </main>
}
