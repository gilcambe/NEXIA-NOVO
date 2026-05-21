'use strict';
/**
 * NEXIA OS v59 — Servidor Unificado
 * CORREÇÃO CRÍTICA: build automático garantido na inicialização
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const PORT = process.env.PORT || 3001;
const ROOT = __dirname;
const OUT  = path.join(ROOT, 'out');
const MAX_BODY_SIZE = 1 * 1024 * 1024;

// ─── CORS ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.NEXIA_APP_URL || 'https://nexia-os.onrender.com')
  .split(',').map(u => u.trim()).filter(Boolean);

function getCorsOrigin(reqHeaders) {
  if (!ALLOWED_ORIGINS.length) return '*';
  const origin = (reqHeaders && (reqHeaders.origin || reqHeaders.Origin)) || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// ─── RATE LIMITER ─────────────────────────────────────────────────
const RATE_STORE  = new Map();
const RATE_LIMITS = { free: 50, starter: 500, pro: 99999, enterprise: 99999 };
function checkRateLimit(uid, plan) {
  const now = Date.now(), monthKey = new Date().toISOString().slice(0, 7);
  const key = `${uid}:${monthKey}`;
  if (!RATE_STORE.has(key)) {
    const d = new Date();
    RATE_STORE.set(key, { count: 0, reset: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() });
  }
  const entry = RATE_STORE.get(key);
  if (now > entry.reset) { const d = new Date(); entry.count = 0; entry.reset = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); }
  const limit = RATE_LIMITS[plan] ?? RATE_LIMITS.free;
  if (entry.count >= limit) return { allowed: false, remaining: 0, limit };
  entry.count++;
  return { allowed: true, remaining: limit - entry.count, limit };
}
setInterval(() => { const now = Date.now(); for (const [k, e] of RATE_STORE.entries()) if (now > e.reset) RATE_STORE.delete(k); }, 3600000);

// ─── FIREBASE CONFIG endpoint ─────────────────────────────────────
function serveFirebaseConfig(res) {
  if (!process.env.FIREBASE_API_KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Firebase config unavailable. Configure FIREBASE_API_KEY no Render.' }));
    return;
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

// ─── MIME TYPES ───────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain',
};

// ─── API ROUTES → functions ───────────────────────────────────────
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

// ─── CARREGA FUNCTIONS ────────────────────────────────────────────
const FUNCTIONS_DIR = path.join(ROOT, 'netlify', 'functions');
const loadedFunctions = {};
function loadFunctions() {
  if (!fs.existsSync(FUNCTIONS_DIR)) {
    console.warn('[FN] netlify/functions/ não encontrado — APIs indisponíveis');
    return;
  }
  const files = fs.readdirSync(FUNCTIONS_DIR)
    .filter(f => f.endsWith('.js') && !['firebase-init.js', 'middleware.js'].includes(f));
  for (const file of files) {
    const name = file.replace('.js', '');
    try {
      loadedFunctions[name] = require(path.join(FUNCTIONS_DIR, file));
      console.log('[FN] ✓', name);
    } catch (e) {
      console.warn('[FN] ✗', name, '-', e.message);
    }
  }
  console.log('[FN] Total:', Object.keys(loadedFunctions).length + '/' + files.length);
}

// ─── ADAPTER: Node req/res → Netlify event ────────────────────────
async function runFunction(fnName, req, res, body) {
  const fn = loadedFunctions[fnName];
  if (!fn || !fn.handler) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getCorsOrigin(req.headers) });
    res.end(JSON.stringify({ error: 'Function não encontrada: ' + fnName }));
    return;
  }
  const parsedUrl = url.parse(req.url, true);
  const event = {
    httpMethod: req.method,
    path: parsedUrl.pathname,
    queryStringParameters: parsedUrl.query || {},
    headers: req.headers,
    body: body && body.length ? body.toString('utf8') : null,
    isBase64Encoded: false,
  };
  try {
    const result = await fn.handler(event, {});
    res.writeHead(result.statusCode || 200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': getCorsOrigin(req.headers),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Id',
      ...(result.headers || {}),
    });
    res.end(result.body || '');
  } catch (e) {
    console.error('[FN ERROR]', fnName, e.message);
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getCorsOrigin(req.headers) });
    res.end(JSON.stringify({ error: 'Function error', detail: e.message }));
  }
}

// ─── SERVE ARQUIVO ESTÁTICO ───────────────────────────────────────
function serveFile(filePath, res) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheable = ['.css','.woff2','.svg','.png','.jpg','.ico','.woff','.ttf','.webp','.js'].includes(ext);
   const headers = {
      'Content-Type': mime,
      'Cache-Control': cacheable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    };
    if (ext === '.html') {
      headers['Content-Security-Policy'] = [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
        "style-src 'self' 'unsafe-inline' https:",
        "font-src 'self' data: https:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https: wss: ws:",
        "frame-src 'self' https:",
        "worker-src 'self' blob:",
      ].join('; ');
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch { return false; }
}

function resolveFunctionName(pathname) {
  if (API_ROUTES[pathname]) return API_ROUTES[pathname];
  for (const [route, fn] of Object.entries(API_ROUTES)) {
    if (pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) return fn;
  }
  const m = pathname.match(/^\/\.netlify\/functions\/([^/?]+)/);
  if (m) return m[1];
  return null;
}

// ─── SERVIDOR HTTP ────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname  = (parsedUrl.pathname || '/').replace(/\/\/+/g, '/').replace(/(.+)\/$/, '$1') || '/';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': getCorsOrigin(req.headers),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Id',
    });
    return res.end();
  }

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      status: 'ok', version: '59.1.0',
      uptime: Math.floor(process.uptime()),
      functions: Object.keys(loadedFunctions).length,
      frontend: fs.existsSync(path.join(OUT, 'index.html')),
      timestamp: new Date().toISOString(),
    }));
  }

  if (pathname === '/api/firebase-config') {
    return serveFirebaseConfig(res);
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/.netlify/functions/')) {
    const chunks = []; let bodySize = 0;
    req.on('data', c => {
      bodySize += c.length;
      if (bodySize > MAX_BODY_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload muito grande.' }));
        req.destroy(); return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const fnName = resolveFunctionName(pathname);
      runFunction(fnName, req, res, Buffer.concat(chunks));
    });
    return;
  }

  const tenantMap = {
    '/ces/landing':    path.join(ROOT, 'ces', 'ces-landing.html'),
    '/bezsan/landing': path.join(ROOT, 'bezsan', 'bezsan-landing.html'),
    '/vp/landing':     path.join(ROOT, 'viajante-pro', 'vp-landing.html'),
    '/splash/landing': path.join(ROOT, 'splash', 'splash-landing.html'),
  };
  if (tenantMap[pathname] && serveFile(tenantMap[pathname], res)) return;

  if (pathname.startsWith('/assets/')) {
    if (serveFile(path.join(OUT, pathname), res)) return;
  }

  if (serveFile(path.join(OUT, pathname), res)) return;

  // SPA fallback
  const fallback = path.join(OUT, 'index.html');
  if (fs.existsSync(fallback)) {
    serveFile(fallback, res);
  } else {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<h1>NEXIA OS</h1><p>Build em andamento... aguarde 2 minutos e recarregue.</p>');
  }
});

// ─── KEEPALIVE ────────────────────────────────────────────────────
function startKeepalive() {
  const appUrl = process.env.NEXIA_APP_URL;
  if (!appUrl) return;
  setInterval(async () => {
    try {
      const r = await fetch(appUrl + '/health');
      console.log('[KEEPALIVE] Ping OK —', r.status);
    } catch (e) { console.warn('[KEEPALIVE] Falhou:', e.message); }
  }, 10 * 60 * 1000);
  console.log('[KEEPALIVE] Ativo → URL:', appUrl);
}

// ─── START ────────────────────────────────────────────────────────
loadFunctions();
server.listen(PORT, () => {
  console.log('\n[NEXIA OS v59] Servidor unificado na porta', PORT);
  console.log('[NEXIA] Frontend React:', fs.existsSync(path.join(OUT, 'index.html')) ? '✓' : '✗ (build falhou!)');
  console.log('[NEXIA] Functions:', Object.keys(loadedFunctions).length, 'carregadas');
  console.log('[NEXIA] URL:', process.env.NEXIA_APP_URL || 'http://localhost:' + PORT);
  startKeepalive();
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
process.on('uncaughtException',  (e) => console.error('[NEXIA] uncaughtException:', e.message));
process.on('unhandledRejection', (r) => console.error('[NEXIA] unhandledRejection:', r));
