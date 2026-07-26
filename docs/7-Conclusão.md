
# 7. Conclusão


## 7.1 Síntese dos Resultados

O projeto da Gráfica Simapel resultou em uma aplicação web funcional para apoiar a gestão operacional de uma gráfica de pequeno ou médio porte. A solução entregue centraliza processos que antes poderiam depender de planilhas, anotações ou ferramentas separadas, reunindo em um único ambiente o controle de acesso, o cadastro de clientes, o gerenciamento de pedidos, o acompanhamento de estoque, o registro financeiro, o dashboard e a central de notificações.

A aplicação contribui diretamente para a ODS 8, ao apoiar a organização do trabalho, a melhoria da produtividade e a profissionalização de processos internos. Também se conecta à ODS 9, pois utiliza uma solução digital para fortalecer a infraestrutura de gestão e incentivar inovação em um negócio tradicional. Mesmo sendo uma versão acadêmica, o sistema demonstra como a digitalização de rotinas simples pode reduzir retrabalho, melhorar a visibilidade das demandas e facilitar decisões operacionais.

Entre os principais resultados positivos estão a autenticação com controle de aprovação de usuários, a organização dos dados de clientes, a vinculação de pedidos aos clientes cadastrados, o monitoramento de materiais de estoque, a visualização de indicadores no dashboard e o registro de entradas e saídas financeiras. Esses recursos formam uma base consistente para evolução futura do sistema.

---

## 7.2 Limitações e Trabalhos Futuros

Apesar da entrega funcional, o sistema ainda possui limitações naturais para uma versão desenvolvida dentro do período de um semestre. Algumas rotinas foram implementadas como apoio operacional, mas ainda podem ser aprofundadas para uso em produção, como relatórios gerenciais, geração automática de orçamentos, emissão de documentos, baixa automática de estoque a partir dos pedidos e integração com serviços externos.

Outra limitação está relacionada ao ambiente de execução. A aplicação foi planejada para rodar localmente durante o desenvolvimento, utilizando Next.js, React e Supabase. Para uma versão 2.0, recomenda-se realizar deploy em produção, configurar domínio próprio, revisar políticas de segurança do banco, ampliar os testes automatizados e validar o uso com usuários reais da gráfica por mais tempo.

Como trabalhos futuros, o grupo sugere:

* geração de orçamentos e comprovantes em PDF;
* integração entre itens do pedido e baixa automática de estoque;
* relatórios financeiros e operacionais com filtros por período;
* melhoria dos gráficos do dashboard com dados reais consolidados;
* permissões mais detalhadas por tipo de usuário;
* versão com responsividade refinada para uso em celulares;
* integração com notificações por e-mail ou WhatsApp.

---

## 7.3 Lições Aprendidas

A experiência de atuar como uma Software House utilizando fatias verticais ajudou a equipe a compreender melhor a importância de entregar funcionalidades completas, ainda que menores, em vez de trabalhar apenas em partes isoladas do sistema. Ao implementar fluxos como login, clientes e pedidos de ponta a ponta, foi possível perceber com mais clareza a relação entre interface, autenticação, banco de dados e experiência do usuário.

Os maiores desafios técnicos envolveram a integração com o Supabase, a validação de sessão, o controle de acesso, o uso de tabelas relacionadas e a manutenção de uma interface consistente entre diferentes módulos. A equipe também precisou lidar com versionamento no Git, organização dos arquivos do projeto e atualização contínua da documentação para refletir o código real.

Como aprendizado geral, o grupo percebeu que documentação, testes de usabilidade e implementação precisam evoluir juntos. O teste com usuários mostrou pontos que pareciam claros para os desenvolvedores, mas que poderiam gerar dúvidas na prática, como campos de status e documentos. Com isso, a equipe reforçou a importância de observar o uso real do sistema, ajustar a interface com base em feedback e manter o escopo controlado para entregar valor dentro do prazo.
