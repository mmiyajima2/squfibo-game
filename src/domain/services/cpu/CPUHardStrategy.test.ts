import { describe, it, expect } from 'vitest';
import { CPUHardStrategy } from './CPUHardStrategy';
import { Game } from '../../Game';
import { Card } from '../../entities/Card';
import { CardValue } from '../../valueObjects/CardValue';
import { CardColor } from '../../valueObjects/CardColor';
import { Position } from '../../valueObjects/Position';
import { ComboType } from '../Combo';

describe('CPUHardStrategy', () => {
  describe('戦略的配置: THREE_CARDSを成立させる', () => {
    it('赤1と赤4が盤面にあり、CPUが赤16を持っている場合、THREE_CARDSを必ず申告する', () => {
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Normal', true); // 人間が先攻
        const strategy = new CPUHardStrategy();

        // 人間プレイヤーが赤1と赤4を配置
        game.placeCard(new Card(CardValue.of(1), CardColor.RED), Position.of(0, 0));
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
        game.endTurn();

        // CPUの手札をクリアして赤16のみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

        // CPUのターンを実行
        const result = strategy.executeTurn(game);

        // 赤16が配置され、THREE_CARDSが必ず申告されるはず（見落としなし）
        expect(result.placedCard.value.value).toBe(16);
        expect(result.placedCard.color).toBe(CardColor.RED);
        expect(result.claimedCombo).not.toBeNull();
        expect(result.claimedCombo?.type).toBe(ComboType.THREE_CARDS);
      }
    });
  });

  describe('戦略的配置: TRIPLE_MATCHを成立させる', () => {
    it('赤4が2枚盤面にあり、CPUが赤4を持っている場合、TRIPLE_MATCHを必ず申告する', () => {
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Normal', true); // 人間が先攻
        const strategy = new CPUHardStrategy();

        // 人間プレイヤーが赤4を2枚配置
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 0));
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
        game.endTurn();

        // CPUの手札をクリアして赤4のみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.RED));

        // CPUのターンを実行
        const result = strategy.executeTurn(game);

        // 赤4が配置され、TRIPLE_MATCHが必ず申告されるはず（見落としなし）
        expect(result.placedCard.value.value).toBe(4);
        expect(result.placedCard.color).toBe(CardColor.RED);
        expect(result.claimedCombo).not.toBeNull();
        expect(result.claimedCombo?.type).toBe(ComboType.TRIPLE_MATCH);
      }
    });
  });

  describe('役の優先順位', () => {
    it('THREE_CARDS > TRIPLE_MATCHの順で役を申告する', () => {
      const game = Game.createNewGame('Normal', true);
      const strategy = new CPUHardStrategy();

      // 盤面に赤1、赤4を2枚配置（THREE_CARDSとTRIPLE_MATCHの両方が成立可能）
      game.placeCard(new Card(CardValue.of(1), CardColor.RED), Position.of(0, 0));
      game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
      game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(1, 0));
      game.endTurn();

      // CPUの手札をクリアして赤16と赤4を追加
      const cpuPlayer = game.getCurrentPlayer();
      const currentCards = cpuPlayer.hand.getCards();
      currentCards.forEach(card => cpuPlayer.playCard(card));
      cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));
      cpuPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.RED));

      const result = strategy.executeTurn(game);

      // THREE_CARDSが優先されるため、申告される場合は必ずTHREE_CARDS
      if (result.claimedCombo) {
        expect(result.claimedCombo.type).toBe(ComboType.THREE_CARDS);
      }
    });
  });

  describe('見落とし率0%', () => {
    it('役が成立した場合、常に申告する（見落としなし）', () => {
      const iterations = 100;
      let detectedCount = 0;
      let missedCount = 0;

      for (let i = 0; i < iterations; i++) {
        const game = Game.createNewGame('Normal', true);
        const strategy = new CPUHardStrategy();

        // 人間が赤1と赤4を配置
        game.placeCard(new Card(CardValue.of(1), CardColor.RED), Position.of(0, 0));
        game.placeCard(new Card(CardValue.of(4), CardColor.RED), Position.of(0, 1));
        game.endTurn();

        // CPUの手札をクリアして赤16のみにする
        const cpuPlayer = game.getCurrentPlayer();
        const currentCards = cpuPlayer.hand.getCards();
        currentCards.forEach(card => cpuPlayer.playCard(card));
        cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));

        const result = strategy.executeTurn(game);

        if (result.claimedCombo) {
          detectedCount++;
        }
        if (result.missedCombo) {
          missedCount++;
        }
      }

      // 見落としは常に0
      expect(missedCount).toBe(0);
      // 役が成立した場合は必ず申告されるはず
      expect(detectedCount).toBe(iterations);
    });
  });

  describe('カードの優先順位', () => {
    it('役が成立しない場合、16 > 9 > 1 > 4の優先順位でカードを配置する', () => {
      const game = Game.createNewGame('Normal', false);
      const strategy = new CPUHardStrategy();

      const cpuPlayer = game.getCurrentPlayer();
      const currentCards = cpuPlayer.hand.getCards();
      currentCards.forEach(card => cpuPlayer.playCard(card));

      // 全てのカードを追加（異なる色で役が成立しないようにする）
      cpuPlayer.hand.addCard(new Card(CardValue.of(16), CardColor.RED));
      cpuPlayer.hand.addCard(new Card(CardValue.of(9), CardColor.BLUE));
      cpuPlayer.hand.addCard(new Card(CardValue.of(1), CardColor.RED));
      cpuPlayer.hand.addCard(new Card(CardValue.of(4), CardColor.BLUE));

      const result = strategy.executeTurn(game);

      // 16が優先的に配置されるはず
      expect(result.placedCard.value.value).toBe(16);
    });
  });
});
