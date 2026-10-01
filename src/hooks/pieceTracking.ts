import { squareEquals } from '../chess';
import type { Board, Move, Piece, Square } from '../chess';

export interface PieceInstance {
  id: string;
  square: Square;
  piece: Piece;
}

export function createInitialPieceInstances(board: Board): PieceInstance[] {
  const instances: PieceInstance[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        instances.push({ id: `${piece.color}-${piece.type}-${row}-${col}`, square: { row, col }, piece });
      }
    }
  }
  return instances;
}

/** Applies a move to a piece-instance list, preserving each piece's stable id so React can animate it. */
export function applyMoveToInstances(instances: PieceInstance[], move: Move): PieceInstance[] {
  let next = instances;

  if (move.captured && move.capturedSquare) {
    const capturedSquare = move.capturedSquare;
    next = next.filter((inst) => !squareEquals(inst.square, capturedSquare));
  }

  if (move.isCastle) {
    const row = move.from.row;
    const rookFromCol = move.isCastle === 'king' ? 7 : 0;
    const rookToCol = move.isCastle === 'king' ? 5 : 3;
    next = next.map((inst) =>
      squareEquals(inst.square, { row, col: rookFromCol })
        ? { ...inst, square: { row, col: rookToCol } }
        : inst,
    );
  }

  next = next.map((inst) => {
    if (!squareEquals(inst.square, move.from)) return inst;
    return {
      ...inst,
      square: move.to,
      piece: move.promotion ? { ...inst.piece, type: move.promotion } : inst.piece,
    };
  });

  return next;
}

export function findInstanceAt(instances: PieceInstance[], square: Square): PieceInstance | undefined {
  return instances.find((inst) => squareEquals(inst.square, square));
}
