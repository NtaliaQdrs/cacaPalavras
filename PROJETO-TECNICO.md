# Projeto técnico — Entrelinhas

**Produto:** jogo casual de adivinhação de palavras  
**Versão do documento:** 1.0  
**Status:** proposta para implementação  
**Base de produto:** [PRD.md](./PRD.md)  
**Conceito visual:** [prototypes/visual-concept.html](./prototypes/visual-concept.html)

## 1. Objetivo e escopo

Este documento descreve uma implementação técnica para o conceito **Entrelinhas — palavra do dia**: um jogo de navegador em português brasileiro, com um desafio diário e partidas ilimitadas de prática. A interface preserva o caráter editorial do mockup — papel, tinta escura, detalhes em vermelho, dourado e verde, títulos serifados e tabuleiro monoespaçado — sem comprometer o uso em dispositivos móveis, por teclado ou por leitor de tela.

O escopo é o MVP do PRD:

- palavra-resposta com cinco letras, avaliada em até seis tentativas;
- validação por lista de palavras aceitas em português brasileiro;
- comparação que ignora acentos e cedilha;
- desafio diário comum e prática ilimitada;
- estatísticas locais separadas por modo;
- persistência no navegador, sem conta e sem transmitir palpites;
- interface responsiva e acessível.

Não fazem parte desta implementação inicial: servidor de contas, sincronização, multiplayer, arquivo de desafios, dicas, ranking, streaks, monetização ou localização para outros idiomas.

## 2. Decisões técnicas propostas

| Tema | Proposta | Motivo |
|---|---|---|
| Aplicação | HTML semântico, CSS e JavaScript ES modules, sem framework de interface | O produto é uma única tela de jogo; a simplicidade facilita manutenção e preserva a identidade visual existente. |
| Execução | Aplicação estática, servida por HTTPS | Não há contas nem dados de usuário no servidor no MVP. A aplicação pode ser hospedada em qualquer serviço de arquivos estáticos. |
| Desenvolvimento/build | Vite como servidor local e empacotador, após a implementação ser autorizada | Permite ES modules, fluxo local previsível e build otimizado sem adicionar framework de UI. O repositório ainda não tem configuração de build. |
| Testes de domínio | Vitest ou `node:test` para funções puras | A regra de letras, normalização, calendário e estatísticas devem ser testáveis sem DOM. |
| Testes de interface | Playwright para fluxos críticos e viewport móvel | Verifica interação real, responsividade e regressões no navegador. |
| Persistência | `localStorage`, com envelope versionado e validação na leitura | Atende persistência local e evita cadastro, sincronização ou coleta remota. |
| Fonte de verdade durante a sessão | Estado em memória; persistência como snapshot após cada transição válida | Mantém renderização consistente e reduz risco de estado parcial. |
| Idioma/fuso | Português brasileiro; data diária em `America/Sao_Paulo` | Alinhamento com o PRD e comportamento previsível para a virada do desafio. |

O empacotador e os runners de teste são ferramentas de desenvolvimento, não dependências carregadas no navegador em produção.

## 3. Arquitetura lógica

Separar as regras puras de jogo, a coordenação de estado, o acesso ao navegador e a apresentação. A camada visual não deve decidir se uma letra está correta nem alterar diretamente as estatísticas.

```text
Entrada física / teclado virtual / controles
                    │
                    ▼
        Controlador de interação (UI)
                    │ chama comandos
                    ▼
      Serviço de aplicação / GameController
          ├── Domínio: partida e avaliação
          ├── Domínio: normalização e dicionário
          ├── Domínio: seleção do desafio/data
          └── Domínio: atualização de estatísticas
                    │
         ┌──────────┴───────────┐
         ▼                      ▼
     Persistência          Renderização
     localStorage          DOM acessível
```

### Responsabilidades

- **Domínio:** funções determinísticas sem dependências do navegador. Recebem valores e retornam novo estado ou resultado validado.
- **Aplicação:** aplica comandos do usuário, coordena domínio, relógio, persistência e renderização; garante transições permitidas.
- **Infraestrutura:** encapsula `localStorage`, relógio e carregamento dos dados locais.
- **Interface:** apresenta o estado; encaminha eventos; comunica erros e atualizações por região viva; não contém a regra de avaliação.

