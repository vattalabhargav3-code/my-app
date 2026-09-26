import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ride } from "@/src/api";
import { Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

interface RideCardProps {
  ride: Ride & { women_only?: boolean };
  onPress?: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  const isWomenOnly = (ride as any).women_only;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, isWomenOnly && styles.womenOnlyBorder]}
    >
      <View style={styles.topRow}>
        <View style={styles.driverInfo}>
          <View style={[styles.avatar, isWomenOnly && styles.womenAvatar]}>
            <Icon
              name={isWomenOnly ? "face-woman" : "account"}
              size={20}
              color={isWomenOnly ? "#EC4899" : colors.brand}
            />
          </View>
          <View>
            <Text style={styles.driverName}>{ride.driver_name || "Verified Driver"}</Text>
            <Text style={styles.vehicleText}>
              {ride.vehicle} • {ride.type.toUpperCase()}
            </Text>
          </View>
        </View>

        {isWomenOnly ? (
          <View style={styles.womenBadge}>
            <Icon name="shield-heart" size={13} color="#FFFFFF" />
            <Text style={styles.womenBadgeText}>Women Only</Text>
          </View>
        ) : (
          <View style={styles.seatsBadge}>
            <Icon name="seat-passenger" size={14} color={colors.brand} />
            <Text style={styles.seatsText}>{ride.seats} seats</Text>
          </View>
        )}
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Icon name="circle-slice-8" size={14} color={colors.brand} />
          <Text style={styles.routePoint} numberOfLines={1}>{ride.from}</Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeRow}>
          <Icon name="map-marker" size={16} color="#EF4444" />
          <Text style={styles.routePoint} numberOfLines={1}>{ride.to}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.timeWrap}>
          <Icon name="clock-outline" size={14} color={colors.muted} />
          <Text style={styles.timeText}>
            {ride.departure_time ? ride.departure_time : "Scheduled"}
          </Text>
        </View>
        <Text style={styles.priceText}>₹{ride.price}<Text style={styles.priceSub}>/seat</Text></Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  womenOnlyBorder: {
    borderColor: "rgba(236, 72, 153, 0.45)",
    backgroundColor: "#1A1B35",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  womenAvatar: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
  },
  driverName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  vehicleText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  womenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DB2777",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  womenBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  seatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  seatsText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "700",
  },
  routeContainer: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routePoint: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  routeDivider: {
    height: 12,
    width: 1,
    backgroundColor: "#334155",
    marginLeft: 7,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    color: colors.muted,
    fontSize: 12,
  },
  priceText: {
    color: colors.brand,
    fontSize: 17,
    fontWeight: "900",
  },
  priceSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
  },
});
