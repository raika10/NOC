import { findKing, squareEquals } from '../chess';
import type { GameState, Move, Square } from '../chess';
import type { PieceInstance } from '../hooks/pieceTracking';
import { pieceGlyph } from './pieceGlyphs';
import './ChessBoard.css';

interface ChessBoardProps {
  gameState: GameState;
  pieceInstances: PieceInstance[];
  capturedFx: PieceInstance[];
  selected: Square | null;
  legalMoves: Move[];
  onSquareClick: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const DISPLAY_ROWS = [7, 6, 5, 4, 3, 2, 1, 0];

function displayPosition(square: Square) {
  const displayRow = 7 - square.row;
  return { left: `${square.col * 12.5}%`, top: `${displayRow * 12.5}%` };
}

export function ChessBoard({ gameState, pieceInstances, capturedFx, selected, legalMoves, onSquareClick }: ChessBoardProps) {
  const lastMove = gameState.history[gameState.history.length - 1] as Move | undefined;
  const isCheckLike = gameState.status === 'check' || gameState.status === 'checkmate';
  const checkedKingSquare = isCheckLike ? findKing(gameState.board, gameState.turn) : null;

  return (
    <div className="chess-board" role="grid" aria-label="Chess board">
      <div className="chess-board__grain" aria-hidden="true" />

      {DISPLAY_ROWS.map((row) =>
        FILES.map((_, col) => {
          const square: Square = { row, col };
          const isDarkSquare = (row + col) % 2 === 0;
          const isSelected = Boolean(selected && squareEquals(selected, square));
          const legalTarget = legalMoves.find((m) => squareEquals(m.to, square));
          const hasPieceHere = pieceInstances.some((inst) => squareEquals(inst.square, square));
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
              {legalTarget && <span className={hasPieceHere ? 'move-hint move-hint--capture' : 'move-hint'} />}
            </button>
          );
        }),
      )}

      <div className="pieces-layer" aria-hidden="true">
        {pieceInstances.map((inst) => (
          <div key={inst.id} className="piece-token" style={displayPosition(inst.square)}>
            <span className={`piece piece--${inst.piece.color}`}>{pieceGlyph(inst.piece.type)}</span>
          </div>
        ))}
        {capturedFx.map((inst) => (
          <div key={`captured-${inst.id}`} className="piece-token captured-piece" style={displayPosition(inst.square)}>
            <span className={`piece piece--${inst.piece.color}`}>{pieceGlyph(inst.piece.type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
