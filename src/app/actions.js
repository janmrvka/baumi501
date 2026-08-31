"use server";

import { nanoid } from "nanoid";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { games, players, turns } from "@/db/schema";

function requireDb() {
  if (!db) {
    throw new Error(
      "Databáze není nakonfigurována. Nastav DATABASE_URL v .env.local."
    );
  }
  return db;
}

// Persists a game (create or update) together with its full player + turn state.
// Called explicitly by the "Save game" button, and again when a game finishes.
export async function saveGame(gameId, name, gameState) {
  const db = requireDb();
  const id = gameId ?? nanoid(10);
  const now = new Date();

  const existing = await db.query.games.findFirst({
    where: eq(games.id, id),
  });

  if (existing) {
    await db
      .update(games)
      .set({
        name,
        status: gameState.status,
        activePlayerIndex: gameState.activePlayerIndex,
        round: gameState.round,
        winnerId: gameState.winnerId ?? null,
        updatedAt: now,
      })
      .where(eq(games.id, id));

    for (const player of gameState.players) {
      await db
        .update(players)
        .set({ score: player.score })
        .where(eq(players.id, player.id));
    }

    const existingTurns = await db.query.turns.findMany({
      where: eq(turns.gameId, id),
    });
    if (gameState.turns.length > existingTurns.length) {
      const newTurns = gameState.turns.slice(existingTurns.length);
      await db.insert(turns).values(
        newTurns.map((t) => ({
          gameId: id,
          playerId: t.playerId,
          amount: t.amount,
          resultingScore: t.resultingScore,
          wasBust: t.wasBust,
          round: t.round,
        }))
      );
    }
  } else {
    await db.insert(games).values({
      id,
      name,
      status: gameState.status,
      activePlayerIndex: gameState.activePlayerIndex,
      round: gameState.round,
      winnerId: gameState.winnerId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(players).values(
      gameState.players.map((p, i) => ({
        id: p.id,
        gameId: id,
        name: p.name,
        score: p.score,
        orderIndex: i,
      }))
    );

    if (gameState.turns.length > 0) {
      await db.insert(turns).values(
        gameState.turns.map((t) => ({
          gameId: id,
          playerId: t.playerId,
          amount: t.amount,
          resultingScore: t.resultingScore,
          wasBust: t.wasBust,
          round: t.round,
        }))
      );
    }
  }

  return { id };
}

export async function listSavedGames() {
  if (!db) return [];
  const rows = await db.query.games.findMany({
    orderBy: desc(games.updatedAt),
    with: {
      players: {
        orderBy: asc(players.orderIndex),
      },
    },
  });
  return rows;
}

export async function listFinishedGames() {
  if (!db) return [];
  const rows = await db.query.games.findMany({
    where: eq(games.status, "finished"),
    orderBy: desc(games.updatedAt),
    with: {
      players: {
        orderBy: asc(players.orderIndex),
      },
    },
  });
  return rows;
}

export async function loadGame(gameId) {
  if (!db) return null;
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      players: {
        orderBy: asc(players.orderIndex),
      },
      turns: {
        orderBy: asc(turns.id),
      },
    },
  });
  return game ?? null;
}

export async function deleteGame(gameId) {
  const db = requireDb();
  await db.delete(games).where(eq(games.id, gameId));
}
