import { PieceColor, Position, Square } from "@/types/game";

function isInsideBoard(board: Square[][], row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

function isEnemyPiece(
  board: Square[][],
  position: Position,
  color: PieceColor,
): boolean {
  const piece = board[position.row]?.[position.col]?.piece;

  return piece !== null && piece !== undefined && piece.color !== color;
}

function isEmptySquare(board: Square[][], position: Position): boolean {
  return board[position.row]?.[position.col]?.piece === null;
}

function getSlidingMoves(
  board: Square[][],
  position: Position,
  directions: Position[],
): Position[] {
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece) {
    return [];
  }

  const moves: Position[] = [];

  for (const direction of directions) {
    let row = position.row + direction.row;

    let col = position.col + direction.col;

    while (isInsideBoard(board, row, col)) {
      const target = board[row][col].piece;

      if (!target) {
        moves.push({
          row,
          col,
        });
      } else {
        if (target.color !== piece.color) {
          moves.push({
            row,
            col,
          });
        }

        break;
      }

      row += direction.row;
      col += direction.col;
    }
  }

  return moves;
}

function getRookMoves(board: Square[][], position: Position): Position[] {
  return getSlidingMoves(board, position, [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ]);
}

function getBishopMoves(board: Square[][], position: Position): Position[] {
  return getSlidingMoves(board, position, [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ]);
}

function getQueenMoves(board: Square[][], position: Position): Position[] {
  return getSlidingMoves(board, position, [
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
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece) {
    return [];
  }

  const offsets: Position[] = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 },
  ];

  return offsets
    .filter((offset) => {
      const row = position.row + offset.row;

      const col = position.col + offset.col;

      if (!isInsideBoard(board, row, col)) {
        return false;
      }

      const target = board[row][col].piece;

      return !target || target.color !== piece.color;
    })
    .map((offset) => ({
      row: position.row + offset.row,
      col: position.col + offset.col,
    }));
}

function getKingMoves(board: Square[][], position: Position): Position[] {
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece) {
    return [];
  }

  const moves: Position[] = [];

  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      if (row === 0 && col === 0) {
        continue;
      }

      const target: Position = {
        row: position.row + row,
        col: position.col + col,
      };

      if (!isInsideBoard(board, target.row, target.col)) {
        continue;
      }

      const targetPiece = board[target.row][target.col].piece;

      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(target);
      }
    }
  }

  return moves;
}

function getPawnMoves(board: Square[][], position: Position): Position[] {
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece) {
    return [];
  }

  const direction = piece.color === "white" ? -1 : 1;

  const moves: Position[] = [];

  const oneForward: Position = {
    row: position.row + direction,
    col: position.col,
  };

  if (
    isInsideBoard(board, oneForward.row, oneForward.col) &&
    isEmptySquare(board, oneForward)
  ) {
    moves.push(oneForward);

    const twoForward: Position = {
      row: position.row + direction * 2,
      col: position.col,
    };

    if (
      !piece.hasMoved &&
      isInsideBoard(board, twoForward.row, twoForward.col) &&
      isEmptySquare(board, twoForward)
    ) {
      moves.push(twoForward);
    }
  }

  for (const colOffset of [-1, 1]) {
    const capturePosition: Position = {
      row: position.row + direction,
      col: position.col + colOffset,
    };

    if (!isInsideBoard(board, capturePosition.row, capturePosition.col)) {
      continue;
    }

    if (isEnemyPiece(board, capturePosition, piece.color)) {
      moves.push(capturePosition);
    }
  }

  return moves;
}

/**
 * Verifica se a posição é exatamente
 * o alvo de en passant.
 */
