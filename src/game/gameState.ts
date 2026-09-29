import {
  GameState,
  Piece,
  PieceColor,
  PieceType,
  Position,
} from "@/types/game";

import { createBoard } from "./board";

import { createUnoDeck, drawUnoCard } from "./uno";

import { getValidMoves } from "./movement";

import { getKingPositions, isKingInCheck } from "./check";

// ========================================
// HELPERS
// ========================================

function cloneBoard(board: GameState["board"]): GameState["board"] {
  return board.map((row) =>
    row.map((square) => ({
      ...square,
      piece: square.piece
        ? {
            ...square.piece,
          }
        : null,
    })),
  );
}

function getMovesAllowedFromCard(card: GameState["currentUnoCard"]): number {
  if (!card) {
    return 1;
  }

  switch (card.type) {
    case "number":
      return card.value ?? 1;

    case "skip":
      return 0;

    case "reverse":
    case "draw2":
    case "wildDraw4":
      return 1;

    default:
      return 1;
  }
}

function getRecoveryAmountFromCard(card: GameState["currentUnoCard"]): number {
  if (!card) {
    return 0;
  }

  switch (card.type) {
    case "draw2":
      return 2;

    case "wildDraw4":
      return 4;

    default:
      return 0;
  }
}

function getOppositeColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

// ========================================
// INITIAL STATE
// ========================================

export function createInitialGameState(): GameState {
  const deck = createUnoDeck();

  const { card, remainingDeck } = drawUnoCard(deck);

  const initialCard = card;

  return {
    board: createBoard(),

    currentPlayer: "white",

    movesAllowed: getMovesAllowedFromCard(initialCard),

    movesUsed: 0,

    selectedSquare: null,

    validMoves: [],

    unoDeck: remainingDeck,

    unoDiscard: [],

    currentUnoCard: initialCard,

    capturedPieces: [],

    enPassantTarget: null,

    boardReversed: false,

    pendingRecovery: getRecoveryAmountFromCard(initialCard),

    recoverySelection: [],

    recoveryPieceId: null,

    skipNextTurn: false,

    gameOver: false,

    winner: null,

    pendingPromotion: null,
  };
}

// ========================================
// MOVE LIMIT
// ========================================

function canMakeMove(game: GameState): boolean {
  if (game.gameOver) {
    return false;
  }

  if (game.pendingPromotion) {
    return false;
  }

  if (game.movesUsed >= game.movesAllowed) {
    return false;
  }

  return true;
}

// ========================================
// SELECTION
// ========================================

export function selectSquare(game: GameState, position: Position): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  if (game.recoveryPieceId) {
    return game;
  }

  if (game.movesUsed >= game.movesAllowed) {
    return game;
  }

  const square = game.board[position.row]?.[position.col];

  if (!square) {
    return game;
  }

  const piece = square.piece;

  // ======================================
  // DESELECT
  // ======================================

  if (
    game.selectedSquare &&
    game.selectedSquare.row === position.row &&
    game.selectedSquare.col === position.col
  ) {
    return {
      ...game,
      selectedSquare: null,
      validMoves: [],
    };
  }

  // ======================================
  // SELECT OWN PIECE
  // ======================================

  if (piece && piece.color === game.currentPlayer) {
    const validMoves = getValidMoves(
      game.board,
      position,
      game.enPassantTarget,
    );

    return {
      ...game,
      selectedSquare: position,
      validMoves,
    };
  }

  // ======================================
  // CLICK ON VALID MOVE
  // ======================================

  if (
    game.selectedSquare &&
    game.validMoves.some(
      (move) => move.row === position.row && move.col === position.col,
    )
  ) {
    return movePiece(game, position);
  }

  return game;
}

// ========================================
// MOVE PIECE
// ========================================

