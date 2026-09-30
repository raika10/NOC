export type Color = 'white' | 'black';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved: boolean;
}

export interface Square {
  row: number; // 0-7, row 0 = rank 1, row 7 = rank 8
  col: number; // 0-7, col 0 = file a, col 7 = file h
}

export type Board = (Piece | null)[][];

export interface CastlingRights {
  kingSide: boolean;
  queenSide: boolean;
}

export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  capturedSquare?: Square;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastle?: 'king' | 'queen';
  isDoublePawnPush?: boolean;
  notation?: string;
}

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw-fifty-move'
  | 'draw-repetition'
  | 'draw-insufficient-material';

export interface GameState {
  board: Board;
  turn: Color;
  castlingRights: Record<Color, CastlingRights>;
  enPassantTarget: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  history: Move[];
  positionCounts: Record<string, number>;
  status: GameStatus;
  winner: Color | null;
}
