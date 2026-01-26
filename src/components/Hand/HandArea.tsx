import { Card } from '../../domain/entities/Card';
import { CardComponent } from '../Card/CardComponent';
import './HandArea.css';

interface HandAreaProps {
  cards: Card[];
  selectedCard: Card | null;
  onCardClick?: (card: Card) => void;
  label?: string;
  isOpponent?: boolean;
}

export function HandArea({
  cards,
  selectedCard,
  onCardClick,
  label,
  isOpponent = false,
}: HandAreaProps) {
  const handleCardClick = (card: Card) => {
    if (onCardClick && !isOpponent) {
      onCardClick(card);
    }
  };

  return (
    <div className={`hand-area ${isOpponent ? 'hand-area-opponent' : ''}`}>
      {label && <div className="hand-area-label">{label}</div>}
      <div className="hand-cards">
        {cards.length === 0 ? (
          <div className="hand-empty">手札なし</div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="hand-card-wrapper">
              <CardComponent
                card={card}
                size="small"
                isSelected={selectedCard?.equals(card)}
                onClick={() => handleCardClick(card)}
              />
            </div>
          ))
        )}
      </div>
      <div className="hand-count">{cards.length} 枚</div>
    </div>
  );
}