function isValidEnPassantTarget(
  board: Square[][],
  position: Position,
  target: Position,
): boolean {
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece || piece.type !== "pawn") {
    return false;
  }

  const direction = piece.color === "white" ? -1 : 1;

  if (target.row !== position.row + direction) {
    return false;
  }

  if (Math.abs(target.col - position.col) !== 1) {
    return false;
  }

  const adjacentPiece = board[position.row]?.[target.col]?.piece;

  if (!adjacentPiece) {
    return false;
  }

  return adjacentPiece.type === "pawn" && adjacentPiece.color !== piece.color;
}

/**
 * Verifica se o rei pode realizar roque
 * em determinado lado.
 *
 * Cada conjunto de 8 colunas funciona
 * como um setor independente.
 */
function getCastlingMoves(board: Square[][], position: Position): Position[] {
  const king = board[position.row]?.[position.col]?.piece;

  if (!king || king.type !== "king" || king.hasMoved) {
    return [];
  }

  const moves: Position[] = [];

  const sectorStart = Math.floor(position.col / 8) * 8;

  const sectorEnd = sectorStart + 7;

  /*
   * O rei precisa estar na coluna
   * correspondente à posição inicial
   * de um conjunto de xadrez.
   *
   * No nosso tabuleiro:
   *
   * torre esquerda = setorStart
   * rei            = setorStart + 4
   * torre direita  = setorEnd
   */

  if (position.col !== sectorStart + 4) {
    return moves;
  }

  const rookLeft = board[position.row][sectorStart].piece;

  const rookRight = board[position.row][sectorEnd].piece;

  /*
   * ROQUE GRANDE
   *
   * Rei:
   * col +4 → col +2
   *
   * Torre:
   * col 0 → col +3
   */
  if (
    rookLeft &&
    rookLeft.type === "rook" &&
    rookLeft.color === king.color &&
    !rookLeft.hasMoved
  ) {
    const path = [sectorStart + 1, sectorStart + 2, sectorStart + 3];

    const clear = path.every((col) => board[position.row][col].piece === null);

    if (clear) {
      moves.push({
        row: position.row,
        col: sectorStart + 2,
      });
    }
  }

  /*
   * ROQUE PEQUENO
   *
   * Rei:
   * col +4 → col +6
   *
   * Torre:
   * col +7 → col +5
   */
  if (
    rookRight &&
    rookRight.type === "rook" &&
    rookRight.color === king.color &&
    !rookRight.hasMoved
  ) {
    const path = [sectorStart + 5, sectorStart + 6];

    const clear = path.every((col) => board[position.row][col].piece === null);

    if (clear) {
      moves.push({
        row: position.row,
        col: sectorStart + 6,
      });
    }
  }

  return moves;
}

/**
 * Retorna movimentos pseudo-legais.
 */
export function getPseudoLegalMoves(
  board: Square[][],
  position: Position,
  enPassantTarget: Position | null = null,
): Position[] {
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece) {
    return [];
  }

  let moves: Position[];

  switch (piece.type) {
    case "rook":
      moves = getRookMoves(board, position);
      break;

    case "bishop":
      moves = getBishopMoves(board, position);
      break;

    case "queen":
      moves = getQueenMoves(board, position);
      break;

    case "knight":
      moves = getKnightMoves(board, position);
      break;

    case "king":
      moves = getKingMoves(board, position);

      moves.push(...getCastlingMoves(board, position));

      break;

    case "pawn":
      moves = getPawnMoves(board, position);

      if (
        enPassantTarget &&
        isValidEnPassantTarget(board, position, enPassantTarget)
      ) {
        const direction = piece.color === "white" ? -1 : 1;

        moves.push({
          row: position.row + direction,
          col: enPassantTarget.col,
        });
      }

      break;

    default:
      moves = [];
  }

  return moves;
}

/**
 * Simula uma movimentação.
 */
