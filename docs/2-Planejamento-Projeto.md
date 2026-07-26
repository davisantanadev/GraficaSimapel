# 2. Planejamento do Projeto

Esta seção apresenta como o grupo organizará o trabalho ao longo do semestre.  
O projeto adota uma metodologia ágil, simulando o ambiente de uma Software House.

---

### 🚨 Regra de Ouro: 

> ❗Não existe divisão entre “quem faz documento”, “quem faz Front-end” e “quem faz Back-end”.

<br>Todos os integrantes são **Desenvolvedores Full-Stack** e devem implementar **Fatias Verticais (Vertical Slices)**.

✔️ Cada membro deve entregar a funcionalidade completa:  
**Banco de Dados → API → Tela**

---

# 2.1 Sprints do Projeto

O projeto será realizado em **4 Sprints**, com entregas contínuas de código e documentação, além de um marco focado em usabilidade.

---

## 📅 Visão Geral

### 🟢 Sprint 1 – Setup, Hello World e Visão do Produto
- README com descrição do projeto
- ODS escolhida
- Backlog macro
- Repositório criado
- Banco de dados instanciado (vazio)
- Tela "Hello World" conectada à API

---

### 🟡 Sprint 2 – MVP (Primeira Fatia Vertical)
- Requisitos Funcionais documentados
- Script do Banco de Dados
- 1ª funcionalidade completa funcionando
- Dados sendo salvos no banco

⚠️ Se não salvar no banco, não pontua.

---

### 🔵 Sprint 3 – Core e Regras de Negócio
- Implementação das regras de negócio
- Validações no backend
- DER atualizado via Engenharia Reversa
- Diagrama de Classes atualizado

---

### 🟣 Milestone Específico – Teste de Usabilidade (UX)
- Aplicação do Teste SUS com usuários reais
- Avaliação das telas desenvolvidas nas Sprints 2 e 3
- Preenchimento do Relatório de Usabilidade (Seção 6)

---

### 🔴 Sprint 4 – Finalização e Deploy
- Correção de bugs apontados no Teste de UX e Code Review
- Testes finais ponta a ponta
- Documentação final consolidada
- Relatório preenchido no APC
- Sistema pronto para Arguição

---

# 👥 Papéis de Gestão

Todos programam.  
Os papéis abaixo são apenas para organização do time.

- 👨‍💻 **Tech Lead (Git Master)** Responsável pelo repositório e merges.

- 🗄️ **Arquiteto de Dados (DBA Guard)** Responsável pela modelagem e padronização do banco.

- 🧪 **Gerente de Qualidade (QA & Code Reviewer)** Responsável por revisar código e validar testes de usabilidade.

- 📋 **Facilitador Ágil (PO / Scrum Master)** Responsável por prazos, Kanban e priorização do backlog.

---

##  Definição dos Papéis – Sprint 1

- 👨‍💻 Tech Lead: Luiz Sergio Aires Machado Junior
- 🗄️ Arquiteto de Dados: Kaike de Padua Yoshioka
- 🧪 Gerente de Qualidade: Pedro Duarte Cezar 
- 📋 Facilitador Ágil: Davi Santana Pinheiro Andrade

> Caso os papéis mudem nas próximas Sprints, atualizar neste documento.

---

# 2.2 Execução e Controle

## 🗂️ Kanban (OBRIGATÓRIO)

O projeto pode utilizar a aba **Projects** do GitHub, porém é **OBRIGATÓRIO preencher os quadros Kanban de cada Sprint** (apresentados abaixo).

### Estrutura obrigatória do Board:

- A Fazer
- Desenvolver
- Fila para Teste
- Teste
- Feito

### Regras

- Cada cartão deve representar uma Fatia Vertical.
- Todo cartão deve conter:
  - Responsável
  - Descrição
  - Prazo
- A avaliação individual considerará:
  - Histórico de commits
  - Movimentação no Kanban

⚠️ Se não está no Git, não foi feito.

---

# 📋 Acompanhamento das Sprints

## Legenda de Status