Não é necessário um gerenciador de estado externo. Um único controlador de aplicação e renderizações localizadas são suficientes para o tabuleiro e os cartões laterais.

## 4. Estrutura de arquivos recomendada

Estrutura sugerida para uma implementação posterior. Os arquivos listados são uma proposta, não existem ainda:

```text
/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── data/
│       ├── accepted-words.pt-BR.json
│       ├── practice-answers.pt-BR.json
│       └── daily-puzzles.pt-BR.json
├── src/
│   ├── main.js
│   ├── app/
│   │   ├── create-game-controller.js
│   │   └── commands.js
│   ├── domain/
│   │   ├── game.js
│   │   ├── normalize-word.js
│   │   ├── evaluate-guess.js
│   │   ├── dictionary.js
│   │   ├── daily-puzzle.js
│   │   └── statistics.js
│   ├── infrastructure/
│   │   ├── local-storage.js
│   │   ├── browser-clock.js
│   │   └── puzzle-data.js
│   ├── ui/
│   │   ├── render-app.js
│   │   ├── render-board.js
│   │   ├── render-keyboard.js
│   │   ├── bind-input.js
│   │   └── announce.js
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── game.css
│       └── responsive.css
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

Responsabilidades dos módulos:

- `game.js`: estado inicial, adicionar/remover letra, submeter tentativa, determinar encerramento e transições legais.
- `normalize-word.js`: normalização e validação de forma/caracteres.
- `evaluate-guess.js`: cálculo de estado por posição, inclusive com letras repetidas.
- `dictionary.js`: validação de palpites, detecção de entradas duplicadas depois de normalizar e validação de dados editoriais.
- `daily-puzzle.js`: derivar data local, resolver edição diária e calcular identificador exibido.
- `statistics.js`: derivar e atualizar totais sem duplicar contagem de uma partida encerrada.
- `local-storage.js`: ler, validar, versionar e gravar snapshots; relatar indisponibilidade ou corrupção.
- `create-game-controller.js`: criar partida, executar comandos, persistir transições, trocar modo e notificar renderizadores.
- `render-*`: projetar estado no DOM e atualizar só as regiões afetadas.
- `bind-input.js`: traduzir teclado físico, teclado virtual, apagar e enviar em comandos do controlador.

## 5. Modelo de domínio

### 5.1. Constantes

```js
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const DAILY_TIME_ZONE = "America/Sao_Paulo";
const STORAGE_KEY = "entrelinhas:v1";
```

Guardar constantes em um único módulo evita divergência entre tabuleiro, validador, renderização e testes.

### 5.2. Estado de partida

Uma partida pode ser representada por um objeto serializável:

```js
{
  id: "daily:2026-10-14", // ou identificador único de prática
  mode: "daily",          // "daily" | "practice"
  puzzleId: "2026-10-14", // data diária ou id de resposta da prática
  guesses: [
    {
      word: "AMORA",      // grafia submetida, normalizada para exibição uniforme
      marks: ["correct", "absent", "absent", "correct", "present"]
    }
  ],
  currentInput: "M",
  status: "playing",      // "playing" | "won" | "lost"
  startedAt: "2026-10-14T12:00:00.000Z",
  completedAt: null
}
```

Não persistir cópias redundantes que possam divergir, como uma contagem editável de tentativas: `guesses.length` é a quantidade já submetida, e a tentativa atual é `guesses.length + 1` enquanto a partida estiver ativa.

### 5.3. Estatísticas

Manter estatísticas separadas por modo:

```js
{
  daily: {
    played: 0,
    won: 0,
    winsByAttempts: [0, 0, 0, 0, 0, 0]
  },
  practice: {
    played: 0,
    won: 0,
    winsByAttempts: [0, 0, 0, 0, 0, 0]
  }
}
```

`played` conta partidas encerradas, tanto vitórias quanto derrotas. O percentual de vitórias, se mostrado, é derivado de `won / played`, com estado vazio quando `played === 0`. O valor nunca é armazenado em paralelo. Uma partida só incrementa estatísticas na primeira transição de `playing` para `won` ou `lost`.

### 5.4. Persistência versionada

Envelope sugerido:

```js
{
  schemaVersion: 1,
  savedAt: "2026-10-14T12:00:00.000Z",
  activeMode: "daily",
  daily: {
    currentDate: "2026-10-14",
    game: { /* estado de partida ou null se ainda não iniciada */ }
  },
  practice: {
    game: { /* partida em andamento ou null */ },
    recentPuzzleIds: []
  },
  statistics: { /* totais separados descritos acima */ }
}
```

- O desafio diário concluído permanece no estado da data correspondente; ao mudar a data, cria-se uma partida para a nova edição.
- Ao reabrir a página, resolver a data atual no fuso do produto antes de escolher o estado diário.
- A prática salva no máximo a partida atual e o histórico recente mínimo necessário para evitar repetição imediata. Não guardar todas as tentativas encerradas.
- Limitar `recentPuzzleIds` a um tamanho pequeno definido em constante e ao tamanho do conjunto disponível.
- Em `localStorage` indisponível, mostrar aviso visível e acessível de que o progresso pode não sobreviver a atualização/fechamento; não simular persistência bem-sucedida.
- Em JSON inválido, versão incompatível ou campos inválidos, registrar o erro no console de desenvolvimento, informar que o progresso local não pôde ser restaurado e pedir confirmação antes de iniciar dados novos. Não substituir silenciosamente dados existentes.
- Validar todo dado lido como entrada não confiável; nunca inserir conteúdo do armazenamento ou do dicionário por `innerHTML`.

O armazenamento local é específico do navegador/perfil. Apagar dados do site, trocar dispositivo ou usar navegação privada pode remover ou não preservar a partida.

## 6. Regras de palavras e avaliação

### 6.1. Normalização

Implementar uma função pura compartilhada pela entrada, lista de respostas, lista de palpites e avaliação:

1. Converter para maiúsculas com `toLocaleUpperCase("pt-BR")`.
2. Normalizar em Unicode NFD.
3. Remover marcas diacríticas Unicode (`\p{M}`).
4. Aceitar somente as letras `A` a `Z` após normalização.
5. Exigir cinco letras normalizadas para respostas e palpites.

Exemplo: `AÇÃO` normaliza para `ACAO`; `AVÓ` normaliza para `AVO`. Cedilha também se decompõe e é removida. A normalização serve à comparação; a lista de respostas deve preservar a grafia editorial correta para revelação.

Como grafias diferentes podem colidir (por exemplo, palavra com/sem acento), a lista de respostas deve rejeitar colisões após normalização. Isso impede que duas respostas visualmente distintas produzam a mesma sequência de pistas.

### 6.2. Palpites aceitos e respostas

Manter três conjuntos distintos:

1. `acceptedWords`: entradas válidas para palpite, incluindo flexões comuns aprovadas.
2. `practiceAnswers`: respostas possíveis na prática, curadas e aprovadas.
3. `dailyPuzzles`: associação imutável entre identificador/data e resposta diária.

Cada arquivo precisa ser validado no carregamento ou por um teste editorial: formato, tamanho, palavras duplicadas após normalização, colunas obrigatórias, resposta pertencente à lista de palavras permitidas e colunas com identificadores únicos.

O dicionário de aceitação e as respostas devem ter versão registrada para reproduzir relatos de palavras rejeitadas ou difíceis. A lista de respostas não deve ser gerada a partir de qualquer entrada do dicionário.

### 6.3. Avaliação com letras repetidas

Algoritmo em duas passagens:

1. Inicializar todos os estados como `absent`.
2. Marcar primeiro as posições em que palpite e resposta normalizados são iguais.
3. Contar, na resposta, as ocorrências ainda não consumidas de cada letra.
4. Percorrer as posições restantes do palpite, da esquerda para a direita; se houver ocorrência disponível, marcar `present` e consumir uma ocorrência; caso contrário, manter `absent`.

Pseudocódigo:

```text
marks = [absent × 5]
remaining = mapa de contagem

