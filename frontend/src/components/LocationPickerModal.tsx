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

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  title = "Select Location",
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [centerCoords, setCenterCoords] = useState({ lat: 17.385, lon: 78.4867 }); // Hyderabad default
  const [pickedAddress, setPickedAddress] = useState("");
  const [fetchingAddress, setFetchingAddress] = useState(false);

  // Search places via typing
  const searchPlaces = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          text
        )}&format=json&addressdetails=1&limit=5&countrycodes=in`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Reverse geocode when map center changes
  const updateAddressFromCoords = async (lat: number, lon: number) => {
    setFetchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await res.json();
      const name =
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.city ||
        data.address?.town ||
        data.display_name;
      setPickedAddress(name);
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
    const name = item.display_name.split(",")[0] + ", " + (item.address?.city || item.address?.state || "");
    onSelect(name, lat, lon);
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
              placeholder="Search area, landmark or town..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={searchPlaces}
            />
            {loading && <ActivityIndicator size="small" color={colors.brand} />}
          </View>

          {/* Autocomplete Results */}
          {results.length > 0 && (
            <View style={styles.resultsList}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectFromList(item)}
                  >
                    <Icon name="map-marker-outline" size={18} color={colors.brand} />
                    <Text style={styles.resultText} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Interactive Drag Map Frame */}
          <View style={styles.mapBox}>
            <iframe
              title="map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerCoords.lon - 0.02}%2C${centerCoords.lat - 0.02}%2C${centerCoords.lon + 0.02}%2C${centerCoords.lat + 0.02}&layer=mapnik&marker=${centerCoords.lat}%2C${centerCoords.lon}`}
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
              <Text style={styles.selectedAddress} numberOfLines={2}>
                {fetchingAddress ? "Detecting area name..." : pickedAddress || "Move map or search"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleConfirmPicked}
              disabled={fetchingAddress || !pickedAddress}
              style={[styles.confirmBtn, (!pickedAddress || fetchingAddress) && { opacity: 0.6 }]}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
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
    maxHeight: "85%",
    minHeight: 480,
    gap: 12,
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
    maxHeight: 160,
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
  resultText: { color: "#F8FAFC", fontSize: 13, flex: 1 },
  mapBox: {
    height: 240,
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
    paddingTop: 8,
    gap: 12,
  },
  selectedLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  selectedAddress: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 2 },
  confirmBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmBtnText: { color: "#0F172A", fontWeight: "800", fontSize: 14 },
});
