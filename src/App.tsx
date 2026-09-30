import { ChessBoard } from './components/ChessBoard';
import { GamePanel } from './components/GamePanel';
import { PromotionDialog } from './components/PromotionDialog';
import { useChessGame } from './hooks/useChessGame';
import './App.css';

function App() {
  const { gameState, selected, legalMoves, pendingPromotion, selectSquare, confirmPromotion, cancelPromotion, resetGame } =
    useChessGame();

  return (
    <div className="app">
      <main className="app__layout">
        <ChessBoard gameState={gameState} selected={selected} legalMoves={legalMoves} onSquareClick={selectSquare} />
        <GamePanel gameState={gameState} onReset={resetGame} />
      </main>
      {pendingPromotion && (
        <PromotionDialog color={gameState.turn} onChoose={confirmPromotion} onCancel={cancelPromotion} />
      )}
    </div>
  );
}

export default App;
