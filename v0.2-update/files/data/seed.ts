import { OutputLevel, Workout } from '../types/domain';

const FOUNDATION_WORKOUT: Workout = {
  id: 'foundation-demo-001',
  title: 'Foundation Output Workout',
  estimatedMinutes: 6,
  focusTags: ['Basic sentence order', 'Plural nouns', 'want to + V'],
  exercises: [
    {
      id: 'f-t1',
      kind: 'translation',
      title: 'Translation 1',
      prompt: '很多學生每天使用手機。',
      estimatedSeconds: 45,
      focusTags: ['many + plural noun', 'simple present'],
      hints: ['Start with “Many students …”'],
      expectedPatterns: [
        { id: 'many-students', label: 'many students', regex: '\\bmany\\s+students\\b', flags: 'i' },
        { id: 'use-phones', label: 'use phones', regex: '\\buse\\s+(?:their\\s+)?(?:phones|smartphones)\\b', flags: 'i' },
      ],
      referenceAnswer: 'Many students use their phones every day.',
    },
    {
      id: 'f-r1',
      kind: 'retrieval',
      title: 'Pattern Recall',
      prompt: '請用英文表達：「我想要提升我的英文。」',
      estimatedSeconds: 40,
      focusTags: ['want to + V'],
      hints: ['I want to …'],
      expectedPatterns: [
        { id: 'want-to', label: 'want to + verb', regex: '\\bwant\\s+to\\s+improve\\b', flags: 'i' },
        { id: 'my-english', label: 'my English', regex: '\\bmy\\s+english\\b', flags: 'i' },
      ],
      referenceAnswer: 'I want to improve my English.',
    },
    {
      id: 'f-t2',
      kind: 'translation',
      title: 'Translation 2',
      prompt: '運動可以幫助我們保持健康。',
      estimatedSeconds: 45,
      focusTags: ['can + base verb', 'help + object + V'],
      hints: ['Exercise can …', 'Use “help us stay healthy”.'],
      expectedPatterns: [
        { id: 'can-help', label: 'can help', regex: '\\bcan\\s+help\\b', flags: 'i' },
        { id: 'stay-healthy', label: 'stay healthy', regex: '\\bstay\\s+healthy\\b', flags: 'i' },
      ],
      referenceAnswer: 'Exercise can help us stay healthy.',
    },
    {
      id: 'f-r2',
      kind: 'retrieval',
      title: 'Active Vocabulary',
      prompt: '請用英文表達：「學英文有很多好處。」',
      estimatedSeconds: 45,
      focusTags: ['benefit', 'there are'],
      hints: ['There are many …', 'Try the word “benefits”.'],
      expectedPatterns: [
        { id: 'benefits', label: 'benefits', regex: '\\bbenefits\\b', flags: 'i' },
        { id: 'learning-english', label: 'learning English', regex: '\\blearning\\s+english\\b', flags: 'i' },
      ],
      referenceAnswer: 'There are many benefits to learning English.',
    },
    {
      id: 'f-m1',
      kind: 'mini_output',
      title: 'Mini Output',
      prompt: 'Write 2 simple sentences about why you study English.',
      estimatedSeconds: 90,
      focusTags: ['Simple sentences', 'Clear meaning'],
      hints: ['Sentence 1: your goal. Sentence 2: why it matters.'],
      expectedPatterns: [],
    },
  ],
};

