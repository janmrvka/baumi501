"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Plus, X, History, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGameState, createPlayer } from "@/lib/game-engine";
import { storeLocalGame } from "@/lib/local-game-store";

export default function Home() {
  const router = useRouter();
  const [gameName, setGameName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", ""]);

  function updatePlayerName(index, value) {
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addPlayerField() {
    setPlayerNames((prev) => [...prev, ""]);
  }

  function removePlayerField(index) {
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  }

  function startGame() {
    const names = playerNames.map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;

    const players = names.map((name) => createPlayer(nanoid(8), name));
    const gameState = createGameState(players);
    const id = nanoid(10);
    const name = gameName.trim() || "Šipky " + new Date().toLocaleDateString("cs-CZ");

    storeLocalGame(id, { name, gameState, persisted: false });
    router.push(`/game/${id}`);
  }

  const canStart = playerNames.some((n) => n.trim().length > 0);

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
            {playerNames.map((name, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Hráč ${index + 1}`}
                  value={name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  className="h-12 text-base"
                  autoFocus={index === 0}
                />
                {playerNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlayerField(index)}
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
