import Constants from "expo-constants";
import { storage } from "./utils/storage";
const API_BASE = "https://backend-alpha-gray.vercel.app";
export const SESSION_KEY = "safarway.access-token";

export type User = { id: string; phone: string; id_verified: boolean };

export type Ride = {
  id: string;
  driver_name: string;
  vehicle: string;
  type: string;
  mode: string;
  from: string;
  to: string;
  stops?: string;
  seats_left: number;
  price: number;
  rating: string;
  departure_time?: string;
};

export type Booking = {
  id: string;
  total: number;
  discount: number;
  boarding_otp: string;
  seat: string;
  ride: Ride;
};

// Safe గా plain string లేదా JSON token ను లాగే ఫంక్షన్
async function getCleanToken(explicitToken?: string): Promise<string | null> {
  if (explicitToken) return explicitToken.replace(/^"(.*)"$/, "$1");

  let raw: any = null;

  // 1. Direct Web localStorage Check
  if (typeof window !== "undefined" && window.localStorage) {
    raw = window.localStorage.getItem(SESSION_KEY);
  }

  // 2. Fallback to storage helper
  if (!raw) {
    try {
      raw = await storage.secureGet(SESSION_KEY);
    } catch {
      raw = null;
    }
  }

  if (!raw) return null;

  // ఒకవేళ raw అనేది ఆబ్జెక్ట్ లేదా స్ట్రింగ్ అయితే క్లీన్ చేయడం
  let tokenStr = typeof raw === "string" ? raw : JSON.stringify(raw);
  
  // Extra double quotes తీసివేయడం
  tokenStr = tokenStr.trim().replace(/^"(.*)"$/, "$1");

  // Unexpected JSON unwrap
  if (tokenStr.startsWith("{") && tokenStr.endsWith("}")) {
    try {
      const parsed = JSON.parse(tokenStr);
      tokenStr = parsed.token || parsed.access_token || tokenStr;
    } catch {}
  }

  return tokenStr;
}

export async function api<T = any>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const savedToken = await getCleanToken(token);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (savedToken) {
    headers["Authorization"] = `Bearer ${savedToken}`;
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail ?? body.message ?? "Something went wrong");
  }
  return body as T;
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function saveRideToMongo(rideData: any) {
  const res = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rideData),
  });
  return await res.json();
}
