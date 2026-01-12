import {
  Pressable,
  Text,
  View,
  Animated,
  Easing,
  AppState,
} from "react-native";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { DeviceService } from "@/lib/deviceService";
import { useTheme } from "@/lib/themeContext";

// Motion constants
const MOTION_CONSTANTS = {
  PRESS_SCALE: 0.92,
  PRESS_DURATION: 80,
  RELEASE_SPRING_TENSION: 250,
  RELEASE_SPRING_FRICTION: 7,
  IDLE_SCALE_MAX: 1.02,
  IDLE_CYCLE_DURATION: 4000,
  IDLE_GLOW_MIN: 0.25,
  IDLE_GLOW_MAX: 0.35,
  IDLE_RESUME_DELAY: 500,
};

export type BoopButtonProps = {
  onLongPress?: () => void;
  onError?: (message: string) => void;
  isPaired?: boolean;
  rateLimitError?: string | null;
};

export default function BoopButton({
  onLongPress,
  onError,
  isPaired = false,
  rateLimitError,
}: BoopButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const breathingAnimationRef = useRef<Animated.CompositeAnimation | null>(
    null
  );
  const glowAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const readyGlowAnim = useRef(new Animated.Value(0.3)).current;
  const rateLimitPulseAnim = useRef(new Animated.Value(1)).current;
  const rateLimitPulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isIdlePaused, setIsIdlePaused] = useState(false);
  const idleResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Idle animation with pause/resume capability
  const startIdleAnimation = useCallback(() => {
    // Stop any existing animations
    if (breathingAnimationRef.current) {
      breathingAnimationRef.current.stop();
    }
    if (glowAnimationRef.current) {
      glowAnimationRef.current.stop();
    }

    // Subtle breath animation - 4s cycle, scale 1.0 → 1.02
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: MOTION_CONSTANTS.IDLE_SCALE_MAX,
          duration: MOTION_CONSTANTS.IDLE_CYCLE_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1.0,
          duration: MOTION_CONSTANTS.IDLE_CYCLE_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathingAnimationRef.current = breathingAnimation;
    breathingAnimation.start();

    // Subtle glow animation - 0.25 → 0.35
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: MOTION_CONSTANTS.IDLE_GLOW_MAX,
          duration: MOTION_CONSTANTS.IDLE_CYCLE_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: MOTION_CONSTANTS.IDLE_GLOW_MIN,
          duration: MOTION_CONSTANTS.IDLE_CYCLE_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimationRef.current = glowAnimation;
    glowAnimation.start();
  }, [breathingAnim, glowAnim]);

  const pauseIdleAnimation = useCallback(() => {
    if (breathingAnimationRef.current) {
      breathingAnimationRef.current.stop();
    }
    if (glowAnimationRef.current) {
      glowAnimationRef.current.stop();
    }
    setIsIdlePaused(true);
  }, []);

  const resumeIdleAnimation = useCallback(() => {
    // Clear any pending resume timeout
    if (idleResumeTimeoutRef.current) {
      clearTimeout(idleResumeTimeoutRef.current);
      idleResumeTimeoutRef.current = null;
    }

    breathingAnim.setValue(1.0); // Reset to base
    glowAnim.setValue(MOTION_CONSTANTS.IDLE_GLOW_MIN); // Reset to base
    setIsIdlePaused(false);
    // Start animation after state update
    setTimeout(() => {
      startIdleAnimation();
    }, 0);
  }, [breathingAnim, glowAnim, startIdleAnimation]);

  // Start idle animation on mount and when app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && !isIdlePaused) {
        startIdleAnimation();
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        pauseIdleAnimation();
      }
    });

    if (!isIdlePaused) {
      startIdleAnimation();
    }

    // Cleanup on unmount
    return () => {
      subscription.remove();
      if (breathingAnimationRef.current) {
        breathingAnimationRef.current.stop();
        breathingAnimationRef.current = null;
      }
      if (glowAnimationRef.current) {
        glowAnimationRef.current.stop();
        glowAnimationRef.current = null;
      }
      if (idleResumeTimeoutRef.current) {
        clearTimeout(idleResumeTimeoutRef.current);
        idleResumeTimeoutRef.current = null;
      }
    };
  }, [isIdlePaused, startIdleAnimation, pauseIdleAnimation]);

  // Enhanced glow when paired and ready
  useEffect(() => {
    if (isPaired && !rateLimitError) {
      // Increase base glow when ready
      Animated.timing(readyGlowAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(readyGlowAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPaired, rateLimitError, readyGlowAnim]);

  // Subtle pulse animation when rate limited
  useEffect(() => {
    if (rateLimitError) {
      // Stop any existing pulse
      if (rateLimitPulseRef.current) {
        rateLimitPulseRef.current.stop();
      }

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rateLimitPulseAnim, {
            toValue: 0.95,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rateLimitPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      rateLimitPulseRef.current = pulseAnimation;
      pulseAnimation.start();
    } else {
      // Stop pulse and reset
      if (rateLimitPulseRef.current) {
        rateLimitPulseRef.current.stop();
        rateLimitPulseRef.current = null;
      }
      rateLimitPulseAnim.setValue(1);
    }

    return () => {
      if (rateLimitPulseRef.current) {
        rateLimitPulseRef.current.stop();
        rateLimitPulseRef.current = null;
      }
    };
  }, [rateLimitError, rateLimitPulseAnim]);

  const handleBoop = async () => {
    // Ripple effect
    Animated.sequence([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Success animation - color change
    Animated.sequence([
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    try {
      const result = await DeviceService.sendBoop();
      if (result.success) {
        // Success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Enhanced success animation: scale bounce + text animation
        // First, add a subtle scale bounce to the button
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            tension: 200,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 200,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();

        // Subtle inline confirmation: fade in with upward motion, delay, fade out
        Animated.sequence([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(900),
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Show error message (rate limit or other error)
        // Rate limit errors will be handled by parent component for better UX
        onError?.(result.error || "Failed to send boop");
      }
    } catch (error) {
      onError?.("Failed to send boop");
      console.error(error);
    }
  };

  const handleLongPress = () => {
    // Haptic feedback to indicate settings access
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Rotation animation for long press
    Animated.sequence([
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onLongPress?.();
  };

  const handlePressIn = () => {
    // Immediate feedback - no spring delay
    // Immediate feedback - native driver animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: MOTION_CONSTANTS.PRESS_SCALE,
        duration: MOTION_CONSTANTS.PRESS_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.15,
        duration: MOTION_CONSTANTS.PRESS_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic immediately
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Pause idle animation
    pauseIdleAnimation();
  };

  const handlePressOut = () => {
    // Satisfying spring back
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        tension: MOTION_CONSTANTS.RELEASE_SPRING_TENSION,
        friction: MOTION_CONSTANTS.RELEASE_SPRING_FRICTION,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Resume idle animation after delay
    if (idleResumeTimeoutRef.current) {
      clearTimeout(idleResumeTimeoutRef.current);
    }
    idleResumeTimeoutRef.current = setTimeout(() => {
      resumeIdleAnimation();
      idleResumeTimeoutRef.current = null;
    }, MOTION_CONSTANTS.IDLE_RESUME_DELAY) as unknown as NodeJS.Timeout;
  };

  // Use theme colors dynamically - recreate interpolation when theme changes
  const backgroundColor = useMemo(
    () =>
      colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.primary, theme.colors.success],
      }),
    [theme.colors.primary, theme.colors.success, colorAnim]
  );

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "15deg"],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View className="items-center">
      <Animated.View
        style={{
          transform: [
            {
              scale: Animated.multiply(
                scaleAnim,
                Animated.multiply(breathingAnim, rateLimitPulseAnim)
              ),
            },
            { rotate: rotation },
          ],
          shadowOpacity: Animated.multiply(
            shadowAnim,
            Animated.multiply(glowAnim, readyGlowAnim)
          ),
          shadowColor: rateLimitError
            ? theme.colors.danger
            : theme.colors.primary,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={handleBoop}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          delayLongPress={500}
          accessibilityRole="button"
          accessibilityLabel="Boop"
          accessibilityHint="Long press to open settings"
        >
          <Animated.View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: backgroundColor,
              overflow: "hidden",
            }}
          >
            {/* Gradient Overlay for depth */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 80,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            />

            {/* Ripple Effect */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 80,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              }}
            />

            {/* Content */}
            <View className="flex-1 items-center justify-center">
              <Text className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                Boop!
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Enhanced inline confirmation with upward motion */}
      <Animated.View
        style={{
          marginTop: 24, // Increased from 12 to 24 for better spacing
          opacity: successOpacity,
          transform: [
            {
              translateY: successOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [8, -4],
              }),
            },
            {
              scale: successOpacity.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 1.1, 1],
              }),
            },
          ],
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: theme.colors.success }}
        >
          Booped!
        </Text>
      </Animated.View>
    </View>
  );
}
