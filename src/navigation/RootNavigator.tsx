import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../screens/SplashScreen';
import NicheSelectionScreen from '../screens/NicheSelectionScreen';
import ProjectsListScreen from '../screens/ProjectsListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecordScreen from '../screens/RecordScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Record: undefined;
};

export type OnboardingStackParamList = {
  Splash: undefined;
  NicheSelection: undefined;
};

export type MainTabsParamList = {
  ProjectsList: undefined;
  Settings: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const OnboardingStack = createStackNavigator<OnboardingStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabsParamList>();

const linking = {
  prefixes: [Linking.createURL('/'), 'shortyai://'],
  config: {
    screens: {
      Onboarding: {
        path: 'onboarding',
        screens: {
          Splash: 'splash',
          NicheSelection: 'niche-selection',
        },
      },
      Main: {
        path: 'main',
        screens: {
          ProjectsList: 'projects',
          Settings: 'settings',
        },
      },
      Record: 'record',
    },
  },
};

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Splash" component={SplashScreen} />
      <OnboardingStack.Screen name="NicheSelection" component={NicheSelectionScreen} />
    </OnboardingStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <MainTabs.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📁</Text>
          ),
        }}
      />
      <MainTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </MainTabs.Navigator>
  );
}

export function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const route = await getInitialRoute();
        setInitialRoute(route);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsReady(true);
      }
    }

    checkOnboardingStatus();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen
          name="Record"
          component={RecordScreen}
          options={{
            headerShown: true,
            title: 'Record Video',
            presentation: 'modal'
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export async function getInitialRoute(): Promise<keyof RootStackParamList> {
  try {
    const userProfileData = await AsyncStorage.getItem('userProfile');

    if (userProfileData) {
      const profile = JSON.parse(userProfileData);
      if (profile.onboarded === true) {
        return 'Main';
      }
    }
  } catch (error) {
    console.error('Failed to get initial route:', error);
  }
  return 'Onboarding';
}
