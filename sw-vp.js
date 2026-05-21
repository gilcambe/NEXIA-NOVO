<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NEXIA OS — Master Control</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

<!-- NEXIA Core -->
<script src="../core/config.js" onerror="console.warn('config.js not found')"></script>
<script src="../core/governance.js" onerror="console.warn('governance.js not found')"></script>
<script src="../core/bridge.js" onerror="console.warn('bridge.js not found')"></script>
<script src="../core/auth.js"></script>
<!-- ═══ GUARD OBRIGATÓRIO ═══ -->
<script>
  if (typeof NexiaAuth !== 'undefined') {
    NexiaAuth.guard('SUPER_ADMIN', 'NEXIA_ADMIN');
  }
</script>
<script src="../core/nexia-i18n.js"></script>
<script src="../core/nexia-seed.js" onerror="console.warn('nexia-seed.js not found')"></script>
<script src="../core/nexia-next-core.js" onerror="console.warn('nexia-next-core.js not found')"></script>
<!-- GrapesJS para Site Builder -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/grapesjs/0.21.10/grapes.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/grapesjs/0.21.10/css/grapes.min.css">
<script src="../core/nexia-builder-ui.js"></script>

<style>
/* ═══════════════════════════════════════════════════════════
   NEXIA MASTER — OFF-WHITE APPLE PREMIUM · V13
   ═══════════════════════════════════════════════════════════ */
