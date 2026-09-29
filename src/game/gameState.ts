import { GameState, Piece, PieceColor, Position } from "@/types/game";

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
  };
}

export function getRemainingMoves(game: GameState): number {
  return Math.max(0, game.movesAllowed - game.movesUsed);
}

export function canMakeMove(game: GameState): boolean {
  if (game.gameOver) {
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

function promotePawn(piece: Piece, targetRow: number): Piece {
  const isWhitePromotion = piece.color === "white" && targetRow === 0;

  const isBlackPromotion = piece.color === "black" && targetRow === 23;

  if (!isWhitePromotion && !isBlackPromotion) {
    return piece;
  }

  return {
    ...piece,
    type: "queen",
  };
}

export function selectSquare(game: GameState, position: Position): GameState {
  if (game.gameOver) {
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

  const movedPiece: Piece = promotePawn(
    {
      ...movingPiece,
      hasMoved: true,
    },
    target.row,
  );

  newBoard[target.row][target.col].piece = movedPiece;

  newBoard[source.row][source.col].piece = null;

  const capturedPieces: Piece[] = capturedPiece
    ? [...game.capturedPieces, capturedPiece]
    : game.capturedPieces;

  const newMovesUsed: number = game.movesUsed + 1;

  const temporaryGame: GameState = {
    ...game,

    board: newBoard,

    movesUsed: newMovesUsed,

    selectedSquare: null,

    validMoves: [],

    capturedPieces,
  };

  const winner: PieceColor | null = getWinner(temporaryGame);

  return {
    ...temporaryGame,

    gameOver: winner !== null,

    winner,
  };
}

export function switchTurn(game: GameState): GameState {
  if (game.gameOver) {
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
  };
}
