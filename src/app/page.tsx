"use client";

import { useState } from "react";

import ChessBoard from "@/components/ChessBoard";
import GameUI from "@/components/GameUI";
import PromotionModal from "@/components/PromotionModal";

import {
  createInitialGameState,
  movePiece,
  promotePawn,
  selectRecoveryPiece,
  selectSquare,
  switchTurn,
} from "@/game/gameState";

import { BoardLayout, GameState, PieceType, Position } from "@/types/game";

const boardOptions: Array<{
  layout: BoardLayout;
  size: string;
  title: string;
  description: string;
  pieces: string;
}> = [
  {
    layout: 1,
    size: "8 × 8",
    title: "1 × 1",
    description: "Uma formação de xadrez por jogador.",
    pieces: "16 peças por jogador",
  },
  {
    layout: 2,
    size: "16 × 16",
    title: "2 × 2",
    description: "Duas formações de xadrez por jogador.",
    pieces: "32 peças por jogador",
  },
  {
    layout: 3,
    size: "24 × 24",
    title: "3 × 3",
    description: "Três formações de xadrez por jogador.",
    pieces: "48 peças por jogador",
  },
];

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null);

  function handleStartGame(layout: BoardLayout) {
    setGame(createInitialGameState(layout));
  }

  function handleSquareClick(position: Position) {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      if (currentGame.gameOver) {
        return currentGame;
      }

      if (currentGame.pendingPromotion) {
        return currentGame;
      }

      if (currentGame.recoveryPieceId) {
        return movePiece(currentGame, position);
      }

      return selectSquare(currentGame, position);
    });
  }

  function handleRecoveryPiece(pieceId: string) {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      return selectRecoveryPiece(currentGame, pieceId);
    });
  }

  function handlePromotion(type: Exclude<PieceType, "king" | "pawn">) {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      return promotePawn(currentGame, type);
    });
  }

  function handleEndTurn() {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      return switchTurn(currentGame);
    });
  }

  function handleBackToMenu() {
    setGame(null);
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-5xl">
            <div className="mb-12 text-center">
              <div className="mb-4 text-xs font-black tracking-[0.5em] text-emerald-400">
                UNO + CHESS
              </div>

              <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
                UNO CHESS
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
                Escolha o tamanho da batalha.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {boardOptions.map((option) => (
                <button
                  key={option.layout}
                  type="button"
                  onClick={() => handleStartGame(option.layout)}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:-translate-y-1 hover:border-emerald-500/60 hover:bg-zinc-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-4xl font-black">{option.title}</p>

                      <p className="mt-2 text-sm font-bold text-emerald-400">
                        {option.size}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-xl transition group-hover:border-emerald-500/50">
                      ♟
                    </div>
                  </div>

                  <p className="mt-6 text-sm leading-6 text-zinc-400">
                    {option.description}
                  </p>

                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Exército
                    </p>

                    <p className="mt-1 text-sm font-bold text-zinc-200">
                      {option.pieces}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm font-black">
                    <span className="text-zinc-500">INICIAR</span>

                    <span className="text-emerald-400 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-10 text-center text-xs text-zinc-600">
              O tamanho maior aumenta simultaneamente o tabuleiro e o número de
              peças.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight">UNO CHESS</h1>

              <span className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 px-2 py-1 text-xs font-black text-emerald-400">
                {game.boardLayout}×{game.boardLayout}
              </span>
            </div>

            <p className="mt-1 text-zinc-400">
              {game.boardSize}×{game.boardSize} •{" "}
              {game.boardSize === 8 ? "1" : game.boardSize === 16 ? "2" : "3"}{" "}
              formação
              {game.boardSize === 8 ? "" : "ões"} por jogador
            </p>
          </div>

          <button
            type="button"
            onClick={handleBackToMenu}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            ← MENU
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="relative">
            <ChessBoard game={game} onSquareClick={handleSquareClick} />

            {game.pendingPromotion && (
              <PromotionModal
                color={game.currentPlayer}
                onSelect={handlePromotion}
              />
            )}
          </div>

          <GameUI
            game={game}
            onEndTurn={handleEndTurn}
            onRecoveryPiece={handleRecoveryPiece}
          />
        </div>
      </div>
    </main>
  );
}
