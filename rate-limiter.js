/**
 * NEXIA OS — CREATE-COMPANY FUNCTION v6.0
 * Cria tenant completo: Firestore + Firebase Auth + e-mail boas-vindas
 */
const fetch = require('node-fetch');

function getFirebase() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getFirestore, FieldValue }     = require('firebase-admin/firestore');
  const { getAuth }                      = require('firebase-admin/auth');
  if (!getApps().length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
    if (sa) initializeApp({ credential: cert(sa) });
    else    initializeApp({ projectId: 'nexia-c8710' });
  }
  return { db: getFirestore(), auth: getAuth(), FieldValue };
}

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,32);
}

const DEFAULT_MODULES = {
  events:  ['eventos','ticketing','notifications','payments','analytics'],
  tourism: ['turismo','itinerary','notifications','payments','analytics'],
  auctions:['leiloes','payments','notifications','analytics'],
  saas:    ['crm-core','analytics','notifications','payments'],
  default: ['notifications','payments','analytics'],
};

exports.handler = async (event) => {
  const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  const { companyName, adminEmail, adminName = '', vertical = 'default', primaryColor = '#0057FF', plan = 'trial' } = body;
  if (!companyName || !adminEmail) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'companyName e adminEmail são obrigatórios' }) };

  const tenantId   = slugify(companyName) + '_' + Date.now().toString(36);
  const tempPass   = Math.random().toString(36).slice(2,10).toUpperCase() + '!9';

  try {
    const { db, auth, FieldValue } = getFirebase();
    const ts = FieldValue.serverTimestamp();

    let uid;
    try {
      uid = (await auth.createUser({ email: adminEmail, password: tempPass, displayName: adminName || companyName })).uid;
    } catch (e) {
      if (e.code === 'auth/email-already-exists') uid = (await auth.getUserByEmail(adminEmail)).uid;
      else throw e;
    }

    await db.collection('users').doc(uid).set({ uid, email: adminEmail, name: adminName || companyName, role: 'CLIENT_ADMIN', tenantId, status: 'active', createdAt: ts }, { merge: true });

    const tRef = db.collection('tenants').doc(tenantId);
    await tRef.set({ id: tenantId, name: companyName, vertical, plan, status: 'trial', adminEmail, adminUid: uid, mrr: 0, createdAt: ts, updatedAt: ts });
    await tRef.collection('config').doc('theme').set({ primaryColor, secondaryColor: '#F8FAFC', fontFamily: 'Sora', buttonRadius: '8px', logoUrl: '', updatedAt: ts });
    await tRef.collection('config').doc('brand').set({ brandName: companyName, tagline: '', color: primaryColor, tenantId, updatedAt: ts });
    await tRef.collection('analytics').doc('overview').set({ visitors: 0, conversions: 0, revenue: 0, tickets: 0, trips: 0, updatedAt: ts });
    await tRef.collection('pages').doc('landing').set({ title: companyName, published: false, layout: [{ type: 'hero', data: { headline: `Bem-vindo à ${companyName}`, subheadline: 'Edite esta página no Page Builder', cta: 'Começar', ctaUrl: '#' } }], updatedAt: ts });

    const mods = DEFAULT_MODULES[vertical] || DEFAULT_MODULES.default;
    const batch = db.batch();
    mods.forEach(m => batch.set(tRef.collection('modules').doc(m), { id: m, status: 'active', activatedAt: ts, activatedBy: uid }));
    await batch.commit();

    // Welcome email via SendGrid
    const SG = process.env.SENDGRID_API_KEY;
    if (SG) {
      const html = `<div style="font-family:Sora,sans-serif;max-width:520px;margin:0 auto"><div style="background:#07090E;padding:28px;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:#00E5FF;margin:0;font-size:22px">NEXIA OS</h1></div><div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #E2E8F0"><p>Olá <strong>${adminName||companyName}</strong>!</p><p>Sua empresa <strong>${companyName}</strong> foi criada.</p><div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:5px 0;font-size:13px"><strong>E-mail:</strong> ${adminEmail}</p><p style="margin:5px 0;font-size:13px"><strong>Senha temporária:</strong> <code style="color:#1D4ED8">${tempPass}</code></p><p style="margin:5px 0;font-size:13px"><strong>Tenant ID:</strong> <code style="color:#15803D">${tenantId}</code></p></div><p style="font-size:13px;color:#64748B">Acesse: <a href="https://nexiaos.netlify.app/login.html">nexiaos.netlify.app/login.html</a></p></div></div>`;
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SG}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalizations: [{ to: [{ email: adminEmail, name: adminName||companyName }] }], from: { email: 'noreply@nexiaos.app', name: 'NEXIA OS' }, subject: `✅ ${companyName} criada no NEXIA OS`, content: [{ type: 'text/html', value: html }] }),
      }).catch(() => {});
    }

    return { statusCode: 201, headers: CORS, body: JSON.stringify({ success: true, tenantId, uid, companyName, plan, modules: mods }) };
  } catch (err) {
    console.error('[create-company]', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
