import { Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import ListaPacientes from './pages/ListaPacientes'
import FormularioPaciente from './pages/FormularioPaciente'
import FichaPaciente from './pages/FichaPaciente'

/**
 * Arvore de rotas do sistema.
 *
 * Cada responsavel por uma area adiciona as rotas dela aqui, uma linha por rota.
 * Este arquivo e tocado por todo mundo: mantenha as alteracoes minimas para nao
 * gerar conflito de merge.
 */
export default function App() {
  return (
    <AuthProvider><Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route path="/" element={<Navigate to="/agenda" replace />} />
      <Route path="/pacientes" element={<ListaPacientes />} />
      <Route path="/pacientes/novo" element={<FormularioPaciente />} />
      <Route path="/pacientes/:id" element={<FichaPaciente />} />
      <Route path="/pacientes/:id/editar" element={<FormularioPaciente />} />
      <Route path="/agenda" element={<Agenda />} />
      </Route></Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></AuthProvider>
  )
}
