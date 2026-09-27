import { useEffect, useState } from 'react'
import { buscarPacientes } from '../api/pacientes'
import Campo from './Campo'

export default function PatientSearchSelect({ patient, onChange, disabled = false }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setResults([])
    setError('')
    if (!term.trim()) {
      setLoading(false)
      return
    }
    setLoading(true)
    let active = true
    const timer = setTimeout(() => {
      buscarPacientes(term.trim())
        .then((items) => { if (active) setResults(items) })
        .catch(() => { if (active) setError('Não foi possível buscar pacientes.') })
        .finally(() => { if (active) setLoading(false) })
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [term])

  return <section className="space-y-2">
    <Campo rotulo="Paciente" value={term} disabled={disabled} required={!patient}
      placeholder={patient ? `Selecionado: ${patient.nome}` : 'Busque pelo nome ou CPF'}
      onChange={(event) => setTerm(event.target.value)} />
    {patient && <p className="text-sm text-tintaSuave">Paciente selecionado: <strong>{patient.nome}</strong></p>}
    {loading && <p className="text-sm text-tintaSuave">Buscando pacientes...</p>}
    {error && <p role="alert" className="text-alerta">{error}</p>}
    {term.trim() && !loading && !error && results.length === 0 && <p className="text-sm text-tintaSuave">Nenhum paciente encontrado.</p>}
    {results.length > 0 && <ul role="listbox" className="rounded-md border border-borda bg-cartao">
      {results.map((item) => <li key={item.id}>
        <button type="button" role="option" className="w-full px-3 py-2 text-left hover:bg-superficie"
          onClick={() => { onChange(item); setTerm(''); setResults([]) }}>
          {item.nome}{item.telefone ? ` — ${item.telefone}` : ''}
        </button>
      </li>)}
    </ul>}
  </section>
}
