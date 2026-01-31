import type { CPUDifficulty } from '../../../types/CPUDifficulty';
import type { CPUStrategy } from './CPUStrategy';
import { CPUEasyStrategy } from './CPUEasyStrategy';

/**
 * CPU戦略ファクトリー
 *
 * 難易度に応じた適切な戦略を生成する
 */
export class CPUStrategyFactory {
  /**
   * 難易度に応じた戦略を作成する
   *
   * @param difficulty CPU難易度
   * @returns 対応する戦略インスタンス
   */
  static createStrategy(difficulty: CPUDifficulty): CPUStrategy {
    switch (difficulty) {
      case 'Easy':
        return new CPUEasyStrategy();
      case 'Normal':
        // 将来実装予定
        throw new Error('Normal difficulty is not implemented yet');
      case 'Hard':
        // 将来実装予定
        throw new Error('Hard difficulty is not implemented yet');
      default:
        throw new Error(`Unknown difficulty: ${difficulty}`);
    }
  }
}
