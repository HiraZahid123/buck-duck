// Builds a single self-contained demo page: real core API + SQLite (WASM) running in the browser.
const fs = require('fs'); const path = require('path');
const R = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const wasmB64 = fs.readFileSync(path.join(__dirname, '..', 'node_modules/sql.js/dist/sql-wasm.wasm')).toString('base64');
const sqlJs = R('node_modules/sql.js/dist/sql-wasm.js');
const css = R('public/styles.css');
const core = R('core/api.js');
const app = R('public/app.js');
const icon = 'data:image/svg+xml;base64,' + Buffer.from(R('public/icons/icon.svg')).toString('base64');
const transport = `
window.BUCK_DEFER_BOOT = true;
(function () {
  const b64 = document.getElementById('wasm-b64').textContent.trim();
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const norm = (v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);
  let api;
  const ready = initSqlJs({ wasmBinary: bin }).then(async (SQL) => {
    const raw = new SQL.Database();
    const all = (sql, p = []) => { const st = raw.prepare(sql); st.bind(p.map(norm)); const out = []; while (st.step()) out.push(st.getAsObject()); st.free(); return out; };
    const db = {
      exec: (s) => raw.exec(s), all, get: (sql, p) => all(sql, p)[0],
      run: (sql, p = []) => { raw.run(sql, p.map(norm)); const changes = raw.getRowsModified(); const id = raw.exec('SELECT last_insert_rowid()')[0].values[0][0]; return { id, changes }; }
    };
    const hash = async (pw) => { try { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bd:' + pw)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join(''); } catch { let h = 0; for (const c of 'bd:' + pw) h = (h * 31 + c.charCodeAt(0)) | 0; return 'h' + h; } };
    let n = 0;
    const payments = { mode: 'demo', publishableKey: null,
      async createIntent() { const id = 'pi_demo_' + Date.now() + '_' + (++n); return { id, client_secret: id + '_secret' }; },
      async retrieveIntent(id, o = {}) { return { id, status: 'succeeded', method: o.method || 'card' }; },
      async refund() { return { id: 're_demo' }; },
      async onboardMerchant() { return { accountId: 'acct_demo_' + Date.now(), chargesEnabled: true, url: null }; }, transfer: null };
    const deps = { db, payments, demo: true, hashPassword: hash, verifyPassword: async (p, h) => (await hash(p)) === h,
      signToken: async (uid) => 'demo.' + uid, verifyToken: async (t) => { const m = /^demo\\.(\\d+)$/.exec(t || ''); return m ? Number(m[1]) : null; },
      saveImage: async (d) => d, log: () => {} };
    await BuckCore.initDb(db, deps);
    api = BuckCore.createApi(deps);
  });
  window.BUCK_TRANSPORT = async ({ method, pathOnly, query, body, token }) => {
    await ready;
    return api.handle({ method, path: pathOnly, query: query || {}, body: method === 'GET' ? {} : body, token, origin: location.origin });
  };
  ready.then(() => window.BuckApp.boot()).catch((e) => { document.getElementById('app').innerHTML = '<div class="empty"><h2>Demo failed to start</h2><p>' + e.message + '</p></div>'; });
})();`;
const html = `<title>BuckDuck Demo</title>
<meta name="theme-color" content="#0B1F4B">
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${css}
:root{color-scheme:light} html,body{background:var(--bg)}
</style>
<div id="app"><div class="loader"><div class="spin"></div></div></div>
<script type="text/plain" id="wasm-b64">${wasmB64}</script>
<script>${sqlJs}</script>
<script>${core}</script>
<script>${transport}</script>
<script>${app}</script>`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'buckduck-demo.html'), html);
console.log('demo built', (html.length / 1024 / 1024).toFixed(2), 'MB');
