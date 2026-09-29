import { BoardLayout, BoardSize, Square } from "@/types/game";

import { createInitialBoard } from "./pieces";

export const BOARD_SIZE: BoardSize = 24;

export function getBoardSize(layout: BoardLayout): BoardSize {
  return (layout * 8) as BoardSize;
}

export function createEmptyBoard(size: BoardSize = BOARD_SIZE): Square[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      piece: null,
    })),
  );
}

export function createBoard(size: BoardSize = BOARD_SIZE): Square[][] {
  return createInitialBoard(size);
}