para cada posição i:
  se guess[i] == answer[i]:
    marks[i] = correct
  senão:
    remaining[answer[i]] += 1

para cada posição i:
  se marks[i] != correct e remaining[guess[i]] > 0:
    marks[i] = present
    remaining[guess[i]] -= 1
```

Exemplo: resposta `ARARA`, palpite `AMORA` → `A(correct), M(absent), O(absent), R(correct), A(present)`. O algoritmo não marca duas ocorrências de `A` como presentes/corretas quando a resposta não possui ocorrências sobrando para elas.

### 6.4. Terminação e transições

- `appendLetter`: só altera uma partida em `playing`; ignora caracteres que não sejam uma letra aceita ou quando o campo já tiver cinco letras.
- `removeLetter`: só altera o campo da tentativa atual e só se ele não estiver vazio.
- `submitGuess`: exige exatamente cinco letras e palavra aceita; falhas não consomem tentativa e geram uma mensagem apropriada.
- Após avaliação, se todas as posições forem `correct`, estado passa a `won`; se for a sexta tentativa sem vitória, passa a `lost`; nos demais casos continua `playing`.
- Não aceitar novas letras nem submissão após estado terminal.
- Revelar a resposta somente quando o estado for `won` ou `lost`.
- Ao encerrar, atualizar estatísticas em uma única transição idempotente. Rehidratação e re-renderização não podem contabilizar a mesma partida outra vez.

## 7. Desafio diário e prática

### 7.1. Data e identificador diário

Derivar uma chave ISO `YYYY-MM-DD` usando `Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"` e partes numéricas de ano, mês e dia. Não usar `toISOString().slice(0, 10)` para identificar o dia do jogador: isso usa UTC e pode trocar o desafio em horário local incorreto.

