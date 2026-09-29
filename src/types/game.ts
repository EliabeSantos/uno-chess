export type PieceColor = "white" | "black";

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn";

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Square {
  row: number;
  col: number;
  piece: Piece | null;
}

// ========================================
// UNO
// ========================================

export type UnoColor = "red" | "yellow" | "green" | "blue";

export type UnoCardType = "number" | "skip" | "reverse" | "draw2" | "wildDraw4";

export interface UnoCard {
  id: string;
  color: UnoColor | null;
  type: UnoCardType;
  value: number | null;
  recoveryAmount: number;
}

// ========================================
// BOARD SIZE
// ========================================

export type BoardSize = 8 | 16 | 24;

export type BoardLayout = 1 | 2 | 3;

// ========================================
// GAME STATE
// ========================================

export interface GameState {
  board: Square[][];

  boardSize: BoardSize;
  boardLayout: BoardLayout;

  currentPlayer: PieceColor;

  movesAllowed: number;
  movesUsed: number;

  selectedSquare: Position | null;
  validMoves: Position[];

  unoDeck: UnoCard[];
  unoDiscard: UnoCard[];
  currentUnoCard: UnoCard | null;

  capturedPieces: Piece[];

  enPassantTarget: Position | null;

  boardReversed: boolean;

  pendingRecovery: number;

  recoverySelection: Piece[];

  recoveryPieceId: string | null;

  gameOver: boolean;
  winner: PieceColor | null;

  pendingPromotion: Position | null;
}
