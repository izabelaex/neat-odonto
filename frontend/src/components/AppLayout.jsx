import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import AccountMenu from './AccountMenu'
import tooth from '../assets/tooth.svg'

const links = [
  { to: '/agenda', label: 'Agenda' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/consultas', label: 'Consultas' },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  const activeIndex = Math.max(0, links.findIndex(({ to }) => pathname.startsWith(to)))
  async function exit() {
    setLeaving(true)
    setError('')
    try { await signOut() } catch { setError('Não foi possível sair. Tente novamente.') }
    finally { setLeaving(false) }
  }
  return <>
    <header className="bg-cabecalho text-white dark:border-b dark:border-cabecalhoDestaque/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 md:flex-nowrap md:gap-6 md:py-5">
        <NavLink to="/agenda" className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full text-xl font-semibold text-white focus-visible:outline-cabecalhoDestaque">
          <span>Neat Odonto</span><img src={tooth} alt="" className="h-8 w-8" />
        </NavLink>
        <nav aria-label="Navegação principal" className="relative order-3 grid w-full grid-cols-3 py-1 md:order-none md:mx-auto md:w-72 md:shrink-0 lg:w-80">
          <span aria-hidden="true" className="absolute inset-y-1 left-0 w-1/3 rounded-full bg-cabecalhoDestaque transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-acao"
            style={{ transform: `translateX(${activeIndex * 100}%)` }} />
          {links.map(({ to, label }) => <NavLink key={to} to={to}
            className={({ isActive }) => `relative z-10 rounded-full px-3 py-2 text-center text-sm font-medium focus-visible:outline-white ${isActive ? 'text-cabecalho dark:text-white' : 'text-white/85 hover:text-white'}`}>
            {label}
          </NavLink>)}
        </nav>
        <AccountMenu user={user} onSignOut={exit} leaving={leaving} />
      </div>
    </header>
    {error && <div className="border-b border-borda bg-cartao">
      <p role="alert" className="mx-auto max-w-6xl px-4 py-2 text-sm text-alerta sm:px-6">{error}</p>
    </div>}
    <Outlet />
  </>
}
