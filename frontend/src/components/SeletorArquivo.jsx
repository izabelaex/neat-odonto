import { useId, useRef } from 'react'

export default function SeletorArquivo({ label, accept, hint, file, disabled = false, onChange }) {
  const inputRef = useRef(null)
  const inputId = useId()
  const hintId = `${inputId}-hint`

  return <div className="space-y-1">
    {label && <p className="text-sm font-medium text-tintaSuave">{label}</p>}
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-borda bg-superficie px-4 py-3 transition-colors ${disabled ? 'opacity-50' : 'hover:border-principal/50'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cartao text-principal">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-tinta">{file?.name || 'Nenhum arquivo selecionado'}</span>
          <span id={hintId} className="mt-0.5 block text-xs text-tintaSuave">{hint}</span>
        </span>
      </div>
      <button type="button" disabled={disabled} aria-describedby={hintId}
        onClick={() => { if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() } }}
        className="shrink-0 rounded-full border border-borda bg-cartao px-3 py-1.5 text-xs font-semibold text-principal transition-colors hover:bg-superficie disabled:cursor-not-allowed">
        Escolher arquivo
      </button>
      <input ref={inputRef} id={inputId} type="file" accept={accept} disabled={disabled} tabIndex={-1}
        aria-hidden="true" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </div>
  </div>
}
