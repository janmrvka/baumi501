import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const games = pgTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("playing"), // "playing" | "finished"
  activePlayerIndex: integer("active_player_index").notNull().default(0),
  round: integer("round").notNull().default(1),
  winnerId: text("winner_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  score: integer("score").notNull().default(501),
  orderIndex: integer("order_index").notNull(),
});

export const turns = pgTable("turns", {
  id: serial("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  playerId: text("player_id").notNull(),
  amount: integer("amount").notNull(),
  resultingScore: integer("resulting_score").notNull(),
  wasBust: boolean("was_bust").notNull().default(false),
  round: integer("round").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
  turns: many(turns),
}));

export const playersRelations = relations(players, ({ one }) => ({
  game: one(games, { fields: [players.gameId], references: [games.id] }),
}));

export const turnsRelations = relations(turns, ({ one }) => ({
  game: one(games, { fields: [turns.gameId], references: [games.id] }),
}));
