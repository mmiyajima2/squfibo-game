export function ComboRulesPanel() {
  return (
    <div className="combo-rules-panel">
      <div className="combo-rules-title">★ 役のつくりかた ★</div>

      <div className="combo-rules-subtitle">【得点役】</div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">2枚役 ★★</div>
        <div className="combo-rule-combinations">
          ・1と4　・4と9（タテかヨコ）
        </div>
      </div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">3枚役 ★★★</div>
        <div className="combo-rule-combinations">
          ・1と4と16（タテ、ヨコ、L字）
        </div>
      </div>

      <div className="combo-rules-subtitle">【調整役】</div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">盤面クリア</div>
        <div className="combo-rule-combinations">
          ・同じ数字3枚（タテ、ヨコ、L字）
        </div>
        <div className="combo-rule-note">
          ※盤面全て廃棄（★・ドローなし）
        </div>
      </div>

      <div className="combo-rule-important">
        ※同じ色で作る！<br />
        ※今置いたカードを入れる！
      </div>
    </div>
  );
}
