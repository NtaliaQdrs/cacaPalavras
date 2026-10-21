# PRD — Jogo casual de adivinhação de palavras

**Status:** rascunho inicial para validação  
**Versão:** 0.1  
**Data:** 14 de outubro de 2026

## 1. Resumo do produto

Um jogo casual para navegador em que a pessoa tenta descobrir uma palavra secreta de cinco letras em até seis palpites. Depois de cada tentativa válida, o jogo informa quais letras não aparecem na resposta, quais aparecem em outra posição e quais estão na posição correta. O produto oferece um desafio diário igual para todos e partidas ilimitadas de prática.

O foco do MVP é proporcionar partidas curtas, regras fáceis de entender, feedback consistente e justo para palavras em português brasileiro e uma experiência utilizável por teclado e tecnologias assistivas.

## 2. Problema e oportunidade

Jogos casuais de palavras podem oferecer um desafio rápido que combina vocabulário e dedução. A mecânica escolhida depende de o feedback ser compreensível e útil para o próximo palpite. No português, regras de acentuação, flexões e letras repetidas podem afetar a percepção de justiça; esses casos precisam ser tratados claramente desde o MVP.

Puzzles diários, estatísticas e compartilhamento são padrões observados em produtos do gênero, mas as fontes consultadas não demonstram que causem maior retenção. O PRD trata essas opções como decisões de produto e hipóteses a validar, não como garantias.

## 3. Público-alvo e necessidades

### Público inicial

Pessoas que falam português brasileiro e procuram um jogo casual de palavras em sessões curtas, tanto no celular quanto no computador.

### Necessidades

- Entender as regras sem um tutorial longo.
- Receber feedback claro e consistente após cada palpite.
- Poder descobrir a resposta por dedução, sem ser penalizado por uma regra de acentuação obscura.
- Jogar o desafio diário ou praticar sem limite de partidas.
- Acompanhar o resultado ao final e operar o jogo por teclado ou leitor de tela.

## 4. Objetivos e não objetivos

### Objetivos do MVP

1. Permitir concluir partidas de cinco letras em até seis tentativas.
2. Oferecer um desafio diário compartilhado e um modo de prática ilimitado.
3. Validar os palpites por uma lista adequada ao português brasileiro e usar respostas revisadas.
4. Comunicar os estados das letras por mais de uma modalidade, sem depender apenas da cor.
5. Mostrar o desfecho e estatísticas básicas da partida.

### Fora do escopo do MVP

- Contas, sincronização entre dispositivos e ranking online.
- Modos multiplayer, desafios entre amigos ou recursos sociais.
- Monetização, publicidade ou assinatura.
- Arquivo de desafios diários anteriores.
- Dicas, níveis de dificuldade e campanhas.
- Suporte a idiomas além do português brasileiro.
- Geração automática de respostas sem revisão editorial.

## 5. Princípios de produto

- **Regra fácil de explicar:** uma palavra secreta, cinco letras, seis tentativas.
- **Feedback confiável:** a mesma regra deve ser aplicada no teclado, no tabuleiro e nas estatísticas.
- **Justiça linguística:** listas de palpites e respostas devem ser apropriadas ao português brasileiro.
- **Acessibilidade desde o MVP:** cor não é o único sinal e a partida é operável sem mouse.
- **Sem pressão comercial ou social no MVP:** não há anúncios, ranking nem obrigação de compartilhar.

## 6. Escopo funcional

### 6.1. Partida

- O jogo apresenta um tabuleiro com até seis linhas de cinco letras.
- A pessoa pode inserir letras, apagar a última letra e submeter o palpite.
- Um palpite só é submetido quando tiver cinco letras e constar na lista de palavras aceitas.
- Palpites incompletos ou inválidos não consomem tentativa; o jogo informa o motivo de forma visível e acessível.
- Ao submeter um palpite válido, a linha é travada e o tabuleiro mostra o resultado de cada letra.
- A partida termina quando a palavra é descoberta ou quando as seis tentativas válidas são usadas.
- No fim, o jogo revela a resposta e apresenta o resultado da partida.

