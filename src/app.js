import {
  ACCEPTED_WORDS,
  CONTENT_VERSION,
  MAX_ATTEMPTS,
  PRACTICE_ANSWERS,
  addLetter,
  choosePracticeAnswer,
  createGame,
  getDailyAnswer,
  getLocalDateKey,
  makeInitialSnapshot,
  normalizeWord,
  removeLetter,
  submitGuess,
  validateWordLists
} from "./game.js";

const STORAGE_KEY = "palavra-por-palavra:v1";
const $ = (selector) => document.querySelector(selector);
const boardBody = $("#board-body");
const keyboard = $("#virtual-keyboard");
const liveStatus = $("#live-status");
const storageWarning = $("#storage-warning");
const recoverButton = $("#recover-storage");

validateWordLists(ACCEPTED_WORDS, PRACTICE_ANSWERS);

let today = getLocalDateKey();
let daily = getDailyAnswer(today);
let persistenceEnabled = true;
let corruptedStorage = false;
let storageMessage = "";
let state = makeInitialSnapshot(today, daily.answer);

function isIntegerAtLeastZero(value) {
  return Number.isInteger(value) && value >= 0;
}

function isValidGame(game, mode, todayKey) {
  if (game === null) return mode === "practice";
  return Boolean(
    game &&
    typeof game === "object" &&
    game.mode === mode &&
    typeof game.id === "string" &&
    typeof game.answer === "string" &&
    PRACTICE_ANSWERS.some((answer) => normalizeWord(answer) === normalizeWord(game.answer)) &&
    Array.isArray(game.guesses) &&
    game.guesses.length <= MAX_ATTEMPTS &&
    game.guesses.every((guess) =>
      guess &&
      typeof guess.word === "string" &&
      ACCEPTED_WORDS.some((word) => normalizeWord(word) === normalizeWord(guess.word)) &&
      Array.isArray(guess.marks) &&
      guess.marks.length === 5 &&
      guess.marks.every((mark) => ["correct", "present", "absent"].includes(mark))
    ) &&
    typeof game.currentInput === "string" &&
    game.currentInput.length <= 5 &&
    ["playing", "won", "lost"].includes(game.status) &&
    (mode !== "daily" || (
      game.id === `daily:${todayKey}` &&
      (todayKey !== today || normalizeWord(game.answer) === normalizeWord(daily.answer))
    ))
  );
}

function isValidSnapshot(value) {
  if (!value || value.schemaVersion !== 1 || typeof value.contentVersion !== "string" ||
      !["daily", "practice"].includes(value.activeMode) ||
      !value.daily || !value.practice || !value.statistics) return false;
  if (typeof value.daily.date !== "string" ||
      !isValidGame(value.daily.game, "daily", value.daily.date) ||
      !isValidGame(value.practice.game, "practice", today)) return false;
  if (!Array.isArray(value.practice.recentIds) ||
      !value.practice.recentIds.every((id) => typeof id === "string")) return false;
  return ["daily", "practice"].every((mode) => {
    const stats = value.statistics[mode];
    return stats &&
      isIntegerAtLeastZero(stats.played) &&
      isIntegerAtLeastZero(stats.won) &&
      stats.won <= stats.played &&
      Array.isArray(stats.winsByAttempts) &&
      stats.winsByAttempts.length === MAX_ATTEMPTS &&
      stats.winsByAttempts.every(isIntegerAtLeastZero);
  });
}

function loadSnapshot() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    persistenceEnabled = false;
    storageMessage = "O armazenamento deste navegador está indisponível. Esta sessão pode não ser salva.";
    console.error("Não foi possível ler o progresso local.", error);
    return;
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) throw new Error("Formato de progresso incompatível ou inválido.");
    state = parsed;
    if (state.daily.date !== today) {
      state.daily = { date: today, game: createGame({
        id: daily.id,
        mode: "daily",
        puzzleId: daily.id,
        answer: daily.answer
      }) };
    }
  } catch (error) {
    corruptedStorage = true;
    persistenceEnabled = false;
    storageMessage = "O progresso local não pôde ser restaurado. Ele não será substituído sem sua confirmação.";
    console.error("Falha ao restaurar o progresso local.", error);
  }
}