export function movePiece(game: GameState, target: Position): GameState {
  // Recovery placement has priority.
  if (game.recoveryPieceId) {
    return recoverPieceToSquare(game, target);
  }

  if (!canMakeMove(game)) {
    return game;
  }

  if (!game.selectedSquare) {
    return game;
  }

  const source = game.selectedSquare;

  const isValidMove = game.validMoves.some(
    (move) => move.row === target.row && move.col === target.col,
  );

  if (!isValidMove) {
    return game;
  }

  const movingPiece = game.board[source.row]?.[source.col]?.piece;

  if (!movingPiece) {
    return game;
  }

  const newBoard = cloneBoard(game.board);

  const capturedPiece = newBoard[target.row][target.col].piece;

  // ======================================
  // EN PASSANT CAPTURE
  // ======================================

  let enPassantCapture: Piece | null = null;

  const isPawn = movingPiece.type === "pawn";

  const isDiagonalMove = Math.abs(target.col - source.col) === 1;

  const targetIsEmpty = !newBoard[target.row][target.col].piece;

  if (
    isPawn &&
    isDiagonalMove &&
    targetIsEmpty &&
    game.enPassantTarget &&
    game.enPassantTarget.row === target.row &&
    game.enPassantTarget.col === target.col
  ) {
    const captureDirection = movingPiece.color === "white" ? 1 : -1;

    const captureRow = target.row + captureDirection;

    const capturedPawn = newBoard[captureRow]?.[target.col]?.piece;

    if (
      capturedPawn &&
      capturedPawn.type === "pawn" &&
      capturedPawn.color !== movingPiece.color
    ) {
      enPassantCapture = capturedPawn;

      newBoard[captureRow][target.col].piece = null;
    }
  }

  // ======================================
  // CASTLING
  // ======================================

  if (movingPiece.type === "king" && Math.abs(target.col - source.col) === 2) {
    const direction = target.col > source.col ? 1 : -1;

    const rookSourceCol =
      direction === 1
        ? Math.floor(source.col / 8) * 8 + 7
        : Math.floor(source.col / 8) * 8;

    const rookTargetCol = target.col - direction;

    const rook = newBoard[source.row][rookSourceCol].piece;

    if (rook && rook.type === "rook") {
      newBoard[source.row][rookSourceCol].piece = null;

      newBoard[source.row][rookTargetCol].piece = {
        ...rook,
        hasMoved: true,
      };
    }
  }

  // ======================================
  // MOVE PIECE
  // ======================================

  newBoard[source.row][source.col].piece = null;

  newBoard[target.row][target.col].piece = {
    ...movingPiece,
    hasMoved: true,
  };

  // ======================================
  // CAPTURE LIST
  // ======================================

  const actualCapturedPiece = enPassantCapture ?? capturedPiece;

  let capturedPieces = game.capturedPieces;

  if (actualCapturedPiece) {
    capturedPieces = [...capturedPieces, actualCapturedPiece];
  }

  // ======================================
  // EN PASSANT TARGET
  // ======================================

  let nextEnPassantTarget: Position | null = null;

  if (movingPiece.type === "pawn" && Math.abs(target.row - source.row) === 2) {
    nextEnPassantTarget = {
      row: (source.row + target.row) / 2,
      col: source.col,
    };
  }

  // ======================================
  // PROMOTION
  // ======================================

  const promotionRow = movingPiece.color === "white" ? 0 : 23;

  const reachesPromotion =
    movingPiece.type === "pawn" && target.row === promotionRow;

  const movesUsed = game.movesUsed + 1;

  let nextGame: GameState = {
    ...game,

    board: newBoard,

    selectedSquare: null,

    validMoves: [],

    movesUsed,

    capturedPieces,

    enPassantTarget: nextEnPassantTarget,
  };

  if (reachesPromotion) {
    nextGame = {
      ...nextGame,
      pendingPromotion: target,
    };
  }

  // ======================================
  // CHECK GAME OVER
  // ======================================

  const enemyColor = getOppositeColor(movingPiece.color);

  const enemyKings = getKingPositions(nextGame, enemyColor);

  if (enemyKings.length === 0) {
    return {
      ...nextGame,
      gameOver: true,
      winner: movingPiece.color,
    };
  }

  return nextGame;
}

// ========================================
// PROMOTION
// ========================================

export function promotePawn(
  game: GameState,
  type: Exclude<PieceType, "king" | "pawn">,
): GameState {
  if (!game.pendingPromotion) {
    return game;
  }

  const position = game.pendingPromotion;

  const square = game.board[position.row]?.[position.col];

  if (!square?.piece) {
    return {
      ...game,
      pendingPromotion: null,
    };
  }

  if (square.piece.type !== "pawn") {
    return {
      ...game,
      pendingPromotion: null,
    };
  }

  const newBoard = cloneBoard(game.board);

  newBoard[position.row][position.col].piece = {
    ...square.piece,
    type,
    hasMoved: true,
  };

  return {
    ...game,

    board: newBoard,

    pendingPromotion: null,
  };
}

// ========================================
// RECOVERY
// ========================================