### 6.2. Regra de avaliação das letras

Cada letra do palpite recebe exatamente um estado:

- **Correta na posição:** a letra aparece na resposta na mesma posição.
- **Presente em outra posição:** a letra aparece na resposta, mas não naquela posição.
- **Ausente:** a resposta não contém ocorrências restantes daquela letra.

As ocorrências são contadas: uma letra repetida não pode ser marcada como presente mais vezes do que aparece na resposta. Primeiro são identificadas as correspondências na posição correta; as ocorrências restantes são então atribuídas às letras presentes fora de posição. Isso evita feedback excedente em palavras com letras repetidas.

### 6.3. Português e normalização

- O idioma inicial é português brasileiro.
- As respostas têm cinco letras após normalização.
- A comparação ignora acentos e cedilha: por exemplo, `á` equivale a `a` e `ç` equivale a `c`.
- A resposta deve ser exibida com sua grafia correta, incluindo acentos e cedilha quando aplicável.
- A mesma normalização deve ser usada na validação, avaliação das letras e comparação de respostas.
- O conjunto inicial de palavras aceitas deve vir de um dicionário/lista em português brasileiro e incluir flexões comuns.
- Nomes próprios, abreviações, estrangeirismos, regionalismos e flexões incomuns devem ter política editorial definida antes da publicação do dicionário.
- Mensagens de validação devem explicar que são aceitas palavras de cinco letras reconhecidas pelo jogo, sem expor a resposta.

### 6.4. Desafio diário

- Há um desafio por dia, com a mesma resposta para todos os jogadores.
- Para o MVP, a troca de desafio ocorre à meia-noite no fuso `America/Sao_Paulo`.
- A resposta diária é selecionada de uma lista curada e aprovada editorialmente.
- Cada dia é identificado por sua data local no fuso definido; o mesmo identificador sempre corresponde à mesma resposta.
- O desafio diário só pode ser concluído uma vez por navegador/perfil local. O estado da partida e o resultado são persistidos localmente para que atualizar a página não reinicie o desafio.
- Não é possível jogar desafios diários anteriores no MVP.
- O próximo desafio fica disponível na próxima virada diária; uma contagem regressiva pode informar o tempo restante.

### 6.5. Modo prática

- Permite iniciar partidas ilimitadas, separadas do desafio diário.
- Cada partida usa uma resposta sorteada de uma lista maior de palavras aprovadas.
- Uma resposta não deve ser repetida imediatamente enquanto houver outras respostas disponíveis no conjunto de prática.
- O resultado da prática não altera o estado nem as estatísticas do desafio diário.
- Sair ou atualizar a página durante uma partida de prática mantém a partida em andamento no mesmo navegador/perfil local.

### 6.6. Resultado e estatísticas

- Ao vencer, o jogo informa o número de tentativas usadas.
- Ao perder, o jogo revela a resposta.
- O resumo apresenta estatísticas locais básicas: partidas concluídas, vitórias e distribuição de vitórias por número de tentativas.
- Estatísticas do desafio diário e da prática são contabilizadas separadamente.
- Os dados ficam no navegador/perfil local; não há conta nem sincronização no MVP.
- A interface explica que limpar os dados do navegador pode apagar o progresso local.
- Sequência diária (streak) não faz parte do escopo inicial para evitar pressão de retorno antes de validar seu valor.

### 6.7. Acessibilidade e interação

- O jogo pode ser operado por teclado, incluindo inserção e remoção de letras e submissão de palpites.
- O foco do teclado é visível e a ordem de navegação é previsível.
- O jogo oferece teclado virtual utilizável por mouse, toque e tecnologia assistiva.
- Estados das letras são comunicados por cor e por um sinal adicional, como símbolo e texto acessível.
- Leitores de tela recebem um anúncio conciso do resultado de cada tentativa, sem depender de animações.
- Botões e células têm nomes acessíveis; o estado de cada letra pode ser compreendido sem referência a cor.
- Animações não são necessárias para interpretar o resultado e devem respeitar a preferência do sistema por movimento reduzido.
- O layout se adapta a telas móveis e desktop sem ocultar tabuleiro, teclado ou mensagens.

