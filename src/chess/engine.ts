import { boardToKey, cloneBoard, createInitialBoard, findKing, opponent, pieceAt, squareToAlgebraic } from './board';
import { getPseudoLegalMoves, isSquareAttacked } from './moves';
import type { Board, CastlingRights, Color, GameState, Move, Piece, PieceType, Square } from './types';

export function createInitialGameState(): GameState {
  const board = createInitialBoard();
  const castlingRights: Record<Color, CastlingRights> = {
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true },
  };
  return {
    board,
    turn: 'white',
    castlingRights,
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    history: [],
    positionCounts: { [boardToKey(board, 'white', null)]: 1 },
    status: 'playing',
    winner: null,
  };
}

export function isInCheck(state: GameState, color: Color): boolean {
  const kingSquare = findKing(state.board, color);
  if (!kingSquare) return false;
  return isSquareAttacked(state.board, kingSquare, opponent(color));
}

/** Legal moves for the piece on `from` — pseudo-legal moves that don't leave the mover's own king in check. */
export function getLegalMoves(state: GameState, from: Square): Move[] {
  const piece = pieceAt(state.board, from);
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(state.board, from, {
    castlingRights: state.castlingRights,
    enPassantTarget: state.enPassantTarget,
  });

  return pseudoMoves.filter((move) => {
    const boardAfter = applyMoveToBoard(state.board, move);
    const kingSquare = findKing(boardAfter, piece.color);
    if (!kingSquare) return false;
    return !isSquareAttacked(boardAfter, kingSquare, opponent(piece.color));
  });
}

export function getAllLegalMoves(state: GameState, color: Color): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece && piece.color === color) {
        moves.push(...getLegalMoves(state, { row, col }));
      }
    }
  }
  return moves;
}

export function applyMoveToBoard(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const movedPiece: Piece = { ...move.piece, hasMoved: true };

  newBoard[move.from.row][move.from.col] = null;

  if (move.isEnPassant && move.capturedSquare) {
    newBoard[move.capturedSquare.row][move.capturedSquare.col] = null;
  }

  newBoard[move.to.row][move.to.col] = move.promotion
    ? { type: move.promotion, color: movedPiece.color, hasMoved: true }
    : movedPiece;

  if (move.isCastle) {
    const row = move.from.row;
    if (move.isCastle === 'king') {
      const rook = newBoard[row][7];
      newBoard[row][5] = rook ? { ...rook, hasMoved: true } : null;
      newBoard[row][7] = null;
    } else {
      const rook = newBoard[row][0];
      newBoard[row][3] = rook ? { ...rook, hasMoved: true } : null;
      newBoard[row][0] = null;
    }
  }

  return newBoard;
}

function updateCastlingRights(
  rights: Record<Color, CastlingRights>,
  move: Move,
): Record<Color, CastlingRights> {
  const updated: Record<Color, CastlingRights> = {
    white: { ...rights.white },
    black: { ...rights.black },
  };

  if (move.piece.type === 'king') {
    updated[move.piece.color].kingSide = false;
    updated[move.piece.color].queenSide = false;
  }

  if (move.piece.type === 'rook') {
    const homeRow = move.piece.color === 'white' ? 0 : 7;
    if (move.from.row === homeRow && move.from.col === 0) updated[move.piece.color].queenSide = false;
    if (move.from.row === homeRow && move.from.col === 7) updated[move.piece.color].kingSide = false;
  }

  if (move.captured?.type === 'rook' && move.capturedSquare) {
    const capColor = move.captured.color;
    const homeRow = capColor === 'white' ? 0 : 7;
    if (move.capturedSquare.row === homeRow && move.capturedSquare.col === 0) {
      updated[capColor].queenSide = false;
    }
    if (move.capturedSquare.row === homeRow && move.capturedSquare.col === 7) {
      updated[capColor].kingSide = false;
    }
  }

  return updated;
}

