import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemeService, Theme, ThemeName } from "@/lib/themeService";
import { useTheme } from "@/lib/themeContext";
import Icon from "@/components/ui/icon";

export default function ThemeScreen() {
  const router = useRouter();
  const { theme: currentThemeObj, themeName: currentThemeName, setTheme } = useTheme();
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    setThemes(ThemeService.getAllThemes());
  }, []);

  const handleSelectTheme = async (themeName: ThemeName) => {
    await setTheme(themeName);
    // Theme will update automatically via context
  };

  return (
    <SafeAreaView 
      className="flex-1"
      style={{ backgroundColor: currentThemeObj.colors.bg.DEFAULT }}
    >
      {/* Header */}
      <View 
        className="flex-row items-center px-4 py-3"
        style={{ 
          borderBottomWidth: 1,
          borderBottomColor: currentThemeObj.colors.border.muted,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="mr-4 p-2"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Icon name="arrow-back" size={24} color={currentThemeObj.colors.text.muted} />
        </Pressable>
        <Text 
          className="text-xl font-semibold"
          style={{ color: currentThemeObj.colors.text.DEFAULT }}
        >
          Choose Theme
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-3">
          {themes.map((theme) => {
            const isSelected = currentThemeName === theme.name;
            return (
              <Pressable
                key={theme.name}
                onPress={() => handleSelectTheme(theme.name)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    borderRadius: 8,
                    padding: 16,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border.DEFAULT,
                    borderWidth: isSelected ? 3 : 2,
                    backgroundColor: theme.colors.bg.DEFAULT,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold mb-2"
                      style={{ color: theme.colors.text.DEFAULT }}
                    >
                      {theme.displayName}
                    </Text>

                    {/* Color Swatches */}
                    <View className="flex-row gap-2">
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
                  </View>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <View className="ml-4">
                      <Icon
                        name="check"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
                </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="px-4 pb-6">
          <Text 
            className="text-xs text-center"
            style={{ color: currentThemeObj.colors.text.muted }}
          >
            Theme changes apply instantly
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

