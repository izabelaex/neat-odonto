/** Tokens visuais do Neat Odonto.
 *  Definidos uma vez aqui para que as quatro areas nao inventem paletas diferentes.
 *  Quem for construir os componentes base parte destes valores.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        superficie: 'var(--color-superficie)',
        cartao: 'var(--color-cartao)',
        tinta: 'var(--color-tinta)',
        tintaSuave: 'var(--color-tinta-suave)',
        borda: 'var(--color-borda)',
        principal: 'var(--color-principal)',
        acao: 'var(--color-acao)',
        principalClara: 'var(--color-principal-clara)',
        alerta: 'var(--color-alerta)',
        ok: 'var(--color-ok)',
        cabecalho: 'var(--color-cabecalho)',
        cabecalhoDestaque: 'var(--color-cabecalho-destaque)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
