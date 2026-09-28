import { useEffect, useId, useRef, useState } from 'react'

function toDate(value) {
  if (!value) return new Date()
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function sameDay(first, second) { return dateValue(first) === dateValue(second) }

export default function CalendarDatePicker({ value, onChange, disabled = false, label, required = false, clearable = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const calendarId = useId()
  const [month, setMonth] = useState(() => {
    const date = toDate(value)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const rootRef = useRef(null)
  const selected = value ? toDate(value) : null
  const today = new Date()
  useEffect(() => {
    const date = toDate(value)
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }, [value])
  useEffect(() => {
    function closeFromOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeFromOutside)
    return () => document.removeEventListener('pointerdown', closeFromOutside)
  }, [])
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = new Date(firstDay)
  gridStart.setDate(1 - ((firstDay.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const selectedLabel = selected?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
  function shiftMonth(amount) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }
  return <div ref={rootRef} className={`relative ${className}`}>
    {label && <span className="mb-1 block text-sm font-medium text-tintaSuave">{label}{required && <span className="ml-1 text-alerta" aria-hidden="true">*</span>}</span>}
    <button type="button" aria-label={selectedLabel ? `Selecionar data, atual ${selectedLabel}` : 'Selecionar data'} aria-required={required} aria-haspopup="dialog"
      aria-expanded={open} aria-controls={calendarId} disabled={disabled}
      onClick={() => setOpen((current) => !current)}
      className={`inline-flex h-9 min-w-[9.5rem] items-center gap-2 rounded-full border border-borda bg-cartao px-3 text-sm font-medium text-tinta transition-colors hover:bg-superficie disabled:opacity-50 ${className.includes('w-full') ? 'w-full justify-start' : ''}`}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-principal">
        <rect x="3" y="4.5" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 3v3M13.5 3v3M3.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="capitalize">{selectedLabel || 'Selecionar data'}</span>
    </button>
    {open && <div id={calendarId} role="dialog" aria-label="Selecionar data da agenda"
      className="absolute left-0 top-full z-30 mt-2 w-[17.5rem] rounded-2xl border border-borda bg-cartao p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}
          className="rounded-full p-1.5 text-tintaSuave transition-colors hover:bg-superficie hover:text-tinta">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m12 4.5-5.5 5.5 5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h2 className="text-sm font-semibold capitalize text-tinta">{monthLabel}</h2>
        <button type="button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}
          className="rounded-full p-1.5 text-tintaSuave transition-colors hover:bg-superficie hover:text-tinta">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m8 4.5 5.5 5.5L8 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => <span key={label} aria-hidden="true"
          className="py-1 text-[10px] font-medium text-tintaSuave">{label}</span>)}
        {days.map((day) => {
          const inMonth = day.getMonth() === month.getMonth()
          const isSelected = selected ? sameDay(day, selected) : false
          const isToday = sameDay(day, today)
          return <button key={dateValue(day)} type="button" aria-label={day.toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            aria-pressed={isSelected} onClick={() => { onChange(dateValue(day)); setOpen(false) }}
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
              isSelected ? 'bg-principal text-white font-semibold' : inMonth ? 'text-tinta hover:bg-superficie' : 'text-tintaSuave/50 hover:bg-superficie'
            } ${isToday && !isSelected ? 'ring-1 ring-principal text-principal font-semibold' : ''}`}>
            {day.getDate()}
          </button>
        })}
      </div>
      <div className="mt-2 border-t border-borda pt-2 text-right">
        {clearable && value && <button type="button" onClick={() => { onChange(''); setOpen(false) }}
          className="mr-2 rounded-full px-3 py-1.5 text-sm font-medium text-tintaSuave transition-colors hover:bg-superficie">Limpar</button>}
        <button type="button" onClick={() => { const date = new Date(); onChange(dateValue(date)); setOpen(false) }}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-principal transition-colors hover:bg-superficie">Ir para hoje</button>
      </div>
    </div>}
  </div>
}
