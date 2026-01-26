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
      if (values[0] === 1 && values[1] === 4) {
        return ComboType.TWO_CARDS_1_4;
      }
      if (values[0] === 4 && values[1] === 9) {
        return ComboType.TWO_CARDS_4_9;
      }
    }

    if (values.length === 3) {
      if (values[0] === 1 && values[1] === 4 && values[2] === 16) {
        return ComboType.THREE_CARDS;
      }
    }

    return null;
  }
}
