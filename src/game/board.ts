import { Square } from "../types/game";
import { createInitialBoard } from "./pieces";

export const BOARD_SIZE = 24;

export function createEmptyBoard(): Square[][] {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => ({
      row,
      col,
      piece: null,
    })),
  );
}

export function createBoard(): Square[][] {
  return createInitialBoard();
}
