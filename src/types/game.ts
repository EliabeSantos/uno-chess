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

  gameOver: boolean;
  winner: PieceColor | null;
}
