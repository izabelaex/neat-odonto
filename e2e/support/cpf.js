/**
 * Gera CPFs válidos para os testes. Mesmo algoritmo de dígito verificador
 * usado no formulário (frontend/src/pages/FormularioPaciente.jsx) e na API
 * (backend/app/schemas/paciente.py), para não depender de números fixos.
 */
function digitoVerificador(parcial) {
  let soma = 0
  let peso = parcial.length + 1
  for (const digito of parcial) {
    soma += Number(digito) * peso
    peso -= 1
  }
  const resto = (soma * 10) % 11
  return String(resto < 10 ? resto : 0)
}

/** 9 dígitos aleatórios (nunca todos iguais, o que invalidaria o CPF) + os 2 verificadores. */
export function cpfValidoAleatorio() {
  let base = ''
  do {
    base = String(Math.floor(100000000 + Math.random() * 900000000))
  } while (new Set(base).size === 1)
  const d1 = digitoVerificador(base)
  const d2 = digitoVerificador(base + d1)
  return base + d1 + d2
}

export function formatarCpf(digitos) {
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
