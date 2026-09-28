import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const THEME_KEY = 'neat-odonto-theme'

export default function AccountMenu({ user, onSignOut, leaving }) {
  const location = useLocation()
  const container = useRef(null)
  const trigger = useRef(null)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const name = user.name || user.email

  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!open) return
    function closeOutside(event) {
      if (!container.current?.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light') } catch {}
  }

  return <div ref={container} className="relative" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? 'account-menu' : undefined}
      aria-label={`Menu da conta de ${name}`} onClick={() => setOpen(!open)}
      className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-white hover:bg-white/15 focus-visible:outline-cabecalhoDestaque dark:border-cabecalhoDestaque/30 dark:bg-acao/20 dark:hover:bg-acao/30">
      <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-cabecalhoDestaque">
        {name.charAt(0).toLocaleUpperCase('pt-BR')}
      </span>
      <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{name}</span>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cabecalhoDestaque">
        <path d="m3 5 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
    {open && <div id="account-menu" className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-borda bg-cartao p-2 shadow-xl">
      <div className="flex items-center gap-2 border-b border-borda px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tinta" title={name}>{name}</p>
          <p className="truncate text-xs text-tintaSuave" title={user.email}>{user.email}</p>
        </div>
        <button type="button" onClick={toggleTheme}
          aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borda text-principal hover:bg-superficie">
          {dark ? <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </svg> : <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>}
        </button>
      </div>
      <button type="button" onClick={onSignOut} disabled={leaving}
        className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-tinta hover:bg-superficie disabled:cursor-not-allowed disabled:opacity-50">
        {leaving ? 'Saindo...' : 'Sair'}
      </button>
    </div>}
  </div>
}
