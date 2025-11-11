import { Stack } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@/lib/themeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
