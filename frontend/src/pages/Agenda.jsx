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

export default function Agenda() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [date, setDate] = useState(today)
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
    const start = new Date(`${date}T00:00:00`), end = new Date(start)
    end.setDate(end.getDate() + 1)
    if (!Number.isFinite(start.getTime())) { setLoading(false); return }
    try {
      const data = await listEvents(start.toISOString(), end.toISOString(), pageToken)
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
  }, [date, user.calendar_connected])
  return <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="mt-1 text-tintaSuave">Horários no fuso do dispositivo: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p></div>
      <a href={googleCalendarUrl} className="rounded-md border border-borda bg-cartao px-4 py-2 text-sm font-medium text-principal">
        {reconnect ? 'Conectar Google Agenda' : 'Reconectar Google Agenda'}</a>
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
      <section className="space-y-4" aria-label="Agenda do dia">
        <div className="flex flex-wrap items-end gap-3">
          <Campo rotulo="Dia" type="date" value={date} required onChange={(e) => { setDate(e.target.value); setNotice('') }} />
          <Botao variante="secundaria" disabled={loading || !date} onClick={() => load()}>Atualizar</Botao>
        </div>
        {loading && <p role="status" className="text-tintaSuave">Carregando agenda...</p>}
        {!loading && <CalendarEventList events={events} onDeleted={(id) => {
          setEvents((current) => current.filter((event) => event.id !== id))
          setNotice('Agendamento excluído do Google Calendar.')
        }} />}
        {nextPage && <Botao variante="secundaria" disabled={loading} onClick={() => load(nextPage)}>Carregar mais</Botao>}
      </section>
      <section aria-label="Criar agendamento"><CalendarEventForm onCreated={() => {
        setNotice('Agendamento criado no Google. Se necessário, selecione o dia agendado para vê-lo.'); load()
      }} /></section>
    </div>}
  </main>
}
