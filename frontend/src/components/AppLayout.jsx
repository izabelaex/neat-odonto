import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Botao from './Botao'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  async function exit() {
    setLeaving(true)
    setError('')
    try { await signOut() } catch { setError('Não foi possível sair. Tente novamente.') }
    finally { setLeaving(false) }
  }
  const linkClass = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-principal text-white' : 'text-tintaSuave hover:bg-superficie'}`
  return <>
    <header className="border-b border-borda bg-cartao">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <NavLink to="/agenda" className="text-xl font-semibold text-principal">Neat Odonto</NavLink>
        <nav aria-label="Navegação principal" className="flex gap-2">
          <NavLink to="/agenda" className={linkClass}>Agenda</NavLink>
          <NavLink to="/pacientes" className={linkClass}>Pacientes</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tintaSuave">{user.name}</span>
          <Botao variante="secundaria" onClick={exit} disabled={leaving}>Sair</Botao>
        </div>
      </div>
      {error && <p role="alert" className="px-6 pb-3 text-alerta">{error}</p>}
    </header>
    <Outlet />
  </>
}
