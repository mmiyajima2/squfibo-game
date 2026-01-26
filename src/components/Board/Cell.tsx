import { Card } from '../../domain/entities/Card';
import { Position } from '../../domain/valueObjects/Position';
import { CardComponent } from '../Card/CardComponent';
import './Cell.css';

interface CellProps {
  position: Position;
  card: Card | null;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function Cell({ position, card, isHighlighted = false, onClick }: CellProps) {
  const classNames = [
    'cell',
    isHighlighted ? 'cell-highlighted' : '',
    onClick && !card ? 'cell-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick} data-position={`${position.row}-${position.col}`}>
      {card ? (
        <CardComponent card={card} size="medium" />
      ) : (
        <div className="cell-empty">
          <div className="cell-empty-indicator" />
        </div>
      )}
    </div>
  );
}
