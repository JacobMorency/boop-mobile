import { Text, View } from "react-native";
import Nativewindtest from "@/components/nativewindtest";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Nativewindtest />
    </View>
  );
}
