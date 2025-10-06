import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

const linking = {
  prefixes: ['shortyai://', 'https://shortyai.app'],
  config: {
    screens: {
      Main: {
        screens: {
          ProjectDashboard: 'project/:projectId',
          ProjectsList: 'projects',
        },
      },
      Onboarding: {
        screens: {
          Splash: 'splash',
          NicheSelection: 'niche',
          SubNicheConfirmation: 'niche/:niche',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
