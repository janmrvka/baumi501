import { loadGame } from "@/app/actions";
import { GameClient } from "./game-client";

export default async function GamePage({ params }) {
  const { id } = await params;
  const record = await loadGame(id).catch(() => null);

  return <GameClient gameId={id} initialRecord={record} />;
}
