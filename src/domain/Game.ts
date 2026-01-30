import { Board } from './entities/Board';
import { Deck } from './entities/Deck';
import { Player } from './entities/Player';
import { Card } from './entities/Card';
import { Position } from './valueObjects/Position';
import { Combo, isClearingCombo } from './services/Combo';

export enum GameState {
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export class Game {
  private lastAutoDrawnPlayerId: string | null = null;

  private constructor(
    public readonly board: Board,
    public readonly deck: Deck,
    public readonly players: [Player, Player],
    private currentPlayerIndex: 0 | 1,
    private totalStars: number,
    private discardPile: Card[],
    private gameState: GameState
  ) {}

  static createNewGame(): Game {
    const deck = Deck.createInitialDeck();
    deck.shuffle();

    const player1 = new Player('player1');
    const player2 = new Player('player2');

    for (let i = 0; i < 13; i++) {
      const card1 = deck.draw();
      const card2 = deck.draw();
      if (card1) player1.drawToHand(card1);
      if (card2) player2.drawToHand(card2);
    }

    return new Game(
      new Board(),
      deck,
      [player1, player2],
      0,
      34,
      [],
      GameState.PLAYING
    );
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  getOpponent(): Player {
    return this.players[this.currentPlayerIndex === 0 ? 1 : 0];
  }

  placeCard(card: Card, position: Position): void {
    if (this.gameState === GameState.FINISHED) {
      throw new Error('Game is already finished');
    }

    if (!this.board.isEmpty(position)) {
      throw new Error('Position is not empty');
    }

    this.board.placeCard(card, position);
  }

  discardFromBoard(position: Position): void {
    const card = this.board.removeCard(position);
    if (card) {
      this.discardPile.push(card);
    }
  }

  discardFromHand(card: Card): void {
    if (this.gameState === GameState.FINISHED) {
      throw new Error('Game is already finished');
    }

    const currentPlayer = this.getCurrentPlayer();
    const discardedCard = currentPlayer.playCard(card);
    this.discardPile.push(discardedCard);
  }

  drawAndPlaceCard(position: Position): Card | null {
    if (this.gameState === GameState.FINISHED) {
      throw new Error('Game is already finished');
    }

    if (!this.board.isEmpty(position)) {
      throw new Error('Position is not empty');
    }

    if (this.deck.isEmpty()) {
      throw new Error('Deck is empty');
    }

    const drawnCard = this.deck.draw();
    if (drawnCard) {
      this.board.placeCard(drawnCard, position);
    }
    return drawnCard;
  }

  claimCombo(combo: Combo): boolean {
    if (this.gameState === GameState.FINISHED) {
      return false;
    }

    // Handle clearing yaku: clear all cards from the board
    if (isClearingCombo(combo.type)) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const pos = Position.of(row, col);
          const card = this.board.removeCard(pos);
          if (card) {
            this.discardPile.push(card);
          }
        }
      }
      return true; // No card refill or star reward
    }

    const currentPlayer = this.getCurrentPlayer();
    const cardCount = combo.getCardCount();

    for (const position of combo.positions) {
      const card = this.board.removeCard(position);
      if (card) {
        this.discardPile.push(card);
      }
    }

    for (let i = 0; i < cardCount; i++) {
      if (this.deck.isEmpty()) {
        break;
      }
      const drawnCard = this.deck.draw();
      if (drawnCard) {
        currentPlayer.drawToHand(drawnCard);
      }
    }

    const starsToAward = Math.min(cardCount, this.totalStars);
    currentPlayer.addStars(starsToAward);
    this.totalStars -= starsToAward;

    return true;
  }

  endTurn(): void {
    // ゲーム終了判定
    // 1. 全ての星が配布された
    // 2. 山札が空
    // 3. 盤面が満杯で、両プレイヤーとも手札がない（配置不可能）
    if (this.totalStars === 0 || this.deck.isEmpty()) {
      this.gameState = GameState.FINISHED;
    } else if (this.board.isFull()) {
      const bothPlayersOutOfCards = this.players.every(player => !player.hand.hasCards());
      if (bothPlayersOutOfCards) {
        this.gameState = GameState.FINISHED;
      }
    }

    this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;

    // ターン開始時の自動ドロー
    if (this.gameState !== GameState.FINISHED) {
      const nextPlayer = this.getCurrentPlayer();
      if (!nextPlayer.hand.hasCards() && !this.deck.isEmpty()) {
        const drawnCard = this.deck.draw();
        if (drawnCard) {
          nextPlayer.drawToHand(drawnCard);
          this.lastAutoDrawnPlayerId = nextPlayer.id;
        }
      }
    }
  }

  isGameOver(): boolean {
    return this.gameState === GameState.FINISHED;
  }

  getWinner(): Player | null {
    if (!this.isGameOver()) {
      return null;
    }

    const [player1, player2] = this.players;
    if (player1.stars > player2.stars) {
      return player1;
    } else if (player2.stars > player1.stars) {
      return player2;
    }
    return null;
  }

  getTotalStars(): number {
    return this.totalStars;
  }

  getDiscardPileCount(): number {
    return this.discardPile.length;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getLastAutoDrawnPlayerId(): string | null {
    return this.lastAutoDrawnPlayerId;
  }

  clearAutoDrawFlag(): void {
    this.lastAutoDrawnPlayerId = null;
  }
}
