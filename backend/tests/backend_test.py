"""G2G backend pytest suite — covers auth, listings, KYC, match, chat, payments, refunds, reviews, notifications, device validation, admin."""
import os
import uuid
import pytest
import requests
import websocket  # websocket-client
import json
import threading
import time

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback to frontend/.env file parsing
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"


# ---------------- fixtures ----------------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def aria(s):
    r = s.post(f"{API}/auth/login", json={"email": "aria@g2g.app", "password": "demo1234"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"]}


@pytest.fixture(scope="session")
def admin(s):
    r = s.post(f"{API}/auth/login", json={"email": "admin@g2g.app", "password": "admin123"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"]}


@pytest.fixture(scope="session")
def kenji(s):
    r = s.post(f"{API}/auth/login", json={"email": "kenji@g2g.app", "password": "demo1234"})
    assert r.status_code == 200
    d = r.json()
    return {"token": d["token"], "user": d["user"]}


@pytest.fixture(scope="session")
def dealer(s):
    r = s.post(f"{API}/auth/login", json={"email": "store@techhub.sg", "password": "demo1234"})
    assert r.status_code == 200
    return {"token": r.json()["token"], "user": r.json()["user"]}


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_signup_returns_mock_otp(self, s):
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/signup", json={
            "name": "Test User", "email": email, "password": "p@ss1234", "role": "user"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "mockOtp" in d and len(d["mockOtp"]) == 6

    def test_verify_otp_creates_session(self, s):
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/signup", json={"name": "T", "email": email, "password": "x", "role": "user"})
        otp = r.json()["mockOtp"]
        r2 = s.post(f"{API}/auth/verify-otp", json={"email": email, "code": otp})
        assert r2.status_code == 200
        d = r2.json()
        assert "token" in d and d["user"]["email"] == email.lower()
        assert d["user"]["emailVerified"] is True

    def test_login_seeded_user(self, aria):
        assert aria["user"]["email"] == "aria@g2g.app"
        assert aria["user"]["kycStatus"] == "approved"

    def test_login_admin(self, admin):
        assert admin["user"]["role"] == "admin"

    def test_login_invalid_email(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "ghost@nope.io", "password": "x"})
        assert r.status_code == 404

    def test_login_wrong_password(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "aria@g2g.app", "password": "wrong"})
        assert r.status_code == 401

    def test_login_unverified_rejected(self, s):
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        s.post(f"{API}/auth/signup", json={"name": "T", "email": email, "password": "p", "role": "user"})
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "p"})
        assert r.status_code == 403

    def test_forgot_and_reset_password(self, s):
        # use a fresh signed-up user
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        sig = s.post(f"{API}/auth/signup", json={"name": "T", "email": email, "password": "old", "role": "user"})
        otp = sig.json()["mockOtp"]
        s.post(f"{API}/auth/verify-otp", json={"email": email, "code": otp})
        r = s.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200 and "mockOtp" in r.json()
        rcode = r.json()["mockOtp"]
        r2 = s.post(f"{API}/auth/reset-password", json={"email": email, "code": rcode, "newPassword": "newpass"})
        assert r2.status_code == 200
        r3 = s.post(f"{API}/auth/login", json={"email": email, "password": "newpass"})
        assert r3.status_code == 200


# ---------------- Listings ----------------
class TestListings:
    def test_list_seeded_8(self, s):
        r = s.get(f"{API}/listings")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 8
        sample = items[0]
        assert "seller" in sample and "trustScore" in sample["seller"]

    def test_list_with_geo_distance(self, s):
        r = s.get(f"{API}/listings", params={"lat": 1.3521, "lon": 103.8198})
        items = r.json()
        with_dist = [i for i in items if "distanceKm" in i]
        assert len(with_dist) > 0

    def test_filter_max_distance(self, s):
        r = s.get(f"{API}/listings", params={"lat": 1.3521, "lon": 103.8198, "maxDistanceKm": 50})
        items = r.json()
        for i in items:
            assert i.get("distanceKm", 0) <= 50

    def test_filter_seller_type_dealer(self, s):
        r = s.get(f"{API}/listings", params={"sellerType": "dealer"})
        for i in r.json():
            assert i["seller"]["role"] == "dealer"

    def test_filter_verified_only(self, s):
        r = s.get(f"{API}/listings", params={"verifiedOnly": "true"})
        for i in r.json():
            assert i["seller"]["verified"] is True

    def test_filter_price_max_and_category(self, s):
        r = s.get(f"{API}/listings", params={"priceMax": 800, "category": "phones"})
        for i in r.json():
            assert i["price"] <= 800
            assert i["category"] == "phones"


