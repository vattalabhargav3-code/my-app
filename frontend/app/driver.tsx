import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, SESSION_KEY, User } from "@/src/api";
import { AuthScreen } from "@/src/screens/AuthScreen";
import { DriverHome } from "@/src/screens/DriverHome";
import { shared } from "@/src/styles";
import { colors } from "@/src/theme";
import { storage } from "@/src/utils/storage";

export default function DriverPage() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedToken = (await storage.secureGet(SESSION_KEY)) || (typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null);
        if (savedToken) {
          setToken(savedToken);
          const me = await api<User>("/auth/me", {}, savedToken);
          if (mounted) setUser(me);
        }
      } catch {
        await storage.secureRemove(SESSION_KEY);
      } finally {
        if (mounted) setBooting(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const logout = async () => {
    await storage.secureRemove(SESSION_KEY);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
    setToken("");
    setUser(null);
  };

  if (booting) {
    return (
      <View style={[shared.screen, styles.loadingScreen]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Opening Driver Portal...</Text>
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
      <DriverHome token={token} onLogout={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: colors.onSurfaceSecondary, fontSize: 14 },
});
