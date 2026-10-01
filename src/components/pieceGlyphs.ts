import type { PieceType } from '../chess';

// Both colors use the same solid silhouettes (the "black" chess symbols) —
// white vs. black is expressed purely through CSS coloring in ChessBoard.css,
// so the two sets read as the same figurine design in different finishes.
const GLYPHS: Record<PieceType, string> = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟',
};

export function pieceGlyph(type: PieceType): string {
  return GLYPHS[type];
}
