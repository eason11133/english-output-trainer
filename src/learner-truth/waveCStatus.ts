export interface LearnerTruthWaveCCapabilityStatusV1 {
  capabilityId: string;
  beforePercent: number;
  afterPercent: number;
  problemZhTw: string;
  upgradeZhTw: string;
  practicalEffectZhTw: string;
  whyNot100ZhTw: string;
  acceptance: string;
  auditAdjusted?:boolean;
}

const rows = [
  ['C.original-artifact',75,90,'原始作品已能保存，但「原作不可被後續解讀或修正覆寫」的責任仍分散在 Stage4 與儲存層。','保留 immutable OriginalArtifact，並把來源確認、意圖修正都改成獨立 observation，不覆寫原作。','之後學生改正 OCR、補充原意或接受教學時，系統仍能追溯他最初真正寫了什麼。','跨裝置 artifact storage 與正式後端仍屬 U。','source corrections remain separate from immutable artifact bytes/text'],
  ['C.observation',25,75,'很多 learner action 只存在 runtime trace，沒有正式「觀察」概念；幫助請求與來源確認容易被混進證據流程。','新增 immutable LearnerObservation，Stage4 會記錄作品送出、來源確認、原意確認、提示請求與一般 learner action，並明示是否允許成為能力證據。','EOT 可以「廣泛記錄發生了什麼」，但只讓少數合格 observation 進入 evidence。','目前 observation 主要跟 Lesson runtime 一起持久化，尚未有跨裝置全域 observation ledger。','help/source-correction observations are recorded while capabilityEvidenceAllowed stays false'],
  ['C.evidence-candidate',75,90,'Evidence candidate 已存在，但缺少 observation identity、opportunity 與 canonical target lineage。','candidate 現在可攜帶 observationId、artifactId、episodeId、opportunityPresent，commit 時再補 canonical target/provenance。','Teacher 可以提出證據候選，但候選本身仍不能直接改 learner truth。','後續 K Assessment 仍會擴充 measurement qualification。','candidate remains a proposal and must pass guard + canonical commit'],
  ['C.canonical-event',75,90,'Canonical event 可 append，但缺少結構化 provenance、dedup identity 與條件可靠度。','commit 後產生 enriched canonical event，包含 canonical target、provenance、uncertainty、condition reliability 與 dedup key。','同一筆學習證據能被追溯到哪個 action、task、artifact、support 與 context。','正式 server event ledger / sync 仍屬 U。','committed event is immutable and enriched before ledger append'],
  ['C.provenance',50,90,'過去 provenance 分散在多個欄位，追查「這個結論從哪來」需要人工拼。','建立 structured EvidenceProvenance，把 observation/artifact/task/episode、原始 target、canonical target、support、production、context、semantic source 串起來。','之後 My English 或 Teacher 可追到「為什麼系統這樣判斷」，而不是只看到一個 mastery 結果。','跨服務 trace id 與 server audit log 尚未做。','new commits carry structured provenance'],
  ['C.assistance-contamination',75,90,'已有 support guard，但不同欄位之間仍可能不一致。','保留並加強 modeled/explicit/guided/cued 與 independent 的隔離；condition reliability 也會因高支援而降低。','有提示寫對不會被偷偷升級成「自己會」。','更完整的 support-policy repertoire 要到 E/F/K。','supported responses cannot become independent proof'],
  ['C.independent-proof',75,90,'已有 independent 判斷，但 projection 過度依靠事件數量，沒有把來源可靠度與 canonical target 一起考慮。','獨立正向證據必須是 NONE support 的 independent production，projection 以 canonical target + facet 聚合。','同一能力在不同模組出現時能累積到同一份獨立產出紀錄。','更多真實 task families 要到 H/I/J/K。','independent proof requires independent production with no prior support'],
  ['C.transfer-proof',75,90,'Changed context 已存在，但與 target identity、support contamination 的整體投影尚未統一。','transfer 僅由 independent + changed/delayed context 的正向事件支持，且使用 canonical target 聚合。','同一句重做不會冒充「換情境也會用」。','長期 transfer scheduling 仍屬 L。','assisted changed-context success cannot prove transfer'],
  ['C.delayed-proof',75,90,'Delayed context 有欄位，但 projection 對 retention 與 transfer 的證據語意仍偏簡化。','只有 independent delayed-context positive event 才能形成 retention support，與立即成功分開。','剛學會不會立刻被標成穩定。','真正延遲多久、何時重測由 K/L 決定。','immediate success stays separate from delayed retention support'],
  ['C.negative-evidence',50,75,'負向結果容易被當成「不會」，但有時根本沒有公平機會、來源不可靠或只是一次失誤。','negative capability evidence 要有明確 opportunity；低可信或無 opportunity 的負向候選被 guard 擋住，projection 要重複近期負向才把高階狀態降為 fragile。','一次失誤不會抹掉過去證據；連續可靠失誤才會讓系統提高警覺。','更精細的 slip/load diagnosis 要到 E/K。','negative evidence requires opportunity and repeated recent negatives for fragility'],
  ['C.unknown',25,75,'沒有足夠證據時容易被迫二分成會/不會。','UNKNOWN polarity 可以被保留為觀察歷史，但不推升或降低 capability state；沒有合格 evidence 就維持 UNKNOWN。','系統可以老實說「目前不知道」，而不是亂猜學生會不會。','未來 D/E 仍要學會如何對 Unknown 安排高價值 probe。','unknown evidence does not move capability state'],
  ['C.hypotheses',25,75,'competingExplanations 只是字串，projection 沒把互相競爭的可能原因保留下來。','projection 現在保留 competing explanations，並建立 support-dependent、condition-dependent、observed-gap 等有限 hypothesis 狀態。','同一個錯誤不會直接被硬貼「文法不會」；Teacher 可以看到可能是支援依賴、情境脆弱或真的有缺口。','真正 hypothesis-aware Teacher decision 要到 E。','projection exposes competing hypotheses without treating them as truth'],
  ['C.projection',75,90,'LearnerModel 已可由 evidence 重算，但聚合仍以 raw targetRef 為主，且 uncertainty/condition reliability 不足。','新增 canonical learner-truth projection，按 canonical target + facet 重建 state，並附 uncertainty、hypotheses、support dependence、condition reliability。','My English、Curriculum、Teacher 未來都能吃同一份可重建 learner state，而不是各自算一套。','learner-facing My English projection 與 longitudinal refresh 在 N/L。','projection is deterministic and derived only from canonical events'],
  ['C.dedup',25,90,'不同 event id 可能重複提交同一個 learner action，造成證據被算兩次。','每個新 canonical event 產生 dedup key；ledger 能辨識「不同 id、同 observation」並只保留一份。','網路重送或 UI 重複觸發不會把一次成功算成兩次成功。','跨裝置 server-side dedup 仍要 U。','different event ids from the same observation deduplicate'],
  ['C.idempotency',25,90,'同一 commit 重試以前會因 event id 已存在直接丟錯，對網路重試不友善。','新增 idempotent append：相同 id + 相同內容視為 replay，不重複寫；相同 id + 不同內容仍視為 immutable conflict。','App 重試同一筆提交可以安全恢復，不必冒著複製證據或直接失敗。','分散式 idempotency key / server transaction 尚未做。','same event replay is safe while conflicting reuse is rejected'],
  ['C.uncertainty',25,75,'confidence 與 competing explanation 沒有被投影成正式的不確定性。','canonical event 保存 uncertainty；capability projection 依衝突證據、低可靠度、樣本量與 competing explanations 產生 LOW/MEDIUM/HIGH uncertainty。','系統知道自己「有多確定」，避免把一兩次結果講得太滿。','未來 measurement calibration 要到 K/X。','projection uncertainty rises on conflicting/low-reliability evidence'],
  ['C.condition-reliability',25,75,'相同成功結果在無提示、重提示、低 confidence 下其實可信度不同，但 projection 沒正式表示。','新增 conditionReliability，綜合 confidence、support、task affordance 與 canonical target resolution。','Teacher 後面可以區分「真的自己會」和「在非常受支援條件下剛好做對」。','更完整 load/device/noise calibration 要到 K/X。','event and projection expose condition reliability separately from capability state'],
] as const;

