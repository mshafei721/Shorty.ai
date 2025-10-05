import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder screens
import { SplashScreen } from '../screens/SplashScreen';
import { NicheSelectionScreen } from '../screens/NicheSelectionScreen';
import { ProjectsListScreen } from '../screens/ProjectsListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Navigation types
export type OnboardingStackParamList = {
  Splash: undefined;
  NicheSelection: undefined;
};

export type MainTabParamList = {
  Projects: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const OnboardingStack = createStackNavigator<OnboardingStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

/**
 * Onboarding flow: Splash → Niche Selection
 */
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Splash" component={SplashScreen} />
      <OnboardingStack.Screen
        name="NicheSelection"
        component={NicheSelectionScreen}
      />
    </OnboardingStack.Navigator>
  );
}

/**
 * Main app tabs: Projects, Settings
 */
function MainNavigator() {
  return (
    <MainTab.Navigator>
      <MainTab.Screen name="Projects" component={ProjectsListScreen} />
      <MainTab.Screen name="Settings" component={SettingsScreen} />
    </MainTab.Navigator>
  );
}

/**
 * Root navigator: Onboarding → Main
 */
export function RootNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Onboarding');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          if (profile.onboarded) {
            setInitialRoute('Main');
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsReady(true);
      }
    }

    checkOnboardingStatus();
  }, []);

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Get initial route based on onboarding status
 * Used for testing
 */
export async function getInitialRoute(): Promise<keyof RootStackParamList> {
  try {
    const userProfile = await AsyncStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      if (profile.onboarded) {
        return 'Main';
      }
    }
  } catch (error) {
    console.error('Failed to get initial route:', error);
  }
  return 'Onboarding';
}
