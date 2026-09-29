import { GameState, PieceColor, Position } from "@/types/game";

export const FOG_RADIUS = 4;

function getPositionKey(position: Position): string {
  return `${position.row}:${position.col}`;
}

/**
 * Calcula a distância Euclidiana entre duas casas.
 *
 * Isso produz um Fog circular em vez de um quadrado.
 */
export function getFogDistance(from: Position, to: Position): number {
  const rowDistance = to.row - from.row;
  const colDistance = to.col - from.col;

  return Math.sqrt(rowDistance * rowDistance + colDistance * colDistance);
}

/**
 * Verifica se uma posição está dentro do raio
 * de visão de uma determinada peça.
 */
export function isPositionWithinVision(
  piecePosition: Position,
  targetPosition: Position,
  radius = FOG_RADIUS,
): boolean {
  return getFogDistance(piecePosition, targetPosition) <= radius;
}

/**
 * Calcula todas as posições visíveis para um jogador.
 *
 * A visão final é a união dos círculos de visão
 * produzidos por todas as peças daquele jogador.
 */
export function getVisiblePositions(
  game: GameState,
  playerColor: PieceColor,
  radius = FOG_RADIUS,
): Set<string> {
  const visiblePositions = new Set<string>();

  for (let row = 0; row < game.boardSize; row += 1) {
    for (let col = 0; col < game.boardSize; col += 1) {
      const piece = game.board[row][col].piece;

      if (!piece || piece.color !== playerColor) {
        continue;
      }

      const minRow = Math.max(0, Math.floor(row - radius));

      const maxRow = Math.min(game.boardSize - 1, Math.ceil(row + radius));

      const minCol = Math.max(0, Math.floor(col - radius));

      const maxCol = Math.min(game.boardSize - 1, Math.ceil(col + radius));

      for (let targetRow = minRow; targetRow <= maxRow; targetRow += 1) {
        for (let targetCol = minCol; targetCol <= maxCol; targetCol += 1) {
          const targetPosition: Position = {
            row: targetRow,
            col: targetCol,
          };

          const piecePosition: Position = {
            row,
            col,
          };

          if (isPositionWithinVision(piecePosition, targetPosition, radius)) {
            visiblePositions.add(getPositionKey(targetPosition));
          }
        }
      }
    }
  }

  return visiblePositions;
}

/**
 * Verifica se uma determinada posição está visível.
 */
export function isPositionVisible(
  visiblePositions: Set<string>,
  position: Position,
): boolean {
  return visiblePositions.has(getPositionKey(position));
}
