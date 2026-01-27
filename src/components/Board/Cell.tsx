import { Card } from '../../domain/entities/Card';
import { Position } from '../../domain/valueObjects/Position';
import { CardComponent } from '../Card/CardComponent';
import './Cell.css';

interface CellProps {
  position: Position;
  card: Card | null;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onCardClick?: (card: Card) => void;
}

export function Cell({ position, card, isHighlighted = false, isSelected = false, onClick, onCardClick }: CellProps) {
  const handleClick = () => {
    if (card && onCardClick) {
      onCardClick(card);
    } else if (!card && onClick) {
      onClick();
    }
  };

  const classNames = [
    'cell',
    isHighlighted ? 'cell-highlighted' : '',
    isSelected ? 'cell-selected' : '',
    (onClick && !card) || (card && onCardClick) ? 'cell-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={handleClick} data-position={`${position.row}-${position.col}`}>
      {card ? (
        <CardComponent card={card} size="large" />
      ) : (
        <div className="cell-empty">
          <div className="cell-empty-indicator" />
        </div>
      )}
    </div>
  );
}
