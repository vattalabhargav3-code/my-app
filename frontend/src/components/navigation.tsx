import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandMark, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

export function ScreenHeader({
  eyebrow,
  title,
  right,
  onLogout,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
  onLogout: () => void;
}) {
  return (
    <>
      <View style={shared.topBar}>
        <BrandMark compact />
        <Pressable onPress={onLogout} style={shared.iconButton} testID="logout-button" accessibilityLabel="Log out">
          <Icon name="logout-variant" size={20} color={colors.onSurfaceSecondary} />
        </Pressable>
      </View>
      <View style={shared.greetingRow}>
        <View>
          <Text style={shared.eyebrow}>{eyebrow}</Text>
          <Text style={shared.screenTitle}>{title}</Text>
        </View>
        {right}
      </View>
    </>
  );
}

export type Role = "passenger" | "driver";

export function RoleSwitcher({ role, onChange, bottom }: { role: Role; onChange: (role: Role) => void; bottom: number }) {
  const items: { key: Role; label: string; icon: string }[] = [
    { key: "passenger", label: "Passenger", icon: "account-outline" },
    { key: "driver", label: "Driver", icon: "steering" },
  ];
  return (
    <View style={[styles.switcher, { bottom }]}>
      {items.map((item) => {
        const active = role === item.key;
        return (
          <Pressable
            key={item.key}
            testID={`role-${item.key}`}
            onPress={() => onChange(item.key)}
            style={[styles.roleButton, active && styles.roleButtonActive]}
          >
            <Icon name={item.icon} size={18} color={active ? colors.onBrandPrimary : colors.muted} />
            <Text style={[styles.roleText, active && styles.roleTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: {
    position: "absolute",
    left: 18,
    right: 18,
    padding: 5,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
  },
  roleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  roleButtonActive: { backgroundColor: colors.brand },
  roleText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  roleTextActive: { color: colors.onBrandPrimary },
});
