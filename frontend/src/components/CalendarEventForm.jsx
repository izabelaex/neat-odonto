import { useRef, useState } from 'react'
import { createEvent, errorMessage } from '../api/calendar'
import Botao from './Botao'
import Campo from './Campo'
import Cartao from './Cartao'

export default function CalendarEventForm({ onCreated }) {
  const [draft, setDraft] = useState({ title: '', start: '', end: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(null)
  function change(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    requestId.current = null
  }
  async function save(event) {
    event.preventDefault()
    setError('')
    const start = new Date(draft.start), end = new Date(draft.end)
    if (!draft.title.trim() || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError('Preencha o título e um término posterior ao início.')
      return
    }
    setSaving(true)
    requestId.current ??= crypto.randomUUID()
    try {
      await createEvent({ title: draft.title.trim(), start: start.toISOString(),
        end: end.toISOString(), request_id: requestId.current })
      setDraft({ title: '', start: '', end: '' })
      requestId.current = null
      onCreated()
    } catch (err) { setError(errorMessage(err, 'Não foi possível confirmar. Tente novamente sem alterar os campos.')) }
    finally { setSaving(false) }
  }
  return <Cartao as="form" onSubmit={save} className="space-y-4">
    <h2 className="text-lg font-semibold">Novo agendamento</h2>
    <Campo rotulo="Título" value={draft.title} required maxLength={160} disabled={saving}
      placeholder="Consulta odontológica" onChange={(e) => change('title', e.target.value)} />
    <p className="text-xs text-tintaSuave">O título será enviado ao Google. Evite CPF e informações clínicas.</p>
    <Campo rotulo="Início" type="datetime-local" value={draft.start} required disabled={saving}
      onChange={(e) => change('start', e.target.value)} />
    <Campo rotulo="Término" type="datetime-local" value={draft.end} required disabled={saving}
      onChange={(e) => change('end', e.target.value)} />
    {error && <p role="alert" className="text-alerta">{error}</p>}
    <Botao type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Agendar consulta'}</Botao>
  </Cartao>
}
