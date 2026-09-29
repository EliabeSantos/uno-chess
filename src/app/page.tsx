"use client";

import { useEffect, useRef, useState } from "react";

import ChessBoard from "@/components/ChessBoard";
import GameUI from "@/components/GameUI";
import PromotionModal from "@/components/PromotionModal";

import {
  createInitialGameState,
  movePiece,
  promotePawn,
  selectRecoveryPiece,
  selectSquare,
  switchTurn,
} from "@/game/gameState";

import {
  BoardLayout,
  GameState,
  PieceColor,
  PieceType,
  Position,
} from "@/types/game";

import { supabase } from "@/lib/supabase";
import { getPlayerId } from "@/lib/multiplayer/player";
import {
  createGameRoom,
  GameRoom,
  joinGameRoom,
  updateGameRoomState,
} from "@/lib/multiplayer/rooms";

const boardOptions: Array<{
  layout: BoardLayout;
  size: string;
  title: string;
  description: string;
  pieces: string;
}> = [
  {
    layout: 1,
    size: "8 × 8",
    title: "1 × 1",
    description: "Uma formação de xadrez por jogador.",
    pieces: "16 peças por jogador",
  },
  {
    layout: 2,
    size: "16 × 16",
    title: "2 × 2",
    description: "Duas formações de xadrez por jogador.",
    pieces: "32 peças por jogador",
  },
  {
    layout: 3,
    size: "24 × 24",
    title: "3 × 3",
    description: "Três formações de xadrez por jogador.",
    pieces: "48 peças por jogador",
  },
];

