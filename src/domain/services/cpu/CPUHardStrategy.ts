import { Card } from '../../entities/Card';
import { Position } from '../../valueObjects/Position';
import { Combo, ComboType } from '../Combo';
import { ComboDetector } from '../ComboDetector';
import type { PlacementSuggestion } from '../ComboDetector';
import type { Game } from '../../Game';
import type { CPUStrategy, CPUTurnResult, CPUTurnPlan, CPUActionStep } from './CPUStrategy';

/**
 * CPU（Hard）戦略の実装
 *
 * 【特徴】
 * - カード配置：役成立を狙った戦略的配置（Normalと同じ）
 * - 役の申告：見落とし率0%（必ず申告する）
 * - 対象プレイヤー：ゲームのルールを熟知した上級者
 */
export class CPUHardStrategy implements CPUStrategy {
  private readonly comboDetector = new ComboDetector();

  /**
   * CPUの1ターンを計画する（状態変更なし）
   *
   * @param game 現在のゲーム状態
   * @returns ターン実行計画
   */
  planTurn(game: Game): CPUTurnPlan {
    const steps: CPUActionStep[] = [];
    let removedPosition: Position | undefined;
    let removedCard: Card | null = null;

    // ステップ1（オプション）: 盤面満杯の場合、ランダムに1枚除去
    if (game.board.isFull()) {
      const excludePosition = game.getLastPlacedPosition();
      removedPosition = this.selectRandomOccupiedPosition(game, excludePosition);
      // planTurnでは一時的に除去（シミュレーション用）
      removedCard = game.board.removeCard(removedPosition);
      steps.push({ type: 'REMOVE_CARD', position: removedPosition });
    }

    // ステップ2: カード配置を決定
    const { card, position } = this.decidePlacement(game, removedPosition);

    let placedCard: Card;
    if (card !== null) {
      // 手札からカードを出して配置
      steps.push({ type: 'PLACE_CARD', card, position, isFromDeck: false });
      placedCard = card;
    } else {
      // 手札がない場合は山札から引いて配置
      const deckCard = game.deck.peek();
      if (!deckCard) {
        throw new Error('Deck is empty');
      }
      steps.push({ type: 'PLACE_CARD', card: deckCard, position, isFromDeck: true });
      placedCard = deckCard;
    }

    // ステップ3: 役の検出（将来の盤面状態をシミュレート）
    // 一時的にカードを配置して役を検出し、その後削除
    game.board.placeCard(placedCard, position);
    const detectedCombos = this.comboDetector.detectCombos(game.board, position);
    game.board.removeCard(position);

    // 除去したカードを元に戻す（planTurnはゲーム状態を変更しないため）
    if (removedCard && removedPosition) {
      game.board.placeCard(removedCard, removedPosition);
    }

    // ステップ4: 役の申告判定（見落としなし）
    const claimedCombo = detectedCombos.length > 0 ? this.selectComboByPriority(detectedCombos) : null;

    if (claimedCombo) {
      steps.push({ type: 'CLAIM_COMBO', combo: claimedCombo });
    }

    // ステップ5: ターン終了
    steps.push({ type: 'END_TURN' });

    return { steps, missedCombo: null };
  }

  executeTurn(game: Game): CPUTurnResult {
    const currentPlayer = game.getCurrentPlayer();
    let removedPosition: Position | undefined;

    // ステップ1: 盤面満杯の場合、ランダムに1枚除去
    if (game.board.isFull()) {
      // 直前のターンで配置されたカードは除去しない（公平性のため）
      const excludePosition = game.getLastPlacedPosition();
      removedPosition = this.selectRandomOccupiedPosition(game, excludePosition);
      game.discardFromBoard(removedPosition);
    }

    // ステップ2: カードを配置
    const { card, position } = this.decidePlacement(game, removedPosition);
    let placedCard: Card;

    if (card !== null) {
      // 手札からカードを出して配置
      currentPlayer.playCard(card);
      game.placeCard(card, position);
      placedCard = card;
    } else {
      // 手札がない場合は山札から引いて配置
      const drawnCard = game.drawAndPlaceCard(position);
      if (!drawnCard) {
        throw new Error('Failed to draw and place card');
      }
      placedCard = drawnCard;
    }

    // ステップ3: 役の検出
    const detectedCombos = this.comboDetector.detectCombos(game.board, position);

    // ステップ4: 役の申告判定（見落としなし）
    const claimedCombo = detectedCombos.length > 0 ? this.selectComboByPriority(detectedCombos) : null;

    // ステップ5: 役を申告する場合、ゲームに適用
    if (claimedCombo) {
      game.claimCombo(claimedCombo);
      game.endTurn();
    } else {
      game.endTurn();
    }

    return {
      placedCard,
      position,
      removedPosition,
      claimedCombo,
      missedCombo: null,
    };
  }

