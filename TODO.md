# タスク

## [✓] 要望:全てのダイアログに閉じるボタンをつけてほしい（完了:2026-02-03）
- あまり目だないようにバツ印がさりげなくあるとよい

**実装完了**: 2026-02-03
- 以下の3つのダイアログに閉じるボタン（×印）を追加:
  1. **Game Over Modal**: 右上にさりげないバツ印を追加。閉じてもゲーム状態は保持される
  2. **Difficulty Modal**: 右上にバツ印を追加。既存のキャンセルボタンと同じ動作
  3. **ComboRulesPanel**: 右上にバツ印を追加。閉じると「役のルールを表示」ボタンが表示され、再表示可能
- スタイル: 控えめで目立たない灰色のバツ印、ホバー時に少し濃くなる
- 修正ファイル:
  - ComboRulesPanel.tsx/css
  - GameContainer.tsx/css
- テスト結果: 121個のテスト全てパス
- ビルド成功: 型エラーなし

## [✓] バグ:CPU(Noarmal)でボード満杯時にエラーがでる（完了:2026-02-03）
- 人間プレイヤー（下側）の場合は、カード破棄->配置と問題なくできる
- **修正完了**: planTurnメソッドで、ボード満杯時に一時的にカードを除去し、シミュレーション後に元に戻すように修正
- 対象ファイル: CPUNormalStrategy.ts, CPUEasyStrategy.ts
- テスト結果: 123個のテストすべてパス

## [✓] 要望:仕様変更の修正計画をだしてほしい（完了:2026-02-03）

- ./docs/spec_ja.md, cpu_easy_spec.md, cpu_normal_spec.md の仕様を変更した
- これについて、プログラムの変更計画をだして、以下に記載してほしい

**実装完了**: 2026-02-03
- すべてのコード修正完了（13ファイル）
- テスト実行: 123個のテストすべてパス
- ビルド成功: 型エラーなし

### Claudeの計画

## 仕様変更の概要

仕様ドキュメント（spec_ja.md, cpu_easy_spec.md, cpu_normal_spec.md）において、以下の変更が行われました：

1. **2枚役の廃止**
   - TWO_CARDS_1_4（1+4=5）を削除
   - TWO_CARDS_4_9（4+9=13）を削除

2. **役の再定義（すべて3枚役に統一）**
   - **大役: THREE_CARDS**（1+4+16）
     - 3枚除去 / 3枚ドロー / 星3個
   - **小役: TRIPLE_MATCH**（同じ数字・同じ色の3枚）
     - 3枚除去 / 1枚ドロー / 星1個
     - 旧名称: CLEARING_YAKU（盤面全クリア・報酬なし）から仕様変更

3. **CPU優先順位の変更**
   - 旧: THREE_CARDS > TWO_CARDS_4_9 > TWO_CARDS_1_4 > CLEARING_YAKU
   - 新: THREE_CARDS（大役）> TRIPLE_MATCH（小役）

---

## 影響を受けるファイル一覧

### ドメインロジック層（5ファイル）
1. `src/domain/services/Combo.ts`
2. `src/domain/services/ComboDetector.ts`
3. `src/domain/Game.ts`
4. `src/domain/services/cpu/CPUEasyStrategy.ts`
5. `src/domain/services/cpu/CPUNormalStrategy.ts`

### テスト層（5ファイル）
6. `src/domain/services/Combo.test.ts`
7. `src/domain/services/ComboDetector.test.ts`
8. `src/domain/Game.test.ts`
9. `src/domain/services/cpu/CPUEasyStrategy.test.ts`
10. `src/domain/services/cpu/CPUNormalStrategy.test.ts`

### UI層（3ファイル）
11. `src/components/Game/GameContainer.tsx`
12. `src/components/ComboRules/ComboRulesPanel.tsx`
13. `src/components/Commentary/CommentaryArea.tsx`

---

## 詳細な修正計画

### Phase 1: ドメインロジックの修正

#### 1-1. `src/domain/services/Combo.ts`
**変更内容:**
- [ ] ComboTypeから `TWO_CARDS_1_4`, `TWO_CARDS_4_9` を削除
- [ ] `CLEARING_YAKU` を `TRIPLE_MATCH` に名称変更
- [ ] `isClearingCombo()` 関数を削除（TRIPLE_MATCHは通常の小役として扱う）
- [ ] `getRewardStars()` メソッドを修正:
  - 旧: `isClearingCombo(this.type) ? 0 : this.cards.length`
  - 新: `this.type === ComboType.THREE_CARDS ? 3 : 1`
- [ ] 新しいメソッド `getDrawCount()` を追加:
  - THREE_CARDS → 3枚
  - TRIPLE_MATCH → 1枚

**理由:** 役の定義が根本的に変わるため、型定義と報酬計算を変更

---

#### 1-2. `src/domain/services/ComboDetector.ts`
**変更内容:**
- [ ] `findTwoCardCombos()` メソッドを完全削除
- [ ] `detectCombos()` から `findTwoCardCombos()` の呼び出しを削除:
  ```typescript
  // 削除する行（29-35行目）
  const twoCardCombos = this.findTwoCardCombos(...);
  combos.push(...twoCardCombos);
  ```
