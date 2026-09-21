import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

const VEHICLE_FILTERS = ["all", "bike", "car", "cab"];
const filterIcon: Record<string, string> = { all: "apps", bike: "motorbike", car: "car-outline", cab: "taxi" };

export type SearchState = {
  mode: string;
  vehicleType: string;
  fromLocation: string;
  toLocation: string;
};

export function RideSearchPanel({
  search,
  onChange,
  onSearch,
  loading,
}: {
  search: SearchState;
  onChange: (patch: Partial<SearchState>) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  const commercial = search.mode === "commercial";
  return (
    <>
      <View style={styles.modeRow}>
        <Pressable
          testID="mode-commercial"
          onPress={() => onChange({ mode: "commercial" })}
          style={[styles.modeCard, commercial && styles.modeCardCommercial]}
        >
          <Icon name="taxi" size={22} color={commercial ? colors.warning : colors.muted} />
          <Text style={[styles.modeLabel, commercial && styles.warningText]}>Commercial</Text>
          <Text style={styles.modeCaption}>Yellow plate</Text>
        </Pressable>
        <Pressable
          testID="mode-sharing"
          onPress={() => onChange({ mode: "petrol_save" })}
          style={[styles.modeCard, !commercial && styles.modeCardSharing]}
        >
          <Icon name="leaf" size={22} color={!commercial ? colors.brand : colors.muted} />
          <Text style={[styles.modeLabel, !commercial && shared.brandText]}>Petrol save</Text>
          <Text style={styles.modeCaption}>White plate sharing</Text>
        </Pressable>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchLine}>
          <Icon name="map-marker" color={colors.brand} size={21} />
          <TextInput
            testID="search-from-input"
            value={search.fromLocation}
            onChangeText={(fromLocation) => onChange({ fromLocation })}
            placeholder="Pickup location"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="next"
          />
        </View>
        <View style={styles.searchDivider} />
        <View style={styles.searchLine}>
          <Icon name="navigation-variant" color={colors.info} size={20} />
          <TextInput
            testID="search-to-input"
            value={search.toLocation}
            onChangeText={(toLocation) => onChange({ toLocation })}
            placeholder="Destination"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
        </View>
        <Button
          label="Find available rides"
          onPress={() => {
            Keyboard.dismiss();
            onSearch();
          }}
          loading={loading}
          testID="search-rides-button"
        />
      </View>

      <View style={styles.filterRow}>
        {VEHICLE_FILTERS.map((type) => {
          const active = search.vehicleType === type;
          return (
            <Pressable
              key={type}
              testID={`filter-${type}`}
              onPress={() => onChange({ vehicleType: type })}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Icon name={filterIcon[type]} size={15} color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary} />
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{type === "all" ? "All rides" : type}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: "row", gap: 10, paddingHorizontal: 18, marginTop: 22 },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    gap: 5,
  },
  modeCardCommercial: { borderColor: colors.warning, backgroundColor: colors.onWarning },
  modeCardSharing: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  modeLabel: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  modeCaption: { color: colors.onSurfaceTertiary, fontSize: 11 },
  warningText: { color: colors.warning },
  searchCard: {
    margin: 18,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    gap: 12,
  },
  searchLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: 15, minHeight: 40 },
  searchDivider: { height: 1, backgroundColor: colors.divider, marginLeft: 30 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, marginBottom: 24 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  filterChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { color: colors.onSurfaceSecondary, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  filterTextActive: { color: colors.onBrandPrimary },
});
