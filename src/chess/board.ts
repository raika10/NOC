import type { Board, Color, Piece, PieceType, Square } from './types';

const BACK_RANK: PieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook',
];

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: BACK_RANK[col], color: 'white', hasMoved: false };
    board[1][col] = { type: 'pawn', color: 'white', hasMoved: false };
    board[6][col] = { type: 'pawn', color: 'black', hasMoved: false };
    board[7][col] = { type: BACK_RANK[col], color: 'black', hasMoved: false };
  }

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

export function isInBounds(square: Square): boolean {
  return square.row >= 0 && square.row < 8 && square.col >= 0 && square.col < 8;
}

export function squareEquals(a: Square, b: Square): boolean {
  return a.row === b.row && a.col === b.col;
}

export function pieceAt(board: Board, square: Square): Piece | null {
  return board[square.row][square.col];
}

export function opponent(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

const FILES = 'abcdefgh';

export function squareToAlgebraic(square: Square): string {
  return `${FILES[square.col]}${square.row + 1}`;
}

export function algebraicToSquare(notation: string): Square {
  const col = FILES.indexOf(notation[0]);
  const row = Number(notation[1]) - 1;
  return { row, col };
}

export function findKing(board: Board, color: Color): Square | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

export function boardToKey(board: Board, turn: Color, enPassantTarget: Square | null): string {
  let key = turn === 'white' ? 'w' : 'b';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      key += piece ? `${piece.color[0]}${piece.type[0]}` : '--';
    }
  }
  key += enPassantTarget ? squareToAlgebraic(enPassantTarget) : '-';
  return key;
}
