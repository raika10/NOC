import type { Color, PieceType } from '../chess';
import { pieceGlyph } from './pieceGlyphs';
import './PromotionDialog.css';

interface PromotionDialogProps {
  color: Color;
  onChoose: (type: PieceType) => void;
  onCancel: () => void;
}

const CHOICES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

export function PromotionDialog({ color, onChoose, onCancel }: PromotionDialogProps) {
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
        <p>昇格する駒を選んでください</p>
        <div className="promotion-dialog__options">
          {CHOICES.map((type) => (
            <button key={type} type="button" onClick={() => onChoose(type)} aria-label={type}>
              <span className={`piece piece--${color}`}>{pieceGlyph(type)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
