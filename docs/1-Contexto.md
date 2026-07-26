# 1. Introdução

Este projeto propõe o desenvolvimento de um sistema de gerenciamento para uma gráfica com foco no processo central da operação: o registro de pedidos e o acompanhamento da fila de produção. A proposta nasce da necessidade de organizar informações importantes do atendimento e da produção em um fluxo único, simples e acessível para os responsáveis pelo dia a dia da empresa.

---

## 1.1 Problema

Em muitas gráficas de pequeno e médio porte, o controle dos pedidos e do andamento da produção ainda é realizado de forma manual, por meio de anotações, mensagens ou planilhas simples. Esse cenário aumenta a chance de erros de registro, retrabalho, perda de informações e dificuldades para visualizar quais pedidos estão pendentes, em andamento ou concluídos.

A solução será utilizada no ambiente da gráfica por proprietários, atendentes, gerentes e colaboradores envolvidos no recebimento de pedidos e no acompanhamento da produção. O objetivo é oferecer um sistema objetivo, que apoie a organização do fluxo principal da empresa sem ampliar o escopo para todas as áreas de um ERP completo.

---

## 1.2 Objetivos

- **Objetivo Geral:**
Desenvolver um sistema para gráfica que permita registrar pedidos e acompanhar a fila de produção de forma simples, organizada e viável dentro do escopo acadêmico do projeto.

- **Objetivos Específicos:**
* Implementar autenticação de usuários para acesso ao sistema.
* Desenvolver o cadastro de clientes.
* Implementar o registro de pedidos da gráfica.
* Permitir a atualização do status dos pedidos ao longo da produção.
* Disponibilizar uma visualização da fila de produção para acompanhamento operacional.

---

## 1.3 Justificativa

Este projeto é relevante porque ataca uma dor concreta do cotidiano de pequenas e médias gráficas: a dificuldade de organizar os pedidos e acompanhar a produção com clareza. Ao concentrar o MVP no processo principal da empresa, a equipe aumenta a chance de entregar uma solução funcional, útil e tecnicamente viável dentro do prazo do semestre.

Os principais benefícios esperados são a melhora no registro das solicitações dos clientes, a visualização mais clara do andamento dos serviços e a redução de falhas causadas por processos manuais. Com isso, a gráfica pode ganhar mais organização, melhor comunicação interna e mais previsibilidade sobre as entregas.

O problema é sustentado pelo contexto de micro e pequenas empresas brasileiras que ainda dependem de controles manuais. Segundo reportagem da InfoMoney, baseada em pesquisa sobre pequenas e médias empresas, parte significativa desses negócios ainda controla despesas manualmente, o que reforça a existência de rotinas operacionais pouco digitalizadas e com maior risco de desorganização.

Fonte: https://www.infomoney.com.br/minhas-financas/pesquisa-mostra-que-39-das-mpmes-ainda-controlam-despesas-de-forma-manual/?utm_source=chatgpt.com

---

## 1.4 Público-Alvo

O sistema é destinado principalmente a proprietários, atendentes, gerentes e profissionais da produção de gráficas de pequeno e médio porte. Em geral, esses usuários possuem familiaridade básica com computadores, navegação em sistemas simples e uso de planilhas, mas precisam de uma ferramenta mais organizada para apoiar a rotina operacional.

O uso do sistema ocorrerá principalmente em computadores no ambiente interno da gráfica. A aplicação será utilizada para cadastrar clientes, registrar pedidos e acompanhar o status das demandas na fila de produção, permitindo maior controle sobre a operação principal do negócio.

---

## 1.5 Escopo Funcional do MVP

Para manter a viabilidade da entrega, o MVP do projeto está restrito às funcionalidades centrais do processo da gráfica:

* autenticação de usuários
* cadastro de clientes
* registro de pedidos
* consulta de pedidos cadastrados
* atualização do status dos pedidos
* visualização da fila de produção

Não fazem parte do escopo desta versão funcionalidades como controle financeiro completo, controle de estoque, geração de orçamentos avançados e relatórios gerenciais completos. Esses itens podem ser considerados como possibilidades futuras, mas não como compromisso de entrega do MVP.

---
