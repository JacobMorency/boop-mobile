import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type IconName =
  | "settings"
  | "gear"
  | "close"
  | "check"
  | "plus"
  | "minus"
  | "copy"
  | "edit"
  | "palette"
  | "heart"
  | "arrow-back"
  | "lock-closed";

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
      case "copy":
        return "copy-outline";
      case "edit":
        return "create-outline";
      case "palette":
        return "color-palette-outline";
      case "heart":
        return "heart-outline";
      case "arrow-back":
        return "arrow-back-outline";
      case "lock-closed":
        return "lock-closed-outline";
      default:
        return "help-outline";
    }
  };

  return <Ionicons name={getIconName(name) as any} size={size} color={color} />;
}
