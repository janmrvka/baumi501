import Link from "next/link";
import { ChevronLeft, Trophy, Users } from "lucide-react";
import { listFinishedGames } from "@/app/actions";

export default async function VysledkyPage() {
  const games = await listFinishedGames().catch(() => []);

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Výsledková listina</h1>
      </header>

      {games.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p>Zatím žádné dohrané hry.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/vysledky/${game.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 hover:border-primary/50"
            >
              <span className="font-semibold">{game.name}</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {game.players.map((p) => (
                  <span
                    key={p.id}
                    className={
                      p.id === game.winnerId
                        ? "flex items-center gap-1 font-medium text-primary"
                        : ""
                    }
                  >
                    {p.id === game.winnerId && <Trophy className="size-3.5" />}
                    {p.name} ({p.score})
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(game.updatedAt).toLocaleString("cs-CZ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
