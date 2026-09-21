import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api, Booking, errorMessage, Ride } from "@/src/api";
import { Button, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

const SEAT_OPTIONS = ["Seat 1 · front", "Seat 2 · back left", "Seat 3 · back middle", "Seat 4 · back right"];

export function CheckoutSheet({
  ride,
  token,
  onClose,
  onBooked,
}: {
  ride: Ride;
  token: string;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}) {
  const [seat, setSeat] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = Math.max(0, ride.price - discount);
  const seats = SEAT_OPTIONS.slice(0, Math.min(ride.seats_left, SEAT_OPTIONS.length));

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "WEEKLY50") {
      setDiscount(50);
      setError("");
    } else {
      setError("That code is not valid. Try WEEKLY50.");
    }
  };

  const confirm = async () => {
    if (!seat) {
      setError("Choose a seat to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await api<Booking>(`/rides/${ride.id}/book`, { method: "POST", body: JSON.stringify({ seat, coupon }) }, token);
      onBooked(created);
    } catch (bookingError) {
      setError(errorMessage(bookingError, "Could not confirm booking"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.sheet} testID="checkout-sheet">
      <View style={styles.handle} />
      <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={shared.flex}>
          <Text style={shared.eyebrow}>SECURE CHECKOUT</Text>
          <Text style={styles.title}>{ride.from} to {ride.to}</Text>
          <Text style={shared.mutedText}>{ride.driver_name} · {ride.vehicle}</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton} testID="checkout-close">
          <Icon name="close" size={20} color={colors.onSurfaceSecondary} />
        </Pressable>
      </View>

      <Text style={shared.fieldLabel}>Choose your seat</Text>
      <View style={styles.seatGrid}>
        {seats.map((option, index) => {
          const active = seat === option;
          return (
            <Pressable
              key={option}
              testID={`seat-option-${index + 1}`}
              onPress={() => setSeat(option)}
              style={[styles.seat, active && styles.seatActive]}
            >
              <Icon name="seat-outline" color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary} size={22} />
              <Text style={[styles.seatText, active && styles.seatTextActive]}>{option.replace(" · ", "\n")}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.couponRow}>
        <TextInput
          testID="coupon-input"
          value={coupon}
          onChangeText={setCoupon}
          placeholder="Coupon code"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          style={[shared.input, shared.flex]}
        />
        <Pressable onPress={applyCoupon} style={styles.applyButton} testID="apply-coupon">
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={shared.mutedText}>Base fare</Text>
          <Text style={styles.summaryText}>₹{ride.price}</Text>
        </View>
        {discount ? (
          <View style={styles.summaryRow}>
            <Text style={shared.brandText}>WEEKLY50 discount</Text>
            <Text style={shared.brandText} testID="discount-amount">-₹{discount}</Text>
          </View>
        ) : null}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total payable</Text>
          <Text style={shared.totalText} testID="checkout-total">₹{total}</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Icon name="lock-outline" color={colors.info} size={18} />
        <Text style={styles.noticeText}>Secure payment confirmation is ready for your provider account.</Text>
      </View>
      {error ? <Text style={styles.errorText} testID="checkout-error">{error}</Text> : null}

      <View style={styles.actions}>
        <Button label="Cancel" tone="soft" onPress={onClose} />
        <Button label={`Pay ₹${total} & book`} onPress={confirm} loading={loading} testID="confirm-booking-button" />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    maxHeight: "90%",
    paddingTop: 20,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderColor: colors.border,
    borderWidth: 1,
    gap: 16,
  },
  sheetContent: { padding: 20, paddingTop: 0, paddingBottom: Platform.OS === "ios" ? 34 : 22, gap: 16 },
  handle: { width: 42, height: 4, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between" },
  title: { color: colors.onSurface, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  seatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  seat: {
    width: "48%",
    minHeight: 66,
    padding: 10,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surfaceTertiary,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  seatActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  seatText: { color: colors.onSurfaceSecondary, fontSize: 11, fontWeight: "700", flexShrink: 1 },
  seatTextActive: { color: colors.onBrandPrimary },
  couponRow: { flexDirection: "row", gap: 8 },
  applyButton: {
    minWidth: 72,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  applyText: { color: colors.brand, fontSize: 12, fontWeight: "800" },
  summary: { padding: 14, borderRadius: 14, backgroundColor: colors.surfaceTertiary, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryText: { color: colors.onSurface, fontSize: 13, fontWeight: "700" },
  summaryDivider: { height: 1, backgroundColor: colors.border },
  totalLabel: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  notice: { flexDirection: "row", alignItems: "center", gap: 8 },
  noticeText: { color: colors.onSurfaceTertiary, fontSize: 11, flex: 1, lineHeight: 16 },
  errorText: { color: colors.error, fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
});
