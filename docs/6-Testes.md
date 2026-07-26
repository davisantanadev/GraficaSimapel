# 6. Teste de Usabilidade do Software

> 🎯 **Momento da Entrega:** Este teste deve ser realizado e documentado no dia **22/05** (entre a Sprint 3 e a Sprint 4), avaliando as telas já produzidas até o momento.

Nesta seção, abordaremos a realização do teste de usabilidade do software. O teste visa avaliar a eficácia, eficiência e a satisfação do usuário ao interagir com o sistema, garantindo que a interface e as funcionalidades atendam às necessidades do público-alvo. <br> <br>

- 📝 **Nota:** A CTO (Professora) fornecerá um template de roteiro (em Word) para auxiliar na condução das entrevistas. Os resultados finais desse teste devem ser consolidados e digitados abaixo, substituindo os exemplos.

---

## 6.1 Introdução

Breve descrição da aplicação testada e do objetivo do teste.<br>
> **EXEMPLO:** *O sistema testado foi um site de compras de eletrônicos. O objetivo era avaliar se os usuários conseguiam navegar facilmente pelas categorias de produtos e finalizar uma compra sem dificuldades.*

O sistema testado foi uma plataforma interna de gestão para uma gráfica, desenvolvida para uso exclusivo da equipe operacional. O sistema contempla módulo de login seguro, cadastro de clientes com parâmetros de identificação (nome, e-mail, CPF/CNPJ) e gerenciamento de pedidos com informações como descrição, prazo de entrega e status de produção. O objetivo do teste foi avaliar se os operadores conseguiam realizar as tarefas principais - login, cadastro de clientes e registro de pedidos - de forma intuitiva, sem necessidade de treinamento prévio.

---
## 6.2 Metodologia (Participantes e Tarefas)

Explicação sobre o perfil dos participantes, os cenários criados e as tarefas solicitadas.<br>
> **EXEMPLO:** *Participaram do teste 5 usuários com perfis variados, incluindo um usuário iniciante em tecnologia. Foram propostas as seguintes tarefas: 1) Criar uma conta; 2) Buscar um produto específico; 3) Concluir uma compra.*

✏️ Participaram do teste 5 usuários recrutados via formulário de feedback, todos sem acesso anterior ao sistema. Os perfis variaram entre usuários com baixa e alta familiaridade com tecnologia.
- Gabriella Duarte (Tecnologia — alto) 
- Lilian Duarte (Tecnologia — médio) 
- Claudia M. Pinheiro (Tecnologia — médio) 
- Marcia Santana (Tecnologia — médio) 
- Natalia Paiva (Tecnologia - alto)

---
## 6.3 Resultados

Dados coletados, dificuldades identificadas e principais descobertas. <br>
> **EXEMPLO:** *Dos cinco participantes, três tiveram dificuldades para encontrar o botão 'Finalizar Compra'. O tempo médio para realizar uma compra foi de 4 minutos e 30 segundos. Dois participantes não conseguiram concluir a compra sem ajuda.*

- A tarefa de login foi concluída por todos os participantes sem dificuldades, demonstrando que o fluxo de autenticação está bem estruturado. O cadastro de clientes foi concluído pela maioria, mas Claudia Maria (usuária com menor familiaridade tecnológica) teve dúvidas sobre a obrigatoriedade e o formato do campo de documento. No registro de pedidos, dois participantes não localizaram de imediato o seletor de status, necessitando de intervenção do moderador. Natalia e Gabriella concluíram todas as tarefas com facilidade e elogiaram a organização visual do sistema.
  
| Tarefa | Taxa de conclusão | Tempo médio | Principal dificuldade |
|---|---|---|---|
| Login | 5/5 — 100% | 3min 10s | Nenhuma dificuldade relevante |
| Cadastro de cliente | 4/5 — 80% | 4min 30s | Claudia teve dúvida sobre o campo de documento (CPF vs CNPJ) |
| Registro de pedido | 3/5 — 60% | 1min 50s | Lilian e Marcia não encontraram o campo de status sem orientação |

---
## 6.4 Sugestões de Melhoria