Resolver a chave numa tabela de dados explícita:

```json
[
  { "date": "2026-10-14", "id": "287", "answer": "ENTRE" }
]
```

Se o sistema iniciar sem configuração de um desafio para a data atual, apresentar erro de conteúdo e um estado explícito de indisponibilidade para o diário; não escolher uma resposta aleatória nem reportar que o jogo começou normalmente. A prática pode continuar disponível se seu conjunto tiver sido carregado.

O número de edição mostrado na interface deve vir do manifesto editorial, não de texto fixo como `287 / 365`. Um calendário anual pode ter ano bissexto e o produto não definiu uma meta fixa de 365 edições.

### 7.2. Limite de confiança da implementação estática

Uma aplicação puramente estática que envia as respostas diárias ao navegador **não consegue proteger a resposta de quem inspecionar o JavaScript, os dados baixados ou o armazenamento local**. Hashes simples, nomes ofuscados ou separar o JSON em outro arquivo não fornecem segredo. O modelo estático satisfaz o requisito de desafio comum e evita coleta de dados, mas aceita esse risco para um jogo casual sem competição valiosa.

Se o produto exigir sigilo real da palavra até o encerramento, será necessário um serviço que mantenha a resposta no servidor, com entrega de pistas/validação via endpoint. Isso introduz backend, disponibilidade operacional e uma mudança arquitetural fora do MVP descrito pelo PRD. A decisão deve ser revista antes de anunciar o desafio como resistente a spoilers.

### 7.3. Seleção da prática

- Sortear da coleção aprovada usando `crypto.getRandomValues` se disponível; não usar aleatoriedade para escolher o diário.
- Evitar repetição imediata usando IDs recentes persistidos.
- Excluir todos os IDs recentes da lista candidata; se isso esvaziar o conjunto, liberar o ID mais antigo e continuar.
- Ao iniciar nova prática, encerrar ou substituir uma sessão em andamento somente após confirmação; não perder silenciosamente palpites locais.
- Iniciar nova prática não modifica a partida diária nem suas estatísticas.

## 8. Interface e implementação visual

### 8.1. Direção visual

Reaproveitar o sistema do mockup, tornando-o tokens CSS explícitos:

| Token | Valor do mockup | Uso |
|---|---|---|
| `--paper` | `#f2eddf` | Fundo geral com tom de papel. |
| `--paper-light` | `#fbf8ef` | Tabuleiro e superfícies claras. |
| `--paper-deep` | `#e7dfcc` | Superfícies secundárias. |
| `--ink` | `#202b27` | Texto principal e cartão escuro do desafio. |
| `--ink-soft` | `#53615a` | Texto secundário. |
| `--line` | `#d7cfbd` | Bordas e divisórias. |
| `--red` / `--red-dark` | `#c94d36` / `#a63b29` | Marca, títulos destacados, foco e pequenos acentos. |
| `--green` / `--green-light` | `#3d654e` / `#e6eee3` | Letra na posição correta. |
| `--gold` / `--gold-light` | `#dfbd70` / `#f1e5c7` | Letra presente em outra posição. |
| `--quiet` | `#d7d7cb` | Letra ausente. |

Manter a sensação editorial por famílias locais/fallbacks do mockup: serifada nos títulos e cartões, sem serifa na interface e monoespaçada em letras/identificadores. Não carregar fontes de terceiros no MVP. O CSS deve definir fallbacks robustos e não depender da disponibilidade de uma fonte específica.

### 8.2. Composição

- Cabeçalho com marca “entrelinhas”, assinatura e mensagem curta.
- Introdução com kicker/data, título editorial e frase de apresentação.
- Em desktop, área do jogo e tabuleiro à esquerda; cartão do diário e conteúdo auxiliar à direita.
- No celular, tabuleiro primeiro e cartões auxiliares abaixo, em uma única coluna.
- Cartão do desafio usa fundo `--ink`; prática e estatísticas mantêm tratamentos de superfície clara.
- A área de tabuleiro permanece centrada e com largura controlada; as cinco casas mantêm proporção quadrada.
- Teclado virtual tem teclas com alvo de toque e separação, sem reduzir em excesso o texto nas larguras pequenas.

Pontos de quebra do conceito atual: `760px` para reorganizar colunas e `460px` para compactar espaçamentos/tipografia. Validar visualmente pelo menos 320px, 375px, 768px e desktop amplo; não reproduzir esses números sem testar conteúdo real e zoom.

### 8.3. Dados dinâmicos em lugar de valores de demonstração

O protótipo contém edição/data, palpites, progresso de tabuleiro e estatísticas de exemplo. Na aplicação:

- gerar data e dia da semana dinamicamente no fuso do jogo;
- carregar edição pelo manifesto;
- renderizar somente tentativas existentes, a linha em andamento e linhas vazias restantes;
- derivar contagem de tentativas e resultado do estado da partida;
- substituir estatísticas fictícias por valores reais e um estado inicial explicativo;
- não mostrar resposta ou texto de vitória antes de a partida terminar;
- mostrar no cartão do diário “próximo desafio” só quando se souber o instante local seguinte, sem que a contagem seja necessária para jogar.

## 9. Acessibilidade e semântica

Objetivo de implementação: WCAG 2.2 AA nas telas do produto, complementado por testes com teclado e leitor de tela.

- Usar `<header>`, `<main>`, `<section>`, `<aside>`, botões nativos e hierarquia de títulos sem saltos arbitrários.
- Implementar modos diário/prática como botões com `aria-pressed` sincronizado, preservando o foco ao alternar.
- Representar o tabuleiro como uma tabela ou grupos de linhas/células com nomes acessíveis. Cada célula avaliada deve expor letra e estado por texto, não só por cor/símbolo decorativo.
- Marcas `×`, `↗` e `✓` ajudam visualmente, mas nomes acessíveis explícitos continuam necessários.
- Manter um `role="status"`/`aria-live="polite"` para anunciar validação e resultado de uma tentativa de forma concisa; não duplicar o anúncio lendo todas as trinta casas e também uma frase completa.
- Anunciar: “Tentativa 2 de 6. A, posição correta; R, presente em outra posição…”. Mensagens de palavra inválida devem ser acessíveis e não sumir antes de serem lidas.
- Gerenciar teclado físico: letras entram apenas quando o foco não está em outro controle de texto; `Enter` envia e `Backspace` apaga; ignorar modificadores, composição de IME e atalhos do navegador.
- Não interceptar letras enquanto leitor de tela ou usuário estiver focado em controles que precisem dessas teclas. Testar a estratégia de escopo de eventos com tecnologias assistivas.
- Teclado virtual usa `<button type="button">` com rótulos distintos (“Letra A”, “Apagar última letra”, “Enviar tentativa”) e ordem de foco lógica.
- Foco visível com outline de alto contraste, não removido no reset de estilos.
- Estado da letra é visualmente distinguível além da cor; conferir contraste de texto e componentes contra os fundos reais.
- Respeitar `prefers-reduced-motion`; animação de revelação é decorativa e nunca o único indicador de estado.
- Suportar zoom de 200% e refluxo de layout sem rolagem horizontal da página em largura equivalente a 320 CSS px.
- Evitar `aria-label` em todos os espaços vazios do tabuleiro repetindo “posição vazia” sem necessidade; a descrição do grupo deve comunicar tentativa/coluna de forma concisa.

