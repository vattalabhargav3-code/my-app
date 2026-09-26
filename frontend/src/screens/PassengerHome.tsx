import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Booking, errorMessage, Ride, User } from "@/src/api";
import { ActiveBookingCard } from "@/src/components/ActiveBookingCard";
import { CheckoutSheet } from "@/src/components/CheckoutSheet";
import { IdVerifyCard } from "@/src/components/IdVerifyCard";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { ScreenHeader } from "@/src/components/navigation";
import { RideCard } from "@/src/components/RideCard";
import { RideSearchPanel, SearchState } from "@/src/components/RideSearchPanel";
import { ErrorBanner, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

// GPS Coordinates helper function
const fetchCurrentGPS = (): Promise<{ latitude: number; longitude: number }> => {
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

export function PassengerHome({
  token,
  user,
  onUserUpdate,
  onLogout,
}: {
  token: string;
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState<SearchState>({ mode: "commercial", vehicleType: "all", fromLocation: "", toLocation: "" });
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Map Picker State (Pickup or Destination)
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);

  // Persistent verification state check
  const isAlreadyVerified =
    user.id_verified ||
    (typeof window !== "undefined" && localStorage.getItem("safarway_passenger_verified") === "true");

  useEffect(() => {
    if (!user.id_verified && typeof window !== "undefined") {
      const savedVerification = localStorage.getItem("safarway_passenger_verified");
      if (savedVerification === "true") {
        onUserUpdate({ ...user, id_verified: true });
      }
    }
  }, [user, onUserUpdate]);

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      const coords = await fetchCurrentGPS();
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
        setSearch((prev) => ({ ...prev, fromLocation: placeName }));
      }
    } catch {
      alert("Location permission allow cheyandi leda GPS on cheyandi.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLocationPicked = (placeName: string) => {
    if (pickerTarget === "from") {
      setSearch((prev) => ({ ...prev, fromLocation: placeName }));
    } else if (pickerTarget === "to") {
      setSearch((prev) => ({ ...prev, toLocation: placeName }));
    }
    setPickerTarget(null);
  };

  const loadRides = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        from_location: search.fromLocation,
        to_location: search.toLocation,
        mode: search.mode,
        vehicle_type: search.vehicleType,
      });
      setRides(await api<Ride[]>(`/rides?${params.toString()}`, {}, token));
    } catch (loadError) {
      setError(errorMessage(loadError, "Could not load rides"));
    } finally {
      setLoading(false);
    }
  }, [search.fromLocation, search.toLocation, search.mode, search.vehicleType, token]);

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.mode, search.vehicleType]);

  useEffect(() => {
    api<Booking | null>("/bookings/active", {}, token).then((active) => active && setBooking(active)).catch(() => undefined);
  }, [token]);

  return (
    <View style={shared.screen}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          eyebrow="PASSENGER MODE"
          title="Where are you headed?"
          onLogout={onLogout}
          right={
            <View style={styles.secureBadge}>
              <Icon name="shield-check" size={16} color={colors.brand} />
              <Text style={styles.secureBadgeText}>Safe</Text>
            </View>
          }
        />

        <RideSearchPanel
          search={search}
          onChange={(patch) => setSearch((current) => ({ ...current, ...patch }))}
          onSearch={loadRides}
          loading={loading}
        />

        {/* Location Picker Quick Actions */}
        <View style={styles.gpsActionWrap}>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={detectingLocation}
            style={styles.actionBtn}
          >
            <Icon name="crosshairs-gps" size={15} color={colors.brand} />
            <Text style={styles.actionBtnText}>
              {detectingLocation ? "Detecting GPS..." : "Current Location"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPickerTarget("from")}
            style={styles.actionBtn}
          >
            <Icon name="map-marker-radius" size={15} color="#38BDF8" />
            <Text style={[styles.actionBtnText, { color: "#38BDF8" }]}>
              Pick Pickup on Map / Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPickerTarget("to")}
            style={styles.actionBtn}
          >
            <Icon name="map-marker-check" size={15} color="#FBBF24" />
            <Text style={[styles.actionBtnText, { color: "#FBBF24" }]}>
              Pick Drop on Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Okasari verify aithe e card malli kanapadadhu */}
        {!isAlreadyVerified ? (
          <IdVerifyCard
            token={token}
            user={user}
            onVerified={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("safarway_passenger_verified", "true");
              }
              onUserUpdate({ ...user, id_verified: true });
            }}
          />
        ) : null}

        {booking ? <ActiveBookingCard booking={booking} token={token} /> : null}

        <View style={[shared.sectionHeading, styles.ridesHeading]}>
          <Text style={shared.sectionTitle}>Rides for your route</Text>
          <Text style={styles.resultCount} testID="ride-count">{rides.length} found</Text>
        </View>
        <View style={styles.errorWrap}>
          <ErrorBanner message={error} />
        </View>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : rides.length ? (
          rides.map((ride) => <RideCard key={ride.id} ride={ride} onPress={() => setSelectedRide(ride)} />)
        ) : (
          <View style={shared.emptyCard}>
            <Icon name="map-search-outline" color={colors.muted} size={32} />
            <Text style={shared.cardTitle}>No rides match yet</Text>
            <Text style={shared.mutedText}>Try a different vehicle or route.</Text>
          </View>
        )}
      </ScrollView>

      {/* Map Picker Modal for Passenger */}
      <LocationPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleLocationPicked}
        title={pickerTarget === "from" ? "Select Pickup Location" : "Select Drop Location"}
      />

      <Modal visible={Boolean(selectedRide)} animationType="slide" transparent onRequestClose={() => setSelectedRide(null)}>
        <View style={styles.modalBackdrop}>
          {selectedRide ? (
            <CheckoutSheet
              ride={selectedRide}
              token={token}
              onClose={() => setSelectedRide(null)}
              onBooked={(created) => {
                setBooking(created);
                setSelectedRide(null);
                loadRides();
              }}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  secureBadge: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: colors.brandTertiary,
  },
  secureBadgeText: { color: colors.brand, fontSize: 11, fontWeight: "800" },
  ridesHeading: { marginTop: 26 },
  resultCount: { color: colors.muted, fontSize: 12 },
  errorWrap: { paddingHorizontal: 18 },
  loader: { marginTop: 26 },
  modalBackdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  gpsActionWrap: {
    paddingHorizontal: 18,
    marginTop: -4,
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  actionBtnText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "600",
  },
});
