import { Pressable, Text } from "react-native";

export default function BoopButton() {
  return (
    <Pressable
      className="h-40 w-40 items-center justify-center rounded-full border border-black"
      accessibilityRole="button"
      accessibilityLabel="Boop"
    >
      <Text className="text-lg font-semibold">Boop!</Text>
    </Pressable>
  );
}
