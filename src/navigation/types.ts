import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type OnboardingStackParamList = {
  Splash: undefined;
  NicheSelection: undefined;
  SubNicheConfirmation: { niche: string };
};

export type MainStackParamList = {
  ProjectsList: undefined;
  ProjectDashboard: { projectId: string };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type SplashScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'Splash'>;
export type NicheSelectionScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'NicheSelection'>;
export type SubNicheConfirmationScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'SubNicheConfirmation'>;
export type ProjectsListScreenProps = NativeStackScreenProps<MainStackParamList, 'ProjectsList'>;
export type ProjectDashboardScreenProps = NativeStackScreenProps<MainStackParamList, 'ProjectDashboard'>;
