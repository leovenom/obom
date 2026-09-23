/**
 * OBOM Wellness Design Tokens
 * @see docs/design-system.md
 */

export const colors = {
  background: '#FAF6F0',
  surface: '#FFFFFF',
  foreground: '#2C3E50',
  muted: '#7A8494',
  placeholder: '#B8BFC9',
  coral: '#FF6B5B',
  coralLight: '#FF8A7D',
  coralMuted: '#FFE8E4',
  blue: '#0066FF',
  blueLight: '#3D8BFF',
  blueMuted: '#E6F2FF',
  success: '#34C759',
  danger: '#FF4757',
  camera: '#1A1A2E',
} as const;

export const shadows = {
  card: '0 4px 24px rgba(44, 62, 80, 0.06)',
  cardHover: '0 8px 32px rgba(44, 62, 80, 0.1)',
  soft: '0 2px 12px rgba(44, 62, 80, 0.05)',
} as const;

export const radius = {
  sm: '12px',
  md: '18px',
  lg: '24px',
  xl: '28px',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans), Inter, -apple-system, sans-serif',
    mono: 'var(--font-jetbrains), monospace',
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
  },
} as const;

export const cssVariables = {
  '--color-bg': colors.background,
  '--color-surface': colors.surface,
  '--color-fg': colors.foreground,
  '--color-coral': colors.coral,
  '--color-blue': colors.blue,
  '--shadow-card': shadows.card,
  '--radius-lg': radius.lg,
} as const;
