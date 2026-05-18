"""Gadget2Go (G2G) — Cybridge Co. backend.

Single-file FastAPI application that handles:
- Auth (signup with mock OTP, login, forgot/reset password)
- Users / profile / avatar upload (base64)
- Listings (CRUD + filter + distance + geolocation)
- Smart AI matching
- Chats + messages + real-time WebSocket delivery
- Payments / escrow / refunds / wallet
- Reviews
- Notifications
- KYC verifications
- Physical device validation requests (mocked workflow)
- Reports + blocks
- Admin endpoints
- Initial seed data on startup

University demo level: passwords stored in plain text, token = user_id (no JWT/bcrypt).
All API routes are prefixed with /api.
"""
from fastapi import FastAPI, APIRouter, Header, HTTPException, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import uuid
import math
import random
import logging
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("g2g")

# ---------------- Mongo ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------- App ----------------
app = FastAPI(title="Gadget2Go API")
api = APIRouter(prefix="/api")


# ---------------- Helpers ----------------
def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def newid() -> str:
    return str(uuid.uuid4())


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    lat1, lat2 = math.radians(lat1), math.radians(lat2)
    dlat, dlon = lat2 - lat1, math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not authenticated")
    user_id = authorization.split(" ", 1)[1].strip()
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "Invalid token")
    return user


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


