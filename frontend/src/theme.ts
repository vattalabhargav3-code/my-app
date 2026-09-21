import { useColorScheme } from "react-native";

export const colors = {
  surface: "#121316",
  onSurface: "#F4F5F7",
  surfaceSecondary: "#1A1C23",
  onSurfaceSecondary: "#C7CBD1",
  surfaceTertiary: "#252833",
  onSurfaceTertiary: "#949AA5",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#121316",
  brand: "#10B981",
  brandPrimary: "#10B981",
  onBrandPrimary: "#062319",
  brandSecondary: "#059669",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#064E3B",
  success: "#10B981",
  onSuccess: "#062319",
  warning: "#F59E0B",
  onWarning: "#2A1C04",
  error: "#EF4444",
  onError: "#2C0B0B",
  info: "#3B82F6",
  onInfo: "#0A1D38",
  border: "#2D313E",
  borderStrong: "#4B5267",
  divider: "#1F232D",
  muted: "#8C93A3",
  onBrand: "#062319",
  scrim: "rgba(0,0,0,0.72)",
};

export function useTheme() {
  const scheme = useColorScheme();
  return { colors, scheme };
}