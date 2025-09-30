import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type IconName =
  | "settings"
  | "gear"
  | "close"
  | "check"
  | "plus"
  | "minus";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 24, color = "#000" }: IconProps) {
  const getIconName = (iconName: IconName) => {
    switch (iconName) {
      case "settings":
        return "settings-outline";
      case "gear":
        return "cog-outline";
      case "close":
        return "close-outline";
      case "check":
        return "checkmark-outline";
      case "plus":
        return "add-outline";
      case "minus":
        return "remove-outline";
      default:
        return "help-outline";
    }
  };

  return <Ionicons name={getIconName(name) as any} size={size} color={color} />;
}
