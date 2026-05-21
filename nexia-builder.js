/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA OS — AUTH ENGINE v7.0 · BLINDADO · PATCH V13
 * ---------------------------------------------------------------
 * FIXES v7.0 (PATCH WHITE-LABEL DEUS):
 *  1. GUARD OBRIGATÓRIO: todo admin redireciona para /login.html
 *     se não autenticado — sem exceções, sem bypass acidental.
 *  2. GOD MODE SESSION: apenas sessionStorage.nexiaGodMode='1'
 *     libera acesso sem senha (para setups internos).
 *  3. ANTI-FLASH: body fica oculto até auth resolver.
 *  4. Timeout seguro de 10s (não congela tela).
 * ═══════════════════════════════════════════════════════════════════
 */
(function(window) {
  'use strict';

  /* ── Firebase config ─────────────────────────────────────────── */
  var FB = {
    apiKey:            'AIzaSyC9L592zKSUjx-YglmbGpxjv2hsXm_gbBM',
    authDomain:        'nexia-c8710.firebaseapp.com',
    projectId:         'nexia-c8710',
    storageBucket:     'nexia-c8710.firebasestorage.app',
    messagingSenderId: '623044447905',
    appId:             '1:623044447905:web:13f70e1584fb0fcf8d2ae0'
  };

  /* ── IDENTITY MAP ────────────────────────────────────────────── */
  var IDENTITY_MAP = {
    'admin@nexia.com':             { role: 'SUPER_ADMIN',  tenantId: '*',            name: 'Super Admin', clearance: 100 },
    'gbezerra@nexia.com':          { role: 'SUPER_ADMIN',  tenantId: '*',            name: 'Gildivan',    clearance: 100 },
    'henrique@cesbrasil.tech':     { role: 'CES_ADMIN',    tenantId: 'CES_2027_BR',  name: 'Henrique CES',clearance: 50  },
    'admin@cesbrasil.tech':        { role: 'CES_ADMIN',    tenantId: 'CES_2027_BR',  name: 'Admin CES',   clearance: 50  },
    'henrique@viajantepro.com':    { role: 'CLIENT_ADMIN', tenantId: 'VP_AGENCIA_01',name: 'Henrique VP', clearance: 50  },
    'henrique@viajantepro.com.br': { role: 'CLIENT_ADMIN', tenantId: 'VP_AGENCIA_01',name: 'Henrique VP', clearance: 50  },
    'admin@bezsan.com.br':         { role: 'BEZSAN_ADMIN', tenantId: 'BEZSAN_01',    name: 'Admin Bezsan',clearance: 50  }
  };

  var PERMISSIONS = {
    SUPER_ADMIN:   ['ACCESS_ALL_TENANTS','MANAGE_TENANTS','MANAGE_USERS','MANAGE_MODULES','VIEW_ANALYTICS','ACCESS_STORE','ACCESS_CES','ACCESS_VIAJANTE','ACCESS_BEZSAN','EDIT_LANDING','EDIT_APP'],
    NEXIA_ADMIN:   ['MANAGE_TENANTS','MANAGE_USERS','VIEW_ANALYTICS','ACCESS_STORE','EDIT_LANDING','EDIT_APP'],
    CES_ADMIN:     ['ACCESS_CES','VIEW_ANALYTICS','ACCESS_STORE','EDIT_LANDING','EDIT_APP'],
    CLIENT_ADMIN:  ['ACCESS_VIAJANTE','ACCESS_STORE','VIEW_ANALYTICS','EDIT_LANDING','EDIT_APP'],
    BEZSAN_ADMIN:  ['ACCESS_BEZSAN','VIEW_ANALYTICS','ACCESS_STORE','EDIT_LANDING','EDIT_APP'],
    VIAJANTE_USER: ['ACCESS_VIAJANTE'],
    USER:          []
  };

  var CLEARANCE = {
    SUPER_ADMIN: 100, NEXIA_ADMIN: 100,
    CES_ADMIN: 50,    CLIENT_ADMIN: 50,
    BEZSAN_ADMIN: 50,
    VIAJANTE_USER: 5, USER: 1
  };

  /* ── DESTINOS DE LOGIN por role ──────────────────────────────── */
  var LOGIN_DEST = {
    SUPER_ADMIN:   '/nexia/nexia-master.html',
    NEXIA_ADMIN:   '/nexia/nexia-master.html',
    CES_ADMIN:     '/ces/ces-admin.html',
    CLIENT_ADMIN:  '/viajante-pro/vp-admin.html',
    BEZSAN_ADMIN:  '/bezsan/bezsan-admin.html',
    VIAJANTE_USER: '/viajante-pro/vp-passenger.html',
    USER:          '/login.html'
  };

  var LOGIN = '/login.html';

  /* ── ESTADO ──────────────────────────────────────────────────── */
  var _auth         = null;
  var _db           = null;
  var _session      = null;
  var _guardRoles   = null;
  var _cbs          = [];
  var _redirecting  = false;
  var _redirectLock = 0;
  var _authFired    = false;

  /* ── HELPERS ─────────────────────────────────────────────────── */
  function _onLoginPage()     { return window.location.pathname.indexOf('login') !== -1; }
  function _onBootstrapPage() { return window.location.pathname.indexOf('bootstrap') !== -1; }
  function _onPublicPage()    {
    var p = window.location.pathname;
    return p === '/' || p.endsWith('index.html') ||
           p.endsWith('ces-landing.html') ||
           p.endsWith('vp-landing.html')  ||
           p.endsWith('bezsan-landing.html');
  }
  function _currentPath() { return window.location.pathname.toLowerCase(); }

  /* ── ANTI-FLASH: esconde body até auth resolver ──────────────── */
  function _hideBody() {
    if (_onLoginPage() || _onBootstrapPage() || _onPublicPage()) return;
    if (document.body) {
      document.body.style.visibility = 'hidden';
      document.body.style.opacity = '0';
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        if (!_onLoginPage() && !_onPublicPage()) {
          document.body.style.visibility = 'hidden';
          document.body.style.opacity = '0';
        }
      });
    }
  }

  function _showBody() {
    if (document.body) {
      document.body.style.visibility = '';
      document.body.style.opacity = '';
    }
  }

  function _redirect(url) {
    var now = Date.now();
    if (_redirecting)              return;
    if (now - _redirectLock < 300) return;
    _redirecting  = true;
    _redirectLock = now;
    window.location.href = url;
  }

  /* ── GOD MODE SESSION (token interno, não persistente) ───────── */
  function _hasGodModeToken() {
    try { return sessionStorage.getItem('nexiaGodMode') === '1'; } catch(e) { return false; }
  }

  /* ── VERIFICA SE ROTA É PERMITIDA PARA SUPER_ADMIN ──────────── */
  function _isGodModePath(path) {
    var p = path || _currentPath();
    return (
      p.indexOf('/nexia/')        !== -1 ||
      p.indexOf('/ces/')          !== -1 ||
      p.indexOf('/viajante-pro/') !== -1 ||
      p.indexOf('/bezsan/')       !== -1 ||
      p.indexOf('/builder/')      !== -1 ||
      p.indexOf('bootstrap')      !== -1 ||
      p === '/'
    );
  }

  function _mkSession(fu, role, name, tenantId, token) {
    return {
      uid:          fu.uid,
      email:        fu.email,
      name:         name || fu.email.split('@')[0],
      role:         role,
      tenantId:     tenantId || (role === 'SUPER_ADMIN' ? '*' : null),
      clearance:    CLEARANCE[role] || 1,
      permissions:  PERMISSIONS[role] || [],
      token:        token,
      firebaseUser: fu
    };
  }

  /* ── FIREBASE INIT ───────────────────────────────────────────── */
  function _boot() {
    /* Anti-flash: oculta página até saber se está logado */
    _hideBody();

    var attempts = 0;
    var maxAttempts = 50;

    var iv = setInterval(function() {
      attempts++;

      if (typeof firebase !== 'undefined') {
        clearInterval(iv);
        try {
          if (!firebase.apps.length) firebase.initializeApp(FB);
          _auth = firebase.auth();
          _db   = firebase.firestore();
          _auth.onAuthStateChanged(_onChange);

          setTimeout(function() {
            if (!_authFired) {
              _authFired = true;
              _onChange(null);
            }
          }, 10000);

        } catch (err) {
          console.error('[NexiaAuth] Firebase init error:', err.message);
          setTimeout(function() {
            if (!_authFired) { _onChange(null); }
          }, 1000);
        }
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(iv);
        console.error('[NexiaAuth] Firebase SDK não carregou em 5s.');
        setTimeout(function() {
          if (!_authFired) { _onChange(null); }
        }, 500);
      }
    }, 100);
  }

  /* ── AUTH STATE CHANGE ───────────────────────────────────────── */
  function _onChange(fu) {
    _authFired = true;

    if (!fu) {
      _session = null;
      window._nexiaSession = null;

      /* SEGURANÇA: se há guard ativo e não é página pública → login */
      if (_guardRoles && !_onLoginPage() && !_onBootstrapPage() && !_onPublicPage()) {
        /* Permite God Mode Token (setup interno) */
        if (_hasGodModeToken()) {
          _showBody();
          return;
        }
        /* REDIRECIONA PARA LOGIN — SEM EXCEÇÃO */
        _redirect(LOGIN + '?msg=' + encodeURIComponent('Sessão expirada. Faça login para continuar.'));
      } else {
        _showBody();
      }
      return;
    }
    _resolveIdentity(fu);
  }

  /* ── RESOLUÇÃO DE IDENTIDADE ─────────────────────────────────── */
  function _resolveIdentity(fu) {
    var email    = (fu.email || '').toLowerCase().trim();
    var identity = IDENTITY_MAP[email];

    if (identity) {
      fu.getIdToken().then(function(tok) {
        _applySession(_mkSession(fu, identity.role, identity.name, identity.tenantId, tok));
      }).catch(function() {
        _applySession(_mkSession(fu, identity.role, identity.name, identity.tenantId, null));
      });
      return;
    }

    if (!_db) {
      fu.getIdToken().then(function(tok) {
        _applySession(_mkSession(fu, 'USER', email.split('@')[0], null, tok));
      }).catch(function() {});
      return;
    }

    _db.collection('users').doc(fu.uid).get()
      .then(function(doc) {
        var role, tid, name, status;
        if (doc.exists) {
          var d  = doc.data();
          role   = d.role     || 'USER';
          tid    = d.tenantId || null;
          name   = d.name     || email.split('@')[0];
          status = d.status   || 'active';
        } else {
          role = 'USER'; tid = null;
          name = email.split('@')[0]; status = 'active';
          _db.collection('users').doc(fu.uid).set({
            uid: fu.uid, name: name, email: email,
            role: 'USER', tenantId: null, status: 'active',
            createdAt: new Date().toISOString()
          }).catch(function() {});
        }
        if (status === 'suspended') { _auth.signOut(); return; }
        fu.getIdToken().then(function(tok) {
          _applySession(_mkSession(fu, role, name, tid, tok));
        }).catch(function() {
          _applySession(_mkSession(fu, role, name, tid, null));
        });
      })
      .catch(function(err) {
        console.warn('[NexiaAuth] Firestore lookup failed:', err.message);
        fu.getIdToken().then(function(tok) {
          _applySession(_mkSession(fu, 'USER', email.split('@')[0], null, tok));
        }).catch(function() {
          _applySession(_mkSession(fu, 'USER', email.split('@')[0], null, null));
        });
      });
  }

  /* ── APLICAR SESSÃO ──────────────────────────────────────────── */
  function _applySession(session) {
    _session = session;
    window._nexiaSession = session;

    if (typeof NexiaGovernance !== 'undefined') {
      window._nexiaCurrentUser = {
        clearance: session.clearance,
        role:      session.role,
        tenantId:  session.tenantId,
        email:     session.email
      };
    }

    /* Dispara callbacks onReady */
    var snapshot = _cbs.slice();
    _cbs = [];
    snapshot.forEach(function(cb) { try { cb(session); } catch(e) {} });

    /* Login page: redireciona para painel */
    if (_onLoginPage() || _onBootstrapPage() || _onPublicPage()) {
      if (_onLoginPage() && session && session.role) {
        var dest = LOGIN_DEST[session.role];
        if (dest && dest !== LOGIN) { _redirect(dest); return; }
      }
      _showBody();
      return;
    }

    _checkGuard(session);
  }

  /* ── GUARD ───────────────────────────────────────────────────── */
  function _checkGuard(session) {
    if (!_guardRoles) { _showBody(); return; }
    var s = session || _session;
    if (!s) { _redirect(LOGIN); return; }

    if (s.role === 'SUPER_ADMIN' || s.role === 'NEXIA_ADMIN') {
      if (!_isGodModePath()) {
        _redirect('/nexia/nexia-master.html');
        return;
      }
      _showBody();
      return;
    }

    if (_guardRoles.indexOf(s.role) !== -1) {
      _showBody();
      return;
    }

    /* Não autorizado */
    var p      = _currentPath();
    var tenant = p.indexOf('/ces/')          !== -1 ? 'ces'
               : p.indexOf('/viajante-pro/') !== -1 ? 'viajante'
               : p.indexOf('/bezsan/')       !== -1 ? 'bezsan'
               : p.indexOf('/nexia/')        !== -1 ? 'nexia'
               : '';

    _redirect(LOGIN
      + '?msg='    + encodeURIComponent('Acesso não autorizado para este painel.')
      + (tenant ? '&tenant=' + tenant : ''));
  }

  /* ── API PÚBLICA ─────────────────────────────────────────────── */
  window.NexiaAuth = {
    ROLE_DEST:     LOGIN_DEST,
    ROLE_REDIRECT: LOGIN_DEST,
    CLEARANCE:     CLEARANCE,
    IDENTITY_MAP:  IDENTITY_MAP,
    PERMISSIONS:   PERMISSIONS,

    /**
     * guard('ROLE_A', 'ROLE_B', ...)
     * OBRIGATÓRIO em todo admin. Redireciona se não autenticado.
     */
    guard: function() {
      _guardRoles = Array.prototype.slice.call(arguments);
      if (_session) {
        _checkGuard(_session);
      } else if (_authFired) {
        /* Auth já disparou mas sem sessão = não logado */
        if (!_hasGodModeToken()) {
          _redirect(LOGIN + '?msg=' + encodeURIComponent('Faça login para acessar este painel.'));
        } else {
          _showBody();
        }
      }
      /* Se auth ainda não disparou, _onChange vai cuidar */
    },

    onReady: function(cb) {
      if (_session) { try { cb(_session); } catch(e) {} return; }
      _cbs.push(cb);
    },

    getSession: function() { return _session; },

    can: function(permission) {
      return !!(_session && _session.permissions.indexOf(permission) !== -1);
    },

    login: function(email, password) {
      if (!_auth) {
        if (typeof firebase !== 'undefined') {
          if (!firebase.apps.length) firebase.initializeApp(FB);
          _auth = firebase.auth();
          _db   = firebase.firestore();
        } else {
          return Promise.reject(new Error('Firebase SDK não carregado.'));
        }
      }

      var savedGuard = _guardRoles;
      _guardRoles    = null;
      _session       = null;
      _authFired     = false;
      _redirecting   = false;

      return _auth.signInWithEmailAndPassword(email, password)
        .then(function() {
          return new Promise(function(resolve, reject) {
            var elapsed = 0;
            var iv = setInterval(function() {
              elapsed += 80;
              if (_session) { clearInterval(iv); resolve(_session); return; }
              if (elapsed > 12000) {
                clearInterval(iv);
                _guardRoles = savedGuard;
                reject(new Error('Timeout ao carregar perfil. Tente novamente.'));
              }
            }, 80);
          });
        })
        .catch(function(err) { _guardRoles = savedGuard; return Promise.reject(err); });
    },

    logout: function() {
      _session      = null;
      _redirecting  = false;
      _redirectLock = 0;
      window._nexiaSession = null;
      var p = _auth ? _auth.signOut() : Promise.resolve();
      return p.then(function() { _redirect(LOGIN); });
    },

    db:       function() { return _db; },
    auth:     function() { return _auth; },
    fbConfig: FB
  };

  /* ── BOOT ────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }

})(window);
