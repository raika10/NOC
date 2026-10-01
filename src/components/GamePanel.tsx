import type { GameState } from '../chess';
import './GamePanel.css';

interface GamePanelProps {
  gameState: GameState;
  onResign: () => void;
  onReset: () => void;
}

const STATUS_LABEL: Record<GameState['status'], string> = {
  playing: '対局中',
  check: 'チェック!',
  checkmate: 'チェックメイト',
  stalemate: 'ステイルメイト(引き分け)',
  'draw-fifty-move': '引き分け(50手ルール)',
  'draw-repetition': '引き分け(同一局面3回)',
  'draw-insufficient-material': '引き分け(駒不足)',
  resigned: '投了',
};

function turnLabel(color: GameState['turn']) {
  return color === 'white' ? '白' : '黒';
}

export function GamePanel({ gameState, onResign, onReset }: GamePanelProps) {
  const { status, turn, winner } = gameState;
  const isGameOver = status !== 'playing' && status !== 'check';

  let headline: string;
  if (status === 'checkmate' || status === 'resigned') {
    headline = `${turnLabel(winner!)}の勝ち — ${STATUS_LABEL[status]}`;
  } else if (status.startsWith('draw') || status === 'stalemate') {
    headline = STATUS_LABEL[status];
  } else {
    headline = `${turnLabel(turn)}の番${status === 'check' ? '(チェック中)' : ''}`;
  }

  return (
    <aside className="game-panel">
      <h1 className="game-panel__title">NOC Chess</h1>
      <p className="game-panel__status" data-status={status}>
        {headline}
      </p>
      {isGameOver ? (
        <button type="button" className="game-panel__reset" onClick={onReset}>
          新しい対局
        </button>
      ) : (
        gameState.history.length > 0 && (
          <button type="button" className="game-panel__reset" onClick={onResign}>
            投了
          </button>
        )
      )}
    </aside>
  );
}
