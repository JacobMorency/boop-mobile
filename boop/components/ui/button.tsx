import { Pressable, Text, Animated, View } from "react-native";
import { useRef } from "react";
import * as Haptics from "expo-haptics";

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
  const bgColor = isPrimary ? "bg-primary" : "bg-bg";
  const textColor = isPrimary ? "text-white" : "text-text";
  const borderColor = isPrimary ? "" : "border border-border";
  const opacity = disabled || loading ? "opacity-50" : "";

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
          className={`rounded-lg px-4 py-3 ${bgColor} ${borderColor} ${opacity} items-center justify-center min-h-[44px]`}
        >
          <Text className={`text-base font-semibold ${textColor}`}>
            {loading ? "Loading..." : title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

