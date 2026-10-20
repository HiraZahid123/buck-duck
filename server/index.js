// BuckDuck / StoreFront USA — production server
require('./env');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { openDb } = require('./db');
const { createPayments } = require('./payments');
const { initDb, createApi } = require('../core/api');

const env = process.env;
const PORT = Number(env.PORT || 3000);
const ROOT = path.join(__dirname, '..');
const DATA_DIR = env.DATA_DIR || path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const JWT_SECRET = env.JWT_SECRET || (env.NODE_ENV === 'production' ? null : 'dev-only-secret-change-me');
if (!JWT_SECRET) { console.error('JWT_SECRET must be set in production'); process.exit(1); }
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = openDb(path.join(DATA_DIR, 'buckduck.db'));
const payments = createPayments(env);

const saveImage = async (dataUrl) => {
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) throw Object.assign(new Error('Unsupported image'), { status: 400 });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 4 * 1024 * 1024) throw Object.assign(new Error('Image too large (max 4 MB)'), { status: 400 });
  const name = `${crypto.randomUUID()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
};

const deps = {
  db, payments, saveImage, demo: env.DEMO_MODE === 'true',
  hashPassword: (p) => bcrypt.hash(p, 10),
  verifyPassword: (p, h) => bcrypt.compare(p, h),
  signToken: async (uid) => jwt.sign({ sub: uid }, JWT_SECRET, { expiresIn: '30d' }),
  verifyToken: async (t) => { try { return jwt.verify(t, JWT_SECRET).sub; } catch { return null; } }
};

(async () => {
  const seeded = await initDb(db, deps);
  if (seeded) console.log('Database created and seeded with demo data (password for all demo accounts: demo1234)');
  const api = createApi(deps);
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://js.stripe.com', 'https://pay.google.com'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com', 'https://pay.google.com'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://pay.google.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:']
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // Stripe webhook — must read the raw body for signature verification
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (payments.mode !== 'stripe' || !env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('Webhooks not configured');
    let event;
    try { event = payments.constructEvent(req.body, req.headers['stripe-signature']); }
    catch (e) { return res.status(400).send(`Webhook signature error: ${e.message}`); }
    const o = event.data.object;
    let body = null;
    if (event.type === 'payment_intent.succeeded') {
      let method = 'card';
      try { method = (await payments.retrieveIntent(o.id)).method; } catch { /* default */ }
      body = { type: event.type, intent_id: o.id, method };
    } else if (event.type === 'payment_intent.payment_failed') body = { type: event.type, intent_id: o.id };
    else if (event.type === 'account.updated') body = { type: event.type, account_id: o.id, charges_enabled: !!(o.charges_enabled || o.payouts_enabled) };
    if (body) await api.handle({ method: 'POST', path: '/api/webhooks/payment', body });
    res.json({ received: true });
  });

  app.use(express.json({ limit: '6mb' }));

  // Simple in-memory rate limiter for auth endpoints
  const hits = new Map();
  app.use('/api/auth', (req, res, next) => {
    const key = req.ip; const nowMs = Date.now();
    const h = (hits.get(key) || []).filter((t) => nowMs - t < 15 * 60 * 1000); h.push(nowMs); hits.set(key, h);
    if (h.length > 30) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    next();
  });

  // Internal webhook route is never reachable from the outside
  app.all('/api/webhooks/{*rest}', (req, res) => res.status(404).json({ error: 'Not found' }));

  app.all('/api/{*rest}', async (req, res) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;
    const origin = `${req.protocol}://${req.get('host')}`;
    const r = await api.handle({ method: req.method, path: req.path, query: req.query, body: req.body, token, origin });
    res.status(r.status).json(r.body);
  });

  // Apple Pay domain verification (download the file from Stripe Dashboard → Settings → Payment methods → Apple Pay)
  app.get('/.well-known/apple-developer-merchantid-domain-association', (req, res) => {
    const f = path.join(ROOT, 'public', '.well-known', 'apple-developer-merchantid-domain-association');
    if (fs.existsSync(f)) return res.sendFile(f);
    res.status(404).send('Not configured');
  });

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));
  app.use('/core', express.static(path.join(ROOT, 'core'), { maxAge: '1h' }));
  app.use(express.static(path.join(ROOT, 'public'), { maxAge: '1h', index: 'index.html' }));
  app.get('/healthz', (req, res) => res.json({ ok: true, payments: payments.mode }));
  app.get('/{*rest}', (req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));

  app.listen(PORT, () => console.log(`BuckDuck running on http://localhost:${PORT}  (payments: ${payments.mode})`));
})();
