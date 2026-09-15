/**
 * Cartao base (fundo branco, borda suave). Aceita `as="form"` quando
 * envolve um formulario.
 */
export default function Cartao({ as: Elemento = 'div', className = '', ...props }) {
  return (
    <Elemento
      className={`rounded-lg border border-borda bg-cartao p-6 shadow-sm ${className}`}
      {...props}
    />
  )
}
