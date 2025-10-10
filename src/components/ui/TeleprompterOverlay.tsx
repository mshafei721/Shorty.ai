import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { tokens } from '@/design-system/tokens-mobile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TeleprompterFontSize = 'small' | 'medium' | 'large';

interface TeleprompterSentence {
  text: string;
  index: number;
}

export interface TeleprompterOverlayProps {
  script: string;
  isScrolling: boolean;
  wordsPerMinute?: number;
  fontSize?: TeleprompterFontSize;
  onSentenceChange?: (index: number) => void;
  testID?: string;
}

const FONT_SIZES = {
  small: 16,
  medium: 20,
  large: 24,
};

const parseSentences = (script: string): TeleprompterSentence[] => {
  const sentences = script
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.map((text, index) => ({ text, index }));
};

const calculateScrollDuration = (
  scriptLength: number,
  wpm: number
): number => {
  const words = scriptLength / 5;
  const minutes = words / wpm;
  return minutes * 60 * 1000;
};

export const TeleprompterOverlay: React.FC<TeleprompterOverlayProps> = ({
  script,
  isScrolling,
  wordsPerMinute = 140,
  fontSize = 'medium',
  onSentenceChange,
  testID,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const sentences = parseSentences(script);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (isScrolling && scrollViewRef.current) {
      const duration = calculateScrollDuration(script.length, wordsPerMinute);
      const totalHeight = sentences.length * 100;

      const timer = setInterval(() => {
        scrollY.value = withTiming(scrollY.value + 2, {
          duration: 100,
        });

        scrollViewRef.current?.scrollTo({
          y: scrollY.value,
          animated: true,
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isScrolling, script, wordsPerMinute]);

  const getSentenceOpacity = (index: number): number => {
    const opacities = tokens.animation.teleprompter.sentenceOpacity;
    if (index === currentSentenceIndex) return opacities.current;
    if (index === currentSentenceIndex + 1) return opacities.upcoming;
    if (index < currentSentenceIndex) return opacities.past;
    return 0.3;
  };

  const handleSentencePress = (index: number) => {
    setCurrentSentenceIndex(index);
    onSentenceChange?.(index);
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.overlay}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isScrolling}
        >
          <View style={styles.content}>
            {sentences.map((sentence) => {
              const opacity = getSentenceOpacity(sentence.index);
              return (
                <Pressable
                  key={sentence.index}
                  onPress={() => handleSentencePress(sentence.index)}
                >
                  <Animated.Text
                    style={[
                      styles.sentence,
                      {
                        fontSize: FONT_SIZES[fontSize],
                        opacity,
                        fontWeight:
                          sentence.index === currentSentenceIndex
                            ? tokens.typography.fontWeight.semibold
                            : tokens.typography.fontWeight.regular,
                      },
                    ]}
                  >
                    {sentence.text}.
                  </Animated.Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },

  overlay: {
    width: SCREEN_WIDTH * 0.6,
    maxHeight: '50%',
    backgroundColor: tokens.colors.surface.teleprompter,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.s5,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingVertical: tokens.spacing.s4,
  },

  sentence: {
    color: tokens.colors.text.primary,
    lineHeight: 32,
    marginBottom: tokens.spacing.s3,
    textAlign: 'center',
  },
});

export default TeleprompterOverlay;
