import { Pressable, Text, View, Animated } from "react-native";
import { useRef, useEffect, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { DeviceService } from "@/lib/deviceService";
import { useTheme } from "@/lib/themeContext";

export type BoopButtonProps = {
  onLongPress?: () => void;
  onError?: (message: string) => void;
};

export default function BoopButton({ onLongPress, onError }: BoopButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Start breathing animation on mount
  useEffect(() => {
    const startBreathing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Synchronized glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startBreathing();
  }, [breathingAnim, glowAnim]);

  const handleBoop = async () => {
    // Haptic feedback for press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
        // Subtle inline confirmation: fade in, delay, fade out
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
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
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
            { scale: Animated.multiply(scaleAnim, breathingAnim) },
            { rotate: rotation },
          ],
          shadowOpacity: Animated.multiply(shadowAnim, glowAnim),
          shadowColor: theme.colors.primary,
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

      {/* Subtle inline confirmation */}
      <Animated.View
        style={{
          marginTop: 12,
          opacity: successOpacity,
          transform: [
            {
              translateY: successOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 0],
              }),
            },
          ],
        }}
      >
        <Text className="text-sm text-text-muted">Booped!</Text>
      </Animated.View>
    </View>
  );
}
