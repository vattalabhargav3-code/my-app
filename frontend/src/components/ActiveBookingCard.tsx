import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { api, Booking } from "@/src/api";
import { Button, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

export function ActiveBookingCard({ booking, token }: { booking: Booking; token: string }) {
  const [tracking, setTracking] = useState(false);

  const callEmergency = () => Linking.openURL("tel:112");

  const triggerSos = async () => {
    try {
      await api(`/rides/${booking.ride.id}/sos`, { method: "POST", body: JSON.stringify({ ride_id: booking.ride.id }) }, token);
      await callEmergency();
    } catch {
      Alert.alert("SOS ready", "Your safety alert was recorded. Call 112 now if you are in immediate danger.", [
        { text: "Call 112", onPress: callEmergency },
        { text: "Close" },
      ]);
    }
  };

  return (
    <View style={styles.card} testID="active-booking-card">
      <View style={styles.header}>
        <View>
          <Text style={shared.eyebrow}>ACTIVE BOOKING</Text>
          <Text style={shared.sectionTitle}>You&apos;re all set</Text>
        </View>
        <Icon name="check-decagram" color={colors.brand} size={28} />
      </View>

      <View style={styles.route}>
        <Text style={shared.routeText}>{booking.ride.from}</Text>
        <Icon name="arrow-right" color={colors.muted} size={18} />
        <Text style={shared.routeText}>{booking.ride.to}</Text>
      </View>

      <View style={styles.otpRow}>
        <View>
          <Text style={shared.mutedText}>Boarding OTP</Text>
          <Text style={styles.boardingOtp} testID="boarding-otp">{booking.boarding_otp}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={shared.mutedText}>Paid total</Text>
          <Text style={shared.totalText}>₹{booking.total}</Text>
        </View>
      </View>

      <Pressable onPress={() => setTracking((value) => !value)} style={styles.trackingButton} testID="toggle-tracking">
        <Icon name="map-marker-path" color={colors.brand} size={19} />
        <Text style={styles.trackingText}>{tracking ? "Hide live tracking" : "Show live trip tracking"}</Text>
        <Icon name={tracking ? "chevron-up" : "chevron-down"} color={colors.muted} size={18} />
      </Pressable>

      {tracking ? (
        <>
          <View style={styles.mapPlaceholder}>
            <Icon name="map-outline" color={colors.brand} size={30} />
            <Text style={styles.mapTitle}>Live trip map</Text>
            <Text style={shared.mutedText}>Driver location connects when the ride begins.</Text>
          </View>
          <Button label="Emergency SOS · Call 112" onPress={triggerSos} tone="danger" testID="sos-button" />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandSecondary,
    borderWidth: 1,
    gap: 15,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  route: { flexDirection: "row", alignItems: "center", gap: 10 },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
  },
  boardingOtp: { color: colors.warning, fontSize: 26, fontWeight: "900", letterSpacing: 4, marginTop: 3 },
  totalBox: { alignItems: "flex-end" },
  trackingButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  trackingText: { color: colors.onSurface, flex: 1, fontSize: 13, fontWeight: "700" },
  mapPlaceholder: {
    height: 145,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  mapTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
});
