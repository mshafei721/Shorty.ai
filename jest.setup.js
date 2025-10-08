import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '0.2.0',
      name: 'Shorty.ai',
      extra: {
        environment: 'test',
      },
    },
  },
  Constants: {
    expoConfig: {
      version: '0.2.0',
      name: 'Shorty.ai',
      extra: {
        environment: 'test',
      },
    },
  },
}));

jest.mock('expo-linking', () => ({
  __esModule: true,
  createURL: jest.fn((path) => `exp://localhost:8081/${path}`),
  default: {
    createURL: jest.fn((path) => `exp://localhost:8081/${path}`),
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  __esModule: true,
  documentDirectory: 'file:///mock/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  getFreeDiskStorageAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  __esModule: true,
  documentDirectory: 'file:///mock/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  getFreeDiskStorageAsync: jest.fn(() => Promise.resolve(5000000000)), // 5GB
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    Camera: {
      getCameraPermissionsAsync: jest.fn(),
      requestCameraPermissionsAsync: jest.fn(),
    },
    CameraView: React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref, testID: 'camera-view' }, props.children);
    }),
    CameraType: {
      back: 'back',
      front: 'front',
    },
    FlashMode: {
      on: 'on',
      off: 'off',
      auto: 'auto',
    },
    PermissionStatus: {
      GRANTED: 'granted',
      DENIED: 'denied',
      UNDETERMINED: 'undetermined',
    },
  };
});

jest.mock('expo-audio', () => ({
  __esModule: true,
  requestRecordingPermissionsAsync: jest.fn(),
  getRecordingPermissionsAsync: jest.fn(),
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  const mockPlayer = {
    playing: false,
    currentTime: 0,
    loop: false,
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
  };

  return {
    __esModule: true,
    VideoView: React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref, testID: 'video-view' }, props.children);
    }),
    useVideoPlayer: jest.fn((source, setup) => {
      if (setup) setup(mockPlayer);
      return mockPlayer;
    }),
  };
});
