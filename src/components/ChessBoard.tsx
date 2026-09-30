import { findKing, squareEquals } from '../chess';
import type { GameState, Move, Square } from '../chess';
import { pieceGlyph } from './pieceGlyphs';
import './ChessBoard.css';

interface ChessBoardProps {
  gameState: GameState;
  selected: Square | null;
  legalMoves: Move[];
  onSquareClick: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const DISPLAY_ROWS = [7, 6, 5, 4, 3, 2, 1, 0];

export function ChessBoard({ gameState, selected, legalMoves, onSquareClick }: ChessBoardProps) {
  const lastMove = gameState.history[gameState.history.length - 1] as Move | undefined;
  const isCheckLike = gameState.status === 'check' || gameState.status === 'checkmate';
  const checkedKingSquare = isCheckLike ? findKing(gameState.board, gameState.turn) : null;

  return (
    <div className="chess-board" role="grid" aria-label="Chess board">
      {DISPLAY_ROWS.map((row) =>
        FILES.map((_, col) => {
          const square: Square = { row, col };
          const piece = gameState.board[row][col];
          const isDarkSquare = (row + col) % 2 === 0;
          const isSelected = Boolean(selected && squareEquals(selected, square));
          const legalTarget = legalMoves.find((m) => squareEquals(m.to, square));
          const isLastMove = Boolean(
            lastMove && (squareEquals(lastMove.from, square) || squareEquals(lastMove.to, square)),
          );
          const isCheckedKing = Boolean(checkedKingSquare && squareEquals(checkedKingSquare, square));

          const classNames = [
            'square',
            isDarkSquare ? 'square--dark' : 'square--light',
            isSelected && 'square--selected',
            isLastMove && 'square--last-move',
            isCheckedKing && 'square--check',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={`${row}-${col}`}
              type="button"
              role="gridcell"
              className={classNames}
              onClick={() => onSquareClick(square)}
              aria-label={`${FILES[col]}${row + 1}`}
            >
              {col === 0 && <span className="square__rank-label">{row + 1}</span>}
              {row === 0 && <span className="square__file-label">{FILES[col]}</span>}
              {piece && (
                <span className={`piece piece--${piece.color}`}>{pieceGlyph(piece.color, piece.type)}</span>
              )}
              {legalTarget && <span className={piece ? 'move-hint move-hint--capture' : 'move-hint'} />}
            </button>
          );
        }),
      )}
    </div>
  );
}
