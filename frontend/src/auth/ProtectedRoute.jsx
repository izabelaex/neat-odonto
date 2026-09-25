import { Navigate, Outlet } from 'react-router-dom'
import Botao from '../components/Botao'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute() {
  const { user, loading, error, refresh } = useAuth()
  if (loading) return <p className="px-6 py-10 text-tintaSuave">Verificando acesso...</p>
  if (error) return <main className="mx-auto max-w-2xl space-y-4 px-6 py-10">
    <p role="alert" className="text-alerta">{error}</p>
    <Botao onClick={refresh}>Tentar novamente</Botao>
  </main>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
