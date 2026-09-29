"use client";

import { GameState, PieceColor, Position } from "@/types/game";

import ChessSquare from "./ChessSquare";

import { getVisiblePositions, isPositionVisible } from "@/game/fog";

interface ChessBoardProps {
  game: GameState;
  playerColor: PieceColor;
  onSquareClick: (position: Position) => void;
}

function getSectorCount(boardSize: number): number {
  if (boardSize === 8) {
    return 1;
  }

  if (boardSize === 16) {
    return 2;
  }

  return 3;
}

function getSector(row: number, col: number, boardSize: number): number {
  const sectorCount = getSectorCount(boardSize);
  const sectorSize = boardSize / sectorCount;

  const sectorRow = Math.floor(row / sectorSize);
  const sectorCol = Math.floor(col / sectorSize);

  return sectorRow * sectorCount + sectorCol + 1;
}

function getSectorLabel(sector: number, boardSize: number): string {
  if (boardSize === 8) {
    return "";
  }

  return `S${sector}`;
}

function isRecoverySquare(game: GameState, row: number, col: number): boolean {
  return game.recoverySelection.some((piece) => {
    const boardPiece = game.board[row][col].piece;

    return boardPiece?.id === piece.id;
  });
}

export default function ChessBoard({
  game,
  playerColor,
  onSquareClick,
}: ChessBoardProps) {
  /*
   * O Fog é calculado individualmente para cada jogador.
   *
   * IMPORTANTE:
   *
   * Não usamos game.currentPlayer aqui.
   *
   * Se o jogador conectado for White, ele sempre
   * calcula o Fog usando as peças White.
   *
   * Se for Black, calcula usando as peças Black.
   */
  const visiblePositions = getVisiblePositions(game, playerColor);

  /*
   * Peças próprias continuam visíveis mesmo quando
   * estiverem fora do raio de outra peça.
   */
  const ownPiecePositions = new Set<string>();

  for (let row = 0; row < game.boardSize; row += 1) {
    for (let col = 0; col < game.boardSize; col += 1) {
      const piece = game.board[row][col].piece;

      if (piece?.color === playerColor) {
        ownPiecePositions.add(`${row}:${col}`);
      }
    }
  }

  function isVisible(row: number, col: number): boolean {
    const position = {
      row,
      col,
    };

    /*
     * A própria peça sempre aparece.
     */
    if (ownPiecePositions.has(`${row}:${col}`)) {
      return true;
    }

    return isPositionVisible(visiblePositions, position);
  }

  function handleSquareClick(position: Position) {
    /*
     * Não permite interação com casas completamente
     * escondidas pelo Fog.
     */
    if (!isVisible(position.row, position.col)) {
      return;
    }

    onSquareClick(position);
  }

  const cells = [];

  for (let row = 0; row < game.boardSize; row += 1) {
    for (let col = 0; col < game.boardSize; col += 1) {
      /*
       * Mantém o suporte ao tabuleiro invertido.
       */
      const actualRow = game.boardReversed ? game.boardSize - 1 - row : row;

      const actualCol = game.boardReversed ? game.boardSize - 1 - col : col;

      const square = game.board[actualRow][actualCol];

      const position: Position = {
        row: actualRow,
        col: actualCol,
      };

      const visible = isVisible(actualRow, actualCol);

      const piece = square.piece;

      /*
       * Peças inimigas fora da visão são escondidas.
       *
       * Peças próprias continuam visíveis.
       */
      const visiblePiece =
        visible || piece?.color === playerColor ? piece : null;

      const selected =
        game.selectedSquare?.row === actualRow &&
        game.selectedSquare?.col === actualCol;

      /*
       * Movimentos válidos também respeitam o Fog.
       *
       * Assim não revelamos uma casa escondida
       * através de indicadores de movimento.
       */
      const validMove =
        visible &&
        game.validMoves.some(
          (move) => move.row === actualRow && move.col === actualCol,
        );

      const recoveryTarget =
        visible && isRecoverySquare(game, actualRow, actualCol);

      /*
       * Mantém a indicação de Check apenas para
       * o rei do jogador local.
       */
      const inCheck =
        visible &&
        piece?.type === "king" &&
        piece.color === playerColor &&
        game.currentPlayer === playerColor;

      const sector = getSector(actualRow, actualCol, game.boardSize);

      const sectorLabel = getSectorLabel(sector, game.boardSize);

      const sectorCount = getSectorCount(game.boardSize);

      const sectorSize = game.boardSize / sectorCount;

      const isSectorBoundaryRight =
        game.boardSize > 8 &&
        (actualCol + 1) % sectorSize === 0 &&
        actualCol !== game.boardSize - 1;

      const isSectorBoundaryBottom =
        game.boardSize > 8 &&
        (actualRow + 1) % sectorSize === 0 &&
        actualRow !== game.boardSize - 1;

      cells.push(
        <div
          key={`${actualRow}-${actualCol}`}
          className="relative"
          style={{
            aspectRatio: "1 / 1",

            borderRight: isSectorBoundaryRight
              ? "2px solid rgba(255,255,255,0.18)"
              : undefined,

            borderBottom: isSectorBoundaryBottom
              ? "2px solid rgba(255,255,255,0.18)"
              : undefined,
          }}
        >
          <ChessSquare
            row={actualRow}
            col={actualCol}
            piece={visiblePiece}
            selected={selected}
            validMove={validMove}
            recoveryTarget={recoveryTarget}
            inCheck={inCheck}
            onClick={() => handleSquareClick(position)}
          />

          {sectorLabel &&
            actualRow % sectorSize === 0 &&
            actualCol % sectorSize === 0 && (
              <div className="pointer-events-none absolute left-1 top-1 z-20 text-[8px] font-bold text-white/30">
                {sectorLabel}
              </div>
            )}

          {/*
           * Fog visual.
           *
           * A casa continua existindo normalmente no
           * GameState, mas fica visualmente bloqueada.
           */}
          {!visible && (
            <div
              className="pointer-events-none absolute inset-0 z-30"
              style={{
                background: "rgba(0, 0, 0, 0.82)",
                backdropFilter: "brightness(0.35)",
              }}
            />
          )}
        </div>,
      );
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-700 shadow-2xl">
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${game.boardSize}, minmax(0, 1fr))`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
