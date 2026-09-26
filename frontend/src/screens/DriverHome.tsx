import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errorMessage, Ride } from "@/src/api";
import { ScreenHeader } from "@/src/components/navigation";
import { RideCard } from "@/src/components/RideCard";
import { Button, ErrorBanner, Field, Icon, Segmented } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

const EMPTY_FORM = {
  driver_dl: "",
  driver_rc: "",
  start_point: "",
  end_point: "",
  stops: "",
  vehicle_type: "car",
  available_seats: "3",
  seat_price: "",
};

// GPS Coordinates helper function
const fetchDriverGPS = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

export function DriverHome({ token, onLogout }: { token: string; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState<Ride[]>([]);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [activeTrackingRideId, setActiveTrackingRideId] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    api<Ride[]>("/rides/mine", {}, token).then(setPosted).catch(() => undefined);
  }, [token]);

  // Clean up location watcher when unmounting
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      const coords = await fetchDriverGPS();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
      );
      const data = await res.json();
      const placeName =
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.display_name;

      if (placeName) {
        setForm((prev) => ({ ...prev, start_point: placeName }));
      }
    } catch {
      Alert.alert("GPS Error", "Location permission allow చేయండి లేదా GPS ఆన్ చేయండి.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const startLiveTracking = (rideId: string) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      Alert.alert("Error", "Geolocation is not supported on this browser.");
      return;
    }

    if (activeTrackingRideId === rideId) {
      // స్టాప్ ట్రాకింగ్
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setActiveTrackingRideId(null);
      Alert.alert("Trip Ended", "Live GPS tracking stopped.");
      return;
    }

    // స్టార్ట్ లైవ్ ట్రాకింగ్
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await api(
            `/rides/${rideId}/track`,
            {
              method: "POST",
              body: JSON.stringify({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                status: "IN_TRANSIT",
              }),
            },
            token
          );
        } catch {
          // Backend tracking endpoint silent update
        }
      },
      (err) => {
        console.warn("GPS tracking error:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    watchIdRef.current = id;
    setActiveTrackingRideId(rideId);
    Alert.alert("Trip Started", "Live GPS tracking is now broadcasting to your passengers!");
  };

  const postRide = async () => {
    setLoading(true);
    setError("");
    try {
      const ride = await api<Ride>(
        "/rides",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            available_seats: Number(form.available_seats),
            seat_price: Number(form.seat_price),
            mode: form.vehicle_type === "cab" ? "commercial" : "petrol_save",
          }),
        },
        token,
      );
      setPosted((current) => [ride, ...current]);
      setForm(EMPTY_FORM);
      Alert.alert("Ride published", "Passengers can now discover your route.");
    } catch (postError) {
      setError(errorMessage(postError, "Could not publish ride"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={shared.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="DRIVER MODE"
          title="Host your next ride."
          onLogout={onLogout}
          right={
            <View style={shared.iconTile}>
              <Icon name="steering" size={22} color={colors.brand} />
            </View>
          }
        />

        <View style={styles.summary}>
          <View>
            <Text style={shared.mutedText}>Your host profile</Text>
            <Text style={shared.cardTitle}>Verified route sharing</Text>
          </View>
          <View style={shared.rowCenter}>
            <Icon name="shield-check" color={colors.brand} size={16} />
            <Text style={shared.smallStrong}>Trust first</Text>
          </View>
        </View>

        <View style={shared.card}>
          <View>
            <Text style={shared.sectionTitle}>Publish a ride</Text>
            <Text style={shared.mutedText}>Add the details passengers need to feel ready.</Text>
          </View>
          <View style={styles.grid}>
            <View style={shared.flex}>
              <Field label="Driving licence" value={form.driver_dl} onChangeText={update("driver_dl")} placeholder="DL number" testID="driver-dl-input" />
            </View>
            <View style={shared.flex}>
              <Field label="Vehicle RC" value={form.driver_rc} onChangeText={update("driver_rc")} placeholder="RC number" testID="driver-rc-input" />
            </View>
          </View>

          <Field
            label="Starting point"
            value={form.start_point}
            onChangeText={update("start_point")}
            placeholder="e.g. Hyderabad LB Nagar"
            testID="ride-start-input"
          />

          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={detectingLocation}
            style={styles.gpsButton}
          >
            <Icon name="crosshairs-gps" size={15} color={colors.brand} />
            <Text style={styles.gpsButtonText}>
              {detectingLocation ? "Fetching GPS..." : "Use my current location as starting point"}
            </Text>
          </TouchableOpacity>

          <Field label="Destination" value={form.end_point} onChangeText={update("end_point")} placeholder="e.g. Vijayawada Benz Circle" testID="ride-end-input" />
          <Field label="En-route stops (optional)" value={form.stops} onChangeText={update("stops")} placeholder="Suryapet, Nalgonda" testID="ride-stops-input" />
          
          <Text style={shared.fieldLabel}>Vehicle type</Text>
          <Segmented options={["bike", "car", "cab"]} value={form.vehicle_type} onChange={update("vehicle_type")} testIDPrefix="vehicle" />
          
          <View style={styles.grid}>
            <View style={shared.flex}>
              <Field label="Seats available" value={form.available_seats} onChangeText={update("available_seats")} placeholder="3" keyboardType="number-pad" testID="ride-seats-input" />
            </View>
            <View style={shared.flex}>
              <Field label="Price per seat" value={form.seat_price} onChangeText={update("seat_price")} placeholder="₹ amount" keyboardType="number-pad" testID="ride-price-input" />
            </View>
          </View>
          
          <ErrorBanner message={error} />
          <Button label="Publish & accept bookings" onPress={postRide} loading={loading} testID="publish-ride-button" />
        </View>

        <Text style={[shared.sectionTitle, styles.postedHeading]}>Your published rides</Text>
        {posted.length ? (
          posted.map((ride) => (
            <View key={ride.id} style={styles.rideItemWrapper}>
              <RideCard ride={ride} />
              <TouchableOpacity
                onPress={() => startLiveTracking(ride.id)}
                style={[
                  styles.trackingActionBtn,
                  activeTrackingRideId === ride.id ? styles.trackingActiveBtn : null,
                ]}
              >
                <Icon
                  name={activeTrackingRideId === ride.id ? "stop-circle-outline" : "navigation-variant"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.trackingActionText}>
                  {activeTrackingRideId === ride.id ? "End Trip (Stop GPS)" : "Start Trip (Broadcast GPS)"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={shared.emptyCard}>
            <Icon name="road-variant" color={colors.muted} size={28} />
            <Text style={shared.cardTitle}>Your road starts here</Text>
            <Text style={shared.mutedText}>Published rides will appear in this space.</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  summary: {
    margin: 18,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.brandTertiary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grid: { flexDirection: "row", gap: 10 },
  postedHeading: { marginTop: 28, marginHorizontal: 18, marginBottom: 12 },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: -8,
    marginBottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#1E293B",
  },
  gpsButtonText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "600",
  },
  rideItemWrapper: {
    marginBottom: 12,
  },
  trackingActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 18,
    marginTop: -4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#059669",
  },
  trackingActiveBtn: {
    backgroundColor: "#DC2626",
  },
  trackingActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
