# Como rodar o Neat Odonto localmente

Precisa funcionar na máquina dos quatro. Se travar em algum passo, corrija este
arquivo no mesmo commit em que resolver o problema.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # ajuste SECRET_KEY
alembic upgrade head             # cria o banco SQLite com o schema
uvicorn app.main:app --reload    # http://localhost:8000
```

Documentação interativa da API: http://localhost:8000/docs

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                      # http://localhost:5173
```

## Trabalhando com o banco

Nunca altere o schema direto no banco. O fluxo é sempre:

1. edite o model em `backend/app/models/`
2. gere a migration:
   ```bash
   alembic revision --autogenerate -m "feat: add campo X em paciente"
   ```
3. **abra o arquivo gerado em `alembic/versions/` e leia** — o autogenerate erra
   com frequência em renomeações e em constraints
4. aplique: `alembic upgrade head`
5. avise no grupo, porque os outros vão precisar rodar `alembic upgrade head` também

Para desfazer a última migration: `alembic downgrade -1`

## Agenda do Google

A integração usa login Google e Calendar API, conforme aprovado pela PO.
Para usar sua própria conta, crie um projeto no Google Cloud, habilite a Google
Calendar API e configure a tela de consentimento OAuth. Em modo Testing, adicione
**seu e-mail** como usuário de teste. Use os escopos `openid`, `email`, `profile` e
`https://www.googleapis.com/auth/calendar.events.owned`.

Crie um cliente OAuth do tipo **Aplicativo da Web** com a URI de redirecionamento
autorizada `http://localhost:8000/auth/google/callback`. No `backend/.env`, preencha
`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` desse cliente. Adicione cada e-mail do time como
usuário de teste no Google Cloud e liste os mesmos e-mails em `ALLOWED_GOOGLE_EMAILS`, separados
por vírgula. Cada conta autorizada usa o próprio calendário Google; trocar somente o usuário de
teste no Google Cloud não libera acesso na API.
Não versione nem envie credenciais para o grupo.
Gere SECRET_KEY e GOOGLE_TOKEN_KEY, respectivamente, na pasta `backend`:

No Linux/macOS:

```bash
.venv/bin/python -c "import secrets; print(secrets.token_urlsafe(48))"
.venv/bin/python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

No PowerShell:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
.\.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Preserve chaves já configuradas. Para produção, use HTTPS e COOKIE_SECURE=true.
Reinstale `backend/requirements.txt` e rode `alembic upgrade head` após atualizar a branch.
Abra sempre `http://localhost:5173`, sem alternar com `127.0.0.1`, por causa dos cookies.
Rotas de pacientes e documentos agora exigem sessão; não existe bypass de desenvolvimento.
Se o botão de login estiver desabilitado, confira `http://localhost:8000/auth/status`:
`configured` deve ser `true`. Após entrar, autorize a agenda separadamente; então
`calendar_configured` também deve ser `true` para a conexão funcionar.
Se o Alembic reclamar de uma revisão desconhecida, preserve o banco antes de
qualquer migração: ele pode conter dados de pacientes e precisar de conversão.

No PowerShell, dentro de `backend`, use Python 3.11 explicitamente:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

O filtro de log da API remove os parâmetros do callback OAuth.
Em produção, configure também o proxy para não registrar códigos na URL de retorno.
As conexões Google usam os certificados confiáveis do sistema operacional via `truststore`.
Isso mantém a validação HTTPS ativa e evita diferenças entre o navegador e o Python.
