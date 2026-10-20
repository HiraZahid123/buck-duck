# BuckDuck · StoreFront USA

Weekly grocery delivery marketplace. Independent grocery stores run their own storefronts; customers fill one cart across many stores, choose a **Saturday delivery window** (6 AM–12 PM or 12 PM–4 PM), and pay by card, Apple Pay or Google Pay. Stores pack orders in BuckDuck bags; BuckDuck drivers pick up and deliver.

One codebase serves four interfaces:

| Interface | URL | Who |
|---|---|---|
| StoreFront USA website + BuckDuck app | `/#/` | Customers |
| Merchant portal | `/#/merchant` | Partner stores |
| Driver app (mobile) | `/#/driver` | Drivers |
| Admin console | `/#/admin` | BuckDuck operations |

## Quick start (local)

Requires **Node.js 22.5 or newer** (uses the built-in `node:sqlite`).

```bash
npm install
cp .env.example .env        # optional — defaults work for local testing
npm run dev                 # http://localhost:3000
```

The first start creates `data/buckduck.db` and seeds 7 stores, ~70 products, 8 weeks of order history and a live pipeline for next Saturday. All demo accounts use the password **`demo1234`**:

| Role | Email |
|---|---|
| Customer | customer@buckduck.com |
| Merchant (Accra Market) | merchant@buckduck.com |
| Driver | driver@buckduck.com |
| Admin | admin@buckduck.com |

With `DEMO_MODE=true` a bar at the bottom of every page switches between the four roles in one click. Reset to fresh demo data with `npm run reset-db`.

## Payments (Stripe)

Without Stripe keys the app runs in **test mode** — checkout shows Card, Apple Pay and Google Pay buttons that simulate a successful payment. To take real payments:

1. Create a Stripe account and copy the **secret** and **publishable** keys into `.env` (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`). Use `sk_test_…`/`pk_test_…` first.
2. **Payment methods:** Stripe Dashboard → Settings → Payment methods → turn on Cards, Apple Pay, Google Pay (and Link if you like). The app uses PaymentIntents with automatic payment methods, so no code change is needed.
3. **Apple Pay domain:** Dashboard → Settings → Payment methods → Apple Pay → Add domain. Download the verification file and save it as `public/.well-known/apple-developer-merchantid-domain-association`. The server already serves that path. Apple Pay appears only on HTTPS, in Safari / iOS with a card in Wallet.
4. **Google Pay** appears in Chrome when the shopper has a saved card; no extra setup.
5. **Webhook:** Dashboard → Developers → Webhooks → add endpoint `https://YOUR-DOMAIN/api/stripe/webhook` with events `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`. Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. **Store payouts (Stripe Connect):** Dashboard → Connect → enable Express accounts. Merchants click **Connect with Stripe** on their Payouts page; when an order is marked delivered, the store's share (subtotal minus commission) is transferred automatically.

Card data never touches the BuckDuck server — Stripe Elements collects it in Stripe-hosted fields.

## Deploy

### Render (simplest)
Push this folder to a GitHub repository, then on Render choose **New → Blueprint** and select the repo. `render.yaml` provisions the web service, a persistent disk at `/data`, and a generated `JWT_SECRET`. Add your Stripe keys in the dashboard.

### Docker (any host: Railway, Fly.io, DigitalOcean, AWS)
```bash
docker build -t buckduck .
docker run -p 3000:3000 -v buckduck-data:/data \
  -e JWT_SECRET=$(openssl rand -hex 48) \
  -e STRIPE_SECRET_KEY=sk_live_... -e STRIPE_PUBLISHABLE_KEY=pk_live_... -e STRIPE_WEBHOOK_SECRET=whsec_... \
  buckduck
```
Always mount a persistent volume at `/data` — it holds the database and uploaded photos.

### Going live checklist
- [ ] `DEMO_MODE=false`, strong `JWT_SECRET`, HTTPS domain
- [ ] Live Stripe keys, webhook, Apple Pay domain verified
- [ ] Change or remove the seeded demo accounts (or start from an empty `data/` folder and register a real admin — see below)
- [ ] Set service ZIP codes, fees and windows in **Admin → Settings**
- [ ] Back up `/data/buckduck.db` daily

**Creating your first real admin:** register normally, then run
`node -e "const {openDb}=require('./server/db');openDb('data/buckduck.db').run(\"UPDATE users SET role='admin' WHERE email=?\",['you@yourdomain.com'])"`

## Mobile app

The customer site and driver app are an installable **Progressive Web App**: on iPhone open the site in Safari → Share → Add to Home Screen; on Android Chrome shows an Install prompt. For App Store / Google Play listings, wrap the same site with [Capacitor](https://capacitorjs.com): `npx cap init BuckDuck com.buckduck.app --web-dir=public` then `npx cap add ios` / `npx cap add android`.

## How it works

```
core/api.js        All business logic: pricing, Saturday windows & capacity, order status flow,
                   merchant/driver/admin rules, payouts. Shared by the server and the demo build.
server/index.js    Express server: auth (bcrypt + JWT), security headers, rate limiting,
                   Stripe webhook, image uploads, static files.
server/payments.js Stripe PaymentIntents, refunds, Connect onboarding and transfers (demo simulator without keys).
server/db.js       SQLite adapter (node:sqlite, WAL mode).
public/            Single-page app (no build step): app.js, styles.css, PWA manifest + service worker.
demo/build.js      Builds a self-contained demo page that runs the real core in the browser (SQLite WASM).
```

### Order lifecycle
`placed` (paid) → `accepted` (store) → `packing` (store) → `ready` + bag count (store) → `picked_up` (driver confirms bags) → `delivered` (driver note + photo). Customers can cancel while `placed`; stores can decline/cancel before packing; admins can override, reassign drivers and refund (full or partial).

### Delivery windows
Windows are generated automatically for the delivery weekday (Saturday by default) several weeks ahead. Each has a capacity; ordering closes `order_cutoff_hours` before the window starts (24 h default) or when full. Admins can pause windows, change capacity or add special windows. Delivery day, default windows and cutoff are all editable in **Admin → Settings**.

### Fees (defaults, editable in Admin → Settings)
Delivery $5.99 per store · service fee 5% (min $1.99) · merchant commission 15% (per-store override) · driver base pay $5.50 per order + 100% of tips · minimum order $15.

## Scaling notes
SQLite comfortably handles thousands of orders per week on one server. When you outgrow it, port `server/db.js` to PostgreSQL (the core uses plain SQL with `?` placeholders) and move uploads to S3-compatible storage by changing `saveImage` in `server/index.js`.

## API reference (summary)
Public: `GET /api/config`, `POST /api/auth/register|login`, `GET /api/stores`, `GET /api/stores/:slug`, `GET /api/search?q=`, `GET /api/windows`, `POST /api/checkout/quote`
Customer: `POST /api/checkout`, `POST /api/checkout/:id/confirm`, `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/cancel`
Merchant: `/api/merchant/summary|store|products|orders|payouts`, `POST /api/merchant/orders/:id/status`, `POST /api/merchant/stripe/onboard`
Driver: `/api/driver/summary|available|route|history`, `POST /api/driver/online`, `POST /api/driver/orders/:id/claim|release|status`
Admin: `/api/admin/overview|orders|stores|users|drivers|windows|settings|finance`, `POST /api/admin/orders/:id`, `POST /api/admin/orders/:id/refund`
