"use client";

import { GameState, Piece } from "@/types/game";

interface GameUIProps {
  game: GameState;
  onEndTurn: () => void;
  onRecoveryPiece: (pieceId: string) => void;
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

function getUnoCardLabel(game: GameState): string {
  const card = game.currentUnoCard;

  if (!card) {
    return "—";
  }

  switch (card.type) {
    case "number":
      return String(card.value ?? 0);

    case "skip":
      return "SKIP";

    case "reverse":
      return "↻";

    case "draw2":
      return "+2";

    case "wildDraw4":
      return "+4";

    default:
      return "?";
  }
}

function getUnoCardClass(game: GameState): string {
  const card = game.currentUnoCard;

  if (!card) {
    return "bg-zinc-800 border-zinc-700";
  }

  if (card.type === "wildDraw4") {
    return "bg-zinc-950 border-white";
  }

  switch (card.color) {
    case "red":
      return "bg-red-600 border-red-400";

    case "yellow":
      return "bg-yellow-400 border-yellow-200 text-black";

    case "green":
      return "bg-green-600 border-green-400";

    case "blue":
      return "bg-blue-600 border-blue-400";

    default:
      return "bg-zinc-800 border-zinc-700";
  }
}

function getUnoDescription(game: GameState): string {
  const card = game.currentUnoCard;

  if (!card) {
    return "Nenhuma carta.";
  }

  switch (card.type) {
    case "number":
      return `Você pode fazer ${card.value ?? 0} movimento(s).`;

    case "skip":
      return "Você perde esta rodada.";

    case "reverse":
      return "O tabuleiro é invertido visualmente.";

    case "draw2":
      return "Você pode recuperar 2 peças capturadas.";

    case "wildDraw4":
      return "Você pode recuperar 4 peças capturadas.";

    default:
      return "";
  }
}

function getPieceName(piece: Piece): string {
  switch (piece.type) {
    case "king":
      return "Rei";

    case "queen":
      return "Dama";

    case "rook":
      return "Torre";

    case "bishop":
      return "Bispo";

    case "knight":
      return "Cavalo";

    case "pawn":
      return "Peão";

    default:
      return piece.type;
  }
}

export default function GameUI({
  game,
  onEndTurn,
  onRecoveryPiece,
}: GameUIProps) {
  const currentPlayerLabel =
    game.currentPlayer === "white" ? "BRANCAS" : "PRETAS";

  const canEndTurn =
    game.movesAllowed === 0 || game.movesUsed >= game.movesAllowed;

  const recoverablePieces = game.capturedPieces.filter(
    (piece) => piece.color === game.currentPlayer,
  );

  return (
    <aside className="space-y-4">
      {/* ================================= */}
      {/* TURN */}
      {/* ================================= */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-bold tracking-[0.25em] text-zinc-500">
          TURNO
        </p>

        <p className="mt-1 text-2xl font-black">{currentPlayerLabel}</p>
      </section>

      {/* ================================= */}
      {/* UNO CARD */}
      {/* ================================= */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-bold tracking-[0.25em] text-zinc-500">
          CARTA UNO
        </p>

        <div
          className={`
            mt-3
            flex
            aspect-[3/4]
            max-h-64
            items-center
            justify-center
            rounded-2xl
            border-4
            shadow-xl
            ${getUnoCardClass(game)}
          `}
        >
          <span className="text-6xl font-black">{getUnoCardLabel(game)}</span>
        </div>

        <p className="mt-3 text-sm text-zinc-400">{getUnoDescription(game)}</p>
      </section>

      {/* ================================= */}
      {/* MOVES */}
      {/* ================================= */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Movimentos</span>

          <span className="text-xl font-black">
            {game.movesUsed} / {game.movesAllowed}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{
              width:
                game.movesAllowed === 0
                  ? "100%"
                  : `${Math.min(
                      100,
                      (game.movesUsed / game.movesAllowed) * 100,
                    )}%`,
            }}
          />
        </div>
      </section>

      {/* ================================= */}
      {/* RECOVERY */}
      {/* ================================= */}

      {game.pendingRecovery > 0 && (
        <section className="rounded-2xl border border-yellow-700 bg-yellow-950/40 p-4">
          <p className="text-xs font-bold tracking-[0.2em] text-yellow-400">
            RECUPERAÇÃO
          </p>

          <p className="mt-2 text-lg font-black">
            {game.pendingRecovery} peça(s)
          </p>

          <p className="mt-1 text-xs text-yellow-200/70">
            Escolha uma peça capturada e depois clique em uma casa vazia da sua
            posição inicial.
          </p>

          {game.recoveryPieceId && (
            <p className="mt-3 rounded-lg bg-yellow-500/20 px-3 py-2 text-xs font-bold text-yellow-300">
              Agora escolha uma casa vazia no tabuleiro.
            </p>
          )}

          <div className="mt-4 space-y-2">
            {recoverablePieces.length === 0 && (
              <p className="text-sm text-zinc-500">
                Nenhuma peça capturada disponível.
              </p>
            )}

            {recoverablePieces.map((piece) => {
              const symbol = pieceSymbols[piece.color][piece.type];

              const selected = game.recoveryPieceId === piece.id;

              return (
                <button
                  key={piece.id}
                  type="button"
                  onClick={() => onRecoveryPiece(piece.id)}
                  className={`
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      border
                      px-3
                      py-2
                      text-left
                      transition
                      ${
                        selected
                          ? "border-yellow-400 bg-yellow-400/20"
                          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                      }
                    `}
                >
                  <span
                    className={`
                        text-3xl
                        leading-none
                        ${
                          piece.color === "white"
                            ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]"
                            : "text-zinc-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"
                        }
                      `}
                  >
                    {symbol}
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-bold">
                      {getPieceName(piece)}
                    </span>

                    <span className="block text-[10px] text-zinc-500">
                      {piece.type.toUpperCase()}
                    </span>
                  </span>

                  {selected && (
                    <span className="text-xs font-black text-yellow-400">
                      SELECIONADA
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================= */}
      {/* KINGS */}
      {/* ================================= */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-bold tracking-[0.25em] text-zinc-500">
          REIS
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-zinc-800 p-3">
            <p className="text-xs text-zinc-500">BRANCAS</p>

            <p className="mt-1 text-2xl font-black">
              {
                game.board
                  .flat()
                  .filter(
                    (square) =>
                      square.piece?.color === "white" &&
                      square.piece?.type === "king",
                  ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-zinc-800 p-3">
            <p className="text-xs text-zinc-500">PRETAS</p>

            <p className="mt-1 text-2xl font-black">
              {
                game.board
                  .flat()
                  .filter(
                    (square) =>
                      square.piece?.color === "black" &&
                      square.piece?.type === "king",
                  ).length
              }
            </p>
          </div>
        </div>
      </section>

      {/* ================================= */}
      {/* END TURN */}
      {/* ================================= */}

      <button
        type="button"
        onClick={onEndTurn}
        disabled={
          !canEndTurn ||
          game.pendingRecovery > 0 ||
          Boolean(game.recoveryPieceId)
        }
        className="w-full rounded-xl bg-white px-4 py-3 font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ENCERRAR TURNO
      </button>

      {/* ================================= */}
      {/* GAME OVER */}
      {/* ================================= */}

      {game.gameOver && (
        <section className="rounded-2xl border border-yellow-500 bg-yellow-500/10 p-4 text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-yellow-400">
            FIM DE JOGO
          </p>

          <p className="mt-2 text-2xl font-black">
            {game.winner === "white" ? "BRANCAS VENCERAM" : "PRETAS VENCERAM"}
          </p>
        </section>
      )}
    </aside>
  );
}
