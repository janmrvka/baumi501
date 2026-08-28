// Pure game logic for 501 Double Out. No React, no DB — just state transitions.
// A "turn" is a single player's total throw for their turn (not individual darts).

export const STARTING_SCORE = 501;

export function createPlayer(id, name) {
  return { id, name, score: STARTING_SCORE };
}

export function createGameState(players) {
  return {
    players,
    activePlayerIndex: 0,
    round: 1,
    status: "playing",
    winnerId: undefined,
    history: [], // snapshots for undo, most recent last
    turns: [], // full log: { playerId, amount, resultingScore, wasBust, round }
  };
}

function snapshot(state) {
  const { history, turns, ...rest } = state;
  return {
    ...rest,
    players: state.players.map((p) => ({ ...p })),
  };
}

// Applies a total throw amount for the current active player.
export function applyTurn(state, amount) {
  if (state.status !== "playing") return state;

  const prevSnapshot = snapshot(state);
  const activeIndex = state.activePlayerIndex;
  const active = state.players[activeIndex];
  const remaining = active.score - amount;

  const wasBust = remaining < 0 || remaining === 1;
  const resultingScore = wasBust ? active.score : remaining;

  const nextPlayers = state.players.map((p, i) =>
    i === activeIndex ? { ...p, score: resultingScore } : p
  );

  const turnRecord = {
    playerId: active.id,
    amount,
    resultingScore,
    wasBust,
    round: state.round,
  };

  const isWin = !wasBust && remaining === 0;

  if (isWin) {
    return {
      ...state,
      players: nextPlayers,
      status: "finished",
      winnerId: active.id,
      history: [...state.history, prevSnapshot],
      turns: [...state.turns, turnRecord],
    };
  }

  const isLastPlayer = activeIndex === state.players.length - 1;
  const nextActiveIndex = isLastPlayer ? 0 : activeIndex + 1;
  const nextRound = isLastPlayer ? state.round + 1 : state.round;

  return {
    ...state,
    players: nextPlayers,
    activePlayerIndex: nextActiveIndex,
    round: nextRound,
    history: [...state.history, prevSnapshot],
    turns: [...state.turns, turnRecord],
  };
}

// Reverts the last confirmed turn, restoring score, active player, and round.
export function undoLastTurn(state) {
  if (state.history.length === 0) return state;

  const lastSnapshot = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);
  const newTurns = state.turns.slice(0, -1);

  return {
    ...lastSnapshot,
    players: lastSnapshot.players.map((p) => ({ ...p })),
    history: newHistory,
    turns: newTurns,
  };
}

export function canUndo(state) {
  return state.history.length > 0;
}
