# SafarWay — Product Requirements & Status

## Problem statement
Mobile ride-sharing app (Expo + FastAPI + MongoDB) with dual roles.
- **Auth:** mobile number + OTP (dev mode: OTP returned as `development_code`; MSG91 opt-in via `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID`).
- **Passenger:** search rides (from/to), travel mode (Commercial / Petrol save), vehicle filter (all/bike/car/cab), Govt ID verification (Aadhaar/PAN/DL), seat selection, coupon `WEEKLY50`, booking with boarding OTP, live-tracking placeholder, SOS (records event + `tel:112`).
- **Driver:** DL/RC, start, end, stops, vehicle type, seats, price → publish ride; list own rides.
- **Roles:** bottom role switcher (Passenger / Driver).

## User choices
- Skipped credentials for MSG91 SMS, Stripe payments, Maps and SOS providers → these are mocked/defaulted until keys are provided.

## Architecture
```
backend/server.py                 FastAPI + Motor (all routes under /api)
frontend/app/index.tsx            Root: session boot, auth gate, role switch
frontend/src/api.ts               fetch wrapper, types, SESSION_KEY
frontend/src/styles.ts            shared StyleSheet
frontend/src/theme.ts             colors
frontend/src/screens/AuthScreen.tsx
frontend/src/screens/PassengerHome.tsx
frontend/src/screens/DriverHome.tsx
frontend/src/components/{ui,navigation,RideCard,RideSearchPanel,IdVerifyCard,CheckoutSheet,ActiveBookingCard}.tsx
```

## API
- `POST /api/auth/request-otp` · `POST /api/auth/verify-otp` · `GET /api/me` · `POST /api/me/verify-id`
- `GET /api/rides` (filters: from_location, to_location, mode, vehicle_type) · `POST /api/rides` · `GET /api/rides/mine`
- `POST /api/rides/{id}/book` · `GET /api/bookings/active` · `POST /api/rides/{id}/sos`

## DB collections
`users`, `otp_challenges`, `rides`, `bookings`, `emergency_events`

## Status
- [x] Backend core endpoints
- [x] Frontend refactored into small screens/components (lint + tsc clean)
- [x] `/rides/mine` so driver's published rides persist across sessions
- [x] Active booking restored from `/bookings/active` on load
- [x] E2E tested — backend 18/18, all frontend flows pass (`/app/test_reports/iteration_1.json`)

## Mocked / pending integrations
- MSG91 real SMS OTP (needs auth key + DLT template ID)
- Stripe payments (needs keys)
- Maps live tracking (placeholder)
- SOS emergency contacts (records event, dials 112)

## Backlog
- Driver: view bookings on a ride & verify passenger boarding OTP
- Passenger: booking history / cancel booking
- Real map + driver location sharing
