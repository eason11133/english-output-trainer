export type VocabularyFacetV1 =
  | 'FORM'
  | 'CONTEXT_INFERENCE'
  | 'SENSE'
  | 'SEMANTIC_CONTRAST'
  | 'COLLOCATION'
  | 'CONSTRUCTION'
  | 'WORD_FAMILY'
  | 'RETRIEVAL'
  | 'PRODUCTION'
  | 'TRANSFER';

export type VocabularyPuzzleKindV1 =
  | 'FORM_RECONSTRUCTION'
  | 'CONTEXT_CUE_TRACE'
  | 'SENSE_BOUNDARY'
  | 'SEMANTIC_CONTRAST'
  | 'COLLOCATION_FIELD'
  | 'CONSTRUCTION_FRAME'
  | 'WORD_FAMILY_TRANSFORM'
  | 'RETRIEVAL_BRIDGE'
  | 'PRODUCTION_LADDER'
  | 'TRANSFER_REENCOUNTER';

export type LexicalSenseV1 = {
  id: string;
  shortLabel: string;
  zh: string;
  examples: readonly string[];
  cues: readonly string[];
};

export type CollocationGroupV1 = {
  head: string;
  items: readonly string[];
};

export type ConstructionV1 = {
  label: string;
  good: string;
  bad?: string;
};

export type WordFamilyMemberV1 = {
  form: string;
  role: 'verb' | 'noun' | 'adjective' | 'adverb';
  frame: string;
};

export type LexicalKnowledgeObjectV1 = {
  key: string;
  lemma: string;
  pronunciation?: string;
  coreZh: string;
  forms: readonly string[];
  formFragments: readonly string[];
  senses: readonly LexicalSenseV1[];
  confusables: readonly {
    word: string;
    zh: string;
    when: string;
    example: string;
  }[];
  collocationGroups: readonly CollocationGroupV1[];
  constructions: readonly ConstructionV1[];
  wordFamily: readonly WordFamilyMemberV1[];
  retrievalPromptZh: string;
  retrievalFrame: string;
  productionPromptZh: string;
  productionModel: string;
  transferContext: string;
  transferPrompt: string;
  transferChoices: readonly string[];
  transferAnswer: string;
};

export type LearnerLexicalStateV1 = {
  targetKey: string;
  facet: Readonly<Record<VocabularyFacetV1, number>>;
  lastUpdatedAt: string;
};

export type VocabularyPuzzleResultV1 = {
  puzzle: VocabularyPuzzleKindV1;
  correct: boolean;
  supportUsed: 0 | 1 | 2 | 3;
  evidence?: string;
};

export const vocabularyPuzzleFacetV1: Readonly<Record<VocabularyPuzzleKindV1, VocabularyFacetV1>> = {
  FORM_RECONSTRUCTION: 'FORM',
  CONTEXT_CUE_TRACE: 'CONTEXT_INFERENCE',
  SENSE_BOUNDARY: 'SENSE',
  SEMANTIC_CONTRAST: 'SEMANTIC_CONTRAST',
  COLLOCATION_FIELD: 'COLLOCATION',
  CONSTRUCTION_FRAME: 'CONSTRUCTION',
  WORD_FAMILY_TRANSFORM: 'WORD_FAMILY',
  RETRIEVAL_BRIDGE: 'RETRIEVAL',
  PRODUCTION_LADDER: 'PRODUCTION',
  TRANSFER_REENCOUNTER: 'TRANSFER',
};

