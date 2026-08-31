import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trophy } from "lucide-react";
import { loadGame } from "@/app/actions";
import { cn } from "@/lib/utils";

export default async function VysledkyDetailPage({ params }) {
  const { id } = await params;
  const game = await loadGame(id).catch(() => null);

  if (!game || game.status !== "finished") {
    notFound();
  }

  const playerById = Object.fromEntries(game.players.map((p) => [p.id, p]));
  const winner = playerById[game.winnerId];

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/vysledky"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">{game.name}</h1>
          <span className="text-xs text-muted-foreground">
            {new Date(game.updatedAt).toLocaleString("cs-CZ")}
          </span>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-2">
        {game.players.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3",
              p.id === game.winnerId
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-1.5 font-medium">
              {p.id === game.winnerId && <Trophy className="size-4" />}
              {p.name}
            </span>
            <span className="font-bold tabular-nums">{p.score}</span>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Průběh hry
      </h2>
      <ol className="flex flex-col gap-1.5">
        {game.turns.map((turn, index) => {
          const player = playerById[turn.playerId];
          const isLast = index === game.turns.length - 1;
          return (
            <li
              key={turn.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
            >
              <span className="w-10 shrink-0 text-xs text-muted-foreground">
                K{turn.round}
              </span>
              <span className="flex-1 text-sm font-medium">{player?.name}</span>
              <span
                className={cn(
                  "text-base font-bold tabular-nums",
                  turn.wasBust ? "text-destructive" : "text-foreground"
                )}
              >
                {turn.amount}
              </span>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {turn.wasBust ? "BUST" : turn.resultingScore}
              </span>
              {isLast && !turn.wasBust && (
                <Trophy className="size-4 shrink-0 text-primary" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