function saveSnapshot() {
  if (!persistenceEnabled) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    persistenceEnabled = false;
    storageMessage = "Não foi possível salvar neste navegador. O jogo continua nesta sessão, mas o progresso pode ser perdido.";
    console.error("Não foi possível salvar o progresso local.", error);
  }
  renderStorageWarning();
}

function renderStorageWarning() {
  storageWarning.hidden = !storageMessage;
  storageWarning.textContent = storageMessage;
  recoverButton.hidden = !corruptedStorage;
}

function activeGame() {
  return state.activeMode === "daily" ? state.daily.game : state.practice.game;
}

function setActiveGame(game) {
  if (state.activeMode === "daily") state.daily.game = game;
  else state.practice.game = game;
}

function announce(message) {
  liveStatus.textContent = "";
  window.requestAnimationFrame(() => { liveStatus.textContent = message; });
}

const statusNames = {
  correct: "correta nesta posição",
  present: "presente em outra posição",
  absent: "ausente da resposta"
};
const statusMarks = { correct: "✓ Certa", present: "↔ Outra", absent: "× Ausente" };

function renderBoard(game) {
  boardBody.replaceChildren();
  for (let rowIndex = 0; rowIndex < MAX_ATTEMPTS; rowIndex += 1) {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = `${rowIndex + 1}ª`;
    row.append(heading);

    for (let column = 0; column < 5; column += 1) {
      const cell = document.createElement("td");
      const letter = document.createElement("span");
      letter.className = "letter";
      const marker = document.createElement("span");
      marker.className = "tile-status";
      const guess = game.guesses[rowIndex];
      const active = rowIndex === game.guesses.length && game.status === "playing";
      const character = guess?.word[column] ?? (active ? game.currentInput[column] : "");
      letter.textContent = character || (game.status === "playing" && rowIndex === game.guesses.length ? "" : "·");

      if (guess) {
        const mark = guess.marks[column];
        cell.classList.add(mark);
        marker.textContent = statusMarks[mark];
        cell.setAttribute("aria-label", `${character}, ${statusNames[mark]}`);
      } else if (!active) {
        cell.classList.add("empty-cell");
        marker.setAttribute("aria-hidden", "true");
        cell.setAttribute("aria-label", `Tentativa ${rowIndex + 1}, posição ${column + 1}, vazia`);
      } else {
        cell.setAttribute("aria-label", character
          ? `Tentativa ${rowIndex + 1}, posição ${column + 1}: ${character}`
          : `Tentativa ${rowIndex + 1}, posição ${column + 1}, vazia`);
      }
      cell.append(letter, marker);
      row.append(cell);
    }
    boardBody.append(row);
  }

  const count = game.guesses.length;
  $("#attempt-count").textContent = game.status === "playing"
    ? `Tentativa ${count + 1} de ${MAX_ATTEMPTS}`
    : `Partida encerrada · ${count} ${count === 1 ? "palpite" : "palpites"}`;
  $("#board-caption").textContent = `Tabuleiro com seis tentativas de cinco letras. ${count} tentativas usadas.`;
}

function renderKeyboard(game) {
  keyboard.replaceChildren();
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const keyState = new Map();
  for (const guess of game.guesses) {
    for (let index = 0; index < guess.word.length; index += 1) {
      const letter = normalizeWord(guess.word[index]);
      const next = guess.marks[index];
      const previous = keyState.get(letter);
      if (next === "correct" || (next === "present" && previous !== "correct") || !previous) {
        keyState.set(letter, next);
      }
    }
  }

  const addKey = (label, action, className = "", ariaLabel = label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `keyboard-key ${className}`.trim();
    button.dataset.action = action;
    button.dataset.letter = label;
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.disabled = game.status !== "playing";
    keyboard.append(button);
  };

  for (const rowLetters of rows) {
    const row = document.createElement("div");
    row.className = "keyboard-row";
    if (rowLetters === "ZXCVBNM") {
      const submit = document.createElement("button");
      submit.type = "button";
      submit.className = "keyboard-key wide";
      submit.dataset.action = "submit";
      submit.textContent = "Enviar";
      submit.setAttribute("aria-label", "Enviar palpite");
      submit.disabled = game.status !== "playing";
      row.append(submit);
    }
    for (const letter of rowLetters) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `keyboard-key ${keyState.get(letter) ?? ""}`.trim();
      button.dataset.action = "letter";
      button.dataset.letter = letter;
      button.textContent = letter;
      const mark = keyState.get(letter);
      button.setAttribute("aria-label", mark
        ? `Letra ${letter}, ${statusNames[mark]}`
        : `Letra ${letter}`);
      button.disabled = game.status !== "playing";
      row.append(button);
    }
    if (rowLetters === "ZXCVBNM") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "keyboard-key wide";
      remove.dataset.action = "remove";
      remove.textContent = "Apagar";
      remove.setAttribute("aria-label", "Apagar última letra");
      remove.disabled = game.status !== "playing";
      row.append(remove);
    }
    keyboard.append(row);
  }
}

