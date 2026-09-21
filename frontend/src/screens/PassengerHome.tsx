import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Booking, errorMessage, Ride, User } from "@/src/api";
import { ActiveBookingCard } from "@/src/components/ActiveBookingCard";
import { CheckoutSheet } from "@/src/components/CheckoutSheet";
import { IdVerifyCard } from "@/src/components/IdVerifyCard";
import { ScreenHeader } from "@/src/components/navigation";
import { RideCard } from "@/src/components/RideCard";
import { RideSearchPanel, SearchState } from "@/src/components/RideSearchPanel";
import { ErrorBanner, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

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

  // Refresh automatically when a filter chip or travel mode changes.
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

        <IdVerifyCard token={token} user={user} onVerified={() => onUserUpdate({ ...user, id_verified: true })} />

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
});
