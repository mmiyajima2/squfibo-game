import { describe, it, expect } from 'vitest';
import { Combo, ComboType } from './Combo';
import { Card } from '../entities/Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';
import { Position } from '../valueObjects/Position';

describe('Combo', () => {
  it('should create a two-card combo', () => {
    const card1 = new Card(CardValue.of(1), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.RED);
    const pos1 = Position.of(0, 0);
    const pos2 = Position.of(0, 1);

    const combo = new Combo(ComboType.TWO_CARDS_1_4, [card1, card2], [pos1, pos2]);

    expect(combo.type).toBe(ComboType.TWO_CARDS_1_4);
    expect(combo.cards).toEqual([card1, card2]);
    expect(combo.positions).toEqual([pos1, pos2]);
  });

  it('should create a three-card combo', () => {
    const card1 = new Card(CardValue.of(1), CardColor.BLUE);
    const card2 = new Card(CardValue.of(4), CardColor.BLUE);
    const card3 = new Card(CardValue.of(16), CardColor.BLUE);
    const pos1 = Position.of(0, 0);
    const pos2 = Position.of(1, 1);
    const pos3 = Position.of(2, 2);

    const combo = new Combo(
      ComboType.THREE_CARDS,
      [card1, card2, card3],
      [pos1, pos2, pos3]
    );

    expect(combo.type).toBe(ComboType.THREE_CARDS);
    expect(combo.getCardCount()).toBe(3);
    expect(combo.getRewardStars()).toBe(3);
  });

  it('should calculate reward stars correctly', () => {
    const card1 = new Card(CardValue.of(4), CardColor.RED);
    const card2 = new Card(CardValue.of(9), CardColor.RED);
    const combo = new Combo(
      ComboType.TWO_CARDS_4_9,
      [card1, card2],
      [Position.of(0, 0), Position.of(0, 1)]
    );

    expect(combo.getRewardStars()).toBe(2);
  });

  it('should throw error when cards and positions length mismatch', () => {
    const card1 = new Card(CardValue.of(1), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.RED);
    const pos1 = Position.of(0, 0);

    expect(
      () => new Combo(ComboType.TWO_CARDS_1_4, [card1, card2], [pos1])
    ).toThrow('Cards and positions arrays must have the same length');
  });
});
