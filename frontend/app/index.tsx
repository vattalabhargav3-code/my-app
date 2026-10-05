import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api, SESSION_KEY, User } from "@/src/api";

// ✅ ఇక్కడ { } తీసేసి సరైన Imports ఇచ్చాం:
import AuthScreen from "@/src/screens/AuthScreen";
import PassengerHome from "@/src/screens/PassengerHome";

import { shared } from "@/src/styles";
import { colors } from "@/src/theme";
import { storage } from "@/src/utils/storage";

export default function PassengerApp() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await storage.secureGet<string | null>(SESSION_KEY, null);
      if (saved) {
        try {
          const me = await api<User>("/me", {}, saved);
          setToken(saved);
          setUser(me);
        } catch {
          await storage.secureRemove(SESSION_KEY);
        }
      }
      setBooting(false);
    })();
  }, []);

  const logout = async () => {
    await storage.secureRemove(SESSION_KEY);
    setToken("");
    setUser(null);
  };

  if (booting) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingText}>Preparing your journey</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onLogin={(newToken, newUser) => {
          setToken(newToken);
          setUser(newUser);
        }}
      />
    );
  }

  return (
    <View style={shared.screen}>
      <PassengerHome
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
  },
});
