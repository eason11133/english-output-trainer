export interface CurriculumWaveDCapabilityStatusV1 {
  capabilityId:string;
  beforePercent:number;
  afterPercent:number;
  problemZhTw:string;
  upgradeZhTw:string;
  practicalEffectZhTw:string;
  whyNot100ZhTw:string;
  acceptance:string;
  auditAdjusted?:boolean;
}

const rows = [
  ['D.goal-policy',25,75,'以前只有目標欄位，沒有正式規則把學習目的、使用情境和當前優先項轉成課程選擇訊號。','建立 Goal Policy，把學習目的、真實使用情境與 learner priority 轉成英文能力領域的權重，但不把它們當成 learner capability truth。','Today／課程系統開始知道「為什麼這個人現在更值得練寫作、翻譯、閱讀或詞彙產出」。','General／Exam 最終產品政策仍由 R/S 大標補上，不把 D 的第一輪權重假裝成最終商業策略。','structured goal/use/priority context changes candidate scores without rewriting learner truth'],
  ['D.coverage-governor',25,75,'如果只依最近錯誤排序，系統容易一直追同一小塊問題，忽略與目標相關但長期沒被看見的能力區域。','建立 coverage signal，依目前 evidence 覆蓋到哪些英文領域給未覆蓋但目標相關的區域適度加權，並在同一 Today plan 中對重複 area 做多樣性懲罰。','EOT 比較不會因為學生剛好連錯兩題文法，就把整個學習時間都塞給文法。','真正長期 coverage budget、跨週配置與課程地圖要到 L/R/S。','candidate ranking contains coverage-gap signal and multi-focus selection applies diversity penalty'],
  ['D.prerequisites',25,90,'English Domain 已有 prerequisite graph，但 Curriculum 尚未真的用它判斷「現在適不適合直接學這個」。','新增 prerequisite readiness；全新能力若前置能力沒有獨立控制證據，會先被放進 blocked territory，而不是硬排進 Today。','學生不會因為高階能力看起來很重要，就被直接丟去做還缺基礎的任務。','之後 E/F 還會決定教學中何時 bottom-out 到 prerequisite；D 只負責外迴圈 readiness。','unknown target with unmet prerequisite is blocked while already-observed target remains addressable'],
  ['D.ready-frontier',25,90,'「沒學過」以前沒有和「弱點」正式分開，容易把 unknown 當 failure。','把 prerequisite-ready 且沒有能力證據的 target 放入 READY frontier，標示為 NEW_LEARNING，不當成負向證據。','新學生可以從值得學的新能力開始，而不是先被系統判成一堆弱點。','內容覆蓋仍受目前 English Domain graph 範圍限制。','unknown prerequisite-ready target appears as READY/NEW_LEARNING'],
  ['D.reinforcement-frontier',25,90,'已觀察到脆弱或只能靠提示完成的能力，沒有正式的 outer-loop frontier。','把 OBSERVED_FRAGILE 與 ASSISTED_CONTROL 分別轉成 repair／independence reinforcement need。','EOT 可以把「真的近期不穩」和「有提示才會」排回值得處理的位置。','實際怎麼教、怎麼淡化支援仍由 E/F。','fragile and assisted states produce distinct reinforcement needs'],
  ['D.blocked-territory',25,90,'以前高價值但前置條件不足的能力沒有正式位置，只能被排或不排。','新增 BLOCKED territory，保留它的價值、缺哪些 prerequisite 與排序分數，但不讓它直接成為今天的 primary focus。','系統知道「這個很重要，但現在直接做不划算」，也能先把真正缺的基礎排進來。','完整「解鎖路徑」視覺化要到 N。','blocked high-value targets are preserved in plan metadata but cannot be selected directly'],
  ['D.allocation',25,90,'A/B/C 已有 context、domain、learner truth，但沒有單一 canonical outer-loop 把它們合成「下一步」。','建立 canonical curriculum candidate ranking，綜合 learner state、目標相關性、priority、coverage、prerequisite、uncertainty、transfer/retention need 與 product mode。','同一份 learner truth 現在可以產生可解釋的下一步學習排序，而不是 Today 自己硬寫。','真實大型 learner corpus 上的權重 calibration 要到 X，不能現在假裝最佳。','same inputs deterministically produce ranked explainable curriculum candidates'],
  ['D.general-allocation',25,75,'General 與 Exam 以前共用資料，但 D 沒有任何實際 allocation 差異。','General 第一輪偏向 durable output、meaning encoding，以及已經到 transfer／retention 階段的能力。','General 不必為了近期考試壓縮所有長期可用英文的驗證。','General 最終策略、coverage 配額與自然情境整合由 R 完成。','GENERAL mode receives durable-output and transfer/retention signals without a separate learner model'],
  ['D.exam-allocation',25,75,'Exam context 存在，但尚未影響 Outer Loop。','Exam 第一輪加入 exam-area bias 與 deadline urgency；仍使用同一份 canonical learner truth，不建立考試專屬 mastery。','同一個學生在考前可以把有限時間往較可能影響考試的輸出／閱讀能力移動。','正式考科 scope mapping、rubric value、expected-score gain 與 weakness parking 要到 S。','EXAM mode changes candidate allocation while reusing the same evidence/truth'],
  ['D.spacing',50,75,'舊 reencounter scheduler 有固定驗證窗，但 canonical Curriculum 沒有正式把立即成功和真正 delayed verification 分開。','在 D 只建立保守的 due gate：RETENTION_PENDING 必須跨過可設定的最小延遲才有資格排 delayed verification；這個門檻不是宣稱最佳記憶間隔。','剛學完五分鐘內不會被 Today 當成「延遲保留驗證」。','真正個人化 spacing、遺忘曲線或自然機會排程屬 L/X。','retention work cannot be due before the configured delayed-evidence minimum'],
  ['D.reencounter',50,75,'已有舊 Stage4 reencounter 類型，但沒有與 canonical learner state/frontier 接在同一 Outer Loop。','把 fragile、assisted、transfer pending、retention pending、stable 分別轉成 repair、independence、transfer、retention、maintenance reencounter need。','系統不再把所有「再遇一次」當成同一種複習。','跨天 queue、自然材料觸發與實際 scheduler execution 仍屬 L。','learner state maps to distinct reencounter needs without creating evidence'],
  ['D.retention-need',25,75,'Retention pending 只是 learner state，沒有進入 next-learning allocation。','建立 retention need，且只有真正達到 delayed due gate 時才可以進 selectable frontier。','系統能記得「這個之後要再證明一次」，又不會馬上重考。','何時最值得驗、用什麼 fresh task 驗要由 K/L/G。','RETENTION_PENDING becomes selectable only after delayed gate'],
  ['D.transfer-need',25,75,'Local independent success 和 transfer 尚未驗證之間沒有 Today-level allocation。','INDEPENDENT_LOCAL_CONTROL／TRANSFER_PENDING 會產生 changed-context transfer need，並在 General allocation 中保有高價值。','學生剛在原題會用後，系統知道下一步不是再做原題，而是之後換情境證明。','fresh changed-context task generation 與 transfer measurement 要到 G/K。','local independent control produces transfer need rather than same-item repetition'],
  ['D.time-architecture',25,90,'5/10/20/30/60 分鐘以前只是概念，沒有正式進 planning contract；也容易被誤做成固定幾關。','把使用者可用時間正規化成 5/10/20/30/60 budget envelope，只限制同時 active focus 數量與 soft stop，不規定 Teach→Practice→Assess 順序。','短時間不會硬塞太多目標，長時間也只是提供更多可用 focus，不會變固定課表。','真正 background time、soft-stop execution、interrupt handling 仍由 M。','time architecture sets budget/attention envelope and explicitly forbids fixed sequence'],
  ['D.today-plan',25,90,'Today 目前知道 session time 與是否有進行中作品，但「今天該推什麼」沒有 canonical plan authority。','新增 TodayCurriculumPlan：primary focus、reserve focuses、blocked high-value targets、reason codes、product mode、time envelope，全由 A+B+C 輸入生成。','Today 第一次有真正的 next-best-learning plan，而不是一張固定入口卡片或任意 mission list。','N 還要把這個 plan 做成最終 learner-facing UX；目前只完成 production data contract 與輕量 consumption。','production Today query consumes canonical curriculum plan generated from A+B+C'],
  ['D.lesson-plan',50,75,'已有 LessonPlanV1 contract 與舊 learningOrchestrator，但沒有由 canonical Today allocation 產生 lesson objective。','新增 Today plan → LessonPlan adapter，帶入 primary focus、理由、時間與 General/Exam mode；不在 D 決定教學機制或頁面順序。','之後 AI Teacher 接到的是「今天為什麼學這個」的正式 objective，而不是自行挑 curriculum。','E/M 還沒把所有正式 lesson session 都切到這個 adapter。','canonical Today focus can be converted into LessonPlanV1 without choosing pedagogy'],
  ['D.priority-override',25,90,'learner currentPriority 已存入 A，但過去沒有真正影響 next-learning allocation。','priority 會大幅提高對應 area 的 score，但不能越過 prerequisite gate，也不能改寫 learner truth。','學生說「我最近想先練翻譯」會真的改變排序，但不會讓系統假裝其他能力已學會或直接跳級。','N 之後才會做正式的「我想先練這個」 learner interaction 與解釋。','learner priority changes ranking but cannot select blocked target or mutate capability state'],
] as const;

