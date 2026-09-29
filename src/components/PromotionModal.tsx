"use client";

import { PieceColor, PieceType } from "@/types/game";

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (type: Exclude<PieceType, "king" | "pawn">) => void;
}

const promotionPieces: Array<{
  type: Exclude<PieceType, "king" | "pawn">;
  name: string;
  whiteSymbol: string;
  blackSymbol: string;
}> = [
  {
    type: "queen",
    name: "Dama",
    whiteSymbol: "♕",
    blackSymbol: "♛",
  },
  {
    type: "rook",
    name: "Torre",
    whiteSymbol: "♖",
    blackSymbol: "♜",
  },
  {
    type: "bishop",
    name: "Bispo",
    whiteSymbol: "♗",
    blackSymbol: "♝",
  },
  {
    type: "knight",
    name: "Cavalo",
    whiteSymbol: "♘",
    blackSymbol: "♞",
  },
];

export default function PromotionModal({
  color,
  onSelect,
}: PromotionModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[min(90%,420px)] rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-zinc-500">
            PROMOÇÃO
          </p>

          <h2 className="mt-2 text-2xl font-black">Escolha uma peça</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Seu peão chegou ao final do tabuleiro.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {promotionPieces.map((promotion) => {
            const symbol =
              color === "white" ? promotion.whiteSymbol : promotion.blackSymbol;

            return (
              <button
                key={promotion.type}
                type="button"
                onClick={() => onSelect(promotion.type)}
                className="flex flex-col items-center rounded-xl border border-zinc-700 bg-zinc-800 p-3 transition hover:border-zinc-400 hover:bg-zinc-700"
              >
                <span
                  className={`
                      text-5xl
                      leading-none
                      ${
                        color === "white"
                          ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                          : "text-zinc-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"
                      }
                    `}
                >
                  {symbol}
                </span>

                <span className="mt-2 text-xs font-bold text-zinc-400">
                  {promotion.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
