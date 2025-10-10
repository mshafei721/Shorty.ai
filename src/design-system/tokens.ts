import tokensJSON from './tokens.json';

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type SemanticColors = {
  success: string;
  successLight: string;
  successDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
};

export type SurfaceColors = {
  background: string;
  backgroundDark: string;
  card: string;
  cardDark: string;
  overlay: string;
  overlayLight: string;
};

export type TextColors = {
  primary: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  tertiary: string;
  tertiaryDark: string;
  disabled: string;
  disabledDark: string;
  inverse: string;
  inverseDark: string;
  onPrimary: string;
  onAccent: string;
};

export type BorderColors = {
  default: string;
  defaultDark: string;
  subtle: string;
  subtleDark: string;
  focus: string;
  error: string;
};

export type DesignTokens = typeof tokensJSON;

export const tokens: DesignTokens = tokensJSON;

export const colors = tokens.colors;
export const typography = tokens.typography;
export const spacing = tokens.spacing;
export const radius = tokens.radius;
export const elevation = tokens.elevation;
export const motion = tokens.motion;
export const accessibility = tokens.accessibility;