async def compute_trust_score(user_id: str) -> int:
    """Dynamic trust score based on verifications, transactions, reviews, reports."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return 50
    score = 50
    if user.get("emailVerified"):
        score += 10
    if user.get("phoneVerified"):
        score += 5
    if user.get("kycStatus") == "approved":
        score += 20
    deals = await db.payments.count_documents({"sellerId": user_id, "status": {"$in": ["released", "completed"]}})
    score += min(15, deals * 2)
    reviews = await db.reviews.find({"sellerId": user_id}, {"_id": 0}).to_list(500)
    if reviews:
        avg = sum(r["rating"] for r in reviews) / len(reviews)
        score += int((avg - 3) * 4)
    reports = await db.reports.count_documents({"targetId": user_id, "status": {"$ne": "dismissed"}})
    score -= reports * 8
    return max(0, min(100, score))


def trust_label(score: int) -> str:
    if score >= 85:
        return "Highly Trusted"
    if score >= 65:
        return "Trusted"
    if score >= 40:
        return "New Seller"
    return "Risk Warning"


# ---------------- Pydantic Models ----------------
class SignupBody(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    password: str
    role: Optional[str] = "user"  # user | dealer


class VerifyOtpBody(BaseModel):
    email: EmailStr
    code: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    email: EmailStr
    code: str
    newPassword: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class AvatarBody(BaseModel):
    avatar: str  # base64 data URL


class ListingCreate(BaseModel):
    title: str
    category: str
    brand: str
    model: str
    storage: Optional[str] = ""
    ram: Optional[str] = ""
    batteryHealth: Optional[int] = 90
    condition: str = "B"
    warranty: Optional[str] = "No"
    description: Optional[str] = ""
    price: float
    aiFair: Optional[float] = None
    images: List[str] = []
    location: Optional[str] = "Singapore"
    lat: Optional[float] = 1.3521
    lon: Optional[float] = 103.8198
    method: Optional[str] = "both"


class MatchQuery(BaseModel):
    budget: float = 1500
    deviceType: Optional[str] = ""
    brand: Optional[str] = ""
    condition: Optional[str] = ""
    maxDistanceKm: Optional[float] = 50
    sellerType: Optional[str] = "any"  # any | dealer | individual
    lat: Optional[float] = 1.3521
    lon: Optional[float] = 103.8198


class ChatCreate(BaseModel):
    otherUserId: str
    listingId: Optional[str] = None


class MessageSend(BaseModel):
    chatId: str
    text: Optional[str] = ""
    image: Optional[str] = None


class PaymentCreate(BaseModel):
    listingId: str
    method: Optional[str] = "card"  # card | wallet


class RefundCreate(BaseModel):
    paymentId: str
    reason: str


class ReviewCreate(BaseModel):
    sellerId: str
    rating: int
    text: Optional[str] = ""
    paymentId: Optional[str] = None


class VerificationCreate(BaseModel):
    idDoc: str  # base64
    selfie: str  # base64
    docType: Optional[str] = "ic"


class DeviceValidationCreate(BaseModel):
    listingId: str
    pickupAddress: str
    notes: Optional[str] = ""


class ReportCreate(BaseModel):
    targetId: str
    targetType: str = "user"  # user | listing
    reason: str


class BlockCreate(BaseModel):
    userId: str


class AdminAction(BaseModel):
    action: str  # approve | reject | dismiss | resolve | delete
    notes: Optional[str] = ""


# ---------------- WebSocket Manager ----------------
class WSManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self.connections:
            self.connections[user_id] = [c for c in self.connections[user_id] if c is not ws]
            if not self.connections[user_id]:
                self.connections.pop(user_id)

    async def send(self, user_id: str, payload: dict):
        for ws in list(self.connections.get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                pass


wsm = WSManager()


# ---------------- Auth ----------------
@api.get("/")
async def root():
    return {"message": "Gadget2Go API", "ok": True}


@api.post("/auth/signup")
async def signup(body: SignupBody):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing and existing.get("emailVerified"):
        raise HTTPException(400, "An account with this email already exists")
    code = f"{random.randint(0, 999999):06d}"
    pending = {
        "id": existing["id"] if existing else newid(),
        "name": body.name,
        "email": body.email.lower(),
        "phone": body.phone,
        "password": body.password,  # plain text (university demo)
        "role": body.role if body.role in ("user", "dealer") else "user",
        "avatar": "",
        "bio": "",
        "location": "Singapore",
        "lat": 1.3521,
        "lon": 103.8198,
        "emailVerified": False,
        "phoneVerified": False,
        "kycStatus": "none",  # none | pending | approved | rejected
        "walletBalance": 0,
        "rating": 5.0,
        "createdAt": now(),
    }
    if existing:
        await db.users.update_one({"email": body.email.lower()}, {"$set": pending})
    else:
        await db.users.insert_one(pending)
    await db.otps.update_one(
        {"email": body.email.lower(), "purpose": "signup"},
        {"$set": {"code": code, "expiresAt": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()}},
        upsert=True,
    )
    logger.info(f"[MOCK OTP] signup {body.email}: {code}")
    return {"ok": True, "message": "OTP sent to your email", "mockOtp": code}


@api.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpBody):
    rec = await db.otps.find_one({"email": body.email.lower(), "purpose": "signup"}, {"_id": 0})
    if not rec or rec.get("code") != body.code:
        raise HTTPException(400, "Invalid OTP code")
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"email": body.email.lower()}, {"$set": {"emailVerified": True}})
    await db.otps.delete_one({"email": body.email.lower(), "purpose": "signup"})
    user["emailVerified"] = True
    user["trustScore"] = await compute_trust_score(user["id"])
    user["trustLabel"] = trust_label(user["trustScore"])
    return {"token": user["id"], "user": user}


@api.post("/auth/login")
async def login(body: LoginBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(404, "No account found with this email")
    if user.get("password") != body.password:
        raise HTTPException(401, "Incorrect password")
    if not user.get("emailVerified"):
        raise HTTPException(403, "Email not verified. Please complete OTP verification.")
    user.pop("_id", None)
    user.pop("password", None)
    user["trustScore"] = await compute_trust_score(user["id"])
    user["trustLabel"] = trust_label(user["trustScore"])
    return {"token": user["id"], "user": user}


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(404, "No account found with this email")
    code = f"{random.randint(0, 999999):06d}"
    await db.otps.update_one(
        {"email": body.email.lower(), "purpose": "reset"},
        {"$set": {"code": code, "expiresAt": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
        upsert=True,
    )
    logger.info(f"[MOCK OTP] reset {body.email}: {code}")
    return {"ok": True, "mockOtp": code}


@api.post("/auth/reset-password")
async def reset_password(body: ResetBody):
    rec = await db.otps.find_one({"email": body.email.lower(), "purpose": "reset"})
    if not rec or rec.get("code") != body.code:
        raise HTTPException(400, "Invalid code")
    await db.users.update_one({"email": body.email.lower()}, {"$set": {"password": body.newPassword}})
    await db.otps.delete_one({"email": body.email.lower(), "purpose": "reset"})
    return {"ok": True}


@api.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    return {"ok": True}


# ---------------- Users / Profile ----------------
async def serialize_user(u: dict) -> dict:
    u = dict(u)
    u.pop("_id", None)
    u.pop("password", None)
    u["trustScore"] = await compute_trust_score(u["id"])
    u["trustLabel"] = trust_label(u["trustScore"])
    u["dealsCompleted"] = await db.payments.count_documents({"sellerId": u["id"], "status": {"$in": ["released", "completed"]}})
    return u


@api.get("/users/me")
async def get_me(user: dict = Depends(get_current_user)):
    return await serialize_user(user)


@api.patch("/users/me")
async def update_me(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]})
    return await serialize_user(fresh)


@api.post("/users/me/avatar")
async def upload_avatar(body: AvatarBody, user: dict = Depends(get_current_user)):
    if not body.avatar.startswith("data:image"):
        raise HTTPException(400, "Avatar must be a base64 data URL")
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar": body.avatar}})
    fresh = await db.users.find_one({"id": user["id"]})
    return await serialize_user(fresh)


@api.get("/users/{user_id}")
async def get_user(user_id: str):
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(404, "User not found")
    return await serialize_user(u)


# ---------------- Listings ----------------
async def enrich_listing(l: dict, viewer: Optional[dict] = None) -> dict:
    l = dict(l)
    l.pop("_id", None)
    seller = await db.users.find_one({"id": l["sellerId"]}, {"_id": 0, "password": 0})
    if seller:
        l["seller"] = {
            "id": seller["id"], "name": seller["name"], "avatar": seller.get("avatar", ""),
            "role": seller.get("role", "user"), "rating": seller.get("rating", 5.0),
            "verified": seller.get("kycStatus") == "approved", "deals": await db.payments.count_documents({"sellerId": seller["id"], "status": {"$in": ["released", "completed"]}}),
            "trustScore": await compute_trust_score(seller["id"]),
        }
        l["seller"]["trustLabel"] = trust_label(l["seller"]["trustScore"])
    if viewer and viewer.get("lat") and l.get("lat"):
        l["distanceKm"] = round(haversine_km(viewer["lat"], viewer["lon"], l["lat"], l["lon"]), 1)
    return l


@api.get("/listings")
async def list_listings(
    category: Optional[str] = None,
    q: Optional[str] = None,
    brand: Optional[str] = None,
    condition: Optional[str] = None,
    priceMax: Optional[float] = None,
    verifiedOnly: Optional[bool] = False,
    sellerType: Optional[str] = None,  # user | dealer
    maxDistanceKm: Optional[float] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    sort: Optional[str] = "newest",
    limit: int = 200,
    viewer: Optional[dict] = Depends(get_optional_user),
):
    flt: Dict[str, Any] = {"status": {"$ne": "removed"}}
    if category:
        flt["category"] = category
    if brand:
        flt["brand"] = brand
    if condition:
        flt["condition"] = condition
    if priceMax is not None:
        flt["price"] = {"$lte": priceMax}
    if q:
        flt["title"] = {"$regex": q, "$options": "i"}
    cursor = db.listings.find(flt, {"_id": 0}).limit(limit)
    items = await cursor.to_list(limit)
    enriched = []
    user_lat = lat if lat is not None else (viewer.get("lat") if viewer else None)
    user_lon = lon if lon is not None else (viewer.get("lon") if viewer else None)
    for it in items:
        e = await enrich_listing(it, viewer={"lat": user_lat, "lon": user_lon} if user_lat else None)
        if verifiedOnly and not e.get("seller", {}).get("verified"):
            continue
        if sellerType in ("user", "dealer") and e.get("seller", {}).get("role") != sellerType:
            continue
        if maxDistanceKm is not None and e.get("distanceKm") is not None and e["distanceKm"] > maxDistanceKm:
            continue
        enriched.append(e)
    if sort == "priceLow":
        enriched.sort(key=lambda x: x["price"])
    elif sort == "priceHigh":
        enriched.sort(key=lambda x: -x["price"])
    elif sort == "rating":
        enriched.sort(key=lambda x: -(x.get("seller", {}).get("rating", 0)))
    elif sort == "distance":
        enriched.sort(key=lambda x: x.get("distanceKm") if x.get("distanceKm") is not None else 9999)
    else:
        enriched.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return enriched


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str, viewer: Optional[dict] = Depends(get_optional_user)):
    l = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not l:
        raise HTTPException(404, "Listing not found")
    return await enrich_listing(l, viewer)


@api.post("/listings")
async def create_listing(body: ListingCreate, user: dict = Depends(get_current_user)):
    if user.get("kycStatus") != "approved":
        raise HTTPException(403, "You must complete identity verification before selling.")
    doc = body.model_dump()
    doc.update({
        "id": newid(), "sellerId": user["id"], "status": "active",
        "views": 0, "saved": 0, "createdAt": now(),
    })
    if doc.get("aiFair") is None:
        doc["aiFair"] = round(doc["price"] * 1.05)
    await db.listings.insert_one(doc)
    return await enrich_listing(doc)


@api.patch("/listings/{listing_id}")
async def update_listing(listing_id: str, body: dict, user: dict = Depends(get_current_user)):
    l = await db.listings.find_one({"id": listing_id})
    if not l:
        raise HTTPException(404, "Listing not found")
    if l["sellerId"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Not your listing")
    body.pop("id", None); body.pop("_id", None); body.pop("sellerId", None)
    await db.listings.update_one({"id": listing_id}, {"$set": body})
    fresh = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return await enrich_listing(fresh)


@api.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user: dict = Depends(get_current_user)):
    l = await db.listings.find_one({"id": listing_id})
    if not l:
        raise HTTPException(404, "Listing not found")
    if l["sellerId"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Not your listing")
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "removed"}})
    return {"ok": True}


@api.get("/listings/mine/me")
async def my_listings(user: dict = Depends(get_current_user)):
    items = await db.listings.find({"sellerId": user["id"], "status": {"$ne": "removed"}}, {"_id": 0}).to_list(200)
    return [await enrich_listing(i) for i in items]


# ---------------- Smart Match ----------------
@api.post("/match")
async def smart_match(body: MatchQuery, viewer: Optional[dict] = Depends(get_optional_user)):
    flt: Dict[str, Any] = {"status": {"$ne": "removed"}, "price": {"$lte": body.budget * 1.2}}
    if body.deviceType:
        flt["category"] = body.deviceType
    if body.brand:
        flt["brand"] = body.brand
    if body.condition:
        flt["condition"] = body.condition
    items = await db.listings.find(flt, {"_id": 0}).to_list(200)
    results = []
    lat = body.lat
    lon = body.lon
    for it in items:
        e = await enrich_listing(it, viewer={"lat": lat, "lon": lon})
        if body.sellerType in ("user", "dealer") and e.get("seller", {}).get("role") != body.sellerType:
            continue
        dist = e.get("distanceKm")
        if body.maxDistanceKm and dist is not None and dist > body.maxDistanceKm:
            continue
        # match score: budget (40%), distance (25%), trust (20%), condition (15%)
        price_score = max(0, 1 - max(0, e["price"] - body.budget) / max(1.0, body.budget))
        dist_score = 1 - min(1.0, (dist or 50) / 50.0)
        trust_score = (e.get("seller", {}).get("trustScore", 50)) / 100
        cond_score = {"A": 1.0, "B": 0.85, "C": 0.7, "D": 0.55}.get(e.get("condition", "B"), 0.7)
        total = 0.4 * price_score + 0.25 * dist_score + 0.2 * trust_score + 0.15 * cond_score
        e["matchScore"] = int(round(total * 100))
        results.append(e)
    results.sort(key=lambda x: -x["matchScore"])
    return results[:24]


# ---------------- Chat ----------------
@api.get("/chats")
async def list_chats(user: dict = Depends(get_current_user)):
    chats = await db.chats.find({"participants": user["id"]}, {"_id": 0}).to_list(200)
    out = []
    for c in chats:
        other_id = next((p for p in c["participants"] if p != user["id"]), None)
        other = await db.users.find_one({"id": other_id}, {"_id": 0, "password": 0}) if other_id else None
        last_msg = await db.messages.find_one({"chatId": c["id"]}, {"_id": 0}, sort=[("createdAt", -1)])
        unread = await db.messages.count_documents({"chatId": c["id"], "fromId": {"$ne": user["id"]}, "seen": False})
        product = None
        if c.get("listingId"):
            product = await db.listings.find_one({"id": c["listingId"]}, {"_id": 0})
        out.append({
            **c,
            "other": {
                "id": other["id"], "name": other["name"], "avatar": other.get("avatar", ""),
                "role": other.get("role", "user"), "online": other["id"] in wsm.connections,
            } if other else None,
            "lastMessage": last_msg,
            "unread": unread,
            "product": product,
        })
    out.sort(key=lambda x: (x.get("lastMessage") or {}).get("createdAt", ""), reverse=True)
    return out


@api.post("/chats")
async def open_chat(body: ChatCreate, user: dict = Depends(get_current_user)):
    if body.otherUserId == user["id"]:
        raise HTTPException(400, "Cannot chat with yourself")
    other = await db.users.find_one({"id": body.otherUserId})
    if not other:
        raise HTTPException(404, "User not found")
    pair = sorted([user["id"], body.otherUserId])
    existing = await db.chats.find_one({"participants": pair, "listingId": body.listingId})
    if existing:
        existing.pop("_id", None)
        return existing
    chat = {
        "id": newid(), "participants": pair, "listingId": body.listingId, "createdAt": now(),
    }
    await db.chats.insert_one(chat)
    chat.pop("_id", None)
    return chat


@api.get("/chats/{chat_id}/messages")
async def chat_messages(chat_id: str, user: dict = Depends(get_current_user)):
    chat = await db.chats.find_one({"id": chat_id})
    if not chat or user["id"] not in chat["participants"]:
        raise HTTPException(404, "Chat not found")
    msgs = await db.messages.find({"chatId": chat_id}, {"_id": 0}).sort("createdAt", 1).to_list(1000)
    # Mark received messages as seen
    await db.messages.update_many({"chatId": chat_id, "fromId": {"$ne": user["id"]}, "seen": False}, {"$set": {"seen": True}})
    return msgs


@api.post("/messages")
async def send_message(body: MessageSend, user: dict = Depends(get_current_user)):
    chat = await db.chats.find_one({"id": body.chatId})
    if not chat or user["id"] not in chat["participants"]:
        raise HTTPException(404, "Chat not found")
    msg = {
        "id": newid(), "chatId": body.chatId, "fromId": user["id"],
        "text": body.text or "", "image": body.image,
        "createdAt": now(), "seen": False,
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    other_id = next((p for p in chat["participants"] if p != user["id"]), None)
    if other_id:
        await wsm.send(other_id, {"type": "message", "message": msg})
        # Notification
        await db.notifications.insert_one({
            "id": newid(), "userId": other_id, "type": "chat",
            "title": f"New message from {user['name']}",
            "text": (body.text or "[image]")[:80],
            "icon": "MessageSquare",
            "createdAt": now(), "unread": True,
        })
    return msg


@app.websocket("/api/ws/chat/{user_id}")
async def ws_chat(ws: WebSocket, user_id: str):
    await wsm.connect(user_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            try:
                payload = json.loads(data)
            except Exception:
                payload = {"type": "ping"}
            if payload.get("type") == "typing":
                other = payload.get("toUserId")
                if other:
                    await wsm.send(other, {"type": "typing", "fromUserId": user_id, "chatId": payload.get("chatId")})
    except WebSocketDisconnect:
        wsm.disconnect(user_id, ws)
    except Exception:
        wsm.disconnect(user_id, ws)


# ---------------- Payments / Escrow / Refunds ----------------
@api.post("/payments")
async def create_payment(body: PaymentCreate, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": body.listingId})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["sellerId"] == user["id"]:
        raise HTTPException(400, "Cannot buy your own listing")
    protection_ends = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    payment = {
        "id": newid(), "listingId": listing["id"], "buyerId": user["id"], "sellerId": listing["sellerId"],
        "amount": listing["price"], "method": body.method, "status": "escrow",  # escrow → released | refunded
        "protectionEndsAt": protection_ends, "createdAt": now(),
        "title": listing["title"], "image": (listing.get("images") or [""])[0],
    }
    await db.payments.insert_one(payment)
    payment.pop("_id", None)
    await db.listings.update_one({"id": listing["id"]}, {"$set": {"status": "sold"}})
    await db.notifications.insert_one({
        "id": newid(), "userId": listing["sellerId"], "type": "payment",
        "title": "Payment received in escrow",
        "text": f"${listing['price']:.0f} held in escrow for {listing['title']}",
        "icon": "Wallet", "createdAt": now(), "unread": True,
    })
    return payment


@api.get("/payments/mine")
async def my_payments(user: dict = Depends(get_current_user)):
    bought = await db.payments.find({"buyerId": user["id"]}, {"_id": 0}).to_list(200)
    sold = await db.payments.find({"sellerId": user["id"]}, {"_id": 0}).to_list(200)
    return {"bought": bought, "sold": sold}


@api.post("/payments/{payment_id}/confirm")
async def confirm_receipt(payment_id: str, user: dict = Depends(get_current_user)):
    p = await db.payments.find_one({"id": payment_id})
    if not p:
        raise HTTPException(404, "Payment not found")
    if p["buyerId"] != user["id"]:
        raise HTTPException(403, "Only the buyer can confirm receipt")
    if p["status"] != "escrow":
        raise HTTPException(400, "Payment is not in escrow")
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "released", "releasedAt": now()}})
    await db.users.update_one({"id": p["sellerId"]}, {"$inc": {"walletBalance": p["amount"]}})
    await db.notifications.insert_one({
        "id": newid(), "userId": p["sellerId"], "type": "payment",
        "title": "Payment released",
        "text": f"${p['amount']:.0f} added to your wallet.",
        "icon": "Wallet", "createdAt": now(), "unread": True,
    })
    return {"ok": True}


@api.post("/refunds")
async def request_refund(body: RefundCreate, user: dict = Depends(get_current_user)):
    p = await db.payments.find_one({"id": body.paymentId})
    if not p or p["buyerId"] != user["id"]:
        raise HTTPException(404, "Payment not found")
    if p["status"] != "escrow":
        raise HTTPException(400, "Cannot refund — payment already released")
    refund = {
        "id": newid(), "paymentId": p["id"], "buyerId": user["id"], "sellerId": p["sellerId"],
        "amount": p["amount"], "reason": body.reason, "status": "pending", "createdAt": now(),
    }
    await db.refunds.insert_one(refund)
    refund.pop("_id", None)
    return refund


@api.get("/refunds/mine")
async def my_refunds(user: dict = Depends(get_current_user)):
    items = await db.refunds.find({"$or": [{"buyerId": user["id"]}, {"sellerId": user["id"]}]}, {"_id": 0}).to_list(200)
    return items


# ---------------- Reviews ----------------
@api.post("/reviews")
async def create_review(body: ReviewCreate, user: dict = Depends(get_current_user)):
    if user["id"] == body.sellerId:
        raise HTTPException(400, "Cannot review yourself")
    rec = {
        "id": newid(), "sellerId": body.sellerId, "fromId": user["id"],
        "fromName": user["name"], "fromAvatar": user.get("avatar", ""),
        "rating": max(1, min(5, body.rating)), "text": body.text, "createdAt": now(),
    }
    await db.reviews.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api.get("/reviews/seller/{seller_id}")
async def reviews_for(seller_id: str):
    return await db.reviews.find({"sellerId": seller_id}, {"_id": 0}).sort("createdAt", -1).to_list(200)


# ---------------- Notifications ----------------
@api.get("/notifications")
async def my_notifications(user: dict = Depends(get_current_user)):
    return await db.notifications.find({"userId": user["id"]}, {"_id": 0}).sort("createdAt", -1).to_list(200)


@api.post("/notifications/read-all")
async def read_all(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"userId": user["id"]}, {"$set": {"unread": False}})
    return {"ok": True}


# ---------------- Verifications (KYC) ----------------
@api.post("/verifications")
async def submit_verification(body: VerificationCreate, user: dict = Depends(get_current_user)):
    rec = {
        "id": newid(), "userId": user["id"], "userName": user["name"], "userEmail": user["email"],
        "idDoc": body.idDoc, "selfie": body.selfie, "docType": body.docType,
        "status": "pending", "createdAt": now(),
    }
    await db.verifications.insert_one(rec)
    await db.users.update_one({"id": user["id"]}, {"$set": {"kycStatus": "pending"}})
    rec.pop("_id", None)
    return rec


@api.get("/verifications/me")
async def my_verification(user: dict = Depends(get_current_user)):
    rec = await db.verifications.find_one({"userId": user["id"]}, {"_id": 0}, sort=[("createdAt", -1)])
    return rec or {"status": "none"}


# ---------------- Device Validation ----------------
@api.post("/device-validations")
async def request_validation(body: DeviceValidationCreate, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": body.listingId})
    if not listing or listing["sellerId"] != user["id"]:
        raise HTTPException(404, "Listing not found")
    rec = {
        "id": newid(), "userId": user["id"], "listingId": body.listingId,
        "listingTitle": listing["title"],
        "pickupAddress": body.pickupAddress, "notes": body.notes,
        "status": "requested",  # requested → scheduled → in-progress → completed
        "timeline": [
            {"step": "requested", "label": "Request received", "time": now()},
        ],
        "fee": 25, "grade": None, "report": None, "createdAt": now(),
    }
    await db.device_validations.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api.get("/device-validations/mine")
async def my_validations(user: dict = Depends(get_current_user)):
    return await db.device_validations.find({"userId": user["id"]}, {"_id": 0}).sort("createdAt", -1).to_list(50)


# ---------------- Reports / Blocks ----------------
@api.post("/reports")
async def create_report(body: ReportCreate, user: dict = Depends(get_current_user)):
    rec = {
        "id": newid(), "reporterId": user["id"], "reporterName": user["name"],
        "targetId": body.targetId, "targetType": body.targetType, "reason": body.reason,
        "status": "open", "createdAt": now(),
    }
    await db.reports.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api.post("/blocks")
async def block_user(body: BlockCreate, user: dict = Depends(get_current_user)):
    await db.blocks.update_one({"userId": user["id"], "blockedUserId": body.userId}, {"$set": {"createdAt": now()}}, upsert=True)
    return {"ok": True}


# ---------------- Admin ----------------
async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user


@api.get("/admin/verifications")
async def admin_list_verifications(_=Depends(require_admin)):
    return await db.verifications.find({}, {"_id": 0}).sort("createdAt", -1).to_list(200)


@api.post("/admin/verifications/{vid}")
async def admin_review_verification(vid: str, body: AdminAction, _=Depends(require_admin)):
    rec = await db.verifications.find_one({"id": vid})
    if not rec:
        raise HTTPException(404, "Not found")
    new_status = "approved" if body.action == "approve" else "rejected"
    await db.verifications.update_one({"id": vid}, {"$set": {"status": new_status, "notes": body.notes}})
    await db.users.update_one({"id": rec["userId"]}, {"$set": {"kycStatus": new_status}})
    await db.notifications.insert_one({
        "id": newid(), "userId": rec["userId"], "type": "system",
        "title": f"Identity verification {new_status}",
        "text": "You're now a Verified Seller!" if new_status == "approved" else "Please re-submit your verification documents.",
        "icon": "ShieldCheck", "createdAt": now(), "unread": True,
    })
    return {"ok": True}


@api.get("/admin/listings")
async def admin_list_listings(_=Depends(require_admin)):
    items = await db.listings.find({}, {"_id": 0}).sort("createdAt", -1).to_list(500)
    return [await enrich_listing(i) for i in items]


@api.delete("/admin/listings/{lid}")
async def admin_delete_listing(lid: str, _=Depends(require_admin)):
    await db.listings.update_one({"id": lid}, {"$set": {"status": "removed"}})
    return {"ok": True}


@api.get("/admin/reports")
async def admin_reports(_=Depends(require_admin)):
    return await db.reports.find({}, {"_id": 0}).sort("createdAt", -1).to_list(500)


@api.post("/admin/reports/{rid}")
async def admin_resolve_report(rid: str, body: AdminAction, _=Depends(require_admin)):
    new_status = "resolved" if body.action == "resolve" else "dismissed"
    await db.reports.update_one({"id": rid}, {"$set": {"status": new_status, "notes": body.notes}})
    return {"ok": True}


@api.get("/admin/analytics")
async def admin_analytics(_=Depends(require_admin)):
    users = await db.users.count_documents({})
    listings = await db.listings.count_documents({"status": {"$ne": "removed"}})
    payments = await db.payments.count_documents({})
    revenue = 0
    async for p in db.payments.find({"status": {"$in": ["released", "completed"]}}, {"_id": 0, "amount": 1}):
        revenue += p["amount"]
    pending_kyc = await db.verifications.count_documents({"status": "pending"})
    return {"users": users, "listings": listings, "payments": payments, "revenue": revenue, "pendingKyc": pending_kyc}


# ---------------- Seed ----------------
async def seed_initial_data():
    if await db.users.count_documents({}) > 0:
        return
    logger.info("Seeding initial G2G data…")

    def avatar(seed):
        return f"https://i.pravatar.cc/200?img={seed}"

    users = [
        {"id": "user-admin", "name": "G2G Admin", "email": "admin@g2g.app", "password": "admin123", "role": "admin",
         "phone": "+65 9000 0001", "avatar": avatar(12), "bio": "Platform admin",
         "location": "Singapore", "lat": 1.3521, "lon": 103.8198,
         "emailVerified": True, "phoneVerified": True, "kycStatus": "approved",
         "walletBalance": 0, "rating": 5.0, "createdAt": now()},
        {"id": "user-aria", "name": "Aria Tan", "email": "aria@g2g.app", "password": "demo1234", "role": "user",
         "phone": "+65 9111 2222", "avatar": avatar(47), "bio": "Tech enthusiast & verified seller.",
         "location": "Singapore · Bugis", "lat": 1.3000, "lon": 103.8558,
         "emailVerified": True, "phoneVerified": True, "kycStatus": "approved",
         "walletBalance": 1240, "rating": 4.9, "createdAt": now()},
        {"id": "user-daniel", "name": "Daniel Lim", "email": "daniel@g2g.app", "password": "demo1234", "role": "user",
         "phone": "+60 12 333 4444", "avatar": avatar(33), "bio": "Buys & sells laptops.",
         "location": "Kuala Lumpur", "lat": 3.1390, "lon": 101.6869,
         "emailVerified": True, "phoneVerified": True, "kycStatus": "approved",
         "walletBalance": 540, "rating": 4.8, "createdAt": now()},
        {"id": "user-maya", "name": "Maya R.", "email": "maya@g2g.app", "password": "demo1234", "role": "user",
         "phone": "+62 812 5555 6666", "avatar": avatar(20), "bio": "",
         "location": "Jakarta", "lat": -6.2088, "lon": 106.8456,
         "emailVerified": True, "phoneVerified": False, "kycStatus": "approved",
         "walletBalance": 0, "rating": 4.7, "createdAt": now()},
        # Dealer
        {"id": "dealer-techhub", "name": "TechHub SG", "email": "store@techhub.sg", "password": "demo1234", "role": "dealer",
         "phone": "+65 6789 0000", "avatar": avatar(15), "bio": "Authorised reseller of pre-loved gadgets.",
         "location": "Singapore · Funan Mall", "lat": 1.2898, "lon": 103.8497,
         "emailVerified": True, "phoneVerified": True, "kycStatus": "approved",
         "walletBalance": 12500, "rating": 4.9, "createdAt": now()},
        {"id": "dealer-mobilezone", "name": "MobileZone KL", "email": "store@mobilezone.my", "password": "demo1234", "role": "dealer",
         "phone": "+60 3 9876 5432", "avatar": avatar(18), "bio": "Trusted dealer in KL.",
         "location": "Kuala Lumpur · Pavilion", "lat": 3.1490, "lon": 101.7100,
         "emailVerified": True, "phoneVerified": True, "kycStatus": "approved",
         "walletBalance": 8200, "rating": 4.8, "createdAt": now()},
        # New seller (low trust)
        {"id": "user-kenji", "name": "Kenji Y.", "email": "kenji@g2g.app", "password": "demo1234", "role": "user",
         "phone": "+65 9333 4444", "avatar": avatar(58), "bio": "New to G2G.",
         "location": "Singapore · Tampines", "lat": 1.3496, "lon": 103.9568,
         "emailVerified": True, "phoneVerified": False, "kycStatus": "none",
         "walletBalance": 0, "rating": 5.0, "createdAt": now()},
    ]
    await db.users.insert_many(users)

    img = {
        "iphone": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
        "iphone2": "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=900&q=80",
        "samsung": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80",
        "pixel": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
        "macbook": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
        "macbookAir": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=900&q=80",
        "ipad": "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=80",
        "ipadPro": "https://images.unsplash.com/photo-1585789575094-3c4d9f1f8f6c?auto=format&fit=crop&w=900&q=80",
        "ps5": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
        "watch": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80",
        "airpods": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80",
    }
    listings = [
        {"title": "iPhone 15 Pro 256GB — Natural Titanium", "category": "phones", "brand": "Apple", "model": "iPhone 15 Pro",
         "storage": "256GB", "ram": "8GB", "batteryHealth": 96, "condition": "A", "warranty": "Apple Care+ until 2026",
         "description": "Mint condition iPhone 15 Pro, used 6 months. Original box, cable, Apple Care+.",
         "price": 999, "aiFair": 1050, "images": [img["iphone"], img["iphone2"], img["samsung"]],
         "location": "Singapore · Bugis", "lat": 1.3000, "lon": 103.8558, "sellerId": "user-aria"},
        {"title": "MacBook Pro 14\" M3 Pro 18GB / 512GB", "category": "laptops", "brand": "Apple", "model": "MacBook Pro 14",
         "storage": "512GB", "ram": "18GB", "batteryHealth": 98, "condition": "A", "warranty": "6 months left",
         "description": "M3 Pro, Space Black. Light usage. Battery cycles: 84.",
         "price": 1850, "aiFair": 1920, "images": [img["macbook"], img["macbookAir"]],
         "location": "Kuala Lumpur · Pavilion", "lat": 3.1490, "lon": 101.7100, "sellerId": "dealer-mobilezone"},
        {"title": "Samsung Galaxy S24 Ultra 512GB", "category": "phones", "brand": "Samsung", "model": "Galaxy S24 Ultra",
         "storage": "512GB", "ram": "12GB", "batteryHealth": 93, "condition": "B", "warranty": "No",
         "description": "Titanium Gray, S Pen + box. Tiny scuff on bottom edge.",
         "price": 1100, "aiFair": 1080, "images": [img["samsung"], img["pixel"]],
         "location": "Jakarta", "lat": -6.2088, "lon": 106.8456, "sellerId": "user-maya"},
        {"title": "iPad Pro 11\" M2 256GB Wi-Fi", "category": "tablets", "brand": "Apple", "model": "iPad Pro 11 M2",
         "storage": "256GB", "ram": "8GB", "batteryHealth": 97, "condition": "A", "warranty": "No",
         "description": "Space Gray. Apple Pencil 2 included.",
         "price": 720, "aiFair": 760, "images": [img["ipadPro"], img["ipad"]],
         "location": "Singapore · Funan Mall", "lat": 1.2898, "lon": 103.8497, "sellerId": "dealer-techhub"},
        {"title": "PlayStation 5 Slim Disc Edition", "category": "consoles", "brand": "Sony", "model": "PS5 Slim",
         "storage": "1TB", "ram": "16GB", "batteryHealth": None, "condition": "B", "warranty": "8 months left",
         "description": "2 controllers, 3 games. Lightly used.",
         "price": 540, "aiFair": 560, "images": [img["ps5"]],
         "location": "Singapore · Tampines", "lat": 1.3496, "lon": 103.9568, "sellerId": "user-kenji"},
        {"title": "Apple Watch Series 9 45mm Cellular", "category": "smartwatches", "brand": "Apple", "model": "Watch Series 9",
         "storage": "64GB", "ram": "1GB", "batteryHealth": 95, "condition": "A", "warranty": "Apple Care",
         "description": "Midnight aluminum, sport loop. Practically new.",
         "price": 380, "aiFair": 395, "images": [img["watch"]],
         "location": "Singapore · Bugis", "lat": 1.3000, "lon": 103.8558, "sellerId": "user-aria"},
        {"title": "AirPods Pro (2nd Gen) USB-C", "category": "accessories", "brand": "Apple", "model": "AirPods Pro 2",
         "storage": "", "ram": "", "batteryHealth": 94, "condition": "A", "warranty": "No",
         "description": "USB-C version, full set. Tips never used.",
         "price": 165, "aiFair": 175, "images": [img["airpods"]],
         "location": "Singapore · Funan Mall", "lat": 1.2898, "lon": 103.8497, "sellerId": "dealer-techhub"},
        {"title": "Google Pixel 8 Pro 256GB Obsidian", "category": "phones", "brand": "Google", "model": "Pixel 8 Pro",
         "storage": "256GB", "ram": "12GB", "batteryHealth": 91, "condition": "B", "warranty": "No",
         "description": "Daily driver 1 year. Light scratches on back, screen flawless.",
         "price": 680, "aiFair": 720, "images": [img["pixel"], img["samsung"]],
         "location": "Kuala Lumpur · Pavilion", "lat": 3.1490, "lon": 101.7100, "sellerId": "dealer-mobilezone"},
    ]
    docs = []
    for l in listings:
        docs.append({**l, "id": newid(), "status": "active", "views": random.randint(50, 400),
                     "saved": random.randint(3, 30), "createdAt": now(), "method": "both"})
    await db.listings.insert_many(docs)
    # A couple of reviews
    review_seed = [
        {"sellerId": "user-aria", "fromId": "user-daniel", "fromName": "Daniel Lim", "fromAvatar": avatar(33), "rating": 5, "text": "Smooth transaction, exactly as described."},
        {"sellerId": "user-aria", "fromId": "user-maya", "fromName": "Maya R.", "fromAvatar": avatar(20), "rating": 5, "text": "Best seller on G2G. Fast shipping & verified seal."},
        {"sellerId": "dealer-techhub", "fromId": "user-aria", "fromName": "Aria Tan", "fromAvatar": avatar(47), "rating": 5, "text": "Pro dealer service, fully verified items."},
    ]
    for r in review_seed:
        await db.reviews.insert_one({"id": newid(), "createdAt": now(), **r})

    logger.info("Seed complete.")


@app.on_event("startup")
async def on_startup():
    try:
        await seed_initial_data()
    except Exception as e:
        logger.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
