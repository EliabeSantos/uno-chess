"use client";

import { useState } from "react";

import ChessBoard from "@/components/ChessBoard";
import GameUI from "@/components/GameUI";

import {
  createInitialGameState,
  movePiece,
  selectSquare,
  switchTurn,
} from "@/game/gameState";

import { GameState, Position } from "@/types/game";

export default function Home() {
  const [game, setGame] = useState<GameState>(createInitialGameState());

  function handleSquareClick(position: Position) {
    setGame((currentGame) => {
      // Se já existe uma peça selecionada,
      // tentamos realizar o movimento.
      if (currentGame.selectedSquare) {
        const movedGame = movePiece(currentGame, position);

        // Se o movimento realmente aconteceu,
        // movePiece terá aumentado movesUsed.
        if (movedGame.movesUsed !== currentGame.movesUsed) {
          return movedGame;
        }
      }

      // Caso contrário, tenta selecionar
      // uma peça.
      return selectSquare(currentGame, position);
    });
  }

  function handleEndTurn() {
    setGame((currentGame) => switchTurn(currentGame));
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-6">
          <h1 className="text-4xl font-black tracking-tight">UNO CHESS</h1>

          <p className="mt-1 text-zinc-400">Xadrez 24×24 + UNO</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <ChessBoard game={game} onSquareClick={handleSquareClick} />

          <GameUI game={game} onEndTurn={handleEndTurn} />
        </div>
      </div>
    </main>
  );
}
