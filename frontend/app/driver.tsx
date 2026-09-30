import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api, SESSION_KEY, User } from "@/src/api";
import { AuthScreen } from "@/src/screens/AuthScreen";
import { DriverHome } from "@/src/screens/DriverHome";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";
import { storage } from "@/src/utils/storage";

export default function DriverApp() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await storage.secureGet<string | null>(SESSION_KEY + "_driver", null);
      if (saved) {
        try {
          const me = await api<User>("/me", {}, saved);
          setToken(saved);
          setUser(me);
        } catch {
          await storage.secureRemove(SESSION_KEY + "_driver");
        }
      }
      setBooting(false);
    })();
  }, []);

  const logout = async () => {
    await storage.secureRemove(SESSION_KEY + "_driver");
    setToken("");
    setUser(null);
  };

  if (booting) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingText}>Starting Driver Console...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onLogin={(newToken, newUser) => {
          const driverUser: User = {
            ...newUser,
            role: "driver",
            full_name: newUser.full_name || "Driver Partner",
          };
          setToken(newToken);
          setUser(driverUser);
          storage.secureSet(SESSION_KEY + "_driver", newToken);
        }}
      />
    );
  }

  return (
    <View style={shared.screen}>
      <DriverHome
        token={token}
        user={user}
        onUserUpdate={setUser}
        onLogout={logout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.onSurfaceSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
});
