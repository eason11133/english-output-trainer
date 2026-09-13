import { eotLearnerTokensV1 as t } from '../src/ui/tokens';
export const theme = {
  colors: {
    background: t.colors.background,
    surface: t.colors.paper,
    surfaceAlt: t.colors.canvas,
    surfaceElevated: t.colors.woodWash,
    text: t.colors.ink,
    textMuted: t.colors.muted,
    primary: t.colors.deepWood,
    primaryText: t.colors.paper,
    danger: t.colors.danger,
    warning: t.colors.focus,
    border: t.colors.line,
    success: t.colors.success,
    info: t.colors.midWood,
    module: {
      vocabulary: t.colors.midWood, grammar: t.colors.midWood, translation: t.colors.midWood, reading: t.colors.midWood, writing: t.colors.midWood, sentence: t.colors.midWood,
    },
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    display: 34,
    title: 28,
    section: 20,
    body: 15,
    caption: 12,
  },
  buttonHeight: { primary: 54, compact: 44 },
  contentWidth: { reading: 720, standard: 960, wide: 1120 },
};
