HISTORICAL — superseded by CURRENT_STATUS.md.
Preserved as development history. Do not use this file as current product/status authority.

EOT Adaptive Placement + Learn/Growth Surface Patch v1

這不是新 HTML demo。這份 patch 直接修改真 Expo App。

1. 程度診斷改成 adaptive routing
- 不再照固定題目順序跑一張預設考卷。
- 每答一題都更新目前能力估計，再選接近目前能力的下一題。
- 起始先用少量 recognition anchor 快速找範圍，但第 3 題開始就會進 production evidence。
- 必須取得 vocabulary recognition / grammar / reading / active vocabulary / translation / structural production 的核心 coverage。
- 最少 8 題、最多 12 題；證據夠才提前停止。
- recognition 對 ability estimate 的權重低於 independent production。
- 若辨識明顯高於輸出，後續會偏向 production；不會因選擇題答好就一路升難度。

2. 題型不是「選擇 + 填空亂混」
- Vocabulary recognition / grammar recognition：只當快速 locator。
- Active vocabulary：typed recall。
- Grammar form：typed cloze / constrained production。
- Sentence structure：guided / controlled English production。
- Translation：open controlled production，可接受多種 pattern。
- Reading：保留 reading MCQ，因為它本身測 comprehension，而不是拿 MCQ 代替 output。
- 連續兩題若都是選擇題，routing 會明顯偏向 production，避免整份診斷變成選擇題。

3. 選擇題 UX
- 點答案 = 提交。
- 會短暫顯示選取狀態，然後自動下一題。
- 沒有額外「檢查答案 / 下一題」兩次點擊。

4. 診斷期間不教
- 不顯示正解、詳解、對錯 feedback，避免前一題教到的內容污染後面的程度判斷。
- 可以直接按「我不知道」，這會記成明確 unknown，而不是中斷 / 漏答。

5. Diagnostic evidence
- 記錄 responseTimeMs / editCount / explicitUnknown。
- 這些只作 supporting evidence；不會因一題慢就直接判定能力弱。

6. 結果頁
- 不再拿很少幾題做「80%、67%」這類假精準百分比。
- 顯示暫定起點、每個有證據 dimension 的 level、辨識 vs output 關係，以及 evidence count。
- 明確告知 placement 只是起點，之後 Mission evidence 會持續校準。

7. Learn / Growth 修正一起包含
- Learn = learner 自己選想練什麼 / 題型 / 素材。
- Growth = 正在成長、需要處理、下一個突破、最近變化。

已驗證：
- npm run typecheck PASS
- npm run test:domain 133 / 133 PASS
