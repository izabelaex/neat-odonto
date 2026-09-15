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

A integração é por link, não pela API. No Google Agenda:
Configurações → a agenda desejada → Integrar agenda → copie o código de
incorporação e coloque a URL em `GOOGLE_CALENDAR_EMBED_URL` no `.env`.
A tela de agenda exibe esse link num iframe.
