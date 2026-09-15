const VARIANTES = {
  primaria: 'bg-principal text-white hover:bg-principalClara',
  secundaria: 'border border-borda bg-cartao text-tinta hover:bg-superficie',
  perigo: 'border border-alerta text-alerta hover:bg-superficie',
}

/**
 * Botao base do sistema. Usar em vez de <button> cru nas telas, para as
 * quatro areas nao inventarem estilos diferentes (tokens em tailwind.config.js).
 */
export default function Botao({ variante = 'primaria', className = '', ...props }) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  )
}
