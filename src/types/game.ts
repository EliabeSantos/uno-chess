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

export type UnoColor = "red" | "yellow" | "green" | "blue";

export type UnoCardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw2"
  | "wildDraw4"
  | "colorSwap";

export interface UnoCard {
  id: string;
  color: UnoColor | null;
  type: UnoCardType;
  value: number | null;
  recoveryAmount: number;
}

export type BoardSize = 8 | 16 | 24;
export type BoardLayout = 1 | 2 | 3;

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

  /*
   * TROCA DE COR
   *
   * Quando true, o jogador precisa escolher
   * uma peça própria para realizar a troca.
   */
  pendingColorSwap: boolean;
  colorSwapAvailable: boolean;

  /*
   * Posição da peça inimiga escolhida automaticamente
   * pela carta Troca de Cor.
   */
  colorSwapTarget: Position | null;

  gameOver: boolean;
  winner: PieceColor | null;

  pendingPromotion: Position | null;
}
