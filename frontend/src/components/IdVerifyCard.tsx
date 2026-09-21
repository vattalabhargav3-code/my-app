import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api, errorMessage, User } from "@/src/api";
import { Button, ErrorBanner, Field, Icon, Segmented } from "@/src/components/ui";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";

const ID_TYPES = ["aadhaar", "pan", "dl"];
const idLabel = (type: string) => (type === "dl" ? "Driving licence" : type.toUpperCase());

export function IdVerifyCard({ token, user, onVerified }: { token: string; user: User; onVerified: () => void }) {
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyId = async () => {
    if (!idNumber.trim()) {
      setError("Enter your ID number to verify.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/me/verify-id", { method: "POST", body: JSON.stringify({ id_type: idType, id_number: idNumber }) }, token);
      onVerified();
    } catch (verifyError) {
      setError(errorMessage(verifyError, "Could not verify ID"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={shared.sectionHeading}>
        <Text style={shared.sectionTitle}>Your travel ID</Text>
        {user.id_verified ? (
          <View style={shared.rowCenter}>
            <Icon name="check-circle" color={colors.brand} size={15} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      {user.id_verified ? (
        <View style={styles.verifiedCard} testID="id-verified-card">
          <Icon name="shield-check" color={colors.brand} size={24} />
          <View style={shared.flex}>
            <Text style={shared.cardTitle}>Government ID verified</Text>
            <Text style={shared.mutedText}>You can now book any available seat.</Text>
          </View>
        </View>
      ) : (
        <View style={shared.card}>
          <View style={styles.intro}>
            <View style={shared.iconTile}>
              <Icon name="card-account-details-outline" color={colors.brand} size={21} />
            </View>
            <View style={shared.flex}>
              <Text style={shared.cardTitle}>Verify once, ride with trust</Text>
              <Text style={shared.mutedText}>Required before your first booking.</Text>
            </View>
          </View>
          <Segmented options={ID_TYPES} value={idType} onChange={setIdType} labelFor={idLabel} testIDPrefix="id-type" />
          <Field
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder={`Enter ${idType === "dl" ? "licence" : idType} number`}
            testID="id-number-input"
          />
          <ErrorBanner message={error} />
          <Button label="Verify government ID" onPress={verifyId} loading={loading} tone="soft" testID="verify-id-button" />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: "row", alignItems: "center", gap: 11 },
  verifiedText: { color: colors.brand, fontSize: 12, fontWeight: "800" },
  verifiedCard: {
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandSecondary,
    borderWidth: 1,
  },
});
