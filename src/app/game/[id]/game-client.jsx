"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Undo2, Save, Trophy, Home, Volume2, RotateCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NumericKeypad } from "@/components/numeric-keypad";
import { applyTurn, undoLastTurn, canUndo } from "@/lib/game-engine";
import { storeLocalGame, readLocalGame, clearLocalGame } from "@/lib/local-game-store";
import { saveGame as saveGameAction } from "@/app/actions";
import { playFanfare } from "@/lib/fanfare";

// Rebuilds an in-memory GameState (with undo history) from a DB row loaded via loadGame().
function gameStateFromDbRecord(record) {
  const players = record.players.map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
  }));

  return {
    players,
    activePlayerIndex: record.activePlayerIndex,
    round: record.round,
    status: record.status,
    winnerId: record.winnerId ?? undefined,
    history: [],
    turns: record.turns.map((t) => ({
      playerId: t.playerId,
      amount: t.amount,
      resultingScore: t.resultingScore,
      wasBust: t.wasBust,
      round: t.round,
    })),
  };
}

const NOT_HYDRATED = Symbol("not-hydrated");

export function GameClient({ gameId, initialRecord }) {
  const router = useRouter();

  // sessionStorage is only readable client-side, so a not-yet-saved game is
  // hydrated after mount rather than during initial render (avoids SSR mismatch).
  // `session` bundles the three fields that hydrate together into one setState call.
  const [session, setSession] = useState(() =>
    initialRecord
      ? {
          name: initialRecord.name,
          gameState: gameStateFromDbRecord(initialRecord),
          persisted: true,
        }
      : NOT_HYDRATED
  );
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [flashBust, setFlashBust] = useState(false);

  useEffect(() => {
    if (initialRecord) return;
    const local = readLocalGame(gameId);
    if (local) {
      // Hydrating one-time from sessionStorage (a browser-only API unavailable
      // during SSR) on mount — the sanctioned exception to this rule.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession({ name: local.name, gameState: local.gameState, persisted: local.persisted });
    } else {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const gameName = session === NOT_HYDRATED ? "Šipky" : session.name;
  const gameState = session === NOT_HYDRATED ? null : session.gameState;
  const persisted = session === NOT_HYDRATED ? false : session.persisted;

  function setGameState(updater) {
    setSession((prev) => {
      if (prev === NOT_HYDRATED) return prev;
      const next = typeof updater === "function" ? updater(prev.gameState) : updater;
      return { ...prev, gameState: next };
    });
  }

  function setGameName(name) {
    setSession((prev) => (prev === NOT_HYDRATED ? prev : { ...prev, name }));
  }

  function setPersisted(value) {
    setSession((prev) => (prev === NOT_HYDRATED ? prev : { ...prev, persisted: value }));
  }

  useEffect(() => {
    if (gameState && !persisted) {
      storeLocalGame(gameId, { name: gameName, gameState, persisted: false });
    }
  }, [gameState, gameName, gameId, persisted]);

  const applyThrow = useCallback(
    (amount) => {
      if (!gameState) return;
      const before = gameState.players[gameState.activePlayerIndex];
      const wouldBust = amount > before.score || before.score - amount === 1;

      const next = applyTurn(gameState, amount);
      setGameState(next);
      setInput("");

      if (wouldBust) {
        setFlashBust(true);
        setTimeout(() => setFlashBust(false), 700);
        toast.error(`BUST! ${before.name} zůstává na ${before.score}`);
      } else if (next.status === "finished") {
        // Must fire synchronously inside this click handler — browsers block
        // AudioContext creation once it's deferred into a later render's effect.
        playFanfare();
      }
    },
    [gameState]
  );

  const confirmThrow = useCallback(() => {
    if (input === "") return;
    applyThrow(parseInt(input, 10));
  }, [input, applyThrow]);

  const handleQuickThrow = useCallback(
    (amount) => {
      applyThrow(amount);
    },
    [applyThrow]
  );

  const handleUndo = useCallback(() => {
    if (!gameState || !canUndo(gameState)) return;
    setGameState(undoLastTurn(gameState));
    setInput("");
  }, [gameState]);

  async function handleSave() {
    if (!gameState) return;
    setSaving(true);
    try {
      await saveGameAction(gameId, gameName, gameState);
      setPersisted(true);
      clearLocalGame(gameId);
      toast.success("Hra uložena");
    } catch (err) {
      console.error(err);
      toast.error("Uložení se nezdařilo");
    } finally {
      setSaving(false);
    }
  }

  // Always persist the final result once the game finishes, even if the
  // player never hit "Uložit hru" mid-game — the results listing should be
  // complete without requiring a manual save step.
  useEffect(() => {
    if (gameState?.status === "finished") {
      saveGameAction(gameId, gameName, gameState)
        .then(() => setPersisted(true))
        .catch((err) => console.error(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.status]);

  if (!gameState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Načítání…</p>
      </div>
    );
  }

  if (gameState.status === "finished") {
    const winner = gameState.players.find((p) => p.id === gameState.winnerId);
    return (
      <WinnerScreen
        gameName={gameName}
        winner={winner}
        players={gameState.players}
        onRematch={() => {
          const names = gameState.players.map((p) => p.name);
          router.push(`/?players=${encodeURIComponent(names.join(","))}`);
        }}
        onHome={() => router.push("/")}
      />
    );
  }

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  function handleDigit(d) {
    setInput((prev) => {
      if (prev.length >= 3) return prev;
      const next = prev === "0" ? d : prev + d;
      return next;
    });
  }

  function handleBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  return (
    <div
      className={cn(
        "flex h-dvh flex-col overflow-hidden transition-colors duration-300",
        flashBust && "bg-destructive/15"
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <button
          onClick={() => router.push("/")}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Domů"
        >
          <Home className="size-4" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold">{gameName}</span>
          <span className="text-[10px] text-muted-foreground">Kolo {gameState.round}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex size-8 items-center justify-center rounded-full hover:bg-muted",
            persisted ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Uložit hru"
        >
          <Save className="size-4" />
        </button>
      </header>

      <div className="flex max-h-[30dvh] shrink-0 flex-col gap-1.5 overflow-y-auto px-3 py-2">
        {gameState.players.map((player, index) => (
          <PlayerRow
            key={player.id}
            player={player}
            isActive={index === gameState.activePlayerIndex}
          />
        ))}
      </div>

      <div className="flex min-h-0 shrink-0 flex-1 flex-col justify-center gap-2 px-3 pb-3">
        <div className="flex shrink-0 items-center justify-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {activePlayer.name} hází
          </span>
          <span
            className={cn(
              "text-3xl font-black tabular-nums tracking-tight leading-none",
              input === "" && "text-muted-foreground/40"
            )}
          >
            {input === "" ? "0" : input}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo(gameState)}
            className="flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-undo/50 px-3 text-xs font-bold text-undo hover:bg-undo/10 disabled:pointer-events-none disabled:opacity-30"
          >
            <Undo2 className="size-3.5" />
            Zpět
          </button>
        </div>

        <div className="min-h-0 flex-1">
          <NumericKeypad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onConfirm={confirmThrow}
            onQuickThrow={handleQuickThrow}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, isActive }) {
  return (
    <motion.div
      layout
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-1.5 transition-colors",
        isActive
          ? "border-primary bg-primary/10"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-1.5">
        {isActive && (
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        )}
        <span className={cn("text-sm font-medium", isActive && "text-primary")}>
          {player.name}
        </span>
      </div>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={player.score}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "text-xl font-black tabular-nums",
            isActive ? "text-primary" : "text-foreground"
          )}
        >
          {player.score}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

function WinnerScreen({ gameName, winner, players, onRematch, onHome }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        >
          <Trophy className="size-20 text-primary drop-shadow-[0_0_20px_var(--color-primary)]" strokeWidth={1.5} />
        </motion.div>
        <span className="text-sm text-muted-foreground">{gameName}</span>
        <h1 className="text-4xl font-black">{winner?.name} vyhrává!</h1>
        <button
          type="button"
          onClick={playFanfare}
          className="flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          <Volume2 className="size-3.5" />
          Přehrát znělku
        </button>
      </motion.div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {players.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3",
              p.id === winner?.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            <span className="font-medium">{p.name}</span>
            <span className="font-bold tabular-nums">{p.score}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button size="lg" className="h-14 gap-2 text-base font-bold" onClick={onRematch}>
          <RotateCcw className="size-5" />
          Opakovat hru
        </Button>
        <Button variant="outline" size="lg" className="h-14 gap-2 text-base" onClick={onHome}>
          <Home className="size-5" />
          Zpět na start
        </Button>
        <Link
          href="/history"
          className="flex h-10 items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <History className="size-4" />
          Historie her
        </Link>
      </div>
    </div>
  );
}
