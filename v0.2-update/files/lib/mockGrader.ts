import { DetectedError, Exercise, GradeResult } from '../types/domain';

interface ErrorRule {
  code: string;
  title: string;
  test: RegExp;
  explanation: string;
  correction?: string;
  severity: 'low' | 'medium' | 'high';
}

const COMMON_ERROR_RULES: ErrorRule[] = [
  {
    code: 'G001_PLURAL_AFTER_MANY',
    title: 'Plural noun after “many”',
    test: /\bmany\s+(?:teenager|student|person|child)\b/i,
    explanation: '“many” must be followed by a plural countable noun.',
    correction: 'many teenagers / many students',
    severity: 'high',
  },
  {
    code: 'G002_WANT_TO_INFINITIVE',
    title: 'Infinitive after “want”',
    test: /\bwant(?:s|ed)?\s+(?!to\b)(?:win|gain|get|learn|improve|be|do|use|study|help)\b/i,
    explanation: 'Use “want to + base verb”.',
    correction: 'want to + verb',
    severity: 'high',
  },
  {
    code: 'G003_MODAL_BASE_VERB',
    title: 'Modal + base verb',
    test: /\b(?:might|may|can|could|should|would)\s+be\s+(?:choose|go|use|do|make|help|study)\b/i,
    explanation: 'A modal verb is normally followed directly by the base form of the main verb.',
    correction: 'might choose / may go / can use',
    severity: 'high',
  },
  {
    code: 'G004_PREPOSITION_CLOSE_TO',
    title: 'Preposition after “close”',
    test: /\bclose\s+with\s+(?:nature|people|someone|something)\b/i,
    explanation: 'For physical or emotional proximity, use “close to”.',
    correction: 'close to nature',
    severity: 'medium',
  },
  {
    code: 'G005_MISSING_BE_ATTACHED',
    title: 'Missing verb before “attached”',
    test: /\b(?:we|they|you|i)\s+(?:too\s+)?attached\s+to\b/i,
    explanation: '“attached” needs a linking verb here, such as “are/become”.',
    correction: 'we are too attached to / we become too attached to',
    severity: 'high',
  },
  {
    code: 'C001_GAIN_ATTENTION',
    title: 'Collocation: gain attention',
    test: /\b(?:win|earn)\s+(?:more\s+)?attention\b/i,
    explanation: 'In this context, “gain attention” is the more natural target collocation.',
    correction: 'gain attention',
    severity: 'medium',
  },
];

export function gradeAttempt(exercise: Exercise, answer: string, hintsUsed = 0): GradeResult {
  const normalized = answer.trim();
  const errors: DetectedError[] = [];

  for (const rule of COMMON_ERROR_RULES) {
    if (rule.test.test(normalized)) {
      errors.push({
        code: rule.code,
        title: rule.title,
        explanation: rule.explanation,
        correction: rule.correction,
        severity: rule.severity,
      });
    }
  }

  const matched = exercise.expectedPatterns.filter((pattern) => {
    const regex = new RegExp(pattern.regex, pattern.flags ?? '');
    return regex.test(normalized);
  });

  const coverage =
    exercise.expectedPatterns.length === 0
      ? normalized.length > 0
        ? 1
        : 0
      : matched.length / exercise.expectedPatterns.length;

  const activatedItems = matched.map((item) => item.label);
  const feedback: string[] = [];
  const highErrors = errors.filter((error) => error.severity === 'high').length;
  const passed = normalized.length >= 3 && coverage >= 0.5 && highErrors === 0;

  if (normalized.length < 3) {
    feedback.push('Write a complete answer before moving on.');
  } else if (passed && hintsUsed === 0) {
    feedback.push('Target language was retrieved independently. This demo grader does not yet guarantee full sentence correctness.');
  } else if (passed) {
    feedback.push('Target language was retrieved with support. Try the same item later without hints.');
  } else {
    if (activatedItems.length > 0) {
      feedback.push(`Retrieved: ${activatedItems.join(', ')}.`);
    }
    if (coverage < 0.5) {
      feedback.push('Some target language was not retrieved. Review the reference after checking the hints you used.');
    }
  }

  return {
    passed,
    coverage,
    errors,
    activatedItems,
    feedback,
  };
}