# ---------------- KYC gating ----------------
class TestKYC:
    def test_unverified_cannot_create_listing(self, s, kenji):
        body = {"title": "X", "category": "phones", "brand": "Apple", "model": "X",
                "condition": "B", "price": 100}
        r = s.post(f"{API}/listings", headers=H(kenji["token"]), json=body)
        assert r.status_code == 403

    def test_verification_submit_admin_approve_flow(self, s, admin):
        # signup new user
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        sig = s.post(f"{API}/auth/signup", json={"name": "Verify", "email": email, "password": "p", "role": "user"})
        otp = sig.json()["mockOtp"]
        v = s.post(f"{API}/auth/verify-otp", json={"email": email, "code": otp})
        tok = v.json()["token"]
        b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII="
        sub = s.post(f"{API}/verifications", headers=H(tok), json={"idDoc": b64, "selfie": b64, "docType": "ic"})
        assert sub.status_code == 200
        vid = sub.json()["id"]
        # admin approves
        appr = s.post(f"{API}/admin/verifications/{vid}", headers=H(admin["token"]), json={"action": "approve"})
        assert appr.status_code == 200
        # User can now sell
        body = {"title": "Approved listing", "category": "phones", "brand": "Apple", "model": "iPhone",
                "condition": "A", "price": 200}
        r = s.post(f"{API}/listings", headers=H(tok), json=body)
        assert r.status_code == 200, r.text
        assert r.json()["sellerId"]


# ---------------- Smart match ----------------
class TestMatch:
    def test_match_returns_scores_sorted(self, s):
        r = s.post(f"{API}/match", json={"budget": 1000, "maxDistanceKm": 1000, "lat": 1.3521, "lon": 103.8198})
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        scores = [i["matchScore"] for i in items]
        assert scores == sorted(scores, reverse=True)
        assert all(0 <= s_ <= 100 for s_ in scores)


# ---------------- Chat ----------------
class TestChat:
    def test_chat_create_message_get(self, s, aria, kenji):
        r = s.post(f"{API}/chats", headers=H(aria["token"]), json={"otherUserId": kenji["user"]["id"]})
        assert r.status_code == 200
        chat_id = r.json()["id"]
        m = s.post(f"{API}/messages", headers=H(aria["token"]), json={"chatId": chat_id, "text": "Hello Kenji"})
        assert m.status_code == 200
        msgs = s.get(f"{API}/chats/{chat_id}/messages", headers=H(kenji["token"])).json()
        assert any(x["text"] == "Hello Kenji" for x in msgs)

    def test_websocket_chat_delivery(self, s, aria, kenji):
        r = s.post(f"{API}/chats", headers=H(aria["token"]), json={"otherUserId": kenji["user"]["id"]})
        chat_id = r.json()["id"]
        ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + f"/api/ws/chat/{kenji['user']['id']}"
        received = []

        def listen():
            try:
                ws = websocket.create_connection(ws_url, timeout=5)
                ws.settimeout(5)
                while True:
                    msg = ws.recv()
                    received.append(json.loads(msg))
            except Exception:
                pass

        t = threading.Thread(target=listen, daemon=True)
        t.start()
        time.sleep(2)
        s.post(f"{API}/messages", headers=H(aria["token"]), json={"chatId": chat_id, "text": "WS test"})
        time.sleep(2)
        assert any(r.get("type") == "message" and r.get("message", {}).get("text") == "WS test" for r in received), f"received={received}"


