"use client";

import { useRef, useState } from "react";

import { GameState, Position } from "@/types/game";

import { getCheckedKings } from "@/game/check";

import ChessSquare from "./ChessSquare";

interface ChessBoardProps {
  game: GameState;
  onSquareClick: (position: Position) => void;
}

const BOARD_SIZE = 24;
const SQUARE_SIZE = 48;

export default function ChessBoard({ game, onSquareClick }: ChessBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);

  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const checkedKings = [
    ...getCheckedKings(game, "white"),
    ...getCheckedKings(game, "black"),
  ];

  function isKingInCheck(position: Position): boolean {
    return checkedKings.some(
      (king) => king.row === position.row && king.col === position.col,
    );
  }

  // ========================================
  // ZOOM
  // ========================================

  function handleWheel(event: React.WheelEvent) {
    event.preventDefault();

    const zoomChange = event.deltaY > 0 ? -0.1 : 0.1;

    setZoom((currentZoom) =>
      Math.min(2, Math.max(0.5, Number((currentZoom + zoomChange).toFixed(2)))),
    );
  }

  function zoomIn() {
    setZoom((currentZoom) =>
      Math.min(2, Number((currentZoom + 0.1).toFixed(2))),
    );
  }

  function zoomOut() {
    setZoom((currentZoom) =>
      Math.max(0.5, Number((currentZoom - 0.1).toFixed(2))),
    );
  }

  function resetView() {
    setZoom(1);

    setOffset({
      x: 0,
      y: 0,
    });
  }

  // ========================================
  // ARRASTAR TABULEIRO
  // ========================================

  function handleMouseDown(event: React.MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    setDragging(true);

    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (!dragging) {
      return;
    }

    const deltaX = event.clientX - dragStart.current.x;

    const deltaY = event.clientY - dragStart.current.y;

    setOffset({
      x: dragStart.current.offsetX + deltaX,

      y: dragStart.current.offsetY + deltaY,
    });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  // ========================================
  // RENDERIZAÇÃO DO TABULEIRO
  // ========================================

  /*
   * Importante:
   *
   * O board real nunca é alterado.
   *
   * Apenas mudamos a ordem visual
   * das casas.
   */

  const displayRows = Array.from(
    {
      length: BOARD_SIZE,
    },
    (_, index) => index,
  );

  const displayCols = Array.from(
    {
      length: BOARD_SIZE,
    },
    (_, index) => index,
  );

  if (game.boardReversed) {
    displayRows.reverse();
    displayCols.reverse();
  }

  return (
    <div className="relative h-[75vh] min-h-[500px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* CONTROLES */}

      <div className="absolute right-4 top-4 z-20 flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
        <button
          type="button"
          onClick={zoomOut}
          className="px-4 py-2 text-lg font-bold text-white transition hover:bg-zinc-800"
        >
          −
        </button>

        <div className="flex min-w-[60px] items-center justify-center border-x border-zinc-700 px-2 text-sm text-zinc-300">
          {Math.round(zoom * 100)}%
        </div>

        <button
          type="button"
          onClick={zoomIn}
          className="px-4 py-2 text-lg font-bold text-white transition hover:bg-zinc-800"
        >
          +
        </button>

        <button
          type="button"
          onClick={resetView}
          className="border-l border-zinc-700 px-3 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
        >
          RESET
        </button>
      </div>

      {/* INDICADOR REVERSE */}

      {game.boardReversed && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg border border-purple-500/50 bg-purple-950/90 px-4 py-2 shadow-xl">
          <p className="text-xs font-black tracking-widest text-purple-400">
            REVERSE
          </p>

          <p className="mt-1 text-xs text-purple-200">Tabuleiro invertido</p>
        </div>
      )}

      {/* ÁREA DE ARRASTE */}

      <div
        ref={containerRef}
        className={`
          h-full
          w-full
          ${dragging ? "cursor-grabbing" : "cursor-grab"}
        `}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* TABULEIRO */}

        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: BOARD_SIZE * SQUARE_SIZE,

            transform: `translate(
              calc(-50% + ${offset.x}px),
              calc(-50% + ${offset.y}px)
            ) scale(${zoom})`,

            transformOrigin: "center center",
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, ${SQUARE_SIZE}px)`,

              width: BOARD_SIZE * SQUARE_SIZE,
            }}
          >
            {displayRows.flatMap((displayRow) =>
              displayCols.map((displayCol) => {
                /*
                 * displayRow/displayCol
                 * são posições visuais.
                 *
                 * actualRow/actualCol
                 * são as coordenadas reais.
                 */

                const actualRow = game.boardReversed
                  ? BOARD_SIZE - 1 - displayRow
                  : displayRow;

                const actualCol = game.boardReversed
                  ? BOARD_SIZE - 1 - displayCol
                  : displayCol;

                const square = game.board[actualRow][actualCol];

                const validMove = game.validMoves.some(
                  (move) => move.row === actualRow && move.col === actualCol,
                );

                const inCheck = isKingInCheck({
                  row: actualRow,
                  col: actualCol,
                });

                const selected =
                  game.selectedSquare?.row === actualRow &&
                  game.selectedSquare?.col === actualCol;

                return (
                  <ChessSquare
                    key={`${actualRow}-${actualCol}`}
                    row={actualRow}
                    col={actualCol}
                    piece={square.piece}
                    selected={selected}
                    validMove={validMove}
                    inCheck={inCheck}
                    onClick={onSquareClick}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* INSTRUÇÕES */}

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-400 shadow-lg">
        Arraste para mover • Scroll para zoom
      </div>

      {/* XEQUE */}

      {checkedKings.length > 0 && (
        <div className="pointer-events-none absolute left-4 top-20 z-20 rounded-lg border border-red-500/50 bg-red-950/90 px-4 py-2 shadow-xl">
          <p className="text-xs font-black tracking-widest text-red-400">
            XEQUE
          </p>

          <p className="mt-1 text-xs text-red-200">
            {checkedKings.length === 1
              ? "1 rei ameaçado"
              : `${checkedKings.length} reis ameaçados`}
          </p>
        </div>
      )}
    </div>
  );
}
