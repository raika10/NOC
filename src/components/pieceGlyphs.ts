import type { Color, PieceType } from '../chess';

const GLYPHS: Record<Color, Record<PieceType, string>> = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
};

export function pieceGlyph(color: Color, type: PieceType): string {
  return GLYPHS[color][type];
}
