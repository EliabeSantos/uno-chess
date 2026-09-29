"use client";

import Image from "next/image";
import { Piece, Position } from "@/types/game";

interface ChessSquareProps {
  row: number;
  col: number;
  piece: Piece | null;
  selected: boolean;
  validMove: boolean;
  recoveryTarget: boolean;
  inCheck: boolean;
  onClick: (position: Position) => void;
}

const pieceImages: Record<Piece["color"], Record<Piece["type"], string>> = {
  white: {
    king: "/pieces/Rei.png",
    queen: "/pieces/Rainha.png",
    rook: "/pieces/Torre.png",
    bishop: "/pieces/Bispo.png",
    knight: "/pieces/Cavalo.png",
    pawn: "/pieces/Peao.png",
  },

  black: {
    king: "/pieces/Rei p.png",
    queen: "/pieces/Rainha p.png",
    rook: "/pieces/Torre p.png",
    bishop: "/pieces/Bispo p.png",
    knight: "/pieces/Cavalo p.png",
    pawn: "/pieces/Peao p.png",
  },
};

export default function ChessSquare({
  row,
  col,
  piece,
  selected,
  validMove,
  recoveryTarget,
  inCheck,
  onClick,
}: ChessSquareProps) {
  const isDark = (row + col) % 2 === 1;

  const pieceImage = piece ? pieceImages[piece.color][piece.type] : null;

  return (
    <button
      type="button"
      onClick={() =>
        onClick({
          row,
          col,
        })
      }
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
        ${
          recoveryTarget ? "bg-cyan-500/70 ring-2 ring-cyan-300 ring-inset" : ""
        }
        ${inCheck ? "bg-red-600/80 ring-4 ring-red-400 ring-inset" : ""}
        hover:brightness-110
      `}
    >
      {/* ================================= */}
      {/* NORMAL MOVE INDICATOR */}
      {/* ================================= */}

      {validMove && !piece && (
        <span className="h-2/5 w-2/5 rounded-full bg-black/30" />
      )}

      {/* ================================= */}
      {/* RECOVERY TARGET */}
      {/* ================================= */}

      {recoveryTarget && !piece && (
        <span className="flex h-2/5 w-2/5 items-center justify-center rounded-full bg-cyan-200/80">
          <span className="text-[clamp(0.4rem,1vw,0.8rem)] font-black text-cyan-950">
            +
          </span>
        </span>
      )}

      {/* ================================= */}
      {/* PIECE */}
      {/* ================================= */}

      {piece && pieceImage && (
        <span
          className={`
            relative
            flex
            h-[88%]
            w-[88%]
            items-center
            justify-center
            select-none
            transition-transform
            ${inCheck ? "scale-110" : ""}
          `}
        >
          <Image
            src={pieceImage}
            alt={`${piece.color} ${piece.type}`}
            fill
            sizes="(max-width: 768px) 10vw, 5vw"
            className="object-contain"
            draggable={false}
          />
        </span>
      )}
    </button>
  );
}
