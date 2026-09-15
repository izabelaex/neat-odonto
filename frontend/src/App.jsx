import { Routes, Route } from 'react-router-dom'
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
    <Routes>
      <Route path="/" element={<Placeholder />} />
      <Route path="/pacientes" element={<ListaPacientes />} />
      <Route path="/pacientes/novo" element={<FormularioPaciente />} />
      <Route path="/pacientes/:id" element={<FichaPaciente />} />
      <Route path="/pacientes/:id/editar" element={<FormularioPaciente />} />
      {/* <Route path="/agenda" element={<Agenda />} /> */}
    </Routes>
  )
}

function Placeholder() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-2xl font-semibold">Neat Odonto</h1>
      <p className="mt-2 text-tintaSuave">
        Estrutura inicial no ar. As telas entram a partir daqui.
      </p>
    </main>
  )
}
