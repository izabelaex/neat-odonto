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
