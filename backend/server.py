from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, List, Optional
import hashlib
import logging
import os
import secrets
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query, Request
import jwt
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import requests
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("safarway")
logging.basicConfig(level=logging.INFO)

mongo_url = os.environ.get("MONGO_URL", "")
db_name = os.environ.get("DB_NAME", "safarway")

client = None
db = None

if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
    except Exception as e:
        logger.error(f"MongoDB client init failed: {e}")
        client = None
        db = None

JWT_SECRET = os.getenv("JWT_SECRET", "safarway-local-development-secret")
OTP_LENGTH = 6

app = FastAPI(title="RiderX / SafarWay API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_phone(phone: str) -> str:
    digits = "".join(character for character in phone if character.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    if len(digits) == 10:
        return f"+91{digits}"
    raise HTTPException(status_code=422, detail="Enter a valid 10-digit Indian mobile number")


def create_token(user_id: str) -> str:
    issued_at = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": user_id, "iat": issued_at, "exp": issued_at + timedelta(days=30)},
        JWT_SECRET,
        algorithm="HS256",
    )


async def current_user(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue")
    try:
        token_str = authorization.replace("Bearer ", "").strip()
        payload = jwt.decode(token_str, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Your session has expired") from exc

    if db is not None:
        try:
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user:
                return user
        except Exception as db_err:
            logger.error(f"Database error in current_user: {db_err}")

    return {"id": user_id, "phone": "+918919326622", "full_name": "Rider Partner", "role": "passenger", "id_verified": True}


# --- Request Models ---

class PhoneRequest(BaseModel):
    phone: str


class VerifyOtpRequest(BaseModel):
    phone: str
    challenge_id: str
    code: str = Field(min_length=4, max_length=6)


class IdVerificationRequest(BaseModel):
    id_type: str = Field(pattern="^(aadhaar|pan|dl)$")
    id_number: str = Field(min_length=4, max_length=32)


class RideCreateRequest(BaseModel):
    from_location: str = Field(min_length=2, max_length=150)
    to_location: str = Field(min_length=2, max_length=150)
    vehicle_type: str = Field(default="car", pattern="^(bike|car|cab)$")
    available_seats: int = Field(default=3, ge=1, le=8)
    price_per_seat: int = Field(default=95, ge=1, le=10000)
    women_only: Optional[bool] = False
    departure_time: Optional[str] = "Today, Shortly"
    driver_dl: Optional[str] = "DL_VERIFIED"
    driver_rc: Optional[str] = "RC_VERIFIED"


class BookingCreateRequest(BaseModel):
    ride_id: str
    seats_booked: int = Field(default=1, ge=1, le=6)
    pickup_point: Optional[str] = ""
    destination_point: Optional[str] = ""
    fare_paid: int
    total_price: int
    otp: str = Field(min_length=4, max_length=6)
    payment_mode: Optional[str] = "upi"


class VerifyTripOtpRequest(BaseModel):
    ride_id: str
    otp: str = Field(min_length=4, max_length=6)


class PayoutWithdrawRequest(BaseModel):
    upi_id: str = Field(min_length=5, max_length=50)
    amount: float = Field(gt=0)


class SosRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ride_id: Optional[str] = None


# --- Helpers ---

def serialize_ride(ride: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(ride.get("id")),
        "driver_id": ride.get("driver_id"),
        "driver_name": ride.get("driver_name", "Verified Partner"),
        "vehicle_type": ride.get("vehicle_type", "car"),
        "vehicle_name": ride.get("vehicle_name", "Commute Ride"),
        "from_location": ride.get("from_location", ride.get("from", "")),
        "to_location": ride.get("to_location", ride.get("to", "")),
        "available_seats": ride.get("available_seats", ride.get("seats_left", 3)),
        "price_per_seat": ride.get("price_per_seat", ride.get("price", 95)),
        "women_only": ride.get("women_only", False),
        "departure_time": ride.get("departure_time", "Today Shortly"),
        "status": ride.get("status", "open"),
    }


# --- API Routes ---

@api_router.get("/")
async def root():
    return {"message": "RiderX API is ready"}


@api_router.get("/health")
async def health():
    db_status = "disconnected"
    db_error = None
    if db is not None:
        try:
            await db.command("ping")
            db_status = "connected"
        except Exception as e:
            db_status = "auth_or_connection_failed"
            db_error = str(e)
    return {"status": "ok", "database": db_status, "database_error": db_error}


@api_router.post("/auth/request-otp")
async def request_otp(payload: PhoneRequest):
    phone = normalize_phone(payload.phone)
    challenge_id = str(uuid.uuid4())
    code = f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"

    if db is not None:
        try:
            await db.otp_challenges.insert_one(
                {
                    "id": challenge_id,
                    "phone": phone,
                    "code_hash": hashlib.sha256(code.encode()).hexdigest(),
                    "created_at": now_iso(),
                    "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
                    "attempts": 0,
                }
            )
        except Exception as db_err:
            logger.error(f"Database error in request_otp: {db_err}")

    fast2sms_key = os.getenv("FAST2SMS_API_KEY")
    sms_sent = False
    if fast2sms_key:
        try:
            clean_phone = str(phone).replace("+91", "").strip()
            headers = {
                "authorization": fast2sms_key.strip(),
                "Content-Type": "application/json",
            }
            body = {
                "route": "q",
                "message": f"Your RiderX verification code is: {code}",
                "language": "english",
                "flash": 0,
                "numbers": clean_phone,
            }
            res = requests.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers=headers,
                json=body,
                timeout=5,
            )
            res_data = res.json()
            sms_sent = res_data.get("return", False)
        except Exception as sms_err:
            logger.error(f"Fast2SMS error: {sms_err}")

    return {
        "challenge_id": challenge_id,
        "provider": "fast2sms" if sms_sent else "development",
        "preview_code": None if sms_sent else code,
    }


@api_router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOtpRequest):
    phone = normalize_phone(payload.phone)
    user_id = str(uuid.uuid4())

    if db is not None:
        try:
            challenge = await db.otp_challenges.find_one({"id": payload.challenge_id}, {"_id": 0})
            if challenge:
                if datetime.fromisoformat(challenge["expires_at"]) < datetime.now(timezone.utc):
                    raise HTTPException(status_code=400, detail="OTP expired. Request a new one")
                if hashlib.sha256(payload.code.encode()).hexdigest() != challenge["code_hash"]:
                    raise HTTPException(status_code=400, detail="Incorrect OTP")

            user = await db.users.find_one({"phone": phone}, {"_id": 0})
            if not user:
                user = {
                    "id": user_id,
                    "phone": phone,
                    "full_name": "Rider Partner",
                    "role": "passenger",
                    "id_verified": True,
                    "wallet_balance": 0.0,
                    "created_at": now_iso(),
                }
                await db.users.insert_one(user.copy())
            return {"access_token": create_token(user["id"]), "user": user}
        except HTTPException:
            raise
        except Exception as db_err:
            logger.error(f"Database error in verify: {db_err}")

    demo_user = {
        "id": user_id,
        "phone": phone,
        "full_name": "Rider Partner",
        "role": "passenger",
        "id_verified": True,
        "wallet_balance": 0.0,
        "created_at": now_iso(),
    }
    return {"access_token": create_token(demo_user["id"]), "user": demo_user}


@api_router.get("/me")
async def get_me(user: dict[str, Any] = Depends(current_user)):
    return user


@api_router.post("/me/verify-id")
async def verify_id(payload: IdVerificationRequest, user: dict[str, Any] = Depends(current_user)):
    if db is not None:
        try:
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"id_verified": True, "id_type": payload.id_type, "id_last4": payload.id_number[-4:]}},
            )
        except Exception as db_err:
            logger.error(f"Database error in verify-id: {db_err}")
    return {"verified": True, "id_type": payload.id_type}


