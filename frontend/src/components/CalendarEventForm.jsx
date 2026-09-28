import { useRef, useState } from 'react'
import { createEvent, errorMessage } from '../api/calendar'
import Botao from './Botao'
import Campo from './Campo'
import Cartao from './Cartao'
import AppointmentScheduleFields from './AppointmentScheduleFields'
import PatientSearchSelect from './PatientSearchSelect'

export default function CalendarEventForm({ onCreated }) {
  const [draft, setDraft] = useState({ patient: null, title: '', date: '', startTime: '', endTime: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(null)
  function change(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    requestId.current = null
  }
  function changeSchedule(schedule) {
    setDraft((current) => ({ ...current, ...schedule }))
    requestId.current = null
  }
  async function save(event) {
    event.preventDefault()
    setError('')
    const start = new Date(`${draft.date}T${draft.startTime}`)
    const end = draft.endTime ? new Date(`${draft.date}T${draft.endTime}`) : null
    if (!draft.patient || !draft.title.trim() || !Number.isFinite(start.getTime())) {
      setError('Selecione o paciente, informe o procedimento e o horário de início.')
      return
    }
    if (end && (!Number.isFinite(end.getTime()) || end <= start)) {
      setError('O término deve ser posterior ao início no mesmo dia.')
      return
    }
    setSaving(true)
    requestId.current ??= crypto.randomUUID()
    try {
      const payload = { patient_id: draft.patient.id, title: draft.title.trim(),
        start: start.toISOString(), request_id: requestId.current }
      if (end) payload.end = end.toISOString()
      await createEvent(payload)
      setDraft({ patient: null, title: '', date: '', startTime: '', endTime: '' })
      requestId.current = null
      onCreated()
    } catch (err) { setError(errorMessage(err, 'Não foi possível confirmar. Tente novamente sem alterar os campos.')) }
    finally { setSaving(false) }
  }
  return <Cartao as="form" onSubmit={save} className="space-y-4 rounded-3xl">
    <h2 className="text-lg font-semibold">Novo agendamento</h2>
    <PatientSearchSelect patient={draft.patient} disabled={saving} onChange={(patient) => change('patient', patient)} />
    <div className="space-y-1">
      <Campo rotulo="Procedimento" value={draft.title} required maxLength={160} disabled={saving}
        placeholder="Limpeza, avaliação ou retorno" onChange={(e) => change('title', e.target.value)} />
      <p className="px-3 text-xs leading-relaxed text-tintaSuave">O procedimento será enviado ao Google. Evite CPF e informações clínicas.</p>
    </div>
    <AppointmentScheduleFields value={draft} disabled={saving} onChange={changeSchedule} />
    {error && <p role="alert" className="text-alerta">{error}</p>}
    <Botao type="submit" className="w-full rounded-full" disabled={saving}>{saving ? 'Salvando...' : 'Agendar consulta'}</Botao>
  </Cartao>
}