const DEVELOPING_WORKOUT: Workout = {
  id: 'developing-demo-001',
  title: 'Developing Output Workout',
  estimatedMinutes: 7,
  focusTags: ['Infinitive', 'Common collocations', 'Relative clauses'],
  exercises: [
    {
      id: 'd-t1',
      kind: 'translation',
      title: 'Translation 1',
      prompt: '許多青少年想要在社群媒體上獲得更多關注。',
      estimatedSeconds: 60,
      focusTags: ['many + plural noun', 'want to + V', 'gain attention'],
      hints: ['Start with “Many teenagers …”', 'Use “want to gain more attention”.'],
      expectedPatterns: [
        { id: 'teenagers', label: 'teenagers', regex: '\\bteenagers\\b', flags: 'i' },
        { id: 'want-to', label: 'want to + verb', regex: '\\bwant\\s+to\\s+gain\\b', flags: 'i' },
        { id: 'gain-attention', label: 'gain attention', regex: '\\bgain\\s+(?:more\\s+)?attention\\b', flags: 'i' },
      ],
      referenceAnswer: 'Many teenagers want to gain more attention on social media.',
    },
    {
      id: 'd-r1',
      kind: 'retrieval',
      title: 'Active Vocabulary',
      prompt: '請用英文表達：「我每天花太多時間滑手機。」',
      estimatedSeconds: 55,
      focusTags: ['spend time + V-ing'],
      hints: ['I spend too much time …', 'Use a verb ending in -ing.'],
      expectedPatterns: [
        { id: 'spend-time', label: 'spend time + V-ing', regex: '\\bspend\\s+too\\s+much\\s+time\\s+\\w+ing\\b', flags: 'i' },
      ],
      referenceAnswer: 'I spend too much time using my phone every day.',
    },
    {
      id: 'd-t2',
      kind: 'translation',
      title: 'Translation 2',
      prompt: '露營讓我有機會更接近大自然。',
      estimatedSeconds: 60,
      focusTags: ['give + person + a chance', 'close to nature'],
      hints: ['Camping gives me a chance to …', 'Use “get closer to nature”.'],
      expectedPatterns: [
        { id: 'chance-to', label: 'a chance to', regex: '\\ba\\s+chance\\s+to\\b', flags: 'i' },
        { id: 'close-to', label: 'closer to nature', regex: '\\bcloser\\s+to\\s+nature\\b', flags: 'i' },
      ],
      referenceAnswer: 'Camping gives me a chance to get closer to nature.',
    },
    {
      id: 'd-r2',
      kind: 'retrieval',
      title: 'Pattern Recall',
      prompt: '請用英文表達：「這個方法最大的缺點之一，是它很浪費時間。」',
      estimatedSeconds: 65,
      focusTags: ['one of the + plural noun', 'drawback'],
      hints: ['One of the biggest …', 'Try “drawbacks”.'],
      expectedPatterns: [
        { id: 'one-of', label: 'one of the + plural noun', regex: '\\bone\\s+of\\s+the\\s+\\w+\\s+drawbacks\\b', flags: 'i' },
        { id: 'waste-time', label: 'waste time', regex: '\\bwast(?:e|es|ing)\\s+(?:a\\s+lot\\s+of\\s+)?time\\b', flags: 'i' },
      ],
      referenceAnswer: 'One of the biggest drawbacks of this method is that it wastes a lot of time.',
    },
    {
      id: 'd-m1',
      kind: 'mini_output',
      title: 'Mini Output',
      prompt: 'Write 2–3 sentences about one advantage and one drawback of social media.',
      estimatedSeconds: 120,
      focusTags: ['advantage', 'drawback', 'Clear explanation'],
      hints: ['Make one point, then explain it briefly.'],
      expectedPatterns: [
        { id: 'drawback', label: 'drawback', regex: '\\bdrawback(?:s)?\\b', flags: 'i' },
      ],
    },
  ],
};

