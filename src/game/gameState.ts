import {
  BoardLayout,
  BoardSize,
  GameState,
  Piece,
  PieceColor,
  PieceType,
  Position,
  UnoCard,
} from "@/types/game";

import { createBoard, getBoardSize } from "./board";

import { createUnoDeck, drawUnoCard } from "./uno";

import { getValidMoves } from "./movement";

import { getKingPositions, isKingInCheck } from "./check";

import { getVisiblePositions } from "./fog";

// ========================================
// BOARD HELPERS
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

// ========================================
// UNO HELPERS
// ========================================

function getMovesAllowedFromCard(card: UnoCard | null): number {
  if (!card) {
    return 1;
  }

  switch (card.type) {
    case "number":
      return card.value ?? 0;

    case "skip":
      return 0;

    case "reverse":
      return 1;

    case "draw2":
      return 1;

    case "wildDraw4":
      return 1;

    case "colorSwap":
      return 1;

    default:
      return 1;
  }
}

function getRecoveryAmountFromCard(card: UnoCard | null): number {
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

// ========================================
// COLOR
// ========================================

function getOppositeColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

// ========================================
// RECOVERY
// ========================================

function getRecoverablePiecesInternal(game: GameState): Piece[] {
  return game.capturedPieces.filter(
    (piece) => piece.color === game.currentPlayer,
  );
}

function hasRecoverablePieces(game: GameState): boolean {
  return getRecoverablePiecesInternal(game).length > 0;
}

// ========================================
// INITIAL GAME
// ========================================

export function createInitialGameState(layout: BoardLayout = 3): GameState {
  const boardSize = getBoardSize(layout);

  const deck = createUnoDeck();

  const { card, remainingDeck } = drawUnoCard(deck);

  const initialCard = card;

  if (initialCard?.type === "skip") {
    const { card: nextCard, remainingDeck: nextDeck } =
      drawUnoCard(remainingDeck);

    return createStateFromInitialCard(nextCard, nextDeck, boardSize, layout);
  }

  return createStateFromInitialCard(
    initialCard,
    remainingDeck,
    boardSize,
    layout,
  );
}

function createStateFromInitialCard(
  card: UnoCard | null,
  deck: UnoCard[],
  boardSize: BoardSize,
  boardLayout: BoardLayout,
): GameState {
  return {
    board: createBoard(boardSize),

    boardSize,

    boardLayout,

    currentPlayer: "white",

    movesAllowed: getMovesAllowedFromCard(card),

    movesUsed: 0,

    selectedSquare: null,

    validMoves: [],

    unoDeck: deck,

    unoDiscard: [],

    currentUnoCard: card,

    capturedPieces: [],

    enPassantTarget: null,

    boardReversed: false,

    pendingRecovery: getRecoveryAmountFromCard(card),

    recoverySelection: [],

    recoveryPieceId: null,

    pendingColorSwap: card?.type === "colorSwap",

    colorSwapTarget: null,

    gameOver: false,

    winner: null,

    pendingPromotion: null,
  };
}

// ========================================
// MOVEMENT
// ========================================

function canMakeMove(game: GameState): boolean {
  if (game.gameOver) {
    return false;
  }

  if (game.pendingPromotion) {
    return false;
  }

  if (game.pendingColorSwap) {
    return false;
  }

  if (game.movesUsed >= game.movesAllowed) {
    return false;
  }

  return true;
}

export function selectSquare(game: GameState, position: Position): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  if (game.pendingColorSwap) {
    return selectColorSwapPiece(game, position);
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

  let enPassantCapture: Piece | null = null;

  // ========================================
  // EN PASSANT
  // ========================================

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

  // ========================================
  // CASTLING
  // ========================================

  if (movingPiece.type === "king" && Math.abs(target.col - source.col) === 2) {
    const direction = target.col > source.col ? 1 : -1;

    const sectorStart = Math.floor(source.col / 8) * 8;

    const rookSourceCol = direction === 1 ? sectorStart + 7 : sectorStart;

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

  // ========================================
  // MOVIMENTO
  // ========================================

  newBoard[source.row][source.col].piece = null;

  newBoard[target.row][target.col].piece = {
    ...movingPiece,
    hasMoved: true,
  };

  // ========================================
  // CAPTURA
  // ========================================

  const actualCapturedPiece = enPassantCapture ?? capturedPiece;

  let capturedPieces = game.capturedPieces;

  if (actualCapturedPiece) {
    capturedPieces = [...capturedPieces, actualCapturedPiece];
  }

  // ========================================
  // EN PASSANT TARGET
  // ========================================

  let nextEnPassantTarget: Position | null = null;

  if (movingPiece.type === "pawn" && Math.abs(target.row - source.row) === 2) {
    nextEnPassantTarget = {
      row: (source.row + target.row) / 2,
      col: source.col,
    };
  }

  // ========================================
  // PROMOTION
  // ========================================

  const promotionRow = movingPiece.color === "white" ? 0 : game.boardSize - 1;

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

  // ========================================
  // VITÓRIA
  // ========================================

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

  if (row < 0 || row >= game.boardSize || col < 0 || col >= game.boardSize) {
    return false;
  }

  const isStartingRow =
    game.currentPlayer === "white"
      ? row === game.boardSize - 1 || row === game.boardSize - 2
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
// COLOR SWAP
// ========================================

function isPositionEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Determina qual peça inimiga é a mais avançada.
 *
 * White:
 * quanto menor a row, mais avançada.
 *
 * Black:
 * quanto maior a row, mais avançada.
 *
 * Reis são ignorados.
 *
 * Apenas peças dentro da visão do jogador
 * podem ser consideradas.
 */
function findMostAdvancedEnemyPiece(game: GameState): Position | null {
  const enemyColor = getOppositeColor(game.currentPlayer);

  const visiblePositions = getVisiblePositions(game, game.currentPlayer);

  let bestPosition: Position | null = null;

  let bestProgress = -Infinity;

  for (let row = 0; row < game.boardSize; row += 1) {
    for (let col = 0; col < game.boardSize; col += 1) {
      const piece = game.board[row][col].piece;

      if (!piece) {
        continue;
      }

      if (piece.color !== enemyColor) {
        continue;
      }

      if (piece.type === "king") {
        continue;
      }

      const position = {
        row,
        col,
      };

      if (!visiblePositions.has(`${row}:${col}`)) {
        continue;
      }

      /*
       * White avança em direção à row 0.
       * Black avança em direção à última row.
       */
      const progress = enemyColor === "white" ? game.boardSize - 1 - row : row;

      if (progress > bestProgress) {
        bestProgress = progress;

        bestPosition = position;
      }
    }
  }

  return bestPosition;
}

/**
 * Ativa a carta Troca de Cor.
 *
 * A peça inimiga é identificada automaticamente.
 */
export function activateColorSwap(game: GameState): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.currentUnoCard?.type !== "colorSwap") {
    return game;
  }

  if (game.pendingColorSwap) {
    return game;
  }

  const target = findMostAdvancedEnemyPiece(game);

  if (!target) {
    return game;
  }

  return {
    ...game,

    pendingColorSwap: true,

    colorSwapTarget: target,

    selectedSquare: null,

    validMoves: [],
  };
}

/**
 * Seleciona a peça própria que será usada
 * na Troca de Cor.
 */
export function selectColorSwapPiece(
  game: GameState,
  position: Position,
): GameState {
  if (!game.pendingColorSwap) {
    return game;
  }

  if (!game.colorSwapTarget) {
    return {
      ...game,
      pendingColorSwap: false,
    };
  }

  const selectedPiece = game.board[position.row]?.[position.col]?.piece;

  if (!selectedPiece) {
    return game;
  }

  if (selectedPiece.color !== game.currentPlayer) {
    return game;
  }

  /*
   * O alvo da troca nunca pode ser o próprio Rei,
   * e a peça escolhida também não pode ser o Rei.
   */
  if (selectedPiece.type === "king") {
    return game;
  }

  return executeColorSwap(game, position);
}

/**
 * Executa a troca das duas peças.
 */
function executeColorSwap(
  game: GameState,
  ownPiecePosition: Position,
): GameState {
  if (!game.colorSwapTarget) {
    return game;
  }

  const target = game.colorSwapTarget;

  const ownPiece =
    game.board[ownPiecePosition.row]?.[ownPiecePosition.col]?.piece;

  const enemyPiece = game.board[target.row]?.[target.col]?.piece;

  if (!ownPiece) {
    return game;
  }

  if (!enemyPiece) {
    return {
      ...game,
      pendingColorSwap: false,
      colorSwapTarget: null,
    };
  }

  if (ownPiece.color !== game.currentPlayer) {
    return game;
  }

  if (enemyPiece.color === game.currentPlayer) {
    return game;
  }

  if (ownPiece.type === "king" || enemyPiece.type === "king") {
    return game;
  }

  const newBoard = cloneBoard(game.board);

  newBoard[ownPiecePosition.row][ownPiecePosition.col].piece = {
    ...enemyPiece,
  };

  newBoard[target.row][target.col].piece = {
    ...ownPiece,
  };

  const nextGame: GameState = {
    ...game,

    board: newBoard,

    pendingColorSwap: false,

    colorSwapTarget: null,

    selectedSquare: null,

    validMoves: [],
  };

  /*
   * A troca pode colocar um Rei adversário em
   * situação diferente, mas não move Reis.
   *
   * Vitória continua sendo baseada na existência
   * dos três Reis.
   */
  const enemyColor = getOppositeColor(game.currentPlayer);

  const enemyKings = getKingPositions(nextGame, enemyColor);

  if (enemyKings.length === 0) {
    return {
      ...nextGame,
      gameOver: true,
      winner: game.currentPlayer,
    };
  }

  return nextGame;
}

// ========================================
// DRAW NEXT UNO CARD
// ========================================

function drawNextUnoCard(
  game: GameState,
  startingPlayer: PieceColor,
): GameState {
  let deck = game.unoDeck;

  if (deck.length === 0) {
    deck = createUnoDeck();
  }

  const { card, remainingDeck } = drawUnoCard(deck);

  if (!card) {
    return {
      ...game,

      currentPlayer: startingPlayer,

      movesAllowed: 1,

      movesUsed: 0,

      selectedSquare: null,

      validMoves: [],

      enPassantTarget: null,

      currentUnoCard: null,

      pendingRecovery: 0,

      recoveryPieceId: null,

      pendingColorSwap: false,

      colorSwapTarget: null,
    };
  }

  const boardReversed =
    card.type === "reverse" ? !game.boardReversed : game.boardReversed;

  const unoDiscard = game.currentUnoCard
    ? [...game.unoDiscard, game.currentUnoCard]
    : game.unoDiscard;

  if (card.type === "skip") {
    const skippedPlayer = startingPlayer;

    const nextPlayer = getOppositeColor(skippedPlayer);

    const skippedGame: GameState = {
      ...game,

      currentPlayer: nextPlayer,

      movesAllowed: 0,

      movesUsed: 0,

      selectedSquare: null,

      validMoves: [],

      unoDeck: remainingDeck,

      unoDiscard,

      currentUnoCard: card,

      enPassantTarget: null,

      boardReversed,

      pendingRecovery: 0,

      recoverySelection: [],

      recoveryPieceId: null,

      pendingColorSwap: false,

      colorSwapTarget: null,

      pendingPromotion: null,
    };

    return drawNextUnoCard(skippedGame, nextPlayer);
  }

  return {
    ...game,

    currentPlayer: startingPlayer,

    movesAllowed: getMovesAllowedFromCard(card),

    movesUsed: 0,

    selectedSquare: null,

    validMoves: [],

    unoDeck: remainingDeck,

    unoDiscard,

    currentUnoCard: card,

    enPassantTarget: null,

    boardReversed,

    pendingRecovery: getRecoveryAmountFromCard(card),

    recoverySelection: [],

    recoveryPieceId: null,

    pendingColorSwap: false,

    colorSwapTarget: null,

    pendingPromotion: null,
  };
}

// ========================================
// SWITCH TURN
// ========================================

export function switchTurn(game: GameState): GameState {
  if (game.gameOver) {
    return game;
  }

  if (game.pendingPromotion) {
    return game;
  }

  if (game.pendingColorSwap) {
    return game;
  }

  if (game.movesUsed < game.movesAllowed && game.movesAllowed > 0) {
    return game;
  }

  if (
    game.pendingRecovery > 0 &&
    hasRecoverablePieces(game) &&
    game.recoveryPieceId
  ) {
    return game;
  }

  const nextPlayer = getOppositeColor(game.currentPlayer);

  return drawNextUnoCard(game, nextPlayer);
}

// ========================================
// CHECK
// ========================================

export function getCurrentPlayerKingsInCheck(game: GameState): Position[] {
  return getKingPositions(game, game.currentPlayer).filter((position) =>
    isKingInCheck(game, position),
  );
}

// ========================================
// RECOVERY HELPERS
// ========================================

export function getRecoverablePieces(game: GameState): Piece[] {
  return getRecoverablePiecesInternal(game);
}

export function canPassRecovery(game: GameState): boolean {
  if (game.pendingRecovery <= 0) {
    return true;
  }

  return !hasRecoverablePieces(game);
}
