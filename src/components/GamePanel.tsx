import type { GameState } from '../chess';
import './GamePanel.css';

interface GamePanelProps {
  gameState: GameState;
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
};

function turnLabel(color: GameState['turn']) {
  return color === 'white' ? '白' : '黒';
}

export function GamePanel({ gameState, onReset }: GamePanelProps) {
  const { status, turn, winner, history } = gameState;

  let headline: string;
  if (status === 'checkmate') {
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
      <button type="button" className="game-panel__reset" onClick={onReset}>
        新しい対局
      </button>
      <h2 className="game-panel__history-title">棋譜</h2>
      <ol className="game-panel__history">
        {chunkMoves(history.map((m) => m.notation ?? '')).map(([whiteMove, blackMove], index) => (
          <li key={index}>
            <span className="game-panel__move-number">{index + 1}.</span>
            <span className="game-panel__move">{whiteMove}</span>
            <span className="game-panel__move">{blackMove ?? ''}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function chunkMoves(moves: string[]): [string, string | undefined][] {
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }
  return pairs;
}