const INTERMEDIATE_WORKOUT: Workout = {
  id: 'intermediate-demo-001',
  title: 'Intermediate Output Workout',
  estimatedMinutes: 8,
  focusTags: ['Collocation retrieval', 'Complex sentence planning', 'Transfer'],
  exercises: [
    {
      id: 'i-t1',
      kind: 'translation',
      title: 'Translation 1',
      prompt: '現今許多想要在社群媒體上獲得更多關注的青少年認為，做點瘋狂的事是無害的。',
      estimatedSeconds: 90,
      focusTags: ['many + plural noun', 'want to + V', 'gain attention'],
      hints: [
        'Start with “Nowadays, many …”',
        'Use a relative clause after teenagers.',
        'Try the collocation “gain attention”.',
      ],
      expectedPatterns: [
        { id: 'teenagers-plural', label: 'teenagers', regex: '\\bteenagers\\b', flags: 'i' },
        { id: 'want-to', label: 'want to + verb', regex: '\\bwant(?:s|ed)?\\s+to\\s+\\w+', flags: 'i' },
        { id: 'gain-attention', label: 'gain attention', regex: '\\bgain(?:ing|ed|s)?\\s+(?:more\\s+)?attention\\b', flags: 'i' },
        { id: 'harmless', label: 'harmless', regex: '\\bharmless\\b', flags: 'i' },
      ],
      referenceAnswer:
        'Nowadays, many teenagers who want to gain more attention on social media think that doing something crazy is harmless.',
    },
    {
      id: 'i-r1',
      kind: 'retrieval',
      title: 'Active Vocabulary',
      prompt: '請用英文表達：「這個做法最大的缺點之一，是它很容易讓人分心。」請盡量使用你已經學過的「缺點」表達。',
      estimatedSeconds: 60,
      focusTags: ['drawback', 'one of the + plural noun'],
      hints: ['Think of a stronger word than “bad thing”.', 'One major d…'],
      expectedPatterns: [
        { id: 'drawback', label: 'drawback', regex: '\\bdrawback(?:s)?\\b', flags: 'i' },
        { id: 'distraction', label: 'distract/distraction', regex: '\\bdistract(?:s|ed|ing)?\\b|\\bdistraction\\b', flags: 'i' },
      ],
      referenceAnswer: 'One major drawback of this approach is that it can easily distract people.',
    },
    {
      id: 'i-t2',
      kind: 'translation',
      title: 'Translation 2',
      prompt: '如果我們過度執著於理想生活，就可能逐漸與現實脫節。',
      estimatedSeconds: 75,
      focusTags: ['attached to', 'detached from', 'modal + base verb'],
      hints: ['Try “too attached to …”', 'Use “detached from reality”.'],
      expectedPatterns: [
        { id: 'attached', label: 'attached to', regex: '\\battached\\s+to\\b', flags: 'i' },
        { id: 'detached', label: 'detached from', regex: '\\bdetached\\s+from\\b', flags: 'i' },
      ],
      referenceAnswer: 'If we become too attached to an ideal life, we may gradually become detached from reality.',
    },
    {
      id: 'i-r2',
      kind: 'retrieval',
      title: 'Pattern Recall',
      prompt: '請完成概念：「一次看似不起眼的失敗，最後成為我成長的契機。」',
      estimatedSeconds: 75,
      focusTags: ['seemingly', 'catalyst for'],
      hints: ['The seemingly …', '… turned out to be a catalyst for …'],
      expectedPatterns: [
        { id: 'seemingly', label: 'seemingly', regex: '\\bseemingly\\b', flags: 'i' },
        { id: 'catalyst-for', label: 'a catalyst for', regex: '\\ba\\s+catalyst\\s+for\\b', flags: 'i' },
      ],
      referenceAnswer: 'The seemingly minor failure turned out to be a catalyst for my growth.',
    },
    {
      id: 'i-m1',
      kind: 'mini_output',
      title: 'Mini Output',
      prompt: 'Write 3–4 sentences about social media. Try to naturally use at least two of these ideas: gain attention, harmless, drawback, go too far.',
      estimatedSeconds: 180,
      focusTags: ['Transfer', 'Natural usage'],
      hints: ['Make one clear claim, then explain why it matters.'],
      expectedPatterns: [
        { id: 'gain-attention', label: 'gain attention', regex: '\\bgain(?:ing|ed|s)?\\s+(?:more\\s+)?attention\\b', flags: 'i' },
        { id: 'harmless', label: 'harmless', regex: '\\bharmless\\b', flags: 'i' },
        { id: 'drawback', label: 'drawback', regex: '\\bdrawback(?:s)?\\b', flags: 'i' },
        { id: 'go-too-far', label: 'go too far', regex: '\\bgo(?:es|ing|ne)?\\s+too\\s+far\\b', flags: 'i' },
      ],
    },
  ],
};

export const WORKOUTS_BY_LEVEL: Record<OutputLevel, Workout> = {
  foundation: FOUNDATION_WORKOUT,
  developing: DEVELOPING_WORKOUT,
  intermediate: INTERMEDIATE_WORKOUT,
};

export const OUTPUT_LEVEL_META: Record<OutputLevel, { label: string; description: string }> = {
  foundation: {
    label: 'Foundation',
    description: 'Basic grammar and short, clear sentences.',
  },
  developing: {
    label: 'Developing',
    description: 'Common collocations and longer sentence patterns.',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'More demanding GSAT-style retrieval and transfer.',
  },
};

export function getWorkoutForLevel(level: OutputLevel): Workout {
  return WORKOUTS_BY_LEVEL[level];
}

export const TODAY_WORKOUT = INTERMEDIATE_WORKOUT;