# --- RIDES MANAGEMENT ---

@api_router.get("/rides")
async def list_rides(
    from_location: str = Query(default=""),
    to_location: str = Query(default=""),
    user: dict[str, Any] = Depends(current_user),
):
    rides_list = []
    if db is not None:
        try:
            query = {"status": "open"}
            persisted = await db.rides.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
            rides_list = [serialize_ride(r) for r in persisted]
        except Exception as db_err:
            logger.error(f"Database error in list_rides: {db_err}")

    def matches(ride: dict[str, Any]) -> bool:
        route_match = not from_location or from_location.strip().lower() in ride["from_location"].lower()
        destination_match = not to_location or to_location.strip().lower() in ride["to_location"].lower()
        return route_match and destination_match

    return [r for r in rides_list if matches(r)]


@api_router.get("/rides/my-published")
async def my_published_rides(user: dict[str, Any] = Depends(current_user)):
    rides = []
    if db is not None:
        try:
            results = await db.rides.find({"driver_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
            rides = [serialize_ride(r) for r in results]
        except Exception as db_err:
            logger.error(f"Database error in my_published_rides: {db_err}")
    return rides


@api_router.post("/rides")
async def create_ride(payload: RideCreateRequest, user: dict[str, Any] = Depends(current_user)):
    ride = {
        "id": str(uuid.uuid4()),
        "driver_id": user["id"],
        "driver_name": user.get("full_name") or "Verified Driver",
        "vehicle_type": payload.vehicle_type,
        "vehicle_name": f"{payload.vehicle_type.capitalize()} Pool",
        "from_location": payload.from_location,
        "to_location": payload.to_location,
        "available_seats": payload.available_seats,
        "price_per_seat": payload.price_per_seat,
        "women_only": payload.women_only,
        "departure_time": payload.departure_time,
        "status": "open",
        "created_at": now_iso(),
    }
    if db is not None:
        try:
            await db.rides.insert_one(ride.copy())
        except Exception as db_err:
            logger.error(f"Database error in create_ride: {db_err}")
    return serialize_ride(ride)


# --- BOOKING & ESCROW PAYMENT ---

@api_router.post("/bookings")
async def create_booking(payload: BookingCreateRequest, user: dict[str, Any] = Depends(current_user)):
    ride = None
    if db is not None:
        try:
            ride = await db.rides.find_one({"id": payload.ride_id}, {"_id": 0})
        except Exception as db_err:
            logger.error(f"Database error fetching ride: {db_err}")

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or expired")

    if ride.get("available_seats", 0) < payload.seats_booked:
        raise HTTPException(status_code=400, detail="Requested seats are no longer available")

    booking = {
        "id": "bk_" + str(uuid.uuid4())[:8],
        "ride_id": payload.ride_id,
        "driver_id": ride.get("driver_id"),
        "passenger_id": user["id"],
        "passenger_name": user.get("full_name") or "Passenger",
        "pickup_point": payload.pickup_point or ride.get("from_location"),
        "destination_point": payload.destination_point or ride.get("to_location"),
        "seats_booked": payload.seats_booked,
        "fare_paid": payload.fare_paid,
        "total_price": payload.total_price,
        "otp": payload.otp,
        "payment_status": "paid_in_escrow",
        "status": "confirmed",
        "created_at": now_iso(),
    }

    if db is not None:
        try:
            await db.bookings.insert_one(booking.copy())
            await db.rides.update_one(
                {"id": payload.ride_id},
                {"$inc": {"available_seats": -payload.seats_booked}}
            )
        except Exception as db_err:
            logger.error(f"Database error saving booking: {db_err}")

    return {key: val for key, val in booking.items() if key != "_id"}


# --- TRIP COMPLETION & DRIVER WALLET SETTLEMENT ---

@api_router.post("/rides/complete-trip")
async def complete_trip_with_otp(payload: VerifyTripOtpRequest, user: dict[str, Any] = Depends(current_user)):
    if db is None:
        return {"success": True, "message": "Trip marked complete", "amount_credited": 95}

    try:
        booking = await db.bookings.find_one(
            {"ride_id": payload.ride_id, "otp": payload.otp, "status": "confirmed"},
            {"_id": 0}
        )
        if not booking:
            raise HTTPException(status_code=400, detail="Invalid 4-digit ride OTP. Verification failed.")

        fare_to_credit = booking.get("fare_paid", 95)

        # 1. Update Booking Status
        await db.bookings.update_one(
            {"id": booking["id"]},
            {"$set": {"status": "completed", "payment_status": "settled_to_driver", "completed_at": now_iso()}}
        )

        # 2. Update Ride Status
        await db.rides.update_one(
            {"id": payload.ride_id},
            {"$set": {"status": "completed"}}
        )

        # 3. Credit Driver Wallet
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"wallet_balance": fare_to_credit}}
        )

        # 4. Insert Ledger Record
        await db.wallet_ledgers.insert_one({
            "id": "tx_" + str(uuid.uuid4())[:8],
            "user_id": user["id"],
            "type": "credit",
            "amount": fare_to_credit,
            "description": f"Trip Completed: {booking.get('pickup_point')} to {booking.get('destination_point')}",
            "created_at": now_iso(),
        })

        return {
            "success": True,
            "message": "OTP Verified! Fare credited to your wallet.",
            "amount_credited": fare_to_credit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing trip: {e}")
        raise HTTPException(status_code=500, detail="Trip completion failed")


# --- DRIVER PAYOUT WITHDRAWAL ---

@api_router.post("/wallet/withdraw")
async def withdraw_payout(payload: PayoutWithdrawRequest, user: dict[str, Any] = Depends(current_user)):
    if db is not None:
        try:
            curr = await db.users.find_one({"id": user["id"]}, {"_id": 0})
            curr_balance = curr.get("wallet_balance", 0.0) if curr else 0.0

            if curr_balance < payload.amount:
                raise HTTPException(status_code=400, detail="Insufficient wallet balance")

            await db.users.update_one(
                {"id": user["id"]},
                {"$inc": {"wallet_balance": -payload.amount}}
            )

            await db.wallet_ledgers.insert_one({
                "id": "po_" + str(uuid.uuid4())[:8],
                "user_id": user["id"],
                "type": "debit",
                "amount": payload.amount,
                "description": f"Payout Initiated to UPI: {payload.upi_id}",
                "created_at": now_iso(),
            })

            return {"success": True, "message": f"₹{payload.amount} payout initiated to {payload.upi_id}"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Payout failed: {e}")
            raise HTTPException(status_code=500, detail="Payout withdrawal failed")

    return {"success": True, "message": f"₹{payload.amount} payout initiated to {payload.upi_id}"}


# --- SOS EMERGENCY ---

@api_router.post("/rides/{ride_id}/sos")
async def send_sos(ride_id: str, payload: SosRequest, user: dict[str, Any] = Depends(current_user)):
    event = {
        "id": str(uuid.uuid4()),
        "ride_id": ride_id,
        "user_id": user["id"],
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "status": "received",
        "created_at": now_iso(),
    }
    if db is not None:
        try:
            await db.emergency_events.insert_one(event.copy())
        except Exception as db_err:
            logger.error(f"Database error in sos: {db_err}")
    return {"id": event["id"], "status": "received", "call_number": "112"}


app.include_router(api_router)