- [x] ✔️ Concluído
- [ ] 📝 Em andamento
- [ ] ⌛ Atrasado
- [ ] ❌ Não iniciado

---

# 🟢 Sprint 1 – Setup

| Responsável | Papel | Tarefa | Início | Prazo | Status |
|-------------|--------|--------|--------|--------|--------|
|Davi Santana |Facilitador Ágil| Preencher Visão do Produto, ODS e Backlog no README | 10/03 | 13/03 | ✔️ |
|Kaike Yoshioka|Arquiteto de Dados| Criar instância do Banco de Dados | 10/03 | 13/03 | ✔️ |
| Todos |Equipe | Criar repositório e estruturar pastas | 10/03 | 13/03 | ✔️ |
|Luiz Sergio  |Tech Lead| Criar tela de Login/Cadastro | 11/03 | 12/03 | ✔️ |
|Pedro Duarte |Gerente de Qualidade| Criar tela Hello World conectada à API | 11/03 | 13/03 | ✔️ |

---

# 🟡 Sprint 2 – MVP

| Responsável | Papel | Tarefa | Início | Prazo | Status |
|-------------|--------|--------|--------|--------|--------|
|Kaike Yoshioka|Arquiteto de Dados| Gerar Script do Banco de Dados + Diagrama-macro(frontend/backend) | 10/03 | 06/04 | ✔️ |
|Davi Santana|Facilitador Ágil| Desenvolver Fatia 1 (BD + API + Tela) | 29/03 | 06/04 | ✔️ |
|Davi Santana|Facilitador Ágil| Documentar Requisitos do MVP | 01/04 | 06/04 | ✔️ |
|Luiz Sergio  |Tech Lead| Criar tela de dashboard e aba Clientes  | 28/03 | 06/04 | ✔️ |
| Luiz Sergio  |Tech Lead| Revisão técnica e Merge | 28/03 | 06/04 | ✔️ |
| Pedro Duarte |Gerente de Qualidade| Criação de Wireframes | 30/03 | 06/04 | ✔️ |

---

# 🔵 Sprint 3 – Core

| Responsável | Papel | Tarefa | Início | Prazo | Status |
|-------------|--------|--------|--------|--------|--------|
| Pedro Duarte | Gerente de Qualidade | Refatoração visual e melhorias de UX da dashboard de clientes | 07/05 | 08/05 | ✔️ |
| Luiz Sergio | Tech Lead | Refatoração UI do Dashboard e Implementação de Temas | 06/04 | 15/04 | ✔️ |
|Davi Santana|Facilitador Ágil| Atualização da tela de Login e Documentação do README | 06/05 (estive testando em paralelo fora do repositório) | 08/05 | ✔️ |
|Kaike Yoshioka|Arquiteto de Dados | Tela de cadastro de pedidos | 16/04 | 08/05 |✔️  |

---

# 🟣 Milestone – Teste de Usabilidade (UX)

| Responsável | Papel | Tarefa | Início | Prazo | Status |
|-------------|--------|--------|--------|--------|--------|
|Todos|Orientador| Aplicar roteiro de teste com usuários reais | 16/05 | 22/05 | ✔️ |
|Todos|Devs do Grupo| Consolidar dados e preencher Seção 6 do template | 16/05 | 22/05 | ✔️ |

---

# 🔴 Sprint 4 – Finalização

| Responsável | Papel | Tarefa | Início | Prazo | Status |
|-------------|--------|--------|--------|--------|--------|
|Pedro Duarte|Gerente de Qualidade| Correção de bugs de usabilidade e Code Review |25/06 | 26/06 | ✔️  |
|Luiz Sergio|Tech Lead| Finalizar relatórios e dashboards | 25/06 | 26/06 | ✔️  |
|Davi Santana|Facilitador Ágil| Preencher Relatório APC | 25/06 | 26/06 | ✔️ |
|Kaike Yoshioka|Arquiteto de Dados| Testes finais e consolidar README | 25/06 | 26/06 | ✔️  |

---

