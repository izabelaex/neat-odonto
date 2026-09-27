const FORMAS_PAGAMENTO = [
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'transferencia', rotulo: 'Transferência' },
  { valor: 'outro', rotulo: 'Outro' },
]

/** "pix" -> "Pix". Usado tambem para exibir pagamentos ja registrados. */
export function rotuloFormaPagamento(forma) {
  return FORMAS_PAGAMENTO.find((f) => f.valor === forma)?.rotulo ?? 'Não informada'
}

/**
 * Seletor da forma de pagamento. Informar a forma e opcional: o valor vazio
 * vira null na API.
 */
export default function SelecaoFormaPagamento({ value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-tintaSuave">Forma</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-borda bg-cartao px-3 py-2 text-tinta"
      >
        <option value="">Não informar</option>
        {FORMAS_PAGAMENTO.map((f) => (
          <option key={f.valor} value={f.valor}>
            {f.rotulo}
          </option>
        ))}
      </select>
    </label>
  )
}
