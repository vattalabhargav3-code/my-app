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

mongo_url = os.environ.get("MONGO_URL", "")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000) if mongo_url else None
db = client[os.environ["DB_NAME"]] if (client and "DB_NAME" in os.environ) else None
JWT_SECRET = os.getenv("JWT_SECRET", "safarway-local-development-secret")
OTP_LENGTH = 6

# Vercel entrypoint
app = FastAPI(title="SafarWay API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://riderx-silk.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
logger = logging.getLogger("safarway")


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
        payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=["HS256"])
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

    # Database fail unna demo user ga permit chesthundi
    return {"id": user_id, "phone": "+919999999999", "role": "passenger", "id_verified": True}


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
    driver_dl: str = Field(min_length=4, max_length=32)
    driver_rc: str = Field(min_length=4, max_length=32)
    start_point: str = Field(min_length=2, max_length=100)
    end_point: str = Field(min_length=2, max_length=100)
    stops: str = Field(default="", max_length=200)
    vehicle_type: str = Field(pattern="^(bike|car|cab)$")
    available_seats: int = Field(ge=1, le=6)
    seat_price: int = Field(ge=1, le=100000)
    mode: str = Field(default="commercial", pattern="^(commercial|petrol_save)$")


class RideBookingRequest(BaseModel):
    seat: str = Field(min_length=2, max_length=40)
    coupon: str = Field(default="", max_length=32)


class SosRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ride_id: Optional[str] = None


SAMPLE_RIDES = [
    {
        "id": "ride-ramesh",
        "driver_name": "Ramesh K",
        "vehicle": "Swift Dzire · Yellow plate",
        "type": "cab",
        "mode": "commercial",
        "from": "hyderabad",
        "to": "vijayawada",
        "stops": "Suryapet",
        "seats_left": 3,
        "price": 500,
        "rating": "4.8",
    },
    {
        "id": "ride-suresh",
        "driver_name": "Suresh M",
        "vehicle": "Honda City · White plate sharing",
        "type": "car",
        "mode": "petrol_save",
        "from": "hyderabad",
        "to": "vijayawada",
        "stops": "Suryapet · Nalgonda",
        "seats_left": 2,
        "price": 350,
        "rating": "4.9",
    },
]


@api_router.get("/")
async def root():
    return {"message": "SafarWay API is ready"}


