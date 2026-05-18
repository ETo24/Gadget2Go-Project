# Gadget2Go (G2G) — Cybridge Co. · PRD

## Original Problem Statement
University-demo MVP of a trusted second-hand gadget marketplace (CompAsia + Carousell + Apple aesthetic) with AI valuation, dealer marketplace, distance filtering, dynamic trust scoring, seller KYC, scam prevention, physical device validation, AI smart matching, real-time chat (WebSockets), payment escrow with 7-day buyer protection, refunds, reviews, and an admin panel.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), single `server.py`. Token = user_id (no JWT, no bcrypt). Mock OTP returned in API response.
- **Frontend**: CRA React 19 + Tailwind + Framer Motion + ShadCN UI + Lucide + recharts.
- **Real-time**: Native FastAPI WebSocket at `/api/ws/chat/{user_id}`.
- **Storage**: Base64 images inside Mongo documents (avatars, listing photos, KYC docs).
- **Geo**: Browser geolocation, Haversine distance computed on backend.

## What's Built (2026-02-05 → 2026-02-18)
### Backend (all under /api)
- Auth: signup→mockOtp→verify-otp→login→logout, forgot-password→reset-password
- Users: GET/PATCH /users/me, POST /users/me/avatar (base64), GET /users/{id}
- Listings: full CRUD, filter (category/brand/condition/price/sellerType/verified/distance), sort (newest/price/rating/distance), distance enrichment, KYC gating on POST
- Smart Match: POST /match → ranked listings with matchScore
- Chat: GET /chats, POST /chats, GET /chats/{id}/messages, POST /messages, WS /ws/chat/{user_id} for live messages + typing
- Payments/Escrow: POST /payments (held 7 days), POST /payments/{id}/confirm (release to wallet), POST /refunds, GET /payments/mine, GET /refunds/mine
- Reviews, Notifications, Verifications (KYC), Device validation, Reports, Blocks
- Admin: analytics, KYC review (approve/reject), listing removal, report resolution
- Seed: 7 users (admin + 4 personals + 2 dealers), 8 listings across cities, 3 reviews

### Frontend Pages (all responsive, dark-mode supported)
- Landing, Login, Register (user/dealer role), OTP Verify, Forgot/Reset Password
- Dashboard (trust score, wallet, KYC banner, trending, flash deals)
- Buy marketplace (filter sidebar + distance pills + dealer/personal toggle + grid/list)
- Product Detail (gallery, specs, scam banner, report/block, escrow CTA)
- Sell (multi-step, KYC-gated, ownership proof, AI valuation)
- Smart Match (filters → matched results with match%)
- AI Valuation, Chat (WS-powered list + window + image upload), Profile (avatar upload, reviews)
- Checkout (escrow payment), Wallet & Orders (purchases/sales/refunds tabs, countdown timer)
- Verification (ID + selfie upload), Device Validation (request + timeline)
- Notifications, Settings (theme/notification prefs), Admin (KYC/listings/reports)

## Test Credentials (see /app/memory/test_credentials.md)
- Admin: admin@g2g.app / admin123
- Verified user: aria@g2g.app / demo1234
- Dealer: store@techhub.sg / demo1234
- Unverified: kenji@g2g.app / demo1234

## Test Results (iteration_1)
- Backend: **28/28 pytest passing (100%)**
- Frontend: ~85% Playwright smoke — login/dashboard/wallet/profile/admin/KYC redirect all verified.
- 2 minor nits: type="submit" on login button (fixed), data-testid on ProductCard (already present on Link wrapper).

## Backlog / Future
- P1: Server-side state machine that auto-advances device-validation timeline (scheduled→inspected→completed)
- P1: Pre-compute and persist trustScore on user doc (currently recomputed per call)
- P2: Real email OTP via Resend (currently mocked)
- P2: Split server.py into modules (auth, listings, chat, payments, admin)
- P2: Bcrypt + JWT for production hardening
- P2: Object storage (S3-compatible) instead of base64 in Mongo for scale
- P2: Push notifications via Service Workers