Lista de recomendações para aprimoramento da aplicação (o que o grupo vai corrigir na Sprint 4). Utilize o sinal (+) para pontos positivos mantidos e (-) para problemas que precisam de correção. <br>
> **EXEMPLO:**
> * (-) Recomenda-se tornar o botão 'Finalizar Compra' mais visível, aumentar o contraste da cor e fixá-lo no rodapé.
> * (+) O fluxo de cadastro de usuário foi elogiado por ser rápido e ter poucos campos, devendo ser mantido assim.

- (−) Acrescentar ao sistema a opção de duplicar um pedido, caso o cliente retorne a solicitar o pedido anterior em uma situação futura.
- (−) Tornar o campo de "Status do pedido" mais visível na tela de registro, destacando-o com rótulo colorido ou posicionando-o no topo do formulário.
- (−) Incluir mensagem de confirmação visual após o cadastro de cliente e após o registro de pedido, para garantir ao usuário que a ação foi salva com sucesso.
- (+) O fluxo de login foi elogiado por ser rápido e direto, com campo de e-mail e senha bem posicionados - deve ser mantido.
- (+) A navegação entre as seções principais (clientes e pedidos) foi considerada intuitiva por 4 dos 5 participantes - manter a estrutura atual do menu.
- (+) O campo de prazo de entrega com calendário integrado foi bem recebido por todos - manter o componente de date picker atual.

---
## 6.5 Registro Audiovisual (Evidências)

Imagens (prints) ou links para vídeos curtos das interações dos usuários, ilustrando as dificuldades e os pontos positivos da interface. A comprovação da realização do teste é **obrigatória**.
> **EXEMPLO:** *![Erro no Check-out](images/teste_erro_botao.png) - Captura de tela mostrando onde os usuários esperavam encontrar o botão 'Finalizar Compra' e onde ele realmente estava.*

- Foto do usuário analisando o dashboard principal após a reaização do login 
<img width="400" height="300" alt="image" src="https://github.com/user-attachments/assets/83405bed-841c-4632-a32a-02238e08160a" />

- Foto do usuário tendo contato com a tela de pedidos da gráfica
<img width="400" height="300" alt="image" src="https://github.com/user-attachments/assets/bff4740b-91a9-4a61-a0ac-9edff0cc00e0" />

- Foto do usuário tendo contato com os filtros da tela de pedidos da gráfica
<img width="400" height="300" alt="image" src="https://github.com/user-attachments/assets/032b7f60-c449-4342-8d8c-5a402795cf34" />

- Foto do usuário tendo contato com a tela de login
<img width="400" height="300" alt="image" src="https://github.com/user-attachments/assets/c93eba0e-c2f4-4fec-9131-949589a720c3" />

- Foto do usuário tendo contato também com a tela de login
<img width="600" height="800" alt="image" src="https://github.com/user-attachments/assets/639f1cb5-6897-466f-aa86-31f553c0e66d" />



---
## 6.6 Tabela Comparativa (Opcional)
Comparação entre a expectativa do grupo desenvolvedor e a realidade do usuário em cada tarefa. Destaque das principais dificuldades enfrentadas.

*(Exemplo de Tabela:)*
| Tarefa | Expectativa do Squad | Realidade do Usuário |
| :--- | :--- | :--- |
| **Criar conta** | Processo simples, feito em até 2 minutos | Um usuário levou mais de 5 minutos devido à falta de instruções claras na senha. |

| Tarefa | Expectativa do Squad | Realidade do usuário |
|---|---|---|
| Login | Processo simples, concluído em menos de 3 minutos | Confirmado — todos os 5 participantes concluíram em ~1min sem dificuldades |
| Cadastro de cliente | Formulário intuitivo, preenchido em até 2 minutos | Parcialmente confirmado — 1 participante teve dúvida sobre o tipo de documento aceito, levando ~4min |
| Registro de pedido | Campos claros e fluxo direto, concluído em ~2 minutos |  Parcialmente confirmado  — o campo de status não foi localizado sem orientação por Marcia e Lilian; tempo médio chegou a 2min para esses casos |
| Navegação geral | Menu lateral autoexplicativo | Confirmado pela maioria — 4/5 consideraram a navegação intuitiva; 1 participante esperava um atalho direto para "novo pedido" na tela inicial |
