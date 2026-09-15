/** Tokens visuais do Neat Odonto.
 *  Definidos uma vez aqui para que as quatro areas nao inventem paletas diferentes.
 *  Quem for construir os componentes base parte destes valores.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        superficie: '#F7F6F3',   // fundo das telas
        cartao: '#FFFFFF',
        tinta: '#1C2B2D',        // texto principal
        tintaSuave: '#5A6B6D',   // texto secundario
        borda: '#DFE2DE',
        principal: '#0F5257',    // acao primaria
        principalClara: '#127C82',
        alerta: '#B3541E',       // pendencia, parcela em aberto
        ok: '#2F7A4D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
