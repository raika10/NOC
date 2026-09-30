import { useCallback, useMemo, useState } from 'react';
import { applyMove, createInitialGameState, getLegalMoves, squareEquals } from '../chess';
import type { GameState, Move, PieceType, Square } from '../chess';

interface PendingPromotion {
  from: Square;
  to: Square;
  options: Move[];
}

export function useChessGame() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const legalMoves = useMemo(() => (selected ? getLegalMoves(gameState, selected) : []), [gameState, selected]);

  const isGameOver = gameState.status !== 'playing' && gameState.status !== 'check';

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
            setGameState((state) => applyMove(state, matches[0]));
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
    [gameState, selected, legalMoves, isGameOver, pendingPromotion],
  );

  const confirmPromotion = useCallback(
    (promotion: PieceType) => {
      if (!pendingPromotion) return;
      const move = pendingPromotion.options.find((m) => m.promotion === promotion);
      if (move) {
        setGameState((state) => applyMove(state, move));
      }
      setPendingPromotion(null);
    },
    [pendingPromotion],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelected(null);
    setPendingPromotion(null);
  }, []);

  return {
    gameState,
    selected,
    legalMoves,
    pendingPromotion,
    selectSquare,
    confirmPromotion,
    cancelPromotion,
    resetGame,
  };
}
