import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { googleCalendarUrl } from '../api/auth'
import { errorMessage, listEvents } from '../api/calendar'
import { useAuth } from '../auth/AuthProvider'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'
import CalendarEventForm from '../components/CalendarEventForm'
import CalendarEventList from '../components/CalendarEventList'

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function selectedPeriod(value, view) {
  const [year, month, day] = value.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  if (!Number.isFinite(start.getTime())) return null
  if (view === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + (view === 'week' ? 7 : 1))
  return { start, end }
}

function periodDescription(period, view) {
  const options = { day: '2-digit', month: '2-digit' }
  if (view === 'day') return period.start.toLocaleDateString('pt-BR', options)
  const lastDay = new Date(period.end)
  lastDay.setDate(lastDay.getDate() - 1)
  return `${period.start.toLocaleDateString('pt-BR', options)} a ${lastDay.toLocaleDateString('pt-BR', options)}`
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
  return <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">Agenda</h1>
      {reconnect && <a href={googleCalendarUrl} className="rounded-md border border-borda bg-cartao px-4 py-2 text-sm font-medium text-principal">
        Conectar Google Agenda</a>}
    </div>
    {params.get('error') && <p role="alert" className="text-alerta">{params.get('error') === 'configuration'
      ? 'A conexão com Google Agenda ainda está sendo configurada.'
      : 'A conexão não foi concluída. Autorize a agenda com a mesma conta do login.'}</p>}
    {notice && <p role="status" className="text-ok">{notice}</p>}
    {error && <p role="alert" className="text-alerta">{error}</p>}
    {reconnect ? <Cartao className="space-y-3">
      <h2 className="text-lg font-semibold">Conecte sua agenda</h2>
      <p className="text-tintaSuave">Autorize o Google Agenda para consultar seus horários e criar agendamentos aqui.</p>
      <p className="text-sm text-tintaSuave">Seus pacientes continuam disponíveis no menu Pacientes.</p>
    </Cartao> : <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-4" aria-label={`Agenda ${view === 'week' ? 'da semana' : 'do dia'}`}>
        <div className="flex flex-wrap items-end gap-3">
          <Campo rotulo={view === 'week' ? 'Data de referência' : 'Dia'} type="date" value={date} required onChange={(e) => { setDate(e.target.value); setNotice('') }} />
          <div className="flex gap-2" role="group" aria-label="Visualização da agenda">
            <Botao type="button" variante={view === 'day' ? 'primaria' : 'secundaria'} onClick={() => setView('day')}>Dia</Botao>
            <Botao type="button" variante={view === 'week' ? 'primaria' : 'secundaria'} onClick={() => setView('week')}>Semana</Botao>
          </div>
          <Botao variante="secundaria" disabled={loading || !date} onClick={() => load()}>Atualizar</Botao>
        </div>
        {period && <p className="text-sm text-tintaSuave">Exibindo: {periodDescription(period, view)}</p>}
        {loading && <p role="status" className="text-tintaSuave">Carregando agenda...</p>}
        {!loading && <CalendarEventList events={events} onDeleted={(id) => {
          setEvents((current) => current.filter((event) => event.id !== id))
          setNotice('Agendamento excluído do Google Calendar.')
        }} />}
        {nextPage && <Botao variante="secundaria" disabled={loading} onClick={() => load(nextPage)}>Carregar mais</Botao>}
      </section>
      <section aria-label="Criar agendamento"><CalendarEventForm onCreated={() => {
        setNotice('Agendamento criado no Google. Consulte o período selecionado para vê-lo.'); load()
      }} /></section>
    </div>}
  </main>
}
