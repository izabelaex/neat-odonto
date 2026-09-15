# AGENTS.md — Neat Odonto

> Documento de contexto para agentes de IA (Claude Code, GitHub Copilot em modo agente, etc.).
> Todo membro do time deve manter este arquivo na raiz do repositório. Se seu agente lê um arquivo
> com outro nome (`CLAUDE.md`, `.github/copilot-instructions.md`), copie este conteúdo para lá.
>
> **Leia este arquivo por inteiro antes de escrever qualquer linha de código.**

---

## 1. O que estamos construindo

**Neat Odonto** é um sistema web de gestão para consultórios odontológicos pequenos.

Não é um projeto fictício: está sendo construído para uma **dentista real**, que será a usuária do
sistema. Isso muda o padrão de qualidade esperado — dados clínicos de pacientes reais vão passar por
aqui. Simplicidade de uso importa mais do que sofisticação técnica: a usuária não é técnica.

O projeto é a entrega do **TP1 de Engenharia de Software 1 (DCC/UFMG, Prof. Marco Tulio Valente)**,
que simula um sprint usando um método ágil (Scrum-like) com times de 4 alunos.

---

## 2. Time e papéis

| Pessoa | Papel | Escopo |
|---|---|---|
| **Izabela** | Product Owner + Desenvolvedora | Dona do escopo e da priorização; interlocução com a cliente; decide o que entra e o que fica de fora |
| **Vitor Faleiro Campos Alves** | Scrum Master + Desenvolvedor | Conduz o processo, desbloqueia impedimentos, garante o cumprimento das regras do TP (commits, distribuição de trabalho) |
| **Paulo Henrique Carmona Ramos** | Desenvolvedor | Fullstack |
| **Lara Amélia Maia de Freitas** | Desenvolvedora | Fullstack |

**Todos os quatro trabalham fullstack.** PO e Scrum Master são papéis acumulados, não substituem a
carga de desenvolvimento. O Scrum foi adaptado de forma pragmática para um time pequeno onde os
papéis se sobrepõem — não há cerimônias pesadas.

### Divisão sugerida por área (a confirmar na primeira reunião)

Proposta para evitar conflito de merge, não uma regra rígida:

- **Izabela** — cadastro e ficha do paciente (dados pessoais, anamnese, documentos clínicos)
- **Vitor** — autenticação, agenda e infraestrutura do repositório (CI, migrações, setup)
- **Paulo** — consultas e rastreabilidade de esterilização
- **Lara** — plano de tratamento, orçamento e pagamentos

Quem toca uma área é responsável pelo backend **e** pelo frontend dela.

---

## 3. Domínio do sistema

A modelagem parte da conversa com a cliente. Hierarquia:

```
Dentista
├── Agenda (integrada ao Google Agenda)
└── Paciente
    ├── Informações pessoais
    │   ├── nome
    │   ├── telefone
    │   ├── CPF
    │   ├── endereço
    │   ├── anamnese (queixa principal)
    │   └── documentos (fotos e radiografias)
    ├── Consultas (ordenadas por data)
    │   ├── data
    │   ├── procedimentos realizados
    │   └── informações de esterilização
    │       ├── foto do pacote OU caixa de texto (pacote/lote)
    │       ├── ciclo / data
    │       └── nome de quem esterilizou
    └── Plano de tratamento
        ├── procedimentos (caixa de texto livre)
        └── orçamento
            └── parcelas combinadas
                └── pagamentos
```

### Notas de domínio que os agentes costumam errar

- **Esterilização é o diferencial do produto.** A rastreabilidade (pacote/lote, ciclo, data, nome do
  responsável) existe por motivo sanitário e de conformidade. Não é um campo decorativo: não
  simplifique, não colapse em um único texto solto, não trate como opcional no modelo de dados.
- **Pacote de esterilização aceita duas formas de registro**: upload de foto **ou** texto livre. As
  duas precisam funcionar; a dentista vai usar a que for mais rápida no dia a dia.
- **Consultas são sempre ordenadas por data**, da mais recente para a mais antiga na visualização.
- **Procedimentos são texto livre**, não um catálogo fechado com códigos. A cliente não quer
  preencher formulário estruturado durante o atendimento.
- **Orçamento → parcelas → pagamentos** é uma cadeia de três níveis. Uma parcela combinada não é o
  mesmo que um pagamento efetuado; o sistema precisa mostrar o que foi acordado e o que já entrou.
