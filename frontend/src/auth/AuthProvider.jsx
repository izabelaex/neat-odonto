import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, logout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try { setUser(await getSession()) } catch (err) {
      setUser(null)
      if (err.response?.status !== 401) setError('Não foi possível acessar o sistema. Tente novamente.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    refresh()
    const expired = () => setUser(null)
    window.addEventListener('session-expired', expired)
    return () => window.removeEventListener('session-expired', expired)
  }, [])

  async function signOut() {
    try { await logout() } catch (err) {
      if (err.response?.status !== 401) throw err
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, error, refresh, signOut }}>
    {children}
  </AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
