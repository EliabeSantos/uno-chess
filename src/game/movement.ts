import { Piece, Position, Square } from "@/types/game";

const BOARD_SIZE = 24;

function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isEnemyPiece(piece: Piece | null, color: Piece["color"]): boolean {
  return piece !== null && piece.color !== color;
}

function isFriendlyPiece(piece: Piece | null, color: Piece["color"]): boolean {
  return piece !== null && piece.color === color;
}

function addSlidingMoves(
  board: Square[][],
  position: Position,
  directions: Position[],
): Position[] {
  const piece = board[position.row][position.col].piece;

  if (!piece) {
    return [];
  }

  const moves: Position[] = [];

  for (const direction of directions) {
    let row = position.row + direction.row;
    let col = position.col + direction.col;

    while (isInsideBoard(row, col)) {
      const target = board[row][col];

      if (target.piece) {
        if (isEnemyPiece(target.piece, piece.color)) {
          moves.push({ row, col });
        }

        break;
      }

      moves.push({ row, col });

      row += direction.row;
      col += direction.col;
    }
  }

  return moves;
}

function getRookMoves(board: Square[][], position: Position): Position[] {
  return addSlidingMoves(board, position, [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ]);
}

function getBishopMoves(board: Square[][], position: Position): Position[] {
  return addSlidingMoves(board, position, [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ]);
}

function getQueenMoves(board: Square[][], position: Position): Position[] {
  return addSlidingMoves(board, position, [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },

    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ]);
}

function getKnightMoves(board: Square[][], position: Position): Position[] {
  const piece = board[position.row][position.col].piece;

  if (!piece) {
    return [];
  }

  const directions = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
  ];

  return directions
    .map((direction) => ({
      row: position.row + direction.row,
      col: position.col + direction.col,
    }))
    .filter((position) => isInsideBoard(position.row, position.col))
    .filter((position) => {
      const target = board[position.row][position.col];

      return !isFriendlyPiece(target.piece, piece.color);
    });
}

function getKingMoves(board: Square[][], position: Position): Position[] {
  const piece = board[position.row][position.col].piece;

  if (!piece) {
    return [];
  }

  const moves: Position[] = [];

  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      if (row === 0 && col === 0) {
        continue;
      }

      const targetRow = position.row + row;

      const targetCol = position.col + col;

      if (!isInsideBoard(targetRow, targetCol)) {
        continue;
      }

      const target = board[targetRow][targetCol];

      if (!isFriendlyPiece(target.piece, piece.color)) {
        moves.push({
          row: targetRow,
          col: targetCol,
        });
      }
    }
  }

  return moves;
}

function getPawnMoves(board: Square[][], position: Position): Position[] {
  const piece = board[position.row][position.col].piece;

  if (!piece) {
    return [];
  }

  const moves: Position[] = [];

  const direction = piece.color === "white" ? -1 : 1;

  /*
   * MOVIMENTO NORMAL
   *
   * Peão anda 1 casa para frente.
   */

  const nextRow = position.row + direction;

  if (isInsideBoard(nextRow, position.col)) {
    const forwardSquare = board[nextRow][position.col];

    if (!forwardSquare.piece) {
      moves.push({
        row: nextRow,
        col: position.col,
      });

      /*
       * MOVIMENTO INICIAL
       *
       * Se o peão nunca se moveu,
       * pode avançar 2 casas.
       */

      if (!piece.hasMoved) {
        const doubleRow = position.row + direction * 2;

        if (isInsideBoard(doubleRow, position.col)) {
          const doubleSquare = board[doubleRow][position.col];

          if (!doubleSquare.piece) {
            moves.push({
              row: doubleRow,
              col: position.col,
            });
          }
        }
      }
    }

    /*
     * CAPTURA DIAGONAL
     */

    for (const colOffset of [-1, 1]) {
      const targetCol = position.col + colOffset;

      if (!isInsideBoard(nextRow, targetCol)) {
        continue;
      }

      const target = board[nextRow][targetCol];

      if (isEnemyPiece(target.piece, piece.color)) {
        moves.push({
          row: nextRow,
          col: targetCol,
        });
      }
    }
  }

  return moves;
}

export function getValidMoves(
  board: Square[][],
  position: Position,
): Position[] {
  const square = board[position.row]?.[position.col];

  if (!square || !square.piece) {
    return [];
  }

  switch (square.piece.type) {
    case "rook":
      return getRookMoves(board, position);

    case "bishop":
      return getBishopMoves(board, position);

    case "queen":
      return getQueenMoves(board, position);

    case "knight":
      return getKnightMoves(board, position);

    case "king":
      return getKingMoves(board, position);

    case "pawn":
      return getPawnMoves(board, position);

    default:
      return [];
  }
}
