import client from './client'

export function listEvents(start, end, pageToken) {
  return client.get('/agenda/eventos', {
    params: { start, end, ...(pageToken ? { page_token: pageToken } : {}) },
  }).then((r) => r.data)
}

export const createEvent = (draft) => client.post('/agenda/eventos', draft).then((r) => r.data)
export const deleteEvent = (id) => client.delete(`/agenda/eventos/${encodeURIComponent(id)}`)

export function errorMessage(error, fallback) {
  const detail = error.response?.data?.detail
  return typeof detail === 'string' ? detail : fallback
}
