const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  const values = new Uint32Array(length);

  crypto.getRandomValues(values);

  return Array.from(values, (value) => {
    return ROOM_CODE_CHARS[value % ROOM_CODE_CHARS.length];
  }).join("");
}
