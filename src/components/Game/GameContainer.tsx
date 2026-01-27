import { useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useUIState } from '../../hooks/useUIState';
import { useCommentary } from '../../hooks/useCommentary';
import { Position } from '../../domain/valueObjects/Position';
import { Card } from '../../domain/entities/Card';
import { CardColor } from '../../domain/valueObjects/CardColor';
import { BoardGrid } from '../Board/BoardGrid';
import { HandArea } from '../Hand/HandArea';
import { GameStatus } from './GameStatus';
import { CommentaryArea } from '../Commentary/CommentaryArea';
import { CommentaryBuilder } from '../../types/Commentary';
import './GameContainer.css';

export function GameContainer() {
  const { game, placeCardFromHand, endTurn, resetGame } = useGameState();
  const { selectedCard, selectCard, highlightedPositions, highlightPositions, clearHighlight, errorMessage, showError, clearError } = useUIState();
  const { messages, currentMessage, addMessage, updateCurrent, clearMessages } = useCommentary();

  const currentPlayer = game.getCurrentPlayer();
  const isPlayer1Turn = currentPlayer.id === 'player1';

  // 初回レンダリング時にゲーム開始メッセージを表示
  useEffect(() => {
    addMessage(CommentaryBuilder.gameStart());
    updateCurrent('あなたのターンです');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // エラーメッセージを3秒後に自動的にクリア
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearError]);

  const handleCardSelect = (card: Card) => {
    if (!isPlayer1Turn) return;

    if (selectedCard?.equals(card)) {
      selectCard(null);
      clearHighlight();
    } else {
      // 手札から同じIDのカードを探す
      const cardInHand = player1.hand.getCards().find(c => c.id === card.id);
      if (cardInHand) {
        selectCard(cardInHand);
        // 配置可能なセル（空のセル）をハイライト表示
        const emptyPositions: Position[] = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const pos = Position.of(row, col);
            if (game.board.isEmpty(pos)) {
              emptyPositions.push(pos);
            }
          }
        }
        highlightPositions(emptyPositions);
      }
    }
  };

  const handleCellClick = (position: Position) => {
    if (!isPlayer1Turn) {
      showError('あなたのターンではありません');
      return;
    }
    if (!selectedCard) {
      showError('手札からカードを選択してください');
      return;
    }
    if (!game.board.isEmpty(position)) {
      showError('そのマスには既にカードが配置されています');
      return;
    }

    try {
      const cardColor = selectedCard.color === CardColor.RED ? '赤' : '青';
      const cardValue = selectedCard.value.value;

      // 現在の手札から選択されたカードと同じIDのカードを探す
      const currentHand = game.getCurrentPlayer().hand.getCards();
      const cardToPlay = currentHand.find(c => c.id === selectedCard.id);

      if (!cardToPlay) {
        showError('選択されたカードが手札に見つかりません');
        return;
      }

      placeCardFromHand(cardToPlay, position);
      addMessage(CommentaryBuilder.playerPlacedCard(cardColor, cardValue));
      selectCard(null);
      clearHighlight();
      clearError();
    } catch (error) {
      console.error('Failed to place card:', error);
      showError('カードの配置に失敗しました');
    }
  };

  const handleEndTurn = () => {
    if (!isPlayer1Turn) return;
    endTurn();
    addMessage(CommentaryBuilder.cpuTurn());
    updateCurrent('CPUのターンです');
    selectCard(null);
  };

  const handleResetGame = () => {
    resetGame();
    clearMessages();
    addMessage(CommentaryBuilder.gameStart());
    updateCurrent('あなたのターンです');
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
          <div className="status-board-commentary-container">
            <GameStatus game={game} />
            <BoardGrid
              board={game.board}
              highlightedPositions={highlightedPositions}
              onCellClick={handleCellClick}
            />
            <CommentaryArea messages={messages} currentMessage={currentMessage} />
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
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
