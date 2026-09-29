"use client";

import { useRef, useState } from "react";

import { GameState, Position } from "@/types/game";

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

  function handleWheel(event: React.WheelEvent) {
    event.preventDefault();

    const zoomChange = event.deltaY > 0 ? -0.1 : 0.1;

    setZoom((currentZoom) =>
      Math.min(2, Math.max(0.5, Number((currentZoom + zoomChange).toFixed(2)))),
    );
  }

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

      {/* ÁREA NAVEGÁVEL */}
      <div
        ref={containerRef}
        className={`h-full w-full ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
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
            {game.board.flat().map((square) => {
              const validMove = game.validMoves.some(
                (move) => move.row === square.row && move.col === square.col,
              );

              return (
                <ChessSquare
                  key={`${square.row}-${square.col}`}
                  row={square.row}
                  col={square.col}
                  piece={square.piece}
                  selected={
                    game.selectedSquare?.row === square.row &&
                    game.selectedSquare?.col === square.col
                  }
                  validMove={validMove}
                  onClick={onSquareClick}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* INSTRUÇÃO */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-400 shadow-lg">
        Arraste para mover • Scroll para zoom
      </div>
    </div>
  );
}