export function selectRecoveryPiece(
  game: GameState,
  pieceId: string,
): GameState {
  if (game.pendingRecovery <= 0) {
    return game;
  }

  const piece = game.capturedPieces.find(
    (capturedPiece) => capturedPiece.id === pieceId,
  );

  if (!piece) {
    return game;
  }

  if (piece.color !== game.currentPlayer) {
    return game;
  }

  return {
    ...game,
    recoveryPieceId: pieceId,
  };
}

function isRecoverySquare(game: GameState, position: Position): boolean {
  const { row, col } = position;

  if (row < 0 || row >= 24 || col < 0 || col >= 24) {
    return false;
  }

  const isStartingRow =
    game.currentPlayer === "white"
      ? row === 23 || row === 22
      : row === 0 || row === 1;

  if (!isStartingRow) {
    return false;
  }

  return game.board[row][col].piece === null;
}

function recoverPieceToSquare(game: GameState, target: Position): GameState {
  if (!game.recoveryPieceId) {
    return game;
  }

  if (!isRecoverySquare(game, target)) {
    return game;
  }

  const piece = game.capturedPieces.find(
    (capturedPiece) => capturedPiece.id === game.recoveryPieceId,
  );

  if (!piece) {
    return {
      ...game,
      recoveryPieceId: null,
    };
  }

  if (piece.color !== game.currentPlayer) {
    return {
      ...game,
      recoveryPieceId: null,
    };
  }

  const newBoard = cloneBoard(game.board);

  newBoard[target.row][target.col].piece = {
    ...piece,
    hasMoved: false,
  };

  const remainingCaptured = game.capturedPieces.filter(
    (capturedPiece) => capturedPiece.id !== piece.id,
  );

  return {
    ...game,

    board: newBoard,

    capturedPieces: remainingCaptured,

    pendingRecovery: Math.max(0, game.pendingRecovery - 1),

    recoverySelection: [],

    recoveryPieceId: null,

    selectedSquare: null,

    validMoves: [],
  };
}

// ========================================
// TURN
// ========================================

export function switchTurn(game: GameState): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.movesUsed < game.movesAllowed && game.movesAllowed > 0) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  const nextPlayer = getOppositeColor(game.currentPlayer);

  let deck = game.unoDeck;

  // ======================================
  // DECK RECYCLING
  // ======================================

  if (deck.length === 0) {
    deck = createUnoDeck();
  }

  const { card: nextCard, remainingDeck } = drawUnoCard(deck);

  if (!nextCard) {
    return {
      ...game,
      currentPlayer: nextPlayer,
      movesAllowed: 1,
      movesUsed: 0,
      selectedSquare: null,
      validMoves: [],
      enPassantTarget: null,
      currentUnoCard: null,
      pendingRecovery: 0,
      recoveryPieceId: null,
    };
  }

  // ======================================
  // REVERSE
  // ======================================

  const boardReversed =
    nextCard.type === "reverse" ? !game.boardReversed : game.boardReversed;

  // ======================================
  // RECOVERY
  // ======================================

  let nextPendingRecovery = 0;

  if (nextCard.type === "draw2") {
    nextPendingRecovery = 2;
  }

  if (nextCard.type === "wildDraw4") {
    nextPendingRecovery = 4;
  }

  return {
    ...game,

    currentPlayer: nextPlayer,

    movesAllowed: getMovesAllowedFromCard(nextCard),

    movesUsed: 0,

    selectedSquare: null,

    validMoves: [],

    unoDeck: remainingDeck,

    unoDiscard: game.currentUnoCard
      ? [...game.unoDiscard, game.currentUnoCard]
      : game.unoDiscard,

    currentUnoCard: nextCard,

    enPassantTarget: null,

    boardReversed,

    pendingRecovery: nextPendingRecovery,

    recoverySelection: [],

    recoveryPieceId: null,

    skipNextTurn: false,

    pendingPromotion: null,
  };
}

// ========================================
// CHECK HELPERS
// ========================================

export function getCurrentPlayerKingsInCheck(game: GameState): Position[] {
  return getKingPositions(game, game.currentPlayer).filter((position) =>
    isKingInCheck(game, position),
  );
}

// ========================================
// RECOVERY INFO
// ========================================

export function getRecoverablePieces(game: GameState): Piece[] {
  if (game.pendingRecovery <= 0) {
    return [];
  }

  return game.capturedPieces.filter(
    (piece) => piece.color === game.currentPlayer,
  );
}
