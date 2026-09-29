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

export interface GameState {
  board: Square[][];

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

  skipNextTurn: boolean;

  gameOver: boolean;
  winner: PieceColor | null;

  pendingPromotion: Position | null;
}
