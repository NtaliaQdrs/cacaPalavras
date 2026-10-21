export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;
export const DAILY_TIME_ZONE = "America/Sao_Paulo";

export const CONTENT_VERSION = "2026.10.1";

export const PRACTICE_ANSWERS = [
  "AMORA", "AREIA", "BARCO", "BOLSA", "CAMPO", "CANTO", "CHUVA", "CLARO",
  "FOLHA", "FORTE", "LIMÃO", "LIVRO", "MELÃO", "MUNDO", "NUVEM", "PEDRA",
  "PONTE", "PORTA", "PRAIA", "SABER", "SONHO", "TEMPO", "VERDE", "VISTA"
];

export const ACCEPTED_WORDS = [
  ...PRACTICE_ANSWERS,
  "ABRIR", "ACASO", "ACENO", "ACESA", "ACIMA", "AGORA", "AINDA",
  "AJUDA", "ALADO", "ALBUM", "ALTAR", "AMADO", "AMIGA", "AMIGO",
  "ANDAR", "ANEXO", "ANJOS", "ANTES", "APELO", "APOIO", "AROMA",
  "ARTES", "ATRAS", "AUTOR", "AVIAO", "BAIXA", "BAIXO", "BANCO", "BANHO",
  "BARBA", "BARRA", "BEIJO", "BELOS", "BICHO", "BOATE", "BOLAS", "BOMBA",
  "BRACO", "BRASA", "BRAVO", "BREVE", "BRISA", "BROTO", "BUSCA", "CABER",
  "CABOS", "CACAU", "CALMA", "CALOR", "CAMAS", "CANAL", "CARAS", "CARNE",
  "CARRO", "CARTA", "CASAL", "CASAS", "CAUSA", "CEDRO", "CESTA", "CHAVE",
  "CHEIO", "CHORO", "CICLO", "CINCO", "CIRCO", "CITAR", "COBRA", "COISA",
  "CONTA", "CORAL", "CORPO", "CORTE", "COURO", "CRAVO", "CRIME", "CUIDA",
  "CURSO", "DANCA", "DENTE", "DESCE", "DISCO", "DOBRA", "DOIDO", "DOLAR",
  "DONOS", "DOUTA", "DUETO", "ECOAR", "EIXOS", "ELITE",
  "ENTRE", "ENVIO", "ERROS", "ESSAS", "ESTAR", "ETAPA", "FALHA", "FARDO",
  "FAVOR", "FAZEM", "FESTA", "FILHO", "FILME", "FINAL", "FIRME", "FOCOS",
  "FORMA", "FRASE", "FREIO", "FRUTA", "FUNDO", "GANHO", "GARFO", "GATOS",
  "GENTE", "GIRAR", "GLOBO", "GOSTO", "GRAMA", "GRAVE", "GRUPO", "HASTE",
  "HOMEM", "HONRA", "IDEAL", "IGUAL", "IMPAR", "INDIO", "IRMAO", "JOVEM",
  "JULHO", "JUNHO", "LADOS", "LAGOA", "LARGO", "LEITE", "LETRA", "LIMPO",
  "LINDA", "LINHO", "LISTA", "LIVRE", "LONGE", "LOUCO", "LUGAR", "LUNAR",
  "MACIO", "MAGIA", "MAIOR", "MALHA", "MANHA", "MARCA", "MARIA", "MASSA",
  "MATAR", "MEDOS", "MENOR", "METAL", "MILHO", "MINHA", "MISSA", "MISTO",
  "MODOS", "MORAL", "MORRO", "MOTOR", "MUDAR", "MURAL", "NATAL", "NAVIO",
  "NEGRO", "NENEM", "NIVEL", "NOITE", "NORMA", "NORTE", "NOTAS", "OBRAS",
  "OLHAR", "ONTEM", "ORDEM", "OUTRA", "PADRE", "PAGAR", "PALCO", "PALHA",
  "PAPEL", "PARTE", "PASSO", "PASTA", "PAUSA", "PEIXE", "PERTO", "PESCA",
  "PINTA", "PODER", "POEMA", "POETA", "PONTO", "POUCA", "POUCO", "PRATO",
  "PRESA", "PRESO", "PRETO", "PRIMO", "PROSA", "QUASE", "QUEDA", "RAIVA",
  "RAMOS", "RAPAZ", "RAZÃO", "REINO", "RELVA", "RESTO", "RISCO", "RITMO",
  "ROUPA", "RUMOR", "SABÃO", "SABIA", "SABOR", "SAIDA", "SALTO", "SAUDE",
  "SEGUE", "SENHA", "SENSO", "SENTO", "SERIO", "SERVE", "SIGLA", "SINAL",
  "SITIO", "SOBRE", "SOLTO", "SORTE", "SUBIR", "SUAVE", "TARDE", "TAXAS",
  "TECER", "TELHA", "TENDO", "TERMO", "TERRA", "TEXTO", "TIGRE", "TINTA",
  "TODOS", "TORRE", "TRAMA", "TREVO", "TROCA", "TURMA", "UNIAO", "UNICO",
  "USADO", "VALOR", "VAPOR", "VASTO", "VELHO", "VENDA", "VENTO", "VERAO",
  "VIGOR", "VINHO", "VIRAR", "VIRUS", "VIVER", "VOZES", "ZEBRA", "ZELAR"
];

