import { Card } from '../../domain/entities/Card';
import { CardColor } from '../../domain/valueObjects/CardColor';
import './CardComponent.css';

interface CardComponentProps {
  card: Card;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function CardComponent({
  card,
  isSelected = false,
  isHighlighted = false,
  onClick,
  size = 'medium',
}: CardComponentProps) {
  const colorName = card.color === CardColor.RED ? 'red' : 'blue';
  const imagePath = `/cards/${colorName}-${card.value.value}.svg`;

  const classNames = [
    'card-component',
    `card-size-${size}`,
    isSelected ? 'card-selected' : '',
    isHighlighted ? 'card-highlighted' : '',
    onClick ? 'card-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      <img
        src={imagePath}
        alt={`${colorName} ${card.value.value}`}
        className="card-image"
      />
    </div>
  );
}
