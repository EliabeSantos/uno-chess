import { BoardLayout, PieceColor } from "@/types/game";
import { ClientMessage, GameAction, ServerMessage } from "./types";

export interface MultiplayerCallbacks {
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}

export class MultiplayerClient {
  private socket: WebSocket | null = null;
  private callbacks: MultiplayerCallbacks;

  constructor(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  connect(url: string) {
    this.disconnect();

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.callbacks.onOpen?.();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        this.callbacks.onMessage(message);
      } catch {
        this.callbacks.onError?.();
      }
    };

    this.socket.onerror = () => {
      this.callbacks.onError?.();
    };

    this.socket.onclose = () => {
      this.callbacks.onClose?.();
    };
  }

  private send(message: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(JSON.stringify(message));
    return true;
  }

  createRoom(layout: BoardLayout) {
    return this.send({ type: "CREATE_ROOM", layout });
  }

  joinRoom(roomId: string) {
    return this.send({
      type: "JOIN_ROOM",
      roomId: roomId.trim().toUpperCase(),
    });
  }

  sendAction(action: GameAction) {
    return this.send({ type: "ACTION", action });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export function getPlayerLabel(color: PieceColor | null): string {
  if (color === "white") return "BRANCAS";
  if (color === "black") return "PRETAS";
  return "ESPECTADOR";
}
