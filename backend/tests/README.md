# Testes de unidade e integração — TP2

Suíte pytest complementar aos quatro E2E de `e2e/`. Não requer servidores ativos,
conta Google ou alterações no `.env` de desenvolvimento.

## Executar

Com Python 3.11 e o ambiente virtual do backend, a partir da raiz:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-test.txt
.\.venv\Scripts\python.exe -m pytest -q
```

No Linux/macOS, use `.venv/bin/python` no lugar de `.\.venv\Scripts\python.exe`.
Se o pip 24 no Windows recusar o certificado local, acrescente
`--use-feature=truststore` à instalação; não desative a verificação HTTPS.

O comando já mede todo `backend/app` e falha se a cobertura de linhas ficar abaixo
de 80%. A configuração não omite módulos da aplicação. Relatórios são gerados em
`backend/htmlcov/index.html` e `backend/coverage.xml`, ignorados pelo Git.

## O que cada grupo verifica

| Arquivo | Comportamentos |
|---|---|
| `test_domain_rules.py` | CPF/nome, orçamento, divisão exata em centavos, allowlist, datas e duração padrão |
| `test_patients_api.py` | Persistência, busca, atualização, CPF duplicado e exclusão |
| `test_documents_api.py` | Upload/download, isolamento por paciente, validação e remoção do arquivo |
| `test_treatment_api.py` | Pagamento parcial, excesso de pagamento, estorno, orçamento e exclusão em cascata |
| `test_consultations_api.py` | Ordenação, filtros, campos obrigatórios, edição e evento duplicado |
| `test_sterilization_files.py` | Identificação por foto, substituição e remoção preservando identificação |
| `test_sessions_api.py` | Rotas privadas, sessão expirada, logout, allowlist e Origin |
| `test_google_identity.py` | E-mail verificado, conta autorizada e vínculo estável ao Google subject |
| `test_oauth_api.py` | Callback, cookie, consentimento e cifra do refresh token |
| `test_calendar_api.py` | Filtro de eventos, paciente, duração, paginação e exclusão restrita |
| `test_calendar_service.py` | Renovação/revogação de tokens, repetição de criação e erros do Google |

## Unidade, integração e simulação

Os testes unitários chamam regras diretamente, sem navegador ou persistência.
Os testes de integração usam TestClient para passar pela API, validação, sessão
e SQLAlchemy com SQLite real. Não sobrescrevem `get_current_user`.
Uma sessão fictícia é preparada no banco para os testes autenticados; os testes
de callback exercitam também a criação de sessão da aplicação.

Authlib é simulada nos testes de callback: testamos o contrato da nossa aplicação,
não a validação criptográfica da biblioteca nem a página de consentimento Google.
Nas rotas de agenda, simulamos o serviço Google; nos testes desse serviço, usamos
`httpx.MockTransport` e executamos o serviço real contra respostas HTTP controladas.

## Isolamento

`conftest.py` define configuração fictícia antes de importar a aplicação.
Cada teste de integração recebe um SQLite e uploads em `tmp_path`, sem reutilizar
dados entre testes. As chaves estrangeiras são ativadas. A factory de sessões do
banco é substituída apenas durante o teste, mantendo a dependência real `get_db`.
Os dados são sintéticos e criados na execução; nenhum banco ou arquivo de paciente
é versionado. O transporte HTTP real do HTTPX é bloqueado para falhar se um teste
esquecer de simular uma chamada externa. Nenhuma requisição real ao Google é feita.

## Como interpretar a cobertura

O percentual representa linhas executáveis de `backend/app` executadas pela suíte.
Inclui linhas de definição/importação; 100% de um model não prova todas as suas
regras. Não representa cobertura de branches, de todos os cenários, do React ou
da aplicação inteira. Alembic, dependências externas e E2E ficam fora desse recorte.
O PDF do TP2 não especifica a agregação frontend/backend: confirme esse recorte
com o professor antes de declarar atendida a cobertura global do trabalho.

Os testes não validam PostgreSQL, migrações, assinatura real de ID tokens nem
conteúdo binário de imagens. Os uploads testam transporte, persistência e limpeza.
Os E2E existentes continuam responsáveis pelo navegador e fluxos visuais principais.

## Apresentação

Rode `python -m pytest -q` no ambiente virtual e abra `htmlcov/index.html`.
Explique um caso unitário (1000 centavos em 3 parcelas) e um caso de integração
(pagamento parcial persistido, com recusa de valor maior que o restante).
Mostre também sessão expirada ou filtro de eventos para explicar a área de login
e agenda. Revise os cenários e resultados com outro integrante antes do PR.
