import { Board } from '../../domain/entities/Board';
import { Position } from '../../domain/valueObjects/Position';
import { Card } from '../../domain/entities/Card';
import { Cell } from './Cell';
import './BoardGrid.css';

interface BoardGridProps {
  board: Board;
  highlightedPositions?: Position[];
  selectedCards?: Card[];
  onCellClick?: (position: Position) => void;
  onCardClick?: (card: Card) => void;
}

export function BoardGrid({
  board,
  highlightedPositions = [],
  selectedCards = [],
  onCellClick,
  onCardClick,
}: BoardGridProps) {
  const isHighlighted = (position: Position): boolean => {
    return highlightedPositions.some((p) => p.equals(position));
  };

  const isSelected = (card: Card | null): boolean => {
    if (!card) return false;
    return selectedCards.some((c) => c.id === card.id);
  };

  const handleCellClick = (position: Position) => {
    if (onCellClick) {
      onCellClick(position);
    }
  };

  return (
    <div className="board-grid">
      {[0, 1, 2].map((row) => (
        <div key={row} className="board-row">
          {[0, 1, 2].map((col) => {
            const position = Position.of(row, col);
            const card = board.getCard(position);
            return (
              <Cell
                key={`${row}-${col}`}
                position={position}
                card={card}
                isHighlighted={isHighlighted(position)}
                isSelected={isSelected(card)}
                onClick={() => handleCellClick(position)}
                onCardClick={onCardClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
