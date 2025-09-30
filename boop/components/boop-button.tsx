import { Pressable, Text, Alert, View, Animated } from "react-native";
import { useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { DeviceService } from "@/lib/deviceService";

export type BoopButtonProps = {
  onLongPress?: () => void;
};

export default function BoopButton({ onLongPress }: BoopButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handleBoop = async () => {
    // Haptic feedback for press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
      const success = await DeviceService.sendBoop();
      if (success) {
        // Success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Boop!", "Sent successfully!");
      } else {
        Alert.alert(
          "Error",
          "No paired device found. Please pair with another device first."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send boop");
      console.error(error);
    }
  };

  const handleLongPress = () => {
    // Haptic feedback to indicate settings access
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
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
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#8B5CF6", "#10B981"],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        shadowOpacity: shadowAnim,
        shadowColor: "#8B5CF6",
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

          {/* Content */}
          <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
              Boop!
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
