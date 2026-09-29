import { BoardSize, Piece, PieceColor, Square } from "@/types/game";

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
    createPiece(color, "queen", `${prefix}-queen-1`),
    createPiece(color, "king", `${prefix}-king-1`),
    createPiece(color, "bishop", `${prefix}-bishop-2`),
    createPiece(color, "knight", `${prefix}-knight-2`),
    createPiece(color, "rook", `${prefix}-rook-2`),
    ...Array.from({ length: 8 }, (_, index) =>
      createPiece(color, "pawn", `${prefix}-pawn-${index + 1}`),
    ),
  ];
}

export function createInitialPieces(boardSize: BoardSize = 24): Piece[] {
  const setCount = boardSize / 8;

  const pieces: Piece[] = [];

  for (const color of ["white", "black"] as PieceColor[]) {
    for (let setNumber = 1; setNumber <= setCount; setNumber++) {
      pieces.push(...createSet(color, setNumber));
    }
  }

  return pieces;
}

export function createInitialBoard(boardSize: BoardSize = 24): Square[][] {
  const board: Square[][] = Array.from({ length: boardSize }, (_, row) =>
    Array.from({ length: boardSize }, (_, col) => ({
      row,
      col,
      piece: null,
    })),
  );

  const pieces = createInitialPieces(boardSize);

  const whitePieces = pieces.filter((piece) => piece.color === "white");

  const blackPieces = pieces.filter((piece) => piece.color === "black");

  const setCount = boardSize / 8;

  for (let setIndex = 0; setIndex < setCount; setIndex++) {
    const start = setIndex * 16;

    const backRank = whitePieces.slice(start, start + 8);

    const pawns = whitePieces.slice(start + 8, start + 16);

    const startCol = setIndex * 8;

    for (let col = 0; col < 8; col++) {
      board[boardSize - 1][startCol + col].piece = backRank[col];

      board[boardSize - 2][startCol + col].piece = pawns[col];
    }
  }

  for (let setIndex = 0; setIndex < setCount; setIndex++) {
    const start = setIndex * 16;

    const backRank = blackPieces.slice(start, start + 8);

    const pawns = blackPieces.slice(start + 8, start + 16);

    const startCol = setIndex * 8;

    for (let col = 0; col < 8; col++) {
      board[0][startCol + col].piece = backRank[col];

      board[1][startCol + col].piece = pawns[col];
    }
  }

  return board;
}
