import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { api, Booking } from "@/src/api";
import { Button, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

export function ActiveBookingCard({ booking, token }: { booking: Booking; token: string }) {
  const [tracking, setTracking] = useState(false);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isWithinOneHour, setIsWithinOneHour] = useState(false);
  const [tripStatus, setTripStatus] = useState<string>("SCHEDULED");

  // ప్రయాణానికి 1 గంట లేదా అంతకంటే తక్కువ సమయం ఉందో లేదో తనిఖీ చేయడం
  useEffect(() => {
    const checkDepartureTime = () => {
      if (booking.ride?.departure_time) {
        const departure = new Date(booking.ride.departure_time).getTime();
        const now = new Date().getTime();
        const diffMinutes = Math.floor((departure - now) / (1000 * 60));

        // 60 నిమిషాల లోపు మరియు ప్రయాణం ఇంకా మొదలు కాకపోతే
        if (diffMinutes <= 60 && diffMinutes > 0) {
          setIsWithinOneHour(true);
        } else {
          setIsWithinOneHour(false);
        }
      }
    };

    checkDepartureTime();
    const interval = setInterval(checkDepartureTime, 60000); // ప్రతి నిమిషానికి చెక్ చేస్తుంది
    return () => clearInterval(interval);
  }, [booking.ride?.departure_time]);

  // లైవ్ ట్రాకింగ్ ఆన్ చేసినప్పుడు డ్రైవర్ లొకేషన్ పోలింగ్ చేయడం
  useEffect(() => {
    let poller: any;
    if (tracking && booking.ride?.id) {
      const fetchDriverLocation = async () => {
        try {
          const res = await api<{ latitude?: number; longitude?: number; status?: string }>(
            `/rides/${booking.ride.id}/track`,
            {},
            token
          );
          if (res?.latitude && res?.longitude) {
            setDriverCoords({ latitude: res.latitude, longitude: res.longitude });
          }
          if (res?.status) {
            setTripStatus(res.status);
          }
        } catch {
          // డ్రైవర్ ఇంకా జర్నీ ప్రారంభించకపోతే డీఫాల్ట్ స్టేటస్ చూపిస్తుంది
        }
      };

      fetchDriverLocation();
      poller = setInterval(fetchDriverLocation, 10000); // ప్రతి 10 సెకన్లకు డ్రైవర్ లొకేషన్ అప్‌డేట్
    }
    return () => clearInterval(poller);
  }, [tracking, booking.ride?.id, token]);

  const callEmergency = () => Linking.openURL("tel:112");

  const openGoogleMapsLive = () => {
    if (driverCoords) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${driverCoords.latitude},${driverCoords.longitude}`;
      Linking.openURL(url);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.ride.from)}`;
      Linking.openURL(url);
    }
  };

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

      {/* 1 Hour Reminder Banner */}
      {isWithinOneHour ? (
        <View style={styles.oneHourAlert}>
          <Icon name="clock-alert-outline" color="#F59E0B" size={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Departure in less than 1 hour!</Text>
            <Text style={styles.alertSubtitle}>
              Please reach your pickup point: <Text style={styles.highlightText}>{booking.ride.from}</Text>
            </Text>
          </View>
        </View>
      ) : null}

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
          <Text style={styles.totalText}>₹{booking.total}</Text>
        </View>
      </View>

      <Pressable onPress={() => setTracking((value) => !value)} style={styles.trackingButton} testID="toggle-tracking">
        <Icon name="map-marker-path" color={colors.brand} size={19} />
        <Text style={styles.trackingText}>{tracking ? "Hide live tracking" : "Show live trip tracking"}</Text>
        <Icon name={tracking ? "chevron-up" : "chevron-down"} color={colors.muted} size={18} />
      </Pressable>

      {tracking ? (
        <View style={styles.trackingContainer}>
          <View style={styles.mapPlaceholder}>
            <Icon name="crosshairs-gps" color={colors.brand} size={32} />
            <Text style={styles.mapTitle}>
              {tripStatus === "IN_TRANSIT" || driverCoords ? "Ride in Progress" : "Driver En Route / Scheduled"}
            </Text>
            <Text style={shared.mutedText}>
              {driverCoords
                ? `Driver Coordinates: ${driverCoords.latitude.toFixed(4)}, ${driverCoords.longitude.toFixed(4)}`
                : "Tracking link ready. Tap below to view live route."}
            </Text>

            <Pressable onPress={openGoogleMapsLive} style={styles.mapsLinkButton}>
              <Icon name="google-maps" color="#FFFFFF" size={16} />
              <Text style={styles.mapsLinkText}>Track Driver in Maps</Text>
            </Pressable>
          </View>

          <Button label="Emergency SOS · Call 112" onPress={triggerSos} tone="danger" testID="sos-button" />
        </View>
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
  oneHourAlert: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    borderWidth: 1,
  },
  alertTitle: { color: "#F59E0B", fontSize: 13, fontWeight: "800" },
  alertSubtitle: { color: colors.onSurface, fontSize: 12, marginTop: 2 },
  highlightText: { color: colors.brand, fontWeight: "700" },
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
  trackingContainer: { gap: 12 },
  mapPlaceholder: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  mapTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
  mapsLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 6,
  },
  mapsLinkText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
