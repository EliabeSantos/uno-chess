"use client";

import { GameState } from "@/types/game";

import { canMakeMove, countKings, getRemainingMoves } from "@/game/gameState";

interface GameUIProps {
  game: GameState;
  onEndTurn: () => void;
}

export default function GameUI({ game, onEndTurn }: GameUIProps) {
  const playerName = game.currentPlayer === "white" ? "BRANCAS" : "PRETAS";

  const remainingMoves = getRemainingMoves(game);

  const turnFinished = !canMakeMove(game);

  const whiteKings = countKings(game, "white");

  const blackKings = countKings(game, "black");

  if (game.gameOver) {
    const winnerName = game.winner === "white" ? "BRANCAS" : "PRETAS";

    return (
      <aside className="flex w-full flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-white">
        <div className="text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-zinc-500">
            FIM DE JOGO
          </p>

          <h2 className="mt-2 text-4xl font-black">{winnerName}</h2>

          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Todos os 3 reis do adversário foram capturados.
          </p>
        </div>

        <div className="rounded-lg bg-zinc-800 p-4">
          <p className="mb-3 text-center text-xs font-bold tracking-widest text-zinc-500">
            REIS RESTANTES
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-700 p-3 text-center">
              <p className="text-xs text-zinc-400">BRANCAS</p>

              <p className="mt-1 text-3xl font-black">{whiteKings}</p>
            </div>

            <div className="rounded-lg bg-zinc-700 p-3 text-center">
              <p className="text-xs text-zinc-400">PRETAS</p>

              <p className="mt-1 text-3xl font-black">{blackKings}</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-full flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-white">
      <div>
        <p className="text-sm text-zinc-400">TURNO</p>

        <h2 className="text-2xl font-bold">{playerName}</h2>
      </div>

      <div className="rounded-lg bg-zinc-800 p-4">
        <p className="text-sm text-zinc-400">CARTA UNO</p>

        <div className="mt-3 flex items-center justify-center">
          <div
            className={`
              flex
              h-32
              w-24
              items-center
              justify-center
              rounded-2xl
              border-4
              border-white
              text-5xl
              font-black
              shadow-xl

              ${
                game.currentUnoCard?.color === "red"
                  ? "bg-red-600"
                  : game.currentUnoCard?.color === "yellow"
                    ? "bg-yellow-400 text-black"
                    : game.currentUnoCard?.color === "green"
                      ? "bg-green-600"
                      : "bg-blue-600"
              }
            `}
          >
            {game.currentUnoCard?.value}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-zinc-400">MOVIMENTOS</p>

        <p className="text-xl font-bold">
          {game.movesUsed} / {game.movesAllowed}
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Restantes: {remainingMoves}
        </p>
      </div>

      <div className="rounded-lg bg-zinc-800 p-4">
        <p className="mb-3 text-center text-xs font-bold tracking-widest text-zinc-500">
          REIS RESTANTES
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-zinc-700 p-3 text-center">
            <p className="text-xs text-zinc-400">BRANCAS</p>

            <p className="mt-1 text-2xl font-black">{whiteKings}</p>
          </div>

          <div className="rounded-lg bg-zinc-700 p-3 text-center">
            <p className="text-xs text-zinc-400">PRETAS</p>

            <p className="mt-1 text-2xl font-black">{blackKings}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEndTurn}
        disabled={!turnFinished}
        className="rounded-lg bg-white px-4 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        FINALIZAR TURNO
      </button>
    </aside>
  );
}
