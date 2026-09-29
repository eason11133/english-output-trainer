export type { UIContractV1 } from '../architecture/contracts';
export { eotLearnerTokensV1 } from './tokens';
export const eotUIContractV1={
  learnerShellMaxWidth:430,
  lessonCanvasMaxWidth:390,
  minimumTouchTarget:44,
  supportsKeyboard:true,
  supportsSafeArea:true
} as const;

export * from './capabilities';
export * from './waveOStatus';
export * from './learnerActionSurface';
