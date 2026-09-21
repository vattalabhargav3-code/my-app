import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

export function Icon({ name, size = 20, color = colors.onSurfaceSecondary }: { name: string; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name as never} size={size} color={color} />;
}

type ButtonTone = "brand" | "soft" | "danger";

export function Button({
  label,
  onPress,
  tone = "brand",
  loading = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const toneStyle = tone === "soft" ? styles.buttonSoft : tone === "danger" ? styles.buttonDanger : styles.buttonBrand;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.button, toneStyle, (pressed || disabled) && shared.pressed]}
    >
      {loading ? (
        <ActivityIndicator color={tone === "soft" ? colors.brand : colors.onBrandPrimary} />
      ) : (
        <Text style={[styles.buttonText, tone === "soft" && styles.buttonTextSoft]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  testID,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  testID?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={shared.fieldLabel}>{label}</Text> : null}
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={shared.input}
      />
    </View>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <Icon name="compass-outline" size={compact ? 20 : 28} color={colors.onBrandPrimary} />
      </View>
      <Text style={[styles.brandName, compact && styles.brandNameCompact]}>SafarWay</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner} testID="error-banner">
      <Icon name="alert-circle-outline" color={colors.error} size={18} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
  labelFor,
  testIDPrefix,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  labelFor?: (option: string) => string;
  testIDPrefix?: string;
}) {
  return (
    <View style={shared.segmentRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          testID={testIDPrefix ? `${testIDPrefix}-${option}` : undefined}
          onPress={() => onChange(option)}
          style={[shared.segment, value === option && shared.segmentActive]}
        >
          <Text style={[shared.segmentText, value === option && shared.segmentTextActive]}>
            {labelFor ? labelFor(option) : option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    flexGrow: 1,
  },
  buttonBrand: { backgroundColor: colors.brand },
  buttonSoft: { backgroundColor: colors.surfaceTertiary, borderColor: colors.borderStrong, borderWidth: 1 },
  buttonDanger: { backgroundColor: colors.error },
  buttonText: { color: colors.onBrandPrimary, fontSize: 14, fontWeight: "800" },
  buttonTextSoft: { color: colors.onSurface },
  fieldWrap: { gap: 7 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { color: colors.onSurface, fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  brandNameCompact: { fontSize: 20 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 11,
    borderRadius: 11,
    backgroundColor: colors.onError,
  },
  errorText: { color: colors.error, fontSize: 12, flex: 1 },
});
