import { useEffect, useMemo } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useUIState } from '../../hooks/useUIState';
import { useCommentary } from '../../hooks/useCommentary';
import { Position } from '../../domain/valueObjects/Position';
import { Card } from '../../domain/entities/Card';
import { CardColor } from '../../domain/valueObjects/CardColor';
import { ComboDetector } from '../../domain/services/ComboDetector';
import { Combo } from '../../domain/services/Combo';
import { BoardGrid } from '../Board/BoardGrid';
import { HandArea } from '../Hand/HandArea';
import { GameStatus } from './GameStatus';
import { CommentaryArea } from '../Commentary/CommentaryArea';
import { CommentaryBuilder } from '../../types/Commentary';
import './GameContainer.css';

export function GameContainer() {
  const { game, placeCardFromHand, claimCombo, endTurn, resetGame } = useGameState();
  const {
    selectedCard,
    selectCard,
    selectedBoardCards,
    toggleBoardCardSelection,
    clearBoardCardSelection,
    highlightedPositions,
    highlightPositions,
    clearHighlight,
    errorMessage,
    showError,
    clearError
  } = useUIState();
  const { messages, addMessage, updateCurrent, clearMessages } = useCommentary();

  const comboDetector = useMemo(() => new ComboDetector(), []);
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
    clearBoardCardSelection();
  };

  // 「役を申告」ボタンを押した時（モーダルなし、直接検証）
  const handleClaimCombo = () => {
    if (!isPlayer1Turn) {
      showError('あなたのターンではありません');
      return;
    }
    if (selectedBoardCards.length === 0) {
      showError('役を構成するカードを盤面から選択してください');
      return;
    }
    if (selectedBoardCards.length < 2 || selectedBoardCards.length > 3) {
      showError('役は2枚または3枚のカードで構成されます');
      return;
    }

    // 盤面から選択したカードの位置を取得
    const positions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pos = Position.of(row, col);
        const card = game.board.getCard(pos);
        if (card && selectedBoardCards.some(sc => sc.id === card.id)) {
          positions.push(pos);
        }
      }
    }

    // 役を検証
    const verifiedComboType = comboDetector.checkCombo(selectedBoardCards, positions);

    if (verifiedComboType === null) {
      // 選択したカードは役ではない
      showError('おしい！選択したカードは役ではありません');
      clearBoardCardSelection();
      return;
    }

    // 正しい役が申告された
    const combo = new Combo(verifiedComboType, selectedBoardCards, positions);
    const success = claimCombo(combo);

    if (success) {
      const cardCount = combo.getCardCount();
      const starsAwarded = combo.getRewardStars();
      const comboName = getComboTypeName(verifiedComboType);
      addMessage(
        CommentaryBuilder.createMessage('combo', '💫', `${comboName}を申告しました！★+${starsAwarded}、カード${cardCount}枚ドロー`)
      );
      clearBoardCardSelection();
      clearError();
    } else {
      showError('役の申告に失敗しました');
    }
  };

  const getComboTypeName = (comboType: string): string => {
    switch (comboType) {
      case 'TWO_CARDS_1_4':
        return '1-4ペア';
      case 'TWO_CARDS_4_9':
        return '4-9ペア';
      case 'THREE_CARDS':
        return '1-4-16トリプル';
      default:
        return '役';
    }
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
              selectedCards={selectedBoardCards}
              onCellClick={handleCellClick}
              onCardClick={toggleBoardCardSelection}
            />
            <CommentaryArea messages={messages} />
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
              className="claim-combo-button"
              onClick={handleClaimCombo}
              disabled={!isPlayer1Turn}
            >
              役を申告
            </button>
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
            {selectedBoardCards.length > 0 && (
              <div className="selected-board-cards-info">
                申告用カード選択中: {selectedBoardCards.length}枚
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
