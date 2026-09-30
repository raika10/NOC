import { describe, expect, it } from 'vitest';
import { algebraicToSquare } from './board';
import { applyMove, createInitialGameState, getAllLegalMoves, getLegalMoves, isInCheck } from './engine';
import type { GameState, Move } from './types';

function move(state: GameState, from: string, to: string, promotion?: Move['promotion']): GameState {
  const fromSq = algebraicToSquare(from);
  const toSq = algebraicToSquare(to);
  const legal = getLegalMoves(state, fromSq);
  const found = legal.find(
    (m) => m.to.row === toSq.row && m.to.col === toSq.col && (!promotion || m.promotion === promotion),
  );
  if (!found) {
    throw new Error(`Illegal move requested in test: ${from}-${to}`);
  }
  return applyMove(state, found);
}

function countSquare(state: GameState, sq: string) {
  const s = algebraicToSquare(sq);
  return state.board[s.row][s.col];
}

describe('initial board', () => {
  it('sets up 32 pieces with correct starting squares', () => {
    const state = createInitialGameState();
    expect(countSquare(state, 'e1')).toEqual({ type: 'king', color: 'white', hasMoved: false });
    expect(countSquare(state, 'e8')).toEqual({ type: 'king', color: 'black', hasMoved: false });
    expect(countSquare(state, 'a1')).toEqual({ type: 'rook', color: 'white', hasMoved: false });
    expect(countSquare(state, 'd8')).toEqual({ type: 'queen', color: 'black', hasMoved: false });
    expect(countSquare(state, 'e4')).toBeNull();
    expect(state.turn).toBe('white');
    expect(state.status).toBe('playing');
  });

  it('white has 20 legal opening moves', () => {
    const state = createInitialGameState();
    expect(getAllLegalMoves(state, 'white')).toHaveLength(20);
  });
});

describe('pawn moves', () => {
  it('allows single and double advances from the start rank only', () => {
    let state = createInitialGameState();
    state = move(state, 'e2', 'e4');
    expect(countSquare(state, 'e4')?.type).toBe('pawn');
    expect(countSquare(state, 'e2')).toBeNull();
    expect(state.enPassantTarget).toEqual(algebraicToSquare('e3'));

    // pawn no longer on start rank: only a single-step move should be legal
    state = move(state, 'e7', 'e5');
    const pawnMoves = getLegalMoves(state, algebraicToSquare('e4'));
    expect(pawnMoves.every((m) => m.to.row === 4)).toBe(true); // rank 5 only (row index 4)
  });

  it('captures en passant', () => {
    let state = createInitialGameState();
    state = move(state, 'e2', 'e4');
    state = move(state, 'a7', 'a6');
    state = move(state, 'e4', 'e5');
    state = move(state, 'd7', 'd5'); // black double push next to white pawn
    expect(state.enPassantTarget).toEqual(algebraicToSquare('d6'));

    state = move(state, 'e5', 'd6');
    expect(countSquare(state, 'd6')?.color).toBe('white');
    expect(countSquare(state, 'd5')).toBeNull();
  });

  it('promotes to every requested piece type', () => {
    // Hand-built position: a white pawn on b7 can push to b8 or capture the
    // black rook on a8, promoting either way.
    const empty = createInitialGameState();
    const board = empty.board.map((row) => row.map(() => null)) as GameState['board'];
    board[0][4] = { type: 'king', color: 'white', hasMoved: true };
    board[7][4] = { type: 'king', color: 'black', hasMoved: true };
    board[6][1] = { type: 'pawn', color: 'white', hasMoved: true }; // b7
    board[7][0] = { type: 'rook', color: 'black', hasMoved: true }; // a8

    const state: GameState = {
      ...empty,
      board,
      turn: 'white',
      castlingRights: { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
    };

    const straight = move(state, 'b7', 'b8', 'knight');
    expect(countSquare(straight, 'b8')).toEqual({ type: 'knight', color: 'white', hasMoved: true });

    const capture = move(state, 'b7', 'a8', 'queen');
    expect(countSquare(capture, 'a8')).toEqual({ type: 'queen', color: 'white', hasMoved: true });
  });
});

describe('castling', () => {
  it('allows kingside castling once the path is clear and safe', () => {
    let state = createInitialGameState();
    state = move(state, 'g1', 'f3');
    state = move(state, 'g8', 'f6');
    state = move(state, 'g2', 'g3');
    state = move(state, 'g7', 'g6');
    state = move(state, 'f1', 'g2');
    state = move(state, 'f8', 'g7');
    state = move(state, 'e1', 'g1');
    expect(countSquare(state, 'g1')).toEqual({ type: 'king', color: 'white', hasMoved: true });
    expect(countSquare(state, 'f1')).toEqual({ type: 'rook', color: 'white', hasMoved: true });
    expect(countSquare(state, 'h1')).toBeNull();
  });

  it('forbids castling through an attacked square', () => {
    // Hand-built position: white king/rook ready to castle kingside, but a black
    // rook on f8 attacks f1 — the square the king must pass through.
    const empty = createInitialGameState();
    const board = empty.board.map((row) => row.map(() => null)) as GameState['board'];
    board[0][4] = { type: 'king', color: 'white', hasMoved: false };
    board[0][7] = { type: 'rook', color: 'white', hasMoved: false };
    board[7][4] = { type: 'king', color: 'black', hasMoved: true };
    board[7][5] = { type: 'rook', color: 'black', hasMoved: true }; // f8, attacks f1 down the file

    const state: GameState = {
      ...empty,
      board,
      turn: 'white',
      castlingRights: {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false },
      },
    };

    const legalFromE1 = getLegalMoves(state, algebraicToSquare('e1'));
    expect(legalFromE1.some((m) => m.isCastle)).toBe(false);
  });

  it('loses castling rights after the king moves', () => {
    let state = createInitialGameState();
    state = move(state, 'e2', 'e4');
    state = move(state, 'e7', 'e5');
    state = move(state, 'e1', 'e2');
    state = move(state, 'e8', 'e7');
    state = move(state, 'e2', 'e1');
    state = move(state, 'e7', 'e8');
    expect(state.castlingRights.white.kingSide).toBe(false);
    expect(state.castlingRights.white.queenSide).toBe(false);
  });
});