function renderStats() {
  const stats = state.statistics[state.activeMode];
  $("#stats-title").textContent = state.activeMode === "daily"
    ? "Estatísticas do desafio"
    : "Estatísticas da prática";
  $("#stat-played").textContent = String(stats.played);
  $("#stat-won").textContent = String(stats.won);
  $("#stat-rate").textContent = stats.played ? `${Math.round(stats.won / stats.played * 100)}%` : "—";
  const list = $("#win-distribution");
  list.replaceChildren();
  const max = Math.max(1, ...stats.winsByAttempts);
  stats.winsByAttempts.forEach((wins, index) => {
    const item = document.createElement("li");
    const attempt = document.createElement("span");
    attempt.textContent = String(index + 1);
    const track = document.createElement("span");
    track.className = "bar-track";
    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = `${wins / max * 100}%`;
    track.append(fill);
    const value = document.createElement("span");
    value.textContent = String(wins);
    item.append(attempt, track, value);
    list.append(item);
  });
}

function renderStatus(game) {
  const won = game.status === "won";
  const lost = game.status === "lost";
  $("#status-pill").textContent = won ? "Você descobriu!" : lost ? "Fim de jogo" : "Sua vez";
  $("#status-title").textContent = won ? "Boa descoberta!" : lost ? "A próxima é sua." : "Vamos jogar?";
  $("#status-copy").textContent = won
    ? `Resposta correta em ${game.guesses.length} de ${MAX_ATTEMPTS} tentativas.`
    : lost
      ? `Você usou as ${MAX_ATTEMPTS} tentativas. Veja a resposta e tente outra partida de prática.`
      : "Digite uma palavra de cinco letras para começar.";
  const answer = $("#answer");
  answer.hidden = !won && !lost;
  answer.textContent = won || lost ? `A palavra era ${game.answer}.` : "";
}

function render() {
  const game = activeGame();
  $("#daily-mode").setAttribute("aria-pressed", String(state.activeMode === "daily"));
  $("#practice-mode").setAttribute("aria-pressed", String(state.activeMode === "practice"));
  $("#mode-title").textContent = state.activeMode === "daily"
    ? `Desafio diário · ${today}`
    : "Modo prática";
  $("#mode-detail").textContent = state.activeMode === "daily"
    ? "A mesma palavra para todo mundo nesta data."
    : "Partidas ilimitadas, separadas do desafio diário.";
  renderBoard(game);
  renderKeyboard(game);
  renderStatus(game);
  renderStats();
  renderStorageWarning();
}

function refreshDailyPuzzle() {
  const currentDate = getLocalDateKey();
  if (currentDate === today) return false;

  today = currentDate;
  daily = getDailyAnswer(today);
  state.daily = {
    date: today,
    game: createGame({
      id: daily.id,
      mode: "daily",
      puzzleId: daily.id,
      answer: daily.answer
    })
  };
  saveSnapshot();
  render();
  if (state.activeMode === "daily") announce("O desafio diário de hoje está disponível.");
  return true;
}

function commitGame(nextGame, message) {
  const focusedKey = keyboard.contains(document.activeElement)
    ? {
        action: document.activeElement.dataset.action,
        letter: document.activeElement.dataset.letter
      }
    : null;
  setActiveGame(nextGame);
  saveSnapshot();
  render();
  if (focusedKey) {
    const nextFocus = Array.from(keyboard.querySelectorAll("button")).find((button) =>
      button.dataset.action === focusedKey.action &&
      button.dataset.letter === focusedKey.letter
    );
    nextFocus?.focus();
  }
  if (message) announce(message);
}

