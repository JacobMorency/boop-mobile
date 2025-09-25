import { Pressable, Text } from "react-native";

export default function BoopButton() {
  return (
    <Pressable
      className="h-40 w-40 items-center justify-center rounded-full border-2 border-primary bg-bg-light"
      accessibilityRole="button"
      accessibilityLabel="Boop"
    >
      <Text className="text-lg font-semibold text-text">Boop!</Text>
    </Pressable>
  );
}
