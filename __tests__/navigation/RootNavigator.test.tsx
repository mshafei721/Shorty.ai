import React from 'react';
import { render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootNavigator, getInitialRoute } from '../../src/navigation/RootNavigator';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  CommonActions: {
    reset: jest.fn(),
  },
  useNavigation: () => ({
    dispatch: jest.fn(),
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

describe('RootNavigator', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('renders without crashing', () => {
    render(<RootNavigator />);
    expect(true).toBe(true);
  });
});

describe('getInitialRoute', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns Onboarding if userProfile is null', async () => {
    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('returns Onboarding if userProfile.onboarded is false', async () => {
    await AsyncStorage.setItem(
      'userProfile',
      JSON.stringify({ niche: 'Healthcare', onboarded: false })
    );
    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('returns Main if userProfile.onboarded is true', async () => {
    await AsyncStorage.setItem(
      'userProfile',
      JSON.stringify({ niche: 'Healthcare', onboarded: true })
    );
    const route = await getInitialRoute();
    expect(route).toBe('Main');
  });

  it('returns Onboarding if userProfile is corrupted JSON', async () => {
    await AsyncStorage.setItem('userProfile', 'invalid-json');
    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('returns Onboarding if userProfile is empty object', async () => {
    await AsyncStorage.setItem('userProfile', JSON.stringify({}));
    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });

  it('returns Onboarding on AsyncStorage error', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('Storage error'));

    const route = await getInitialRoute();
    expect(route).toBe('Onboarding');
  });
});
