import { useState } from "react";
import { Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Price Calculations (Base + Platform Fee + GST)
  const baseFare = ride.price;
  const platformFee = 15; // Platform convenience fee
  const taxableAmount = Math.max(0, baseFare + platformFee - discount);
  const gst = Math.round(taxableAmount * 0.05); // 5% GST
  const finalTotal = taxableAmount + gst;

  // Dynamic UPI URL based on final amount
  const upiId = "safarway@icici"; 
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=Safarway&am=${finalTotal}&cu=INR&tn=Ride Booking ${ride.from} to ${ride.to}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUrl)}`;

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "SAFAR50") {
      setDiscount(50);
      setCouponApplied(true);
      setError("");
    } else {
      setError("Invalid Coupon. Try 'SAFAR50'");
    }
  };

  const handlePayViaUpiApp = () => {
    Linking.openURL(upiPayUrl).catch(() => {
      alert("UPI app open కాలేదు. కింద ఉన్న QR కోడ్‌ని స్కాన్ చేసి పే చేయండి.");
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
            amount_paid: finalTotal,
            base_fare: baseFare,
            platform_fee: platformFee,
            gst_amount: gst,
            discount,
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
          <Text style={shared.eyebrow}>FARE BREAKDOWN</Text>
          <Text style={styles.title}>Checkout & Tax Invoice</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Icon name="close" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Bill Breakdown Box */}
      <View style={styles.billBox}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Base Seat Fare</Text>
          <Text style={styles.billVal}>₹{baseFare}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Platform & Safety Fee</Text>
          <Text style={styles.billVal}>+ ₹{platformFee}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: "#22C55E" }]}>Promo Discount (SAFAR50)</Text>
            <Text style={[styles.billVal, { color: "#22C55E" }]}>- ₹{discount}</Text>
          </View>
        )}
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Govt. GST (5%)</Text>
          <Text style={styles.billVal}>+ ₹{gst}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.billRow}>
          <Text style={styles.totalLabel}>Total Payable Amount</Text>
          <Text style={styles.totalVal}>₹{finalTotal}</Text>
        </View>
      </View>

      {/* Coupon Apply Box */}
      <View style={styles.couponRow}>
        <TextInput
          value={couponCode}
          onChangeText={(t) => setCouponCode(t.toUpperCase())}
          placeholder="Enter Promo Code (e.g. SAFAR50)"
          placeholderTextColor="#94A3B8"
          style={styles.couponInput}
          editable={!couponApplied}
        />
        <TouchableOpacity
          onPress={applyCoupon}
          disabled={couponApplied || !couponCode}
          style={[styles.applyBtn, couponApplied && styles.applyBtnDisabled]}
        >
          <Text style={styles.applyBtnText}>{couponApplied ? "Applied ✓" : "Apply"}</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Selection Options */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeTab, paymentMode === "upi" && styles.modeTabActive]}
          onPress={() => setPaymentMode("upi")}
        >
          <Icon name="qrcode-scan" size={16} color={paymentMode === "upi" ? "#0F172A" : colors.muted} />
          <Text style={[styles.modeTabText, paymentMode === "upi" && styles.modeTabTextActive]}>
            UPI / QR Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, paymentMode === "cash" && styles.modeTabActive]}
          onPress={() => setPaymentMode("cash")}
        >
          <Icon name="cash" size={16} color={paymentMode === "cash" ? "#0F172A" : colors.muted} />
          <Text style={[styles.modeTabText, paymentMode === "cash" && styles.modeTabTextActive]}>
            Cash on Boarding
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMode === "upi" ? (
        <View style={styles.upiContainer}>
          <View style={styles.qrWrapper}>
            <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
          </View>
          <TouchableOpacity onPress={handlePayViaUpiApp} style={styles.upiDirectBtn}>
            <Icon name="cellphone-check" size={18} color="#FFFFFF" />
            <Text style={styles.upiDirectBtnText}>Pay ₹{finalTotal} via PhonePe / GPay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cashNoticeBox}>
          <Icon name="alert-circle-outline" size={20} color="#FBBF24" />
          <Text style={styles.cashNoticeText}>
            Boarding సమయంలో డ్రైవర్‌కు ఖచ్చితమైన ₹{finalTotal} నగదు చెల్లించాల్సి ఉంటుంది.
          </Text>
        </View>
      )}

      <ErrorBanner message={error} />

      <Button
        label={paymentMode === "upi" ? `Pay ₹${finalTotal} & Confirm` : `Book with Cash (₹${finalTotal})`}
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
    padding: 18,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  billBox: {
    backgroundColor: "#1E293B",
    padding: 12,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  billVal: { color: "#F8FAFC", fontSize: 13, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 4 },
  totalLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  totalVal: { color: colors.brand, fontSize: 18, fontWeight: "900" },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1,
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  applyBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnDisabled: { backgroundColor: "#059669" },
  applyBtnText: { color: "#0F172A", fontSize: 12, fontWeight: "800" },
  modeSelector: { flexDirection: "row", backgroundColor: "#1E293B", borderRadius: 10, padding: 3, gap: 4 },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: { backgroundColor: colors.brand },
  modeTabText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  modeTabTextActive: { color: "#0F172A" },
  upiContainer: { alignItems: "center", gap: 8 },
  qrWrapper: { padding: 6, backgroundColor: "#FFFFFF", borderRadius: 10 },
  qrImage: { width: 130, height: 130 },
  upiDirectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    width: "100%",
    paddingVertical: 10,
    borderRadius: 10,
  },
  upiDirectBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  cashNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    padding: 10,
    borderRadius: 10,
  },
  cashNoticeText: { color: "#FBBF24", fontSize: 12, flex: 1 },
});
