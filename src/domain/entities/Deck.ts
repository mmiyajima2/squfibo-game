import { Card } from './Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';

export class Deck {
  constructor(private cards: Card[] = []) {}

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card | null {
    return this.cards.pop() || null;
  }

  peek(): Card | null {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  getCardCount(): number {
    return this.cards.length;
  }

  static createInitialDeck(): Deck {
    const cards: Card[] = [];
    const values = [1, 4, 9, 16];
    const colors = [CardColor.RED, CardColor.BLUE];

    for (const value of values) {
      for (const color of colors) {
        for (let i = 0; i < 8; i++) {
          cards.push(new Card(CardValue.of(value), color));
        }
      }
    }

    return new Deck(cards);
  }
}
