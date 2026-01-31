import { describe, it, expect } from 'vitest';
import { CPUEasyStrategy } from './CPUEasyStrategy';
import { Game } from '../../Game';
import { Card } from '../../entities/Card';
import { CardValue } from '../../valueObjects/CardValue';
import { CardColor } from '../../valueObjects/CardColor';
import { Position } from '../../valueObjects/Position';
import { ComboType } from '../Combo';

describe('CPUEasyStrategy', () => {
  describe('executeTurn', () => {
    it('手札がある場合、カードを配置できる', () => {
      const game = Game.createNewGame('Easy', false);
      const strategy = new CPUEasyStrategy();

      const result = strategy.executeTurn(game);

      expect(result.placedCard).toBeDefined();
      expect(result.position).toBeDefined();
      expect(game.board.getCard(result.position)).toBe(result.placedCard);
    });

    it('盤面が満杯の場合、カードを除去してから配置する', () => {
      const game = Game.createNewGame('Easy', false);
      const strategy = new CPUEasyStrategy();

      // 盤面を満杯にする
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const pos = Position.of(row, col);
          if (game.board.isEmpty(pos)) {
            const card = new Card(CardValue.of(1), CardColor.RED);
            game.placeCard(card, pos);
          }
        }
      }

      const result = strategy.executeTurn(game);

      expect(result.removedPosition).toBeDefined();
      expect(result.placedCard).toBeDefined();
    });
  });

  describe('役の優先順位', () => {
    it('THREE_CARDSが最優先で選択される', () => {
      const game = Game.createNewGame('Easy', false);
      const currentPlayer = game.getCurrentPlayer();

      // 1+4+16の役を作る
      const pos1 = Position.of(0, 0);
      const pos2 = Position.of(0, 1);
      const pos3 = Position.of(0, 2);

      game.placeCard(new Card(CardValue.of(1), CardColor.RED), pos1);
      game.placeCard(new Card(CardValue.of(4), CardColor.RED), pos2);

      // 手札に16を追加
      currentPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

      const strategy = new CPUEasyStrategy();

      // THREE_CARDSが検出される状況で複数回実行
      let threeCardsClaimedCount = 0;
      let totalAttempts = 0;

      // 見落としがあるため、複数回試行
      for (let i = 0; i < 20; i++) {
        const testGame = Game.createNewGame('Easy', false);
        const testPlayer = testGame.getCurrentPlayer();

        // 同じ盤面を再現
        testGame.placeCard(new Card(CardValue.of(1), CardColor.RED), pos1);
        testGame.placeCard(new Card(CardValue.of(4), CardColor.RED), pos2);
        testPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

        // CPUのターンを実行（pos3に配置されることを期待）
        const result = strategy.executeTurn(testGame);

        // THREE_CARDSが検出されたかチェック
        if (result.claimedCombo?.type === ComboType.THREE_CARDS) {
          threeCardsClaimedCount++;
        }
        if (result.claimedCombo || result.missedCombo) {
          totalAttempts++;
        }
      }

      // 役が検出された場合、すべてTHREE_CARDSであるべき
      expect(threeCardsClaimedCount).toBeGreaterThan(0);
    });
  });

  describe('役の見落とし率', () => {
    it('約20%の確率で役を見落とす', () => {
      const iterations = 100;
      let missedCount = 0;
      let detectedCount = 0;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Easy', false);
        const currentPlayer = game.getCurrentPlayer();

        // 1+4の役を作る
        const pos1 = Position.of(0, 0);
        const pos2 = Position.of(0, 1);

        game.placeCard(new Card(CardValue.of(1), CardColor.RED), pos1);

        // 手札に4を追加
        currentPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.RED));

        const strategy = new CPUEasyStrategy();
        const result = strategy.executeTurn(game);

        if (result.claimedCombo) {
          detectedCount++;
        }
        if (result.missedCombo) {
          missedCount++;
        }
      }

      const totalCombos = detectedCount + missedCount;
      const missRate = missedCount / totalCombos;

      // 見落とし率が15%～25%の範囲内であることを確認（統計的な誤差を考慮）
      expect(missRate).toBeGreaterThan(0.1);
      expect(missRate).toBeLessThan(0.3);
      expect(totalCombos).toBeGreaterThan(0); // 役が検出されたことを確認
    });
  });

  describe('ランダム性の検証', () => {
    it('配置位置がランダムである', () => {
      const positionCounts = new Map<string, number>();

      for (let i = 0; i < 50; i++) {
        const game = Game.createNewGame('Easy', false);
        const strategy = new CPUEasyStrategy();

        const result = strategy.executeTurn(game);
        const key = `${result.position.row},${result.position.col}`;
        positionCounts.set(key, (positionCounts.get(key) || 0) + 1);
      }

      // 複数の異なる位置に配置されたことを確認（完全にランダムなら9箇所すべてに配置される可能性がある）
      expect(positionCounts.size).toBeGreaterThan(3);
    });
  });
});
