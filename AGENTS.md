# AGENTS.md — Neat Odonto

> Contexto para agentes de IA (Claude Code, Codex, Cursor). Mantenha este arquivo na raiz do
> repositório. Se seu agente lê um arquivo com outro nome (`CLAUDE.md`, `.cursorrules`),
> copie este conteúdo para lá.
>
> **Leia por inteiro antes de escrever qualquer linha de código.**

---

## 1. O que estamos construindo

**Neat Odonto** é um sistema web de gestão para consultórios odontológicos pequenos.

Não é um projeto fictício: está sendo construído para uma **dentista real**, que será a usuária do
sistema. Dados clínicos de pacientes reais vão passar por aqui, e a usuária não é técnica —
simplicidade de uso vale mais do que sofisticação.

É a entrega do **TP1 de Engenharia de Software 1 (DCC/UFMG, Prof. Marco Tulio Valente)**, que
simula um sprint com método ágil (Scrum-like) em times de 4 alunos.

---

## 2. Time e papéis

| Pessoa | Papel Scrum | Papel técnico |
|---|---|---|
| **Izabela Esber Xavier** | Product Owner + Dev | Fullstack |
| **Vitor Faleiro Campos Alves** | Scrum Master + Dev | Fullstack |
| **Paulo Henrique Carmona Ramos** | Developer | Fullstack |
| **Lara Amélia Maia de Freitas** | Developer | Fullstack |

Os quatro trabalham fullstack. PO e Scrum Master são papéis acumulados, não substituem carga de
desenvolvimento. O Scrum foi adaptado de forma pragmática: time pequeno, papéis sobrepostos, sem
cerimônias pesadas.

A PO é dona do escopo e da priorização, e é quem fala com a cliente. **Mudança de escopo passa por
ela** — agente nenhum decide o que entra.

### Divisão por área

| Pessoa | Área | Histórias |
|---|---|---|
| Izabela | Cadastro, ficha e busca de paciente | 3, 4, 5 |
| Vitor | Login, agenda e infraestrutura | 1, 2 |
| Paulo | Consultas e esterilização | 6, 7 |
| Lara | Plano de tratamento, orçamento e pagamentos | 8 |

Quem toca uma área é responsável pelo **backend e pelo frontend** dela. A divisão existe para
evitar conflito de merge, não para isolar conhecimento: todos serão cobrados sobre o sistema
inteiro na apresentação.

---

## 3. Domínio

```
Dentista (um só, nesta versão)
├── Agenda (link do Google Agenda, exibido em iframe)
└── Paciente
    ├── nome, telefone, CPF, endereço
    ├── anamnese (queixa principal, texto livre)
    ├── documentos (fotos e radiografias)
    ├── Consultas (ordenadas da mais recente para a mais antiga)
    │   ├── data
    │   ├── procedimentos realizados (texto livre)
    │   └── registro de esterilização
    │       ├── identificação do pacote: foto OU texto (pacote/lote)
    │       ├── ciclo e data do ciclo
    │       └── responsável pela esterilização
    └── Plano de tratamento
        ├── procedimentos (texto livre)
        └── orçamento
            └── parcelas combinadas
                └── pagamentos
```

### O que os agentes erram com frequência aqui

- **Esterilização é o diferencial do produto.** A rastreabilidade existe por exigência sanitária.
  Não simplifique, não colapse os campos em um texto solto, não trate como opcional no modelo.
- **A identificação do pacote aceita duas formas**: upload de foto **ou** texto livre. As duas
  precisam funcionar. Há um `CheckConstraint` no banco exigindo pelo menos uma delas.
- **Procedimentos são texto livre**, não catálogo fechado com códigos. A dentista não vai preencher
  formulário estruturado durante o atendimento.
- **Parcela combinada ≠ pagamento efetuado.** São três níveis: plano → parcelas (o que foi
  acordado) → pagamentos (o que entrou). Uma parcela aceita vários pagamentos, então pagamento
  parcial funciona sem mudar o schema.
