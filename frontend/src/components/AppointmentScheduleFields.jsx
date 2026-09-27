import Campo from './Campo'

export default function AppointmentScheduleFields({ value, onChange, disabled = false }) {
  function change(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue })
  }

  return <fieldset className="space-y-3 rounded-md border border-borda p-4">
    <legend className="px-1 text-sm font-medium text-tintaSuave">Horário da consulta</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Campo rotulo="Data" type="date" value={value.date} required disabled={disabled}
          onChange={(event) => change('date', event.target.value)} />
      </div>
      <Campo rotulo="Início" type="time" value={value.startTime} required disabled={disabled}
        onChange={(event) => change('startTime', event.target.value)} />
      <Campo rotulo="Término" type="time" value={value.endTime} disabled={disabled}
        onChange={(event) => change('endTime', event.target.value)} />
    </div>
    <p className="text-xs text-tintaSuave">Se não informar o término, a consulta terá duração de uma hora.</p>
  </fieldset>
}
