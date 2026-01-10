import { useState, useEffect, useRef } from "react";
import { View, Text, Modal, Pressable, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeService, Theme, ThemeName, getModalBackdropColor } from "@/lib/themeService";
import { useTheme } from "@/lib/themeContext";
import Icon from "./ui/icon";

export type ThemePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ThemePickerModal({
  visible,
  onClose,
}: ThemePickerModalProps) {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("lilac");
  const [themes, setThemes] = useState<Theme[]>([]);

  // Animation refs for modal entrance
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      console.log("Theme picker modal visible");
      loadCurrentTheme();
      setThemes(ThemeService.getAllThemes());
      // Start entrance animation
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(modalOpacityAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(modalScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations
      backdropAnim.setValue(0);
      modalOpacityAnim.setValue(0);
      modalScaleAnim.setValue(0.95);
    }
  }, [visible]);

  const loadCurrentTheme = () => {
    setCurrentTheme(ThemeService.getCurrentTheme());
  };

  const handleSelectTheme = async (themeName: ThemeName) => {
    const success = await ThemeService.setTheme(themeName);
    if (success) {
      setCurrentTheme(themeName);
      // Note: Theme changes will be applied on next app restart or via context
      // For now, we'll just save it and let the user know
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
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
              opacity: modalOpacityAnim,
              transform: [{ scale: modalScaleAnim }],
              backgroundColor: theme.colors.bg.light,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-2xl font-semibold"
                style={{ color: theme.colors.text.DEFAULT }}
              >
                Choose Theme
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                })}
              >
                <Icon name="close" size={20} color={theme.colors.text.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-3 justify-between">
                {themes.map((themeOption) => {
                  const isSelected = currentTheme === themeOption.name;
                  return (
                    <Pressable
                      key={themeOption.name}
                      onPress={() => handleSelectTheme(themeOption.name)}
                      className="w-[47%] min-h-[120px]"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View
                        className="rounded-lg border-2 p-4 w-full min-h-[120px]"
                        style={{
                          borderColor: isSelected
                            ? themeOption.colors.primary
                            : themeOption.colors.border.muted,
                          backgroundColor: themeOption.colors.bg.DEFAULT,
                        }}
                      >
                        <View className="mb-3">
                          <Text
                            className="text-base font-semibold"
                            style={{ color: themeOption.colors.text.DEFAULT }}
                          >
                            {themeOption.displayName}
                          </Text>
                        </View>

                        {/* Color Swatches */}
                        <View className="flex-row flex-wrap gap-1.5">
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: themeOption.colors.primary,
                            }}
                          />
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: themeOption.colors.secondary,
                            }}
                          />
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: themeOption.colors.border.DEFAULT,
                            }}
                          />
                        </View>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <View className="absolute top-2 right-2">
                            <Icon
                              name="check"
                              size={20}
                              color={themeOption.colors.primary}
                            />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View className="mt-8">
              <Text
                className="text-xs text-center"
                style={{ color: theme.colors.text.muted }}
              >
                Theme changes will apply after restarting the app
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
