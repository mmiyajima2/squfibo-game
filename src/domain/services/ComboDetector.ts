import { Board } from '../entities/Board';
import { Card } from '../entities/Card';
import { Position } from '../valueObjects/Position';
import { Combo, ComboType } from './Combo';

export class ComboDetector {
  detectCombos(board: Board, lastPlacedPosition: Position): Combo[] {
    const combos: Combo[] = [];
    const lastCard = board.getCard(lastPlacedPosition);

    if (!lastCard) {
      return combos;
    }

    const allPositions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        allPositions.push(Position.of(row, col));
      }
    }

    const twoCardCombos = this.findTwoCardCombos(
      board,
      lastCard,
      lastPlacedPosition,
      allPositions
    );
    combos.push(...twoCardCombos);

    const threeCardCombos = this.findThreeCardCombos(
      board,
      lastCard,
      lastPlacedPosition,
      allPositions
    );
    combos.push(...threeCardCombos);

    return combos;
  }

  private findTwoCardCombos(
    board: Board,
    lastCard: Card,
    lastPlacedPosition: Position,
    allPositions: Position[]
  ): Combo[] {
    const combos: Combo[] = [];
    const lastValue = lastCard.value.value;

    for (const pos of allPositions) {
      if (pos.equals(lastPlacedPosition)) {
        continue;
      }

      const card = board.getCard(pos);
      if (!card || !card.isSameColor(lastCard)) {
        continue;
      }

      const value = card.value.value;

      if (
        (lastValue === 1 && value === 4) ||
        (lastValue === 4 && value === 1)
      ) {
        combos.push(
          new Combo(ComboType.TWO_CARDS_1_4, [lastCard, card], [lastPlacedPosition, pos])
        );
      } else if (
        (lastValue === 4 && value === 9) ||
        (lastValue === 9 && value === 4)
      ) {
        combos.push(
          new Combo(ComboType.TWO_CARDS_4_9, [lastCard, card], [lastPlacedPosition, pos])
        );
      }
    }

    return combos;
  }

  private findThreeCardCombos(
    board: Board,
    lastCard: Card,
    lastPlacedPosition: Position,
    allPositions: Position[]
  ): Combo[] {
    const combos: Combo[] = [];
    const lastValue = lastCard.value.value;

    const sameColorPositions = allPositions.filter(pos => {
      if (pos.equals(lastPlacedPosition)) {
        return false;
      }
      const card = board.getCard(pos);
      return card !== null && card.isSameColor(lastCard);
    });

    for (let i = 0; i < sameColorPositions.length; i++) {
      for (let j = i + 1; j < sameColorPositions.length; j++) {
        const pos1 = sameColorPositions[i];
        const pos2 = sameColorPositions[j];
        const card1 = board.getCard(pos1)!;
        const card2 = board.getCard(pos2)!;

        const values = [lastValue, card1.value.value, card2.value.value].sort((a, b) => a - b);

        if (values[0] === 1 && values[1] === 4 && values[2] === 16) {
          combos.push(
            new Combo(
              ComboType.THREE_CARDS,
              [lastCard, card1, card2],
              [lastPlacedPosition, pos1, pos2]
            )
          );
        }
      }
    }

    return combos;
  }

  checkCombo(cards: Card[], positions: Position[]): ComboType | null {
    if (cards.length !== positions.length) {
      return null;
    }

    if (cards.length === 0) {
      return null;
    }

    const firstColor = cards[0].color;
    if (!cards.every(card => card.color === firstColor)) {
      return null;
    }

    const values = cards.map(card => card.value.value).sort((a, b) => a - b);

    if (values.length === 2) {
      // 2枚役の場合、位置が縦または横に隣接している必要がある
      if (!this.areAdjacentTwoCards(positions)) {
        return null;
      }

      if (values[0] === 1 && values[1] === 4) {
        return ComboType.TWO_CARDS_1_4;
      }
      if (values[0] === 4 && values[1] === 9) {
        return ComboType.TWO_CARDS_4_9;
      }
    }

    if (values.length === 3) {
      // 3枚役の場合、位置が連なっている必要がある（縦3つ、横3つ、またはL字型）
      if (!this.areAdjacentThreeCards(positions)) {
        return null;
      }

      if (values[0] === 1 && values[1] === 4 && values[2] === 16) {
        return ComboType.THREE_CARDS;
      }
    }

    return null;
  }

  /**
   * 2つの位置が縦または横に隣接しているかをチェック
   */
  private areAdjacentTwoCards(positions: Position[]): boolean {
    if (positions.length !== 2) {
      return false;
    }

    const [pos1, pos2] = positions;
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // 縦に隣接（row差が1、col差が0）または横に隣接（row差が0、col差が1）
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * 3つの位置が連なっているかをチェック（縦3つ、横3つ、またはL字型）
   */
  private areAdjacentThreeCards(positions: Position[]): boolean {
    if (positions.length !== 3) {
      return false;
    }

    // 全ての位置が互いに隣接している必要がある
    // まず、各カードが少なくとも1つの他のカードに隣接していることを確認
    const adjacencyCount = new Map<number, number>();
    for (let i = 0; i < 3; i++) {
      adjacencyCount.set(i, 0);
    }

    // 全てのペアの隣接性をチェック
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        if (this.areAdjacentTwoCards([positions[i], positions[j]])) {
          adjacencyCount.set(i, adjacencyCount.get(i)! + 1);
          adjacencyCount.set(j, adjacencyCount.get(j)! + 1);
        }
      }
    }

    // 有効な3枚役の形状：
    // - 縦または横に3枚連なる場合：両端が1つずつ、中央が2つ隣接
    // - L字型の場合：コーナーが2つ、端が1つずつ隣接
    const counts = Array.from(adjacencyCount.values()).sort();

    // 縦または横に3枚連なる: [1, 1, 2]（両端が1、中央が2）
    // L字型: [1, 1, 2]（両端が1、コーナーが2）
    return counts[0] === 1 && counts[1] === 1 && counts[2] === 2;
  }
}
