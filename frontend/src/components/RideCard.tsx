import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ride } from "@/src/api";

interface RideCardProps {
  ride: Ride;
  onPress: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  if (!ride) return null;

  const fare =
    (ride as any).price_per_seat ??
    (ride as any).price ??
    (ride as any).seat_price ??
    95;

  const seatsLeft =
    (ride as any).available_seats ??
    (ride as any).seats_left ??
    3;

  const pickupPoint =
    (ride as any).from_location ||
    (ride as any).from ||
    "Pickup Point";

  const dropPoint =
    (ride as any).to_location ||
    (ride as any).to ||
    "Destination Point";

  const driverName =
    (ride as any).driver_name ||
    (ride as any).driver ||
    "Verified Partner";

  const vehicleName =
    (ride as any).vehicle_name ||
    `${((ride as any).vehicle_type || (ride as any).type || "car").toUpperCase()} POOL`;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.topRow}>
        <View style={styles.driverInfoWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName} numberOfLines={1}>
                {driverName}
              </Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.vehicleText} numberOfLines={1}>
              {vehicleName}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>₹{fare}</Text>
          <Text style={styles.perSeatLabel}>per seat</Text>
        </View>
      </View>

      <View style={styles.routeBox}>
        <View style={styles.locationItem}>
          <View style={styles.greenDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {pickupPoint}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.locationItem}>
          <View style={styles.redDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {dropPoint}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.timeWrap}>
          <Text style={styles.clockIcon}>🕒</Text>
          <Text style={styles.timeText}>
            {(ride as any).departure_time || "Today in 15 mins"}
          </Text>
          <Text style={styles.seatsBadge}>• {seatsLeft} seats left</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.bookBtn}
        >
          <Text style={styles.bookBtnText}>Book (₹{fare}) ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  driverInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  avatarText: {
    fontSize: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driverName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  verifiedBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
  },
  vehicleText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#16A34A",
  },
  perSeatLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
  routeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: "#CBD5E1",
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clockIcon: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  seatsBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
    marginLeft: 4,
  },
  bookBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
