/**
 * Campo de formulario com rotulo. Renderiza <input> por padrao; passe
 * `as="textarea"` para um texto maior (ex.: anamnese).
 */
export default function Campo({ rotulo, as: Elemento = 'input', className = '', ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-tintaSuave">{rotulo}</span>
      <Elemento
        className={`w-full rounded-md border border-borda bg-cartao px-3 py-2 text-tinta ${className}`}
        {...props}
      />
    </label>
  )
}
