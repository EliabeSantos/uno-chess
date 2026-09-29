"use client";

import { GameState, Piece } from "@/types/game";

import { getChessGameStatus, getCheckedKings } from "@/game/check";

interface GameUIProps {
  game: GameState;
  onEndTurn: () => void;
  onRecoveryPiece: (pieceId: string) => void;
  onActivateColorSwap: () => void;
}

function getPieceSymbol(piece: Piece): string {
  const symbols: Record<Piece["color"], Record<Piece["type"], string>> = {
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

  return symbols[piece.color][piece.type];
}

function getStatusLabel(status: ReturnType<typeof getChessGameStatus>): string {
  switch (status) {
    case "check":
      return "CHECK";

    case "checkmate":
      return "CHECKMATE";

    case "stalemate":
      return "STALEMATE";

    default:
      return "NORMAL";
  }
}

function getStatusClasses(
  status: ReturnType<typeof getChessGameStatus>,
): string {
  switch (status) {
    case "check":
      return "border-red-500/50 bg-red-950/60 text-red-300";

    case "checkmate":
      return "border-red-500 bg-red-950 text-red-200";

    case "stalemate":
      return "border-yellow-500/50 bg-yellow-950/60 text-yellow-300";

    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }
}

export default function GameUI({
  game,
  onEndTurn,
  onRecoveryPiece,
  onActivateColorSwap,
}: GameUIProps) {
  const currentPlayer = game.currentPlayer;

  const chessStatus = getChessGameStatus(game, currentPlayer);

  const checkedKings = getCheckedKings(game, currentPlayer);

  const recoverablePieces = game.capturedPieces.filter(
    (piece) => piece.color === game.currentPlayer,
  );

  const hasRecoverablePieces = recoverablePieces.length > 0;

  const movementFinished =
    game.movesAllowed === 0 || game.movesUsed >= game.movesAllowed;

  const recoveryFinished = game.pendingRecovery <= 0;

  const recoveryUnavailable = game.pendingRecovery > 0 && !hasRecoverablePieces;

  const colorSwapFinished = !game.pendingColorSwap;

  const canEndTurn =
    movementFinished &&
    (recoveryFinished || recoveryUnavailable) &&
    colorSwapFinished;

  const whiteKings = game.board
    .flat()
    .filter(
      (square) =>
        square.piece?.type === "king" && square.piece.color === "white",
    ).length;

  const blackKings = game.board
    .flat()
    .filter(
      (square) =>
        square.piece?.type === "king" && square.piece.color === "black",
    ).length;

  const unoCard = game.currentUnoCard;

  const ownPieces = game.board
    .flat()
    .map((square) => square.piece)
    .filter(
      (piece): piece is Piece =>
        Boolean(piece) &&
        piece.color === game.currentPlayer &&
        piece.type !== "king",
    );

  return (
    <aside className="space-y-4">
      {/* ================================== */}
      {/* TURNO */}
      {/* ================================== */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
        <p className="text-xs font-black tracking-[0.25em] text-zinc-500">
          TURNO
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div
            className={`
              h-4
              w-4
              rounded-full
              ${
                currentPlayer === "white"
                  ? "bg-white"
                  : "bg-zinc-800 ring-1 ring-zinc-600"
              }
            `}
          />

          <span className="text-2xl font-black">
            {currentPlayer === "white" ? "BRANCAS" : "PRETAS"}
          </span>
        </div>
      </section>

      {/* ================================== */}
      {/* STATUS DO XADREZ */}
      {/* ================================== */}

      <section
        className={`
          rounded-2xl
          border
          p-4
          shadow-xl
          ${getStatusClasses(chessStatus)}
        `}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-black tracking-[0.25em]">STATUS</p>

          <span className="text-sm font-black">
            {getStatusLabel(chessStatus)}
          </span>
        </div>

        {chessStatus === "check" && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-bold">Rei(s) em xeque:</p>

            {checkedKings.map((position) => (
              <div
                key={`${position.row}-${position.col}`}
                className="rounded-lg bg-black/20 px-3 py-2 text-xs font-mono"
              >
                Linha {position.row + 1}
                {" · "}
                Coluna {position.col + 1}
              </div>
            ))}
          </div>
        )}

        {chessStatus === "checkmate" && (
          <p className="mt-3 text-sm font-bold">
            Não existem movimentos legais para proteger seus reis.
          </p>
        )}

        {chessStatus === "stalemate" && (
          <p className="mt-3 text-sm font-bold">
            Nenhum rei está em xeque, mas não existem movimentos legais.
          </p>
        )}
      </section>

      {/* ================================== */}
      {/* UNO */}
      {/* ================================== */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
        <p className="text-xs font-black tracking-[0.25em] text-zinc-500">
          CARTA UNO
        </p>

        {unoCard ? (
          <div className="mt-3 flex items-center gap-4">
            <div
              className={`
                flex
                h-24
                w-16
                items-center
                justify-center
                rounded-xl
                border-2
                border-white/30
                shadow-lg
                ${unoCard.color === "red" ? "bg-red-600" : ""}
                ${unoCard.color === "yellow" ? "bg-yellow-400 text-black" : ""}
                ${unoCard.color === "green" ? "bg-green-600" : ""}
                ${unoCard.color === "blue" ? "bg-blue-600" : ""}
                ${unoCard.color === null ? "bg-zinc-900" : ""}
              `}
            >
              <span className="text-3xl font-black">
                {unoCard.type === "number"
                  ? unoCard.value
                  : unoCard.type === "skip"
                    ? "⊘"
                    : unoCard.type === "reverse"
                      ? "↻"
                      : unoCard.type === "draw2"
                        ? "+2"
                        : unoCard.type === "wildDraw4"
                          ? "+4"
                          : "⇄"}
              </span>
            </div>

            <div>
              <p className="text-lg font-black">
                {unoCard.type === "number"
                  ? `${unoCard.value} MOVIMENTOS`
                  : unoCard.type === "skip"
                    ? "PULAR TURNO"
                    : unoCard.type === "reverse"
                      ? "REVERSE"
                      : unoCard.type === "draw2"
                        ? "RECUPERAÇÃO +2"
                        : unoCard.type === "wildDraw4"
                          ? "RECUPERAÇÃO +4"
                          : "TROCA DE COR"}
              </p>

              <p className="mt-1 text-xs text-zinc-500">Carta atual</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Nenhuma carta.</p>
        )}

        {/* ================================== */}
        {/* ATIVAR TROCA DE COR */}
        {/* ================================== */}

        {unoCard?.type === "colorSwap" &&
          !game.pendingColorSwap &&
          !game.gameOver && (
            <button
              type="button"
              onClick={onActivateColorSwap}
              className="mt-4 w-full rounded-xl border border-purple-500/50 bg-purple-600/20 px-4 py-3 font-black text-purple-200 transition hover:bg-purple-600/40"
            >
              ⇄ ATIVAR TROCA DE COR
            </button>
          )}
      </section>

      {/* ================================== */}
      {/* TROCA DE COR */}
      {/* ================================== */}

      {game.pendingColorSwap && (
        <section className="rounded-2xl border border-purple-500/50 bg-purple-950/30 p-4 shadow-xl">
          <p className="text-xs font-black tracking-[0.2em] text-purple-400">
            TROCA DE COR
          </p>

          <p className="mt-2 text-sm text-purple-200">
            Escolha uma peça sua para trocar com a peça inimiga mais avançada
            que você consegue enxergar.
          </p>

          {game.colorSwapTarget && (
            <div className="mt-3 rounded-xl bg-black/30 p-3 text-center">
              <p className="text-xs font-bold text-zinc-500">ALVO</p>

              <p className="mt-1 text-5xl">
                {(() => {
                  const piece =
                    game.board[game.colorSwapTarget!.row][
                      game.colorSwapTarget!.col
                    ].piece;

                  return piece ? getPieceSymbol(piece) : "?";
                })()}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Escolha uma peça abaixo ou clique nela no tabuleiro.
              </p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-4 gap-2">
            {ownPieces.map((piece) => (
              <button
                key={piece.id}
                type="button"
                onClick={() => {
                  /*
                   * A seleção pelo painel é feita
                   * através do mesmo mecanismo usado
                   * pelo tabuleiro.
                   */
                  const position = game.board
                    .flatMap((row) => row)
                    .find((square) => square.piece?.id === piece.id);

                  if (!position) {
                    return;
                  }

                  /*
                   * Este callback é tratado pelo
                   * page.tsx.
                   */
                }}
                className="rounded-lg border border-purple-900 bg-black/20 p-3 text-3xl transition hover:border-purple-400 hover:bg-purple-500/20"
              >
                {getPieceSymbol(piece)}
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-xs font-bold text-purple-300">
            Clique na peça desejada no tabuleiro para realizar a troca.
          </p>
        </section>
      )}

      {/* ================================== */}
      {/* MOVIMENTOS */}
      {/* ================================== */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-[0.2em] text-zinc-500">
            MOVIMENTOS
          </span>

          <span className="text-2xl font-black">
            {game.movesUsed}
            <span className="text-zinc-600"> / {game.movesAllowed}</span>
          </span>
        </div>

        {game.movesAllowed === 0 && (
          <p className="mt-2 text-xs font-bold text-yellow-400">
            Esta carta não permite movimentos.
          </p>
        )}
      </section>

      {/* ================================== */}
      {/* RECUPERAÇÃO */}
      {/* ================================== */}

      {game.pendingRecovery > 0 && (
        <section className="rounded-2xl border border-cyan-900 bg-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black tracking-[0.2em] text-cyan-400">
              RECUPERAÇÃO
            </p>

            <span className="text-2xl font-black text-cyan-200">
              {game.pendingRecovery}
            </span>
          </div>

          {hasRecoverablePieces ? (
            <>
              <p className="mt-2 text-xs text-cyan-300/70">
                Escolha uma peça capturada para recolocar no seu território
                inicial.
              </p>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {recoverablePieces.map((piece) => {
                  const selected = game.recoveryPieceId === piece.id;

                  return (
                    <button
                      key={piece.id}
                      type="button"
                      onClick={() => onRecoveryPiece(piece.id)}
                      className={`
                          rounded-lg
                          border
                          p-2
                          text-2xl
                          transition
                          ${
                            selected
                              ? "border-cyan-300 bg-cyan-500/30"
                              : "border-cyan-900 bg-black/20 hover:border-cyan-500"
                          }
                        `}
                    >
                      {getPieceSymbol(piece)}
                    </button>
                  );
                })}
              </div>

              {game.recoveryPieceId && (
                <p className="mt-3 text-center text-xs font-bold text-cyan-200">
                  Agora escolha uma casa inicial vazia no tabuleiro.
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-xs text-cyan-300/70">
              Nenhuma peça sua está capturada. Você pode passar o turno.
            </p>
          )}
        </section>
      )}

      {/* ================================== */}
      {/* REIS */}
      {/* ================================== */}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
        <p className="text-xs font-black tracking-[0.25em] text-zinc-500">
          REIS RESTANTES
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xl">♔</span>

              <span className="text-2xl font-black">{whiteKings}</span>
            </div>

            <p className="mt-1 text-xs font-bold text-zinc-500">BRANCAS</p>
          </div>

          <div className="rounded-xl bg-black/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xl">♚</span>

              <span className="text-2xl font-black">{blackKings}</span>
            </div>

            <p className="mt-1 text-xs font-bold text-zinc-500">PRETAS</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* ENCERRAR TURNO */}
      {/* ================================== */}

      <button
        type="button"
        onClick={onEndTurn}
        disabled={!canEndTurn || Boolean(game.recoveryPieceId)}
        className="w-full rounded-xl bg-white px-4 py-3 font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {recoveryUnavailable ? "PASSAR TURNO" : "ENCERRAR TURNO"}
      </button>

      {/* ================================== */}
      {/* GAME OVER */}
      {/* ================================== */}

      {game.gameOver && game.winner && (
        <section className="rounded-2xl border border-yellow-500 bg-yellow-950/40 p-5 text-center shadow-xl">
          <p className="text-xs font-black tracking-[0.3em] text-yellow-400">
            FIM DE JOGO
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {game.winner === "white" ? "BRANCAS" : "PRETAS"} VENCERAM
          </h2>

          <p className="mt-2 text-sm text-yellow-200/70">
            Os 3 reis adversários foram capturados.
          </p>
        </section>
      )}
    </aside>
  );
}
