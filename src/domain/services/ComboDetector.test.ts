import { describe, it, expect, beforeEach } from 'vitest';
import { ComboDetector } from './ComboDetector';
import { ComboType } from './Combo';
import { Board } from '../entities/Board';
import { Card } from '../entities/Card';
import { CardValue } from '../valueObjects/CardValue';
import { CardColor } from '../valueObjects/CardColor';
import { Position } from '../valueObjects/Position';

describe('ComboDetector', () => {
  let detector: ComboDetector;
  let board: Board;

  beforeEach(() => {
    detector = new ComboDetector();
    board = new Board();
  });

  describe('detectCombos', () => {
    it('should detect 1+4 combo with same color', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);

      board.placeCard(card1, Position.of(0, 0));
      board.placeCard(card4, Position.of(0, 1));

      const combos = detector.detectCombos(board, Position.of(0, 1));

      expect(combos.length).toBe(1);
      expect(combos[0].type).toBe(ComboType.TWO_CARDS_1_4);
      expect(combos[0].getCardCount()).toBe(2);
    });

    it('should detect 4+9 combo with same color', () => {
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);
      const card9 = new Card(CardValue.of(9), CardColor.BLUE);

      board.placeCard(card4, Position.of(1, 1));
      board.placeCard(card9, Position.of(2, 2));

      const combos = detector.detectCombos(board, Position.of(2, 2));

      expect(combos.length).toBe(1);
      expect(combos[0].type).toBe(ComboType.TWO_CARDS_4_9);
    });

    it('should not detect combo with different colors', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);

      board.placeCard(card1, Position.of(0, 0));
      board.placeCard(card4, Position.of(0, 1));

      const combos = detector.detectCombos(board, Position.of(0, 1));

      expect(combos.length).toBe(0);
    });

    it('should detect 1+4+16 combo', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const card16 = new Card(CardValue.of(16), CardColor.RED);

      board.placeCard(card1, Position.of(0, 0));
      board.placeCard(card4, Position.of(1, 1));
      board.placeCard(card16, Position.of(2, 2));

      const combos = detector.detectCombos(board, Position.of(2, 2));

      expect(combos.length).toBeGreaterThan(0);
      const threeCardCombo = combos.find(c => c.type === ComboType.THREE_CARDS);
      expect(threeCardCombo).toBeDefined();
      expect(threeCardCombo!.getCardCount()).toBe(3);
      expect(threeCardCombo!.getRewardStars()).toBe(3);
    });

    it('should detect both 2-card and 3-card combos when both exist', () => {
      const card1 = new Card(CardValue.of(1), CardColor.BLUE);
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);
      const card16 = new Card(CardValue.of(16), CardColor.BLUE);

      board.placeCard(card1, Position.of(0, 0));
      board.placeCard(card4, Position.of(1, 1));
      board.placeCard(card16, Position.of(2, 2));

      const combos = detector.detectCombos(board, Position.of(1, 1));

      expect(combos.length).toBeGreaterThan(1);
      expect(combos.some(c => c.type === ComboType.TWO_CARDS_1_4)).toBe(true);
      expect(combos.some(c => c.type === ComboType.THREE_CARDS)).toBe(true);
    });

    it('should return empty array when no combos exist', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      board.placeCard(card1, Position.of(0, 0));

      const combos = detector.detectCombos(board, Position.of(0, 0));

      expect(combos.length).toBe(0);
    });

    it('should only detect combos that include last placed card', () => {
      const redCard1 = new Card(CardValue.of(1), CardColor.RED);
      const redCard4 = new Card(CardValue.of(4), CardColor.RED);
      const blueCard9 = new Card(CardValue.of(9), CardColor.BLUE);

      board.placeCard(redCard1, Position.of(0, 0));
      board.placeCard(redCard4, Position.of(0, 1));
      board.placeCard(blueCard9, Position.of(1, 1));

      const combos = detector.detectCombos(board, Position.of(1, 1));

      expect(combos.length).toBe(0);
    });
  });

  describe('checkCombo', () => {
    it('should validate 1+4 combo', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);

      const result = detector.checkCombo(
        [card1, card4],
        [Position.of(0, 0), Position.of(0, 1)]
      );

      expect(result).toBe(ComboType.TWO_CARDS_1_4);
    });

    it('should validate 4+9 combo', () => {
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);
      const card9 = new Card(CardValue.of(9), CardColor.BLUE);

      const result = detector.checkCombo(
        [card4, card9],
        [Position.of(1, 1), Position.of(1, 2)]
      );

      expect(result).toBe(ComboType.TWO_CARDS_4_9);
    });

    it('should validate 1+4+16 combo', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const card16 = new Card(CardValue.of(16), CardColor.RED);

      const result = detector.checkCombo(
        [card1, card4, card16],
        [Position.of(0, 0), Position.of(0, 1), Position.of(0, 2)]
      );

      expect(result).toBe(ComboType.THREE_CARDS);
    });

    it('should return null for different colors', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);

      const result = detector.checkCombo(
        [card1, card4],
        [Position.of(0, 0), Position.of(0, 1)]
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid combination', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card9 = new Card(CardValue.of(9), CardColor.RED);

      const result = detector.checkCombo(
        [card1, card9],
        [Position.of(0, 0), Position.of(1, 1)]
      );

      expect(result).toBeNull();
    });

    it('should return null when cards and positions length mismatch', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);

      const result = detector.checkCombo([card1], [Position.of(0, 0), Position.of(1, 1)]);

      expect(result).toBeNull();
    });

    it('should return null for 2-card combo with diagonal positions', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);

      // 斜め配置（角が接するだけ）
      const result = detector.checkCombo(
        [card1, card4],
        [Position.of(0, 0), Position.of(1, 1)]
      );

      expect(result).toBeNull();
    });

    it('should return null for 3-card combo with diagonal positions', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const card16 = new Card(CardValue.of(16), CardColor.RED);

      // 斜め配置
      const result = detector.checkCombo(
        [card1, card4, card16],
        [Position.of(0, 0), Position.of(1, 1), Position.of(2, 2)]
      );

      expect(result).toBeNull();
    });

    it('should validate 3-card combo in L-shape', () => {
      const card1 = new Card(CardValue.of(1), CardColor.BLUE);
      const card4 = new Card(CardValue.of(4), CardColor.BLUE);
      const card16 = new Card(CardValue.of(16), CardColor.BLUE);

      // L字型配置
      // (0,0)-(0,1)
      //   |
      // (1,0)
      const result = detector.checkCombo(
        [card1, card4, card16],
        [Position.of(0, 0), Position.of(0, 1), Position.of(1, 0)]
      );

      expect(result).toBe(ComboType.THREE_CARDS);
    });

    it('should validate 3-card combo in vertical line', () => {
      const card1 = new Card(CardValue.of(1), CardColor.RED);
      const card4 = new Card(CardValue.of(4), CardColor.RED);
      const card16 = new Card(CardValue.of(16), CardColor.RED);

      // 縦に3つ連なる
      const result = detector.checkCombo(
        [card1, card4, card16],
        [Position.of(0, 0), Position.of(1, 0), Position.of(2, 0)]
      );

      expect(result).toBe(ComboType.THREE_CARDS);
    });
  });
});