describe('check, checkmate, and stalemate', () => {
  it("detects Fool's Mate", () => {
    let state = createInitialGameState();
    state = move(state, 'f2', 'f3');
    state = move(state, 'e7', 'e5');
    state = move(state, 'g2', 'g4');
    state = move(state, 'd8', 'h4');
    expect(state.status).toBe('checkmate');
    expect(state.winner).toBe('black');
    expect(getAllLegalMoves(state, 'white')).toHaveLength(0);
  });

  it('detects a basic stalemate position', () => {
    // Classic stalemate: white king a1 boxed in, black king b3 and queen c2 give no checks
    // but remove every legal white move.
    const empty = createInitialGameState();
    const board = empty.board.map((row) => row.map(() => null)) as GameState['board'];
    board[0][0] = { type: 'king', color: 'white', hasMoved: true }; // a1
    board[2][1] = { type: 'king', color: 'black', hasMoved: true }; // b3
    board[1][2] = { type: 'queen', color: 'black', hasMoved: true }; // c2
    const state: GameState = {
      ...empty,
      board,
      turn: 'white',
      castlingRights: { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
    };
    expect(isInCheck(state, 'white')).toBe(false);
    expect(getAllLegalMoves(state, 'white')).toHaveLength(0);
  });

  it('prevents a pinned piece from exposing its own king', () => {
    const empty = createInitialGameState();
    const board = empty.board.map((row) => row.map(() => null)) as GameState['board'];
    board[0][4] = { type: 'king', color: 'white', hasMoved: true }; // e1
    board[0][5] = { type: 'bishop', color: 'white', hasMoved: true }; // f1 (pinned)
    board[0][7] = { type: 'rook', color: 'black', hasMoved: true }; // h1, pins the bishop to the king along rank 1
    board[7][4] = { type: 'king', color: 'black', hasMoved: true };

    const state: GameState = {
      ...empty,
      board,
      turn: 'white',
      castlingRights: { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
    };

    // The bishop only moves diagonally, but any diagonal move leaves the back rank
    // and exposes the king to the rook — so the pin leaves it with zero legal moves.
    const bishopMoves = getLegalMoves(state, algebraicToSquare('f1'));
    expect(bishopMoves).toHaveLength(0);
  });
});

describe('draw detection', () => {
  it('declares insufficient material with lone kings', () => {
    const empty = createInitialGameState();
    const board = empty.board.map((row) => row.map(() => null)) as GameState['board'];
    board[0][0] = { type: 'king', color: 'white', hasMoved: true };
    board[7][7] = { type: 'king', color: 'black', hasMoved: true };
    const state: GameState = {
      ...empty,
      board,
      turn: 'white',
      castlingRights: { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
    };

    const kingMoves = getLegalMoves(state, algebraicToSquare('a1'));
    const next = applyMove(state, kingMoves[0]);
    expect(next.status).toBe('draw-insufficient-material');
  });
});
