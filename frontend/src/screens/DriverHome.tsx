import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errorMessage, Ride } from "@/src/api";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { SafetySosModal } from "@/src/components/SafetySosModal";
import { ScreenHeader } from "@/src/components/navigation";
import { RideCard } from "@/src/components/RideCard";
import { Button, ErrorBanner, Field, Icon, Segmented } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

interface DriverFormState {
  driver_dl: string;
  driver_rc: string;
  start_point: string;
  end_point: string;
  stops: string;
  departure_time: string;
  vehicle_type: string;
  available_seats: string;
  seat_price: string;
  women_only: boolean;
  ride_vibe: string;
  affiliation_badge: string;
}

const EMPTY_FORM: DriverFormState = {
  driver_dl: "",
  driver_rc: "",
  start_point: "",
  end_point: "",
  stops: "",
  departure_time: "",
  vehicle_type: "car",
  available_seats: "3",
  seat_price: "",
  women_only: false,
  ride_vibe: "music",
  affiliation_badge: "Campus Verified • Student",
};

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
  const [form, setForm] = useState<DriverFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState<Ride[]>([]);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [activeTrackingRideId, setActiveTrackingRideId] = useState<string | null>(null);

  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(null);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [selectedSosRide, setSelectedSosRide] = useState<Ride | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const update = (key: keyof DriverFormState) => (value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDl = localStorage.getItem("safarway_driver_dl");
      const savedRc = localStorage.getItem("safarway_driver_rc");
      if (savedDl || savedRc) {
        setForm((prev) => ({
          ...prev,
          driver_dl: savedDl || prev.driver_dl,
          driver_rc: savedRc || prev.driver_rc,
        }));
      }
    }
  }, []);

  useEffect(() => {
    api<Ride[]>("/rides/mine", {}, token).then(setPosted).catch(() => undefined);
  }, [token]);

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

  const handleLocationPicked = (placeName: string) => {
    if (pickerTarget === "start") {
      setForm((prev) => ({ ...prev, start_point: placeName }));
    } else if (pickerTarget === "end") {
      setForm((prev) => ({ ...prev, end_point: placeName }));
    }
    setPickerTarget(null);
  };

  const startLiveTracking = (rideId: string) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      Alert.alert("Error", "Geolocation is not supported on this browser.");
      return;
    }

    if (activeTrackingRideId === rideId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setActiveTrackingRideId(null);
      Alert.alert("Trip Ended", "Live GPS tracking stopped.");
      return;
    }

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
        } catch {}
      },
      (err) => console.warn("GPS tracking error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = id;
    setActiveTrackingRideId(rideId);
    Alert.alert("Trip Started", "Live GPS tracking is broadcasting to your passengers!");
  };

  const openDriverSos = (ride: Ride) => {
    setSelectedSosRide(ride);
    setSosModalVisible(true);
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

      if (typeof window !== "undefined") {
        if (form.driver_dl) localStorage.setItem("safarway_driver_dl", form.driver_dl);
        if (form.driver_rc) localStorage.setItem("safarway_driver_rc", form.driver_rc);
      }

      setPosted((current) => [ride, ...current]);
      setForm((prev) => ({
        ...EMPTY_FORM,
        driver_dl: prev.driver_dl,
        driver_rc: prev.driver_rc,
      }));
      Alert.alert("Ride published", "Passengers can now discover your scheduled route.");
    } catch (postError) {
      setError(errorMessage(postError, "Could not publish ride"));
    } finally {
      setLoading(false);
    }
  };

  const weeklyTarget = 10;
  const completedCount = Math.min(posted.length, weeklyTarget);
  const progressPercent = (completedCount / weeklyTarget) * 100;

  return (
    <KeyboardAvoidingView style={shared.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="DRIVER DASHBOARD"
          title="Host & Earn Fuel Rewards"
          onLogout={onLogout}
          right={
            <View style={shared.iconTile}>
              <Icon name="steering" size={22} color={colors.brand} />
            </View>
          }
        />

        {/* Weekly Petrol Card */}
        <View style={styles.petrolCard}>
          <View style={styles.petrolHeader}>
            <View style={styles.petrolBadge}>
              <Icon name="gas-station" size={18} color="#FBBF24" />
              <Text style={styles.petrolBadgeText}>WEEKLY FUEL BONUS</Text>
            </View>
            <Text style={styles.rewardText}>Win ₹500 Free Petrol</Text>
          </View>
          <Text style={styles.petrolDesc}>
            ఈ వారం 10 రైడ్స్ పూర్తి చేయండి, ₹500 ఉచిత పెట్రోల్ కూపన్ పొందండి!
          </Text>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.statText}>{completedCount} of 10 Completed</Text>
            <Text style={styles.statTextRemaining}>
              {weeklyTarget - completedCount > 0
                ? `${weeklyTarget - completedCount} more rides to unlock`
                : "🎉 Unlocked ₹500 Coupon!"}
            </Text>
          </View>
        </View>

        <View style={shared.card}>
          <View>
            <Text style={shared.sectionTitle}>Publish a ride</Text>
            <Text style={shared.mutedText}>Schedule a route from anywhere at your chosen time.</Text>
          </View>

          <Field
            label="College / Company Badge"
            value={form.affiliation_badge}
            onChangeText={update("affiliation_badge")}
            placeholder="e.g. Campus • JNTU or Corporate • Hitec City"
          />

          <View style={styles.grid}>
            <View style={shared.flex}>
              <Field label="Driving licence" value={form.driver_dl} onChangeText={update("driver_dl")} placeholder="DL number" />
            </View>
            <View style={shared.flex}>
              <Field label="Vehicle RC" value={form.driver_rc} onChangeText={update("driver_rc")} placeholder="RC number" />
            </View>
          </View>

          <Field
            label="Departure date & time"
            value={form.departure_time}
            onChangeText={update("departure_time")}
            placeholder="e.g. Tomorrow 07:30 AM"
          />

          <Field
            label="Starting point"
            value={form.start_point}
            onChangeText={update("start_point")}
            placeholder="e.g. Hyderabad LB Nagar"
          />

          <View style={styles.locationHelpers}>
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              disabled={detectingLocation}
              style={styles.gpsButton}
            >
              <Icon name="crosshairs-gps" size={14} color={colors.brand} />
              <Text style={styles.gpsButtonText}>
                {detectingLocation ? "Fetching..." : "Current GPS"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPickerTarget("start")}
              style={styles.mapPickButton}
            >
              <Icon name="map-marker-radius" size={14} color="#38BDF8" />
              <Text style={styles.mapPickButtonText}>Pick on Map / Search</Text>
            </TouchableOpacity>
          </View>

          <Field
            label="Destination"
            value={form.end_point}
            onChangeText={update("end_point")}
            placeholder="e.g. Vijayawada Benz Circle"
          />

          <View style={styles.locationHelpers}>
            <TouchableOpacity
              onPress={() => setPickerTarget("end")}
              style={styles.mapPickButton}
            >
              <Icon name="map-marker-radius" size={14} color="#38BDF8" />
              <Text style={styles.mapPickButtonText}>Pick Destination on Map</Text>
            </TouchableOpacity>
          </View>

          <Field label="En-route stops (optional)" value={form.stops} onChangeText={update("stops")} placeholder="Suryapet, Nalgonda" />
          
          <Text style={shared.fieldLabel}>Vehicle type</Text>
          <Segmented options={["bike", "car", "cab"]} value={form.vehicle_type} onChange={update("vehicle_type")} testIDPrefix="vehicle" />

          {/* Ride Vibe Picker */}
          <Text style={[shared.fieldLabel, { marginTop: 10 }]}>Ride Vibe</Text>
          <View style={styles.vibeSelector}>
            {[
              { id: "music", label: "🎵 Music Lover" },
              { id: "silent", label: "🎧 Silent Work" },
              { id: "chitchat", label: "☕ Chit-Chat" },
            ].map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => update("ride_vibe")(v.id)}
                style={[
                  styles.vibeOption,
                  form.ride_vibe === v.id && styles.vibeOptionActive,
                ]}
              >
                <Text style={[styles.vibeOptionText, form.ride_vibe === v.id && styles.vibeOptionTextActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.grid}>
            <View style={shared.flex}>
              <Field label="Seats available" value={form.available_seats} onChangeText={update("available_seats")} placeholder="3" keyboardType="number-pad" />
            </View>
            <View style={shared.flex}>
              <Field label="Price per seat" value={form.seat_price} onChangeText={update("seat_price")} placeholder="₹ amount" keyboardType="number-pad" />
            </View>
          </View>

          {/* Women Only Pool Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <View style={styles.toggleTitleWrap}>
                <Icon name="face-woman" size={18} color="#EC4899" />
                <Text style={styles.toggleTitle}>Women Only Ride</Text>
              </View>
              <Text style={styles.toggleSubtitle}>Only female passengers will be allowed to book</Text>
            </View>
            <Switch
              value={form.women_only}
              onValueChange={update("women_only")}
              trackColor={{ false: "#334155", true: "#EC4899" }}
              thumbColor={form.women_only ? "#FFFFFF" : "#94A3B8"}
            />
          </View>
          
          <ErrorBanner message={error} />
          <Button label="Publish & accept bookings" onPress={postRide} loading={loading} testID="publish-ride-button" />
        </View>

        <Text style={[shared.sectionTitle, styles.postedHeading]}>Your published rides</Text>
        {posted.length ? (
          posted.map((ride) => (
            <View key={ride.id} style={styles.rideItemWrapper}>
              <RideCard ride={ride} />
              
              <View style={styles.driverActionsRow}>
                <TouchableOpacity
                  onPress={() => startLiveTracking(ride.id)}
                  style={[
                    styles.trackingActionBtn,
                    activeTrackingRideId === ride.id ? styles.trackingActiveBtn : null,
                  ]}
                >
                  <Icon
                    name={activeTrackingRideId === ride.id ? "stop-circle-outline" : "navigation-variant"}
                    size={17}
                    color="#FFFFFF"
                  />
                  <Text style={styles.trackingActionText}>
                    {activeTrackingRideId === ride.id ? "End Trip" : "Start Trip"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openDriverSos(ride)}
                  style={styles.driverSosBtn}
                >
                  <Icon name="shield-alert" size={17} color="#FFFFFF" />
                  <Text style={styles.driverSosText}>Safety SOS</Text>
                </TouchableOpacity>
              </View>
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

      <LocationPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleLocationPicked}
        title={pickerTarget === "start" ? "Select Starting Point" : "Select Destination"}
      />

      {selectedSosRide ? (
        <SafetySosModal
          visible={sosModalVisible}
          onClose={() => {
            setSosModalVisible(false);
            setSelectedSosRide(null);
          }}
          booking={{
            id: selectedSosRide.id,
            total: selectedSosRide.price,
            discount: 0,
            boarding_otp: "DRIVER",
            seat: "DRIVER_SEAT",
            ride: selectedSosRide,
          }}
          token={token}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  petrolCard: {
    margin: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#FBBF24",
    gap: 8,
  },
  petrolHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  petrolBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  petrolBadgeText: { color: "#FBBF24", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  rewardText: { color: "#22C55E", fontSize: 13, fontWeight: "800" },
  petrolDesc: { color: "#E2E8F0", fontSize: 12, lineHeight: 17 },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#334155",
    overflow: "hidden",
    marginTop: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FBBF24",
    borderRadius: 4,
  },
  progressStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  statText: { color: "#94A3B8", fontSize: 11, fontWeight: "600" },
  statTextRemaining: { color: "#38BDF8", fontSize: 11, fontWeight: "700" },
  grid: { flexDirection: "row", gap: 10 },
  postedHeading: { marginTop: 24, marginHorizontal: 18, marginBottom: 12 },
  locationHelpers: { flexDirection: "row", gap: 8, marginTop: -8, marginBottom: 14 },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  gpsButtonText: { color: colors.brand, fontSize: 12, fontWeight: "600" },
  mapPickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  mapPickButtonText: { color: "#38BDF8", fontSize: 12, fontWeight: "600" },
  vibeSelector: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  vibeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  vibeOptionActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  vibeOptionText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  vibeOptionTextActive: {
    color: "#0F172A",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  toggleTextWrap: { flex: 1, paddingRight: 8 },
  toggleTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  toggleSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  rideItemWrapper: { marginBottom: 14 },
  driverActionsRow: { flexDire
