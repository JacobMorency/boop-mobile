import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Alert,
  Pressable,
  Clipboard,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/lib/deviceService";
import { useTheme } from "@/lib/themeContext";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";

export type NameInputModalProps = {
  visible: boolean;
  onComplete: (name: string) => void;
};

export default function NameInputModal({
  visible,
  onComplete,
}: NameInputModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string>("");

  // Animation refs
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(-30)).current;
  const titleOpacityAnim = useRef(new Animated.Value(0)).current;
  const descriptionOpacityAnim = useRef(new Animated.Value(0)).current;
  const codeScaleAnim = useRef(new Animated.Value(0.8)).current;
  const codeOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputSlideAnim = useRef(new Animated.Value(30)).current;
  const inputOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  const copyButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const copyButtonTextAnim = useRef(new Animated.Value(0)).current;

  // Generate device code when modal opens
  useEffect(() => {
    if (visible) {
      generateDeviceCode();
      startEntranceAnimation();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const startEntranceAnimation = () => {
    // Reset all animations
    resetAnimations();

    // Backdrop fade in
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Modal container scale + fade
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered content animations
    setTimeout(() => {
      // Title slide in
      Animated.parallel([
        Animated.spring(titleSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);

    setTimeout(() => {
      // Description fade in
      Animated.timing(descriptionOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 200);

    setTimeout(() => {
      // Code box scale in with bounce
      Animated.parallel([
        Animated.spring(codeScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(codeOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    setTimeout(() => {
      // Input slide up
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
      ]).start();
    }, 400);

    setTimeout(() => {
      // Button fade in
      Animated.timing(buttonOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 500);
  };

  const resetAnimations = () => {
    backdropAnim.setValue(0);
    modalScaleAnim.setValue(0.9);
    modalOpacityAnim.setValue(0);
    titleSlideAnim.setValue(-30);
    titleOpacityAnim.setValue(0);
    descriptionOpacityAnim.setValue(0);
    codeScaleAnim.setValue(0.8);
    codeOpacityAnim.setValue(0);
    inputSlideAnim.setValue(30);
    inputOpacityAnim.setValue(0);
    buttonOpacityAnim.setValue(0);
  };

  const generateDeviceCode = async () => {
    try {
      const { code } = await DeviceService.registerDevice();
      setDeviceCode(code);
    } catch (error) {
      console.error("Failed to generate device code:", error);
    }
  };

  const copyCodeToClipboard = async () => {
    try {
      // Button press animation
      Animated.sequence([
        Animated.spring(copyButtonScaleAnim, {
          toValue: 0.95,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(copyButtonScaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Text morph animation (Copy → ✓)
      Animated.timing(copyButtonTextAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Clipboard.setString(deviceCode);

      // Reset after 2 seconds
      setTimeout(() => {
        Animated.timing(copyButtonTextAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      // Update device name
      await DeviceService.updateDeviceName(name.trim());
      onComplete(name.trim());
    } catch (error) {
      Alert.alert("Error", "Failed to set up your profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {}} // Prevent closing without name
    >
      <SafeAreaView className="flex-1">
        <Animated.View
          className="flex-1 items-center justify-center p-4"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            })})`,
          }}
        >
          <Animated.View
            className="w-11/12 rounded-2xl p-6"
            style={{
              opacity: modalOpacityAnim,
              transform: [{ scale: modalScaleAnim }],
              backgroundColor: theme.colors.bg.light,
            }}
          >
            <Animated.View
              style={{
                opacity: titleOpacityAnim,
                transform: [{ translateY: titleSlideAnim }],
              }}
            >
              <Text 
                className="mb-2 text-2xl font-bold"
                style={{ color: theme.colors.text.DEFAULT }}
              >
                Welcome to Boop! 👋
              </Text>
            </Animated.View>

            <Animated.View
              style={{
                opacity: descriptionOpacityAnim,
              }}
            >
              <Text 
                className="mb-4 text-base"
                style={{ color: theme.colors.text.muted }}
              >
                Boop lets you send quick "thinking of you" notifications to a
                special person. Pair your devices and tap the button to send a
                boop!
              </Text>
            </Animated.View>

            {/* Your Pairing Code */}
            {deviceCode && (
              <Animated.View
                className="mb-6 rounded-lg p-4"
                style={{
                  opacity: codeOpacityAnim,
                  transform: [{ scale: codeScaleAnim }],
                  borderWidth: 1,
                  borderColor: theme.colors.border.DEFAULT,
                  backgroundColor: theme.colors.bg.DEFAULT,
                }}
              >
                <Text 
                  className="mb-2 text-sm font-medium"
                  style={{ color: theme.colors.text.muted }}
                >
                  Your pairing code
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text 
                    className="text-2xl font-bold tracking-widest"
                    style={{ color: theme.colors.text.DEFAULT }}
                  >
                    {deviceCode}
                  </Text>
                  <Animated.View
                    style={{
                      transform: [{ scale: copyButtonScaleAnim }],
                    }}
                  >
                    <Pressable
                      onPress={copyCodeToClipboard}
                      className="rounded-lg p-2 items-center justify-center"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.6 : 1,
                        width: 36,
                        height: 36,
                      })}
                    >
                      <View className="absolute items-center justify-center" style={{ width: 20, height: 20 }}>
                        <Animated.View
                          style={{
                            opacity: copyButtonTextAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 0],
                            }),
                          }}
                        >
                          <Icon name="copy" size={20} color={theme.colors.text.muted} />
                        </Animated.View>
                        <Animated.View
                          className="absolute"
                          style={{
                            opacity: copyButtonTextAnim,
                          }}
                        >
                          <Icon name="check" size={20} color={theme.colors.success} />
                        </Animated.View>
                      </View>
                    </Pressable>
                  </Animated.View>
                </View>
                <Text 
                  className="mt-2 text-xs"
                  style={{ color: theme.colors.text.muted }}
                >
                  Share this code with your partner to connect your devices
                </Text>
              </Animated.View>
            )}

            <Animated.View
              className="mb-6"
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
              <Text 
                className="mb-3 text-xs"
                style={{ color: theme.colors.text.muted }}
              >
                This name will appear in notifications when you boop someone
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.text.muted}
                autoCapitalize="words"
                autoCorrect={false}
                className="rounded-lg px-4 py-3 text-base"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border.DEFAULT,
                  backgroundColor: theme.colors.bg.DEFAULT,
                  color: theme.colors.text.DEFAULT,
                }}
                maxLength={50}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: buttonOpacityAnim,
              }}
            >
              <Button
                title={isLoading ? "Setting up..." : "Continue"}
                onPress={handleSubmit}
                disabled={!name.trim() || isLoading}
                loading={isLoading}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
