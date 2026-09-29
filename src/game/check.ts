import { GameState, PieceColor, Position } from "@/types/game";

import { isSquareUnderAttack } from "./movement";

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
