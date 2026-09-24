import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { getAuthStatus, googleLoginUrl, loginErrors } from '../api/auth'
import { useAuth } from '../auth/AuthProvider'
import Botao from '../components/Botao'
import Cartao from '../components/Cartao'

export default function Login() {
  const { user, loading, error: sessionError, refresh } = useAuth()
  const [params] = useSearchParams()
  const [configured, setConfigured] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  function checkConfiguration() {
    setError('')
    getAuthStatus().then((data) => setConfigured(data.configured))
      .catch(() => setError('Não foi possível conectar ao sistema. Tente novamente.'))
  }
  useEffect(checkConfiguration, [])
  if (loading) return <p className="px-6 py-10 text-tintaSuave">Verificando acesso...</p>
  if (user) return <Navigate to="/agenda" replace />
  return <main className="mx-auto max-w-md px-6 py-20">
    <p className="mb-2 text-sm font-medium text-principal">Neat Odonto</p>
    <h1 className="text-3xl font-semibold text-tinta">Bem-vinda ao seu consultório</h1>
    <p className="mb-8 mt-3 text-tintaSuave">Pacientes e agenda, organizados em um só lugar.</p>
    <Cartao className="space-y-5">
      <h2 className="text-lg font-semibold">Acesse sua conta</h2>
      <p className="text-sm text-tintaSuave">Entre com a conta Google autorizada para o consultório.</p>
      {params.get('error') && <p role="alert" className="text-alerta">
        {loginErrors[params.get('error')] || 'Não foi possível concluir o acesso. Tente novamente.'}
      </p>}
      {configured === false && <p role="status" className="text-alerta">
        O acesso Google está sendo configurado. Entre em contato com o responsável pelo sistema.
      </p>}
      {(error || sessionError) && <div role="alert" className="space-y-3 text-alerta">
        <p>{error || sessionError}</p>
        <Botao variante="secundaria" onClick={() => { checkConfiguration(); refresh() }}>Tentar novamente</Botao>
      </div>}
      <Botao className="w-full" variante="secundaria" disabled={!configured || starting}
        onClick={() => { setStarting(true); window.location.assign(googleLoginUrl) }}>
        {starting ? 'Redirecionando...' : 'Entrar com Google'}
      </Botao>
      <p className="text-xs text-tintaSuave">A conexão com sua agenda será autorizada separadamente.</p>
    </Cartao>
  </main>
}
