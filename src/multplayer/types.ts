import {
  BoardLayout,
  GameState,
  PieceColor,
  PieceType,
  Position,
} from "@/types/game";

export type GameAction =
  | { type: "SELECT_SQUARE"; position: Position }
  | { type: "RECOVERY_SELECT"; pieceId: string }
  | { type: "RECOVERY_PLACE"; position: Position }
  | { type: "PROMOTE"; pieceType: Exclude<PieceType, "king" | "pawn"> }
  | { type: "END_TURN" };

export type ClientMessage =
  | { type: "CREATE_ROOM"; layout: BoardLayout }
  | { type: "JOIN_ROOM"; roomId: string }
  | { type: "ACTION"; action: GameAction };

export type ServerMessage =
  | {
      type: "ROOM_CREATED";
      roomId: string;
      color: PieceColor;
      game: GameState;
    }
  | {
      type: "ROOM_JOINED";
      roomId: string;
      color: PieceColor;
      game: GameState;
    }
  | {
      type: "GAME_STATE";
      game: GameState;
    }
  | {
      type: "PLAYER_STATUS";
      whiteConnected: boolean;
      blackConnected: boolean;
    }
  | {
      type: "ERROR";
      message: string;
    };
