import { useRef, useEffect } from "react";
import { Animated } from "react-native";

export function useConnectionAnimation(isPaired: boolean) {
  const connectionSlideAnim = useRef(new Animated.Value(isPaired ? 0 : -50)).current;
  const connectionOpacityAnim = useRef(new Animated.Value(isPaired ? 1 : 0)).current;
  const dotPulseAnim = useRef(new Animated.Value(1)).current;
  const dotPulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const previousPairedRef = useRef<boolean | null>(null);

  const startDotPulse = () => {
    // Stop any existing animation
    if (dotPulseAnimationRef.current) {
      dotPulseAnimationRef.current.stop();
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    dotPulseAnimationRef.current = animation;
    animation.start();
  };

  const stopDotPulse = () => {
    if (dotPulseAnimationRef.current) {
      dotPulseAnimationRef.current.stop();
      dotPulseAnimationRef.current = null;
    }
  };

  useEffect(() => {
    const wasPaired = previousPairedRef.current;
    previousPairedRef.current = isPaired;

    // Only animate on state changes, not initial mount
    if (wasPaired === null) {
      // Initial mount - set initial state
      if (isPaired) {
        startDotPulse();
      }
      return;
    }

    if (isPaired && !wasPaired) {
      // Just connected - slide in with bounce
      Animated.parallel([
        Animated.spring(connectionSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(connectionOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing dot animation
      startDotPulse();
    } else if (!isPaired && wasPaired) {
      // Just disconnected - fade out
      Animated.parallel([
        Animated.timing(connectionSlideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(connectionOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Stop pulsing dot animation
      stopDotPulse();
    }

    // Cleanup on unmount
    return () => {
      stopDotPulse();
    };
  }, [isPaired]);

  return {
    connectionSlideAnim,
    connectionOpacityAnim,
    dotPulseAnim,
  };
}

