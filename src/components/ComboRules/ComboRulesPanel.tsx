export function ComboRulesPanel() {
  return (
    <div className="combo-rules-panel">
      <div className="combo-rules-title">★ 役のつくりかた ★</div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">【2枚役】★★</div>
        <div className="combo-rule-combinations">
          ・1と4　・4と9
        </div>
        <div className="combo-rule-note">※タテかヨコに2枚ならべる</div>
      </div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">【3枚役】★★★</div>
        <div className="combo-rule-combinations">
          ・1と4と16
        </div>
        <div className="combo-rule-note">※タテ、ヨコ、L字に3枚ならべる</div>
      </div>

      <div className="combo-rule-important">
        ※同じ色のカードで作ろう！<br />
        ※今おいたカードをかならず入れよう！
      </div>
    </div>
  );
}