## 10. Fluxos e estados de tela

### Carregamento

1. Carregar dados editoriais e validar listas.
2. Ler e validar o snapshot local.
3. Derivar a data diária em `America/Sao_Paulo`.
4. Resolver ou inicializar o estado diário e reidratar a prática.
5. Renderizar modo ativo, resumo estatístico e tabuleiro.
6. Se um recurso essencial falhar, mostrar erro específico com modo alternativo disponível, se houver.

### Entrada e tentativa

1. Receber letra por teclado físico ou botão virtual.
2. Atualizar `currentInput`, renderizar a linha ativa e persistir.
3. Em envio, verificar comprimento antes do dicionário.
4. Se inválido, anunciar mensagem, manter a tentativa atual e o foco.
5. Se válido, avaliar uma só vez, acrescentar ao histórico, limpar entrada atual e verificar término.
6. Se terminal, atualizar estatística uma única vez e revelar o resultado.
7. Persistir o snapshot e anunciar o resumo do feedback.

### Alternância e nova partida

- Alternar modo mostra exatamente a partida salva daquele modo, sem copiar tentativas.
- Partida diária concluída mostra estado terminal e resposta; não oferece reinício.
- Prática oferece uma ação explícita para nova palavra. Se houver partida em andamento, confirmar substituição.
- Atualizar a página reidrata o modo ativo e as partidas locais.

### Erros recuperáveis

- Dicionário ou manifesto inválido: relatório de erro de conteúdo; não iniciar uma resposta aleatória.
- Armazenamento bloqueado: aviso de sessão possivelmente não persistente, jogo ainda utilizável.
- Snapshot inválido: explicar falha e oferecer reinício após confirmação.
- Nenhuma palavra de prática disponível: desabilitar início de outra rodada e informar o motivo.

Mensagens de erro não devem ser transformadas em resultados de sucesso. Registrar detalhes técnicos no console de desenvolvimento; a mensagem da interface deve ser clara sem divulgar dados desnecessários.

## 11. Plano de testes

### 11.1. Testes unitários de domínio

| Área | Casos essenciais |
|---|---|
| Normalização | `Á`, `Ç`, texto minúsculo, Unicode composto/decomposto, caractere não permitido, tamanho antes/depois da normalização. |
| Avaliação | Todas ausentes, todas corretas, letra presente deslocada, duplicatas em guess, duplicatas na resposta, correspondência exata consumida antes das deslocadas. |
| Validação | Menos/mais de cinco letras, palavra inexistente, acentos equivalentes, resposta duplicada após normalização. |
| Transições | Não envia entrada incompleta, inválida não consome tentativa, seis tentativas encerram, tentativa após encerramento é recusada. |
| Estatística | Vitória e derrota incrementadas uma vez, vitória distribuída na tentativa correta, diário e prática isolados. |
| Data diária | Antes/depois da meia-noite em São Paulo, diferença da data UTC, mudança de mês/ano, ano bissexto e limites de horário. |
| Prática | Nova palavra diferente da anterior enquanto há alternativas, reuso só após esgotar a coleção candidata. |
| Persistência | Reidratação, versão desconhecida, JSON inválido, campos incompletos, erro de quota/acesso negado. |

Teste de referência para letras repetidas: resposta `ARARA`, palpite `AMORA`, saída `[correct, absent, absent, correct, present]`.

### 11.2. Testes de integração

