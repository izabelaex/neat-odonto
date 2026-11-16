/**
 * Configuração compartilhada da suíte E2E: portas e banco isolados, para não
 * tocar no ambiente de desenvolvimento nem nos dados reais da dentista.
 */
export const BACKEND_PORT = 8010
export const FRONTEND_PORT = 5180

export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`

// Caminho relativo ao cwd do processo do backend (backend/), isolado do banco
// de desenvolvimento (backend/neat_odonto.db) e ignorado pelo git (*.db).
export const DATABASE_URL = 'sqlite:///./e2e_test.db'

// Não é uma conta Google real: a sessão é criada direto no banco de teste
// (ver global-setup.js), sem passar pelo fluxo OAuth.
export const TEST_EMAIL = 'e2e.teste@neatodonto.local'
