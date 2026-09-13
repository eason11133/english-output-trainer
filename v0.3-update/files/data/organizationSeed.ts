export type WorkspaceKind = 'teacher' | 'cram_school' | 'school';

export interface LearnerAbilitySnapshot {
  id: string;
  name: string;
  outputLevel: 'Foundation' | 'Developing' | 'Intermediate';
  grammar: number;
  activeVocabulary: number;
  retrieval: number;
  independentRate: number;
  trackedErrors: number;
  lastPractice: string;
  risk: 'on_track' | 'watch' | 'high';
}

export interface OrganizationWorkspaceDemo {
  kind: WorkspaceKind;
  label: string;
  seatLimit: number;
  activeSeats: number;
  className: string;
  learners: LearnerAbilitySnapshot[];
}

const LEARNERS: LearnerAbilitySnapshot[] = [
  { id: 'a', name: 'Learner A', outputLevel: 'Intermediate', grammar: 72, activeVocabulary: 61, retrieval: 68, independentRate: 64, trackedErrors: 4, lastPractice: 'Today', risk: 'on_track' },
  { id: 'b', name: 'Learner B', outputLevel: 'Developing', grammar: 55, activeVocabulary: 43, retrieval: 39, independentRate: 41, trackedErrors: 8, lastPractice: 'Today', risk: 'watch' },
  { id: 'c', name: 'Learner C', outputLevel: 'Foundation', grammar: 38, activeVocabulary: 31, retrieval: 27, independentRate: 23, trackedErrors: 11, lastPractice: '2 days ago', risk: 'high' },
  { id: 'd', name: 'Learner D', outputLevel: 'Developing', grammar: 64, activeVocabulary: 52, retrieval: 57, independentRate: 53, trackedErrors: 6, lastPractice: 'Yesterday', risk: 'on_track' },
  { id: 'e', name: 'Learner E', outputLevel: 'Intermediate', grammar: 76, activeVocabulary: 70, retrieval: 73, independentRate: 71, trackedErrors: 3, lastPractice: 'Today', risk: 'on_track' },
  { id: 'f', name: 'Learner F', outputLevel: 'Developing', grammar: 49, activeVocabulary: 46, retrieval: 35, independentRate: 37, trackedErrors: 9, lastPractice: '3 days ago', risk: 'watch' },
];

export const WORKSPACE_DEMOS: Record<WorkspaceKind, OrganizationWorkspaceDemo> = {
  teacher: { kind: 'teacher', label: 'Independent teacher', seatLimit: 30, activeSeats: 6, className: 'GSAT Output Group', learners: LEARNERS },
  cram_school: { kind: 'cram_school', label: 'Cram school', seatLimit: 100, activeSeats: 6, className: 'Grade 12 · Class A', learners: LEARNERS },
  school: { kind: 'school', label: 'School', seatLimit: 500, activeSeats: 6, className: 'English Output Pilot', learners: LEARNERS },
};
