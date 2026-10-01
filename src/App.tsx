import { ChessBoard } from './components/ChessBoard';
import { GamePanel } from './components/GamePanel';
import { MoveHistory } from './components/MoveHistory';
import { PromotionDialog } from './components/PromotionDialog';
import { useChessGame } from './hooks/useChessGame';
import './App.css';

function App() {
  const {
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
  }= useChessGame();

  return (
    <div className="app">
      <main className="app__layout">
        <div className="app__board-column">
          <ChessBoard
            gameState={gameState}
            pieceInstances={pieceInstances}
            capturedFx={capturedFx}
            selected={selected}
            legalMoves={legalMoves}
            onSquareClick={selectSquare}
          />
          <MoveHistory history={gameState.history} />
        </div>
        <GamePanel gameState={gameState} onResign={resign} onReset={resetGame} />
      </main>
      {pendingPromotion && (
        <PromotionDialog color={gameState.turn} onChoose={confirmPromotion} onCancel={cancelPromotion} />
      )}
    </div>
  );
}

export default App;
