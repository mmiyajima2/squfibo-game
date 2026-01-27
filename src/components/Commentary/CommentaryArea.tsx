import type { CommentaryMessage } from '../../types/Commentary';
import './CommentaryArea.css';

interface CommentaryAreaProps {
  messages: CommentaryMessage[];
}

export function CommentaryArea({ messages }: CommentaryAreaProps) {
  return (
    <div className="commentary-area">
      <div className="commentary-header">
        <h3 className="commentary-title">📢 実況</h3>
      </div>

      <div className="commentary-messages">
        {messages.length === 0 ? (
          <div className="commentary-empty">まだメッセージがありません</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`commentary-message commentary-type-${msg.type} ${index === 0 ? 'commentary-message-latest' : ''}`}
            >
              <span className="commentary-icon">{msg.icon}</span>
              <span className="commentary-text">{msg.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
