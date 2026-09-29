import {
  GameState,
  Piece,
  PieceColor,
  PieceType,
  Position,
} from "@/types/game";

import { createBoard } from "./board";
import { getValidMoves } from "./movement";

import { createUnoDeck, drawUnoCard, shuffleDeck } from "./uno";

export function createInitialGameState(): GameState {
  const unoDeck = createUnoDeck();

  const {
    card,
    remainingDeck,
  }: {
    card: GameState["currentUnoCard"];
    remainingDeck: GameState["unoDeck"];
  } = drawUnoCard(unoDeck);

  return {
    board: createBoard(),

    currentPlayer: "white",

    movesAllowed: card?.value ?? 1,

    movesUsed: 0,

    selectedSquare: null,

    validMoves: [],

    unoDeck: remainingDeck,

    unoDiscard: [],

    currentUnoCard: card,

    capturedPieces: [],

    gameOver: false,

    winner: null,

    pendingPromotion: null,
  };
}

export function getRemainingMoves(game: GameState): number {
  return Math.max(0, game.movesAllowed - game.movesUsed);
}

export function canMakeMove(game: GameState): boolean {
  if (game.gameOver) {
    return false;
  }

  if (game.pendingPromotion) {
    return false;
  }

  return game.movesUsed < game.movesAllowed;
}

export function countKings(game: GameState, color: PieceColor): number {
  let count = 0;

  for (const row of game.board) {
    for (const square of row) {
      if (
        square.piece &&
        square.piece.color === color &&
        square.piece.type === "king"
      ) {
        count++;
      }
    }
  }

  return count;
}

export function getWinner(game: GameState): PieceColor | null {
  const whiteKings = countKings(game, "white");

  const blackKings = countKings(game, "black");

  if (whiteKings === 0) {
    return "black";
  }

  if (blackKings === 0) {
    return "white";
  }

  return null;
}

export function selectSquare(game: GameState, position: Position): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  const square = game.board[position.row]?.[position.col];

  if (!square) {
    return game;
  }

  const piece: Piece | null = square.piece;

  if (!piece) {
    return game;
  }

  if (piece.color !== game.currentPlayer) {
    return game;
  }

  if (!canMakeMove(game)) {
    return game;
  }

  const validMoves: Position[] = getValidMoves(game.board, position);

  return {
    ...game,

    selectedSquare: position,

    validMoves,
  };
}

export function movePiece(game: GameState, target: Position): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  const source: Position | null = game.selectedSquare;

  if (!source) {
    return game;
  }

  if (!canMakeMove(game)) {
    return game;
  }

  const isValidMove: boolean = game.validMoves.some(
    (move: Position) => move.row === target.row && move.col === target.col,
  );

  if (!isValidMove) {
    return game;
  }

  const newBoard: GameState["board"] = game.board.map(
    (row: GameState["board"][number]) =>
      row.map((square) => ({
        ...square,

        piece: square.piece
          ? {
              ...square.piece,
            }
          : null,
      })),
  );

  const movingPiece: Piece | null = newBoard[source.row][source.col].piece;

  if (!movingPiece) {
    return game;
  }

  const capturedPiece: Piece | null = newBoard[target.row][target.col].piece;

  const movedPiece: Piece = {
    ...movingPiece,

    hasMoved: true,
  };

  newBoard[target.row][target.col].piece = movedPiece;

  newBoard[source.row][source.col].piece = null;

  const capturedPieces: Piece[] = capturedPiece
    ? [...game.capturedPieces, capturedPiece]
    : game.capturedPieces;

  const newMovesUsed: number = game.movesUsed + 1;

  const isWhitePromotion =
    movedPiece.type === "pawn" &&
    movedPiece.color === "white" &&
    target.row === 0;

  const isBlackPromotion =
    movedPiece.type === "pawn" &&
    movedPiece.color === "black" &&
    target.row === 23;

  const needsPromotion = isWhitePromotion || isBlackPromotion;

  const temporaryGame: GameState = {
    ...game,

    board: newBoard,

    movesUsed: newMovesUsed,

    selectedSquare: null,

    validMoves: [],

    capturedPieces,

    pendingPromotion: needsPromotion ? target : null,
  };

  const winner: PieceColor | null = getWinner(temporaryGame);

  return {
    ...temporaryGame,

    gameOver: winner !== null,

    winner,
  };
}

export function promotePawn(
  game: GameState,
  newType: Exclude<PieceType, "king" | "pawn">,
): GameState {
  if (game.gameOver) {
    return game;
  }

  if (!game.pendingPromotion) {
    return game;
  }

  const { row, col } = game.pendingPromotion;

  const square = game.board[row]?.[col];

  if (!square) {
    return game;
  }

  const piece = square.piece;

  if (!piece) {
    return game;
  }

  if (piece.type !== "pawn") {
    return {
      ...game,

      pendingPromotion: null,
    };
  }

  const promotedPiece: Piece = {
    ...piece,

    type: newType,

    hasMoved: true,
  };

  const newBoard: GameState["board"] = game.board.map(
    (boardRow: GameState["board"][number]) =>
      boardRow.map((boardSquare) => ({
        ...boardSquare,

        piece: boardSquare.piece
          ? {
              ...boardSquare.piece,
            }
          : null,
      })),
  );

  newBoard[row][col].piece = promotedPiece;

  return {
    ...game,

    board: newBoard,

    pendingPromotion: null,
  };
}

export function switchTurn(game: GameState): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  const nextPlayer: PieceColor =
    game.currentPlayer === "white" ? "black" : "white";

  let deck: GameState["unoDeck"] = game.unoDeck;

  let discard: GameState["unoDiscard"] = [...game.unoDiscard];

  if (game.currentUnoCard) {
    discard.push(game.currentUnoCard);
  }

  if (deck.length === 0) {
    deck = shuffleDeck(discard);

    discard = [];
  }

  const {
    card,
    remainingDeck,
  }: {
    card: GameState["currentUnoCard"];
    remainingDeck: GameState["unoDeck"];
  } = drawUnoCard(deck);

  const movesAllowed: number = card?.value ?? 1;

  return {
    ...game,

    currentPlayer: nextPlayer,

    movesAllowed,

    movesUsed: 0,

    selectedSquare: null,

    validMoves: [],

    unoDeck: remainingDeck,

    unoDiscard: discard,

    currentUnoCard: card,

    pendingPromotion: null,
  };
}
