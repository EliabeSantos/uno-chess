import { supabase } from "@/lib/supabase";
import { createInitialGameState } from "@/game/gameState";
import { getPlayerId } from "./player";
import { generateRoomCode } from "./room";
import { BoardLayout, GameState } from "@/types/game";

export interface GameRoom {
  id: string;
  room_code: string;
  board_layout: BoardLayout;
  status: "waiting" | "playing" | "finished";
  game_state: GameState | null;
  white_player_id: string | null;
  black_player_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function createGameRoom(
  boardLayout: BoardLayout,
): Promise<GameRoom> {
  const playerId = getPlayerId();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = generateRoomCode();

    const initialGame = createInitialGameState(boardLayout);

    const { data, error } = await supabase
      .from("game_rooms")
      .insert({
        room_code: roomCode,
        board_layout: boardLayout,
        status: "waiting",
        game_state: initialGame,
        white_player_id: playerId,
        black_player_id: null,
      })
      .select()
      .single();

    if (!error && data) {
      return data as GameRoom;
    }

    if (error?.code !== "23505") {
      throw error;
    }
  }

  throw new Error("Não foi possível gerar um código de sala único.");
}

export async function findGameRoom(roomCode: string): Promise<GameRoom | null> {
  const normalizedCode = roomCode.trim().toUpperCase();

  const { data, error } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("room_code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as GameRoom | null;
}

export async function joinGameRoom(roomCode: string): Promise<GameRoom> {
  const playerId = getPlayerId();

  const room = await findGameRoom(roomCode);

  if (!room) {
    throw new Error("Sala não encontrada.");
  }

  if (room.white_player_id === playerId) {
    return room;
  }

  if (room.status !== "waiting") {
    throw new Error("Essa sala já está em uma partida.");
  }

  if (room.black_player_id && room.black_player_id !== playerId) {
    throw new Error("Essa sala já possui dois jogadores.");
  }

  const { data, error } = await supabase
    .from("game_rooms")
    .update({
      black_player_id: playerId,
      status: "playing",
    })
    .eq("id", room.id)
    .eq("status", "waiting")
    .is("black_player_id", null)
    .select()
    .single();

  if (error || !data) {
    throw new Error("Não foi possível entrar na sala.");
  }

  return data as GameRoom;
}

export async function updateGameRoomState(
  roomId: string,
  game: GameState,
): Promise<void> {
  const { error } = await supabase
    .from("game_rooms")
    .update({
      game_state: game,
      status: game.gameOver ? "finished" : "playing",
    })
    .eq("id", roomId);

  if (error) {
    throw error;
  }
}