- **CPF** é identificador de paciente, mas trate como dado sensível: não logue, não exponha em URL.

---

## 4. Stack acordada

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Axios |
| Backend | FastAPI (Python) + SQLAlchemy + Alembic |
| Banco (produção) | PostgreSQL |
| Banco (desenvolvimento) | SQLite |
| Auth / Agenda | Google OAuth 2.0 + Google Calendar API |
| Agentes de IA | Claude Code e GitHub Copilot (modo agente) |

A arquitetura exigida pela disciplina é **backend com API + banco de dados** e **frontend web**.
Arquiteturas alternativas não são aceitas.

### Decisão em aberto

A integração com **Google OAuth (login + Google Agenda)** ainda **não está fechada**. O time quer
avaliar a complexidade antes de se comprometer, justamente porque o sistema vai para uso real.

**Agentes: não assumam que o OAuth está decidido.** Não gerem código que dependa dele sem que a
decisão tenha sido tomada. Se o assunto aparecer, isole a autenticação atrás de uma interface para
que a troca por um login simples (e-mail + senha) não exija reescrita.

---

## 5. Regras da disciplina (não negociáveis)

Estas regras valem nota. Um agente que as ignora custa pontos ao time inteiro.

### Commits

- **Máximo de 100 LOC por commit.** Exceções precisam ser justificadas na mensagem do commit.
  Um agente que gera 600 linhas de uma vez precisa ter o trabalho **quebrado em commits menores**
  antes do push.
- **Conventional Commits obrigatório.** Prefixos: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`,
  `test:`, `perf:`, `build:`, `chore:`, `revert:`.
  ```
  git commit -m "feat: add sterilization cycle tracking to consultation form"
  git commit -m "fix: prevent duplicate CPF on patient creation"
  git commit -m "docs: add UML class diagram to README"
  ```
- **Todos os membros precisam ter commits: no mínimo 15% do total por pessoa.** Não deixe uma
  pessoa fazer o push do trabalho de outra. Se você programou em par, use `Co-authored-by:`.

### Uso de IA

- Usar **modelo de agentes**, não de auto-complete.
- **Todo código gerado tem que ser revisado, entendido e aprovado por pelo menos um membro do
  grupo.** Código que ninguém consegue explicar não entra no repositório.
- **Todos os membros devem dominar todos os aspectos do sistema** — código, arquitetura, banco de
  dados, interface. Haverá apresentação em sala com o time inteiro presente.

### Escopo

- **~2 histórias de usuário por membro → ~8 histórias no total.** O README é a fonte de verdade
  das histórias; não invente histórias novas nem amplie o escopo por conta própria.
- O sistema é pequeno de propósito. **Não precisa ter todas as features.** Antes de adicionar
  qualquer coisa que não esteja nas histórias, pergunte.

### Testes

- **Testes automatizados serão desconsiderados no TP1** (são o foco do TP2). Agentes de código tendem
  a gerar testes automaticamente — **não gaste orçamento de commit com eles agora**. Se o agente
  gerar testes junto com a feature, remova-os do commit ou deixe em branch separada.

### Documentação

- **UML no próprio README**, com **pelo menos dois tipos de diagrama**.
- Sugestão do professor: usar **mermaid** em markdown.
- Podem ser gerados por IA, **mas devem ser revisados**.

---

## 6. Convenções do projeto

- **Nomes refletem o problema de domínio, não a implementação técnica.** Foi por isso que o nome de
  repositório `dental-crud` foi rejeitado em favor de *Neat Odonto*. O mesmo vale para tabelas,
  rotas, componentes e variáveis: `SterilizationRecord`, não `SterData`; `/pacientes/{id}/consultas`,
  não `/api/v1/data`.
- **Interface em português.** A usuária final é a dentista. Código e nomes técnicos em inglês,
  textos visíveis ao usuário em português.
- **Migrações com Alembic sempre.** Nada de alterar o schema direto no banco.
- **Não reformate arquivos além do que foi pedido.** Se a tarefa é ajustar uma função, o diff deve
  conter só aquela função — caso contrário o limite de 100 LOC estoura por ruído.

---

## 7. Estado atual

Já entregue:

- Histórias de usuário definidas
- Nome do repositório e do produto
- README (iterado em várias versões)

Em aberto:

- Decisão sobre Google OAuth / integração com a agenda
- Diagramas UML no README
- Implementação

---
