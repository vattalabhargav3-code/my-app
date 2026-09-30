import Constants from "expo-constants";
import { storage } from "./utils/storage";

const API_BASE = "https://backend-alpha-gray.vercel.app";
export const SESSION_KEY = "safarway.access-token";

export type User = {
  id: string;
  phone: string;
  full_name?: string;
  role?: string;
  id_verified: boolean;
};

export type Ride = {
  id: string;
  driver_id?: string;
  driver_name: string;
  vehicle_type?: string;
  vehicle_name?: string;
  from_location: string;
  to_location: string;
  available_seats: number;
  price_per_seat: number;
  women_only?: boolean;
  departure_time?: string;
  status?: string;
};

export type Booking = {
  id: string;
  ride_id: string;
  passenger_id: string;
  passenger_name: string;
  pickup_point: string;
  destination_point: string;
  seats_booked: number;
  fare_paid: number;
  total_price: number;
  status: string;
  otp: string;
  payment_status: string;
  created_at?: string;
};

// Safe ga token extract chese function
async function getCleanToken(explicitToken?: string): Promise<string | null> {
  let raw: any = explicitToken || null;

  if (!raw && typeof window !== "undefined" && window.localStorage) {
    raw =
      window.localStorage.getItem(SESSION_KEY) ||
      window.localStorage.getItem("safarway_token") ||
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("access_token");
  }

  if (!raw) {
    try {
      raw =
        (await storage.secureGet(SESSION_KEY)) ||
        (await storage.secureGet("safarway_token")) ||
        (await storage.secureGet("token"));
    } catch {
      raw = null;
    }
  }

  if (!raw || raw === "undefined" || raw === "null") return null;

  let tokenStr = typeof raw === "string" ? raw : JSON.stringify(raw);
  tokenStr = tokenStr.trim().replace(/^"(.*)"$/, "$1");

  if (tokenStr.startsWith("{") && tokenStr.endsWith("}")) {
    try {
      const parsed = JSON.parse(tokenStr);
      tokenStr = parsed.access_token || parsed.token || parsed.jwt || tokenStr;
    } catch {}
  }

  if (tokenStr === "undefined" || tokenStr === "null") return null;
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

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = cleanPath.startsWith("/api")
    ? `${API_BASE}${cleanPath}`
    : `${API_BASE}/api${cleanPath}`;

  const response = await fetch(targetUrl, {
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
