import { useRef } from "react";
import { Animated } from "react-native";

export function useButtonAnimations() {
  const boopButtonPulseAnim = useRef(new Animated.Value(1)).current;
  const boopButtonGlowAnim = useRef(new Animated.Value(0)).current;

  const triggerBoopReceptionAnimation = () => {
    // Pulse animation - scale up and down
    Animated.sequence([
      Animated.parallel([
        Animated.spring(boopButtonPulseAnim, {
          toValue: 1.15,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(boopButtonGlowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(boopButtonPulseAnim, {
          toValue: 1,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(boopButtonGlowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return {
    boopButtonPulseAnim,
    boopButtonGlowAnim,
    triggerBoopReceptionAnimation,
  };
}