- [ ] `findClearingYaku()` メソッド内の `ComboType.CLEARING_YAKU` を `ComboType.TRIPLE_MATCH` に変更
- [ ] `getComboTypePriority()` メソッドを修正:
  - 旧: THREE_CARDS=3, TWO_CARDS_4_9=2, TWO_CARDS_1_4=1, CLEARING_YAKU=0
  - 新: THREE_CARDS=3, TRIPLE_MATCH=1
- [ ] `checkCombo()` メソッドから2枚役の処理（205-217行目）を削除
- [ ] `areAdjacentTwoCards()` メソッド: 保持（3枚役の隣接判定で内部的に使用されているため）

**理由:** 2枚役の検出ロジックが不要になり、TRIPLE_MATCHへの名称変更が必要

---

#### 1-3. `src/domain/Game.ts`
**変更内容:**
- [ ] `isClearingCombo` のインポートと使用を削除
- [ ] `claimCombo()` メソッドを修正:
  - CLEARING_YAKU用の特殊処理（盤面全クリア）を削除
  - すべての役を統一的に処理:
    ```typescript
    // カードを除去（役のカードのみ）
    for (const position of combo.positions) { ... }

    // カードをドロー（combo.getDrawCount()枚）
    const drawCount = combo.getDrawCount();
    for (let i = 0; i < drawCount; i++) { ... }

    // 星を獲得（combo.getRewardStars()個）
    const starsToAward = Math.min(combo.getRewardStars(), this.totalStars);
    ```

**理由:** TRIPLE_MATCHが通常の小役になるため、特殊処理が不要

---

#### 1-4. `src/domain/services/cpu/CPUEasyStrategy.ts`
**変更内容:**
- [ ] `selectComboByPriority()` メソッドの優先順位配列を修正:
  - 旧: `[THREE_CARDS, TWO_CARDS_4_9, TWO_CARDS_1_4, CLEARING_YAKU]`
  - 新: `[THREE_CARDS, TRIPLE_MATCH]`
- [ ] コメント内の優先順位の説明を更新:
  - 旧: `THREE_CARDS > TWO_CARDS_4_9 > TWO_CARDS_1_4 > CLEARING_YAKU`
  - 新: `THREE_CARDS（大役）> TRIPLE_MATCH（小役）`

**理由:** CPU仕様書に記載された新しい優先順位に合わせる

---

#### 1-5. `src/domain/services/cpu/CPUNormalStrategy.ts`
**変更内容:**
- [ ] `selectComboByPriority()` メソッドの優先順位配列を修正:
  - 旧: `[THREE_CARDS, TWO_CARDS_4_9, TWO_CARDS_1_4, CLEARING_YAKU]`
  - 新: `[THREE_CARDS, TRIPLE_MATCH]`
- [ ] コメント内の優先順位の説明を更新:
  - 旧: `THREE_CARDS > TWO_CARDS_4_9 > TWO_CARDS_1_4 > CLEARING_YAKU`
  - 新: `THREE_CARDS（大役）> TRIPLE_MATCH（小役）`

**理由:** CPU仕様書に記載された新しい優先順位に合わせる

---

### Phase 2: テストファイルの修正

#### 2-1. `src/domain/services/Combo.test.ts`
**変更内容:**
- [ ] TWO_CARDS_1_4, TWO_CARDS_4_9 に関するテストケースをすべて削除
- [ ] CLEARING_YAKU を TRIPLE_MATCH に変更
- [ ] `getRewardStars()` のテストを更新:
  - THREE_CARDS → 3
  - TRIPLE_MATCH → 1
- [ ] `getDrawCount()` のテストを追加:
  - THREE_CARDS → 3
  - TRIPLE_MATCH → 1

**理由:** 役の定義変更に合わせてテストを更新

---

#### 2-2. `src/domain/services/ComboDetector.test.ts`
**変更内容:**
- [ ] 2枚役の検出テストをすべて削除
- [ ] CLEARING_YAKU を TRIPLE_MATCH に変更
- [ ] `checkCombo()` の2枚役テストを削除
- [ ] `suggestWinningPlacements()` の2枚役テストを削除
- [ ] 優先順位テストを更新（THREE_CARDS > TRIPLE_MATCH）

**理由:** 2枚役の検出ロジックが削除されるため

---

#### 2-3. `src/domain/Game.test.ts`
**変更内容:**
- [ ] 2枚役の申告テストを削除
- [ ] CLEARING_YAKU を TRIPLE_MATCH に変更
- [ ] TRIPLE_MATCH の報酬テストを更新:
  - 3枚除去 / 1枚ドロー / 星1個
- [ ] 盤面全クリアのテストを削除（TRIPLE_MATCHは盤面全クリアしない）

**理由:** 役の処理ロジック変更に合わせてテストを更新

---

#### 2-4. `src/domain/services/cpu/CPUEasyStrategy.test.ts`
**変更内容:**
- [ ] 2枚役に関するテストケースを削除
- [ ] CLEARING_YAKU を TRIPLE_MATCH に変更
- [ ] 優先順位テストを更新（THREE_CARDS > TRIPLE_MATCH）