  /**
   * カード配置を決定する（戦略的配置）
   *
   * 【戦略】
   * 1. 手札がある場合：
   *    - suggestWinningPlacementsで役が成立する配置を探索
   *    - 役が成立する配置があればそれを選択（優先順位順）
   *    - なければカードの優先順位（16 > 9 > 1 > 4）でランダム配置
   * 2. 手札がない場合：
   *    - 山札から引いたカードで役が成立する位置を探索
   *    - なければランダム配置
   *
   * @param game 現在のゲーム状態
   * @param removedPosition 除去予定の位置（planTurn時のみ使用）
   * @returns 配置するカードと位置（手札がない場合はcard: null）
   */
  private decidePlacement(game: Game, removedPosition?: Position): { card: Card | null; position: Position } {
    const currentPlayer = game.getCurrentPlayer();
    const emptyPositions = this.getEmptyPositions(game, removedPosition);

    if (emptyPositions.length === 0) {
      throw new Error('No empty positions available');
    }

    if (currentPlayer.hand.hasCards()) {
      // 手札からカードを選択（戦略的配置）
      const handCards = currentPlayer.hand.getCards();

      // 役が成立する配置を探索
      const suggestions = this.comboDetector.suggestWinningPlacements(game.board, handCards);

      if (suggestions.length > 0) {
        // 役が成立する配置がある場合、最優先の配置を選択
        const bestPlacement = this.selectBestPlacement(suggestions);
        return { card: bestPlacement.card, position: bestPlacement.position };
      }

      // 役が成立しない場合、カードの優先順位に従って配置
      const { card, position } = this.selectCardByPriority(handCards, emptyPositions);
      return { card, position };
    } else {
      // 手札がない場合、山札から引いて配置
      const deckCard = game.deck.peek();
      if (!deckCard) {
        throw new Error('Deck is empty');
      }

      // 引いたカードで役が成立する位置を探索
      const suggestions = this.comboDetector.suggestWinningPlacements(game.board, [deckCard]);

      if (suggestions.length > 0) {
        // 役が成立する位置があればその位置を選択
        const bestPlacement = this.selectBestPlacement(suggestions);
        return { card: null, position: bestPlacement.position };
      }

      // 役が成立しない場合、ランダム配置
      const position = this.selectRandomPosition(emptyPositions);
      return { card: null, position };
    }
  }

  /**
   * 配置候補から最適な配置を選択する
   *
   * @param suggestions 配置候補のリスト
   * @returns 選択された配置
   */
  private selectBestPlacement(suggestions: PlacementSuggestion[]): PlacementSuggestion {
    if (suggestions.length === 0) {
      throw new Error('No placement suggestions available');
    }

    const topPriority = suggestions[0].priority;
    const topSuggestions = suggestions.filter((s) => s.priority === topPriority);

    const randomIndex = Math.floor(Math.random() * topSuggestions.length);
    return topSuggestions[randomIndex];
  }

  /**
   * カードの優先順位に従って配置を選択する
   *
   * 【優先順位】
   * 1. 16（相手に役を作らせにくい）
   * 2. 9（相手に役を作らせにくい）
   * 3. 1（役の起点になるが優先度は低め）
   * 4. 4（最も貴重なカードなので最後まで温存）
   *
   * @param cards 手札のカードリスト
   * @param emptyPositions 空いている位置のリスト
   * @returns 選択されたカードと位置
   */
  private selectCardByPriority(cards: Card[], emptyPositions: Position[]): { card: Card; position: Position } {
    const priorities = [16, 9, 1, 4];

    for (const value of priorities) {
      const card = cards.find((c) => c.value.value === value);
      if (card) {
        const position = this.selectRandomPosition(emptyPositions);
        return { card, position };
      }
    }

    // フォールバック：最初のカードを返す（通常はここに到達しない）
    const card = cards[0];
    const position = this.selectRandomPosition(emptyPositions);
    return { card, position };
  }

  /**
   * 優先順位に従って役を選択する
   *
   * 【優先順位】
   * THREE_CARDS（大役）> TRIPLE_MATCH（小役）
   *
   * @param combos 検出された役のリスト
   * @returns 優先順位が最も高い役
   */
  private selectComboByPriority(combos: Combo[]): Combo {
    const priority = [
      ComboType.THREE_CARDS,
      ComboType.TRIPLE_MATCH,
    ];

    for (const type of priority) {
      const combo = combos.find((c) => c.type === type);
      if (combo) {
        return combo;
      }
    }

    // フォールバック：最初の役を返す（通常はここに到達しない）
    return combos[0];
  }

  /**
   * 空いている位置のリストを取得する
   *
   * @param game 現在のゲーム状態
   * @param removedPosition 除去予定の位置（この位置は空きとして扱う）
   * @returns 空いている位置のリスト
   */
  private getEmptyPositions(game: Game, removedPosition?: Position): Position[] {
    const emptyPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const position = Position.of(row, col);
        if (game.board.isEmpty(position) || (removedPosition && position.equals(removedPosition))) {
          emptyPositions.push(position);
        }
      }
    }
    return emptyPositions;
  }

  /**
   * ランダムに位置を選択する
   *
   * @param positions 位置のリスト
   * @returns ランダムに選ばれた位置
   */
  private selectRandomPosition(positions: Position[]): Position {
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
  }

  /**
   * 盤面からランダムに占有されている位置を選択する
   *
   * @param game 現在のゲーム状態
   * @param excludePosition 除外する位置（直前のターンで配置されたカードなど）
   * @returns ランダムに選ばれた占有されている位置
   */
  private selectRandomOccupiedPosition(game: Game, excludePosition: Position | null = null): Position {
    const occupiedPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const position = Position.of(row, col);
        if (!game.board.isEmpty(position)) {
          if (excludePosition === null || !position.equals(excludePosition)) {
            occupiedPositions.push(position);
          }
        }
      }
    }

    if (occupiedPositions.length === 0) {
      if (excludePosition !== null && !game.board.isEmpty(excludePosition)) {
        return excludePosition;
      }
      throw new Error('No occupied positions available');
    }

    return this.selectRandomPosition(occupiedPositions);
  }
}
