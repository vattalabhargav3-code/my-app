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
};

export type Booking = {
  id: string;
  total: number;
  discount: number;
  boarding_otp: string;
  seat: string;
  ride: Ride;
};
 export async function api<T = any>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const savedToken = token || (await storage.secureGet(SESSION_KEY));
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail ?? "Something went wrong");
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
