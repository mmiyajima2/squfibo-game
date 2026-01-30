import './ControlPanel.css';

interface ControlPanelProps {
  onClaimCombo: () => void;
  onEndTurn: () => void;
  isGameOver: boolean;
}

export function ControlPanel({ onClaimCombo, onEndTurn, isGameOver }: ControlPanelProps) {
  return (
    <div className="control-panel">
      <h3 className="control-panel-title">コントロール</h3>
      <div className="control-buttons">
        <button
          className="control-button claim-combo"
          onClick={onClaimCombo}
          disabled={isGameOver}
        >
          🎯 役を申告
        </button>
        <div className="button-divider"></div>
        <button
          className="control-button end-turn"
          onClick={onEndTurn}
          disabled={isGameOver}
        >
          ✓ ターン終了
        </button>
      </div>
    </div>
  );
}
