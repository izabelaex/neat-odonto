# Testes de frontend — TP2

## Executar

Use Node.js 22 ou 24 e npm. Na pasta `frontend`:

```powershell
npm ci
npm test
npm run test:coverage
```

Não é necessário iniciar a API, configurar Google ou usar dados reais.
O relatório navegável fica em `frontend/coverage/index.html` e o resumo em
`frontend/coverage/coverage-summary.json`. Ambos são ignorados pelo Git.

## Estratégia

Vitest executa os testes; jsdom fornece o DOM; Testing Library permite interagir
com campos, botões e textos como uma pessoa faria. V8 mede a cobertura.
As versões estão fixadas no `package-lock.json`, incluindo Vitest compatível com
o Vite 6 do projeto. Documentação: [Vitest](https://vitest.dev/guide/coverage.html)
e [Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

Os testes unitários verificam conversão monetária e apresentação de erros.
Os testes de integração combinam rotas React, contexto de sessão, componentes,
formulários e os módulos reais de API. `support.jsx` substitui somente o adapter
HTTP do Axios por respostas explícitas: não simula os componentes sob teste.
Requisição sem resposta cadastrada faz o teste falhar.

Cada teste limpa DOM, respostas, histórico de requisições, tema e armazenamento.
`VITE_API_URL` é fixada em teste; nenhuma requisição chega a esse endereço.
O adapter original é restaurado ao final. `fetch` também é bloqueado nos testes.
Dados e arquivos usados são sintéticos e criados durante a execução.

## Cenários

| Arquivos | Comportamentos verificados |
|---|---|
| `money` | Reais para centavos, formatos inválidos, mensagens da API |
| `auth` | Rotas privadas, falha/retry de sessão, configuração, logout e tema |
| `patient-list`, `patient-form`, `patient-errors` | Busca, cadastro, edição, CPF, duplicidade, exclusão e erros |
| `documents` | Multipart, link de download, remoção e falhas de upload |
| `date-picker` | Meses, seleção, limpeza, hoje e fechamento externo |
| `calendar-form`, `calendar-page` | Paciente, horários, retry idempotente, paginação, semana, consentimento e exclusão |
| `consultation-form`, `consultation-list` | Esterilização, foto, edição, vínculo ao agendamento, histórico e filtros |
| `treatment-flow`, `treatment-validation`, `treatment-errors` | Orçamento, parcelas, pagamentos parciais, estorno, status e confirmação de exclusão |

Os nomes na tabela correspondem aos arquivos `*.test.js` e `*.test.jsx`.

## Cobertura e limites

`npm run test:coverage` exige pelo menos 80% de linhas e statements no conjunto
de **todos** os arquivos `src/**/*.js` e `src/**/*.jsx`, mesmo não importados.
Não há exclusão de páginas, API ou bootstrap para aumentar o percentual.
CSS, SVG, dependências, configuração e os próprios testes não são código JS/JSX
da aplicação e não entram nesse recorte. Branches e funções também são exibidos,
mas o limiar configurado é de linhas e statements, não por arquivo individual.

Cobertura mede execução, não prova todas as regras nem ausência de defeitos.
Em particular, JSX e source maps influenciam a atribuição de linhas executadas;
veja as asserções dos testes e as métricas de funções/branches em conjunto.
O bootstrap `src/main.jsx` permanece no denominador, mas não é executado aqui:
os testes montam o `App` em um MemoryRouter controlado.

Não testamos layout/pixels, navegador real, cookies HTTP reais, banco ou Google
nesta suíte. Esses limites são complementados pelos testes pytest de backend
e pelos quatro Playwright em `e2e/`. A integração externa com o Google é simulada
no backend; os E2E usam uma sessão preparada no banco de teste.

As métricas de frontend e backend são apresentadas separadamente. Não some nem
faça uma média simples dos percentuais e não conte os E2E como cobertura React.
Os E2E executam os fluxos principais completos, mas não todas as variações.
