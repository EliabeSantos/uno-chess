"use client";

import { GameState, Position } from "@/types/game";

import ChessSquare from "./ChessSquare";

import { isKingInCheck } from "@/game/check";

interface ChessBoardProps {
  game: GameState;
  onSquareClick: (position: Position) => void;
}

function isRecoverySquare(game: GameState, row: number, col: number): boolean {
  if (game.pendingRecovery <= 0 || !game.recoveryPieceId) {
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

function getSector(col: number): number {
  return Math.floor(col / 8);
}

function getSectorLabel(sector: number): string {
  switch (sector) {
    case 0:
      return "SETOR I";

    case 1:
      return "SETOR II";

    case 2:
      return "SETOR III";

    default:
      return "";
  }
}

export default function ChessBoard({ game, onSquareClick }: ChessBoardProps) {
  const boardSize = game.boardSize;

  const showSectorLabels = boardSize >= 16;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
      {game.boardReversed && (
        <div className="absolute left-4 top-4 z-30 rounded-lg border border-purple-400/40 bg-purple-950/90 px-3 py-2 text-xs font-black tracking-[0.2em] text-purple-300 shadow-lg">
          REVERSE
        </div>
      )}

      {game.recoveryPieceId && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-cyan-300/50 bg-cyan-950/95 px-4 py-2 text-xs font-black tracking-[0.15em] text-cyan-200 shadow-lg">
          RECUPERAÇÃO — ESCOLHA UMA CASA
        </div>
      )}

      <div
        className="relative grid aspect-square w-full"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
        }}
      >
        {Array.from(
          {
            length: boardSize,
          },
          (_, visualRow) =>
            Array.from(
              {
                length: boardSize,
              },
              (_, visualCol) => {
                const actualRow = game.boardReversed
                  ? boardSize - 1 - visualRow
                  : visualRow;

                const actualCol = game.boardReversed
                  ? boardSize - 1 - visualCol
                  : visualCol;

                const square = game.board[actualRow][actualCol];

                const selected = Boolean(
                  game.selectedSquare &&
                  game.selectedSquare.row === actualRow &&
                  game.selectedSquare.col === actualCol,
                );

                const validMove = game.validMoves.some(
                  (move) => move.row === actualRow && move.col === actualCol,
                );

                const recoveryTarget = isRecoverySquare(
                  game,
                  actualRow,
                  actualCol,
                );

                const piece = square.piece;

                const inCheck =
                  piece?.type === "king" &&
                  isKingInCheck(game, {
                    row: actualRow,
                    col: actualCol,
                  });

                const sector = getSector(actualCol);

                const isSectorBoundary =
                  showSectorLabels &&
                  (actualCol === 8 || actualCol === 16) &&
                  actualCol < boardSize;

                const isRowBoundary =
                  showSectorLabels &&
                  (actualRow === 8 || actualRow === 16) &&
                  actualRow < boardSize;

                return (
                  <div
                    key={`${actualRow}-${actualCol}`}
                    className={`
                      relative
                      ${isSectorBoundary ? "border-l-2 border-zinc-950" : ""}
                      ${isRowBoundary ? "border-t-2 border-zinc-950" : ""}
                    `}
                  >
                    <ChessSquare
                      row={actualRow}
                      col={actualCol}
                      piece={piece}
                      selected={selected}
                      validMove={validMove}
                      recoveryTarget={recoveryTarget}
                      inCheck={inCheck}
                      onClick={onSquareClick}
                    />

                    {showSectorLabels &&
                      actualRow === boardSize - 1 &&
                      actualCol % 8 === 0 && (
                        <div className="pointer-events-none absolute bottom-1 left-1 z-10 rounded bg-black/50 px-1 py-0.5 text-[7px] font-black tracking-widest text-white/60">
                          {getSectorLabel(sector)}
                        </div>
                      )}
                  </div>
                );
              },
            ),
        )}

        {showSectorLabels && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 border-l-2 border-zinc-950/90" />

            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 border-t-2 border-zinc-950/90" />
          </>
        )}
      </div>

      {game.recoveryPieceId && (
        <div className="mt-2 rounded-lg border border-cyan-900 bg-cyan-950/50 px-3 py-2 text-center text-xs text-cyan-200">
          A peça selecionada será recolocada em uma casa inicial vazia.
        </div>
      )}
    </div>
  );
}
