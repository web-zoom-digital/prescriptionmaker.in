// ── PrescriptionMaker Design System ──────────────────────────────────────────
// Royal Blue + White luxury design tokens
// Central source of truth — import this in every screen

export const Colors = {
  // Primary palette
  primaryBlue: '#155EEF',
  deepBlue: '#1248C8',
  darkNavy: '#102A56',
  brightBlue: '#2675F5',
  lightBlue: '#EAF2FF',
  paleBlue: '#F5F8FF',

  // Neutrals
  white: '#FFFFFF',
  surface: '#F7F9FC',
  border: '#E5EBF4',

  // Text
  textPrimary: '#152238',
  textSecondary: '#63738A',
  textMuted: '#8A97AA',

  // Semantic
  success: '#16865C',
  successLight: '#ECFDF5',
  warning: '#B7791F',
  warningLight: '#FFFBEB',
  error: '#D64545',
  errorLight: '#FFF5F5',

  // Gradients (use sparingly)
  gradientStart: '#155EEF',
  gradientEnd: '#1248C8',
} as const

export const Typography = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  h4: { fontSize: 16, fontWeight: '700' as const },
  bodyLg: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 15 },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.3 },
  labelSm: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.4 },
} as const

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const

export const Shadow = {
  sm: {
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#152238',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 6,
  },
  blue: {
    shadowColor: '#155EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
} as const
