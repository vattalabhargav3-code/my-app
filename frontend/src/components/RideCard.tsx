import { Pressable, StyleSheet, Text, View } from "react-native";

import { Ride } from "@/src/api";
import { Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

export function RideCard({ ride, onPress }: { ride: Ride; onPress?: () => void }) {
  return (
    <View style={styles.card} testID={`ride-card-${ride.id}`}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{ride.driver_name.charAt(0)}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{ride.driver_name}</Text>
          <Text style={styles.vehicleText}>{ride.vehicle}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>₹{ride.price}</Text>
          <Text style={styles.perSeat}>per seat</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.dotColumn}>
          <View style={styles.dotStart} />
          <View style={styles.routeLine} />
          <View style={styles.dotEnd} />
        </View>
        <View style={styles.routeLabels}>
          <Text style={shared.routeText}>{ride.from}</Text>
          <Text style={styles.stopText}>{ride.stops || "Direct route"}</Text>
          <Text style={shared.routeText}>{ride.to}</Text>
        </View>
        <View style={styles.seatsBox}>
          <Icon name="seat-outline" color={colors.brand} size={18} />
          <Text style={styles.seatsText}>{ride.seats_left} left</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={shared.rowCenter}>
          <Icon name="star" color={colors.warning} size={15} />
          <Text style={shared.smallStrong}>{ride.rating}</Text>
          <Text style={shared.mutedText}> · verified driver</Text>
        </View>
        {onPress ? (
          <Pressable
            testID={`ride-select-${ride.id}`}
            onPress={onPress}
            style={({ pressed }) => [styles.selectButton, pressed && shared.pressed]}
          >
            <Text style={styles.selectButtonText}>Select ride</Text>
            <Icon name="arrow-right" color={colors.onBrandPrimary} size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    gap: 14,
  },
  header: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  initial: { color: colors.brand, fontSize: 18, fontWeight: "800" },
  driverInfo: { marginLeft: 10, flex: 1 },
  driverName: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
  vehicleText: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 3 },
  priceBox: { alignItems: "flex-end" },
  price: { color: colors.brand, fontSize: 20, fontWeight: "900" },
  perSeat: { color: colors.muted, fontSize: 10 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
  },
  dotColumn: { alignItems: "center", width: 18 },
  dotStart: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  dotEnd: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info },
  routeLine: { width: 1, height: 20, backgroundColor: colors.borderStrong },
  routeLabels: { flex: 1, marginLeft: 10, gap: 3 },
  stopText: { color: colors.muted, fontSize: 10 },
  seatsBox: { alignItems: "center", gap: 3 },
  seatsText: { color: colors.brand, fontSize: 11, fontWeight: "800" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  selectButtonText: { color: colors.onBrandPrimary, fontSize: 12, fontWeight: "800" },
});