const targets: readonly LexicalKnowledgeObjectV1[] = [
  {
    key: 'address',
    lemma: 'address',
    pronunciation: '/əˈdres/',
    coreZh: '地址；處理；向…發言',
    forms: ['address', 'addresses', 'addressed', 'addressing'],
    formFragments: ['ad', 'dress', 'add', 'res', 'address'],
    senses: [
      {
        id: 'location',
        shortLabel: 'LOCATION',
        zh: '地址／位置資訊',
        examples: ['home address', 'email address', 'shipping address'],
        cues: ['home', 'email', 'shipping'],
      },
      {
        id: 'deal-with',
        shortLabel: 'DEAL WITH',
        zh: '處理、正視問題',
        examples: ['address the issue', 'address concerns', 'address the problem'],
        cues: ['issue', 'concerns', 'problem'],
      },
      {
        id: 'speak-to',
        shortLabel: 'SPEAK TO',
        zh: '向某群人正式發言',
        examples: ['address the audience', 'address the nation', 'address the meeting'],
        cues: ['audience', 'nation', 'meeting'],
      },
    ],
    confusables: [
      {
        word: 'solve',
        zh: '解決',
        when: '強調把問題真正解掉',
        example: 'solve the problem',
      },
      {
        word: 'discuss',
        zh: '討論',
        when: '強調交換想法，不代表採取處理',
        example: 'discuss the issue',
      },
      {
        word: 'deal with',
        zh: '處理',
        when: '較一般、口語，範圍比 address 廣',
        example: 'deal with the complaint',
      },
    ],
    collocationGroups: [
      { head: 'address', items: ['an issue', 'a problem', 'concerns', 'the audience'] },
      { head: 'discuss', items: ['an issue', 'a proposal', 'the results', 'the plan'] },
    ],
    constructions: [
      { label: '直接接受詞', good: 'address + the problem', bad: 'address about the problem' },
      { label: 'concerns about…', good: 'address concerns about privacy' },
      { label: '被動', good: 'The issue was addressed quickly.' },
    ],
    wordFamily: [
      { form: 'address', role: 'verb', frame: 'We need to ____ the issue.' },
      { form: 'addressed', role: 'verb', frame: 'The report ____ several concerns.' },
      { form: 'addressing', role: 'verb', frame: 'They are ____ the problem now.' },
      { form: 'address', role: 'noun', frame: 'Please enter your home ____.' },
    ],
    retrievalPromptZh: '正式地「處理／正視一個問題」',
    retrievalFrame: '______ the issue',
    productionPromptZh: '政府必須正視這項問題。',
    productionModel: 'The government must address this issue.',
    transferContext:
      'Local residents raised concerns about traffic near the school. The city promised to address those concerns before approving the new plan.',
    transferPrompt: '這裡的 address 最接近哪個意思？',
    transferChoices: ['提供地址', '處理問題', '公開演說', '寄送'],
    transferAnswer: '處理問題',
  },
  {
    key: 'reserve',
    lemma: 'reserve',
    pronunciation: '/rɪˈzɝːv/',
    coreZh: '預留；保留',
    forms: ['reserve', 'reserves', 'reserved', 'reserving', 'reservation'],
    formFragments: ['re', 'serve', 'res', 'erve', 'reserve'],
    senses: [
      {
        id: 'book',
        shortLabel: 'BOOK AHEAD',
        zh: '先預留給之後使用',
        examples: ['reserve a table', 'reserve a seat', 'reserve a room'],
        cues: ['table', 'seat', 'room'],
      },
      {
        id: 'keep-back',
        shortLabel: 'KEEP BACK',
        zh: '保留、不立即使用',
        examples: ['reserve some money', 'reserve the right', 'keep in reserve'],
        cues: ['money', 'right', 'future'],
      },
    ],
    confusables: [
      {
        word: 'restore',
        zh: '恢復、還原',
        when: '讓東西回到原本狀態',
        example: 'restore a deleted file',
      },
      {
        word: 'preserve',
        zh: '保存、維護',
        when: '避免東西受損或消失',
        example: 'preserve historic buildings',
      },
      {
        word: 'conserve',
        zh: '節約、保存資源',
        when: '強調有限資源不要浪費',
        example: 'conserve water',
      },
    ],
    collocationGroups: [
      { head: 'reserve', items: ['a seat', 'a table', 'a room', 'a ticket'] },
      { head: 'restore', items: ['a file', 'a system', 'a building', 'confidence'] },
    ],
    constructions: [
      { label: 'reserve + 受詞', good: 'reserve a seat', bad: 'reserve for a seat' },
      { label: 'reserve A for B', good: 'reserve a room for Friday' },
      { label: 'be reserved for', good: 'These seats are reserved for guests.' },
    ],
    wordFamily: [
      { form: 'reserve', role: 'verb', frame: 'Please ____ a table.' },
      { form: 'reserved', role: 'adjective', frame: 'This seat is ____.' },
      { form: 'reservation', role: 'noun', frame: 'I made a ____.' },
      { form: 'reserving', role: 'verb', frame: 'We are ____ two rooms.' },
    ],
    retrievalPromptZh: '先把位置留給之後使用',
    retrievalFrame: '______ a table for two',
    productionPromptZh: '我想預留兩個位子。',
    productionModel: 'I would like to reserve two seats.',
    transferContext:
      'Tickets are limited, so visitors should reserve them online before Friday. A small number will be kept in reserve for guests who need assistance.',
    transferPrompt: '第一個 reserve 在這裡做什麼？',
    transferChoices: ['先預訂', '修復', '節省', '拒絕'],
    transferAnswer: '先預訂',
  },
  {
    key: 'significant',
    lemma: 'significant',
    pronunciation: '/sɪɡˈnɪfɪkənt/',
    coreZh: '重要的；顯著的',
    forms: ['significant', 'significantly', 'significance'],
    formFragments: ['sig', 'nif', 'i', 'cant', 'fic', 'significant'],
    senses: [
      {
        id: 'important',
        shortLabel: 'IMPORTANT',
        zh: '重要、有影響力',
        examples: ['a significant decision', 'a significant contribution', 'a significant role'],
        cues: ['decision', 'contribution', 'role'],
      },
      {
        id: 'large-enough',
        shortLabel: 'NOTICEABLE',
        zh: '顯著、達到值得注意的程度',
        examples: ['a significant increase', 'a significant difference', 'significant improvement'],
        cues: ['increase', 'difference', 'improvement'],
      },
    ],
    confusables: [
      {
        word: 'important',
        zh: '重要的',
        when: '一般重要性',
        example: 'an important decision',
      },
      {
        word: 'considerable',
        zh: '相當大的',
        when: '偏數量或程度很大',
        example: 'considerable progress',
      },
      {
        word: 'meaningful',
        zh: '有意義的',
        when: '強調意義或價值',
        example: 'a meaningful change',
      },
    ],
    collocationGroups: [
      { head: 'significant', items: ['change', 'difference', 'impact', 'increase'] },
      { head: 'considerable', items: ['amount', 'pressure', 'distance', 'cost'] },
    ],
    constructions: [
      { label: 'significant + noun', good: 'a significant improvement' },
      { label: 'significantly + adjective/verb', good: 'significantly better' },
      { label: 'of significance', good: 'a discovery of great significance' },
    ],
    wordFamily: [
      { form: 'significant', role: 'adjective', frame: 'This was a ____ change.' },
      { form: 'significantly', role: 'adverb', frame: 'The result improved ____.' },
      { form: 'significance', role: 'noun', frame: 'We understood its ____.' },
      { form: 'significant', role: 'adjective', frame: 'The difference is ____.' },
    ],
    retrievalPromptZh: '重要到值得注意、或差異大到很明顯',
    retrievalFrame: 'a ______ difference',
    productionPromptZh: '這項改變帶來了顯著的影響。',
    productionModel: 'This change had a significant impact.',
    transferContext:
      'The new policy produced a small improvement at first, but after six months the difference became statistically significant.',
    transferPrompt: 'significant 在這裡偏向哪一層意思？',
    transferChoices: ['好看的', '顯著到值得注意', '非常快速', '很有禮貌'],
    transferAnswer: '顯著到值得注意',
  },
];

