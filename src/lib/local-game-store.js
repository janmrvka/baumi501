"use client";

// Sessionless local persistence for an in-progress, not-yet-saved game.
// Keyed by game id so a page reload on /game/[id] doesn't lose state before the user hits Save.

const PREFIX = "baumi501:game:";

export function storeLocalGame(id, payload) {
  try {
    sessionStorage.setItem(PREFIX + id, JSON.stringify(payload));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function readLocalGame(id) {
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLocalGame(id) {
  try {
    sessionStorage.removeItem(PREFIX + id);
  } catch {
    // ignore
  }
}