# Database check cheyadaniki idi use avthundi
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
    try:
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
        if fast2sms_key:
            try:
                clean_phone = str(phone).replace("+91", "").strip()
                sms_url = "https://www.fast2sms.com/dev/bulkV2"
                sms_payload = {
                    "variables_values": str(code),
                    "route": "otp",
                    "numbers": clean_phone,
                }
                sms_headers = {
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json",
                }
                requests.post(sms_url, json=sms_payload, headers=sms_headers, timeout=5)
            except Exception as sms_err:
                logger.error(f"Fast2SMS error: {sms_err}")

        return {
            "challenge_id": challenge_id,
            "provider": "fast2sms" if fast2sms_key else "development",
            "development_code": code,
        }
    except Exception as e:
        logger.error(f"Unhandled error in request_otp: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOtpRequest):
    try:
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
                        "role": "passenger",
                        "id_verified": True,
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
            "role": "passenger",
            "id_verified": True,
            "created_at": now_iso(),
        }
        return {"access_token": create_token(demo_user["id"]), "user": demo_user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unhandled verify error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


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


def public_ride(ride: dict[str, Any]) -> dict[str, Any]:
    return {
        key: ride.get(key)
        for key in [
            "id", "driver_name", "vehicle", "type", "mode", "from", "to", "stops", "seats_left", "price", "rating"
        ]
    }


@api_router.get("/rides")
async def list_rides(
    from_location: str = Query(default=""),
    to_location: str = Query(default=""),
    mode: str = Query(default="all"),
    vehicle_type: str = Query(default="all"),
    user: dict[str, Any] = Depends(current_user),
):
    persisted = []
    if db is not None:
        try:
            persisted = await db.rides.find({"status": "open"}, {"_id": 0}).to_list(100)
        except Exception as db_err:
            logger.error(f"Database error in list_rides: {db_err}")

    rides = SAMPLE_RIDES + [public_ride(ride) for ride in persisted]

    def matches(ride: dict[str, Any]) -> bool:
        route_match = not from_location or from_location.strip().lower() in ride["from"].lower()
        destination_match = not to_location or to_location.strip().lower() in ride["to"].lower()
        return (
            route_match
            and destination_match
            and (mode == "all" or ride["mode"] == mode)
            and (vehicle_type == "all" or ride["type"] == vehicle_type)
        )

    return [ride for ride in rides if matches(ride)]


@api_router.get("/rides/mine")
async def my_rides(user: dict[str, Any] = Depends(current_user)):
    rides = []
    if db is not None:
        try:
            rides = await db.rides.find({"driver_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
        except Exception as db_err:
            logger.error(f"Database error in my_rides: {db_err}")
    return [public_ride(ride) for ride in rides]


@api_router.post("/rides")
async def create_ride(payload: RideCreateRequest, user: dict[str, Any] = Depends(current_user)):
    ride = {
        "id": str(uuid.uuid4()),
        "driver_id": user["id"],
        "driver_name": "You · Driver",
        "vehicle": f"{payload.vehicle_type.upper()} · {payload.start_point} to {payload.end_point}",
        "type": payload.vehicle_type,
        "mode": payload.mode,
        "from": payload.start_point,
        "to": payload.end_point,
        "stops": payload.stops,
        "seats_left": payload.available_seats,
        "price": payload.seat_price,
        "rating": "New",
        "status": "open",
        "driver_dl_last4": payload.driver_dl[-4:],
        "driver_rc_last4": payload.driver_rc[-4:],
        "created_at": now_iso(),
    }
    if db is not None:
        try:
            await db.rides.insert_one(ride.copy())
        except Exception as db_err:
            logger.error(f"Database error in create_ride: {db_err}")
    return public_ride(ride)


@api_router.post("/rides/{ride_id}/book")
async def book_ride(ride_id: str, payload: RideBookingRequest, user: dict[str, Any] = Depends(current_user)):
    ride = next((item for item in SAMPLE_RIDES if item["id"] == ride_id), None)
    if not ride and db is not None:
        try:
            ride = await db.rides.find_one({"id": ride_id}, {"_id": 0})
        except Exception as db_err:
            logger.error(f"Database error fetching ride: {db_err}")

    if not ride or ride.get("seats_left", 0) < 1:
        raise HTTPException(status_code=404, detail="Ride is no longer available")

    discount = 50 if payload.coupon.strip().upper() == "WEEKLY50" else 0
    booking = {
        "id": str(uuid.uuid4()),
        "ride_id": ride_id,
        "passenger_id": user["id"],
        "seat": payload.seat,
        "base_fare": ride["price"],
        "discount": min(discount, ride["price"]),
        "total": max(0, ride["price"] - discount),
        "boarding_otp": f"{secrets.randbelow(9000) + 1000}",
        "status": "confirmed",
        "ride": public_ride(ride),
        "created_at": now_iso(),
    }
    if db is not None:
        try:
            await db.bookings.insert_one(booking.copy())
            if ride_id not in {item["id"] for item in SAMPLE_RIDES}:
                await db.rides.update_one({"id": ride_id, "seats_left": {"$gt": 0}}, {"$inc": {"seats_left": -1}})
        except Exception as db_err:
            logger.error(f"Database error in booking: {db_err}")
    return {key: value for key, value in booking.items() if key != "passenger_id"}


@api_router.get("/bookings/active")
async def active_booking(user: dict[str, Any] = Depends(current_user)):
    if db is None:
        return None
    try:
        return await db.bookings.find_one(
            {"passenger_id": user["id"], "status": "confirmed"}, {"_id": 0}, sort=[("created_at", -1)]
        )
    except Exception as db_err:
        logger.error(f"Database error in active_booking: {db_err}")
        return None


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


# Router include
app.include_router(api_router)
