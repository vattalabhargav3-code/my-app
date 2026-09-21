import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
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

export function DriverHome({ token, onLogout }: { token: string; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState<Ride[]>([]);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    api<Ride[]>("/rides/mine", {}, token).then(setPosted).catch(() => undefined);
  }, [token]);

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
          <Field label="Starting point" value={form.start_point} onChangeText={update("start_point")} placeholder="e.g. Hyderabad LB Nagar" testID="ride-start-input" />
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
          posted.map((ride) => <RideCard key={ride.id} ride={ride} />)
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
});
