import Campo from './Campo'
import CalendarDatePicker from './CalendarDatePicker'

export default function AppointmentScheduleFields({ value, onChange, disabled = false }) {
  function change(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue })
  }

  return <fieldset className="space-y-2 rounded-md border border-borda px-3 pb-3 pt-2">
    <legend className="ml-3 px-1 text-sm font-medium text-tintaSuave">Horário da consulta</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <CalendarDatePicker label="Data" value={value.date} required disabled={disabled} className="w-full"
          onChange={(date) => change('date', date)} />
      </div>
      <Campo rotulo="Início" type="time" value={value.startTime} required disabled={disabled}
        onChange={(event) => change('startTime', event.target.value)} />
      <Campo rotulo="Término" type="time" value={value.endTime} disabled={disabled}
        onChange={(event) => change('endTime', event.target.value)} />
      <p className="-mt-2 px-3 text-xs leading-relaxed text-tintaSuave sm:col-span-2">
        Se não informar o término, a consulta terá duração de uma hora.
      </p>
    </div>
  </fieldset>
}
