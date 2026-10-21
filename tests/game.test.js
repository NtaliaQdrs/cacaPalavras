import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCEPTED_WORDS,
  MAX_ATTEMPTS,
  PRACTICE_ANSWERS,
  addLetter,
  choosePracticeAnswer,
  createGame,
  evaluateGuess,
  getDailyAnswer,
  getLocalDateKey,
  isValidWordForm,
  normalizeWord,
  removeLetter,
  submitGuess,
  validateWordLists
} from "../src/game.js";

test("catálogo inicial possui palavras aceitas e respostas válidas sem colisões", () => {
  assert.equal(validateWordLists(ACCEPTED_WORDS, PRACTICE_ANSWERS), true);
  assert.equal(isValidWordForm("limão"), true);
  assert.equal(isValidWordForm("ação"), false);
  assert.equal(normalizeWord("ação"), "ACAO");
  assert.equal(normalizeWord("cafe\u0301s"), "CAFES");
  assert.throws(
    () => validateWordLists(["LIMÃO", "LIMAO"], ["LIMÃO"]),
    /duplicadas após normalização/
  );
});

test("avalia correspondências exatas antes de consumir letras repetidas", () => {
  assert.deepEqual(evaluateGuess("AMORA", "ARARA"), [
    "correct", "absent", "absent", "correct", "correct"
  ]);
  assert.deepEqual(evaluateGuess("AAAAA", "ARARA"), [
    "correct", "absent", "correct", "absent", "correct"
  ]);
  assert.deepEqual(evaluateGuess("BANCO", "BOLSA"), [
    "correct", "present", "absent", "absent", "present"
  ]);
});

test("acentos não alteram a comparação da resposta", () => {
  assert.deepEqual(evaluateGuess("LIMAO", "LIMÃO"), Array(5).fill("correct"));
});

test("entrada aceita letras, limita cinco posições e apaga uma posição", () => {
  let game = createGame({ id: "test", mode: "practice", answer: "PONTE" });
  game = addLetter(game, "á");
  game = addLetter(game, "b");
  assert.equal(game.currentInput, "AB");
  game = removeLetter(game);
  assert.equal(game.currentInput, "A");
  assert.equal(addLetter(game, "1"), game);
});

test("palpite incompleto ou inválido não consome tentativa", () => {
  let game = createGame({ id: "test", mode: "practice", answer: "PONTE" });
  let result = submitGuess(game, ACCEPTED_WORDS);
  assert.match(result.error, /cinco letras/);
  assert.equal(result.game.guesses.length, 0);

  game = { ...game, currentInput: "ZZZZZ" };
  result = submitGuess(game, ACCEPTED_WORDS);
  assert.match(result.error, /não reconhecida/);
  assert.equal(result.game.guesses.length, 0);
});

test("vitória e derrota terminam no limite de tentativas", () => {
  let game = createGame({ id: "win", mode: "practice", answer: "PONTE" });
  game = { ...game, currentInput: "PONTE" };
  let result = submitGuess(game, ACCEPTED_WORDS);
  assert.equal(result.game.status, "won");
  assert.equal(result.game.guesses.length, 1);
  assert.match(submitGuess(result.game, ACCEPTED_WORDS).error, /concluída/);

  game = createGame({ id: "loss", mode: "practice", answer: "PONTE" });
  for (const guess of ["AMORA", "AREIA", "BARCO", "BOLSA", "CAMPO", "CANTO"]) {
    game = { ...game, currentInput: guess };
    result = submitGuess(game, ACCEPTED_WORDS);
    game = result.game;
  }
  assert.equal(game.status, "lost");
  assert.equal(game.guesses.length, MAX_ATTEMPTS);
});

test("desafio é determinístico e a data usa o fuso de São Paulo", () => {
  const beforeMidnight = new Date("2026-10-21T02:30:00.000Z");
  const afterMidnight = new Date("2026-10-21T03:30:00.000Z");
  assert.equal(getLocalDateKey(beforeMidnight), "2026-10-20");
  assert.equal(getLocalDateKey(afterMidnight), "2026-10-21");
  assert.deepEqual(getDailyAnswer("2026-10-21"), getDailyAnswer("2026-10-21"));
});

test("prática evita repetir resposta recente se houver outra disponível", () => {
  const first = choosePracticeAnswer(["AMORA", "PONTE"], [], () => 0);
  const next = choosePracticeAnswer(["AMORA", "PONTE"], [first.id], () => 0);
  assert.notEqual(first.id, next.id);
  assert.equal(next.answer, "PONTE");
});
