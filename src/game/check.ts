import { GameState, PieceColor, Position } from "@/types/game";

import { getValidMoves, isSquareUnderAttack } from "./movement";

// ========================================
// TIPOS DE STATUS
// ========================================

export type ChessGameStatus = "normal" | "check" | "checkmate" | "stalemate";

// ========================================
// REIS
// ========================================

export function getKingPositions(
  game: GameState,
  color: PieceColor,
): Position[] {
  const positions: Position[] = [];

  for (let row = 0; row < game.board.length; row++) {
    for (let col = 0; col < game.board[row].length; col++) {
      const piece = game.board[row][col].piece;

      if (!piece) {
        continue;
      }

      if (piece.color !== color || piece.type !== "king") {
        continue;
      }

      positions.push({
        row,
        col,
      });
    }
  }

  return positions;
}

export function isKingInCheck(
  game: GameState,
  kingPosition: Position,
): boolean {
  const king = game.board[kingPosition.row]?.[kingPosition.col]?.piece;

  if (!king || king.type !== "king") {
    return false;
  }

  const attackingColor: PieceColor = king.color === "white" ? "black" : "white";

  return isSquareUnderAttack(game.board, kingPosition, attackingColor);
}

export function getCheckedKings(
  game: GameState,
  color: PieceColor,
): Position[] {
  const kings = getKingPositions(game, color);

  return kings.filter((position) => isKingInCheck(game, position));
}

export function isAnyKingInCheck(game: GameState, color: PieceColor): boolean {
  return getCheckedKings(game, color).length > 0;
}

// ========================================
// TODOS OS MOVIMENTOS LEGAIS
// ========================================

export interface LegalMove {
  from: Position;
  to: Position;
}

/**
 * Retorna todos os movimentos legais
 * disponíveis para um jogador.
 *
 * IMPORTANTE:
 * - O tabuleiro inteiro 24×24 é considerado.
 * - As peças podem atravessar os 3 setores.
 * - Todos os reis do jogador são considerados.
 * - getValidMoves() já garante que um movimento
 *   não deixa nenhum rei aliado vulnerável.
 */
export function getAllLegalMoves(
  game: GameState,
  color: PieceColor,
): LegalMove[] {
  const moves: LegalMove[] = [];

  for (let row = 0; row < game.board.length; row++) {
    for (let col = 0; col < game.board[row].length; col++) {
      const piece = game.board[row][col].piece;

      if (!piece) {
        continue;
      }

      if (piece.color !== color) {
        continue;
      }

      const from: Position = {
        row,
        col,
      };

      const validMoves = getValidMoves(game.board, from, game.enPassantTarget);

      for (const to of validMoves) {
        moves.push({
          from,
          to,
        });
      }
    }
  }

  return moves;
}

// ========================================
// STATUS DO JOGO
// ========================================

/**
 * Determina o estado de xadrez do jogador.
 *
 * normal:
 * - existe pelo menos um movimento legal
 * - nenhum rei está em check
 *
 * check:
 * - pelo menos um rei está em check
 * - existe pelo menos um movimento legal
 *
 * checkmate:
 * - pelo menos um rei está em check
 * - não existe nenhum movimento legal
 *
 * stalemate:
 * - nenhum rei está em check
 * - não existe nenhum movimento legal
 */
export function getChessGameStatus(
  game: GameState,
  color: PieceColor,
): ChessGameStatus {
  const checkedKings = getCheckedKings(game, color);

  const legalMoves = getAllLegalMoves(game, color);

  const inCheck = checkedKings.length > 0;

  const hasLegalMoves = legalMoves.length > 0;

  if (!hasLegalMoves && inCheck) {
    return "checkmate";
  }

  if (!hasLegalMoves && !inCheck) {
    return "stalemate";
  }

  if (inCheck) {
    return "check";
  }

  return "normal";
}

// ========================================
// HELPERS
// ========================================

export function isCheckmate(game: GameState, color: PieceColor): boolean {
  return getChessGameStatus(game, color) === "checkmate";
}

export function isStalemate(game: GameState, color: PieceColor): boolean {
  return getChessGameStatus(game, color) === "stalemate";
}

export function hasAnyLegalMove(game: GameState, color: PieceColor): boolean {
  return getAllLegalMoves(game, color).length > 0;
}
