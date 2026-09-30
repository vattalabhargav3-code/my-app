import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "@/src/components/ui";
import { colors } from "@/src/theme";

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (placeName: string, lat: number, lon: number) => void;
  title?: string;
}

const POPULAR_HUBS = [
  { name: "Hitec City", lat: 17.4435, lon: 78.3772 },
  { name: "Madhapur", lat: 17.4483, lon: 78.3915 },
  { name: "Gachibowli", lat: 17.4401, lon: 78.3489 },
  { name: "Kondapur", lat: 17.4699, lon: 78.3578 },
  { name: "Kukatpally", lat: 17.4947, lon: 78.3996 },
  { name: "Jubilee Hills", lat: 17.4319, lon: 78.4073 },
  { name: "Secunderabad", lat: 17.4399, lon: 78.4983 },
  { name: "LB Nagar", lat: 17.3457, lon: 78.5522 },
  { name: "Ameerpet", lat: 17.4375, lon: 78.4482 },
];

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  title = "Select Location",
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [centerCoords, setCenterCoords] = useState({ lat: 17.4435, lon: 78.3772 }); // Default Hitec City, Hyderabad
  const [pickedAddress, setPickedAddress] = useState("Hitec City, Hyderabad");
  const [fetchingAddress, setFetchingAddress] = useState(false);

  // Clean locality helper (Ward numbers & unnecessary state codes ni remove chesthundi)
  const formatCleanName = (item: any) => {
    const addr = item.address || {};
    const mainArea =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.commercial ||
      addr.industrial ||
      item.name ||
      item.display_name.split(",")[0];

    const city = addr.city || addr.town || addr.county || "Hyderabad";
    return `${mainArea}, ${city}`;
  };

  // Search places via typing focused strictly on Hyderabad & Telugu states
  const searchPlaces = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // viewbox coordinates limit priority to Hyderabad and surrounding corridors
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          text.trim()
        )}&format=json&addressdetails=1&limit=6&countrycodes=in&viewbox=78.15,17.15,78.68,17.62&bounded=0`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        const cleaned = data.map((item) => ({
          ...item,
          cleanName: formatCleanName(item),
        }));
        setResults(cleaned);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Reverse geocode when coordinates change
  const updateAddressFromCoords = async (lat: number, lon: number) => {
    setFetchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await res.json();
      const clean = formatCleanName(data);
      setPickedAddress(clean);
    } catch {
      setPickedAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setFetchingAddress(false);
    }
  };

  useEffect(() => {
    if (visible) {
      updateAddressFromCoords(centerCoords.lat, centerCoords.lon);
    }
  }, [visible]);

  const handleSelectFromList = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const displayName = item.cleanName || formatCleanName(item);

    setCenterCoords({ lat, lon });
    setPickedAddress(displayName);
    setQuery("");
    setResults([]);
    onSelect(displayName, lat, lon);
    onClose();
  };

  const handleSelectQuickHub = (hub: { name: string; lat: number; lon: number }) => {
    setCenterCoords({ lat: hub.lat, lon: hub.lon });
    setPickedAddress(`${hub.name}, Hyderabad`);
    onSelect(`${hub.name}, Hyderabad`, hub.lat, hub.lon);
    onClose();
  };

  const handleConfirmPicked = () => {
    if (pickedAddress) {
      onSelect(pickedAddress, centerCoords.lat, centerCoords.lon);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Search area (e.g. Hitec City, Madhapur, LB Nagar)..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={searchPlaces}
            />
            {loading && <ActivityIndicator size="small" color={colors.brand} />}
          </View>

          {/* Autocomplete Results Dropdown */}
          {results.length > 0 && (
            <View style={styles.resultsList}>
              <FlatList
                data={results}
                keyExtractor={(item, idx) => item.place_id ? item.place_id.toString() : idx.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectFromList(item)}
                  >
                    <Icon name="map-marker-outline" size={18} color={colors.brand} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultText} numberOfLines={1}>
                        {item.cleanName}
                      </Text>
                      <Text style={styles.subResultText} numberOfLines={1}>
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Popular Areas Quick Chips (Always accessible when not searching) */}
          {results.length === 0 && (
            <View style={styles.quickHubWrap}>
              <Text style={styles.quickHubTitle}>FREQUENT HUBS & CORRIDORS</Text>
              <View style={styles.hubChipsContainer}>
                {POPULAR_HUBS.map((hub) => (
                  <TouchableOpacity
                    key={hub.name}
                    onPress={() => handleSelectQuickHub(hub)}
                    style={styles.hubChip}
                    activeOpacity={0.8}
                  >
                    <Icon name="map-marker" size={12} color="#0284C7" />
                    <Text style={styles.hubChipText}>{hub.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Interactive Live Map Frame */}
          <View style={styles.mapBox}>
            <iframe
              title="map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerCoords.lon - 0.015}%2C${centerCoords.lat - 0.015}%2C${centerCoords.lon + 0.015}%2C${centerCoords.lat + 0.015}&layer=mapnik&marker=${centerCoords.lat}%2C${centerCoords.lon}`}
              style={{ width: "100%", height: "100%", border: "none", borderRadius: 12 }}
            />
            <View style={styles.centerPinWrap} pointerEvents="none">
              <Icon name="map-marker" size={36} color="#EF4444" />
            </View>
          </View>

          {/* Selected Address Display & Confirm */}
          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedLabel}>Selected Location:</Text>
              <Text style={styles.selectedAddress} numberOfLines={1}>
                {fetchingAddress ? "Detecting area name..." : pickedAddress || "Choose locality"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleConfirmPicked}
              disabled={fetchingAddress || !pickedAddress}
              style={[styles.confirmBtn, (!pickedAddress || fetchingAddress) && { opacity: 0.6 }]}
            >
              <Text style={styles.confirmBtnText}>Confirm Location ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "88%",
    minHeight: 520,
    gap: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  closeBtn: { padding: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  input: { flex: 1, color: "#FFFFFF", fontSize: 14 },
  resultsList: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    maxHeight: 180,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#334155",
  },
  resultText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  subResultText: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  quickHubWrap: {
    paddingVertical: 4,
  },
  quickHubTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  hubChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  hubChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hubChipText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
  },
  mapBox: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#334155",
  },
  centerPinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -18 }, { translateY: -36 }],
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    gap: 12,
  },
  selectedLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  selectedAddress: { color: "#38BDF8", fontSize: 14, fontWeight: "800", marginTop: 2 },
  confirmBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  confirmBtnText: { color: "#0F172A", fontWeight: "800", fontSize: 13 },
});
