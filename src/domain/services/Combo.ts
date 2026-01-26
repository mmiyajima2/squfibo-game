import { Card } from '../entities/Card';
import { Position } from '../valueObjects/Position';

export enum ComboType {
  TWO_CARDS_1_4 = 'TWO_CARDS_1_4',
  TWO_CARDS_4_9 = 'TWO_CARDS_4_9',
  THREE_CARDS = 'THREE_CARDS',
}

export class Combo {
  constructor(
    public readonly type: ComboType,
    public readonly cards: Card[],
    public readonly positions: Position[]
  ) {
    if (cards.length !== positions.length) {
      throw new Error('Cards and positions arrays must have the same length');
    }
  }

  getRewardStars(): number {
    return this.cards.length;
  }

  getCardCount(): number {
    return this.cards.length;
  }
}
