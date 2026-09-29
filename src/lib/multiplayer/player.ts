const PLAYER_ID_KEY = "uno-chess-player-id";

function createPlayerId(): string {
  return crypto.randomUUID();
}

export function getPlayerId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existingPlayerId = localStorage.getItem(PLAYER_ID_KEY);

  if (existingPlayerId) {
    return existingPlayerId;
  }

  const playerId = createPlayerId();

  localStorage.setItem(PLAYER_ID_KEY, playerId);

  return playerId;
}
