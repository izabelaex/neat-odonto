import axios from 'axios'

/**
 * Cliente HTTP unico do projeto. Todas as chamadas a API passam por aqui —
 * ninguem deve chamar axios direto numa tela.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
})

client.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) window.dispatchEvent(new Event('session-expired'))
  return Promise.reject(error)
})

export default client
