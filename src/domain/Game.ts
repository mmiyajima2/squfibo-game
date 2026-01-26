import { Board } from './entities/Board';
import { Deck } from './entities/Deck';
import { Player } from './entities/Player';
import { Card } from './entities/Card';
import { Position } from './valueObjects/Position';
import { Combo } from './services/Combo';

export enum GameState {
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export class Game {
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

  claimCombo(combo: Combo): boolean {
    if (this.gameState === GameState.FINISHED) {
      return false;
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
    if (this.totalStars === 0 || this.deck.isEmpty()) {
      this.gameState = GameState.FINISHED;
    }

    this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
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
}
