import { useEffect, useRef } from 'react';
import type { Move } from '../chess';
import './MoveHistory.css';

interface MoveHistoryProps {
  history: Move[];
}

export function MoveHistory({ history }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className="move-history move-history--empty">
        <span>棋譜はここに表示されます</span>
      </div>
    );
  }

  return (
    <div className="move-history" ref={scrollRef}>
      {history.map((move, index) => (
        <div
          key={index}
          className={`move-history__pair move-history__move--${index % 2 === 0 ? 'white' : 'black'}`}
        >
          <span className="move-history__move">{move.notation}</span>
        </div>
      ))}
    </div>
  );
}