# ---------------- Payments / Escrow / Refunds ----------------
class TestPayments:
    def _seed_listing_for_aria(self, s, aria):
        body = {"title": f"TEST_payment_{uuid.uuid4().hex[:6]}", "category": "phones", "brand": "Apple",
                "model": "X", "condition": "A", "price": 50}
        r = s.post(f"{API}/listings", headers=H(aria["token"]), json=body)
        assert r.status_code == 200, r.text
        return r.json()

    def test_create_payment_marks_sold_then_confirm(self, s, aria, dealer):
        listing = self._seed_listing_for_aria(s, aria)
        # buyer = dealer
        p = s.post(f"{API}/payments", headers=H(dealer["token"]), json={"listingId": listing["id"]})
        assert p.status_code == 200, p.text
        pay = p.json()
        assert pay["status"] == "escrow"
        # listing should be sold
        l2 = s.get(f"{API}/listings/{listing['id']}").json()
        assert l2["status"] == "sold"
        # confirm
        c = s.post(f"{API}/payments/{pay['id']}/confirm", headers=H(dealer["token"]))
        assert c.status_code == 200

    def test_refund_request_in_escrow(self, s, aria, dealer):
        listing = self._seed_listing_for_aria(s, aria)
        p = s.post(f"{API}/payments", headers=H(dealer["token"]), json={"listingId": listing["id"]}).json()
        r = s.post(f"{API}/refunds", headers=H(dealer["token"]), json={"paymentId": p["id"], "reason": "Defect"})
        assert r.status_code == 200
        assert r.json()["status"] == "pending"


# ---------------- Reviews / Notifications ----------------
class TestReviewsNotif:
    def test_reviews_seller(self, s):
        r = s.get(f"{API}/reviews/seller/user-aria")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_notifications_and_read_all(self, s, aria):
        r = s.get(f"{API}/notifications", headers=H(aria["token"]))
        assert r.status_code == 200
        ra = s.post(f"{API}/notifications/read-all", headers=H(aria["token"]))
        assert ra.status_code == 200


# ---------------- Device Validation ----------------
class TestDeviceValidation:
    def test_request_and_list(self, s, aria):
        # create a listing for aria
        body = {"title": f"TEST_dv_{uuid.uuid4().hex[:6]}", "category": "phones", "brand": "Apple",
                "model": "X", "condition": "A", "price": 100}
        l = s.post(f"{API}/listings", headers=H(aria["token"]), json=body).json()
        r = s.post(f"{API}/device-validations", headers=H(aria["token"]),
                   json={"listingId": l["id"], "pickupAddress": "Singapore", "notes": "test"})
        assert r.status_code == 200
        assert r.json()["status"] == "requested"
        m = s.get(f"{API}/device-validations/mine", headers=H(aria["token"])).json()
        assert any(x["id"] == r.json()["id"] for x in m)


# ---------------- Admin ----------------
class TestAdmin:
    def test_analytics(self, s, admin):
        r = s.get(f"{API}/admin/analytics", headers=H(admin["token"]))
        assert r.status_code == 200
        d = r.json()
        for k in ["users", "listings", "payments", "revenue", "pendingKyc"]:
            assert k in d

    def test_admin_routes_403_for_non_admin(self, s, aria):
        r = s.get(f"{API}/admin/analytics", headers=H(aria["token"]))
        assert r.status_code == 403

    def test_admin_lists_and_delete_listing(self, s, admin, aria):
        # create a disposable listing
        body = {"title": f"TEST_admin_{uuid.uuid4().hex[:6]}", "category": "phones", "brand": "Apple",
                "model": "X", "condition": "A", "price": 10}
        l = s.post(f"{API}/listings", headers=H(aria["token"]), json=body).json()
        d = s.delete(f"{API}/admin/listings/{l['id']}", headers=H(admin["token"]))
        assert d.status_code == 200
        # listing should be removed (404 or status removed)
        g = s.get(f"{API}/listings/{l['id']}")
        assert g.status_code in (200, 404)
        if g.status_code == 200:
            assert g.json().get("status") == "removed"

    def test_admin_verifications_and_reports(self, s, admin):
        v = s.get(f"{API}/admin/verifications", headers=H(admin["token"]))
        assert v.status_code == 200
        rep = s.get(f"{API}/admin/reports", headers=H(admin["token"]))
        assert rep.status_code == 200