## 7. Requisitos não funcionais

- **Compatibilidade:** funcionar nos navegadores modernos de desktop e dispositivos móveis.
- **Desempenho:** iniciar e responder às ações do tabuleiro sem atrasos perceptíveis em conexões e dispositivos comuns.
- **Persistência:** uma atualização de página não deve apagar partida em andamento nem estatísticas locais.
- **Determinismo:** uma data do desafio diário deve resolver sempre para a mesma resposta, independente da ordem de acesso.
- **Privacidade:** o MVP não exige cadastro e não transmite palpites ou estatísticas pessoais para um servidor.
- **Acessibilidade:** buscar conformidade WCAG 2.2 nível AA para a interface aplicável, incluindo operação por teclado e informação que não dependa somente de cor.
- **Manutenibilidade do conteúdo:** listas de respostas devem ser versionadas, revisáveis e separáveis da lógica de avaliação.

## 8. Requisitos de conteúdo e operação

- Manter um conjunto de palpites aceitos distinto do conjunto de respostas possíveis.
- Revisar respostas para familiaridade, adequação ao público, grafia, ambiguidade e validade após normalização.
- Revisar o calendário diário para evitar respostas duplicadas próximas e palavras que possam ser ofensivas ou controversas.
- Ter um procedimento para corrigir uma resposta publicada incorretamente e comunicar o impacto nas estatísticas.
- Registrar a versão das listas para apoiar diagnóstico de problemas sem coletar dados pessoais.

## 9. Critérios de aceite do MVP

1. Uma pessoa consegue inserir cinco letras, submeter um palpite válido e receber um estado para cada letra.
2. Um palpite que não tenha cinco letras ou não pertença à lista aceita não consome tentativa e recebe uma mensagem clara.
3. A partida termina após acerto ou após seis palpites válidos; não é possível submeter um sétimo.
4. O feedback respeita a quantidade real de letras repetidas na resposta e trata primeiro as letras corretas na posição.
5. Palpites com ou sem acento/cedilha são comparados segundo a regra de normalização; a resposta é exibida com grafia correta.
6. Uma resposta diária é igual para todos na data local de São Paulo e muda na virada do dia definida.
7. O resultado diário concluído persiste após atualização e não pode ser reiniciado pelo fluxo normal da interface.
8. É possível iniciar e terminar mais de uma partida de prática, sem alterar o desafio diário.
9. A conclusão mostra a resposta e as estatísticas da partida; estatísticas de prática e diário permanecem separadas.
10. Toda informação de estado das letras pode ser entendida sem cor, e a partida é completável por teclado com foco visível.
11. Leitor de tela recebe o conteúdo e os resultados das tentativas em uma ordem compreensível.
12. Se os dados locais forem removidos, a interface não indica falsamente que o progresso está sincronizado ou recuperável.

## 10. Métricas para avaliar

As métricas abaixo são propostas para validar a experiência; não há benchmarks definidos nesta fase.

- **Ativação:** proporção de pessoas que iniciam e concluem a primeira partida.
- **Conclusão:** proporção de partidas terminadas por vitória ou derrota, segmentada por modo.
- **Dificuldade percebida:** tentativas usadas, frequência de abandono e taxa de vitória.
- **Qualidade do conteúdo:** palpites rejeitados, reclamações sobre palavras e correções editoriais.
- **Retorno:** retorno ao desafio diário no dia seguinte e participação no modo prática.
- **Acessibilidade:** sucesso de conclusão por teclado e leitor de tela em testes manuais e automatizados.
- **Desempenho e estabilidade:** tempo de resposta da interação e erros que interrompam partidas ou persistência.