- **Dinheiro é inteiro em centavos.** Nunca float, em lugar nenhum.
- **CPF é dado sensível.** Não logue, não exponha em URL. É guardado só com dígitos, sem pontuação.
- **Consultas são sempre exibidas da mais recente para a mais antiga.**

---

## 4. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Axios + React Router |
| Backend | FastAPI (Python 3.11) + SQLAlchemy 2 + Alembic |
| Banco (produção) | PostgreSQL |
| Banco (desenvolvimento) | SQLite |
| Arquivos | Sistema de arquivos local, caminho referenciado no banco |
| Agentes de IA | Claude Code, Codex, Cursor |

A disciplina exige **backend com API + banco** e **frontend web**. Arquiteturas alternativas não
são aceitas.

---

## 5. Decisões já fechadas

Não reabra estas decisões nem gere código que as contrarie.

**Um único dentista.** Nenhuma tabela tem coluna de dono; os dados não são particionados por
usuário. Multiusuário não está no escopo do TP1.

**Login local, com e-mail e senha.** O OAuth do Google foi descartado. A complexidade de tela de
consentimento, verificação de app e escopos não se paga: o login vale zero ponto, e as histórias
valem 7.

**A agenda do Google entra por link, não pela API.** A URL de incorporação fica em
`GOOGLE_CALENDAR_EMBED_URL` no `.env` e é exibida num iframe. Consequência importante: o sistema
**exibe** a agenda, não cria eventos nela. A dentista continua marcando pelo Google Agenda.

**Uploads ficam em disco.** O banco guarda só o caminho. Nada de S3 ou serviço externo.

---

## 6. Onde fica cada coisa

```
backend/
  app/
    config.py        variáveis de ambiente
    database.py      engine, sessão e Base do SQLAlchemy
    main.py          entrada da API — registre seu router aqui
    models/          tabelas (já prontas; não mexa sem avisar o time)
    schemas/         Pydantic: entrada e saída da API — crie o seu
    routers/         endpoints por área — crie o seu
  alembic/           migrações
frontend/
  src/
    api/client.js    cliente HTTP único — toda chamada passa por aqui
    App.jsx          rotas — adicione a sua, uma linha
    components/      componentes compartilhados
    pages/           telas
  tailwind.config.js tokens de cor e tipografia
```

`main.py` e `App.jsx` são tocados por todo mundo. Faça a menor alteração possível neles.

---

## 7. Regras da disciplina (valem nota)

### Commits

**Máximo de 100 linhas por commit.** Exceções precisam ser justificadas no corpo da mensagem.
Arquivos gerados (`package-lock.json`, migrações do Alembic) vão sozinhos no commit, com a
justificativa.

A regra muda o jeito de pedir código ao agente: **peça uma etapa por vez**, não a história inteira.
Uma história vira uma sequência — model, migration, schemas, endpoint de criar, endpoint de listar,
cliente da API, tela, formulário. Se o agente já despejou tudo de uma vez, quebre na hora de
commitar com `git add -p` e confira com `git diff --cached --stat` antes de fechar.

**Nunca rode `git add .`.** Sempre nomeie os arquivos.

**Conventional Commits**, em inglês, no imperativo, minúsculo, sem ponto final:

```
feat: add sterilization cycle tracking to consultation form
fix: prevent duplicate CPF on patient creation
docs: add UML class diagram to README
```

Prefixos: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `perf:`, `build:`, `chore:`,
`revert:`.

**Mínimo de 15% dos commits por membro.** Ninguém dá push no trabalho de outro; se programaram em
par, use `Co-authored-by:`. Confira com `git shortlog -sn`.

**O agente não commita.** Gere o código com ele, mas dê o commit você — senão mensagem e tamanho
fogem do controle.

### Uso de IA

- Usar **modelo de agentes**, não de auto-complete.
- **Todo código gerado tem que ser revisado, entendido e aprovado por pelo menos um membro.**
  Código que ninguém consegue explicar não entra no repositório.
