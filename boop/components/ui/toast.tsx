import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useTheme } from "@/lib/themeContext";

export type ToastProps = {
  message: string;
  type?: "error" | "success" | "info";
  visible: boolean;
  onHide: () => void;
  duration?: number;
};

export default function Toast({
  message,
  type = "info",
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -100,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "error":
        return theme.colors.danger;
      case "success":
        return theme.colors.success;
      case "info":
      default:
        return theme.colors.text.DEFAULT;
    }
  };

  // Position toast below connection indicator (48px top + ~40px height + 16px spacing = 104px)
  // Using theme spacing: connection indicator at 48px, add 40px for indicator height, 16px spacing
  const toastTop = 104; // Calculated to avoid connection indicator

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: toastTop,
        left: 16, // Using standard spacing (4 * 4 = 16)
        right: 16,
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <View
        style={{
          backgroundColor: getBackgroundColor(),
          borderRadius: 8,
          padding: 12,
          paddingHorizontal: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: theme.colors.highlight,
            fontSize: 14,
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

