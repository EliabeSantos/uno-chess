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

import { GameState, PieceType, Position } from "@/types/game";

export default function Home() {
  const [game, setGame] = useState<GameState>(createInitialGameState());

  function handleSquareClick(position: Position) {
    setGame((currentGame) => {
      if (currentGame.gameOver) {
        return currentGame;
      }

      if (currentGame.pendingPromotion) {
        return currentGame;
      }

      // ==================================
      // RECOVERY MODE
      // ==================================

      if (currentGame.recoveryPieceId) {
        return movePiece(currentGame, position);
      }

      // ==================================
      // NORMAL MOVE
      // ==================================

      if (currentGame.selectedSquare) {
        const movedGame = movePiece(currentGame, position);

        if (
          movedGame.movesUsed !== currentGame.movesUsed ||
          movedGame.capturedPieces.length !==
            currentGame.capturedPieces.length ||
          movedGame.pendingPromotion !== currentGame.pendingPromotion
        ) {
          return movedGame;
        }
      }

      return selectSquare(currentGame, position);
    });
  }

  function handleRecoveryPiece(pieceId: string) {
    setGame((currentGame) => selectRecoveryPiece(currentGame, pieceId));
  }

  function handlePromotion(type: Exclude<PieceType, "king" | "pawn">) {
    setGame((currentGame) => promotePawn(currentGame, type));
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