const independentAuditScoresV1:Readonly<Record<string,number>>=Object.freeze({"D.goal-policy":50,"D.coverage-governor":50,"D.prerequisites":75,"D.ready-frontier":75,"D.reinforcement-frontier":75,"D.blocked-territory":75,"D.allocation":50,"D.general-allocation":50,"D.exam-allocation":50,"D.spacing":75,"D.reencounter":75,"D.retention-need":75,"D.transfer-need":75,"D.time-architecture":90,"D.today-plan":90,"D.lesson-plan":90,"D.priority-override":75});

export const curriculumWaveDCapabilityStatusV1:readonly CurriculumWaveDCapabilityStatusV1[]=Object.freeze(
  rows.map(([capabilityId,beforePercent,_afterPercent,problemZhTw,upgradeZhTw,practicalEffectZhTw,whyNot100ZhTw,acceptance])=>{
    const afterPercent=independentAuditScoresV1[String(capabilityId)]??Number(_afterPercent);
    return{capabilityId:String(capabilityId),beforePercent:Number(beforePercent),afterPercent,problemZhTw:String(problemZhTw),upgradeZhTw:String(upgradeZhTw),practicalEffectZhTw:String(practicalEffectZhTw),whyNot100ZhTw:String(whyNot100ZhTw),acceptance:String(acceptance),auditAdjusted:afterPercent!==Number(_afterPercent)};
  })
);
