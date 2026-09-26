import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ride } from "@/src/api";
import { Icon } from "@/src/components/ui";
import { colors } from "@/src/theme";

interface ExtendedRide extends Ride {
  women_only?: boolean;
  ride_vibe?: "silent" | "music" | "chitchat";
  affiliation_badge?: string; // e.g., "Campus Verified • JNTU" or "Corporate • Hitec City"
}

interface RideCardProps {
  ride: ExtendedRide;
  onPress?: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  const isWomenOnly = (ride as any).women_only;
  const vibe = (ride as any).ride_vibe || "music";
  const badge = (ride as any).affiliation_badge || "Campus / Tech Park";

  const renderVibeIcon = () => {
    switch (vibe) {
      case "silent":
        return { icon: "headphones", label: "Silent Ride" };
      case "chitchat":
        return { icon: "chat-processing-outline", label: "Chill & Connect" };
      case "music":
      default:
        return { icon: "music", label: "Music Vibe" };
    }
  };

  const vibeInfo = renderVibeIcon();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, isWomenOnly && styles.womenOnlyBorder]}
    >
      {/* Top Profile & Affiliation Tag */}
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
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{ride.driver_name || "Verified Member"}</Text>
              <View style={styles.campusTag}>
                <Icon name="check-decagram" size={11} color="#38BDF8" />
                <Text style={styles.campusTagText}>{badge}</Text>
              </View>
            </View>
            <Text style={styles.vehicleText}>
              {ride.vehicle} • {ride.type?.toUpperCase()}
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
            <Icon name="seat-passenger" size={13} color={colors.brand} />
            <Text style={styles.seatsText}>{ride.seats} seats</Text>
          </View>
        )}
      </View>

      {/* Gen-Z Ride Vibe Indicator */}
      <View style={styles.vibeRow}>
        <View style={styles.vibeChip}>
          <Icon name={vibeInfo.icon as any} size={13} color="#FBBF24" />
          <Text style={styles.vibeChipText}>{vibeInfo.label}</Text>
        </View>
        <Text style={styles.ecoSavingText}>🌱 ~3.8 kg CO₂ saved</Text>
      </View>

      {/* Route Info */}
      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <Icon name="circle-slice-8" size={14} color={colors.brand} />
          <Text style={styles.routePoint} numberOfLines={1}>{ride.from}</Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeRow}>
          <Icon name="map-marker" size={15} color="#EF4444" />
          <Text style={styles.routePoint} numberOfLines={1}>{ride.to}</Text>
        </View>
      </View>

      {/* Card Footer */}
      <View style={styles.footer}>
        <View style={styles.timeWrap}>
          <Icon name="clock-outline" size={14} color={colors.muted} />
          <Text style={styles.timeText}>
            {ride.departure_time ? ride.departure_time : "Scheduled"}
          </Text>
        </View>
        <Text style={styles.priceText}>
          ₹{ride.price}
          <Text style={styles.priceSub}>/seat</Text>
        </Text>
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
    gap: 10,
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
    flex: 1,
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  driverName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  campusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  campusTagText: {
    color: "#38BDF8",
    fontSize: 10,
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
    fontSize: 10,
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
  vibeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F172A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  vibeChipText: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "700",
  },
  ecoSavingText: {
    color: "#22C55E",
    fontSize: 11,
    fontWeight: "600",
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
    height: 10,
    width: 1,
    backgroundColor: "#334155",
    marginLeft: 7,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
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
    fontSize: 16,
    fontWeight: "900",
  },
  priceSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
  },
});