function updateStatistics(game) {
  const stats = state.statistics[game.mode];
  stats.played += 1;
  if (game.status === "won") {
    stats.won += 1;
    stats.winsByAttempts[game.guesses.length - 1] += 1;
  }
}

function sendGuess() {
  const game = activeGame();
  const result = submitGuess(game, ACCEPTED_WORDS);
  if (result.error) {
    announce(result.error);
    return;
  }
  if (result.game.status !== "playing") updateStatistics(result.game);
  const lastGuess = result.game.guesses.at(-1);
  const spokenMarks = lastGuess.marks.map((mark, index) =>
    `${lastGuess.word[index]}, ${statusNames[mark]}`
  ).join("; ");
  const outcome = result.game.status === "won"
    ? `Você descobriu ${result.game.answer} em ${result.game.guesses.length} tentativas.`
    : result.game.status === "lost"
      ? `Fim de jogo. A resposta era ${result.game.answer}.`
      : `Tentativa ${result.game.guesses.length} de ${MAX_ATTEMPTS}. ${spokenMarks}.`;
  commitGame(result.game, `Palpite ${result.game.guesses.length}: ${spokenMarks}. ${outcome}`);
}

function setMode(mode) {
  state.activeMode = mode;
  if (mode === "practice" && !state.practice.game) startPractice(false);
  saveSnapshot();
  render();
}

function randomValue() {
  if (!globalThis.crypto?.getRandomValues) return Math.random();
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

function startPractice(confirmReplace = true) {
  const previous = state.practice.game;
  if (confirmReplace && previous?.status === "playing" &&
      (previous.guesses.length > 0 || previous.currentInput) &&
      !window.confirm("A partida de prática em andamento será substituída. Deseja continuar?")) {
    return false;
  }
  const puzzle = choosePracticeAnswer(PRACTICE_ANSWERS, state.practice.recentIds, randomValue);
  state.practice.recentIds = [...state.practice.recentIds, puzzle.id].slice(-PRACTICE_ANSWERS.length);
  state.practice.game = createGame({
    id: puzzle.id,
    mode: "practice",
    puzzleId: puzzle.id,
    answer: puzzle.answer
  });
  state.activeMode = "practice";
  saveSnapshot();
  render();
  announce("Nova partida de prática iniciada.");
  return true;
}

loadSnapshot();
if (!corruptedStorage) saveSnapshot();
render();

keyboard.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  if (button.dataset.action === "letter") {
    commitGame(addLetter(activeGame(), button.dataset.letter));
  } else if (button.dataset.action === "remove") {
    commitGame(removeLetter(activeGame()));
  } else if (button.dataset.action === "submit") {
    sendGuess();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
  const target = event.target;
  if (target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "A"].includes(target.tagName))) return;
  if (event.key === "Backspace") {
    event.preventDefault();
    commitGame(removeLetter(activeGame()));
  } else if (event.key === "Enter") {
    if (target instanceof HTMLButtonElement) return;
    event.preventDefault();
    sendGuess();
  } else if (/^[a-zA-ZÀ-ÿ]$/.test(event.key)) {
    const letter = normalizeWord(event.key);
    if (/^[A-Z]$/.test(letter)) {
      event.preventDefault();
      commitGame(addLetter(activeGame(), letter));
    }
  }
});

window.setInterval(refreshDailyPuzzle, 30_000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshDailyPuzzle();
});

$("#daily-mode").addEventListener("click", () => setMode("daily"));
$("#practice-mode").addEventListener("click", () => setMode("practice"));
$("#new-practice").addEventListener("click", () => startPractice(true));
recoverButton.addEventListener("click", () => {
  const confirmed = window.confirm("Apagar o progresso local inválido e iniciar um novo? Esta ação não pode ser desfeita.");
  if (!confirmed) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    state = makeInitialSnapshot(today, daily.answer);
    persistenceEnabled = true;
    corruptedStorage = false;
    storageMessage = "";
    saveSnapshot();
    render();
    announce("Progresso local reiniciado.");
  } catch (error) {
    persistenceEnabled = false;
    storageMessage = "Não foi possível limpar os dados locais neste navegador.";
    console.error("Falha ao limpar o progresso local.", error);
    renderStorageWarning();
  }
});
