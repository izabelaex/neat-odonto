import axios from 'axios'

/**
 * Cliente HTTP unico do projeto. Todas as chamadas a API passam por aqui —
 * ninguem deve chamar axios direto numa tela.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('neat_odonto_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
