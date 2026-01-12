import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/themeContext";
import { getModalBackdropColor } from "@/lib/themeService";
import { DeviceService } from "@/lib/deviceService";
import Button from "@/components/ui/button";

export type WelcomeModalProps = {
  visible: boolean;
  onContinue: (name?: string) => void;
};

export default function WelcomeModal({
  visible,
  onContinue,
}: WelcomeModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");

  // Animation refs
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentScaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(20)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputSlideAnim = useRef(new Animated.Value(20)).current;
  const inputOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
    } else {
      resetAnimations();
      setName("");
    }
  }, [visible]);

  const startEntranceAnimation = () => {
    resetAnimations();

    // Backdrop fade in
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Content scale + fade
    Animated.parallel([
      Animated.spring(contentScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Text slide up and fade in
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Input slide up
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(inputSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(inputOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const resetAnimations = () => {
    backdropAnim.setValue(0);
    contentScaleAnim.setValue(0.9);
    contentOpacityAnim.setValue(0);
    textSlideAnim.setValue(20);
    textOpacityAnim.setValue(0);
    inputSlideAnim.setValue(20);
    inputOpacityAnim.setValue(0);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If name is provided, register or update device with name
    if (name.trim()) {
      const currentDevice = DeviceService.getCurrentDevice();
      if (currentDevice.deviceId) {
        // Device exists, update name
        await DeviceService.updateDeviceName(name.trim());
      } else {
        // Device doesn't exist yet, register with name
        await DeviceService.registerDevice(name.trim());
      }
    } else {
      // No name provided, ensure device is registered (will default to "Anonymous")
      const currentDevice = DeviceService.getCurrentDevice();
      if (!currentDevice.deviceId) {
        await DeviceService.registerDevice();
      }
    }

    onContinue(name.trim() || undefined);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue(); // Continue without name
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <SafeAreaView className="flex-1">
        <Animated.View
          className="flex-1 items-center justify-center p-4"
          style={{
            backgroundColor: getModalBackdropColor(theme, 0.88),
            opacity: backdropAnim,
          }}
        >
          <Animated.View
            className="w-11/12 max-w-md rounded-3xl p-8"
            style={{
              opacity: contentOpacityAnim,
              transform: [{ scale: contentScaleAnim }],
              backgroundColor: theme.colors.bg.light,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Text Content */}
            <Animated.View
              style={{
                opacity: textOpacityAnim,
                transform: [{ translateY: textSlideAnim }],
              }}
            >
              <Text
                className="text-2xl font-semibold text-center mb-3"
                style={{ color: theme.colors.text.DEFAULT }}
              >
                Welcome to Boop 👋
              </Text>
              <Text
                className="text-base text-center mb-6"
                style={{ color: theme.colors.text.muted }}
              >
                Send quick "thinking of you" notifications to someone special
              </Text>
            </Animated.View>

            {/* Name Input */}
            <Animated.View
              style={{
                opacity: inputOpacityAnim,
                transform: [{ translateY: inputSlideAnim }],
              }}
            >
              <Text
                className="mb-2 text-sm font-medium"
                style={{ color: theme.colors.text.muted }}
              >
                What should we call you?
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name (optional)"
                placeholderTextColor={theme.colors.text.muted}
                autoCapitalize="words"
                autoCorrect={false}
                className="rounded-xl text-base mb-6"
                style={{
                  backgroundColor: theme.colors.bg.DEFAULT,
                  color: theme.colors.text.DEFAULT,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  textAlignVertical: "center",
                  height: 48,
                }}
                maxLength={50}
              />
            </Animated.View>

            {/* Buttons */}
            <View className="gap-3">
              <Button title="Continue" onPress={handleContinue} />
              <Pressable onPress={handleSkip}>
                <Text
                  className="text-center py-3"
                  style={{ color: theme.colors.text.muted }}
                >
                  Skip
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