function buildNotation(move: Move, legalMoves: Move[], isCheck: boolean, isMate: boolean): string {
  if (move.isCastle === 'king') return isMate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  if (move.isCastle === 'queen') return isMate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';

  const pieceLetters: Record<PieceType, string> = {
    pawn: '',
    knight: 'N',
    bishop: 'B',
    rook: 'R',
    queen: 'Q',
    king: 'K',
  };

  const isCapture = Boolean(move.captured);
  let notation = '';

  if (move.piece.type === 'pawn') {
    if (isCapture) notation += `${'abcdefgh'[move.from.col]}x`;
  } else {
    notation += pieceLetters[move.piece.type];

    const ambiguous = legalMoves.filter(
      (m) =>
        m.piece.type === move.piece.type &&
        m.piece.color === move.piece.color &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        (m.from.row !== move.from.row || m.from.col !== move.from.col),
    );

    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some((m) => m.from.col === move.from.col);
      const sameRank = ambiguous.some((m) => m.from.row === move.from.row);
      if (!sameFile) notation += 'abcdefgh'[move.from.col];
      else if (!sameRank) notation += String(move.from.row + 1);
      else notation += squareToAlgebraic(move.from);
    }

    if (isCapture) notation += 'x';
  }

  notation += squareToAlgebraic(move.to);
  if (move.promotion) notation += `=${pieceLetters[move.promotion]}`;
  if (isMate) notation += '#';
  else if (isCheck) notation += '+';

  return notation;
}

function hasInsufficientMaterial(board: Board): boolean {
  const pieces: Piece[] = [];
  for (const row of board) {
    for (const piece of row) {
      if (piece) pieces.push(piece);
    }
  }

  // Only the clear-cut cases are detected (K vs K, K+minor vs K); same-bishop-color
  // and other draws are left for players to agree/claim rather than auto-declared.
  const nonKingPieces = pieces.filter((p) => p.type !== 'king');
  if (nonKingPieces.length === 0) return true;
  if (nonKingPieces.length === 1 && ['bishop', 'knight'].includes(nonKingPieces[0].type)) return true;

  return false;
}

export function applyMove(state: GameState, move: Move): GameState {
  const legalMovesBeforeForNotation = getAllLegalMoves(state, move.piece.color);
  const board = applyMoveToBoard(state.board, move);
  const turn = opponent(state.turn);
  const castlingRights = updateCastlingRights(state.castlingRights, move);

  const enPassantTarget: Square | null = move.isDoublePawnPush
    ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
    : null;

  const isPawnMoveOrCapture = move.piece.type === 'pawn' || Boolean(move.captured);
  const halfmoveClock = isPawnMoveOrCapture ? 0 : state.halfmoveClock + 1;
  const fullmoveNumber = state.turn === 'black' ? state.fullmoveNumber + 1 : state.fullmoveNumber;

  const positionKey = boardToKey(board, turn, enPassantTarget);
  const positionCounts = { ...state.positionCounts, [positionKey]: (state.positionCounts[positionKey] ?? 0) + 1 };

  const nextState: GameState = {
    board,
    turn,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    history: state.history,
    positionCounts,
    status: 'playing',
    winner: null,
  };

  const inCheck = isInCheck(nextState, turn);
  const legalMovesForTurn = getAllLegalMoves(nextState, turn);
  const isMate = inCheck && legalMovesForTurn.length === 0;
  const isStalemate = !inCheck && legalMovesForTurn.length === 0;

  let status: GameState['status'] = 'playing';
  let winner: Color | null = null;

  if (isMate) {
    status = 'checkmate';
    winner = move.piece.color;
  } else if (isStalemate) {
    status = 'stalemate';
  } else if (halfmoveClock >= 100) {
    status = 'draw-fifty-move';
  } else if (positionCounts[positionKey] >= 3) {
    status = 'draw-repetition';
  } else if (hasInsufficientMaterial(board)) {
    status = 'draw-insufficient-material';
  } else if (inCheck) {
    status = 'check';
  }

  const notation = buildNotation(move, legalMovesBeforeForNotation, inCheck, isMate);

  return {
    ...nextState,
    history: [...state.history, { ...move, notation }],
    status,
    winner,
  };
}
