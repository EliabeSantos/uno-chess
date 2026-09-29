"use client";

import { Piece, Position } from "@/types/game";

interface ChessSquareProps {
  row: number;
  col: number;
  piece: Piece | null;
  selected: boolean;
  validMove: boolean;
  inCheck: boolean;
  onClick: (position: Position) => void;
}

const pieceSymbols: Record<Piece["color"], Record<Piece["type"], string>> = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
};

export default function ChessSquare({
  row,
  col,
  piece,
  selected,
  validMove,
  inCheck,
  onClick,
}: ChessSquareProps) {
  const isDark = (row + col) % 2 === 1;

  return (
    <button
      type="button"
      onClick={() => onClick({ row, col })}
      className={`
        relative
        flex
        aspect-square
        w-full
        items-center
        justify-center
        border-0
        p-0
        transition

        ${isDark ? "bg-emerald-800" : "bg-amber-100"}

        ${selected ? "ring-4 ring-yellow-400 ring-inset" : ""}

        ${validMove ? "bg-yellow-500/60" : ""}

        ${inCheck ? "bg-red-600/80 ring-4 ring-red-400 ring-inset" : ""}

        hover:brightness-110
      `}
    >
      {validMove && !piece && (
        <span className="h-2/5 w-2/5 rounded-full bg-black/30" />
      )}

      {piece && (
        <span
          className={`
            select-none
            text-[clamp(0.5rem,2vw,2rem)]
            leading-none

            ${
              piece.color === "white"
                ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                : "text-zinc-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"
            }

            ${inCheck ? "scale-110" : ""}
          `}
        >
          {pieceSymbols[piece.color][piece.type]}
        </span>
      )}
    </button>
  );
}
