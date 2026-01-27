import type { CommentaryMessage } from '../../types/Commentary';
import './CommentaryArea.css';

interface CommentaryAreaProps {
  messages: CommentaryMessage[];
  currentMessage?: string;
}

export function CommentaryArea({ messages, currentMessage }: CommentaryAreaProps) {
  return (
    <div className="commentary-area">
      <div className="commentary-header">
        <h3 className="commentary-title">📢 実況</h3>
      </div>

      {currentMessage && (
        <div className="commentary-current">
          <div className="commentary-current-icon">🎮</div>
          <div className="commentary-current-text">{currentMessage}</div>
        </div>
      )}

      <div className="commentary-history">
        <h4 className="commentary-history-title">📜 履歴</h4>
        <div className="commentary-messages">
          {messages.length === 0 ? (
            <div className="commentary-empty">まだメッセージがありません</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`commentary-message commentary-type-${msg.type}`}>
                <span className="commentary-icon">{msg.icon}</span>
                <span className="commentary-text">{msg.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
