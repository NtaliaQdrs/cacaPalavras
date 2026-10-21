# Especificação técnica — Palavra por palavra

**Produto:** jogo casual de adivinhação de palavras em português brasileiro  
**Versão:** 1.0  
**Status:** implementação do MVP  
**Requisitos de produto:** [PRD.md](./PRD.md)  
**Referência técnica anterior:** [PROJETO-TECNICO.md](./PROJETO-TECNICO.md)  
**Design adotado:** [prototypes/accessibility-concept.html](./prototypes/accessibility-concept.html)

## 1. Objetivo e escopo

Este documento descreve a implementação do MVP do jogo a partir do PRD e do conceito de interface acessível selecionado. A aplicação roda no navegador, sem conta, backend, publicidade ou transmissão de palpites. A interface usa português brasileiro e prioriza leitura clara, operação por teclado e toque, informação redundante (texto, símbolo e cor) e adaptação a telas pequenas.

O jogador descobre uma palavra de cinco letras em até seis tentativas. Há um desafio diário compartilhado por data no fuso `America/Sao_Paulo` e partidas ilimitadas de prática. O progresso e estatísticas são locais ao navegador.

Fora do escopo: sincronização, multiplayer, ranking, arquivo de desafios, dicas, streak, compartilhamento, monetização e proteção da resposta contra inspeção do cliente.

## 2. Design e experiência

O conceito acessível determina a hierarquia e os componentes:

- cabeçalho com marca, navegação para diário, prática e instruções;
- introdução com a regra explicada diretamente;
- seletor de modo com estado atual perceptível;
- tabuleiro de seis linhas por cinco colunas, com pistas visíveis em texto e símbolos;
- teclado virtual operável com mouse, toque e leitores de tela;
- painel de estado, regras e estatísticas locais;
- cores de alto contraste com padrões/bordas diferentes, sem depender da cor para identificar uma pista;
- foco visível, atalho para pular ao conteúdo, movimento reduzido e layout em uma coluna em viewport estreito.

O HTML do protótipo é referência visual e semântica, não fonte dos dados de demonstração. A aplicação não deve perpetuar datas, palpites, respostas ou estatísticas fictícias que apareçam no mockup.

## 3. Requisitos funcionais

1. Aceitar apenas palavras normalizadas de cinco letras presentes na lista de palpites.
2. Não consumir tentativa quando a palavra estiver incompleta ou não for aceita.
3. Avaliar cada letra como `correct`, `present` ou `absent`, contabilizando ocorrências repetidas corretamente.
4. Encerrar por acerto ou após seis tentativas válidas; revelar a resposta apenas no estado terminal.
5. Comparar sem diferenciar caixa, acentos ou cedilha, mantendo grafia editorial na resposta revelada.
6. Fornecer diário estável por data local de São Paulo e prática independente, sem repetição imediata quando houver alternativas.
7. Persistir partidas em andamento e estatísticas por modo; atualização não deve reiniciar partidas.
8. Contabilizar estatísticas uma única vez ao concluir uma partida e separar diário de prática.
9. Permitir entrada física (`A-Z`, `Enter`, `Backspace`) e pelo teclado virtual.
10. Comunicar erro, progresso e resultado em região de status acessível.

## 4. Arquitetura e arquivos

Aplicação estática sem framework. As regras de domínio são funções puras e não dependem de DOM ou armazenamento.

```text
index.html               Estrutura semântica, regiões e elementos do jogo
styles.css               Tokens, estados visuais e breakpoints responsivos
src/game.js              Normalização, avaliação, calendário e transições
src/app.js               Estado da interface, eventos, renderização e persistência
tests/game.test.js       Testes unitários do domínio com node:test
package.json             Modo ES module e comando de testes sem dependências externas
```

### Responsabilidades

- `src/game.js`: normalização única, validação de listas, geração de partidas, avaliação e mutações puras da partida.
- `src/app.js`: carrega o catálogo, resolve data e armazenamento, encaminha eventos, renderiza DOM usando APIs seguras e anuncia alterações.
- `index.html`/`styles.css`: semântica e apresentação. Não contêm regra de pontuação.
- `tests/game.test.js`: cobre regras linguísticas, letras repetidas, limites e determinismo diário.

Executar a página por um servidor estático local, por exemplo `npx`/extensão de servidor local; módulos ES não devem ser abertos via `file://`. Não é necessário baixar dependências para testar ou executar a aplicação.

## 5. Modelo de domínio

Constantes centrais:

```js
WORD_LENGTH = 5
MAX_ATTEMPTS = 6
TIME_ZONE = "America/Sao_Paulo"
STORAGE_KEY = "palavra-por-palavra:v1"
```

Uma partida contém identificador, modo, resposta com grafia editorial, palpites avaliados, entrada corrente e estado (`playing`, `won` ou `lost`). A contagem de tentativas é sempre derivada do tamanho do array `guesses`. Estados terminais não aceitam mais entrada.

Estatísticas por modo armazenam `played`, `won` e `winsByAttempts` com seis posições. Os totais são atualizados somente na transição de ativa para terminal; porcentagens não são persistidas.

### Normalização e avaliação

`normalizeWord` converte para maiúsculas em `pt-BR`, aplica Unicode NFD e remove marcas diacríticas. A forma resultante deve conter apenas `A-Z`. A avaliação marca primeiro todas as letras corretas na posição; em seguida consome apenas as ocorrências restantes da resposta ao marcar letras presentes fora da posição.

