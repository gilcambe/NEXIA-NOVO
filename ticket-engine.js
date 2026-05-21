
/**
 * NEXIA — Smart Retry Engine v1.0
 * Retentativas inteligentes para webhooks MercadoPago
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: [1000, 3000, 9000],  // exponencial
  retryOn: [408, 429, 500, 502, 503, 504]
};

async function withSmartRetry(fn, context = '') {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) console.log(`[NEXIA SmartRetry] ${context} succeeded on attempt ${attempt+1}`);
      return result;
    } catch (err) {
      lastErr = err;
      const status = err.status || err.statusCode || 500;
      const shouldRetry = RETRY_CONFIG.retryOn.includes(status) && attempt < RETRY_CONFIG.maxRetries;
      console.warn(`[NEXIA SmartRetry] ${context} attempt ${attempt+1} failed: ${err.message} (status=${status}, retry=${shouldRetry})`);
      if (!shouldRetry) break;
      await new Promise(r => setTimeout(r, RETRY_CONFIG.backoffMs[attempt] || 10000));
    }
  }
  throw lastErr;
}

// Registro de webhooks falhos para re-processamento
async function logFailedWebhook(db, payload, error) {
  try {
    await db.collection('webhook_failures').add({
      payload, error: error.message,
      retries: RETRY_CONFIG.maxRetries,
      ts: new Date().toISOString(),
      status: 'failed'
    });
  } catch(e) { console.error('[NEXIA] Failed to log webhook failure:', e.message); }
}

/**
 * NEXIA OS — MP WEBHOOK v6.0
 * Recebe notificações do MercadoPago, atualiza Firestore, dispara ticket/itinerário
 */
const fetch = require('node-fetch');

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let notification;
  try { notification = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'Bad JSON' }; }

  const { type, data } = notification;
  if (type !== 'payment' || !data?.id) return { statusCode: 200, body: 'ok' };

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) return { statusCode: 500, body: 'MP_ACCESS_TOKEN missing' };

  try {
    const mpRes  = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_TOKEN}` },
    });
    const payment = await mpRes.json();

    const status   = payment.status;
    const extRef   = payment.external_reference || '';
    const buyerEmail = payment.payer?.email || null;
    const buyerName  = `${payment.payer?.first_name || ''} ${payment.payer?.last_name || ''}`.trim() || buyerEmail?.split('@')[0] || '';
    const amount   = payment.transaction_amount || 0;

    if (!extRef) return { statusCode: 200, body: 'no ref' };

    const [tenantId, productId] = extRef.split('___');
    const { db, FieldValue } = getDB();
    const ts = FieldValue.serverTimestamp();

    const ordersRef = db.collection('tenants').doc(tenantId).collection('orders');
    const snap = await ordersRef.where('externalRef', '==', extRef).limit(1).get();

    const upd = { status, mpPaymentId: String(data.id), mpStatus: payment.status_detail, amount, buyerEmail, buyerName, updatedAt: ts };
    if (!snap.empty) await snap.docs[0].ref.update(upd);
    else             await ordersRef.add({ ...upd, externalRef: extRef, productId, createdAt: ts });

    if (status === 'approved') {
      // Update analytics
      try {
        const isCes  = tenantId.includes('CES');
        const isVP   = tenantId.includes('VP');
        await db.collection('tenants').doc(tenantId).collection('analytics').doc('overview').set({
          conversions: FieldValue.increment(1),
          revenue:     FieldValue.increment(amount),
          ...(isCes ? { tickets: FieldValue.increment(1) } : {}),
          ...(isVP  ? { trips:   FieldValue.increment(1) } : {}),
          updatedAt: ts,
        }, { merge: true });
      } catch (e) {}

      // Call ticket-engine
      if (buyerEmail) {
        const PRODUCT_NAMES = {
          'ces_essencial':'CES 2027 – Pacote Essencial','ces_premium':'CES 2027 – Pacote Premium','ces_ultra':'CES 2027 – Pacote Ultra',
          'vp_basico':'Viajante Pro – Pacote Básico','vp_premium':'Viajante Pro – Pacote Premium','vp_ultra':'Viajante Pro – Pacote Ultra',
        };
        await fetch('https://nexiaos.netlify.app/.netlify/functions/ticket-engine', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate', tenantId,
            eventId: tenantId.includes('CES') ? 'ces_2027' : 'vp_travel',
            orderId: String(data.id), buyerEmail, buyerName,
            packageName: PRODUCT_NAMES[productId] || payment.description || productId,
          }),
        }).catch(() => {});
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, status }) };
  } catch (err) {
    console.error('[mp-webhook]', err);
    return { statusCode: 500, body: err.message };
  }
};
