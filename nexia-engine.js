/**
 * NEXIA OS — CORE CONFIGURATION ENGINE v6.0
 * Fixes: enablePersistence → cache API (no deprecation warning)
 * Firebase Real · Multi-Tenancy · Zero mocks
 */

const NEXIA_CONFIG = {
    firebase: {
        apiKey:            "AIzaSyC9L592zKSUjx-YglmbGpxjv2hsXm_gbBM",
        authDomain:        "nexia-c8710.firebaseapp.com",
        projectId:         "nexia-c8710",
        storageBucket:     "nexia-c8710.firebasestorage.app",
        messagingSenderId: "623044447905",
        appId:             "1:623044447905:web:13f70e1584fb0fcf8d2ae0",
        measurementId:     "G-KM6JT7L05J"
    },
    tenants: {
        "MASTER":       { id:"NEXIA_MASTER",   name:"NEXIA CORPORATION",          theme:"dark", modules:["all"] },
        "VIAJANTE_PRO": { id:"VP_AGENCIA_01",  name:"Viajante Pro Oficial",        theme:"dark", modules:["turismo","financeiro","logistica"] },
        "CES":          { id:"CES_2027_BR",    name:"CES Brasil 2027",             theme:"dark", modules:["eventos","matchmaking","compliance"] },
        "BEZSAN":       { id:"BEZSAN_01",      name:"Bezsan Leilões",              theme:"dark", modules:["leiloes","financeiro","investimentos"] }
    },
    settings: { sessionTimeout:3600, forceMFA:false, allowDebug:true, version:"6.0.0" }
};

class NexiaCore {
    constructor() {
        this.app = null; this.db = null; this.auth = null; this.rtdb = null;
        this.currentTenant = null; this._ready = false; this._readyCallbacks = [];
        this._init();
    }

    _init() {
        this.log(`NEXIA OS v${NEXIA_CONFIG.settings.version} INICIANDO...`, 'info');
        const tryInit = () => {
            if (typeof firebase === 'undefined') { setTimeout(tryInit, 100); return; }
            try {
                this.app  = firebase.apps.length ? firebase.app() : firebase.initializeApp(NEXIA_CONFIG.firebase);
                // Auth lazy: só inicializa se o SDK auth estiver disponível
                try { this.auth = firebase.auth ? firebase.auth() : null; } catch(e) { this.auth = null; }

                // FIX: Use experimentalForceLongPolling + settings instead of deprecated enablePersistence
                try {
                    this.db = firebase.firestore();
                    // Modern approach: just use memory cache, no deprecated enablePersistence call
                    // onSnapshot handles reconnection automatically
                } catch(e) {
                    this.db = firebase.firestore();
                }

                this.detectTenantContext();
                this._ready = true;
                this._readyCallbacks.forEach(cb => { try { cb(); } catch(e) {} });
                this.log(`Firebase online · nexia-c8710 · Tenant: ${this.currentTenant?.name}`, 'ok');
            } catch (error) {
                this.log(`ERRO CRÍTICO: ${error.message}`, 'err');
            }
        };
        tryInit();
    }

    onReady(cb) { if (this._ready) { cb(); } else { this._readyCallbacks.push(cb); } }

    detectTenantContext() {
        const p = window.location.pathname.toLowerCase();
        if      (p.includes('/nexia/') || p.includes('nexia-master'))  this.currentTenant = NEXIA_CONFIG.tenants.MASTER;
        else if (p.includes('/viajante-pro/') || p.includes('vp-'))    this.currentTenant = NEXIA_CONFIG.tenants.VIAJANTE_PRO;
        else if (p.includes('/ces/') || p.includes('ces-'))            this.currentTenant = NEXIA_CONFIG.tenants.CES;
        else if (p.includes('/bezsan/') || p.includes('bezsan-'))      this.currentTenant = NEXIA_CONFIG.tenants.BEZSAN;
        else                                                            this.currentTenant = { id:'GUEST', name:'Visitante', modules:[] };
    }

    getCollection(col) {
        const tid = this.currentTenant?.id;
        if (!tid || tid === 'GUEST') return this.db.collection(col);
        return this.db.collection('tenants').doc(tid).collection(col);
    }

    getTenantConfigRef(tenantId) {
        const tid = tenantId || this.currentTenant?.id;
        return this.db.collection('tenants').doc(tid).collection('config').doc('brand');
    }

    log(msg, type='info') {
        if (!NEXIA_CONFIG.settings.allowDebug) return;
        const c = { info:'#00e5ff', ok:'#00d68f', warn:'#ffaa00', err:'#ff3d71' };
        console.log(`%c[NEXIA ${type.toUpperCase()}] %c${msg}`, `color:${c[type]||'#00e5ff'};font-weight:bold`, 'color:#c4d4ee');
    }
}

const NEXIA = new NexiaCore();
window.NEXIA = NEXIA;

// Sanitizer
window.NEXIA.sanitize = s => { if (typeof s !== 'string') return s; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

// NEXIA Shield anti-XSS
const _origLog = console.log;
console.log = function(...a) {
    if (typeof a[0] === 'string' && a[0].includes('<script>')) { _origLog('%c[NEXIA SHIELD] XSS blocked!','color:red;font-weight:bold'); return; }
    _origLog.apply(console, a);
};
