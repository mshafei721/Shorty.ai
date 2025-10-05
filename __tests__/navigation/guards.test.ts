import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInitialRoute } from '../../src/navigation/RootNavigator';

// TC-A1-002: Navigation Guards

describe('Navigation Guards', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('redirects to Onboarding if not completed', async () => {
    const initialRoute = await getInitialRoute();
    expect(initialRoute).toBe('Onboarding');
  });

  it('redirects to Main if onboarding completed', async () => {
    await AsyncStorage.setItem(
      'userProfile',
      JSON.stringify({
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        onboarded: true,
      })
    );

    const initialRoute = await getInitialRoute();
    expect(initialRoute).toBe('Main');
  });

  it('redirects to Onboarding if userProfile exists but onboarded is false', async () => {
    await AsyncStorage.setItem(
      'userProfile',
      JSON.stringify({
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        onboarded: false,
      })
    );

    const initialRoute = await getInitialRoute();
    expect(initialRoute).toBe('Onboarding');
  });

  it('handles corrupted userProfile gracefully', async () => {
    await AsyncStorage.setItem('userProfile', 'invalid-json');

    const initialRoute = await getInitialRoute();
    expect(initialRoute).toBe('Onboarding');
  });

  it('redirects to Onboarding if userProfile is empty object', async () => {
    await AsyncStorage.setItem('userProfile', JSON.stringify({}));

    const initialRoute = await getInitialRoute();
    expect(initialRoute).toBe('Onboarding');
  });
});
