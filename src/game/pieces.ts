import { Piece, PieceColor, Square } from "@/types/game";

function createPiece(
  color: PieceColor,
  type: Piece["type"],
  id: string,
): Piece {
  return {
    id,
    type,
    color,
    hasMoved: false,
  };
}
function createSet(color: PieceColor, setNumber: number): Piece[] {
  const prefix = `${color}-set-${setNumber}`;

  return [
    createPiece(color, "rook", `${prefix}-rook-1`),

    createPiece(color, "knight", `${prefix}-knight-1`),

    createPiece(color, "bishop", `${prefix}-bishop-1`),

    createPiece(color, "queen", `${prefix}-queen`),

    createPiece(color, "king", `${prefix}-king`),

    createPiece(color, "bishop", `${prefix}-bishop-2`),

    createPiece(color, "knight", `${prefix}-knight-2`),

    createPiece(color, "rook", `${prefix}-rook-2`),

    ...Array.from({ length: 8 }, (_, index) =>
      createPiece(color, "pawn", `${prefix}-pawn-${index + 1}`),
    ),
  ];
}

export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];

  for (const color of ["white", "black"] as PieceColor[]) {
    for (let setNumber = 1; setNumber <= 3; setNumber++) {
      pieces.push(...createSet(color, setNumber));
    }
  }

  return pieces;
}

export function createInitialBoard(): Square[][] {
  const board: Square[][] = Array.from({ length: 24 }, (_, row) =>
    Array.from({ length: 24 }, (_, col) => ({
      row,
      col,
      piece: null,
    })),
  );

  const pieces = createInitialPieces();

  const whitePieces = pieces.filter((piece) => piece.color === "white");

  const blackPieces = pieces.filter((piece) => piece.color === "black");

  /*
   * Cada set ocupa 8 colunas.
   *
   * Set 1 → colunas 0-7
   * Set 2 → colunas 8-15
   * Set 3 → colunas 16-23
   */

  const setColumns = [0, 8, 16];

  /*
   * BRANCAS
   *
   * Linha 23 → peças principais
   * Linha 22 → peões
   */

  for (let setIndex = 0; setIndex < 3; setIndex++) {
    const start = setIndex * 16;

    const backRank = whitePieces.slice(start, start + 8);

    const pawns = whitePieces.slice(start + 8, start + 16);

    const startCol = setColumns[setIndex];

    for (let col = 0; col < 8; col++) {
      board[23][startCol + col].piece = backRank[col];

      board[22][startCol + col].piece = pawns[col];
    }
  }

  /*
   * PRETAS
   *
   * Linha 0 → peças principais
   * Linha 1 → peões
   */

  for (let setIndex = 0; setIndex < 3; setIndex++) {
    const start = setIndex * 16;

    const backRank = blackPieces.slice(start, start + 8);

    const pawns = blackPieces.slice(start + 8, start + 16);

    const startCol = setColumns[setIndex];

    for (let col = 0; col < 8; col++) {
      board[0][startCol + col].piece = backRank[col];

      board[1][startCol + col].piece = pawns[col];
    }
  }

  return board;
}
