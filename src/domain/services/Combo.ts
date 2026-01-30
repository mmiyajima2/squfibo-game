import { Card } from '../entities/Card';
import { Position } from '../valueObjects/Position';

/**
 * 役の種類
 *
 * 得点役は、カードの数値の和がフィボナッチ数になるように設計されています：
 * - TWO_CARDS_1_4: 1 + 4 = 5（フィボナッチ数）
 * - TWO_CARDS_4_9: 4 + 9 = 13（フィボナッチ数）
 * - THREE_CARDS: 1 + 4 + 16 = 21（フィボナッチ数）
 *
 * クリア役は得点や補充を行わず、盤面をクリアする特殊な役です：
 * - CLEARING_YAKU: 同じ数字・同じ色の3枚
 */
export enum ComboType {
  TWO_CARDS_1_4 = 'TWO_CARDS_1_4',
  TWO_CARDS_4_9 = 'TWO_CARDS_4_9',
  THREE_CARDS = 'THREE_CARDS',
  CLEARING_YAKU = 'CLEARING_YAKU',
}

/**
 * クリア役かどうかを判定する
 */
export function isClearingCombo(type: ComboType): boolean {
  return type === ComboType.CLEARING_YAKU;
}

/**
 * 役（コンボ）を表すクラス
 *
 * 同色のカードの組み合わせで、数値の和がフィボナッチ数になる役を表現します。
 * クリア役は得点や補充を行わず、盤面をクリアする特殊な役です。
 */
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
    return isClearingCombo(this.type) ? 0 : this.cards.length;
  }

  getCardCount(): number {
    return this.cards.length;
  }
}
