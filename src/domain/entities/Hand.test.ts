import { describe, it, expect } from 'vitest';
import { Hand } from './Hand';
import { Card } from './Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';

describe('Hand', () => {
  it('should start empty', () => {
    const hand = new Hand();
    expect(hand.hasCards()).toBe(false);
    expect(hand.getCardCount()).toBe(0);
    expect(hand.getCards()).toEqual([]);
  });

  it('should add cards', () => {
    const hand = new Hand();
    const card1 = new Card(CardValue.of(1), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.BLUE);

    hand.addCard(card1);
    expect(hand.getCardCount()).toBe(1);
    expect(hand.hasCards()).toBe(true);

    hand.addCard(card2);
    expect(hand.getCardCount()).toBe(2);
  });

  it('should remove cards', () => {
    const hand = new Hand();
    const card1 = new Card(CardValue.of(1), CardColor.RED);
    const card2 = new Card(CardValue.of(4), CardColor.BLUE);

    hand.addCard(card1);
    hand.addCard(card2);

    const removed = hand.removeCard(card1);
    expect(removed).toBe(card1);
    expect(hand.getCardCount()).toBe(1);
  });

  it('should throw error when removing non-existent card', () => {
    const hand = new Hand();
    const card = new Card(CardValue.of(1), CardColor.RED);

    expect(() => hand.removeCard(card)).toThrow('Card not found in hand');
  });

  it('should return copy of cards array', () => {
    const hand = new Hand();
    const card = new Card(CardValue.of(1), CardColor.RED);
    hand.addCard(card);

    const cards = hand.getCards();
    cards.push(new Card(CardValue.of(4), CardColor.BLUE));

    expect(hand.getCardCount()).toBe(1);
  });
});
