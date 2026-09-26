import { useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api, Booking, errorMessage, Ride } from "@/src/api";
import { Button, ErrorBanner, Icon } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

interface CheckoutSheetProps {
  ride: Ride;
  token: string;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}

export function CheckoutSheet({ ride, token, onClose, onBooked }: CheckoutSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash">("upi");

  const totalAmount = ride.price;

  // మీ బిజినెస్ లేదా డ్రైవర్ UPI ఐడీ (ఉదాహరణకు safarway@upi)
  const upiId = "safarway@icici"; 
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=Safarway&am=${totalAmount}&cu=INR&tn=Ride Booking ${ride.from} to ${ride.to}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayUrl)}`;

  const handlePayViaUpiApp = () => {
    Linking.openURL(upiPayUrl).catch(() => {
      alert("UPI app open కాలేదు. దయచేసి కింద ఉన్న QR కోడ్‌ని స్కాన్ చేసి పే చేయండి.");
    });
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError("");
    try {
      const created = await api<Booking>(
        "/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            ride_id: ride.id,
            payment_type: paymentMode === "upi" ? "ONLINE_UPI" : "CASH",
            amount_paid: totalAmount,
          }),
        },
        token
      );
      onBooked(created);
    } catch (err) {
      setError(errorMessage(err, "Booking could not be completed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.header}>
        <View>
          <Text style={shared.eyebrow}>CONFIRM YOUR SEAT</Text>
          <Text style={styles.title}>Checkout & Payment</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Icon name="close" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Ride Details Summary */}
      <View style={styles.rideSummary}>
        <View style={styles.routeRow}>
          <Icon name="circle-slice-8" size={14} color={colors.brand} />
          <Text style={styles.routeText} numberOfLines={1}>{ride.from}</Text>
        </View>
        <View style={styles.routeRow}>
          <Icon name="map-marker" size={14} color="#EF4444" />
          <Text style={styles.routeText} numberOfLines={1}>{ride.to}</Text>
        </View>
        <View style={styles.summaryFooter}>
          <Text style={styles.summarySub}>Vehicle: {ride.vehicle} ({ride.type.toUpperCase()})</Text>
          <Text style={styles.amountText}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Payment Selection Options */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeTab, paymentMode === "upi" && styles.modeTabActive]}
          onPress={() => setPaymentMode("upi")}
        >
          <Icon name="qrcode-scan" size={16} color={paymentMode === "upi" ? "#0F172A" : colors.muted} />
          <Text style={[styles.modeTabText, paymentMode === "upi" && styles.modeTabTextActive]}>
            Instant UPI / QR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, paymentMode === "cash" && styles.modeTabActive]}
          onPress={() => setPaymentMode("cash")}
        >
          <Icon name="cash" size={16} color={paymentMode === "cash" ? "#0F172A" : colors.muted} />
          <Text style={[styles.modeTabText, paymentMode === "cash" && styles.modeTabTextActive]}>
            Pay Cash on Boarding
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMode === "upi" ? (
        <View style={styles.upiContainer}>
          <Text style={styles.upiInstructions}>
            Scan QR via PhonePe / GPay / Paytm or Tap Pay Button:
          </Text>

          {/* Dynamic Generated UPI QR Code */}
          <View style={styles.qrWrapper}>
            <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
          </View>

          <TouchableOpacity onPress={handlePayViaUpiApp} style={styles.upiDirectBtn}>
            <Icon name="cellphone-check" size={18} color="#FFFFFF" />
            <Text style={styles.upiDirectBtnText}>Pay ₹{totalAmount} via Installed UPI App</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cashNoticeBox}>
          <Icon name="alert-circle-outline" size={20} color="#FBBF24" />
          <Text style={styles.cashNoticeText}>
            Boarding సమయంలో డ్రైవర్‌కు ఖచ్చితమైన ₹{totalAmount} నగదు అందించాల్సి ఉంటుంది.
          </Text>
        </View>
      )}

      <ErrorBanner message={error} />

      <Button
        label={paymentMode === "upi" ? "Confirm & Generate Boarding OTP" : "Confirm Cash Booking"}
        onPress={handleConfirmBooking}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
  },
  rideSummary: {
    backgroundColor: "#1E293B",
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
  summaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  summarySub: {
    color: colors.muted,
    fontSize: 11,
  },
  amountText: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "900",
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: colors.brand,
  },
  modeTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  modeTabTextActive: {
    color: "#0F172A",
  },
  upiContainer: {
    alignItems: "center",
    gap: 10,
  },
  upiInstructions: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  upiDirectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
  },
  upiDirectBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  cashNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    padding: 12,
    borderRadius: 12,
  },
  cashNoticeText: {
    color: "#FBBF24",
    fontSize: 12,
    flex: 1,
  },
});
