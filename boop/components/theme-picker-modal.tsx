import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeService, Theme, ThemeName } from "@/lib/themeService";
import Icon from "./ui/icon";

export type ThemePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ThemePickerModal({
  visible,
  onClose,
}: ThemePickerModalProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("lilac");
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    if (visible) {
      console.log("Theme picker modal visible");
      loadCurrentTheme();
      setThemes(ThemeService.getAllThemes());
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
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-11/12 max-w-md rounded-2xl bg-bg-light p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-semibold text-text">
                Choose Theme
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                })}
              >
                <Icon name="close" size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2 justify-between">
                {themes.map((theme) => {
                  const isSelected = currentTheme === theme.name;
                  return (
                    <Pressable
                      key={theme.name}
                      onPress={() => handleSelectTheme(theme.name)}
                      className="w-[47%] min-h-[120px]"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View
                        className="rounded-lg border-2 p-4 w-full min-h-[120px]"
                        style={{
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border.muted,
                          backgroundColor: theme.colors.bg.DEFAULT,
                        }}
                      >
                        <View className="mb-3">
                          <Text
                            className="text-base font-semibold"
                            style={{ color: theme.colors.text.DEFAULT }}
                          >
                            {theme.displayName}
                          </Text>
                        </View>

                        {/* Color Swatches */}
                        <View className="flex-row flex-wrap gap-1.5">
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: theme.colors.primary,
                            }}
                          />
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: theme.colors.secondary,
                            }}
                          />
                          <View
                            className="rounded-full w-6 h-6"
                            style={{
                              backgroundColor: theme.colors.border.DEFAULT,
                            }}
                          />
                        </View>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <View className="absolute top-2 right-2">
                            <Icon
                              name="check"
                              size={20}
                              color={theme.colors.primary}
                            />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View className="mt-6">
              <Text className="text-xs text-text-muted text-center">
                Theme changes will apply after restarting the app
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