**理由:** CPU戦略の優先順位変更に合わせてテストを更新

---

#### 2-5. `src/domain/services/cpu/CPUNormalStrategy.test.ts`
**変更内容:**
- [ ] 2枚役に関するテストケースを削除
- [ ] CLEARING_YAKU を TRIPLE_MATCH に変更
- [ ] 優先順位テストを更新（THREE_CARDS > TRIPLE_MATCH）
- [ ] `suggestWinningPlacements()` を使った配置戦略のテストを更新

**理由:** CPU戦略の優先順位変更に合わせてテストを更新

---

### Phase 3: UI層の修正

#### 3-1. `src/components/ComboRules/ComboRulesPanel.tsx`
**変更内容:**
- [ ] 2枚役の説明を削除
- [ ] CLEARING_YAKU の説明を TRIPLE_MATCH に変更
- [ ] TRIPLE_MATCH の報酬を更新:
  - 旧: 盤面全クリア・報酬なし
  - 新: 3枚除去 / 1枚ドロー / 星1個
- [ ] 役のリストを「大役」と「小役」の2つに整理

**理由:** ユーザーに正しいルールを表示するため

---

#### 3-2. `src/components/Commentary/CommentaryArea.tsx`
**変更内容:**
- [ ] CLEARING_YAKU の実況メッセージを TRIPLE_MATCH に変更
- [ ] 2枚役の実況メッセージを削除
- [ ] 役の名称表示を更新:
  - 大役: 「1+4+16」
  - 小役: 「トリプルマッチ」または「同じ数字3枚」

**理由:** ゲーム実況で正しい役名を表示するため

---

#### 3-3. `src/components/Game/GameContainer.tsx`
**変更内容:**
- [ ] ComboType の使用箇所を確認し、TWO_CARDS_*, CLEARING_YAKU の参照を削除
- [ ] 役の表示ロジックを更新（必要に応じて）

**理由:** UIロジック内での役の扱いを統一

---

## 実装の進め方

### ステップ1: ドメイン層の修正（優先度: 高）
1. Combo.ts を修正（型定義・報酬計算）
2. ComboDetector.ts を修正（検出ロジック・優先度）
3. Game.ts を修正（役の処理ロジック）
4. CPUEasyStrategy.ts を修正（優先順位）
5. CPUNormalStrategy.ts を修正（優先順位）

### ステップ2: テスト層の修正（優先度: 中）
6. Combo.test.ts を修正
7. ComboDetector.test.ts を修正
8. Game.test.ts を修正
9. CPUEasyStrategy.test.ts を修正
10. CPUNormalStrategy.test.ts を修正

### ステップ3: UI層の修正（優先度: 中）
11. ComboRulesPanel.tsx を修正
12. CommentaryArea.tsx を修正
13. GameContainer.tsx を修正

### ステップ4: 最終確認（優先度: 高）
14. すべてのテストを実行して、パスすることを確認
15. ゲームを実際にプレイして動作確認

---

## 注意事項

1. **破壊的変更**: ComboTypeの変更は型の破壊的変更となるため、すべての参照箇所を漏れなく修正する必要がある
2. **後方互換性**: セーブデータや既存のゲーム状態に影響する可能性がある（現時点ではセーブ機能がないため問題なし）
3. **テストの重要性**: 役の検出ロジックはゲームの核心部分のため、テストを確実に通すことが重要
4. **UI表示**: プレイヤーに見える役の名称や説明が正しいことを確認

---

## リスクと対策

### リスク1: 2枚役の削除漏れ
- **影響**: 2枚役が成立してしまう、またはエラーが発生する
- **対策**: 全ファイルで `TWO_CARDS` を検索し、完全に削除されていることを確認

### リスク2: TRIPLE_MATCHの報酬計算ミス
- **影響**: ドロー枚数や星の獲得数が間違う
- **対策**: Game.test.ts でTRIPLE_MATCHの報酬テストを追加し、正しく動作することを確認

### リスク3: CPU優先順位の実装ミス
- **影響**: CPUが小役を優先してしまう、またはエラーが発生する
- **対策**: CPUStrategyのテストで優先順位を確認

---

## 見積もり

- **修正ファイル数**: 13ファイル
- **修正内容**: 型定義の変更、ロジックの削除・修正、テストの更新、UI表示の更新
- **難易度**: 中程度（型の破壊的変更だが、影響範囲は明確）

## [✓] 要望:CPUの行動仕様書を変えてほしい（完了:2026-02-03）
- ./docs/spec_ja.md の変更に沿った修正をしてほしい

### 対象:./docs/cpu_easy_spec.md
- 役の変更に合わせて、表現を修正してほしい（2枚役の廃止、クリア役の小役化)
- 戦略は基本かえなくてよい、成立してれば大役を優先でよい

### 対象:./docs/cpu_normal_spec.md
- 役の変更に合わせて、表現を修正してほしい（2枚役の廃止、クリア役の小役化)
- 戦略は、大役->小役の優先度とし、その他は変えなくてよい