export function normalizeWord(value) {
  return String(value)
    .toLocaleUpperCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function isValidWordForm(value) {
  const normalized = normalizeWord(value);
  return normalized.length === WORD_LENGTH && /^[A-Z]+$/.test(normalized);
}

export function validateWordLists(acceptedWords, answers) {
  const accepted = new Set();
  for (const word of acceptedWords) {
    if (!isValidWordForm(word)) {
      throw new Error(`Palavra aceita inválida: ${word}`);
    }
    const key = normalizeWord(word);
    if (accepted.has(key)) {
      throw new Error(`Palavras aceitas duplicadas após normalização: ${word}`);
    }
    accepted.add(key);
  }

  const answerKeys = new Set();
  for (const answer of answers) {
    if (!isValidWordForm(answer)) {
      throw new Error(`Resposta inválida: ${answer}`);
    }
    const key = normalizeWord(answer);
    if (!accepted.has(key)) {
      throw new Error(`Resposta não consta na lista de palpites: ${answer}`);
    }
    if (answerKeys.has(key)) {
      throw new Error(`Respostas duplicadas após normalização: ${answer}`);
    }
    answerKeys.add(key);
  }
  return true;
}

export function evaluateGuess(guess, answer) {
  const normalizedGuess = normalizeWord(guess);
  const normalizedAnswer = normalizeWord(answer);
  if (!isValidWordForm(normalizedGuess) || !isValidWordForm(normalizedAnswer)) {
    throw new Error("Palpite e resposta precisam ter cinco letras válidas.");
  }

  const marks = Array(WORD_LENGTH).fill("absent");
  const remaining = new Map();

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (normalizedGuess[index] === normalizedAnswer[index]) {
      marks[index] = "correct";
    } else {
      const letter = normalizedAnswer[index];
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (marks[index] === "correct") continue;
    const letter = normalizedGuess[index];
    const count = remaining.get(letter) ?? 0;
    if (count > 0) {
      marks[index] = "present";
      remaining.set(letter, count - 1);
    }
  }
  return marks;
}

export function getLocalDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const EPOCH_DATE = "2026-01-01";

export function getDailyAnswer(dateKey, answers = PRACTICE_ANSWERS) {
  const parsed = new Date(`${dateKey}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || Number.isNaN(parsed.getTime())) {
    throw new Error(`Data diária inválida: ${dateKey}`);
  }
  const normalizedDate = parsed.toISOString().slice(0, 10);
  if (normalizedDate !== dateKey || answers.length === 0) {
    throw new Error(`Não há catálogo diário válido para ${dateKey}.`);
  }
  const offset = Math.floor((parsed.getTime() - Date.parse(`${EPOCH_DATE}T12:00:00Z`)) / 86_400_000);
  const index = ((offset % answers.length) + answers.length) % answers.length;
  return { id: `daily:${dateKey}`, answer: answers[index] };
}

export function createGame({ id, mode, answer, puzzleId = id }) {
  return {
    id,
    mode,
    puzzleId,
    answer,
    guesses: [],
    currentInput: "",
    status: "playing"
  };
}

export function addLetter(game, letter) {
  const normalized = normalizeWord(letter);
  if (game.status !== "playing" || !/^[A-Z]$/.test(normalized) ||
      game.currentInput.length >= WORD_LENGTH) {
    return game;
  }
  return { ...game, currentInput: game.currentInput + normalized };
}

export function removeLetter(game) {
  if (game.status !== "playing" || game.currentInput.length === 0) return game;
  return { ...game, currentInput: game.currentInput.slice(0, -1) };
}

export function submitGuess(game, acceptedWords) {
  if (game.status !== "playing") {
    return { game, error: "Esta partida já foi concluída." };
  }
  if (game.currentInput.length !== WORD_LENGTH) {
    return { game, error: "Digite cinco letras antes de enviar." };
  }
  const guess = normalizeWord(game.currentInput);
  const accepted = new Set(acceptedWords.map(normalizeWord));
  if (!accepted.has(guess)) {
    return { game, error: "Palavra não reconhecida. Tente outra palavra de cinco letras." };
  }

  const marks = evaluateGuess(guess, game.answer);
  const guesses = [...game.guesses, { word: game.currentInput, marks }];
  const won = marks.every((mark) => mark === "correct");
  const status = won ? "won" : guesses.length === MAX_ATTEMPTS ? "lost" : "playing";
  return {
    game: { ...game, guesses, currentInput: "", status },
    error: null
  };
}

export function choosePracticeAnswer(answers, recentIds, random = Math.random) {
  if (answers.length === 0) throw new Error("Não há respostas de prática disponíveis.");
  const eligible = answers.filter((_, index) => !recentIds.includes(`practice:${index}`));
  const candidates = eligible.length > 0 ? eligible : answers;
  const chosen = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  const answer = candidates[chosen];
  const index = answers.indexOf(answer);
  return { id: `practice:${index}`, answer };
}

export function makeInitialSnapshot(dateKey, dailyAnswer) {
  return {
    schemaVersion: 1,
    contentVersion: CONTENT_VERSION,
    activeMode: "daily",
    daily: {
      date: dateKey,
      game: createGame({
        id: `daily:${dateKey}`,
        mode: "daily",
        puzzleId: `daily:${dateKey}`,
        answer: dailyAnswer
      })
    },
    practice: { game: null, recentIds: [] },
    statistics: {
      daily: { played: 0, won: 0, winsByAttempts: Array(MAX_ATTEMPTS).fill(0) },
      practice: { played: 0, won: 0, winsByAttempts: Array(MAX_ATTEMPTS).fill(0) }
    }
  };
}
