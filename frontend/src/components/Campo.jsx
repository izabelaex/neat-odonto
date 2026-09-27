/**
 * Campo de formulario com rotulo. Renderiza <input> por padrao; passe
 * `as="textarea"` para um texto maior (ex.: anamnese). Passe `erro` para
 * destacar o campo e mostrar a mensagem de validação embaixo dele.
 */
export default function Campo({ rotulo, erro, as: Elemento = 'input', className = '', ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-tintaSuave">{rotulo}</span>
      <Elemento
        className={`w-full rounded-md border bg-cartao px-3 py-2 text-tinta ${
          erro ? 'border-alerta' : 'border-borda'
        } ${className}`}
        {...props}
      />
      {erro && <span className="mt-1 block text-xs text-alerta">{erro}</span>}
    </label>
  )
}
