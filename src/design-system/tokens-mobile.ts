import tokensMobileJSON from './tokens-mobile-v2.json';

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

export type NeutralScale = ColorScale & {
  0: string;
  850: string;
  1000: string;
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
  recording: string;
};

export type SurfaceColors = {
  background: string;
  backgroundAlt: string;
  card: string;
  cardElevated: string;
  overlay: string;
  overlayBlur: string;
  teleprompter: string;
};

export type TextColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  disabled: string;
  inverse: string;
  onPrimary: string;
  onAccent: string;
  onSuccess: string;
  onError: string;
  onWarning: string;
};

export type BorderColors = {
  default: string;
  subtle: string;
  strong: string;
  focus: string;
  error: string;
  success: string;
};

export type ElevationStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type SpringConfig = {
  damping: number;
  stiffness: number;
  mass: number;
};

export type DesignTokensMobile = typeof tokensMobileJSON;

export const tokens: DesignTokensMobile = tokensMobileJSON;

export const colors = tokens.colors;
export const typography = tokens.typography;
export const spacing = tokens.spacing;
export const radius = tokens.radius;
export const elevation = tokens.elevation;
export const motion = tokens.motion;
export const accessibility = tokens.accessibility;
export const animation = tokens.animation;
export const components = tokens.components;

export default tokens;