As respostas preservam os diacríticos. Uma colisão entre duas respostas após normalização é inválida, pois não seria possível diferenciá-las pelas pistas.

## 6. Conteúdo editorial e desafio diário

O MVP inclui um pequeno catálogo curado embutido no módulo de domínio: a lista de respostas é separada da lista mais ampla de palpites aceitos; ambos têm versão e passam por validação automatizada de formato e colisões. O catálogo inicial demonstra o funcionamento, mas não equivale a um dicionário brasileiro completo. Antes de uma publicação ampla, ampliar e revisar editorialmente as palavras aceitas e respostas, verificar licenças da fonte e documentar a política de regionalismos, flexões e termos controversos.

O desafio deriva a chave `YYYY-MM-DD` com `Intl.DateTimeFormat` e `America/Sao_Paulo`; nunca usa a data UTC para escolher a edição. A edição é calculada deterministicamente sobre o catálogo de respostas aprovado. Portanto, a mesma data e versão de catálogo produzem a mesma resposta para todos. A sequência cíclica é um mecanismo provisório do MVP; para uma operação editorial de calendário, substituir por manifesto revisado de data/edição/resposta e tratar ausência de edição como indisponibilidade explícita, não como resposta aleatória.

Uma aplicação estática não esconde segredos: usuários podem inspecionar a resposta carregada pelo navegador. Isso é aceitável somente para o jogo casual sem competição do MVP. Sigilo efetivo exigiria serviço remoto e revisão de escopo.

Na prática, a escolha usa aleatoriedade criptográfica quando disponível e evita IDs recentes até esgotar alternativas. Prática e diário nunca compartilham estado de partida ou estatísticas.

## 7. Persistência e privacidade

Um único snapshot JSON versionado no `localStorage` guarda o modo ativo, estado diário da data atual, prática ativa/histórico recente e estatísticas. A aplicação valida dados essenciais antes de reutilizá-los e não renderiza valores armazenados por `innerHTML`.

- Uma partida diária concluída não pode ser reiniciada pelo fluxo normal.
- Na troca de data local, cria-se o desafio correspondente; estatísticas anteriores permanecem.
- Uma nova prática em andamento exige confirmação antes de ser substituída.
- Falha ou bloqueio do armazenamento é comunicada claramente; a sessão continua apenas em memória e não afirma que foi salva.
- Dados inválidos/corrompidos não são sobrescritos silenciosamente; a interface deve apresentar recuperação explícita.
- A limpeza do navegador pode apagar partidas e estatísticas; não há envio de dados pessoais ou sincronização.

## 8. Interação e acessibilidade

- Elementos semânticos, títulos em ordem, labels claros, link “Pular para o jogo” e botões nativos.
- O tabuleiro é uma tabela com caption e célula identificada por letra e significado textual. Os símbolos são complementares.
- Região `role="status"`/`aria-live="polite"` anuncia erro, resultado e final de partida sem duplicar leitura de cada célula.
- Teclado físico: letras entram quando a página não está em controle editável; `Backspace` remove e `Enter` submete. Não interceptar teclas com modificadores nem composição de texto.
- Botões do teclado virtual têm nomes acessíveis; foco permanece previsível e visível.
- Layout deve refluír em celular/zoom e manter tabuleiro, controles e mensagens acessíveis.
- `prefers-reduced-motion` remove animação não essencial.
- A meta é WCAG 2.2 AA; a implementação visual não substitui validação manual com leitores de tela, contraste e zoom.

## 9. Mensagens e tratamento de falhas

Mensagens de entrada incompleta, palavra não reconhecida, vitória, derrota, início de prática e falha de armazenamento são visíveis e anunciadas. Catálogo inválido ou resposta ausente não deve produzir vitória/perda simulada. Erros técnicos podem ser registrados no console; não usar fallbacks que aparentem salvamento ou validação bem-sucedidos.

## 10. Plano de testes e aceite técnico

Executar `npm test` com `node --test`. Cobrir:

- acentos/cedilha e Unicode, comprimento e caracteres inválidos;
- acerto exato, letras deslocadas, ausentes e duplicadas;
- submissão inválida sem consumo de tentativa, vitória e derrota em seis tentativas;
- chave diária determinística e data calculada no fuso de São Paulo;
- independência de modo e atualização idempotente de estatísticas.

Verificações manuais de navegador: diário/prática, persistência após recarga, 320px e desktop, operação completa por teclado, foco visível e anúncio por leitor de tela. Testes unitários não certificam acessibilidade, compatibilidade real de navegadores nem a qualidade editorial do catálogo.

## 11. Limitações conhecidas e evolução

- Catálogo inicial pequeno para validar o mecanismo; precisa de curadoria e licença antes de distribuição ampla.
- Calendário diário cíclico é determinístico, mas não substitui um plano editorial de longo prazo.
- Resposta estática pode ser inspecionada; sem proteção contra spoiler.
- Dados locais não sincronizam e podem ser apagados.
- Testes automatizados da primeira entrega focam domínio; e2e, auditoria automatizada de acessibilidade e revisão manual permanecem verificações de lançamento.

Essas limitações devem ser tratadas antes de apresentar o protótipo como produto com conteúdo completo ou competição.
