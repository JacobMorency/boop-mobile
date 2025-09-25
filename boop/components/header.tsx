import { View, Text, Pressable } from "react-native";

export type headerProps = {
  title: string;
  onPressSettings?: () => void;
};

export default function Header({ title, onPressSettings }: headerProps) {
  return (
    <View className="w-full flex-row items-center justify-between px-4 py-3">
      <Text className="text-xl font-semibold">{title}</Text>
      <Pressable onPress={onPressSettings} accessibilityLabel="Open settings">
        <Text className="text-lg">⚙️</Text>
      </Pressable>
    </View>
  );
}
