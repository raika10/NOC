import { isInBounds, opponent, pieceAt, squareEquals } from './board';
import type { Board, CastlingRights, Color, Move, Piece, Square } from './types';

const KNIGHT_OFFSETS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

const KING_OFFSETS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

const BISHOP_DIRECTIONS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const ROOK_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Squares a piece attacks/defends, ignoring pawn forward pushes (which aren't attacks). */
export function getAttackedSquares(board: Board, from: Square): Square[] {
  const piece = pieceAt(board, from);
  if (!piece) return [];

  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? 1 : -1;
      const targets = [
        { row: from.row + direction, col: from.col - 1 },
        { row: from.row + direction, col: from.col + 1 },
      ];
      return targets.filter(isInBounds);
    }
    case 'knight': {
      return KNIGHT_OFFSETS.map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc })).filter(
        isInBounds,
      );
    }
    case 'king': {
      return KING_OFFSETS.map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc })).filter(
        isInBounds,
      );
    }
    case 'bishop':
    case 'rook':
    case 'queen': {
      const directions =
        piece.type === 'bishop'
          ? BISHOP_DIRECTIONS
          : piece.type === 'rook'
            ? ROOK_DIRECTIONS
            : [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS];

      const squares: Square[] = [];
      for (const [dr, dc] of directions) {
        let row = from.row + dr;
        let col = from.col + dc;
        while (isInBounds({ row, col })) {
          squares.push({ row, col });
          if (board[row][col]) break;
          row += dr;
          col += dc;
        }
      }
      return squares;
    }
    default:
      return [];
  }
}

export function isSquareAttacked(board: Board, target: Square, byColor: Color): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;
      const attacks = getAttackedSquares(board, { row, col });
      if (attacks.some((sq) => squareEquals(sq, target))) return true;
    }
  }
  return false;
}

interface PseudoLegalOptions {
  castlingRights: Record<Color, CastlingRights>;
  enPassantTarget: Square | null;
}

/** Moves for one piece, ignoring whether the move leaves the mover's own king in check. */
export function getPseudoLegalMoves(board: Board, from: Square, options: PseudoLegalOptions): Move[] {
  const piece = pieceAt(board, from);
  if (!piece) return [];

  if (piece.type === 'pawn') return getPawnMoves(board, from, piece, options.enPassantTarget);
  if (piece.type === 'king') return getKingMoves(board, from, piece, options.castlingRights);

  const attacked = getAttackedSquares(board, from);
  const moves: Move[] = [];
  for (const to of attacked) {
    const target = pieceAt(board, to);
    if (target && target.color === piece.color) continue;
    moves.push({ from, to, piece, captured: target ?? undefined, capturedSquare: target ? to : undefined });
  }
  return moves;
}

function getPawnMoves(
  board: Board,
  from: Square,
  piece: Piece,
  enPassantTarget: Square | null,
): Move[] {
  const moves: Move[] = [];
  const direction = piece.color === 'white' ? 1 : -1;
  const startRow = piece.color === 'white' ? 1 : 6;
  const promotionRow = piece.color === 'white' ? 7 : 0;

  const addPawnMove = (to: Square, extra: Partial<Move> = {}) => {
    if (to.row === promotionRow) {
      (['queen', 'rook', 'bishop', 'knight'] as const).forEach((promotion) => {
        moves.push({ from, to, piece, promotion, ...extra });
      });
    } else {
      moves.push({ from, to, piece, ...extra });
    }
  };

  const oneStep = { row: from.row + direction, col: from.col };
  if (isInBounds(oneStep) && !pieceAt(board, oneStep)) {
    addPawnMove(oneStep);

    const twoStep = { row: from.row + direction * 2, col: from.col };
    if (from.row === startRow && !pieceAt(board, twoStep)) {
      moves.push({ from, to: twoStep, piece, isDoublePawnPush: true });
    }
  }

  for (const dc of [-1, 1]) {
    const to = { row: from.row + direction, col: from.col + dc };
    if (!isInBounds(to)) continue;
    const target = pieceAt(board, to);
    if (target && target.color !== piece.color) {
      addPawnMove(to, { captured: target, capturedSquare: to });
    } else if (!target && enPassantTarget && squareEquals(to, enPassantTarget)) {
      const capturedSquare = { row: from.row, col: to.col };
      const captured = pieceAt(board, capturedSquare);
      if (captured) {
        moves.push({ from, to, piece, isEnPassant: true, captured, capturedSquare });
      }
    }
  }

  return moves;
}

function getKingMoves(
  board: Board,
  from: Square,
  piece: Piece,
  castlingRights: Record<Color, CastlingRights>,
): Move[] {
  const moves: Move[] = [];
  for (const to of KING_OFFSETS.map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))) {
    if (!isInBounds(to)) continue;
    const target = pieceAt(board, to);
    if (target && target.color === piece.color) continue;
    moves.push({ from, to, piece, captured: target ?? undefined, capturedSquare: target ? to : undefined });
  }

  const rights = castlingRights[piece.color];
  const row = piece.color === 'white' ? 0 : 7;
  const enemyColor = opponent(piece.color);
  if (from.row === row && from.col === 4 && !piece.hasMoved) {
    if (rights.kingSide && canCastle(board, row, [5, 6], 7, enemyColor)) {
      moves.push({ from, to: { row, col: 6 }, piece, isCastle: 'king' });
    }
    if (rights.queenSide && canCastle(board, row, [3, 2], 0, enemyColor, [1])) {
      moves.push({ from, to: { row, col: 2 }, piece, isCastle: 'queen' });
    }
  }

  return moves;
}

function canCastle(
  board: Board,
  row: number,
  pathCols: number[],
  rookCol: number,
  enemyColor: Color,
  extraEmptyCols: number[] = [],
): boolean {
  const rook = board[row][rookCol];
  if (!rook || rook.type !== 'rook' || rook.hasMoved || rook.color === enemyColor) return false;

  for (const col of [...pathCols, ...extraEmptyCols]) {
    if (board[row][col]) return false;
  }

  if (isSquareAttacked(board, { row, col: 4 }, enemyColor)) return false;
  for (const col of pathCols) {
    if (isSquareAttacked(board, { row, col }, enemyColor)) return false;
  }

  return true;
}