Não interpretar sequência, retorno ou compartilhamento como prova de diversão ou retenção saudável sem pesquisa qualitativa e análise de coortes.

## 11. Riscos e mitigação

| Risco | Mitigação proposta |
|---|---|
| Uma resposta rara ou regional parecer injusta | Curadoria, teste com falantes de português brasileiro e canal para reportar palavras problemáticas. |
| A lista de palpites rejeitar uma forma legítima | Separar validação de respostas, revisar o dicionário e registrar reclamações para correção. |
| Regras de letras repetidas confundirem | Explicar a regra em instruções breves e cobrir casos repetidos nos testes. |
| A normalização tornar duas grafias indistinguíveis | Definir que acentos/cedilha não mudam a comparação e manter a grafia correta na revelação. |
| Erro na virada ou fuso do desafio diário | Centralizar o cálculo de data em `America/Sao_Paulo` e testar limites de dia e horário de verão conforme suporte da plataforma. |
| Perda de progresso local | Persistir estado local e informar claramente que os dados não são sincronizados e podem ser apagados. |
| Código de cores inacessível | Usar símbolos/texto, semântica acessível e testes com teclado/leitor de tela. |
| Streaks ou rankings criarem pressão | Não incluir no MVP; reavaliar com evidências e feedback de jogadores. |

## 12. Decisões tomadas e recomendações assumidas

### Escolhas confirmadas pelo solicitante

- Mecânica central: adivinhar uma palavra com pistas por letra, no estilo Wordle.
- Palavra de cinco letras.
- Até seis tentativas.
- Idioma de lançamento: português brasileiro.
- Ignorar acentos e cedilha na comparação.
- Desafio diário compartilhado e modo de prática ilimitado.
- Contagem exata de letras repetidas na avaliação.
- Feedback com cor e sinal/texto acessível, com suporte a teclado e leitor de tela.
- Palpites aceitos a partir de dicionário de português brasileiro, incluindo flexões comuns.
- Ao terminar: revelar o resultado e exibir estatísticas; no modo diário, o próximo desafio fica disponível no dia seguinte.

### Recomendações assumidas para completar o rascunho

- Respostas diárias curadas e respostas da prática sorteadas de um conjunto maior aprovado.
- Partida diária limitada a uma conclusão por navegador/perfil local; dados e estatísticas armazenados localmente.
- Desafio diário troca à meia-noite no fuso `America/Sao_Paulo`.
- Sem arquivo de desafios anteriores, contas, sincronização, streak, dicas, compartilhamento, anúncios ou monetização no MVP.
- Layout responsivo para navegador móvel e desktop.
- Meta de acessibilidade WCAG 2.2 AA para a interface aplicável.
- Regras de palavras controversas, política editorial detalhada e implementação técnica das listas precisam ser definidas antes do lançamento.

Estas recomendações são premissas provisórias do PRD, não decisões irreversíveis. Devem ser validadas com protótipo e testes com o público-alvo, especialmente a dificuldade das palavras, a utilidade das estatísticas e o valor do desafio diário.

## 13. Referências da pesquisa

Pesquisa exploratória consultada em 14 de outubro de 2026. As páginas de produto identificam mecânicas e funcionalidades observáveis; não comprovam causalidade sobre retenção.

- [The New York Times — Wordle](https://www.nytimes.com/games/wordle/)
- [The New York Times — Connections](https://www.nytimes.com/games/connections)
- [The New York Times — Strands](https://www.nytimes.com/games/strands)
- [Contexto](https://contexto.me/?l=en)
- [Semantle — About](https://semantle.com/about/)
- [W3C — WCAG 2.2: Use of Color (1.4.1)](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [W3C — WCAG 2.2: Keyboard (2.1.1)](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [Apple — App Store: New York Times Games](https://apps.apple.com/us/app/nyt-games-wordle-crossword/id307569751)
- [arXiv — Finding the optimal human strategy for Wordle using maximum correct letter probabilities and reinforcement learning](https://arxiv.org/abs/2202.00557)
