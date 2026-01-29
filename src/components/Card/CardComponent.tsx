import { Card } from '../../domain/entities/Card';
import { CardColor } from '../../domain/valueObjects/CardColor';
import './CardComponent.css';

interface CardComponentProps {
  card: Card;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  showDeleteIcon?: boolean;
  onDelete?: (card: Card) => void;
  isJustPlaced?: boolean;
}

export function CardComponent({
  card,
  isSelected = false,
  isHighlighted = false,
  onClick,
  size = 'medium',
  showDeleteIcon = false,
  onDelete,
  isJustPlaced = false,
}: CardComponentProps) {
  const colorName = card.color === CardColor.RED ? 'red' : 'blue';
  const imagePath = `/cards/${colorName}-${card.value.value}.svg`;

  const classNames = [
    'card-component',
    `card-size-${size}`,
    isSelected ? 'card-selected' : '',
    isHighlighted ? 'card-highlighted' : '',
    onClick ? 'card-clickable' : '',
    showDeleteIcon ? 'card-with-delete' : '',
    isJustPlaced ? 'card-just-placed card-placement-animation' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(card);
    }
  };

  return (
    <div className={classNames} onClick={onClick}>
      <img
        src={imagePath}
        alt={`${colorName} ${card.value.value}`}
        className="card-image"
      />
      {isSelected && (
        <div className="card-selected-indicator">✓</div>
      )}
      {showDeleteIcon && (
        <button
          className="card-delete-icon"
          onClick={handleDeleteClick}
          aria-label="カードを廃棄"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
