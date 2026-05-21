'use strict';
/**
 * NEXIA OS v60 — Servidor Unificado
 * Hardened para produção no Render
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = process.env.PORT || 3001;
const ROOT = __dirname;
const OUT  = path.join(ROOT, 'out');
const MAX_BODY = 1 * 1024 * 1024; // 1MB

// ─── CSP ──────────────────────────────────────────────────────────
const CSP = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' data: https:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss: ws:",
  "frame-src 'self' https:",
  "worker-src 'self' blob:",
].join('; ');

// ─── CORS ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.NEXIA_APP_URL || 'https://nexia-os.onrender.com')
  .split(',').map(u => u.trim()).filter(Boolean);

function corsOrigin(reqHeaders) {
  const origin = (reqHeaders && (reqHeaders.origin || reqHeaders.Origin)) || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// ─── RATE LIMITER ─────────────────────────────────────────────────
const RATE_STORE  = new Map();
const RATE_LIMITS = { free: 50, starter: 500, pro: 99999, enterprise: 99999 };
function checkRate(uid, plan) {
  const now = Date.now();
  const monthKey = new Date().toISOString().slice(0, 7);
  const key = `${uid}:${monthKey}`;
  if (!RATE_STORE.has(key)) {
    const d = new Date();
    RATE_STORE.set(key, { count: 0, reset: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() });
  }
  const e = RATE_STORE.get(key);
  if (now > e.reset) { const d = new Date(); e.count = 0; e.reset = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); }
  const limit = RATE_LIMITS[plan] ?? RATE_LIMITS.free;
  if (e.count >= limit) return { allowed: false, remaining: 0, limit };
  e.count++;
  return { allowed: true, remaining: limit - e.count, limit };
}
setInterval(() => { const now = Date.now(); for (const [k, e] of RATE_STORE) if (now > e.reset) RATE_STORE.delete(k); }, 3_600_000);

// ─── MIME TYPES ───────────────────────────────────────────────────
const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.webp':  'image/webp',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.txt':   'text/plain',
};

// ─── API ROUTES ───────────────────────────────────────────────────
const API_ROUTES = {
  '/api/cortex':          'cortex-chat',
  '/api/ai-analysis':     'cortex-chat',
  '/api/auth':            'auth',
  '/api/memory':          'cortex-memory',
  '/api/rag':             'rag-engine',
  '/api/autodev':         'autodev-engine',
  '/api/models':          'multi-model-engine',
  '/api/swarm':           'swarm',
  '/api/agent-run':       'cortex-agent',
  '/api/agents':          'agents',
  '/api/actions':         'action-engine',
  '/api/logs':            'cortex-logs',
  '/api/events':          'event-processor',
  '/api/notifications':   'notifications',
  '/api/tenant':          'tenant-admin',
  '/api/crm':             'tenant-admin',
  '/api/usage':           'usage',
  '/api/billing':         'billing',
  '/api/observe':         'observability',
  '/api/observability':   'observability',
  '/api/learn':           'cortex-learn',
  '/api/pabx':            'pabx-handler',
  '/api/osint':           'osint-query',
  '/api/takedown':        'takedown-gen',
  '/api/payment':         'payment-engine',
  '/api/metrics':         'metrics-aggregator',
  '/api/architect':       'architect',
  '/api/whatsapp':        'whatsapp-business',
  '/api/nfe':             'nfe-engine',
  '/api/dynamic-pricing': 'dynamic-pricing',
  '/api/sentinel':        'sentinel-iot',
  '/api/sentinel-qa':     'sentinel',
  '/api/governance':      'middleware',
  '/api/tenant-domain':   'tenant-domain',
  '/api/dunning':         'dunning-scheduler',
  '/api/kpi':             'kpi-engine',
  '/api/churn':           'churn-predictor',
  '/api/sales':           'ai-sales-agent',
  '/api/financial':       'ai-financial',
  '/api/internal-agents': 'internal-agents',
  '/api/audit':           'audit-log',
  '/api/autocommit':      'autocommit',
  '/api/ads':             'ads-engine',
  '/api/recovery':        'account-recovery',
  '/api/strike':          'strike-engine',
};

// ─── LOAD FUNCTIONS ───────────────────────────────────────────────
const FN_DIR = path.join(ROOT, 'netlify', 'functions');
const fns    = {};
function loadFunctions() {
  if (!fs.existsSync(FN_DIR)) { console.warn('[FN] netlify/functions/ não encontrado'); return; }
  const files = fs.readdirSync(FN_DIR)
    .filter(f => f.endsWith('.js') && !['firebase-init.js','middleware.js'].includes(f));
  for (const f of files) {
    const name = f.replace('.js', '');
    try { fns[name] = require(path.join(FN_DIR, f)); console.log('[FN] ✓', name); }
    catch (e) { console.warn('[FN] ✗', name, '-', e.message); }
  }
  console.log('[FN] Total:', Object.keys(fns).length + '/' + files.length);
}

// ─── RUN FUNCTION ─────────────────────────────────────────────────
async function runFn(name, req, res, body) {
  const fn = fns[name];
  const cors = corsOrigin(req.headers);
  if (!fn || !fn.handler) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': cors });
    return res.end(JSON.stringify({ error: 'Function não encontrada: ' + name }));
  }
  const p = url.parse(req.url, true);
  const event = {
    httpMethod: req.method,
    path: p.pathname,
    queryStringParameters: p.query || {},
    headers: req.headers,
    body: body?.length ? body.toString('utf8') : null,
    isBase64Encoded: false,
  };
  try {
    const r = await fn.handler(event, {});
    res.writeHead(r.statusCode || 200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': cors,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Id',
      ...(r.headers || {}),
    });
    res.end(r.body || '');
  } catch (e) {
    console.error('[FN ERROR]', name, e.message);
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': cors });
    res.end(JSON.stringify({ error: 'Function error', detail: e.message }));
  }
}

// ─── SERVE STATIC ─────────────────────────────────────────────────
function serveFile(filePath, res) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const cacheable = ['.css','.woff2','.svg','.png','.jpg','.ico','.woff','.ttf','.webp','.js'].includes(ext);
    const headers = {
      'Content-Type':             mime,
      'Cache-Control':            cacheable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options':   'nosniff',
      'Access-Control-Allow-Origin': '*',
    };
    if (ext === '.html') {
      headers['Content-Security-Policy'] = CSP;
      headers['X-Frame-Options']         = 'SAMEORIGIN';
      headers['X-XSS-Protection']        = '1; mode=block';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch { return false; }
}

function resolveFn(pathname) {
  if (API_ROUTES[pathname]) return API_ROUTES[pathname];
  for (const [route, fn] of Object.entries(API_ROUTES)) {
    if (pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) return fn;
  }
  const m = pathname.match(/^\/\.netlify\/functions\/([^/?]+)/);
  if (m) return m[1];
  return null;
}

// ─── FIREBASE CONFIG ──────────────────────────────────────────────
function serveFirebaseConfig(res) {
  if (!process.env.FIREBASE_API_KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ error: 'FIREBASE_API_KEY não configurado no Render.' }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN         || '',
    projectId:         process.env.FIREBASE_PROJECT_ID          || '',
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET      || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             process.env.FIREBASE_APP_ID              || '',
  }));
}

// ─── HTTP SERVER ──────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url);
  const pathname = (parsed.pathname || '/').replace(/\/\/+/g, '/').replace(/(.+)\/$/, '$1') || '/';

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  corsOrigin(req.headers),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Id',
    });
    return res.end();
  }

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      status: 'ok', version: '60.0.0',
      uptime: Math.floor(process.uptime()),
      functions: Object.keys(fns).length,
      frontend: fs.existsSync(path.join(OUT, 'index.html')),
      timestamp: new Date().toISOString(),
    }));
  }

  // Firebase config
  if (pathname === '/api/firebase-config') return serveFirebaseConfig(res);

  // API routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/.netlify/functions/')) {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload muito grande.' }));
        req.destroy(); return;
      }
      chunks.push(c);
    });
    req.on('end', () => runFn(resolveFn(pathname), req, res, Buffer.concat(chunks)));
    return;
  }

  // Tenant landing pages
  const tenantMap = {
    '/ces/landing':    path.join(ROOT, 'ces',         'ces-landing.html'),
    '/bezsan/landing': path.join(ROOT, 'bezsan',      'bezsan-landing.html'),
    '/vp/landing':     path.join(ROOT, 'viajante-pro','vp-landing.html'),
    '/splash/landing': path.join(ROOT, 'splash',      'splash-landing.html'),
  };
  if (tenantMap[pathname] && serveFile(tenantMap[pathname], res)) return;

  // Static assets from out/
  if (serveFile(path.join(OUT, pathname), res)) return;

  // SPA fallback — sempre out/index.html (NUNCA o index.html raiz)
  const fallback = path.join(OUT, 'index.html');
  if (fs.existsSync(fallback)) {
    return serveFile(fallback, res);
  }

  res.writeHead(503, { 'Content-Type': 'text/html' });
  res.end('<h1>NEXIA OS</h1><p>Frontend não encontrado. Build necessário.</p>');
});

// ─── KEEPALIVE ────────────────────────────────────────────────────
function startKeepalive() {
  const appUrl = process.env.NEXIA_APP_URL;
  if (!appUrl) return;
  setInterval(async () => {
    try { const r = await fetch(appUrl + '/health'); console.log('[KEEPALIVE]', r.status); }
    catch (e) { console.warn('[KEEPALIVE] falhou:', e.message); }
  }, 10 * 60 * 1000);
  console.log('[KEEPALIVE] ativo →', appUrl);
}

// ─── START ────────────────────────────────────────────────────────
loadFunctions();
server.listen(PORT, () => {
  console.log('\n[NEXIA OS v60] porta', PORT);
  console.log('[NEXIA] frontend:', fs.existsSync(path.join(OUT, 'index.html')) ? '✓' : '✗ BUILD NECESSÁRIO');
  console.log('[NEXIA] functions:', Object.keys(fns).length);
  console.log('[NEXIA] url:', process.env.NEXIA_APP_URL || 'http://localhost:' + PORT);
  startKeepalive();
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
process.on('uncaughtException',  e => console.error('[NEXIA] uncaughtException:', e.message));
process.on('unhandledRejection', r => console.error('[NEXIA] unhandledRejection:', r));
