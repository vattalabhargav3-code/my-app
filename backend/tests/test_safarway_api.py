"""SafarWay backend API tests - covers auth, ID verification, rides, bookings, SOS."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://commute-buddy-87.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def api():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _phone():
    # unique-ish 10 digit phone per module run
    return "98" + str(int(time.time()) % 10**8).zfill(8)


@pytest.fixture(scope="module")
def user_ctx(api):
    """Full auth flow: request OTP → verify → returns (token, user, phone)."""
    phone = _phone()
    r = api.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": phone})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "challenge_id" in data and "development_code" in data
    challenge_id, code = data["challenge_id"], data["development_code"]

    r = api.post(f"{BASE_URL}/api/auth/verify-otp",
                 json={"phone": phone, "challenge_id": challenge_id, "code": code})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "access_token" in body and "user" in body
    return {"token": body["access_token"], "user": body["user"], "phone": phone}


# ---------- Health ----------
class TestHealth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_request_otp_returns_dev_code(self, api):
        r = api.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": "9876500001"})
        assert r.status_code == 200
        j = r.json()
        assert j["provider"] == "development"
        assert len(j["development_code"]) == 6
        assert j["challenge_id"]

    def test_invalid_phone_returns_422(self, api):
        r = api.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": "12345"})
        assert r.status_code == 422

    def test_invalid_otp_returns_400(self, api):
        phone = "9876500002"
        r = api.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": phone})
        cid = r.json()["challenge_id"]
        r = api.post(f"{BASE_URL}/api/auth/verify-otp",
                     json={"phone": phone, "challenge_id": cid, "code": "000000"})
        assert r.status_code == 400

    def test_verify_returns_token_and_user(self, user_ctx):
        assert user_ctx["token"]
        assert user_ctx["user"]["phone"].endswith(user_ctx["phone"][-10:])
        assert user_ctx["user"]["id_verified"] is False


# ---------- /me ----------
class TestMe:
    def test_me_without_token_returns_401(self, api):
        r = api.get(f"{BASE_URL}/api/me")
        assert r.status_code == 401

    def test_me_with_token(self, api, user_ctx):
        r = api.get(f"{BASE_URL}/api/me",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert r.status_code == 200
        assert r.json()["id"] == user_ctx["user"]["id"]


# ---------- ID verify ----------
class TestIdVerify:
    def test_verify_aadhaar(self, api, user_ctx):
        r = api.post(f"{BASE_URL}/api/me/verify-id",
                     headers={"Authorization": f"Bearer {user_ctx['token']}"},
                     json={"id_type": "aadhaar", "id_number": "123412341234"})
        assert r.status_code == 200
        j = r.json()
        assert j["verified"] is True and j["id_type"] == "aadhaar"

        # verify persisted via /me
        r = api.get(f"{BASE_URL}/api/me",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert r.json()["id_verified"] is True


# ---------- Rides list & filters ----------
class TestRidesList:
    def test_list_all_rides(self, api, user_ctx):
        r = api.get(f"{BASE_URL}/api/rides",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert r.status_code == 200
        rides = r.json()
        ids = {r_["id"] for r_ in rides}
        assert "ride-ramesh" in ids and "ride-suresh" in ids

    def test_filter_mode_commercial(self, api, user_ctx):
        r = api.get(f"{BASE_URL}/api/rides?mode=commercial",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        ids = {r_["id"] for r_ in r.json()}
        assert "ride-ramesh" in ids and "ride-suresh" not in ids

    def test_filter_mode_petrol_save(self, api, user_ctx):
        r = api.get(f"{BASE_URL}/api/rides?mode=petrol_save",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        ids = {r_["id"] for r_ in r.json()}
        assert "ride-suresh" in ids and "ride-ramesh" not in ids

    def test_filter_vehicle_type_cab(self, api, user_ctx):
        r = api.get(f"{BASE_URL}/api/rides?vehicle_type=cab",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        for ride in r.json():
            assert ride["type"] == "cab"

    def test_filter_from_location(self, api, user_ctx):
        r = api.get(f"{BASE_URL}/api/rides?from_location=Hyderabad",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert r.status_code == 200 and len(r.json()) >= 2


# ---------- Ride creation ----------
class TestRideCreate:
    def test_create_and_list_mine(self, api, user_ctx):
        payload = {
            "driver_dl": "DL1420110012345",
            "driver_rc": "TS09EF1234",
            "start_point": "Hyderabad",
            "end_point": "Bangalore",
            "stops": "Kurnool",
            "vehicle_type": "car",
            "available_seats": 3,
            "seat_price": 400,
            "mode": "petrol_save",
        }
        r = api.post(f"{BASE_URL}/api/rides",
                     headers={"Authorization": f"Bearer {user_ctx['token']}"},
                     json=payload)
        assert r.status_code == 200, r.text
        ride = r.json()
        assert ride["from"] == "Hyderabad" and ride["to"] == "Bangalore"
        assert ride["type"] == "car" and ride["price"] == 400
        assert ride["seats_left"] == 3

        # GET /rides/mine
        r = api.get(f"{BASE_URL}/api/rides/mine",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert r.status_code == 200
        mine_ids = {ri["id"] for ri in r.json()}
        assert ride["id"] in mine_ids

        # GET /rides also includes it
        r = api.get(f"{BASE_URL}/api/rides?mode=petrol_save",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert ride["id"] in {ri["id"] for ri in r.json()}

        # store for booking test
        pytest.custom_created_ride_id = ride["id"]


# ---------- Booking ----------
class TestBooking:
    def test_book_fails_without_id_verification(self, api):
        # Create fresh user without ID verification
        phone = "9876500999"
        r = api.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": phone})
        cid, code = r.json()["challenge_id"], r.json()["development_code"]
        r = api.post(f"{BASE_URL}/api/auth/verify-otp",
                     json={"phone": phone, "challenge_id": cid, "code": code})
        token = r.json()["access_token"]

        r = api.post(f"{BASE_URL}/api/rides/ride-ramesh/book",
                     headers={"Authorization": f"Bearer {token}"},
                     json={"seat": "Seat 1", "coupon": ""})
        assert r.status_code == 400
        assert "verify" in r.json()["detail"].lower()

    def test_book_with_coupon_and_active_booking(self, api, user_ctx):
        # user_ctx is already verified from TestIdVerify
        r = api.post(f"{BASE_URL}/api/rides/ride-ramesh/book",
                     headers={"Authorization": f"Bearer {user_ctx['token']}"},
                     json={"seat": "Seat 1 · front", "coupon": "WEEKLY50"})
        assert r.status_code == 200, r.text
        booking = r.json()
        assert booking["discount"] == 50
        assert booking["total"] == 500 - 50  # ramesh price 500
        assert booking["base_fare"] == 500
        assert len(booking["boarding_otp"]) == 4
        assert booking["status"] == "confirmed"

        # active booking
        r = api.get(f"{BASE_URL}/api/bookings/active",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        assert r.status_code == 200
        active = r.json()
        assert active is not None and active["id"] == booking["id"]

    def test_book_db_ride_decrements_seats(self, api, user_ctx):
        ride_id = getattr(pytest, "custom_created_ride_id", None)
        if not ride_id:
            pytest.skip("No DB ride created")
        # get current seats
        r = api.get(f"{BASE_URL}/api/rides",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        pre = next(x for x in r.json() if x["id"] == ride_id)
        pre_seats = pre["seats_left"]

        r = api.post(f"{BASE_URL}/api/rides/{ride_id}/book",
                     headers={"Authorization": f"Bearer {user_ctx['token']}"},
                     json={"seat": "Seat 2 · back left", "coupon": ""})
        assert r.status_code == 200

        r = api.get(f"{BASE_URL}/api/rides",
                    headers={"Authorization": f"Bearer {user_ctx['token']}"})
        post = next(x for x in r.json() if x["id"] == ride_id)
        assert post["seats_left"] == pre_seats - 1


# ---------- SOS ----------
class TestSos:
    def test_sos(self, api, user_ctx):
        r = api.post(f"{BASE_URL}/api/rides/ride-ramesh/sos",
                     headers={"Authorization": f"Bearer {user_ctx['token']}"},
                     json={"ride_id": "ride-ramesh"})
        assert r.status_code == 200
        j = r.json()
        assert j["status"] == "received" and j["call_number"] == "112"
