/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA OS — CHECKOUT FUNCTION v6.0
 * MP key lida de process.env.MP_ACCESS_TOKEN (NUNCA hardcoded)
 * Suporta: módulos NEXIA, pacotes CES, pacotes VP, leilões Bezsan
 * ═══════════════════════════════════════════════════════════════════
 */

const fetch = require('node-fetch');

/* ── Catálogo de produtos (preços em BRL float) ──────────────────── */
const PRODUCTS = {
  // CES
  'ces_essencial': { name: 'CES 2027 – Pacote Essencial',  price: 18900, tenant: 'CES_2027_BR',    cat: 'ticket'  },
  'ces_premium':   { name: 'CES 2027 – Pacote Premium',    price: 28900, tenant: 'CES_2027_BR',    cat: 'ticket'  },
  'ces_ultra':     { name: 'CES 2027 – Pacote Ultra',      price: 49900, tenant: 'CES_2027_BR',    cat: 'ticket'  },
  // Viajante Pro
  'vp_basico':     { name: 'Viajante Pro – Pacote Básico',  price:  8900, tenant: 'VP_AGENCIA_01', cat: 'travel'  },
  'vp_premium':    { name: 'Viajante Pro – Pacote Premium', price: 15900, tenant: 'VP_AGENCIA_01', cat: 'travel'  },
  'vp_ultra':      { name: 'Viajante Pro – Pacote Ultra',   price: 28000, tenant: 'VP_AGENCIA_01', cat: 'travel'  },
  // Bezsan leilões
  'bezsan_lance':  { name: 'Bezsan – Ativação de Lance',    price:    99, tenant: 'BEZSAN_01',      cat: 'auction' },
  'bezsan_vip':    { name: 'Bezsan – Acesso VIP Investor',  price:  2900, tenant: 'BEZSAN_01',      cat: 'auction' },
};

const BACK_URLS = {
  'CES_2027_BR':   { success: 'https://nexiaos.netlify.app/ces/ces-landing.html?payment=success',        failure: 'https://nexiaos.netlify.app/ces/ces-landing.html?payment=failure',        pending: 'https://nexiaos.netlify.app/ces/ces-landing.html?payment=pending' },
  'VP_AGENCIA_01': { success: 'https://nexiaos.netlify.app/viajante-pro/vp-landing.html?payment=success', failure: 'https://nexiaos.netlify.app/viajante-pro/vp-landing.html?payment=failure', pending: 'https://nexiaos.netlify.app/viajante-pro/vp-landing.html?payment=pending' },
  'BEZSAN_01':     { success: 'https://nexiaos.netlify.app/bezsan/bezsan-app.html?payment=success',       failure: 'https://nexiaos.netlify.app/bezsan/bezsan-app.html?payment=failure',       pending: 'https://nexiaos.netlify.app/bezsan/bezsan-app.html?payment=pending' },
  default:         { success: 'https://nexiaos.netlify.app/nexia/nexia-master.html?payment=success',      failure: 'https://nexiaos.netlify.app/nexia/nexia-master.html?payment=failure',      pending: 'https://nexiaos.netlify.app/nexia/nexia-master.html?payment=pending' },
};

/* ── Firebase Admin ──────────────────────────────────────────────── */
function getDB() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getFirestore, FieldValue }     = require('firebase-admin/firestore');
  if (!getApps().length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
    if (sa) initializeApp({ credential: cert(sa) });
    else    initializeApp({ projectId: 'nexia-c8710' });
  }
  return { db: getFirestore(), FieldValue };
}

/* ── HANDLER ─────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, body: 'Method Not Allowed' };

  /* ── Chave do MP via env (NUNCA no código) ────────────────────── */
  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado nas variáveis de ambiente do Netlify.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  const { productId, moduleName, price: rawPrice, tenantId, moduleId, buyerEmail, buyerName, categoryOverride } = body;

  /* ── Resolve produto ─────────────────────────────────────────── */
  let name, price, tenant, category;

  if (productId && PRODUCTS[productId]) {
    const p = PRODUCTS[productId];
    name     = p.name;
    price    = p.price;
    tenant   = tenantId || p.tenant;
    category = p.cat;
  } else {
    // Caminho legado: módulos NEXIA
    name     = moduleName || 'Módulo NEXIA OS';
    category = categoryOverride || 'module';
    tenant   = tenantId  || 'NEXIA_MASTER';
    price    = typeof rawPrice === 'number' ? rawPrice
             : typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9,]/g, '').replace(',', '.'))
             : null;
    if (!price || isNaN(price) || price <= 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Preço inválido' }) };
    }
  }

  const extRef    = `${tenant}___${productId || moduleId || 'mod'}___${Date.now()}`;
  const backUrls  = BACK_URLS[tenant] || BACK_URLS.default;

  const mpData = {
    items: [{ title: name, quantity: 1, currency_id: 'BRL', unit_price: price }],
    payer: buyerEmail ? { email: buyerEmail, name: buyerName || '' } : undefined,
    external_reference: extRef,
    back_urls: backUrls,
    auto_return: 'approved',
    statement_descriptor: 'NEXIA OS',
    metadata: { tenant_id: tenant, product_id: productId || moduleId || '', category, buyer_email: buyerEmail || '' },
  };

  try {
    const mpRes  = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(mpData),
    });
    const mpJson = await mpRes.json();

    if (!mpRes.ok || !mpJson.init_point) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'MercadoPago error', detail: mpJson }) };
    }

    /* ── Registra pedido pendente no Firestore ────────────────── */
    try {
      const { db, FieldValue } = getDB();
      await db.collection('tenants').doc(tenant).collection('orders').add({
        productId:    productId || moduleId || null,
        productName:  name, price, category,
        status:       'pending',
        mpPreferenceId: mpJson.id,
        externalRef:  extRef,
        buyerEmail:   buyerEmail || null,
        buyerName:    buyerName  || null,
        createdAt:    FieldValue.serverTimestamp(),
      });
    } catch (dbErr) { console.warn('[checkout] Firestore:', dbErr.message); }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ init_point: mpJson.init_point, sandbox_init_point: mpJson.sandbox_init_point, preference_id: mpJson.id, external_ref: extRef }),
    };

  } catch (err) {
    console.error('[checkout]', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
