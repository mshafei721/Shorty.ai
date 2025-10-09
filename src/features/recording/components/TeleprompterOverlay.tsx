/**
 * Teleprompter Overlay Component (B3)
 *
 * Displays scrolling script text over camera preview with controls.
 * Features: WPM slider, font size adjustment, auto-scroll, manual scrub.
 *
 * @module features/recording/components/TeleprompterOverlay
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';

export interface TeleprompterOverlayProps {
  scriptText: string;
  isPlaying: boolean;
  wpm?: number;
  fontSize?: number;
  onWpmChange?: (wpm: number) => void;
  onFontSizeChange?: (size: number) => void;
  visible?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_WPM = 60;
const MAX_WPM = 220;
const DEFAULT_WPM = 140;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const DEFAULT_FONT_SIZE = 18;

export function TeleprompterOverlay({
  scriptText,
  isPlaying,
  wpm = DEFAULT_WPM,
  fontSize = DEFAULT_FONT_SIZE,
  onWpmChange,
  onFontSizeChange,
  visible = true,
}: TeleprompterOverlayProps) {
  const [showControls, setShowControls] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Calculate scroll speed based on WPM
  // Average word length ~5 chars, pixels per word based on font size
  const wordsInScript = scriptText.split(/\s+/).length;
  const pixelsPerWord = fontSize * 3; // Rough estimate
  const totalPixels = wordsInScript * pixelsPerWord;
  const durationMs = (wordsInScript / wpm) * 60 * 1000;

  useEffect(() => {
    if (isPlaying && visible) {
      startScrolling();
    } else {
      stopScrolling();
    }

    return () => {
      stopScrolling();
    };
  }, [isPlaying, visible, wpm, fontSize]);

  const startScrolling = () => {
    stopScrolling(); // Clear any existing animation

    // Animate the scroll position
    animationRef.current = Animated.timing(scrollPosition, {
      toValue: totalPixels,
      duration: durationMs,
      useNativeDriver: false, // Cannot use native driver with ScrollView scrollTo
    });

    // Listen to animation and update ScrollView
    scrollPosition.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({
        y: value,
        animated: false,
      });
    });

    animationRef.current.start();
  };

  const stopScrolling = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    // Clean up all listeners
    scrollPosition.removeAllListeners();
  };

  const handleRewind = () => {
    // Stop current animation and rewind by restarting from earlier position
    stopScrolling();
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      });
    }
    scrollPosition.setValue(0);
  };

  const handleWpmDecrease = () => {
    const newWpm = Math.max(MIN_WPM, wpm - 10);
    onWpmChange?.(newWpm);
  };

  const handleWpmIncrease = () => {
    const newWpm = Math.min(MAX_WPM, wpm + 10);
    onWpmChange?.(newWpm);
  };

  const handleFontDecrease = () => {
    const newSize = Math.max(MIN_FONT_SIZE, fontSize - 2);
    onFontSizeChange?.(newSize);
  };

  const handleFontIncrease = () => {
    const newSize = Math.min(MAX_FONT_SIZE, fontSize + 2);
    onFontSizeChange?.(newSize);
  };

  if (!visible || !scriptText) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Script Display */}
      <View style={styles.scriptContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isPlaying}
        >
          <View style={styles.scriptContent}>
            <Text style={[styles.scriptText, { fontSize }]}>{scriptText}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Speed</Text>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleWpmDecrease}
              disabled={wpm <= MIN_WPM}
            >
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.controlValue}>{wpm} WPM</Text>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleWpmIncrease}
              disabled={wpm >= MAX_WPM}
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Size</Text>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleFontDecrease}
              disabled={fontSize <= MIN_FONT_SIZE}
            >
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.controlValue}>{fontSize}pt</Text>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleFontIncrease}
              disabled={fontSize >= MAX_FONT_SIZE}
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.rewindButton} onPress={handleRewind}>
            <Text style={styles.rewindButtonText}>⏪ Rewind 5s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hideControlsButton}
            onPress={() => setShowControls(false)}
          >
            <Text style={styles.hideControlsButtonText}>Hide Controls</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show Controls Button (when hidden) */}
      {!showControls && (
        <TouchableOpacity
          style={styles.showControlsButton}
          onPress={() => setShowControls(true)}
        >
          <Text style={styles.showControlsButtonText}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
  },
  scriptContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  scrollView: {
    flex: 1,
  },
  scriptContent: {
    paddingVertical: SCREEN_HEIGHT / 3,
  },
  scriptText: {
    color: '#FFFFFF',
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  controlValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'center',
  },
  rewindButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  rewindButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hideControlsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  hideControlsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  showControlsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showControlsButtonText: {
    fontSize: 20,
  },
});