const independentAuditScoresV1:Readonly<Record<string,number>>=Object.freeze({"C.original-artifact":90,"C.observation":75,"C.evidence-candidate":75,"C.canonical-event":90,"C.provenance":90,"C.assistance-contamination":90,"C.independent-proof":90,"C.transfer-proof":90,"C.delayed-proof":90,"C.negative-evidence":75,"C.unknown":75,"C.hypotheses":50,"C.projection":75,"C.dedup":90,"C.idempotency":90,"C.uncertainty":75,"C.condition-reliability":75});

export const learnerTruthWaveCCapabilityStatusV1:readonly LearnerTruthWaveCCapabilityStatusV1[]=Object.freeze(
  rows.map(([capabilityId,beforePercent,_afterPercent,problemZhTw,upgradeZhTw,practicalEffectZhTw,whyNot100ZhTw,acceptance])=>{
    const afterPercent=independentAuditScoresV1[String(capabilityId)]??Number(_afterPercent);
    return{capabilityId:String(capabilityId),beforePercent:Number(beforePercent),afterPercent,problemZhTw:String(problemZhTw),upgradeZhTw:String(upgradeZhTw),practicalEffectZhTw:String(practicalEffectZhTw),whyNot100ZhTw:String(whyNot100ZhTw),acceptance:String(acceptance),auditAdjusted:afterPercent!==Number(_afterPercent)};
  })
);
