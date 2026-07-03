import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the active color scheme.
 *
 * The active scheme is controlled by ThemeContext, which lets the user
 * pick light, dark, or system (device) appearance from the Profile screen
 * and persists the choice across sessions.
 */
export function useColors() {
  const { scheme } = useTheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