- Controlador envia, avalia, persiste e reidrata a mesma partida.
- Completar partida diária não modifica estatísticas de prática.
- Completar prática não modifica diário nem número de edição.
- Falha de persistência produz aviso e não bloqueia a atualização de estado em memória.
- Re-render não repete efeitos colaterais nem contabiliza novamente a partida.

### 11.3. Testes end-to-end

1. Abrir a página e conferir modo diário, tabuleiro, legenda e teclado.
2. Submeter palpite incompleto e palavra não aceita; verificar mensagem e tentativa não consumida.
3. Completar partida com vitória e conferir revelação/estatística.
4. Perder em seis palpites e conferir resposta revelada.
5. Alternar modos e verificar isolamento.
6. Atualizar no meio da partida e verificar recuperação.
7. Usar somente teclado físico e somente teclado virtual.
8. Verificar estado nomeado por leitor de tela e anúncio único de feedback.
9. Rodar viewport móvel, zoom e movimento reduzido; conferir overflow e ordem de leitura.

Testes automatizados de axe podem apontar violações comuns, mas não substituem inspeção manual de foco, semântica, anúncios e contraste.

### 11.4. Regressão visual

Usar o mockup como referência, não como screenshot imutável. Capturar pelo menos desktop e celular nos estados: partida nova, tentativa avaliada, mensagem de inválido, vitória, derrota, diário indisponível e estatísticas vazias. Fixar conteúdo/data nos testes para screenshots determinísticas.

## 12. Privacidade, segurança e confiabilidade

- Não incluir analytics remotos, fontes remotas ou serviços de terceiros no MVP.
- Não enviar palpites, modo ativo ou estatísticas ao servidor.
- Tratar dicionário, manifesto e `localStorage` como dados não confiáveis: validar formato e renderizar como texto.
- Não armazenar nome, email ou outro identificador pessoal.
- Definir política simples de limpeza local acessível ao usuário, se oferecida, deixando explícita a perda de partidas/estatísticas.
- Distribuir a aplicação por HTTPS; usar cabeçalhos CSP e `X-Content-Type-Options` no host quando configurável.
- O estado local não é uma barreira contra manipulação. Usuários podem editar `localStorage`, mudar o relógio ou inspecionar os dados.
- Como não há placar competitivo nem prêmio, não é necessário impedir adulteração no MVP; não descrever estatísticas locais como verificadas.
- A resposta estática é visível ao usuário técnico, conforme a limitação da seção 7.2.

## 13. Dados editoriais e publicação

1. Preparar uma coleção de respostas diárias com palavra, grafia canônica, data/ID, revisão e versão.
2. Preparar um conjunto de prática maior e uma lista de palpites distinta.
3. Automatizar validação de comprimento, normalização, colisões, duplicatas e consistência entre manifesto/dicionários.
4. Fazer revisão humana de familiaridade no português brasileiro, flexões, ambiguidade, regionalismos e conteúdo inadequado.
5. Testar casos especiais, incluindo letras repetidas e grafia acentuada, antes de liberar a coleção.
6. Publicar a lista com a versão correspondente ao build e manter histórico de correções.
7. Se um desafio for publicado errado, corrigir o manifesto com nota de release; reconhecer que clientes com estado já concluído podem manter o resultado local anterior.

Não inserir uma lista extensa de palavras sem verificar origem, licenciamento e adequação de uso. A fonte e a licença do dicionário precisam ser aprovadas antes de distribuir a lista de palpites.

## 14. Build, qualidade e implantação

Ao iniciar a implementação, configurar scripts equivalentes a:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

O exemplo é uma proposta; adicionar dependências somente após decidir iniciar a implementação.

Pipeline recomendado:

1. Instalar dependências com lockfile.
2. Executar testes unitários.
3. Executar checagem de conteúdo editorial.
4. Executar build de produção.
5. Executar os fluxos e2e prioritários em navegador.
6. Publicar artefato estático em ambiente de homologação.
7. Fazer revisão visual responsiva e acessível antes da produção.

O build deve falhar se listas editoriais forem inconsistentes ou se testes de domínio falharem. A publicação deve preservar HTTPS e os cabeçalhos de segurança que o host suportar. Não é preciso banco de dados, backend, migração de servidor nem pipeline de dados pessoais no MVP.

