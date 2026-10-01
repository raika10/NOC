import { useCallback, useMemo, useRef, useState } from 'react';
import { applyMove, createInitialGameState, getLegalMoves, squareEquals } from '../chess';
import type { GameState, Move, PieceType, Square } from '../chess';
import { applyMoveToInstances, createInitialPieceInstances, findInstanceAt } from './pieceTracking';
import type { PieceInstance } from './pieceTracking';

interface PendingPromotion {
  from: Square;
  to: Square;
  options: Move[];
}

const CAPTURE_FADE_MS = 260;

export function useChessGame() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [pieceInstances, setPieceInstances] = useState<PieceInstance[]>(() =>
    createInitialPieceInstances(gameState.board),
  );
  const [capturedFx, setCapturedFx] = useState<PieceInstance[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const captureTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const legalMoves = useMemo(() => (selected ? getLegalMoves(gameState, selected) : []), [gameState, selected]);

  const isGameOver = gameState.status !== 'playing' && gameState.status !== 'check';

  const commitMove = useCallback((move: Move) => {
    setGameState((state) => applyMove(state, move));
    setPieceInstances((prev) => {
      if (move.captured && move.capturedSquare) {
        const capturedInstance = findInstanceAt(prev, move.capturedSquare);
        if (capturedInstance) {
          setCapturedFx((fx) => [...fx, capturedInstance]);
          const timer = setTimeout(() => {
            setCapturedFx((fx) => fx.filter((c) => c.id !== capturedInstance.id));
          }, CAPTURE_FADE_MS);
          captureTimers.current.push(timer);
        }
      }
      return applyMoveToInstances(prev, move);
    });
  }, []);

  const selectSquare = useCallback(
    (square: Square) => {
      if (isGameOver || pendingPromotion) return;

      const piece = gameState.board[square.row][square.col];

      if (selected && squareEquals(selected, square)) {
        setSelected(null);
        return;
      }

      if (selected) {
        const matches = legalMoves.filter((m) => squareEquals(m.to, square));
        if (matches.length > 0) {
          if (matches.length > 1) {
            setPendingPromotion({ from: selected, to: square, options: matches });
          } else {
            commitMove(matches[0]);
          }
          setSelected(null);
          return;
        }
      }

      if (piece && piece.color === gameState.turn) {
        setSelected(square);
      } else {
        setSelected(null);
      }
    },
    [gameState, selected, legalMoves, isGameOver, pendingPromotion, commitMove],
  );

  const confirmPromotion = useCallback(
    (promotion: PieceType) => {
      if (!pendingPromotion) return;
      const move = pendingPromotion.options.find((m) => m.promotion === promotion);
      if (move) {
        commitMove(move);
      }
      setPendingPromotion(null);
    },
    [pendingPromotion, commitMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const resign = useCallback(() => {
    setGameState((state) => ({
      ...state,
      status: 'resigned',
      winner: state.turn === 'white' ? 'black' : 'white',
    }));
    setSelected(null);
    setPendingPromotion(null);
  }, []);

  const resetGame = useCallback(() => {
    captureTimers.current.forEach(clearTimeout);
    captureTimers.current = [];
    const initial = createInitialGameState();
    setGameState(initial);
    setPieceInstances(createInitialPieceInstances(initial.board));
    setCapturedFx([]);
    setSelected(null);
    setPendingPromotion(null);
  }, []);

  return {
    gameState,
    pieceInstances,
    capturedFx,
    selected,
    legalMoves,
    pendingPromotion,
    selectSquare,
    confirmPromotion,
    cancelPromotion,
    resign,
    resetGame,
  };
}
