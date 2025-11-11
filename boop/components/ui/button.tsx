import { Pressable, Text, Animated, View } from "react-native";
import { useRef } from "react";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/themeContext";

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
}: ButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const isPrimary = variant === "primary";
  const backgroundColor = isPrimary 
    ? theme.colors.primary 
    : theme.colors.bg.DEFAULT;
  const textColor = isPrimary 
    ? theme.colors.highlight 
    : theme.colors.text.DEFAULT;
  const borderColor = isPrimary 
    ? "transparent" 
    : theme.colors.border.DEFAULT;
  const opacity = disabled || loading ? 0.5 : 1;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
      className={className}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading }}
      >
        <View
          className="rounded-lg px-4 py-3 items-center justify-center"
          style={{
            backgroundColor,
            borderWidth: isPrimary ? 0 : 1,
            borderColor,
            opacity,
            minHeight: 44,
          }}
        >
          <Text 
            className="text-base font-semibold"
            style={{ color: textColor }}
          >
            {loading ? "Loading..." : title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