export function vocabularyTargetByKeyV1(key: string | undefined): LexicalKnowledgeObjectV1 {
  return targets.find(item => item.key === key) ?? targets[0];
}

export function seedLearnerLexicalStateV1(targetKey: string): LearnerLexicalStateV1 {
  return {
    targetKey,
    facet: {
      FORM: 0.72,
      CONTEXT_INFERENCE: 0.42,
      SENSE: 0.34,
      SEMANTIC_CONTRAST: 0.38,
      COLLOCATION: 0.28,
      CONSTRUCTION: 0.26,
      WORD_FAMILY: 0.48,
      RETRIEVAL: 0.24,
      PRODUCTION: 0.18,
      TRANSFER: 0.12,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

const puzzleOrder: readonly VocabularyPuzzleKindV1[] = [
  'FORM_RECONSTRUCTION',
  'CONTEXT_CUE_TRACE',
  'SENSE_BOUNDARY',
  'SEMANTIC_CONTRAST',
  'COLLOCATION_FIELD',
  'CONSTRUCTION_FRAME',
  'WORD_FAMILY_TRANSFORM',
  'RETRIEVAL_BRIDGE',
  'PRODUCTION_LADDER',
  'TRANSFER_REENCOUNTER',
];

export function chooseVocabularyPuzzleV1(
  state: LearnerLexicalStateV1,
  completed: ReadonlySet<VocabularyPuzzleKindV1> = new Set(),
): VocabularyPuzzleKindV1 {
  const ranked = [...puzzleOrder]
    .filter(puzzle => !completed.has(puzzle))
    .map(puzzle => ({ puzzle, score: state.facet[vocabularyPuzzleFacetV1[puzzle]] }))
    .sort((a, b) => a.score - b.score);
  return ranked[0]?.puzzle ?? 'TRANSFER_REENCOUNTER';
}

export function applyVocabularyPuzzleResultV1(
  state: LearnerLexicalStateV1,
  result: VocabularyPuzzleResultV1,
): LearnerLexicalStateV1 {
  const facet = vocabularyPuzzleFacetV1[result.puzzle];
  const old = state.facet[facet];
  const supportPenalty = result.supportUsed * 0.035;
  const delta = result.correct ? Math.max(0.08, 0.22 - supportPenalty) : -0.04;
  return {
    ...state,
    facet: {
      ...state.facet,
      [facet]: Math.max(0, Math.min(1, old + delta)),
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function fallbackVocabularyPuzzleV1(
  puzzle: VocabularyPuzzleKindV1,
): VocabularyPuzzleKindV1 {
  const fallback: Readonly<Record<VocabularyPuzzleKindV1, VocabularyPuzzleKindV1>> = {
    FORM_RECONSTRUCTION: 'CONTEXT_CUE_TRACE',
    CONTEXT_CUE_TRACE: 'SENSE_BOUNDARY',
    SENSE_BOUNDARY: 'CONTEXT_CUE_TRACE',
    SEMANTIC_CONTRAST: 'SENSE_BOUNDARY',
    COLLOCATION_FIELD: 'SEMANTIC_CONTRAST',
    CONSTRUCTION_FRAME: 'COLLOCATION_FIELD',
    WORD_FAMILY_TRANSFORM: 'CONSTRUCTION_FRAME',
    RETRIEVAL_BRIDGE: 'COLLOCATION_FIELD',
    PRODUCTION_LADDER: 'RETRIEVAL_BRIDGE',
    TRANSFER_REENCOUNTER: 'RETRIEVAL_BRIDGE',
  };
  return fallback[puzzle];
}

export function puzzleTitleV1(puzzle: VocabularyPuzzleKindV1): string {
  const labels: Readonly<Record<VocabularyPuzzleKindV1, string>> = {
    FORM_RECONSTRUCTION: '字形重建',
    CONTEXT_CUE_TRACE: '語境線索追蹤',
    SENSE_BOUNDARY: '語意邊界',
    SEMANTIC_CONTRAST: '近義辨析',
    COLLOCATION_FIELD: '搭配場',
    CONSTRUCTION_FRAME: '使用框架',
    WORD_FAMILY_TRANSFORM: '詞族變形',
    RETRIEVAL_BRIDGE: '提取橋',
    PRODUCTION_LADDER: '產出階梯',
    TRANSFER_REENCOUNTER: '新情境再遇',
  };
  return labels[puzzle];
}
