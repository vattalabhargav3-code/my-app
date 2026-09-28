import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errorMessage, Ride } from "@/src/api";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { SafetySosModal } from "@/src/components/SafetySosModal";
import { RideCard } from "@/src/components/RideCard";
import { Button, ErrorBanner, Field, Icon, Segmented } from "@/src/components/ui";
import { UserMenuModal } from "@/src/components/UserMenuModal";

const EMPTY_FORM: Record<string, any> = {
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
  affiliation_badge: "Campus • Student",
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
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState<Ride[]>([]);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [activeTrackingRideId, setActiveTrackingRideId] = useState<string | null>(null);

  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(null);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [selectedSosRide, setSelectedSosRide] = useState<Ride | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDocFields, setShowDocFields] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "routes" | "earnings" | "profile">("dashboard");

  const watchIdRef = useRef<any>(null);

  const triggerDirectSos = () => {
    Alert.alert(
      "EMERGENCY & SAFETY SOS",
      "Emergency help kosam kindha unna number select cheyandi:",
      [
        { text: "🚓 Police (100)", onPress: () => Linking.openURL("tel:100") },
        { text: "🚑 Ambulance (108)", onPress: () => Linking.openURL("tel:108") },
        { text: "🚨 National Emergency (112)", onPress: () => Linking.openURL("tel:112") },
        { text: "📞 Customer Support", onPress: () => Linking.openURL("tel:8919326622") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const update = (key: string) => (value: any) => {
    setForm((current: any) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDl = localStorage.getItem("safarway_driver_dl");
      const savedRc = localStorage.getItem("safarway_driver_rc");
      if (savedDl || savedRc) {
        setForm((prev: any) => ({
          ...prev,
          driver_dl: savedDl || prev.driver_dl,
          driver_rc: savedRc || prev.driver_rc,
        }));
      } else {
        setShowDocFields(true);
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
        setForm((prev: any) => ({ ...prev, start_point: placeName }));
      }
    } catch {
      Alert.alert("GPS Error", "Location permission allow cheyandi leda GPS on cheyandi.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLocationPicked = (placeName: string) => {
    if (pickerTarget === "start") {
      setForm((prev: any) => ({ ...prev, start_point: placeName }));
    } else if (pickerTarget === "end") {
      setForm((prev: any) => ({ ...prev, end_point: placeName }));
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
    if (!form.driver_dl || !form.driver_rc) {
      setShowDocFields(true);
      setError("Please provide your Driving Licence & RC details.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const ride = await api<Ride>(
        "/rides",
        {
          method: "POST",
          body: JSON.stringify({
            driver_dl: form.driver_dl,
            driver_rc: form.driver_rc,
            start_point: form.start_point,
            end_point: form.end_point,
            stops: form.stops,
            departure_time: form.departure_time,
            vehicle_type: form.vehicle_type,
            available_seats: Number(form.available_seats),
            seat_price: Number(form.seat_price),
            women_only: Boolean(form.women_only),
            mode: form.vehicle_type === "cab" ? "commercial" : "petrol_save",
          }),
        },
        token
      );

      if (typeof window !== "undefined") {
        if (form.driver_dl) localStorage.setItem("safarway_driver_dl", form.driver_dl);
        if (form.driver_rc) localStorage.setItem("safarway_driver_rc", form.driver_rc);
      }

      setShowDocFields(false);
      setPosted((current) => [ride, ...current]);
      setForm((prev: any) => ({
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
  const hasSavedDocs = Boolean(form.driver_dl && form.driver_rc);

  return (
    <KeyboardAvoidingView style={styles.whiteScreen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 90 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HEADER */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.brandTitle}>
              CAPTAIN <Text style={styles.brandAccent}>HUB</Text>
            </Text>
            <Text style={styles.brandTagline}>Host & Share Fuel Costs</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={triggerDirectSos} style={styles.sosButton}>
              <Icon name="shield-alert" size={13} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>

            <View style={styles.steeringBadge}>
              <Icon name="steering" size={16} color="#0284C7" />
            </View>

            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuCircleBtn}>
              <Icon name="menu" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. REWARD PROGRESS CARD */}
        <View style={styles.rewardCardWhite}>
          <View style={styles.rewardHeader}>
            <View style={styles.rewardBadge}>
              <Icon name="gas-station" size={16} color="#D97706" />
              <Text style={styles.rewardBadgeText}>WEEKLY FUEL REWARD</Text>
            </View>
            <Text style={styles.rewardAmount}>Win ₹500 Petrol</Text>
          </View>
          <Text style={styles.rewardDesc}>
            Ee varam 10 shared rides poorthi cheyandi, direct ₹500 fuel coupon pondandi!
          </Text>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.rewardStatsRow}>
            <Text style={styles.statCompleted}>{completedCount} of 10 Completed</Text>
            <Text style={styles.statRemaining}>
              {weeklyTarget - completedCount > 0
                ? `${weeklyTarget - completedCount} more to unlock`
                : "🎉 ₹500 Coupon Unlocked!"}
            </Text>
          </View>
        </View>

        {/* 3. PUBLISH RIDE FORM */}
        <View style={styles.formWhiteCard}>
          <Text style={styles.formCardTitle}>Publish a Shared Route</Text>
          <Text style={styles.formCardSubtitle}>Choose your schedule and invite verified co-riders.</Text>

          <Field
            label="College / Company Badge"
            value={form.affiliation_badge}
            onChangeText={update("affiliation_badge")}
            placeholder="e.g. Campus • JNTU or Corporate • Hitec City"
          />

          {/* DRIVER DOCUMENTS SUMMARY / EDIT TOGGLE */}
          {hasSavedDocs && !showDocFields ? (
            <View style={styles.docsSummaryCard}>
              <View style={styles.docsSummaryLeft}>
                <View style={styles.docCheckIconWrap}>
                  <Icon name="shield-check" size={16} color="#059669" />
                </View>
                <View>
                  <Text style={styles.docsSummaryTitle}>Documents Verified & Saved</Text>
                  <Text style={styles.docsSummarySubtitle}>
                    DL: {form.driver_dl ? `${form.driver_dl.slice(0, 4)}••••` : ""} | RC:{" "}
                    {form.driver_rc ? `${form.driver_rc.slice(0, 4)}••••` : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowDocFields(true)}
                style={styles.editDocBtn}
              >
                <Icon name="pencil-outline" size={13} color="#0284C7" />
                <Text style={styles.editDocBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.docInputWrap}>
              <View style={styles.gridRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Driving Licence"
                    value={form.driver_dl}
                    onChangeText={update("driver_dl")}
                    placeholder="DL number"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Vehicle RC"
                    value={form.driver_rc}
                    onChangeText={update("driver_rc")}
                    placeholder="RC number"
                  />
                </View>
              </View>
              {hasSavedDocs && (
                <TouchableOpacity
                  onPress={() => setShowDocFields(false)}
                  style={styles.hideDocBtn}
                >
                  <Text style={styles.hideDocBtnText}>✓ Keep Saved Documents</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Field
            label="Departure Date & Time"
            value={form.departure_time}
            onChangeText={update("departure_time")}
            placeholder="e.g. Tomorrow 08:30 AM"
          />

          <Field
            label="Starting Point"
            value={form.start_point}
            onChangeText={update("start_point")}
            placeholder="e.g. Hyderabad LB Nagar"
          />

          <View style={styles.locationPillsWrap}>
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              disabled={detectingLocation}
              style={styles.pillActionBtn}
            >
              <Icon name="crosshairs-gps" size={13} color="#0284C7" />
              <Text style={styles.pillActionText}>
                {detectingLocation ? "Detecting GPS..." : "Current GPS"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPickerTarget("start")} style={styles.pillActionBtn}>
              <Icon name="map-marker-radius" size={13} color="#059669" />
              <Text style={[styles.pillActionText, { color: "#059669" }]}>Pick on Map</Text>
            </TouchableOpacity>
          </View>

          <Field
            label="Destination"
            value={form.end_point}
            onChangeText={update("end_point")}
            placeholder="e.g. Vijayawada Benz Circle"
          />

          <View style={styles.locationPillsWrap}>
            <TouchableOpacity onPress={() => setPickerTarget("end")} style={styles.pillActionBtn}>
              <Icon name="map-marker-check" size={13} color="#D97706" />
              <Text style={[styles.pillActionText, { color: "#D97706" }]}>Pick Destination on Map</Text>
            </TouchableOpacity>
          </View>

          <Field
            label="En-route Stops (optional)"
            value={form.stops}
            onChangeText={update("stops")}
            placeholder="e.g. Suryapet, Nalgonda bypass"
          />

          <Text style={styles.fieldHeaderLabel}>Vehicle Type</Text>
          <Segmented
            options={["bike", "car", "cab"]}
            value={form.vehicle_type}
            onChange={update("vehicle_type")}
            testIDPrefix="driver-vehicle"
          />

          <Text style={[styles.fieldHeaderLabel, { marginTop: 14 }]}>Ride Atmosphere (Vibe)</Text>
          <View style={styles.vibeGrid}>
            {[
              { id: "music", label: "🎵 Music Lover" },
              { id: "silent", label: "🎧 Quiet Commute" },
              { id: "chitchat", label: "☕ Friendly Chat" },
            ].map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => update("ride_vibe")(v.id)}
                style={[styles.vibeCard, form.ride_vibe === v.id && styles.vibeCardActive]}
              >
                <Text style={[styles.vibeCardText, form.ride_vibe === v.id && styles.vibeCardTextActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gridRow}>
            <View style={{ flex: 1 }}>
              <Field
                label="Seats Available"
                value={form.available_seats}
                onChangeText={update("available_seats")}
                placeholder="3"
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Price Per Seat"
                value={form.seat_price}
                onChangeText={update("seat_price")}
                placeholder="₹ amount"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.womenSafetyBox}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.womenBoxHeader}>
                <Icon name="face-woman" size={17} color="#DB2777" />
                <Text style={styles.womenBoxTitle}>Women Only Ride</Text>
              </View>
              <Text style={styles.womenBoxSubtitle}>Only verified female passengers can book this ride</Text>
            </View>
            <Switch
              value={Boolean(form.women_only)}
              onValueChange={update("women_only")}
              trackColor={{ false: "#E2E8F0", true: "#F472B6" }}
              thumbColor={form.women_only ? "#DB2777" : "#FFFFFF"}
            />
          </View>

          <ErrorBanner message={error} />
          <Button
            label="Publish & Accept Passengers"
            onPress={postRide}
            loading={loading}
            testID="publish-ride-button"
          />
        </View>

        {/* 4. PUBLISHED RIDES */}
        <View style={styles.publishedHeaderWrap}>
          <Text style={styles.publishedHeading}>Your Active Hosted Rides</Text>
          <Text style={styles.hostedCountBadge}>{posted.length} active</Text>
        </View>

        {posted.length ? (
          posted.map((ride) => (
            <View key={ride.id} style={styles.driverRideWrap}>
              <RideCard ride={ride} />

              <View style={styles.driverButtonActionsRow}>
                <TouchableOpacity
                  onPress={() => startLiveTracking(ride.id)}
                  style={[
                    styles.driverLiveTrackBtn,
                    activeTrackingRideId === ride.id && styles.driverLiveTrackBtnStop,
                  ]}
                >
                  <Icon
                    name={activeTrackingRideId === ride.id ? "stop-circle-outline" : "navigation-variant"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.driverBtnText}>
                    {activeTrackingRideId === ride.id ? "End Live Trip" : "Start Live Trip"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openDriverSos(ride)} style={styles.driverSosBtn}>
                  <Icon name="shield-alert" size={16} color="#FFFFFF" />
                  <Text style={styles.driverBtnText}>Safety SOS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyWhiteCard}>
            <Icon name="road-variant" color="#94A3B8" size={36} />
            <Text style={styles.emptyTitle}>No scheduled rides yet</Text>
            <Text style={styles.emptySubtitle}>
