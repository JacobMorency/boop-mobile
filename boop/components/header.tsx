import { View, Text, Pressable } from "react-native";
import Icon from "./ui/icon";

export type headerProps = {
  title: string;
  onPressSettings?: () => void;
};

export default function Header({ title, onPressSettings }: headerProps) {
  return (
    <View className="w-full flex-row items-center justify-between px-6 py-4 bg-bg-light border-b border-border">
      <Text className="text-2xl font-bold text-text">{title}</Text>
      {onPressSettings && (
        <Pressable
          onPress={onPressSettings}
          accessibilityLabel="Open settings"
          className="p-2 rounded-full bg-bg border border-border active:bg-border-muted"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Icon name="settings" size={20} color="#6B7280" />
        </Pressable>
      )}
    </View>
  );
}