## 15. Plano de implementação

### Fase 1 — Base e sistema visual

- Criar a estrutura modular e extrair tokens CSS do mockup.
- Implementar estrutura semântica, layout responsivo e conteúdo dinâmico sem lógica de jogo.
- Remover data, edição, tentativas e estatísticas fixas da demonstração.

**Saída:** página equivalente ao conceito, responsiva e sem valores de jogo inventados.

### Fase 2 — Domínio e conteúdo

- Implementar normalização, dicionário, algoritmo de avaliação e transições.
- Adicionar dados iniciais revisados para diário/prática e validação automática do manifesto.
- Cobrir letras repetidas, acentos/cedilha, vitórias e derrotas com testes unitários.

**Saída:** motor de jogo determinístico e coberto por testes.

### Fase 3 — Interface interativa e persistência

- Implementar teclado físico e virtual, mensagens, modos e estados terminais.
- Implementar localStorage versionado, restauração e tratamento explícito de falhas.
- Conectar estatísticas e conteúdo aos cartões existentes.

**Saída:** fluxos do PRD funcionando sem servidor.

### Fase 4 — Acessibilidade, validação e publicação

- Validar teclado, foco, leitor de tela, contraste, movimento reduzido e zoom.
- Automatizar fluxos e2e e snapshots visuais essenciais.
- Confirmar dicionário/licença e revisar calendário.
- Homologar, conferir cabeçalhos e publicar.

**Saída:** MVP aprovado pelos critérios de aceite do PRD.

## 16. Critérios de pronto técnico

- A implementação atende os critérios de aceite 1–12 do [PRD.md](./PRD.md).
- A avaliação tem cobertura de testes para ocorrência duplicada e acento/cedilha.
- O diário resolve a mesma resposta para todos na data local do produto e não troca no limite UTC incorreto.
- Atualização do navegador não apaga uma partida válida; falhas de armazenamento são explicadas.
- Diário e prática mantêm estados e métricas separados.
- Nenhuma estatística ou conteúdo de exemplo do mockup aparece como dado real.
- A interface funciona por teclado, expõe estados além de cores e passa revisão manual de leitor de tela.
- Layout é verificável em viewport de 320 CSS px, celular comum e desktop.
- Build não depende de rede para carregar fontes ou ativos externos.
- Os dados de palavras têm licença, versão e validação editorial registradas.

## 17. Riscos e questões a resolver antes da produção

| Questão | Impacto | Recomendação |
|---|---|---|
| Palavra diária acessível no cliente | Inspecionar arquivos pode revelar a resposta. | Aceitar explicitamente para o MVP casual ou aprovar serviço mínimo antes de prometer segredo. |
| Lista de dicionário e licença | Pode impedir distribuição ou trazer palavras inadequadas. | Escolher fonte/licença e política de curadoria antes de importar dados. |
| Persistência apenas local | Perde progresso entre dispositivos, perfis ou após limpeza de dados. | Manter aviso no produto; sincronização permanece fora do MVP. |
| Editar o relógio local | Permite acessar outra data diária no cliente. | Aceitar sem placar competitivo; servidor seria necessário para impedir. |
| Colisões de acentuação | Respostas diferentes podem ser indistinguíveis após normalização. | Recusar colisões em respostas e validar antes de cada build. |
| Contagem das letras acentuadas | O usuário pode achar que uma marca corresponde a caractere visual específico. | Explicar que acentos não alteram a comparação e manter resposta canônica. |
| Quantidade e balanceamento do conteúdo | Diário raro/desconhecido parece injusto; prática repete respostas. | Revisão humana, testes com falantes e variedade curada antes de lançar. |

## 18. Referências técnicas

- [PRD do produto](./PRD.md)
- [Mockup visual Entrelinhas](./prototypes/visual-concept.html)
- [W3C WCAG 2.2 — Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [W3C WCAG 2.2 — Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [MDN — `Intl.DateTimeFormat`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [MDN — Web Storage API](https://developer.mozilla.org/docs/Web/API/Web_Storage_API)
- [MDN — `String.prototype.normalize()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
