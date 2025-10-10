import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  WithSpringConfig,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { tokens } from '@/design-system/tokens-mobile';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type BottomSheetSize = 'small' | 'medium' | 'full';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: BottomSheetSize;
  showHandle?: boolean;
  testID?: string;
}

const springConfig: WithSpringConfig = {
  damping: 20,
  stiffness: 200,
  mass: 1,
};

const getSizeHeight = (size: BottomSheetSize): number => {
  switch (size) {
    case 'small':
      return SCREEN_HEIGHT * 0.35;
    case 'medium':
      return SCREEN_HEIGHT * 0.55;
    case 'full':
      return SCREEN_HEIGHT * 0.9;
    default:
      return SCREEN_HEIGHT * 0.55;
  }
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  size = 'medium',
  showHandle = true,
  testID,
}) => {
  const sheetHeight = getSizeHeight(size);
  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfig);
      backdropOpacity.value = withSpring(1, springConfig);
    } else {
      translateY.value = withSpring(sheetHeight, springConfig);
      backdropOpacity.value = withSpring(0, springConfig);
    }
  }, [visible, sheetHeight]);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const closeSheet = () => {
    translateY.value = withSpring(sheetHeight, springConfig, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withSpring(0, springConfig);
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const threshold = sheetHeight * 0.3;
      if (event.translationY > threshold || event.velocityY > 500) {
        translateY.value = withSpring(sheetHeight, springConfig, () => {
          runOnJS(onClose)();
        });
        backdropOpacity.value = withSpring(0, springConfig);
      } else {
        translateY.value = withSpring(0, springConfig);
      }
    });

  const sheetStyle: ViewStyle = {
    height: sheetHeight,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      <View style={styles.container} testID={testID}>
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View
            style={[styles.backdrop, animatedBackdropStyle]}
          />
        </TouchableWithoutFeedback>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.sheet, sheetStyle, animatedSheetStyle]}
            accessible
            accessibilityRole="none"
            accessibilityLabel="Bottom sheet"
          >
            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.colors.surface.overlayBlur,
  },

  sheet: {
    backgroundColor: tokens.colors.surface.card,
    borderTopLeftRadius: tokens.components.bottomSheet.borderRadiusTop,
    borderTopRightRadius: tokens.components.bottomSheet.borderRadiusTop,
    ...tokens.elevation.xl,
  },

  handleContainer: {
    alignItems: 'center',
    paddingTop: tokens.components.bottomSheet.handleTopMargin,
  },

  handle: {
    width: tokens.components.bottomSheet.handleWidth,
    height: tokens.components.bottomSheet.handleHeight,
    backgroundColor: tokens.colors.border.strong,
    borderRadius: tokens.radius.xs,
  },

  content: {
    flex: 1,
    padding: tokens.spacing.s4,
  },
});

export default BottomSheet;
