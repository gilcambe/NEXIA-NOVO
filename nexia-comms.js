/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA OS — BRIDGE v5.1  (Firebase Real)
 * Motor de Sincronização em Tempo Real
 * Firestore onSnapshot · White-Label · Audit · Pub/Sub
 * ═══════════════════════════════════════════════════════════════════
 */

// ── PUB/SUB & LISTENER REGISTRY ────────────────────────────────────
const NexiaBridge = (() => {
    const _listeners   = {};   // { key: unsubscribeFn }
    const _cache       = {};   // último dado por evento
    const _subscribers = {};   // { event: [callbacks] }

    function on(event, cb) {
        if (!_subscribers[event]) _subscribers[event] = [];
        _subscribers[event].push(cb);
        if (_cache[event] !== undefined) {
            try { cb(_cache[event]); } catch(e) { _log(`on() cache error [${event}]`, 'warn'); }
        }
    }
    function off(event, cb) {
        if (!_subscribers[event]) return;
        _subscribers[event] = _subscribers[event].filter(f => f !== cb);
    }
    function _emit(event, data) {
        _cache[event] = data;
        (_subscribers[event] || []).forEach(cb => { try { cb(data); } catch(e) {} });
    }

    // ── GENERIC REALTIME SYNC ──────────────────────────────────────
    /**
     * syncRealtime(path, callback)
     * Escuta qualquer documento do Firestore em tempo real.
     * path: 'tenants/VP_AGENCIA_01/config/brand'
     * callback: (data) => void
     */
    function syncRealtime(path, callback) {
        if (!_isReady()) { setTimeout(() => syncRealtime(path, callback), 400); return; }
        const key = 'sync:' + path;
        if (_listeners[key]) return; // já ativo

        const parts = path.split('/');
        let ref = firebase.firestore();
        // Monta referência: collection/doc/collection/doc...
        parts.forEach((seg, i) => {
            if (i % 2 === 0) ref = ref.collection(seg);
            else             ref = ref.doc(seg);
        });

        _listeners[key] = ref.onSnapshot(snap => {
            const data = snap.data ? snap.data() : null;
            _log(`syncRealtime update: ${path}`, 'ok');
            callback(data);
            _emit(key, data);
        }, err => {
            _log(`syncRealtime error [${path}]: ${err.message}`, 'err');
        });
        _log(`syncRealtime ativo: ${path}`, 'info');
    }

    // ── FIRESTORE COLLECTION LISTENERS ────────────────────────────
    function watchPassengers(tenantId) {
        const key = `passengers:${tenantId}`;
        if (_listeners[key] || !_isReady()) { if (!_isReady()) setTimeout(() => watchPassengers(tenantId), 400); return; }
        const ref = firebase.firestore().collection('tenants').doc(tenantId)
            .collection('passengers').orderBy('createdAt', 'desc');
        _listeners[key] = ref.onSnapshot(snap => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            _emit('passengers:update', list);
        }, err => _emit('passengers:error', err));
        _log(`Listener ativo: passengers/${tenantId}`, 'ok');
    }

    function watchExpenses(tenantId, filters = {}) {
        const key = `expenses:${tenantId}`;
        if (_listeners[key] || !_isReady()) { if (!_isReady()) setTimeout(() => watchExpenses(tenantId, filters), 400); return; }
        let ref = firebase.firestore().collection('tenants').doc(tenantId)
            .collection('expenses').orderBy('date', 'desc');
        if (filters.status) ref = ref.where('status', '==', filters.status);
        _listeners[key] = ref.onSnapshot(snap => {
            const items = []; let totalUSD = 0;
            snap.forEach(d => { const x = { id: d.id, ...d.data() }; items.push(x); totalUSD += parseFloat(x.valueUSD || 0); });
            _emit('expenses:update', { items, totalUSD });
        }, err => _emit('expenses:error', err));
        _log(`Listener ativo: expenses/${tenantId}`, 'ok');
    }

    function watchMeetings(tenantId) {
        const key = `meetings:${tenantId}`;
        if (_listeners[key] || !_isReady()) { if (!_isReady()) setTimeout(() => watchMeetings(tenantId), 400); return; }
        const ref = firebase.firestore().collection('tenants').doc(tenantId)
            .collection('meetings').orderBy('date', 'asc');
        _listeners[key] = ref.onSnapshot(snap => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            _emit('meetings:update', list);
        }, err => _log(`meetings error: ${err.message}`, 'err'));
        _log(`Listener ativo: meetings/${tenantId}`, 'ok');
    }

    function watchItinerary(tenantId, tripId) {
        const key = `itinerary:${tenantId}:${tripId}`;
        if (_listeners[key] || !_isReady()) { if (!_isReady()) setTimeout(() => watchItinerary(tenantId, tripId), 400); return; }
        const ref = firebase.firestore().collection('tenants').doc(tenantId)
            .collection('trips').doc(tripId).collection('itinerary').orderBy('time', 'asc');
        _listeners[key] = ref.onSnapshot(snap => {
            const items = [];
            snap.forEach(d => items.push({ id: d.id, ...d.data() }));
            _emit(`itinerary:update:${tripId}`, items);
        }, err => _log(`itinerary error: ${err.message}`, 'err'));
    }

    // ── WRITE OPERATIONS ───────────────────────────────────────────
    async function updateExpenseStatus(tenantId, expenseId, status, approvedBy) {
        if (!_isReady()) return false;
        try {
            await firebase.firestore().collection('tenants').doc(tenantId)
                .collection('expenses').doc(expenseId)
                .update({ status, approvedBy: approvedBy || 'admin', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            _log(`Expense ${expenseId} → ${status}`, 'ok');
            return true;
        } catch(e) { _log(`updateExpenseStatus: ${e.message}`, 'err'); return false; }
    }

    async function updatePassengerStatus(tenantId, passengerId, data) {
        if (!_isReady()) return false;
        try {
            await firebase.firestore().collection('tenants').doc(tenantId)
                .collection('passengers').doc(passengerId)
                .update({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            return true;
        } catch(e) { _log(`updatePassengerStatus: ${e.message}`, 'err'); return false; }
    }

    // ── LIFECYCLE ──────────────────────────────────────────────────
    function detach(key) {
        if (_listeners[key]) { _listeners[key](); delete _listeners[key]; }
    }
    function detachAll() {
        Object.keys(_listeners).forEach(k => { _listeners[k](); delete _listeners[k]; });
        _log('Todos os listeners removidos', 'warn');
    }

    // ── HELPERS ────────────────────────────────────────────────────
    // ── GENERIC WRITE & LISTEN ─────────────────────────────────────
    /**
     * saveData(collectionPath, data)
     * Grava um novo documento numa coleção Firestore.
     * collectionPath: 'tenants/VP_AGENCIA_01/alerts'
     * Returns: Promise<docRef>
     */
    async function saveData(collectionPath, data) {
        if (!_isReady()) return Promise.reject(new Error('Firebase não pronto'));
        const parts = collectionPath.split('/');
        let ref = firebase.firestore();
        parts.forEach((seg, i) => {
            if (i % 2 === 0) ref = ref.collection(seg);
            else             ref = ref.doc(seg);
        });
        const ts = firebase.firestore.FieldValue.serverTimestamp();
        return ref.add({ ...data, createdAt: ts });
    }

    /**
     * listenData(docPath, callback)
     * Escuta um documento Firestore em tempo real.
     * docPath: 'tenants/VP_AGENCIA_01/config/brand_passenger'
     */
    function listenData(docPath, callback) {
        syncRealtime(docPath, callback);
    }

    function _isReady() {
        return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
    }
    function _log(msg, type = 'info') {
        if (typeof NEXIA !== 'undefined' && NEXIA.log) NEXIA.log(`[Bridge] ${msg}`, type);
        else { const c={info:'#00e5ff',ok:'#00d68f',warn:'#ffaa00',err:'#ff3d71'}; console.log(`%c[Bridge] ${msg}`,`color:${c[type]||c.info};font-weight:bold`); }
    }

    // Auto-init após Core estar pronto
    function _autoInit() {
        if (typeof NEXIA === 'undefined' || !NEXIA._ready) { setTimeout(_autoInit, 300); return; }
        const t = NEXIA.currentTenant;
        if (!t || t.id === 'GUEST') return;
        _log(`Auto-init tenant: ${t.name}`, 'ok');
        if (t.id === 'VP_AGENCIA_01') { watchPassengers(t.id); watchExpenses(t.id); }
        if (t.id === 'CES_2027_BR')   { watchExpenses(t.id); watchMeetings(t.id); watchPassengers(t.id); }
    }
    _autoInit();

    // init() é um no-op seguro para compatibilidade com páginas que o chamam
    function init(cfg) { _log('Bridge init called (no-op)', 'ok'); }
    return { on, off, detach, detachAll, syncRealtime, listenData, saveData, watchPassengers, watchExpenses, watchMeetings, watchItinerary, updateExpenseStatus, updatePassengerStatus, getCache: e => _cache[e] || null, init, watchPresence: (tid) => _log('watchPresence: ' + tid) };
})();

// ═══════════════════════════════════════════════════════════════════
// NEXIA THEME — White-Label Persistence Engine (Firestore + localStorage)
// ═══════════════════════════════════════════════════════════════════
const NexiaTheme = (() => {
    const LS_PREFIX = 'nexia_theme_';

    /**
     * save(tenantKey, appTarget, config)
     * Grava config no Firestore E no localStorage (fallback offline).
     */
    async function save(tenantKey, appTarget, config) {
        const payload = { ...config, savedAt: Date.now() };

        // 1. localStorage imediato (UX instantânea)
        try { localStorage.setItem(LS_PREFIX + tenantKey + '_' + appTarget, JSON.stringify(payload)); } catch(e) {}

        // 2. Firestore para sincronização real entre dispositivos
        if (typeof NEXIA !== 'undefined' && NEXIA.db) {
            // Mapeia tenantKey → Firestore tenant ID
            const tidMap = { vp: 'VP_AGENCIA_01', ces: 'CES_2027_BR', nexia: 'NEXIA_MASTER' };
            const tid = tidMap[tenantKey] || tenantKey;
            try {
                await NEXIA.db.collection('tenants').doc(tid)
                    .collection('config').doc('brand_' + appTarget)
                    .set({ ...payload, tenantKey, appTarget, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
                _log(`Theme saved → Firestore: ${tid}/config/brand_${appTarget}`, 'ok');
            } catch(e) {
                _log(`Firestore write failed (using localStorage): ${e.message}`, 'warn');
            }
        }
        return true;
    }

    /**
     * load(tenantKey, appTarget) — lê localStorage (sync, instantâneo)
     */
    function load(tenantKey, appTarget) {
        try {
            const raw = localStorage.getItem(LS_PREFIX + tenantKey + '_' + appTarget);
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    }

    /**
     * watchBrand(tenantKey, appTarget, callback)
     * Escuta o Firestore em tempo real. Quando o Admin salva, o App do
     * Passageiro recebe automaticamente — SEM refresh.
     */
    function watchBrand(tenantKey, appTarget, callback) {
        const tidMap = { vp: 'VP_AGENCIA_01', ces: 'CES_2027_BR', nexia: 'NEXIA_MASTER' };
        const tid = tidMap[tenantKey] || tenantKey;
        const path = `tenants/${tid}/config/brand_${appTarget}`;

        // Aplica o que tiver no localStorage imediatamente (sem esperar Firebase)
        const cached = load(tenantKey, appTarget);
        if (cached) { try { callback(cached); } catch(e) {} }

        // Depois ativa o listener Firestore para atualizações em tempo real
        NexiaBridge.syncRealtime(path, (data) => {
            if (!data) return;
            // Atualiza localStorage com dados do servidor
            try { localStorage.setItem(LS_PREFIX + tenantKey + '_' + appTarget, JSON.stringify(data)); } catch(e) {}
            callback(data);
        });
    }

    /**
     * apply(tenantKey, appTarget)
     * Aplica CSS vars do localStorage no documento atual.
     * Chamado no <head> para zero FOUC.
     */
    function apply(tenantKey, appTarget) {
        const cfg = load(tenantKey, appTarget);
        if (!cfg) return false;
        _applyCSS(cfg);
        _applyText(cfg);
        return true;
    }

    /**
     * applyConfig(cfg) — aplica um objeto config diretamente
     */
    function applyConfig(cfg) {
        if (!cfg) return;
        _applyCSS(cfg);
        _applyText(cfg);
    }

    function _applyCSS(cfg) {
        if (!cfg.color) return;
        const root = document.documentElement;
        const hex  = cfg.color.replace('#', '');
        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,6),16);
        const rgb = `${r},${g},${b}`;
        root.style.setProperty('--brand',  cfg.color);
        root.style.setProperty('--gold',   cfg.color);
        root.style.setProperty('--gold2',  `rgba(${rgb},0.12)`);
        root.style.setProperty('--blu',    cfg.color);
        root.style.setProperty('--blu2',   `rgba(${rgb},0.08)`);
        root.style.setProperty('--blue',   cfg.color);
        root.style.setProperty('--blue2',  cfg.color);
        root.style.setProperty('--blue-dim',`rgba(${rgb},0.12)`);
    }

    function _applyText(cfg) {
        if (cfg.brandName)  document.querySelectorAll('[data-brand-name]').forEach(el    => { el.textContent = cfg.brandName; });
        if (cfg.tagline)    document.querySelectorAll('[data-brand-tagline]').forEach(el => { el.textContent = cfg.tagline; });
    }

    function reset(tenantKey, appTarget) {
        try { localStorage.removeItem(LS_PREFIX + tenantKey + '_' + appTarget); return true; }
        catch(e) { return false; }
    }

    function _log(msg, type = 'info') {
        if (typeof NEXIA !== 'undefined' && NEXIA.log) NEXIA.log(`[Theme] ${msg}`, type);
    }

    return { save, load, apply, applyConfig, watchBrand, reset };
})();

// ═══════════════════════════════════════════════════════════════════
// NEXIA AUDIT — Capture de Auditoria para Firestore
// ═══════════════════════════════════════════════════════════════════
const NexiaAudit = {
    async log(tenantId, action, data = {}) {
        if (typeof NEXIA === 'undefined' || !NEXIA.db) return;
        try {
            await NEXIA.db.collection('tenants').doc(tenantId)
                .collection('audit_log')
                .add({ action, data, ts: firebase.firestore.FieldValue.serverTimestamp(), uid: firebase.auth().currentUser?.uid || 'anon' });
        } catch(e) {}
    },
    async saveCMSConfig(tenantId, appTarget, config) {
        if (typeof NEXIA === 'undefined' || !NEXIA.db) return;
        try {
            await NEXIA.db.collection('tenants').doc(tenantId)
                .collection('config').doc('brand_' + appTarget)
                .set({ ...config, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            this.log(tenantId, 'cms_config_saved', { appTarget, color: config.color });
        } catch(e) {
            if (typeof NEXIA !== 'undefined') NEXIA.log(`saveCMSConfig error: ${e.message}`, 'err');
        }
    }
};

console.log('%c NexiaBridge + NexiaTheme + NexiaAudit v5.1 ATIVO ', 'background:#00e5ff;color:#000;font-weight:bold');

/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA TRAFFIC ENGINE — Módulo de Tráfego Omnichannel v1.0
 * Adicione este bloco no FINAL do arquivo bridge.js
 * ═══════════════════════════════════════════════════════════════════
 *
 * USO:
 *   NexiaTraffic.createCampaign({ platform, budget, objective, tenantId })
 *   NexiaTraffic.getDashboard(tenantId)    → relatório de campanhas
 *   NexiaTraffic.renderWidget(selector)    → injeta painel de tráfego
 *
 * REGRA SOBERANA:
 *   God Mode (admin@nexia.com / clearance 100) → Taxa R$ 0,00
 *   Tenants → exige saldo na carteira NEXIA Pay
 * ═══════════════════════════════════════════════════════════════════
 */

const NexiaTraffic = (() => {

    // ── PLATAFORMAS SUPORTADAS ────────────────────────────────────────
    const PLATFORMS = {
        google: {
            name: 'Google Ads',
            icon: '🔍',
            color: '#4285F4',
            formats: ['Search', 'Display', 'Shopping', 'YouTube'],
            cpcBase: 1.80,   // CPM/CPC base em R$
            reach: 'Bilhões de buscas/dia',
            category: 'search'
        },
        youtube: {
            name: 'YouTube Ads',
            icon: '▶',
            color: '#FF0000',
            formats: ['TrueView In-Stream', 'Bumper 6s', 'Discovery'],
            cpcBase: 0.60,
            reach: '2.7bi usuários/mês',
            category: 'video'
        },
        linkedin: {
            name: 'LinkedIn Ads',
            icon: 'in',
            color: '#0A66C2',
            formats: ['Sponsored Content', 'Message Ads', 'Lead Gen'],
            cpcBase: 8.50,
            reach: '930mi profissionais',
            category: 'b2b'
        },
        tiktok: {
            name: 'TikTok Ads',
            icon: '♪',
            color: '#010101',
            formats: ['TopView', 'In-Feed', 'Branded Hashtag'],
            cpcBase: 0.40,
            reach: '1bi usuários/mês',
            category: 'social'
        },
        meta: {
            name: 'Meta Ads',
            icon: '📘',
            color: '#0866FF',
            formats: ['Feed', 'Stories', 'Reels', 'Messenger'],
            cpcBase: 1.20,
            reach: '3.2bi usuários/mês',
            category: 'social'
        }
    };

    // ── OBJETIVOS DE CAMPANHA ────────────────────────────────────────
    const OBJECTIVES = {
        awareness:   { name: 'Reconhecimento de Marca', multiplier: 0.85, kpi: 'Impressões' },
        leads:       { name: 'Geração de Leads',        multiplier: 1.20, kpi: 'CPL' },
        traffic:     { name: 'Tráfego para o Site',     multiplier: 1.00, kpi: 'CPC' },
        conversions: { name: 'Conversões / Vendas',     multiplier: 1.40, kpi: 'ROAS' },
        app:         { name: 'Instalações de App',      multiplier: 1.10, kpi: 'CPI' },
        video:       { name: 'Visualizações de Vídeo',  multiplier: 0.70, kpi: 'CPV' },
    };

    // ── WALLETS SIMULADAS (substituir por Firestore em produção) ─────
    let _wallets = {
        'VP_AGENCIA_01': { balance: 5000.00, currency: 'BRL', locked: false },
        'CES_2027_BR':   { balance: 12000.00, currency: 'BRL', locked: false },
    };

    // ── CAMPANHAS ATIVAS ─────────────────────────────────────────────
    let _campaigns = [];

    // ── UTILITÁRIOS ─────────────────────────────────────────────────
    function _getCurrentUser() {
        // Tenta pegar do NEXIA Auth ou de sessão local
        if (typeof NEXIA !== 'undefined' && NEXIA.auth?.currentUser) {
            return NEXIA.auth.currentUser;
        }
        // Fallback: sessão em memória
        return window.__nexiaSession || null;
    }

    function _isGodMode() {
        const user = _getCurrentUser();
        if (!user) return false;
        const email = user.email || user.uid || '';
        // Verifica email soberano ou clearance 100
        if (email === 'admin@nexia.com' || email === 'henrique@nexia.com') return true;
        if (typeof NexiaGovernance !== 'undefined') {
            const profile = NexiaGovernance.profiles[email];
            if (profile && profile.clearance >= 100) return true;
        }
        // Verifica claim de clearance no token
        return user.clearance >= 100;
    }

    function _getWallet(tenantId) {
        // Em produção: buscar do Firestore via NEXIA.getCollection('wallet')
        return _wallets[tenantId] || { balance: 0, currency: 'BRL', locked: false };
    }

    function _deductWallet(tenantId, amount) {
        if (_wallets[tenantId]) {
            _wallets[tenantId].balance = Math.max(0, _wallets[tenantId].balance - amount);
        }
    }

    function _formatBRL(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function _simulateMetrics(platform, budget, objective) {
        const pf = PLATFORMS[platform];
        const obj = OBJECTIVES[objective] || OBJECTIVES.traffic;
        const impressions = Math.round((budget / pf.cpcBase) * 1000 * (0.8 + Math.random() * 0.4));
        const clicks      = Math.round(impressions * (0.01 + Math.random() * 0.03));
        const conversions = Math.round(clicks * (0.02 + Math.random() * 0.05));
        const cpc         = budget / Math.max(clicks, 1);
        const cpl         = budget / Math.max(conversions, 1);
        return { impressions, clicks, conversions, cpc, cpl, reach: pf.reach };
    }

    // ── CRIAR CAMPANHA ───────────────────────────────────────────────
    /**
     * createCampaign({ platform, budget, objective, tenantId, name, audience })
     * Retorna: Promise<{ success, campaign?, error? }>
     */
    function createCampaign({ platform, budget, objective, tenantId, name, audience }) {
        return new Promise((resolve) => {
            // Validações
            if (!PLATFORMS[platform]) {
                return resolve({ success: false, error: `Plataforma "${platform}" não suportada. Use: ${Object.keys(PLATFORMS).join(', ')}` });
            }
            if (!budget || budget < 50) {
                return resolve({ success: false, error: 'Orçamento mínimo: R$ 50,00' });
            }

            // ── REGRA SOBERANA ──────────────────────────────────────
            const godMode = _isGodMode();
            const platformFee = godMode ? 0 : budget * 0.15; // 15% de taxa de gestão para tenants
            const totalCost   = godMode ? 0 : budget + platformFee;

            if (!godMode) {
                // Verifica saldo do tenant
                const wallet = _getWallet(tenantId);

                if (wallet.locked) {
                    return resolve({
                        success: false,
                        error: 'CARTEIRA BLOQUEADA — Entre em contato com o suporte NEXIA.',
                        code: 'WALLET_LOCKED'
                    });
                }

                if (wallet.balance < totalCost) {
                    return resolve({
                        success: false,
                        error: `SALDO INSUFICIENTE — Recarregue sua Carteira NEXIA.\n\nSaldo atual: ${_formatBRL(wallet.balance)}\nNecessário:  ${_formatBRL(totalCost)}\n\nRecargue em: Configurações → Carteira NEXIA Pay`,
                        code: 'INSUFFICIENT_FUNDS',
                        wallet: { current: wallet.balance, required: totalCost }
                    });
                }

                // Debita carteira
                _deductWallet(tenantId, totalCost);
            }

            // ── CRIA CAMPANHA ─────────────────────────────────────────
            const metrics = _simulateMetrics(platform, budget, objective);
            const campaign = {
                id:         `camp_${Date.now()}`,
                name:       name || `Campanha ${PLATFORMS[platform].name} — ${new Date().toLocaleDateString('pt-BR')}`,
                platform,
                objective:  objective || 'traffic',
                budget,
                platformFee,
                totalCost,
                tenantId,
                audience:   audience || 'Público amplo',
                status:     'active',
                godMode,
                createdAt:  new Date().toISOString(),
                metrics,
                pacing:     { spent: 0, remaining: budget, dailyBudget: budget / 30 }
            };

            _campaigns.push(campaign);

            // Persiste no Firestore se disponível
            if (typeof NEXIA !== 'undefined' && NEXIA.db && tenantId) {
                NEXIA.getCollection('campaigns').add(campaign).catch(e => {
                    console.warn('[NexiaTraffic] Firestore write error:', e);
                });
            }

            resolve({ success: true, campaign });
        });
    }

    // ── DASHBOARD DE CAMPANHAS ────────────────────────────────────────
    function getDashboard(tenantId) {
        const godMode = _isGodMode();
        const filtered = godMode
            ? _campaigns
            : _campaigns.filter(c => c.tenantId === tenantId);

        const totalSpend    = filtered.reduce((s, c) => s + c.totalCost, 0);
        const totalImpress  = filtered.reduce((s, c) => s + (c.metrics?.impressions || 0), 0);
        const totalClicks   = filtered.reduce((s, c) => s + (c.metrics?.clicks || 0), 0);
        const totalConv     = filtered.reduce((s, c) => s + (c.metrics?.conversions || 0), 0);
        const wallet        = godMode ? { balance: Infinity, currency: 'BRL' } : _getWallet(tenantId);

        return {
            campaigns: filtered,
            summary: {
                totalCampaigns: filtered.length,
                totalSpend,
                totalImpressions: totalImpress,
                totalClicks,
                totalConversions: totalConv,
                avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
                avgCPL: totalConv  > 0 ? totalSpend / totalConv  : 0,
            },
            wallet: godMode ? { balance: '∞', currency: 'BRL', godMode: true } : wallet,
            godMode
        };
    }

    // ── WIDGET UI ────────────────────────────────────────────────────
    const WIDGET_CSS = `
        .nexia-traffic-widget {
            font-family: 'Sora', 'Segoe UI', sans-serif;
            background: #0C1018;
            border: 1px solid #1C2840;
            border-radius: 16px;
            padding: 20px;
            max-width: 640px;
            width: 100%;
            color: #C4D4EE;
            box-shadow: 0 8px 40px rgba(0,0,0,0.5);
        }
        .nt-header {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 1px solid #1C2840;
        }
        .nt-title { font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #00E5FF; }
        .nt-subtitle { font-size: 10px; color: #3F5070; }
        .nt-badge-god {
            margin-left: auto;
            background: rgba(0,232,122,0.1);
            border: 1px solid rgba(0,232,122,0.3);
            color: #00E87A;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
        }
        .nt-badge-tenant {
            margin-left: auto;
            background: rgba(196,149,90,0.1);
            border: 1px solid rgba(196,149,90,0.3);
            color: #C4955A;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
        }
        .nt-platforms {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 18px;
        }
        .nt-platform-btn {
            background: #111520;
            border: 1px solid #1C2840;
            border-radius: 8px;
            padding: 10px 6px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #7A90B8;
            font-size: 10px;
            font-weight: 600;
        }
        .nt-platform-btn .icon { font-size: 18px; display: block; margin-bottom: 4px; }
        .nt-platform-btn:hover { border-color: #253555; color: #C4D4EE; transform: translateY(-1px); }
        .nt-platform-btn.selected {
            border-color: rgba(0,229,255,0.4);
            background: rgba(0,229,255,0.07);
            color: #00E5FF;
            box-shadow: 0 0 12px rgba(0,229,255,0.1);
        }
        .nt-row { display: flex; gap: 12px; margin-bottom: 12px; }
        .nt-field { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .nt-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #3F5070; font-weight: 600; }
        .nt-input, .nt-select {
            background: #07090D;
            border: 1px solid #1C2840;
            color: #C4D4EE;
            border-radius: 8px;
            padding: 9px 12px;
            font-size: 13px;
            font-family: 'Sora', sans-serif;
            transition: border-color 0.2s ease;
        }
        .nt-input:focus, .nt-select:focus { border-color: rgba(0,229,255,0.4); outline: none; }
        .nt-select option { background: #0C1018; }
        .nt-wallet-bar {
            background: #07090D;
            border: 1px solid #1C2840;
            border-radius: 8px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            font-size: 12px;
        }
        .nt-wallet-label { color: #3F5070; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px; }
        .nt-wallet-balance { color: #C4955A; font-weight: 700; font-size: 15px; }
        .nt-wallet-god { color: #00E87A; font-weight: 700; font-size: 15px; }
        .nt-cost-preview {
            background: rgba(0,229,255,0.04);
            border: 1px solid rgba(0,229,255,0.15);
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            font-size: 11px;
            color: #7A90B8;
            display: none;
        }
        .nt-cost-preview.visible { display: block; }
        .nt-cost-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .nt-cost-row b { color: #C4D4EE; }
        .nt-cost-free { color: #00E87A; font-weight: 700; }
        .nt-submit {
            width: 100%;
            background: rgba(0,229,255,0.12);
            border: 1.5px solid rgba(0,229,255,0.35);
            color: #00E5FF;
            padding: 12px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.08em;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: 'Sora', sans-serif;
        }
        .nt-submit:hover { background: rgba(0,229,255,0.2); box-shadow: 0 0 20px rgba(0,229,255,0.2); }
        .nt-alert {
            background: rgba(255,61,113,0.08);
            border: 1px solid rgba(255,61,113,0.3);
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 12px;
            color: #FF3D71;
            margin-top: 12px;
            display: none;
            white-space: pre-line;
        }
        .nt-success {
            background: rgba(0,232,122,0.08);
            border: 1px solid rgba(0,232,122,0.3);
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 12px;
            color: #00E87A;
            margin-top: 12px;
            display: none;
        }
        .nt-campaigns {
            margin-top: 18px;
            border-top: 1px solid #1C2840;
            padding-top: 14px;
        }
        .nt-camp-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #3F5070; margin-bottom: 10px; }
        .nt-camp-item {
            background: #07090D;
            border: 1px solid #1C2840;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nt-camp-platform { font-size: 20px; }
        .nt-camp-info { flex: 1; }
        .nt-camp-name { font-size: 12px; font-weight: 600; color: #C4D4EE; }
        .nt-camp-meta { font-size: 10px; color: #3F5070; margin-top: 2px; }
        .nt-camp-kpi { text-align: right; }
        .nt-camp-spend { font-size: 12px; font-weight: 700; color: #C4955A; }
        .nt-camp-status { font-size: 9px; color: #00E87A; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
        .nt-empty { text-align: center; color: #3F5070; font-size: 12px; padding: 16px 0; }
    `;

    function _injectCSS() {
        if (document.getElementById('nexia-traffic-css')) return;
        const s = document.createElement('style');
        s.id = 'nexia-traffic-css';
        s.textContent = WIDGET_CSS;
        document.head.appendChild(s);
    }

    function renderWidget(selector, tenantId) {
        _injectCSS();
        const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!container) return;

        const godMode = _isGodMode();
        const wallet  = godMode ? null : _getWallet(tenantId);

        container.innerHTML = `
            <div class="nexia-traffic-widget">
                <div class="nt-header">
                    <div>
                        <div class="nt-title">⚡ NEXIA TRAFFIC ENGINE</div>
                        <div class="nt-subtitle">Distribuição Omnichannel · Google · YouTube · LinkedIn · TikTok · Meta</div>
                    </div>
                    ${godMode
                        ? '<div class="nt-badge-god">🟢 GOD MODE — Taxa R$ 0,00</div>'
                        : `<div class="nt-badge-tenant">Carteira NEXIA Pay</div>`}
                </div>

                ${!godMode ? `
                <div class="nt-wallet-bar">
                    <span class="nt-wallet-label">Saldo disponível</span>
                    <span class="nt-wallet-balance" id="nt-wallet-val">${_formatBRL(wallet.balance)}</span>
                </div>` : `
                <div class="nt-wallet-bar">
                    <span class="nt-wallet-label">Modo Soberano — Tráfego Orgânico / Mestre</span>
                    <span class="nt-wallet-god">∞ Ilimitado · R$ 0,00</span>
                </div>`}

                <div style="font-size:11px;color:#3F5070;margin-bottom:10px;text-transform:uppercase;letter-spacing:.1em;">Selecione a plataforma</div>
                <div class="nt-platforms">
                    ${Object.entries(PLATFORMS).map(([k,p]) => `
                        <div class="nt-platform-btn" data-platform="${k}">
                            <span class="icon">${p.icon}</span>${p.name.split(' ')[0]}
                        </div>
                    `).join('')}
                </div>

                <div class="nt-row">
                    <div class="nt-field">
                        <label class="nt-label">Objetivo</label>
                        <select class="nt-select" id="nt-objective">
                            ${Object.entries(OBJECTIVES).map(([k,o]) => `<option value="${k}">${o.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="nt-field">
                        <label class="nt-label">Orçamento (R$)</label>
                        <input class="nt-input" id="nt-budget" type="number" min="50" step="50" placeholder="500" />
                    </div>
                </div>

                <div class="nt-row">
                    <div class="nt-field">
                        <label class="nt-label">Nome da Campanha</label>
                        <input class="nt-input" id="nt-name" type="text" placeholder="Ex: CES 2027 — Awareness" />
                    </div>
                </div>

                <div class="nt-cost-preview" id="nt-preview">
                    <div class="nt-cost-row"><span>Orçamento de mídia</span><b id="nt-pr-budget">—</b></div>
                    <div class="nt-cost-row" id="nt-pr-fee-row"><span>Taxa de gestão NEXIA (15%)</span><b id="nt-pr-fee">—</b></div>
                    <div class="nt-cost-row" style="border-top:1px solid rgba(0,229,255,0.1);padding-top:6px;margin-top:4px">
                        <span><b>Total debitado</b></span>
                        <b id="nt-pr-total" class="${godMode ? 'nt-cost-free' : ''}">—</b>
                    </div>
                    <div style="margin-top:8px;color:#3F5070;font-size:10px;">
                        Alcance estimado: <b id="nt-pr-reach" style="color:#C4D4EE">—</b>
                    </div>
                </div>

                <button class="nt-submit" id="nt-submit">⚡ ATIVAR CAMPANHA</button>
                <div class="nt-alert" id="nt-alert"></div>
                <div class="nt-success" id="nt-success"></div>

                <div class="nt-campaigns">
                    <div class="nt-camp-title">Campanhas Ativas</div>
                    <div id="nt-camp-list"><div class="nt-empty">Nenhuma campanha ativa</div></div>
                </div>
            </div>
        `;

        // ── BIND EVENTS ────────────────────────────────────────────
        let _selPlatform = null;

        container.querySelectorAll('.nt-platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.nt-platform-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                _selPlatform = btn.dataset.platform;
                _updatePreview();
            });
        });

        const budgetInput = container.querySelector('#nt-budget');
        budgetInput.addEventListener('input', _updatePreview);

        function _updatePreview() {
            const budget = parseFloat(budgetInput.value);
            const preview = container.querySelector('#nt-preview');
            if (!_selPlatform || !budget || budget < 50) { preview.classList.remove('visible'); return; }
            preview.classList.add('visible');

            const fee   = godMode ? 0 : budget * 0.15;
            const total = godMode ? 0 : budget + fee;
            const pf    = PLATFORMS[_selPlatform];
            const imp   = Math.round((budget / pf.cpcBase) * 1000);

            container.querySelector('#nt-pr-budget').textContent = _formatBRL(budget);
            container.querySelector('#nt-pr-fee').textContent    = godMode ? 'R$ 0,00' : _formatBRL(fee);
            container.querySelector('#nt-pr-fee-row').style.opacity = godMode ? '0.4' : '1';
            container.querySelector('#nt-pr-total').textContent  = godMode ? 'R$ 0,00 (God Mode)' : _formatBRL(total);
            container.querySelector('#nt-pr-reach').textContent  = `~${imp.toLocaleString('pt-BR')} impressões · ${pf.reach}`;
        }

        container.querySelector('#nt-submit').addEventListener('click', () => {
            const budget    = parseFloat(budgetInput.value);
            const objective = container.querySelector('#nt-objective').value;
            const name      = container.querySelector('#nt-name').value;
            const alert     = container.querySelector('#nt-alert');
            const success   = container.querySelector('#nt-success');

            alert.style.display   = 'none';
            success.style.display = 'none';

            if (!_selPlatform) {
                alert.textContent   = '⚠ Selecione uma plataforma primeiro.';
                alert.style.display = 'block';
                return;
            }
            if (!budget || budget < 50) {
                alert.textContent   = '⚠ Orçamento mínimo: R$ 50,00';
                alert.style.display = 'block';
                return;
            }

            createCampaign({ platform: _selPlatform, budget, objective, tenantId, name }).then(res => {
                if (!res.success) {
                    alert.textContent   = `✖ ${res.error}`;
                    alert.style.display = 'block';
                    return;
                }
                const c = res.campaign;
                success.innerHTML   = `✅ Campanha <strong>${c.name}</strong> ativada!<br>
                                       Plataforma: ${PLATFORMS[c.platform].name} · 
                                       Alcance estimado: ~${c.metrics.impressions.toLocaleString('pt-BR')} impressões`;
                success.style.display = 'block';

                // Atualiza saldo
                if (!godMode) {
                    const wb = container.querySelector('#nt-wallet-val');
                    if (wb) wb.textContent = _formatBRL(_getWallet(tenantId).balance);
                }

                // Atualiza lista
                _renderCampaigns();
            });
        });

        function _renderCampaigns() {
            const list = container.querySelector('#nt-camp-list');
            const dash = getDashboard(tenantId);
            if (!dash.campaigns.length) {
                list.innerHTML = '<div class="nt-empty">Nenhuma campanha ativa</div>';
                return;
            }
            list.innerHTML = dash.campaigns.map(c => `
                <div class="nt-camp-item">
                    <div class="nt-camp-platform">${PLATFORMS[c.platform]?.icon || '📢'}</div>
                    <div class="nt-camp-info">
                        <div class="nt-camp-name">${c.name}</div>
                        <div class="nt-camp-meta">${PLATFORMS[c.platform]?.name} · ${OBJECTIVES[c.objective]?.name}</div>
                    </div>
                    <div class="nt-camp-kpi">
                        <div class="nt-camp-spend">${c.godMode ? 'R$ 0,00' : _formatBRL(c.totalCost)}</div>
                        <div class="nt-camp-status">● Ativo</div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ── EXPORT ────────────────────────────────────────────────────────
    return {
        createCampaign,
        getDashboard,
        renderWidget,
        platforms:  PLATFORMS,
        objectives: OBJECTIVES,
        isGodMode:  _isGodMode,
        getWallet:  _getWallet,
    };

})();

// Log de confirmação
if (typeof NEXIA !== 'undefined') {
    NEXIA.log('NexiaTraffic Engine online · Omnichannel v1.0', 'ok');
} else {
    console.log('%c[NexiaTraffic] Engine online · Omnichannel v1.0', 'color:#00E5FF;font-weight:bold');
}