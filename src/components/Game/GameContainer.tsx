import { useGameState } from '../../hooks/useGameState';
import { useUIState } from '../../hooks/useUIState';
import { Position } from '../../domain/valueObjects/Position';
import { Card } from '../../domain/entities/Card';
import { BoardGrid } from '../Board/BoardGrid';
import { HandArea } from '../Hand/HandArea';
import { GameStatus } from './GameStatus';
import './GameContainer.css';

export function GameContainer() {
  const { game, placeCardFromHand, endTurn, resetGame } = useGameState();
  const { selectedCard, selectCard, highlightedPositions, clearHighlight } = useUIState();

  const currentPlayer = game.getCurrentPlayer();
  const opponent = game.getOpponent();
  const isPlayer1Turn = currentPlayer.id === 'player1';

  const handleCardSelect = (card: Card) => {
    if (!isPlayer1Turn) return;

    if (selectedCard?.equals(card)) {
      selectCard(null);
    } else {
      selectCard(card);
    }
  };

  const handleCellClick = (position: Position) => {
    if (!isPlayer1Turn) return;
    if (!selectedCard) return;
    if (!game.board.isEmpty(position)) return;

    try {
      placeCardFromHand(selectedCard, position);
      selectCard(null);
      clearHighlight();
    } catch (error) {
      console.error('Failed to place card:', error);
    }
  };

  const handleEndTurn = () => {
    if (!isPlayer1Turn) return;
    endTurn();
    selectCard(null);
  };

  const handleResetGame = () => {
    resetGame();
    selectCard(null);
    clearHighlight();
  };

  const player1 = game.players[0];
  const player2 = game.players[1];

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">SquFibo（すくふぃぼ）</h1>
        <button className="reset-button" onClick={handleResetGame}>
          新しいゲーム
        </button>
      </div>

      <div className="game-content">
        <div className="opponent-area">
          <HandArea
            cards={player2.hand.getCards()}
            selectedCard={null}
            label="CPU の手札"
            isOpponent={true}
          />
        </div>

        <div className="game-middle">
          <div className="status-board-container">
            <GameStatus game={game} />
            <BoardGrid
              board={game.board}
              highlightedPositions={highlightedPositions}
              onCellClick={handleCellClick}
            />
          </div>
        </div>

        <div className="player-area">
          <HandArea
            cards={player1.hand.getCards()}
            selectedCard={selectedCard}
            onCardClick={handleCardSelect}
            label="あなたの手札"
            isOpponent={false}
          />
          <div className="player-controls">
            <button
              className="end-turn-button"
              onClick={handleEndTurn}
              disabled={!isPlayer1Turn}
            >
              ターン終了
            </button>
            {selectedCard && (
              <div className="selected-card-info">
                選択中: {selectedCard.color} {selectedCard.value.value}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