- Todos devem dominar todos os aspectos do sistema. Haverá apresentação com o time inteiro.

### Escopo

- **8 histórias, ~2 por membro.** O README é a fonte de verdade. Não invente histórias novas nem
  amplie o escopo. Antes de acrescentar qualquer coisa fora delas, pergunte.
- O sistema é pequeno de propósito. Não precisa ter todas as features.

### Testes

**Testes serão desconsiderados no TP1** — são o foco do TP2. Agentes geram testes por padrão. Não
gaste orçamento de commit com eles agora: se vierem junto com a feature, tire do commit.

### Documentação

UML no próprio README, **pelo menos dois tipos de diagrama**, sugestão de usar mermaid. Podem ser
gerados por IA, mas têm que ser revisados.

---

## 8. Convenções

- **Nomes refletem o domínio, não a implementação.** Foi por isso que `dental-crud` virou *Neat
  Odonto*. Vale para tabelas, rotas, componentes e variáveis: `RegistroEsterilizacao`, não
  `SterData`; `/pacientes/{id}/consultas`, não `/api/v1/data`.
- **Interface em português, código em inglês.** A usuária final é a dentista.
- **Migrações com Alembic sempre.** Nunca altere o schema direto no banco. Depois de gerar,
  **abra e leia** o arquivo em `alembic/versions/` — o autogenerate erra em renomeações e
  constraints. Avise o time, porque todos vão precisar rodar `alembic upgrade head`.
- **Não reformate arquivos além do que foi pedido.** Se a tarefa é ajustar uma função, o diff deve
  conter só aquela função — senão o limite de 100 linhas estoura por ruído.
- **Não commite dados de paciente**, nem de teste. `backend/uploads/` está no `.gitignore`.

---

## 9. Estado atual

Pronto:

- Histórias de usuário definidas (README)
- Decisões de autenticação, agenda e escopo fechadas (seção 5)
- Estrutura do repositório: banco configurado, models do domínio, migração inicial, API subindo,
  frontend com rotas e cliente HTTP

Falta:

- Diagramas UML no README
- Componentes base de UI (layout, tabela, formulário, botão, modal) — antes das telas, para as
  quatro áreas não inventarem estilos diferentes
- Implementação das 8 histórias

---

## 10. Checklist antes de gerar qualquer coisa

- [ ] Cabe em menos de 100 linhas por commit?
- [ ] A mensagem segue Conventional Commits?
- [ ] Está dentro das 8 histórias do README?
- [ ] São testes? O TP1 não os considera.
- [ ] O responsável consegue explicar esse código numa apresentação?
- [ ] Os nomes são de domínio, não técnicos genéricos?
- [ ] Estou respeitando as decisões da seção 5? (Sem OAuth. Sem multiusuário. Agenda só exibe.)

Se alguma resposta for problemática, **pare e pergunte** antes de gerar.

---

## 11. Entrega

- **Apresentação em sala**: demo de 10 min + 5 min de slides sobre uso de IA. Todos presentes.
- **Relato sobre uso de IA** (slides): pontos positivos e negativos, dicas, boas práticas, padrões
  e anti-padrões, como foi trabalhar em equipe com agentes, **qual % do código foi gerado
  automaticamente**, parecer final.
- **Retrospectiva assíncrona** via Google Forms (link no Moodle), até 23:59 da última data de
  apresentação.

| Item | Pontos |
|---|---|
| Implementação das histórias e qualidade da UI | 7 |
| Relatório sobre uso de IA | 6 |
| Documentação | 1 |
| Retrospectiva | 1 |

O relatório de IA vale quase tanto quanto a implementação. **Anote ao longo do sprint** o que
funcionou e o que não funcionou: prompts que deram certo, momentos em que o agente atrapalhou,
estimativa de quanto do código veio de IA. Reconstruir de memória na véspera custa pontos.