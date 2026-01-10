import { useState, useEffect, useRef } from "react";
import { View, Text, Modal, Animated, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/themeContext";
import { getModalBackdropColor } from "@/lib/themeService";
import Button from "@/components/ui/button";

export type WelcomeModalProps = {
  visible: boolean;
  onContinue: () => void;
};

export default function WelcomeModal({
  visible,
  onContinue,
}: WelcomeModalProps) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  // Animation refs
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentScaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    {
      emoji: "👋",
      title: "Welcome to Boop!",
      description:
        "A simple way to let someone special know you're thinking of them.",
    },
    {
      emoji: "🔗",
      title: "Pair Your Devices",
      description:
        "Share your pairing code with your partner to connect your devices.",
    },
    {
      emoji: "💜",
      title: "Send a Boop",
      description: "Tap the button to send a quick notification. That's it!",
    },
  ];

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
    } else {
      resetAnimations();
      setCurrentStep(0);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && currentStep < steps.length) {
      animateStep();
    }
  }, [currentStep, visible]);

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
    ]).start(() => {
      animateStep();
    });
  };

  const animateStep = () => {
    // Reset step animations
    iconScaleAnim.setValue(0);
    textSlideAnim.setValue(30);
    textOpacityAnim.setValue(0);

    // Icon bounce in
    Animated.spring(iconScaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Text slide up and fade in using Animated.delay()
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
  };

  const resetAnimations = () => {
    backdropAnim.setValue(0);
    contentScaleAnim.setValue(0.9);
    contentOpacityAnim.setValue(0);
    iconScaleAnim.setValue(0);
    textSlideAnim.setValue(30);
    textOpacityAnim.setValue(0);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleContinue();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleContinue();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };

  const currentStepData = steps[currentStep];

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
            {/* Step Indicator */}
            <View className="flex-row justify-center mb-4 gap-2">
              {steps.map((_, index) => (
                <View
                  key={index}
                  className="h-1 rounded-full"
                  style={{
                    width: index === currentStep ? 24 : 8,
                    backgroundColor:
                      index === currentStep
                        ? theme.colors.primary
                        : theme.colors.border.muted,
                  }}
                />
              ))}
            </View>

            {/* Icon */}
            <Animated.View
              className="items-center mb-6 pt-2"
              style={{
                transform: [{ scale: iconScaleAnim }],
              }}
            >
              <Text className="text-6xl pt-2">{currentStepData.emoji}</Text>
            </Animated.View>

            {/* Text Content */}
            <Animated.View
              style={{
                opacity: textOpacityAnim,
                transform: [{ translateY: textSlideAnim }],
              }}
            >
              <Text
                className="text-2xl font-semibold text-center mb-4"
                style={{ color: theme.colors.text.DEFAULT }}
              >
                {currentStepData.title}
              </Text>
              <Text
                className="text-base text-center mb-8"
                style={{ color: theme.colors.text.muted }}
              >
                {currentStepData.description}
              </Text>
            </Animated.View>

            {/* Buttons */}
            <View className="gap-3">
              <Button
                title={
                  currentStep === steps.length - 1 ? "Get Started" : "Next"
                }
                onPress={handleNext}
              />
              {currentStep < steps.length - 1 && (
                <Pressable onPress={handleSkip}>
                  <Text
                    className="text-center py-3"
                    style={{ color: theme.colors.text.muted }}
                  >
                    Skip
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
