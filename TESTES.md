# Testes do jogo

Este documento descreve os testes automatizados do jogo e outras verificações recomendadas.

## Como executar

Na raiz do projeto, execute:

```bash
npm test
```

O comando usa o test runner `node:test` do Node.js e procura testes nos arquivos `tests/`.

## Testes automatizados existentes

Os testes em [`tests/game.test.js`](./tests/game.test.js) verificam as regras principais do jogo:

| Cenário | O que é verificado |
|---|---|
| Catálogo de palavras | As palavras aceitas e as respostas são válidas; duplicatas após normalização são rejeitadas. |
| Avaliação dos palpites | Letras corretas na posição certa, letras presentes em outra posição e letras ausentes são identificadas corretamente. |
| Letras repetidas | Correspondências exatas são contabilizadas antes das ocorrências repetidas, evitando pistas incorretas. |
| Acentos | A comparação da resposta ignora diferenças de acentuação. |
| Entrada de letras | A entrada aceita letras, limita o palpite a cinco posições e permite apagar uma letra; caracteres inválidos são ignorados. |
| Validação de palpites | Palpites incompletos ou não reconhecidos exibem erro e não consomem tentativa. |
| Vitória e derrota | Acertar encerra a partida como vitória; seis erros encerram a partida como derrota; partidas concluídas não aceitam novos palpites. |
| Desafio diário | A resposta é determinística para a data e a mudança de dia considera o fuso de São Paulo. |
| Modo prática | Uma resposta usada recentemente é evitada quando há outra disponível. |

## Resultado da última execução

Na execução de `npm test` em 28/10/2026, os **8 testes passaram**, sem falhas, cancelamentos ou testes ignorados.

## Verificações recomendadas fora da suíte atual

Os testes existentes focam nas regras de domínio. Para ampliar a cobertura, recomenda-se testar também:

- **Interface e fluxo completo:** digitar um palpite pela tela e pelo teclado físico, enviar, conferir as pistas e alternar entre desafio diário e prática.
- **Persistência:** atualizar a página durante uma partida e verificar a restauração do progresso; verificar também o comportamento quando o armazenamento está indisponível ou contém dados inválidos.
- **Acessibilidade:** navegar sem mouse, verificar a ordem e a visibilidade do foco e conferir as mensagens e pistas com leitor de tela.
- **Responsividade e compatibilidade:** testar em larguras de tela diferentes, dispositivos móveis e navegadores suportados.

Esses itens são recomendações; não fazem parte dos oito testes automatizados descritos acima.
