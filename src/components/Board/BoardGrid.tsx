import { Board } from '../../domain/entities/Board';
import { Position } from '../../domain/valueObjects/Position';
import { Cell } from './Cell';
import './BoardGrid.css';

interface BoardGridProps {
  board: Board;
  highlightedPositions?: Position[];
  onCellClick?: (position: Position) => void;
}

export function BoardGrid({
  board,
  highlightedPositions = [],
  onCellClick,
}: BoardGridProps) {
  const isHighlighted = (position: Position): boolean => {
    return highlightedPositions.some((p) => p.equals(position));
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
                onClick={() => handleCellClick(position)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
