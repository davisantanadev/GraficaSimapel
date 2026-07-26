# Gráfica SIMAPEL

`CURSO`: ANÁLISE E DESENVOLVIMENTO DE SISTEMAS

`DISCIPLINA`: DESENVOLVIMENTO DE APLICAÇÃO INTERATIVA

`SEMESTRE`: 1/2026

O projeto consiste no desenvolvimento de um sistema web de gerenciamento para a Gráfica Simapel, com foco na organização de clientes, pedidos, estoque, movimentações financeiras, notificações e controle de acesso. A solução busca apoiar o fluxo operacional principal da gráfica, reduzindo a dependência de anotações, planilhas e controles separados.

ODS Alinhados:
* ODS 8: Trabalho Decente e Crescimento Econômico
* ODS 9: Indústria, Inovação e Infraestrutura

## Integrantes

* Davi Santana Pinheiro Andrade
* Kaike de Padua Yoshioka
* Pedro Duarte Cezar
* Luiz Sergio Aires Machado Junior

## Orientador

* Juliana Padilha

 ## Demonstração do Sistema
[Clique aqui para assistir ao vídeo de apresentação](https://youtu.be/hRZD3I23bxE)

## Instruções de utilização

**O fluxo começa pelo Login**
<ol>
<li>Acesse a pasta <code>src/graficasimapel</code></li>
<li>Utilize o comando <code>npm install</code> para instalar as dependências</li>
<li>Configure as variáveis de ambiente do Supabase utilizadas pela aplicação</li>
<li>Execute <code>npm run dev</code></li>
<li>Acesse <code>http://localhost:3000</code></li>
<li>A primeira tela exibida será a tela de login. Somente após autenticação e aprovação de acesso o usuário poderá acessar o dashboard e os módulos internos</li>
</ol>

## Problema que o projeto resolve

Gráficas de pequeno e médio porte ainda realizam parte importante do controle operacional por meio de anotações, planilhas ou processos pouco integrados. Isso dificulta o registro correto de clientes e pedidos, o acompanhamento da produção, o controle de materiais disponíveis, a visão financeira e a comunicação de pendências internas. O projeto propõe uma solução web integrada para centralizar esses dados e facilitar a tomada de decisão no dia a dia da gráfica.

## Escopo da versão entregue

Nesta versão, o sistema contempla as principais fatias operacionais da gráfica:

* autenticação de usuários com Supabase Auth;
* solicitação, aprovação e controle de acesso de usuários;
* dashboard com indicadores de pedidos, receita, produção e alertas de estoque;
* cadastro, listagem, edição, busca e remoção de clientes;
* cadastro, listagem, edição, filtro e remoção de pedidos vinculados a clientes;
* cadastro, listagem, edição, busca e remoção de materiais de estoque;
* cadastro, listagem, edição e remoção de transações financeiras;
* central de notificações com marcação de leitura e exclusão;
* alternância entre tema claro e tema escuro.

## Fora do escopo desta versão

Para manter a viabilidade técnica do projeto dentro do semestre, os itens abaixo permanecem como possibilidades de evolução:

* emissão automática de notas fiscais;
* geração de orçamentos em PDF;
* integração com pagamento online;
* baixa automática de estoque a partir dos itens do pedido;
* relatórios gerenciais avançados;
* deploy em produção com domínio próprio.

## Requisitos Funcionais

| ID | Descrição do Requisito | Prioridade |
|----|-------------------------|------------|
| RF-01 | O sistema deve permitir login com e-mail e senha. | Alta |
| RF-02 | O sistema deve permitir cadastro ou solicitação de acesso de novos usuários. | Alta |
| RF-03 | O sistema deve permitir recuperação e atualização de senha. | Alta |
| RF-04 | O sistema deve validar a sessão antes de permitir acesso às rotas internas. | Alta |
| RF-05 | O sistema deve permitir logout do usuário autenticado. | Alta |
| RF-06 | O sistema deve permitir aprovação, recusa e alteração de perfil de acesso por administradores. | Alta |
| RF-07 | O sistema deve exibir um dashboard com indicadores operacionais da gráfica. | Média |
| RF-08 | O sistema deve permitir cadastrar, listar, buscar, editar e remover clientes. | Alta |
| RF-09 | O sistema deve permitir cadastrar, listar, filtrar, editar e remover pedidos vinculados a clientes. | Alta |
| RF-10 | O sistema deve permitir cadastrar, listar, buscar, editar e remover materiais de estoque. | Alta |
| RF-11 | O sistema deve permitir cadastrar, listar, editar e remover transações financeiras. | Alta |
| RF-12 | O sistema deve exibir notificações e permitir marcá-las como lidas ou removê-las. | Média |
| RF-13 | O sistema deve permitir alternar entre modo claro e modo escuro. | Baixa |
| RF-14 | O sistema deve exibir mensagens de sucesso, erro e confirmação nas operações principais. | Média |

## Requisitos Não Funcionais

| ID | Descrição do Requisito | Prioridade |
|----|-------------------------|------------|
| RNF-01 | O sistema deve utilizar autenticação segura por meio do Supabase Auth. | Alta |
| RNF-02 | O sistema deve proteger as rotas internas, permitindo acesso apenas a usuários autenticados e aprovados. | Alta |
| RNF-03 | O sistema deve utilizar variáveis de ambiente para conexão com o Supabase. | Alta |
| RNF-04 | O sistema deve validar campos obrigatórios antes de persistir dados. | Alta |
| RNF-05 | O sistema deve apresentar mensagens claras de erro, sucesso e confirmação. | Média |
| RNF-06 | O sistema deve manter uma interface responsiva para diferentes tamanhos de tela. | Média |
| RNF-07 | O sistema deve armazenar a preferência de tema claro/escuro no navegador do usuário. | Baixa |
| RNF-08 | O sistema deve sincronizar dados com o Supabase em tempo real quando aplicável. | Média |
| RNF-09 | O sistema deve manter identidade visual compatível com a Gráfica Simapel. | Média |
| RNF-10 | O sistema deve compilar e executar localmente com Next.js, React e npm. | Alta |

# Documentação

<ol>
<li><a href="docs/1-Contexto.md"> Documentação de Contexto</a></li>
<li><a href="docs/2-Planejamento-Projeto.md"> Planejamento do Projeto de Software</a></li>
<li><a href="docs/3-Especificação.md"> Especificação do Projeto de Software</a></li>
<li><a href="docs/4-Projeto-Solucao.md"> Projetos do Software (Arquitetura)</a></li>
<li><a href="docs/5-Interface-Sistema.md"> Interface do Sistema</a></li>
<li><a href="docs/6-Testes.md"> Teste de Usabilidade do Software</a></li>
<li><a href="docs/7-Conclusão.md"> Conclusão</a></li>
<li><a href="docs/8-Referências.md"> Referências</a></li>
</ol>

# Código

<li><a href="src/README.md"> Código Fonte</a></li>



## Histórico de versões

* 0.2.0
    * CHANGE: Atualização do README, requisitos e conclusão para refletir a versão final com módulos de clientes, pedidos, estoque, financeiro, notificações e controle de acesso.
* 0.1.1
    * CHANGE: Atualização do escopo do projeto e das documentações para foco no MVP.
* 0.1.0
    * Implementação inicial das telas de login, dashboard e clientes.
* 0.0.1
    * Definição inicial do problema, pesquisa de contexto e modelagem do processo de negócio.