type GameMode = "menu" | "local" | "online";

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null);
  const [mode, setMode] = useState<GameMode>("menu");

  const [onlineColor, setOnlineColor] = useState<PieceColor | null>(null);
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  const [room, setRoom] = useState<GameRoom | null>(null);

  const [whiteConnected, setWhiteConnected] = useState(false);
  const [blackConnected, setBlackConnected] = useState(false);

  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [loadingOnline, setLoadingOnline] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const playerIdRef = useRef<string>("");

  useEffect(() => {
    playerIdRef.current = getPlayerId();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  function disconnectRoomChannel() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setWhiteConnected(false);
    setBlackConnected(false);
  }

  function connectToRoom(roomData: GameRoom) {
    disconnectRoomChannel();

    const channel = supabase.channel(`uno-chess-room:${roomData.id}`, {
      config: {
        presence: {
          key: playerIdRef.current,
        },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomData.id}`,
        },
        (payload) => {
          const updatedRoom = payload.new as GameRoom;

          setRoom(updatedRoom);

          if (updatedRoom.game_state) {
            setGame(updatedRoom.game_state);
          }

          const playerId = playerIdRef.current;

          if (updatedRoom.white_player_id === playerId) {
            setOnlineColor("white");
          } else if (updatedRoom.black_player_id === playerId) {
            setOnlineColor("black");
          }

          setWhiteConnected(Boolean(updatedRoom.white_player_id));
          setBlackConnected(Boolean(updatedRoom.black_player_id));
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();

        const connectedPlayers = Object.keys(state);

        setWhiteConnected(
          connectedPlayers.includes(roomData.white_player_id ?? ""),
        );

        setBlackConnected(
          connectedPlayers.includes(roomData.black_player_id ?? ""),
        );
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({
          playerId: playerIdRef.current,
          color:
            roomData.white_player_id === playerIdRef.current
              ? "white"
              : "black",
        });
      });

    channelRef.current = channel;

    setWhiteConnected(Boolean(roomData.white_player_id));
    setBlackConnected(Boolean(roomData.black_player_id));
  }

  async function handleCreateOnlineGame(layout: BoardLayout) {
    try {
      setLoadingOnline(true);
      setOnlineError(null);

      const createdRoom = await createGameRoom(layout);

      setRoom(createdRoom);
      setRoomId(createdRoom.room_code);
      setGame(createdRoom.game_state);
      setMode("online");
      setOnlineColor("white");

      setWhiteConnected(true);
      setBlackConnected(false);

      connectToRoom(createdRoom);
    } catch (error) {
      console.error(error);

      setOnlineError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a partida.",
      );
    } finally {
      setLoadingOnline(false);
    }
  }

  async function handleJoinOnlineGame() {
    const code = joinRoomId.trim().toUpperCase();

    if (!code) {
      setOnlineError("Digite o código da partida.");
      return;
    }

    try {
      setLoadingOnline(true);
      setOnlineError(null);

      const joinedRoom = await joinGameRoom(code);

      setRoom(joinedRoom);
      setRoomId(joinedRoom.room_code);
      setGame(joinedRoom.game_state);
      setMode("online");

      const playerId = getPlayerId();

      if (joinedRoom.white_player_id === playerId) {
        setOnlineColor("white");
      } else {
        setOnlineColor("black");
      }

      setWhiteConnected(Boolean(joinedRoom.white_player_id));
      setBlackConnected(Boolean(joinedRoom.black_player_id));

      connectToRoom(joinedRoom);
    } catch (error) {
      console.error(error);

      setOnlineError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na partida.",
      );
    } finally {
      setLoadingOnline(false);
    }
  }

  function handleStartGame(layout: BoardLayout) {
    disconnectRoomChannel();

    setGame(createInitialGameState(layout));
    setMode("local");
    setOnlineColor(null);
    setRoomId("");
    setRoom(null);
    setOnlineError(null);
  }

  function canOnlinePlayerAct(): boolean {
    if (!game || !onlineColor || !room) {
      return false;
    }

    if (!whiteConnected || !blackConnected) {
      return false;
    }

    if (game.gameOver) {
      return false;
    }

    return game.currentPlayer === onlineColor;
  }

  async function saveOnlineGame(nextGame: GameState) {
    if (!room) {
      return;
    }

    setGame(nextGame);

    try {
      await updateGameRoomState(room.id, nextGame);
    } catch (error) {
      console.error(error);

      setOnlineError(
        error instanceof Error
          ? error.message
          : "Não foi possível sincronizar a partida.",
      );
    }
  }

  function handleSquareClick(position: Position) {
    if (!game || game.gameOver || game.pendingPromotion) {
      return;
    }

    if (mode === "local") {
      setGame((currentGame) => {
        if (
          !currentGame ||
          currentGame.gameOver ||
          currentGame.pendingPromotion
        ) {
          return currentGame;
        }

        if (currentGame.recoveryPieceId) {
          return movePiece(currentGame, position);
        }

        return selectSquare(currentGame, position);
      });

      return;
    }

    if (!canOnlinePlayerAct()) {
      return;
    }

    if (game.recoveryPieceId) {
      const nextGame = movePiece(game, position);

      if (nextGame !== game) {
        void saveOnlineGame(nextGame);
      }

      return;
    }

    const nextGame = selectSquare(game, position);

    if (nextGame !== game) {
      if (nextGame.selectedSquare === null && game.selectedSquare !== null) {
        void saveOnlineGame(nextGame);
        return;
      }

      if (
        nextGame.movesUsed !== game.movesUsed ||
        nextGame.pendingPromotion !== game.pendingPromotion ||
        nextGame.gameOver !== game.gameOver
      ) {
        void saveOnlineGame(nextGame);
        return;
      }

      setGame(nextGame);
    }
  }

  function handleRecoveryPiece(pieceId: string) {
    if (!game) {
      return;
    }

    if (mode === "local") {
      setGame((currentGame) =>
        currentGame ? selectRecoveryPiece(currentGame, pieceId) : currentGame,
      );

      return;
    }

    if (!canOnlinePlayerAct()) {
      return;
    }

    const nextGame = selectRecoveryPiece(game, pieceId);

    if (nextGame !== game) {
      setGame(nextGame);
    }
  }
  const handleActivateColorSwap = () => {
    const nextGame = activateColorSwap(game);

    if (nextGame === game) {
      return;
    }

    setGame(nextGame);

    if (online && room) {
      void updateGameRoomState(room.id, nextGame);
    }
  };
  function handlePromotion(type: Exclude<PieceType, "king" | "pawn">) {
    if (!game) {
      return;
    }

    if (mode === "local") {
      setGame((currentGame) =>
        currentGame ? promotePawn(currentGame, type) : currentGame,
      );

      return;
    }

    if (!canOnlinePlayerAct()) {
      return;
    }

    const nextGame = promotePawn(game, type);

    if (nextGame !== game) {
      void saveOnlineGame(nextGame);
    }
  }

  function handleEndTurn() {
    if (!game) {
      return;
    }

    if (mode === "local") {
      setGame((currentGame) =>
        currentGame ? switchTurn(currentGame) : currentGame,
      );

      return;
    }

    if (!canOnlinePlayerAct()) {
      return;
    }

    const nextGame = switchTurn(game);

    if (nextGame !== game) {
      void saveOnlineGame(nextGame);
    }
  }

  function handleBackToMenu() {
    disconnectRoomChannel();

    setGame(null);
    setMode("menu");
    setOnlineColor(null);
    setRoomId("");
    setRoom(null);
    setJoinRoomId("");
    setOnlineError(null);
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-6xl">
            <div className="mb-12 text-center">
              <div className="mb-4 text-xs font-black tracking-[0.5em] text-emerald-400">
                UNO + CHESS
              </div>

              <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
                UNO CHESS
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
                Jogue localmente ou crie uma partida online.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {boardOptions.map((option) => (
                <button
                  key={option.layout}
                  type="button"
                  onClick={() => handleStartGame(option.layout)}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left shadow-xl transition hover:-translate-y-1 hover:border-emerald-500/60 hover:bg-zinc-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-4xl font-black">{option.title}</p>

                      <p className="mt-2 text-sm font-bold text-emerald-400">
                        {option.size}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-xl transition group-hover:border-emerald-500/50">
                      ♟
                    </div>
                  </div>

                  <p className="mt-6 text-sm leading-6 text-zinc-400">
                    {option.description}
                  </p>

                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Exército
                    </p>

                    <p className="mt-1 text-sm font-bold text-zinc-200">
                      {option.pieces}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm font-black">
                    <span className="text-zinc-500">JOGAR LOCAL</span>

                    <span className="text-emerald-400 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black tracking-[0.3em] text-emerald-400">
                    MULTIPLAYER ONLINE
                  </p>

                  <h2 className="mt-2 text-2xl font-black">CRIAR PARTIDA</h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Escolha o tamanho e compartilhe o código com seu adversário.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {boardOptions.map((option) => (
                    <button
                      key={option.layout}
                      type="button"
                      onClick={() => handleCreateOnlineGame(option.layout)}
                      disabled={loadingOnline}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loadingOnline ? "..." : option.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-6">
                <p className="text-xs font-black tracking-[0.3em] text-zinc-500">
                  ENTRAR EM PARTIDA
                </p>

                <div className="mt-3 flex gap-3">
                  <input
                    value={joinRoomId}
                    onChange={(event) =>
                      setJoinRoomId(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, ""),
                      )
                    }
                    maxLength={6}
                    placeholder="ABC123"
                    className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-lg font-black tracking-[0.2em] text-white outline-none placeholder:text-zinc-700 focus:border-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={handleJoinOnlineGame}
                    disabled={loadingOnline}
                    className="rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loadingOnline ? "..." : "ENTRAR"}
                  </button>
                </div>
              </div>

              {onlineError && (
                <p className="mt-4 text-sm font-bold text-red-400">
                  {onlineError}
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    );
  }

  const onlineWaiting =
    mode === "online" && (!whiteConnected || !blackConnected);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight">UNO CHESS</h1>

              <span className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 px-2 py-1 text-xs font-black text-emerald-400">
                {game.boardLayout}×{game.boardLayout}
              </span>

              {mode === "online" && onlineColor && (
                <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-black text-zinc-300">
                  VOCÊ: {onlineColor === "white" ? "BRANCAS" : "PRETAS"}
                </span>
              )}
            </div>

            <p className="mt-1 text-zinc-400">
              {game.boardSize}×{game.boardSize} • {game.boardLayout} formação
              {game.boardLayout === 1 ? "" : "ões"} por jogador
            </p>

            {mode === "online" && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-400">
                  SALA: <span className="font-mono text-white">{roomId}</span>
                </span>

                <span
                  className={`rounded-lg border px-2 py-1 ${
                    whiteConnected && blackConnected
                      ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                      : "border-yellow-500/30 bg-yellow-950/40 text-yellow-300"
                  }`}
                >
                  {whiteConnected && blackConnected
                    ? "2 JOGADORES CONECTADOS"
                    : "AGUARDANDO ADVERSÁRIO"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleBackToMenu}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            ← MENU
          </button>
        </header>

        {onlineWaiting && (
          <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 text-center">
            <p className="text-xs font-black tracking-[0.3em] text-emerald-400">
              AGUARDANDO ADVERSÁRIO
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Compartilhe este código:
            </p>

            <p className="mt-3 font-mono text-4xl font-black tracking-[0.25em] text-white">
              {roomId}
            </p>
          </section>
        )}

        {mode === "online" && onlineError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-300">
            {onlineError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="relative">
            <ChessBoard
              game={game}
              playerColor={onlineColor ?? game.currentPlayer}
              onSquareClick={handleSquareClick}
            />

            {game.pendingPromotion && (
              <PromotionModal
                color={game.currentPlayer}
                onSelect={handlePromotion}
              />
            )}
          </div>

          <GameUI
            game={game}
            onEndTurn={handleEndTurn}
            onRecoveryPiece={handleRecoveryPiece}
            onActivateColorSwap={handleActivateColorSwap}
          />
        </div>
      </div>
    </main>
  );
}
