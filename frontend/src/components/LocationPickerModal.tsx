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

const MAPBOX_TOKEN = "pk.eyJ1IjoiYmhhcmdhdjE4MTkiLCJhIjoiY211bnJxOGJ6MDJnNjJ4cGNucWV3ZTB5ZyJ9.eeQZMTPajF3ggl5E1ovH0Q";

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
  const [centerCoords, setCenterCoords] = useState({ lat: 17.4435, lon: 78.3772 }); // Default Hitec City
  const [pickedAddress, setPickedAddress] = useState("Hitec City, Hyderabad");
  const [fetchingAddress, setFetchingAddress] = useState(false);

  // Mapbox Geocoding Autocomplete Search with Hyderabad Proximity
  const searchPlaces = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        text.trim()
      )}.json?access_token=${MAPBOX_TOKEN}&country=in&proximity=78.38,17.44&types=neighborhood,locality,place,poi,address&limit=6`;

      const res = await fetch(url);
      const data = await res.json();

      if (data && data.features) {
        const formatted = data.features.map((item: any) => {
          const areaName = item.text || item.place_name.split(",")[0];
          const fullContext = item.place_name;
          return {
            id: item.id,
            cleanName: areaName,
            fullName: fullContext,
            lat: item.center[1],
            lon: item.center[0],
          };
        });
        setResults(formatted);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Reverse Geocoding when coordinates change
  const updateAddressFromCoords = async (lat: number, lon: number) => {
    setFetchingAddress(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&types=neighborhood,locality,place,poi&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        setPickedAddress(data.features[0].place_name);
      } else {
        setPickedAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
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
    setCenterCoords({ lat: item.lat, lon: item.lon });
    setPickedAddress(item.cleanName);
    setQuery("");
    setResults([]);
    onSelect(item.cleanName, item.lat, item.lon);
    onClose();
  };

  const handleSelectQuickHub = (hub: { name: string; lat: number; lon: number }) => {
    const full = `${hub.name}, Hyderabad`;
    setCenterCoords({ lat: hub.lat, lon: hub.lon });
    setPickedAddress(full);
    onSelect(full, hub.lat, hub.lon);
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

          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Search area (e.g. Hitec City, Madhapur, LB Nagar)..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={searchPlaces}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color={colors.brand} />}
            {query.length > 0 && !loading && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Icon name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Autocomplete Results */}
          {results.length > 0 && (
            <View style={styles.resultsList}>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
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
                        {item.fullName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Popular Hubs Quick Chips */}
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

          {/* Interactive Live Map Frame (Static preview centered on selection) */}
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
