"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import { Plus, X, History, Trophy, Target, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGameState, createPlayer } from "@/lib/game-engine";
import { storeLocalGame } from "@/lib/local-game-store";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rematchPlayers = searchParams.get("players");

  const [gameName, setGameName] = useState("");
  const [playerFields, setPlayerFields] = useState(() => {
    const names = rematchPlayers ? rematchPlayers.split(",") : ["", ""];
    return names.map((name) => ({ id: nanoid(6), name }));
  });

  function updatePlayerName(id, value) {
    setPlayerFields((prev) => prev.map((f) => (f.id === id ? { ...f, name: value } : f)));
  }

  function addPlayerField() {
    setPlayerFields((prev) => [...prev, { id: nanoid(6), name: "" }]);
  }

  function removePlayerField(id) {
    setPlayerFields((prev) => prev.filter((f) => f.id !== id));
  }

  function movePlayer(index, direction) {
    setPlayerFields((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function startGame() {
    const names = playerFields.map((f) => f.name.trim()).filter(Boolean);
    if (names.length === 0) return;

    const players = names.map((name) => createPlayer(nanoid(8), name));
    const gameState = createGameState(players);
    const id = nanoid(10);
    const name = gameName.trim() || "Šipky " + new Date().toLocaleDateString("cs-CZ");

    storeLocalGame(id, { name, gameState, persisted: false });
    router.push(`/game/${id}`);
  }

  const canStart = playerFields.some((f) => f.name.trim().length > 0);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Target className="size-8 text-primary" strokeWidth={2.5} />
            <h1 className="text-3xl font-black tracking-tight">Baumi501</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            501 Double Out &mdash; rychlá výsledková tabule
          </p>
        </header>

        <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-5 shadow-lg">
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-name">Název hry</Label>
            <Input
              id="game-name"
              placeholder="např. Pátek v hospodě"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>Hráči</Label>
            {playerFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => movePlayer(index, -1)}
                    disabled={index === 0}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-20"
                    aria-label="Posunout nahoru"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlayer(index, 1)}
                    disabled={index === playerFields.length - 1}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-20"
                    aria-label="Posunout dolů"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
                <Input
                  placeholder={`Hráč ${index + 1}`}
                  value={field.name}
                  onChange={(e) => updatePlayerName(field.id, e.target.value)}
                  className="h-12 text-base"
                  autoFocus={index === 0 && !rematchPlayers}
                />
                {playerFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlayerField(field.id)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Odebrat hráče"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPlayerField}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus className="size-4" />
              Přidat hráče
            </button>
          </div>

          <Button
            size="lg"
            className="h-14 text-lg font-bold"
            disabled={!canStart}
            onClick={startGame}
          >
            Spustit hru
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="h-12 w-full gap-2 text-muted-foreground"
            onClick={() => router.push("/vysledky")}
          >
            <Trophy className="size-5" />
            Výsledková listina
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full gap-2 text-muted-foreground"
            onClick={() => router.push("/history")}
          >
            <History className="size-5" />
            Uložené hry
          </Button>
        </div>
      </div>
    </div>
  );
}
