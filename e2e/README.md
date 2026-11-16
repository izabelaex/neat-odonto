# Testes E2E — Neat Odonto (TP2)

Testes end-to-end com [Playwright](https://playwright.dev), cobrindo o fluxo completo
front + API + banco das histórias 1, 3, 4, 5, 6, 7 e 8. A história 2 (Google Calendar)
fica de fora: depende de uma conta Google real, e os testes não podem usar credenciais
reais (ver `AGENTS.md`).

## O que cada teste cobre

| Arquivo | Histórias | Fluxo |
|---|---|---|
| `tests/autenticacao.spec.js` | 1 | Sem sessão, qualquer tela protegida redireciona para `/login` |
| `tests/pacientes.spec.js` | 3, 4, 5 | Cadastra um paciente e encontra ele na lista por nome e por CPF |
| `tests/consultas.spec.js` | 6, 7 | Registra uma consulta com esterilização (identificação por texto) |
| `tests/tratamento.spec.js` | 8 | Cria um plano de tratamento e confere orçamento e parcelas |

## Como login é feito sem a conta Google

O login real usa OAuth do Google (histórias 1/2), e não existe — nem deveria existir —
um bypass disso no backend (ver `SETUP.md`). Em vez de simular o OAuth, o
`global-setup.js` cria a sessão **direto no banco de teste**, do mesmo jeito que
`auth/sessions.create_session` faz depois do callback do Google — sem tocar no código
da aplicação nem usar uma conta Google real.

## Isolamento

Os testes sobem backend e frontend próprios, isolados do ambiente de desenvolvimento:

- Backend em `http://localhost:8010`, com `DATABASE_URL` apontando para
  `backend/e2e_test.db` (banco separado do `backend/neat_odonto.db` de desenvolvimento,
  apagado e recriado a cada execução).
- Frontend em `http://localhost:5180`.

Isso evita dois problemas: misturar pacientes de teste com dados reais da dentista, e
precisar reconfigurar `ALLOWED_GOOGLE_EMAILS` da sua conta pessoal só para rodar os
testes.

## Como rodar

Pré-requisito: `backend/.venv` criado e com `requirements.txt` instalado, e
`frontend/node_modules` instalado (ver `SETUP.md`). Os servidores de desenvolvimento
podem ficar ligados nas portas 8000/5173 ao mesmo tempo — os testes usam portas
diferentes (8010/5180).

```bash
cd e2e
npm install
npx playwright install chromium   # só na primeira vez
npm test
```

Para ver o navegador rodando os testes: `npm run test:headed`.
Para ver o relatório da última execução: `npm run report`.

### Para apresentar (`npm run test:demo`)

`test:headed` roda rápido demais para acompanhar ao vivo — cada ação é instantânea.
`npm run test:demo` roda com o navegador visível e uma pausa de 600ms entre cada ação
(clique, preenchimento, navegação), dando tempo de narrar o que está acontecendo.
Para ajustar a pausa: `PW_SLOWMO=1000 npm run test:demo` (bash) ou
`$env:PW_SLOWMO=1000; npm run test:demo` (PowerShell).

## Por que só 4 testes não cobrem tudo

Cada teste cobre o caminho principal de uma área (um "golden path"), não todas as
variações de validação — isso já é responsabilidade dos testes de unidade/integração
de cada área. O objetivo aqui é confirmar que front, API e banco conversam direito
de ponta a ponta nos fluxos mais importantes do sistema.
