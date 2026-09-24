import client from './client'

export const getSession = () => client.get('/auth/me').then((r) => r.data)
export const getAuthStatus = () => client.get('/auth/status').then((r) => r.data)
export const logout = () => client.post('/auth/logout')
export const googleLoginUrl = `${client.defaults.baseURL}/auth/google/login`
export const googleCalendarUrl = `${client.defaults.baseURL}/auth/google/calendar`

export const loginErrors = {
  expired_attempt: 'A tentativa de login expirou. Abra o sistema em localhost e clique novamente em Entrar com Google.',
  client_configuration: 'O Google recusou as credenciais do aplicativo. Confira o Client ID e o Client Secret.',
  invalid_code: 'O código de autorização expirou ou foi recusado. Inicie uma nova tentativa de login.',
  consent_denied: 'O acesso não foi autorizado no Google. Inicie novamente e confirme a permissão.',
  account_denied: 'A conta retornada não foi autorizada. Use o e-mail configurado para o consultório.',
  invalid_identity: 'Não foi possível validar a identidade Google. Confira o relógio do computador e tente novamente.',
  google_connection: 'O servidor não conseguiu se comunicar com o Google. Tente novamente.',
  configuration: 'O login Google ainda não foi configurado.',
}