:root {
  --bg:      #FAF8F5;
  --surface: #FFFFFF;
  --surface2:#F5F2ED;
  --border:  #E5E0D8;
  --accent:  #0071e3;
  --accent2: #0077ed;
  --gold:    #C4955A;
  --red:     #EF4444;
  --green:   #10B981;
  --text:    #1d1d1f;
  --muted:   #86868b;
  --sidebar: 240px;
  --ff:      'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); color: var(--text); font-family: var(--ff); height: 100vh; overflow: hidden; }

/* ── NEXIA SPLASH ── */
#nexia-splash {
  position: fixed; inset: 0; z-index: 9999;
  background: #05070D;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  animation: splashOut 0.6s ease 2.3s forwards;
}
.sp-logo {
  font-size: 3rem; font-weight: 900; letter-spacing: 4px; color: #00c6ff;
  animation: spFade 0.8s ease 0.3s both;
}
.sp-sub {
  font-size: 10px; letter-spacing: 5px; text-transform: uppercase; color: rgba(0,198,255,0.4);
}
.sp-bar { width: 64px; height: 2px; background: rgba(0,198,255,0.15); border-radius: 1px; overflow: hidden; }
.sp-fill { height: 100%; width: 0; background: linear-gradient(90deg, #00c6ff, #0072ff); animation: barFill 1.8s ease 0.2s forwards; }
@keyframes splashOut { to { opacity: 0; pointer-events: none; } }
@keyframes spFade { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes barFill { to { width: 100%; } }

/* ── LAYOUT ── */
#app { display: none; height: 100vh; flex-direction: row; }

/* ── SIDEBAR ── */
#sidebar {
  width: var(--sidebar); flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.sb-logo {
  padding: 20px 18px 14px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
}
.sb-gem {
  width: 32px; height: 32px; border-radius: 8px;
  background: linear-gradient(135deg, #0a0c14, #1a2235);
  border: 1px solid rgba(0,198,255,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sb-name { font-size: 13px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
.sb-sub  { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 1px; }

nav { flex: 1; padding: 10px 0; }
.nav-section-label {
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--muted); padding: 10px 18px 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 18px; cursor: pointer;
  font-size: 12px; font-weight: 500; color: var(--muted);
  transition: all 0.15s; margin: 1px 8px; border-radius: 8px;
}
.nav-item:hover { color: var(--text); background: var(--surface2); }
.nav-item.active { color: var(--text); background: rgba(0,113,227,0.08); font-weight: 700; box-shadow: inset 3px 0 0 var(--accent); }
.nav-icon { font-size: 14px; flex-shrink: 0; opacity: 0.7; }
.nav-item.active .nav-icon { opacity: 1; }
.nav-badge {
  margin-left: auto; font-size: 8px; font-weight: 700; padding: 2px 7px;
  border-radius: 20px; letter-spacing: 0.3px;
}
.badge-live { background: rgba(16,185,129,0.12); color: var(--green); border: 1px solid rgba(16,185,129,0.2); }
.badge-pro  { background: rgba(196,149,90,0.12); color: var(--gold); border: 1px solid rgba(196,149,90,0.2); }
.badge-hot  { background: rgba(239,68,68,0.12); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }

.sb-footer { padding: 14px 16px; border-top: 1px solid var(--border); }

/* ── MAIN ── */
#main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

#topbar {
  height: 58px;
  background: rgba(250,248,245,0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; flex-shrink: 0;
}
.topbar-left { display: flex; flex-direction: column; }
.topbar-title { font-size: 14px; font-weight: 800; color: var(--text); }
.topbar-meta  { font-size: 10px; color: var(--accent); font-weight: 600; margin-top: 1px; }
.topbar-right { display: flex; align-items: center; gap: 10px; }

.lang-select {
  background: var(--surface2); border: 1px solid var(--border); color: var(--text);
  padding: 5px 10px; border-radius: 7px; font-size: 11px; cursor: pointer; font-family: var(--ff);
}
.avatar-btn {
  width: 32px; height: 32px; border-radius: 9px;
  background: linear-gradient(135deg, #0a0c14, #00c6ff);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 12px; cursor: pointer; color: #fff;
}

#content { flex: 1; overflow-y: auto; padding: 24px; background: var(--bg); }

/* ── VIEWS ── */
.view-section { display: none; }
.view-section.active { display: block; }

/* ── SECTION HEADER ── */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.section-title  { font-size: 20px; font-weight: 800; color: var(--text); }
.section-sub    { font-size: 11px; color: var(--muted); margin-top: 3px; }

/* ── STATS GRID ── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 14px; margin-bottom: 22px; }
.stat-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 800; color: var(--accent); line-height: 1; }
.stat-delta { font-size: 10px; color: var(--green); margin-top: 4px; font-weight: 600; }

/* ── CARD ── */
.card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  overflow: hidden; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.card-header {
  padding: 14px 18px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.card-title  { font-size: 13px; font-weight: 700; color: var(--text); }
.card-body   { padding: 18px; }

/* ── TABLE ── */
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { text-align: left; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px; border-bottom: 1px solid var(--border); background: var(--surface2); }
td { padding: 11px 14px; border-bottom: 1px solid rgba(229,224,216,0.5); color: var(--text); }
tr:hover td { background: var(--surface2); }
tr:last-child td { border-bottom: none; }

.tag { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.tag-green  { background: rgba(16,185,129,0.1); color: var(--green); }
.tag-red    { background: rgba(239,68,68,0.1); color: var(--red); }
.tag-blue   { background: rgba(0,113,227,0.1); color: var(--accent); }
.tag-gold   { background: rgba(196,149,90,0.1); color: var(--gold); }
.tag-gray   { background: var(--surface2); color: var(--muted); }

/* ── BUTTONS ── */
.btn { padding: 9px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: var(--ff); }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent2); }
.btn-ghost { background: transparent; border-color: var(--border); color: var(--muted); }
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
.btn-red { background: rgba(239,68,68,0.08); border-color: var(--red); color: var(--red); }
.btn-sm { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid var(--border); background: var(--surface2); color: var(--muted); cursor: pointer; font-family: var(--ff); transition: all 0.15s; }
.btn-sm:hover { border-color: var(--accent); color: var(--accent); }

/* ── FORM ── */
.form-group { margin-bottom: 14px; }
.form-group label { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 5px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
input[type=text], input[type=email], input[type=number], input[type=password], select, textarea {
  background: var(--surface2); border: 1px solid var(--border); color: var(--text);
  border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: var(--ff);
  outline: none; transition: border-color 0.15s; width: 100%;
}
input:focus, select:focus, textarea:focus { border-color: var(--accent); }

/* ── TENANT GRID ── */
.tenant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.tenant-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  padding: 18px; transition: box-shadow 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  cursor: pointer; position: relative; overflow: hidden;
}
.tenant-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.tenant-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
.tenant-name   { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.tenant-id     { font-size: 10px; color: var(--muted); font-family: monospace; margin-bottom: 12px; }
.tenant-stats  { display: flex; gap: 20px; }
.tenant-stat   { display: flex; flex-direction: column; }
.tenant-stat-v { font-size: 18px; font-weight: 800; color: var(--accent); line-height: 1; }
.tenant-stat-l { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
.tenant-pulse  { position: absolute; top: 16px; right: 16px; width: 9px; height: 9px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }

/* ── GOD EYE ── */
.eye-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; }

/* ── TOAST ── */
#toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 10000; display: flex; flex-direction: column; gap: 8px; }
.toast {
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  padding: 11px 16px; font-size: 12px; animation: toastIn 0.3s ease;
  min-width: 200px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); color: var(--text);
}
.toast.success { border-color: var(--green); color: var(--green); }
.toast.error   { border-color: var(--red); color: var(--red); }
.toast.info    { border-color: var(--accent); color: var(--accent); }
@keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; } }

/* ── GOD MODE BANNER ── */
#god-mode-banner {
  display: none; position: fixed; top: 0; left: 0; right: 0; z-index: 9000;
  background: rgba(5,7,13,0.96); backdrop-filter: blur(8px);
  padding: 8px 20px; align-items: center; gap: 10px; font-size: 11px;
  border-bottom: 1px solid rgba(0,198,255,0.15);
}

/* ── EMPTY STATE ── */
.empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
.empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
.empty-state h3 { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.empty-state p  { font-size: 12px; }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  #sidebar { display: none; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
</head>
<body>

<!-- ── NEXIA SPLASH (sempre mostra NEXIA OS) ── -->
<div id="nexia-splash">
  <div class="sp-logo">NEXIA<span style="font-size:14px;letter-spacing:6px;margin-left:10px;opacity:0.5">OS</span></div>
  <div class="sp-sub">Master Control · v7.0</div>
  <div class="sp-bar"><div class="sp-fill"></div></div>
</div>

<!-- GOD MODE BANNER -->
<div id="god-mode-banner">
  <span style="background:linear-gradient(90deg,#f5c842,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800">⚡ GOD MODE</span>
  <span style="color:rgba(255,255,255,0.3)">·</span>
  <span style="color:rgba(255,255,255,0.6)">Tenant:</span>
  <code id="god-tenant-id" style="color:#f5c842;font-size:11px">—</code>
  <button onclick="NexiaMaster.exitGodMode()" style="margin-left:auto;background:rgba(255,77,109,0.15);border:1px solid rgba(255,77,109,0.3);color:#ff4d6d;padding:3px 12px;border-radius:5px;cursor:pointer;font-size:10px;font-weight:700;font-family:var(--ff)">✕ Sair</button>
</div>

<!-- TOAST -->
<div id="toast-container"></div>

<!-- ── APP ── -->
<div id="app">
  <!-- SIDEBAR -->
  <div id="sidebar">
    <div class="sb-logo">
      <div class="sb-gem">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00c6ff" stroke-width="2.5" width="16" height="16"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div class="sb-brand">
        <div class="sb-name">NEXIA OS</div>
        <div class="sb-sub">Master Control</div>
      </div>
    </div>

    <nav>
      <div class="nav-section-label">Visão Geral</div>
      <div class="nav-item active" onclick="NexiaMaster.nav('gods-eye')" id="nav-gods-eye">
        <span class="nav-icon">👁️</span> God's Eye <span class="nav-badge badge-live">LIVE</span>
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('dashboard')" id="nav-dashboard">
        <span class="nav-icon">📊</span> Dashboard
      </div>

      <div class="nav-section-label">Clientes</div>
      <div class="nav-item" onclick="NexiaMaster.nav('tenants')" id="nav-tenants">
        <span class="nav-icon">🏢</span> Tenants <span class="nav-badge badge-pro">PRO</span>
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('users')" id="nav-users">
        <span class="nav-icon">👥</span> Usuários
      </div>

      <div class="nav-section-label">Site Builder</div>
      <div class="nav-item" onclick="NexiaMaster.nav('builder')" id="nav-builder">
        <span class="nav-icon">🏗️</span> Builder Universal <span class="nav-badge badge-hot">NEW</span>
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('landing-editor')" id="nav-landing-editor">
        <span class="nav-icon">🌐</span> Editar Lands
      </div>

      <div class="nav-section-label">Conteúdo</div>
      <div class="nav-item" onclick="NexiaMaster.nav('branding')" id="nav-branding">
        <span class="nav-icon">🎨</span> Branding Global
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('pix-manager')" id="nav-pix-manager">
        <span class="nav-icon">💳</span> PIX Manager
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('social-manager')" id="nav-social-manager">
        <span class="nav-icon">🔗</span> Social Manager
      </div>

      <div class="nav-section-label">Sistema</div>
      <div class="nav-item" onclick="NexiaMaster.nav('modules')" id="nav-modules">
        <span class="nav-icon">🧩</span> Módulos
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('analytics')" id="nav-analytics">
        <span class="nav-icon">📈</span> Analytics
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('store')" id="nav-store">
        <span class="nav-icon">🛒</span> NEXIA Store
      </div>
      <div class="nav-item" onclick="NexiaMaster.nav('settings')" id="nav-settings">
        <span class="nav-icon">⚙️</span> Sistema
      </div>
    </nav>

    <div class="sb-footer">
      <select class="lang-select" id="sidebar-lang" onchange="NexiaI18n.set(this.value)" style="width:100%;margin-bottom:8px">
        <option value="pt">🇧🇷 Português</option>
        <option value="en">🇺🇸 English</option>
        <option value="es">🇪🇸 Español</option>
      </select>
      <button class="btn btn-ghost" onclick="NexiaMaster.logout()" style="width:100%;font-size:11px" data-i18n="nav.logout">Sair do Sistema</button>
    </div>
  </div>

  <!-- MAIN -->
  <div id="main">
    <div id="topbar">
      <div class="topbar-left">
        <div class="topbar-title" id="topbar-title">God's Eye</div>
        <div class="topbar-meta" id="topbar-meta">NEXIA OS · Super Admin</div>
      </div>
      <div class="topbar-right">
        <select class="lang-select" id="topbar-lang" onchange="NexiaI18n.set(this.value)">
          <option value="pt">🇧🇷 PT</option>
          <option value="en">🇺🇸 EN</option>
          <option value="es">🇪🇸 ES</option>
        </select>
        <div class="avatar-btn" id="avatar-btn">N</div>
      </div>
    </div>

    <div id="content">

      <!-- GOD'S EYE -->
      <div class="view-section active" id="view-gods-eye">
        <div class="section-header">
          <div><div class="section-title">👁️ God's Eye — Visão Soberana</div><div class="section-sub">Todos os tenants em tempo real</div></div>
          <button class="btn btn-primary" onclick="NexiaMaster.refreshGodsEye()">🔄 Atualizar</button>
        </div>
        <div class="stats-grid" id="eye-stats">
          <div class="stat-card"><div class="stat-label">Tenants</div><div class="stat-value" id="st-tenants">—</div><div class="stat-delta">Online</div></div>
          <div class="stat-card"><div class="stat-label">Usuários</div><div class="stat-value" id="st-users">—</div><div class="stat-delta">Total</div></div>
          <div class="stat-card"><div class="stat-label">Passageiros</div><div class="stat-value" id="st-pass">—</div><div class="stat-delta">Ativos</div></div>
          <div class="stat-card"><div class="stat-label">Módulos</div><div class="stat-value" id="st-mods">—</div><div class="stat-delta">Ativos</div></div>
        </div>
        <div class="eye-grid" id="eye-grid">
          <!-- Tenant cards generated by JS -->
          <div class="empty-state" id="eye-empty"><div class="empty-icon">👁️</div><h3>Carregando tenants...</h3></div>
        </div>
      </div>

      <!-- DASHBOARD -->
      <div class="view-section" id="view-dashboard">
        <div class="section-header"><div class="section-title">📊 Dashboard Global</div></div>
        <div class="card">
          <div class="card-header"><div class="card-title">Atividade Recente</div></div>
          <div class="card-body"><div id="dash-activity"><div class="empty-state"><div class="empty-icon">📭</div><h3>Sem atividades</h3></div></div></div>
        </div>
      </div>

      <!-- TENANTS -->
      <div class="view-section" id="view-tenants">
        <div class="section-header">
          <div><div class="section-title">🏢 Tenants (Clientes)</div><div class="section-sub">Gerencie todos os clientes da plataforma</div></div>
          <button class="btn btn-primary" onclick="NexiaMaster.createTenant()">+ Novo Tenant</button>
        </div>
        <div class="tenant-grid" id="tenant-list">
          <div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🏢</div><h3>Carregando...</h3></div>
        </div>
      </div>

      <!-- USERS -->
      <div class="view-section" id="view-users">
        <div class="section-header">
          <div><div class="section-title">👥 Todos os Usuários</div></div>
          <button class="btn btn-primary" onclick="NexiaMaster.createUser()">+ Novo Usuário</button>
        </div>
        <div class="card">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Role</th><th>Tenant</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody id="users-tbody"><tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">Carregando...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- SITE BUILDER -->
      <div class="view-section" id="view-builder" style="position:relative">
        <!-- NexiaBuilderUI.inject() injetado aqui -->
      </div>

      <!-- LANDING EDITOR -->
      <div class="view-section" id="view-landing-editor">
        <div class="section-header"><div class="section-title">🌐 Editor de Landing Pages</div><div class="section-sub">Edite qualquer landing page ou app de qualquer cliente</div></div>
        <div class="card">
          <div class="card-body">
            <div class="form-row" style="margin-bottom:16px">
              <div class="form-group">
                <label>Cliente (Tenant)</label>
                <select id="le-tenant" onchange="NexiaMaster.updateLandingPages()" style="width:100%">
                  <option value="viajante-pro">Viajante Pro</option>
                  <option value="ces">CES Brasil 2027</option>
                  <option value="bezsan">Bezsan</option>
                </select>
              </div>
              <div class="form-group">
                <label>Página</label>
                <select id="le-page" style="width:100%">
                  <option value="landing">Landing Page</option>
                  <option value="passenger">App Passageiro</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" onclick="NexiaMaster.openLandingEditor()">🏗️ Abrir Site Builder para esta Página</button>
          </div>
        </div>
      </div>

      <!-- BRANDING GLOBAL -->
      <div class="view-section" id="view-branding">
        <div class="section-header"><div class="section-title">🎨 Branding Global</div><div class="section-sub">Gerencie identidade visual de todos os tenants</div></div>
        <div class="card">
          <div class="card-header"><div class="card-title">Selecionar Tenant</div></div>
          <div class="card-body">
            <select id="branding-tenant" onchange="NexiaMaster.loadTenantBranding()" style="width:100%;margin-bottom:16px">
              <option value="VP_AGENCIA_01">Viajante Pro</option>
              <option value="CES_2027_BR">CES Brasil 2027</option>
              <option value="BEZSAN_01">Bezsan</option>
            </select>
            <div id="branding-form">
              <div class="form-row">
                <div class="form-group"><label>Logo URL</label><input type="text" id="b-logo"></div>
                <div class="form-group"><label>Cor Primária</label><input type="color" id="b-color" value="#0071e3" style="height:36px;cursor:pointer"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label>Nome</label><input type="text" id="b-name"></div>
                <div class="form-group"><label>Slogan</label><input type="text" id="b-slogan"></div>
              </div>
              <button class="btn btn-primary" onclick="NexiaMaster.saveTenantBranding()">💾 Salvar Branding</button>
            </div>
          </div>
        </div>
      </div>

      <!-- PIX MANAGER -->
      <div class="view-section" id="view-pix-manager">
        <div class="section-header"><div class="section-title">💳 PIX Manager</div><div class="section-sub">Configure PIX de todos os clientes</div></div>
        <div class="card">
          <div class="card-body">
            <div class="form-group">
              <label>Tenant</label>
              <select id="pix-tenant" onchange="NexiaMaster.loadTenantPix()" style="width:100%">
                <option value="VP_AGENCIA_01">Viajante Pro</option>
                <option value="CES_2027_BR">CES Brasil 2027</option>
                <option value="BEZSAN_01">Bezsan</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Tipo da Chave</label><select id="pix-type" style="width:100%"><option>CPF</option><option>CNPJ</option><option>E-mail</option><option>Telefone</option><option>Aleatória</option></select></div>
              <div class="form-group"><label>Chave PIX</label><input type="text" id="pix-key" placeholder="Ex: empresa@email.com"></div>
            </div>
            <div class="form-group"><label>Nome do Favorecido</label><input type="text" id="pix-name"></div>
            <button class="btn btn-primary" onclick="NexiaMaster.savePix()">💾 Salvar PIX</button>
          </div>
        </div>
      </div>

      <!-- SOCIAL MANAGER -->
      <div class="view-section" id="view-social-manager">
        <div class="section-header"><div class="section-title">🔗 Social Media Manager</div></div>
        <div class="card">
          <div class="card-body">
            <div class="form-group">
              <label>Tenant</label>
              <select id="social-tenant" onchange="NexiaMaster.loadTenantSocial()" style="width:100%">
                <option value="VP_AGENCIA_01">Viajante Pro</option>
                <option value="CES_2027_BR">CES Brasil 2027</option>
                <option value="BEZSAN_01">Bezsan</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group"><label>📷 Instagram</label><input type="text" id="s-instagram" placeholder="@usuario"></div>
              <div class="form-group"><label>💬 WhatsApp</label><input type="text" id="s-whatsapp" placeholder="11999999999"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>👍 Facebook</label><input type="text" id="s-facebook"></div>
              <div class="form-group"><label>▶️ YouTube</label><input type="text" id="s-youtube"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>🎵 TikTok</label><input type="text" id="s-tiktok" placeholder="@usuario"></div>
              <div class="form-group"><label>💼 LinkedIn</label><input type="text" id="s-linkedin"></div>
            </div>
            <button class="btn btn-primary" onclick="NexiaMaster.saveSocial()">🔗 Salvar Redes Sociais</button>
          </div>
        </div>
      </div>

      <!-- MODULES -->
      <div class="view-section" id="view-modules">
        <div class="section-header"><div class="section-title">🧩 Módulos NEXIA</div></div>
        <div id="modules-grid" class="tenant-grid">
          <div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🧩</div><h3>Carregando módulos...</h3></div>
        </div>
      </div>

      <!-- ANALYTICS -->
      <div class="view-section" id="view-analytics">
        <div class="section-header"><div class="section-title">📈 Analytics Global</div></div>
        <div class="card"><div class="card-body"><p style="color:var(--muted);font-size:13px">Analytics em breve. Conecte ao Google Analytics ou Amplitude para visualizar dados.</p></div></div>
      </div>

      <!-- STORE -->
      <div class="view-section" id="view-store">
        <div class="section-header"><div class="section-title">🛒 NEXIA Store</div></div>
        <div class="card"><div class="card-body"><p style="color:var(--muted);font-size:13px">Loja de módulos NEXIA. Configure planos e módulos premium aqui.</p></div></div>
      </div>

      <!-- SETTINGS -->
      <div class="view-section" id="view-settings">
        <div class="section-header"><div class="section-title">⚙️ Configurações do Sistema</div></div>
        <div class="card">
          <div class="card-header"><div class="card-title">NEXIA OS Info</div></div>
          <div class="card-body">
            <div style="font-size:12px;line-height:2;color:var(--text)">
              <div>Versão: <strong>7.0 — Patch V13</strong></div>
              <div>Firebase Project: <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">nexia-c8710</code></div>
              <div>Auth Domain: <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">nexia-c8710.firebaseapp.com</code></div>
              <div>Tenants ativos: <span id="cfg-tenant-count">—</span></div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /content -->
  </div><!-- /main -->
</div><!-- /app -->

<script>
'use strict';

let db, auth;
try {
  db   = typeof NexiaAuth !== 'undefined' ? NexiaAuth.db()   : null;
  auth = typeof NexiaAuth !== 'undefined' ? NexiaAuth.auth() : null;
} catch(e) {}

if (!db) {
  const cfg = { apiKey:'AIzaSyC9L592zKSUjx-YglmbGpxjv2hsXm_gbBM', authDomain:'nexia-c8710.firebaseapp.com', projectId:'nexia-c8710', storageBucket:'nexia-c8710.firebasestorage.app', messagingSenderId:'623044447905', appId:'1:623044447905:web:13f70e1584fb0fcf8d2ae0' };
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  db   = firebase.firestore();
  auth = firebase.auth();
}

/* ── TOAST ── */
function toast(msg, type='info', ms=3000) {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* ── TENANTS ── */
const KNOWN_TENANTS = [
  { id:'VP_AGENCIA_01', name:'Viajante Pro', plan:'Pro', adminUrl:'../viajante-pro/vp-admin.html', builderKey:'viajante-pro' },
  { id:'CES_2027_BR',   name:'CES Brasil 2027', plan:'Enterprise', adminUrl:'../ces/ces-admin.html', builderKey:'ces' },
  { id:'BEZSAN_01',     name:'Bezsan Leilões', plan:'Pro', adminUrl:'../bezsan/bezsan-admin.html', builderKey:'bezsan' },
];

/* ── MASTER CONTROLLER ── */
const NexiaMaster = {
  _session: null,
  _lang: 'pt',

  nav(section) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const el  = document.getElementById('view-' + section);
    const nav = document.getElementById('nav-' + section);
    if (el)  el.classList.add('active');
    if (nav) nav.classList.add('active');

    const titles = {
      'gods-eye':      "👁️ God's Eye",
      'dashboard':     '📊 Dashboard',
      'tenants':       '🏢 Tenants',
      'users':         '👥 Usuários',
      'builder':       '🏗️ Site Builder',
      'landing-editor':'🌐 Editor de Lands',
      'branding':      '🎨 Branding Global',
      'pix-manager':   '💳 PIX Manager',
      'social-manager':'🔗 Social Manager',
      'modules':       '🧩 Módulos',
      'analytics':     '📈 Analytics',
      'store':         '🛒 NEXIA Store',
      'settings':      '⚙️ Sistema',
    };
    const t = document.getElementById('topbar-title');
    if (t) t.textContent = titles[section] || section;

    if (section === 'gods-eye')      this.loadGodsEye();
    if (section === 'tenants')       this.loadTenants();
    if (section === 'users')         this.loadUsers();
    if (section === 'builder')       this.renderBuilder();
    if (section === 'modules')       this.loadModules();
    if (section === 'dashboard')     this.loadDashboard();
  },

  /* ── GOD'S EYE ── */
  loadGodsEye() {
    const grid  = document.getElementById('eye-grid');
    const empty = document.getElementById('eye-empty');
    if (empty) empty.style.display = 'none';

    grid.innerHTML = KNOWN_TENANTS.map(t => `
      <div class="tenant-card" onclick="NexiaMaster.enterGodMode('${t.id}','${t.name}','${t.adminUrl}')">
        <div class="tenant-pulse"></div>
        <div class="tenant-name">${t.name}</div>
        <div class="tenant-id">${t.id}</div>
        <div class="tenant-stats">
          <div class="tenant-stat"><div class="tenant-stat-v" id="te-${t.id}-pass">—</div><div class="tenant-stat-l">Passageiros</div></div>
          <div class="tenant-stat"><div class="tenant-stat-v" id="te-${t.id}-exp">—</div><div class="tenant-stat-l">Despesas</div></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <span class="tag tag-blue">${t.plan}</span>
          <button class="btn-sm" style="margin-left:auto" onclick="event.stopPropagation();NexiaMaster.openBuilderFor('${t.builderKey}')">🏗️ Builder</button>
        </div>
      </div>
    `).join('');

    // Load counts
    KNOWN_TENANTS.forEach(t => {
      db.collection('passengers').where('tenantId','==',t.id).get()
        .then(s => { const el = document.getElementById('te-'+t.id+'-pass'); if(el) el.textContent = s.size; }).catch(()=>{});
      db.collection('expenses').where('tenantId','==',t.id).get()
        .then(s => { const el = document.getElementById('te-'+t.id+'-exp'); if(el) el.textContent = s.size; }).catch(()=>{});
    });

    // Header stats
    document.getElementById('st-tenants').textContent = KNOWN_TENANTS.length;
    db.collection('users').get().then(s => { document.getElementById('st-users').textContent = s.size; }).catch(()=>{});
    db.collection('passengers').get().then(s => { document.getElementById('st-pass').textContent = s.size; }).catch(()=>{});
    document.getElementById('st-mods').textContent = '12';
  },

  refreshGodsEye() { this.loadGodsEye(); toast('✅ Atualizado!', 'success', 1500); },

  enterGodMode(tenantId, tenantName, adminUrl) {
    try { sessionStorage.setItem('nexiaGodMode', '1'); sessionStorage.setItem('nexiaGodTenant', tenantId); } catch(e) {}
    const banner = document.getElementById('god-mode-banner');
    if (banner) { banner.style.display = 'flex'; document.getElementById('god-tenant-id').textContent = tenantId; }
    toast(`⚡ God Mode: ${tenantName}`, 'info');
  },

  exitGodMode() {
    try { sessionStorage.removeItem('nexiaGodMode'); sessionStorage.removeItem('nexiaGodTenant'); } catch(e) {}
    const banner = document.getElementById('god-mode-banner');
    if (banner) banner.style.display = 'none';
    toast('God Mode encerrado.', 'info');
  },

  /* ── TENANTS ── */
  loadTenants() {
    const container = document.getElementById('tenant-list');
    container.innerHTML = KNOWN_TENANTS.map(t => `
      <div class="tenant-card">
        <div class="tenant-pulse"></div>
        <div class="tenant-name">${t.name}</div>
        <div class="tenant-id">${t.id}</div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <span class="tag tag-blue">${t.plan}</span>
          <button class="btn-sm" onclick="NexiaMaster.enterGodMode('${t.id}','${t.name}','${t.adminUrl}')">⚡ God Mode</button>
          <button class="btn-sm" onclick="NexiaMaster.openBuilderFor('${t.builderKey}')">🏗️ Builder</button>
        </div>
      </div>
    `).join('');
    document.getElementById('cfg-tenant-count').textContent = KNOWN_TENANTS.length;
  },

  createTenant() {
    const name  = prompt('Nome do cliente:');
    const id    = prompt('Tenant ID (ex: CLIENTE_01):');
    const plan  = prompt('Plano (Basic/Pro/Enterprise):');
    if (!name || !id) return;
    db.collection('tenants').doc(id).set({ name, tenantId: id, plan: plan||'Basic', status: 'active', createdAt: new Date().toISOString() })
      .then(() => { toast('✅ Tenant criado!', 'success'); this.loadTenants(); })
      .catch(e => toast('Erro: ' + e.message, 'error'));
  },

  /* ── USERS ── */
  loadUsers() {
    db.collection('users').limit(100).get()
      .then(snap => {
        const tbody = document.getElementById('users-tbody');
        if (snap.empty) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">Sem usuários</td></tr>'; return; }
        tbody.innerHTML = snap.docs.map(d => {
          const u = d.data();
          return `<tr>
            <td style="font-weight:600">${u.name||'—'}</td>
            <td>${u.email||'—'}</td>
            <td><span class="tag tag-blue">${u.role||'USER'}</span></td>
            <td style="font-size:10px;color:var(--muted)">${u.tenantId||'—'}</td>
            <td><span class="tag ${u.status==='active'||!u.status?'tag-green':'tag-gray'}">${u.status||'active'}</span></td>
            <td><button class="btn-sm" onclick="NexiaMaster.deleteUser('${d.id}')">🗑</button></td>
          </tr>`;
        }).join('');
      }).catch(e => toast('Erro: '+e.message,'error'));
  },

  createUser() {
    const name   = prompt('Nome:');
    const email  = prompt('E-mail:');
    const role   = prompt('Role (SUPER_ADMIN / CES_ADMIN / CLIENT_ADMIN / USER):') || 'USER';
    const tenant = prompt('Tenant ID (ou * para SUPER_ADMIN):') || null;
    if (!name || !email) return;
    db.collection('users').add({ name, email, role, tenantId: tenant||null, status: 'active', createdAt: new Date().toISOString() })
      .then(() => { toast('✅ Usuário criado!', 'success'); this.loadUsers(); })
      .catch(e => toast('Erro: '+e.message,'error'));
  },

  deleteUser(id) {
    if (!confirm('Excluir usuário?')) return;
    db.collection('users').doc(id).delete()
      .then(() => { toast('🗑️ Excluído.', 'info'); this.loadUsers(); })
      .catch(e => toast('Erro: '+e.message,'error'));
  },

  /* ── SITE BUILDER ── */
  renderBuilder(tenantKey, lang) {
    const el = document.getElementById('view-builder');
    if (!el) return;
    el.innerHTML = '';
    el.style.cssText = 'position:fixed;inset:0;z-index:8999;background:#FAF8F5;';
    const key = tenantKey || document.getElementById('le-tenant')?.value || 'viajante-pro';
    const l   = lang || this._lang || 'pt';
    if (typeof NexiaBuilderUI !== 'undefined') {
      NexiaBuilderUI.inject(el, key, l, true, db);
    } else {
      el.innerHTML = '<div style="padding:60px;text-align:center;color:#0071e3;font-size:1.1rem;font-weight:700">⏳ Site Builder carregando...<br><small style="opacity:0.6">Verifique nexia-builder-ui.js</small></div>';
    }
  },

  openBuilderFor(tenantKey) {
    this.nav('builder');
    setTimeout(() => this.renderBuilder(tenantKey), 100);
  },

  openLandingEditor() {
    const tenant = document.getElementById('le-tenant').value;
    this.nav('builder');
    setTimeout(() => this.renderBuilder(tenant), 100);
  },

  updateLandingPages() {
    const t = document.getElementById('le-tenant').value;
    const sel = document.getElementById('le-page');
    if (!sel) return;
    sel.innerHTML = t === 'ces' ?
      '<option value="landing">Landing CES</option><option value="executivo">App Executivo</option>' :
      t === 'bezsan' ?
      '<option value="landing">Landing Bezsan</option><option value="app">App Bezsan</option>' :
      '<option value="landing">Landing Page</option><option value="passenger">App Passageiro</option>';
  },

  /* ── BRANDING ── */
  loadTenantBranding() {
    const tid = document.getElementById('branding-tenant').value;
    db.collection('tenants').doc(tid).get()
      .then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.brand_logo)  document.getElementById('b-logo').value  = d.brand_logo;
        if (d.brand_color) document.getElementById('b-color').value = d.brand_color;
        if (d.brand_name)  document.getElementById('b-name').value  = d.brand_name;
        if (d.brand_slogan)document.getElementById('b-slogan').value= d.brand_slogan;
      }).catch(()=>{});
  },

  saveTenantBranding() {
    const tid = document.getElementById('branding-tenant').value;
    const data = {
      brand_logo:   document.getElementById('b-logo').value.trim(),
      brand_color:  document.getElementById('b-color').value,
      brand_name:   document.getElementById('b-name').value.trim(),
      brand_slogan: document.getElementById('b-slogan').value.trim(),
      updatedAt: new Date().toISOString()
    };
    db.collection('tenants').doc(tid).set(data, { merge:true })
      .then(() => toast('✅ Branding salvo!','success'))
      .catch(e => toast('Erro: '+e.message,'error'));
  },

  /* ── PIX ── */
  loadTenantPix() {
    const tid = document.getElementById('pix-tenant').value;
    db.collection('tenants').doc(tid).get()
      .then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        if (d.pix_key)  document.getElementById('pix-key').value  = d.pix_key;
        if (d.pix_name) document.getElementById('pix-name').value = d.pix_name;
        if (d.pix_type) document.getElementById('pix-type').value = d.pix_type;
      }).catch(()=>{});
  },

  savePix() {
    const tid = document.getElementById('pix-tenant').value;
    db.collection('tenants').doc(tid).set({
      pix_key:  document.getElementById('pix-key').value.trim(),
      pix_name: document.getElementById('pix-name').value.trim(),
      pix_type: document.getElementById('pix-type').value,
      updatedAt: new Date().toISOString()
    }, { merge:true })
      .then(() => toast('✅ PIX salvo!','success'))
      .catch(e => toast('Erro: '+e.message,'error'));
  },

  /* ── SOCIAL ── */
  loadTenantSocial() {
    const tid = document.getElementById('social-tenant').value;
    db.collection('tenants').doc(tid).get()
      .then(doc => {
        if (!doc.exists) return;
        const d = doc.data();
        ['instagram','whatsapp','facebook','youtube','tiktok','linkedin'].forEach(s => {
          const el = document.getElementById('s-'+s);
          if (el && d['social_'+s]) el.value = d['social_'+s];
        });
      }).catch(()=>{});
  },

  saveSocial() {
    const tid  = document.getElementById('social-tenant').value;
    const data = {};
    ['instagram','whatsapp','facebook','youtube','tiktok','linkedin'].forEach(s => {
      const el = document.getElementById('s-'+s);
      if (el) data['social_'+s] = el.value.trim();
    });
    data.updatedAt = new Date().toISOString();
    db.collection('tenants').doc(tid).set(data, { merge:true })
      .then(() => toast('✅ Redes sociais salvas!','success'))
      .catch(e => toast('Erro: '+e.message,'error'));
  },

  /* ── MODULES ── */
  loadModules() {
    const MODS = [
      { id:'crm',        name:'CRM',              icon:'🎯', plan:'Pro',        active:true  },
      { id:'pabx',       name:'PABX VoIP',        icon:'📞', plan:'Enterprise', active:true  },
      { id:'builder',    name:'Site Builder',     icon:'🏗️', plan:'Pro',        active:true  },
      { id:'analytics',  name:'Analytics',        icon:'📈', plan:'Pro',        active:true  },
      { id:'esign',      name:'Assinatura Digital',icon:'✍️', plan:'Pro',        active:false },
      { id:'payments',   name:'Pagamentos',       icon:'💳', plan:'Basic',      active:true  },
      { id:'comms',      name:'Comunicações',     icon:'💬', plan:'Pro',        active:true  },
      { id:'ai',         name:'IA Nexia',         icon:'🤖', plan:'Enterprise', active:false },
      { id:'loyalty',    name:'Fidelidade',       icon:'⭐', plan:'Pro',        active:false },
      { id:'qrcode',     name:'QR Code Manager',  icon:'📱', plan:'Basic',      active:true  },
      { id:'broadcast',  name:'Broadcast',        icon:'📡', plan:'Pro',        active:true  },
      { id:'schedule',   name:'Agendamentos',     icon:'📅', plan:'Pro',        active:true  },
    ];
    const grid = document.getElementById('modules-grid');
    grid.innerHTML = MODS.map(m => `
      <div class="card" style="margin-bottom:0">
        <div class="card-body" style="padding:14px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:1.8rem">${m.icon}</span>
            <div>
              <div style="font-weight:700;font-size:13px">${m.name}</div>
              <span class="tag tag-${m.plan==='Basic'?'gray':m.plan==='Pro'?'blue':'gold'}" style="font-size:9px">${m.plan}</span>
            </div>
            <div style="margin-left:auto">
              <span class="tag ${m.active?'tag-green':'tag-gray'}">${m.active?'Ativo':'Inativo'}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* ── DASHBOARD ── */
  loadDashboard() {
    const el = document.getElementById('dash-activity');
    el.innerHTML = `
      <table>
        <thead><tr><th>Evento</th><th>Tenant</th><th>Quando</th></tr></thead>
        <tbody>
          <tr><td>Novo passageiro cadastrado</td><td><span class="tag tag-blue">VP</span></td><td style="color:var(--muted)">2min atrás</td></tr>
          <tr><td>Branding atualizado</td><td><span class="tag tag-gold">CES</span></td><td style="color:var(--muted)">8min atrás</td></tr>
          <tr><td>Site Builder publicado</td><td><span class="tag tag-green">VP</span></td><td style="color:var(--muted)">15min atrás</td></tr>
          <tr><td>PIX configurado</td><td><span class="tag tag-blue">CES</span></td><td style="color:var(--muted)">1h atrás</td></tr>
        </tbody>
      </table>`;
  },

  /* ── LOGOUT ── */
  logout() {
    if (typeof NexiaAuth !== 'undefined') {
      NexiaAuth.logout();
    } else if (auth) {
      auth.signOut().then(() => { window.location.href = '../login.html'; });
    }
  }
};

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', function() {
  // Splash desaparece após 2.5s
  setTimeout(function() {
    const sp = document.getElementById('nexia-splash');
    if (sp) sp.style.display = 'none';
  }, 2700);

  // i18n
  if (typeof NexiaI18n !== 'undefined') {
    NexiaI18n.init();
    NexiaI18n.onChange(function(lang) {
      NexiaMaster._lang = lang;
      ['topbar-lang','sidebar-lang'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = lang;
      });
    });
  }

  // Auth gate
  if (typeof NexiaAuth !== 'undefined') {
    NexiaAuth.onReady(function(session) {
      if (!session) { window.location.href = '../login.html'; return; }
      if (session.role !== 'SUPER_ADMIN' && session.role !== 'NEXIA_ADMIN') {
        window.location.href = '../login.html?msg=' + encodeURIComponent('Acesso restrito ao Master.');
        return;
      }
      NexiaMaster._session = session;
      const app = document.getElementById('app');
      if (app) app.style.display = 'flex';
      const avatar = document.getElementById('avatar-btn');
      if (avatar) avatar.textContent = (session.name||session.email||'N')[0].toUpperCase();
      NexiaMaster.nav('gods-eye');
    });
  } else {
    const app = document.getElementById('app');
    if (app) app.style.display = 'flex';
    NexiaMaster.nav('gods-eye');
  }
});
</script>
</body>
</html>