function simulateMove(
  board: Square[][],
  source: Position,
  target: Position,
  enPassantTarget: Position | null = null,
): Square[][] {
  const newBoard = board.map((row) =>
    row.map((square) => ({
      ...square,
      piece: square.piece
        ? {
            ...square.piece,
          }
        : null,
    })),
  );

  const movingPiece = newBoard[source.row][source.col].piece;

  if (!movingPiece) {
    return newBoard;
  }

  /*
   * ROQUE
   *
   * Move também a torre.
   */
  if (
    movingPiece.type === "king" &&
    source.row === target.row &&
    Math.abs(target.col - source.col) === 2
  ) {
    const direction = target.col > source.col ? 1 : -1;

    const rookSourceCol =
      direction === 1
        ? Math.floor(source.col / 8) * 8 + 7
        : Math.floor(source.col / 8) * 8;

    const rookTargetCol = source.col + direction;

    const rook = newBoard[source.row][rookSourceCol].piece;

    newBoard[target.row][target.col].piece = {
      ...movingPiece,
      hasMoved: true,
    };

    newBoard[source.row][source.col].piece = null;

    if (rook) {
      newBoard[source.row][rookTargetCol].piece = {
        ...rook,
        hasMoved: true,
      };

      newBoard[source.row][rookSourceCol].piece = null;
    }

    return newBoard;
  }

  newBoard[target.row][target.col].piece = {
    ...movingPiece,
    hasMoved: true,
  };

  newBoard[source.row][source.col].piece = null;

  /*
   * EN PASSANT
   */
  if (
    movingPiece.type === "pawn" &&
    enPassantTarget &&
    target.row !== source.row &&
    target.col !== source.col &&
    target.row === source.row + (movingPiece.color === "white" ? -1 : 1) &&
    target.col === enPassantTarget.col &&
    !board[target.row][target.col].piece
  ) {
    const capturedPawn = newBoard[source.row][target.col].piece;

    if (
      capturedPawn &&
      capturedPawn.type === "pawn" &&
      capturedPawn.color !== movingPiece.color
    ) {
      newBoard[source.row][target.col].piece = null;
    }
  }

  return newBoard;
}

export function isSquareUnderAttack(
  board: Square[][],
  position: Position,
  attackingColor: PieceColor,
): boolean {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const piece = board[row][col].piece;

      if (!piece || piece.color !== attackingColor) {
        continue;
      }

      const moves = getPseudoLegalMoves(board, {
        row,
        col,
      });

      if (
        moves.some(
          (move) => move.row === position.row && move.col === position.col,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function isKingInCheck(
  board: Square[][],
  kingPosition: Position,
  kingColor: PieceColor,
): boolean {
  const attackingColor = kingColor === "white" ? "black" : "white";

  return isSquareUnderAttack(board, kingPosition, attackingColor);
}

function getKingPositions(board: Square[][], color: PieceColor): Position[] {
  const positions: Position[] = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const piece = board[row][col].piece;

      if (piece && piece.color === color && piece.type === "king") {
        positions.push({
          row,
          col,
        });
      }
    }
  }

  return positions;
}

/**
 * Verifica se uma jogada deixa qualquer
 * rei aliado em xeque.
 */
function leavesKingInCheck(
  board: Square[][],
  source: Position,
  target: Position,
  color: PieceColor,
  enPassantTarget: Position | null,
): boolean {
  const simulatedBoard = simulateMove(board, source, target, enPassantTarget);

  const kingPositions = getKingPositions(simulatedBoard, color);

  return kingPositions.some((kingPosition) =>
    isKingInCheck(simulatedBoard, kingPosition, color),
  );
}

export function getValidMoves(
  board: Square[][],
  position: Position,
  enPassantTarget: Position | null = null,
): Position[] {
  const piece = board[position.row]?.[position.col]?.piece;

  if (!piece) {
    return [];
  }

  const pseudoLegalMoves = getPseudoLegalMoves(
    board,
    position,
    enPassantTarget,
  );

  return pseudoLegalMoves.filter(
    (target) =>
      !leavesKingInCheck(board, position, target, piece.color, enPassantTarget),
  );
}
