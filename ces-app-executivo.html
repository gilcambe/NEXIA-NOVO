<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bezsan — Painel de Leilões IA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<!-- GrapesJS -->

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
<script src="../core/config.js"></script>
<script src="../core/auth.js"></script>
<script src="../core/nexia-comms.js"></script>
<script src="../core/nexia-i18n.js"></script>
<script src="../core/nexia-seed.js"></script>
<script src="../core/nexia-next-core.js"></script>

<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0A0A0A; --surface:#111110; --surface2:#161614; --surface3:#1C1C1A;
  --border:rgba(255,255,255,0.07); --border2:rgba(212,175,55,0.2);
  --text:#F2F0E8; --muted:#9A9890; --muted2:#525248;
  --gold:#D4AF37; --gold2:#F0C84A; --gold3:rgba(212,175,55,0.12);
  --green:#00E87A; --red:#FF3D71; --amber:#FFB020; --cyan:#00E5FF;
  --ff:'Sora',sans-serif; --ffm:'JetBrains Mono',monospace;
  --sh:0 4px 24px rgba(0,0,0,.5);
}
:root[data-theme="light"]{
  --bg:#F5F5F0; --surface:#FFFFFF; --surface2:#EFEFED; --surface3:#E5E5E0;
  --border:rgba(0,0,0,0.08); --border2:rgba(212,175,55,0.3);
  --text:#1A1A14; --muted:#6A6A60; --muted2:#A0A090;
}
html,body{transition:background .3s,color .3s}
body{font-family:var(--ff);background:var(--bg);color:var(--text);min-height:100vh;overflow:hidden;-webkit-font-smoothing:antialiased;font-size:13px}
button{font-family:var(--ff);cursor:pointer;border:none;background:none;color:inherit}
input,select,textarea{font-family:var(--ff);background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:7px;padding:8px 11px;font-size:12px;outline:none;transition:border-color .2s;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--gold)}
select option{background:var(--bg)}

/* ── LAYOUT ── */
#shell{display:flex;height:100vh;overflow:hidden}

/* ── SIDEBAR ── */
#sidebar{
  width:220px;flex-shrink:0;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;
}
.sb-brand{
  display:flex;align-items:center;gap:10px;
  padding:16px 18px;border-bottom:1px solid var(--border);flex-shrink:0;
}
.sb-logo-mark{width:30px;height:30px;border-radius:7px;background:linear-gradient(135deg,#D4AF37,#F0C84A);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#000}
.sb-brand-txt{font-size:13px;font-weight:700;color:var(--text)}
.sb-brand-sub{font-size:9px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}
.nav-list{flex:1;overflow-y:auto;padding:10px 0}
.nav-item{
  display:flex;align-items:center;gap:10px;
  padding:9px 18px;cursor:pointer;font-size:11px;font-weight:500;
  color:var(--muted);transition:all .15s;border-left:2px solid transparent;
}
.nav-item:hover{color:var(--text);background:rgba(212,175,55,.04)}
.nav-item.active{color:var(--gold);background:rgba(212,175,55,.06);border-left-color:var(--gold)}
.nav-icon{font-size:14px;flex-shrink:0;width:18px;text-align:center}
.sb-footer{padding:12px 14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:6px;flex-shrink:0}
.sb-btn{padding:7px 12px;border-radius:7px;font-size:10px;font-weight:600;letter-spacing:.04em;transition:all .18s;text-align:center}
.sb-btn-gold{background:var(--gold3);border:1px solid var(--border2);color:var(--gold)}
.sb-btn-gold:hover{background:var(--gold);color:#000}
.sb-btn-ghost{background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--muted)}
.sb-btn-ghost:hover{color:var(--text)}

/* ── CONTENT ── */
#content{flex:1;overflow-y:auto;display:flex;flex-direction:column}
.page-header{padding:20px 28px 16px;border-bottom:1px solid var(--border);flex-shrink:0}
.page-eyebrow{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
.page-title{font-size:18px;font-weight:700;color:var(--text)}
.page-body{padding:24px 28px;flex:1}

/* ── CARDS/KPIs ── */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
@media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;position:relative;overflow:hidden}
.kpi-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--kpi-color,var(--gold))}
.kpi-val{font-size:24px;font-weight:700;color:var(--text);font-family:var(--ffm);line-height:1.1;margin-bottom:4px}
.kpi-lbl{font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.kpi-sub{font-size:10px;color:var(--muted2);margin-top:3px}

/* ── TABLE ── */
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.table-hd{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.table-title{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
table{width:100%;border-collapse:collapse}
th{padding:10px 16px;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);text-align:left;border-bottom:1px solid var(--border);background:var(--surface2)}
td{padding:11px 16px;font-size:12px;border-bottom:1px solid var(--border);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(212,175,55,.03)}

/* ── BADGES ── */
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.badge-green{background:rgba(0,232,122,.12);color:var(--green)}
.badge-amber{background:rgba(255,176,32,.12);color:var(--amber)}
.badge-red{background:rgba(255,61,113,.12);color:var(--red)}
.badge-gold{background:rgba(212,175,55,.12);color:var(--gold)}

/* ── ACTION BTNS ── */
.btn-sm{padding:5px 12px;border-radius:6px;font-size:10px;font-weight:600;transition:all .15s}
.btn-gold{background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);color:var(--gold)}
.btn-gold:hover{background:var(--gold);color:#000}
.btn-danger{background:rgba(255,61,113,.1);border:1px solid rgba(255,61,113,.3);color:var(--red)}
.btn-danger:hover{background:var(--red);color:#fff}

/* ── FORM MODAL ── */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:999;align-items:center;justify-content:center;padding:20px}
.modal-bg.open{display:flex}
.modal-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;max-width:500px;width:100%;box-shadow:var(--sh)}
.modal-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:18px}
.form-group{margin-bottom:14px}
.form-label{display:block;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}

/* ── BUILDER ── */
#view-builder{display:none;flex-direction:column;height:100%;overflow:hidden}
#view-builder.active-view{display:flex;flex:1}
#bzs-gjs-wrap{display:flex;flex:1;min-height:0;overflow:hidden}
#bzs-gjs-blocks{width:180px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);overflow-y:auto}
#bzs-gjs{flex:1;width:100%;height:100%}

/* ── TOAST ── */
#toast-wrap{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.toast-item{padding:10px 18px;border-radius:99px;font-size:12px;font-weight:600;backdrop-filter:blur(12px);animation:toastIn .25s ease;white-space:nowrap}
.toast-success{background:rgba(0,232,122,.15);border:1px solid rgba(0,232,122,.4);color:var(--green)}
.toast-error{background:rgba(255,61,113,.15);border:1px solid rgba(255,61,113,.4);color:var(--red)}
.toast-info{background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.3);color:var(--gold)}
@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
</style>
<style id="nexia-light-override">
/* NEXIA V12 — Light Mode Premium Default */
:root {
  --bg:#FAF8F5 !important; --bg2:#FFFFFF !important; --bg3:#F0EDE8 !important;
  --panel:#FFFFFF !important; --surface:#FFFFFF !important; --surface2:#F5F2ED !important;
  --border:#E5E0D8 !important; --brd:#E5E0D8 !important; --brd2:#D0C8BC !important;
  --text:#1A1714 !important; --txt:#1A1714 !important;
  --text2:#4A4540 !important; --txt2:#4A4540 !important;
  --text3:#8A8078 !important; --txt3:#8A8078 !important;
  --muted:#8A8078 !important; --muted2:#A09890 !important;
  --ink:#1A1714 !important; --ink2:#3A3530 !important; --ink3:#6B6460 !important;
  --white:#1A1714 !important;
}
body { background:#FAF8F5 !important; color:#1A1714 !important; }
</style>
</head>
<body>

<div id="shell" style="display:none">
  <!-- ── SIDEBAR ── -->
  <div id="sidebar">
    <div class="sb-brand">
      <div class="sb-logo-mark">Bz</div>
      <div><div class="sb-brand-txt">Bezsan</div><div class="sb-brand-sub">Leilões IA</div></div>
    </div>
    <ul class="nav-list">
      <li class="nav-item active" onclick="BZS.nav('dashboard',this)"><span class="nav-icon">📊</span>Dashboard</li>
      <li class="nav-item" onclick="BZS.nav('leiloes',this)"><span class="nav-icon">🏛️</span>Leilões Ativos</li>
      <li class="nav-item" onclick="BZS.nav('lances',this)"><span class="nav-icon">⚡</span>Lances em Tempo Real</li>
      <li class="nav-item" onclick="BZS.nav('investidores',this)"><span class="nav-icon">👥</span>Investidores</li>
      <li class="nav-item" onclick="BZS.nav('ativos',this)"><span class="nav-icon">💎</span>Ativos Cadastrados</li>
      <li class="nav-item" onclick="BZS.nav('financeiro',this)"><span class="nav-icon">💳</span>Financeiro</li>
      <li class="nav-item" onclick="BZS.nav('builder',this)"><span class="nav-icon">🌐</span>Site Builder</li>
      <li class="nav-item" onclick="BZS.nav('config',this)"><span class="nav-icon">⚙️</span>Configurações</li>
    </ul>
    <div class="sb-footer">
      <button class="sb-btn sb-btn-gold" onclick="BZS.openNewLeilao()" data-i18n="bzs.newAuction">+ Novo Leilão</button>
      <div id="bzs-lang-switcher" style="display:flex;gap:4px;justify-content:center;margin:4px 0"></div>
      <button class="sb-btn sb-btn-ghost" onclick="NexiaI18n.toggleTheme()">🌓 Tema</button>
      <button class="sb-btn sb-btn-ghost" onclick="NexiaAuth.logout()" data-i18n="nav.logout">Sair</button>
    </div>
  </div>

  <!-- ── CONTENT ── -->
  <div id="content">

    <!-- DASHBOARD -->
    <div id="view-dashboard">
      <div class="page-header">
        <div class="page-eyebrow">Bezsan · Painel Principal</div>
        <div class="page-title">Dashboard de Leilões</div>
      </div>
      <div class="page-body">
        <div class="kpi-grid">
          <div class="kpi-card" style="--kpi-color:var(--gold)">
            <div class="kpi-val" id="kpi-leiloes">—</div>
            <div class="kpi-lbl">Leilões Ativos</div>
            <div class="kpi-sub" id="kpi-leiloes-sub">Carregando…</div>
          </div>
          <div class="kpi-card" style="--kpi-color:var(--green)">
            <div class="kpi-val" id="kpi-lances">—</div>
            <div class="kpi-lbl">Lances Hoje</div>
            <div class="kpi-sub" id="kpi-lances-sub">Total do dia</div>
          </div>
          <div class="kpi-card" style="--kpi-color:var(--cyan)">
            <div class="kpi-val" id="kpi-volume">—</div>
            <div class="kpi-lbl">Volume (R$)</div>
            <div class="kpi-sub" id="kpi-volume-sub">Total acumulado</div>
          </div>
          <div class="kpi-card" style="--kpi-color:var(--amber)">
            <div class="kpi-val" id="kpi-investidores">—</div>
            <div class="kpi-lbl">Investidores VIP</div>
            <div class="kpi-sub" id="kpi-invest-sub">Cofre habilitado</div>
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-hd"><span class="table-title">🏛️ Leilões Recentes</span><button class="btn-sm btn-gold" onclick="BZS.openNewLeilao()">+ Novo Leilão</button></div>
          <table><thead><tr><th>Ativo</th><th>Categoria</th><th>Lance Mín.</th><th>Lance Atual</th><th>Encerra</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody id="leiloes-tbody"><tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">⏳ Carregando…</td></tr></tbody></table>
        </div>
      </div>
    </div>

    <!-- LEILÕES ATIVOS -->
    <div id="view-leiloes" style="display:none">
      <div class="page-header">
        <div class="page-eyebrow">Gestão</div>
        <div class="page-title">🏛️ Leilões Ativos</div>
      </div>
      <div class="page-body" id="leiloes-body">
        <div style="text-align:center;padding:40px;color:var(--muted)">⏳ Carregando leilões…</div>
      </div>
    </div>

    <!-- LANCES REAL-TIME -->
    <div id="view-lances" style="display:none">
      <div class="page-header">
        <div class="page-eyebrow">Tempo Real</div>
        <div class="page-title">⚡ Lances em Tempo Real</div>
      </div>
      <div class="page-body">
        <div id="lances-feed" style="display:flex;flex-direction:column;gap:8px;max-height:calc(100vh - 180px);overflow-y:auto">
          <div style="text-align:center;padding:40px;color:var(--muted)">⏳ Aguardando lances…</div>
        </div>
      </div>
    </div>

    <!-- INVESTIDORES -->
    <div id="view-investidores" style="display:none">
      <div class="page-header">
        <div class="page-eyebrow">Cadastro</div>
        <div class="page-title">👥 Investidores</div>
      </div>
      <div class="page-body">
        <div class="table-wrap">
          <div class="table-hd"><span class="table-title">Investidores Cadastrados</span></div>
          <table><thead><tr><th>Nome</th><th>E-mail</th><th>Saldo</th><th>Status VIP</th><th>Lances</th><th>Ações</th></tr></thead>
          <tbody id="invest-tbody"><tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">⏳ Carregando…</td></tr></tbody></table>
        </div>
      </div>
    </div>

    <!-- ATIVOS -->
    <div id="view-ativos" style="display:none">
      <div class="page-header"><div class="page-eyebrow">Catálogo</div><div class="page-title">💎 Ativos Cadastrados</div></div>
      <div class="page-body">
        <div class="table-wrap">
          <div class="table-hd"><span class="table-title">Ativos</span><button class="btn-sm btn-gold" onclick="BZS.openNewAtivo()">+ Novo Ativo</button></div>
          <table><thead><tr><th>Nome</th><th>Categoria</th><th>Avaliação</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody id="ativos-tbody"><tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">⏳ Carregando…</td></tr></tbody></table>
        </div>
      </div>
    </div>

    <!-- FINANCEIRO -->
    <div id="view-financeiro" style="display:none">
      <div class="page-header"><div class="page-eyebrow">Financeiro</div><div class="page-title">💳 Gestão Financeira</div></div>
      <div class="page-body">
        <div class="kpi-grid">
          <div class="kpi-card" style="--kpi-color:var(--green)"><div class="kpi-val" id="fin-receita">R$ 0</div><div class="kpi-lbl">Receita Total</div></div>
          <div class="kpi-card" style="--kpi-color:var(--gold)"><div class="kpi-val" id="fin-comissao">R$ 0</div><div class="kpi-lbl">Comissões</div></div>
          <div class="kpi-card" style="--kpi-color:var(--amber)"><div class="kpi-val" id="fin-pendente">R$ 0</div><div class="kpi-lbl">Pendente</div></div>
          <div class="kpi-card" style="--kpi-color:var(--cyan)"><div class="kpi-val" id="fin-leiloes-enc">0</div><div class="kpi-lbl">Leilões Encerrados</div></div>
        </div>
        <div class="table-wrap">
          <div class="table-hd"><span class="table-title">Transações</span></div>
          <table><thead><tr><th>Data</th><th>Leilão</th><th>Vencedor</th><th>Valor</th><th>Comissão</th><th>Status</th></tr></thead>
          <tbody id="transacoes-tbody"><tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">⏳ Carregando…</td></tr></tbody></table>
        </div>
      </div>
    </div>

    <!-- BUILDER -->
    <div id="view-builder">
      <div id="nxb-bezsan-container" style="width:100%;height:100%">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:14px">Clique em Site Builder no menu para abrir o editor.</div>
      </div>
    </div>

    <!-- CONFIG -->
    <div id="view-config" style="display:none">
      <div class="page-header"><div class="page-eyebrow">Sistema</div><div class="page-title">⚙️ Configurações</div></div>
      <div class="page-body" style="max-width:500px">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:14px">Identidade Visual</div>
          <div class="form-group"><label class="form-label">Nome da Plataforma</label><input id="cfg-name" type="text" placeholder="Bezsan"></div>
          <div class="form-group"><label class="form-label">Cor Principal</label><input id="cfg-color" type="color" value="#D4AF37" style="height:40px"></div>
          <button onclick="BZS.saveConfig()" class="btn-sm btn-gold" style="width:100%;padding:10px;margin-top:6px">💾 Salvar Config</button>
        </div>
      </div>
    </div>

      <!-- ══ VIEW: TOUR 3D VIRTUAL ══ -->
      <div id="view-tour3d" style="display:none">
        <div class="page-header">
          <div class="page-eyebrow">Experiência Imersiva</div>
          <div class="page-title">🥽 Tour 3D Virtual — Imóveis Premium</div>
        </div>
        <div class="page-body">
          <div style="margin-bottom:20px;color:var(--muted);font-size:13px">Cole o link de um tour virtual (Matterport, 360º, YouTube, ou qualquer iframe) para que investidores naveguem pelo imóvel diretamente na plataforma.</div>

          <!-- Gestão de Tours -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px">
            <div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Adicionar Novo Tour</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div>
                <label style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:5px">Nome do Imóvel</label>
                <input id="tour3d-name" type="text" placeholder="Ex: Cobertura Jardins SP" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-size:12.5px;outline:none;box-sizing:border-box">
              </div>
              <div>
                <label style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:5px">Valor do Lance Mínimo</label>
                <input id="tour3d-value" type="text" placeholder="Ex: R$ 2.800.000" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-size:12.5px;outline:none;box-sizing:border-box">
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;display:block;margin-bottom:5px">URL do Tour Virtual (Matterport, YouTube 360°, iframe, etc.)</label>
              <input id="tour3d-url" type="url" placeholder="https://my.matterport.com/show/?m=..." style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-size:12.5px;outline:none;box-sizing:border-box">
            </div>
            <div style="display:flex;gap:10px">
              <button onclick="TOUR3D_BZS.add()" style="background:var(--gold3);border:1px solid var(--gold);color:var(--gold);border-radius:8px;padding:9px 20px;font-size:11px;font-weight:700;cursor:pointer;font-family:var(--ff)">+ Adicionar Tour</button>
              <button onclick="TOUR3D_BZS.preview()" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:9px 20px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--ff)">👁 Prévia</button>
            </div>
            <div id="tour3d-feedback" style="margin-top:10px;font-size:11px;min-height:16px"></div>
          </div>

          <!-- Lista de Tours Salvos -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:12px;font-weight:700;color:var(--text)">Tours Cadastrados</span>
              <button onclick="TOUR3D_BZS.loadList()" style="background:none;border:none;color:var(--gold);font-size:11px;cursor:pointer;font-weight:600">↺ Atualizar</button>
            </div>
            <div id="tour3d-list" style="min-height:80px;padding:8px">
              <div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">Carregando tours...</div>
            </div>
          </div>

          <!-- Visualizador iframe -->
          <div id="tour3d-viewer-box" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">
            <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <span id="tour3d-viewer-title" style="font-size:12px;font-weight:700;color:var(--gold)">Tour Virtual</span>
              <button onclick="document.getElementById('tour3d-viewer-box').style.display='none'" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer">✕</button>
            </div>
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">
              <iframe id="tour3d-iframe" src="" allowfullscreen allow="xr-spatial-tracking;gyroscope;accelerometer" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;background:#000"></iframe>
            </div>
          </div>
        </div>
      </div>

  </div><!-- /content -->
</div><!-- /shell -->

<!-- MODAL NOVO LEILÃO -->
<div class="modal-bg" id="modal-leilao">
  <div class="modal-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div class="modal-title">🏛️ Novo Leilão</div>
      <button onclick="document.getElementById('modal-leilao').classList.remove('open')" style="font-size:18px;color:var(--muted)">✕</button>
    </div>
    <div class="form-group"><label class="form-label">Nome do Ativo *</label><input id="nl-nome" type="text" placeholder="Ex: Imóvel Comercial SP"></div>
    <div class="form-group"><label class="form-label">Categoria</label><select id="nl-cat"><option value="imovel">Imóvel</option><option value="arte">Arte & Colecionáveis</option><option value="veiculo">Veículo</option><option value="empresa">Empresa / Quota</option><option value="crypto">Crypto / Digital</option><option value="outro">Outro</option></select></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label class="form-label">Lance Mínimo (R$)</label><input id="nl-min" type="number" placeholder="50000"></div>
      <div class="form-group"><label class="form-label">Avaliação (R$)</label><input id="nl-aval" type="number" placeholder="80000"></div>
    </div>
    <div class="form-group"><label class="form-label">Data de Encerramento</label><input id="nl-end" type="datetime-local"></div>
    <div class="form-group"><label class="form-label">Descrição</label><textarea id="nl-desc" rows="3" placeholder="Descreva o ativo…"></textarea></div>
    <div id="nl-feedback" style="display:none;padding:8px 12px;border-radius:7px;font-size:11px;margin-bottom:10px"></div>
    <div style="display:flex;gap:10px">
      <button onclick="document.getElementById('modal-leilao').classList.remove('open')" style="flex:1;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:12px;font-weight:600">Cancelar</button>
      <button id="nl-btn" onclick="BZS.createLeilao()" style="flex:2;padding:10px;background:var(--gold3);border:1px solid var(--border2);border-radius:8px;color:var(--gold);font-size:12px;font-weight:700">🏛️ Criar Leilão</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toast-wrap"></div>

<script>
'use strict';

const TENANT_ID = 'BEZSAN_01';

// ── Firebase ─────────────────────────────────────────────────────
const FB_CFG = {
  apiKey:'AIzaSyC9L592zKSUjx-YglmbGpxjv2hsXm_gbBM',
  authDomain:'nexia-c8710.firebaseapp.com',
  projectId:'nexia-c8710',
  storageBucket:'nexia-c8710.firebasestorage.app',
  messagingSenderId:'623044447905',
  appId:'1:623044447905:web:13f70e1584fb0fcf8d2ae0'
};
if(!firebase.apps.length) firebase.initializeApp(FB_CFG);
const db  = firebase.firestore();
const FS  = firebase.firestore.FieldValue;

function tc(col){ return db.collection('tenants').doc(TENANT_ID).collection(col); }

function toast(msg, type='info', dur=3000){
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(), dur);
}

async function seedIfEmpty(col, seeds){
  const snap = await tc(col).limit(1).get();
  if(!snap.empty) return;
  const batch = db.batch();
  seeds.forEach(s => batch.set(tc(col).doc(), {...s, createdAt:FS.serverTimestamp()}));
  await batch.commit();
}

// ── BEZSAN MAIN ──────────────────────────────────────────────────
const BZS = {
  _currentView: 'dashboard',
  _views: ['dashboard','leiloes','lances','investidores','ativos','financeiro','builder','config'],

  nav(id, navEl){
    this._views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if(el) el.style.display = 'none';
    });
    const target = document.getElementById(`view-${id}`);
    if(target){
      if(id === 'builder') { target.style.display='flex'; target.classList.add('active-view'); target.style.cssText='position:fixed;inset:0;z-index:8999;display:flex;'; const isSuper=(window._nexiaSession&&window._nexiaSession.role==='SUPER_ADMIN'); NexiaBuilderUI.inject('nxb-bezsan-container','bezsan',BZS._lang||'pt',isSuper,db); }
      else { target.style.display='block'; }
    }
    document.querySelectorAll('.nav-item').forEach(ni => ni.classList.remove('active'));
    if(navEl) navEl.classList.add('active');
    this._currentView = id;

    // Load data for specific views
    if(id==='lances')       this.watchLances();
    if(id==='investidores') this.loadInvestidores();
    if(id==='ativos')       this.loadAtivos();
    if(id==='financeiro')   this.loadFinanceiro();
  },

  // ── Dashboard KPIs from Firestore ─────────────────────────────
  async loadDashboard(){
    tc('leiloes').where('status','==','active').onSnapshot(snap=>{
      const k=document.getElementById('kpi-leiloes');
      const ks=document.getElementById('kpi-leiloes-sub');
      if(k) k.textContent=snap.size;
      if(ks) ks.textContent=`${snap.size} leilão(ões) ao vivo`;
    });
    tc('analytics').doc('overview').onSnapshot(snap=>{
      if(!snap.exists) return;
      const d=snap.data();
      const kl=document.getElementById('kpi-lances');   if(kl) kl.textContent=d.lancesHoje||0;
      const kv=document.getElementById('kpi-volume');   if(kv) kv.textContent='R$'+(d.volumeTotal||0).toLocaleString('pt-BR');
      const ki=document.getElementById('kpi-investidores'); if(ki) ki.textContent=d.investidoresVip||0;
    });
    this.loadLeiloesTable();
  },

  async loadLeiloesTable(){
    await seedIfEmpty('leiloes', [
      {nome:'Imóvel Comercial Pinheiros SP',categoria:'imovel',lanceMin:450000,avalicao:620000,lanceAtual:0,status:'active',encerra:new Date(Date.now()+72*3600000).toISOString()},
      {nome:'Coleção Arte Contemporânea BR',categoria:'arte',lanceMin:80000,avalicao:150000,lanceAtual:92000,status:'active',encerra:new Date(Date.now()+48*3600000).toISOString()},
      {nome:'Porsche 911 Turbo S 2023',categoria:'veiculo',lanceMin:680000,avalicao:720000,lanceAtual:695000,status:'active',encerra:new Date(Date.now()+24*3600000).toISOString()},
    ]);
    tc('leiloes').orderBy('createdAt','desc').limit(20).onSnapshot(snap=>{
      const tbody = document.getElementById('leiloes-tbody');
      if(!tbody) return;
      if(snap.empty){ tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">Nenhum leilão cadastrado.</td></tr>'; return; }
      tbody.innerHTML = snap.docs.map(d=>{
        const l=d.data();
        const enc=l.encerra?new Date(l.encerra).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
        const statusBadge = l.status==='active'?'badge-green':l.status==='ended'?'badge-amber':'badge-red';
        return `<tr>
          <td style="font-weight:600">${l.nome||'—'}</td>
          <td><span class="badge badge-gold">${l.categoria||'—'}</span></td>
          <td style="font-family:var(--ffm)">R$ ${(l.lanceMin||0).toLocaleString('pt-BR')}</td>
          <td style="font-family:var(--ffm);color:var(--gold);font-weight:700">R$ ${(l.lanceAtual||l.lanceMin||0).toLocaleString('pt-BR')}</td>
          <td style="font-size:11px;color:var(--muted)">${enc}</td>
          <td><span class="badge ${statusBadge}">${l.status==='active'?'Ativo':l.status==='ended'?'Encerrado':'Rascunho'}</span></td>
          <td style="display:flex;gap:6px">
            <button class="btn-sm btn-gold" onclick="BZS.encerrarLeilao('${d.id}')">Encerrar</button>
            <button class="btn-sm btn-danger" onclick="BZS.deleteLeilao('${d.id}')">✕</button>
          </td>
        </tr>`;
      }).join('');
    });
  },

  watchLances(){
    tc('lances').orderBy('ts','desc').limit(50).onSnapshot(snap=>{
      const feed = document.getElementById('lances-feed');
      if(!feed) return;
      if(snap.empty){
        feed.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted)">Sem lances ainda. Aguardando em tempo real…</div>';
        return;
      }
      feed.innerHTML = snap.docs.map(d=>{
        const l=d.data();
        const ts=l.ts?.toDate?l.ts.toDate().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
        return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:14px;animation:toastIn .25s ease">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--gold3);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold);font-size:12px">${(l.investidor||'?')[0]}</div>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${l.investidor||'—'}</div><div style="font-size:11px;color:var(--muted)">${l.ativo||''}</div></div>
          <div style="font-family:var(--ffm);font-weight:700;color:var(--gold);font-size:14px">R$ ${(l.valor||0).toLocaleString('pt-BR')}</div>
          <div style="font-size:10px;color:var(--muted2)">${ts}</div>
        </div>`;
      }).join('');
    });
  },

  async loadInvestidores(){
    await seedIfEmpty('investors', [
      {name:'Ricardo Alves',email:'r.alves@fundos.com',saldo:500000,vip:true,lances:12},
      {name:'Fernanda Costa',email:'fcosta@equity.br',saldo:280000,vip:true,lances:7},
      {name:'Marcelo Rios',email:'m.rios@outlook.com',saldo:95000,vip:false,lances:3},
    ]);
    tc('investors').orderBy('saldo','desc').limit(50).onSnapshot(snap=>{
      const tbody=document.getElementById('invest-tbody');
      if(!tbody) return;
      if(snap.empty){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Nenhum investidor.</td></tr>';return;}
      tbody.innerHTML=snap.docs.map(d=>{
        const i=d.data();
        return `<tr>
          <td style="font-weight:600">${i.name||'—'}</td>
          <td style="font-size:11px;color:var(--muted)">${i.email||''}</td>
          <td style="font-family:var(--ffm)">R$ ${(i.saldo||0).toLocaleString('pt-BR')}</td>
          <td><span class="badge ${i.vip?'badge-gold':'badge-amber'}">${i.vip?'VIP':'Standard'}</span></td>
          <td style="font-family:var(--ffm)">${i.lances||0}</td>
          <td><button class="btn-sm btn-gold" onclick="BZS.toggleVip('${d.id}',${!i.vip})">${i.vip?'Remover VIP':'Tornar VIP'}</button></td>
        </tr>`;
      }).join('');
    });
  },

  async loadAtivos(){
    await seedIfEmpty('assets', [
      {nome:'Apartamento Vila Madalena', categoria:'imovel', avaliacao:980000, status:'disponivel'},
      {nome:'Ferrari F8 Tributo 2022',   categoria:'veiculo', avaliacao:1450000, status:'em_leilao'},
      {nome:'Obra: Romero Britto Original', categoria:'arte', avaliacao:55000, status:'disponivel'},
    ]);
    tc('assets').orderBy('createdAt','desc').limit(50).onSnapshot(snap=>{
      const tbody=document.getElementById('ativos-tbody');
      if(!tbody) return;
      if(snap.empty){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Nenhum ativo.</td></tr>';return;}
      tbody.innerHTML=snap.docs.map(d=>{
        const a=d.data();
        const sc={disponivel:'badge-green',em_leilao:'badge-gold',encerrado:'badge-amber'}[a.status]||'badge-amber';
        return `<tr>
          <td style="font-weight:600">${a.nome||'—'}</td>
          <td><span class="badge badge-gold">${a.categoria||''}</span></td>
          <td style="font-family:var(--ffm)">R$ ${(a.avaliacao||0).toLocaleString('pt-BR')}</td>
          <td><span class="badge ${sc}">${a.status||'—'}</span></td>
          <td><button class="btn-sm btn-danger" onclick="tc('assets').doc('${d.id}').delete().then(()=>toast('Ativo removido.','info'))">✕</button></td>
        </tr>`;
      }).join('');
    });
  },

  async loadFinanceiro(){
    tc('orders').where('status','==','approved').onSnapshot(snap=>{
      let total=0, comissao=0, pendente=0, enc=0;
      const rows=snap.docs.map(d=>{
        const o=d.data();
        total+=(o.amount||0); comissao+=(o.amount||0)*0.05; enc++;
        const dt=o.createdAt?.toDate?o.createdAt.toDate().toLocaleDateString('pt-BR'):'';
        return `<tr>
          <td style="font-size:11px;color:var(--muted)">${dt}</td>
          <td>${o.productName||o.productId||'—'}</td>
          <td>${o.buyerName||o.buyerEmail||'—'}</td>
          <td style="font-family:var(--ffm);color:var(--gold)">R$ ${(o.amount||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
          <td style="font-family:var(--ffm);color:var(--green)">R$ ${((o.amount||0)*0.05).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
          <td><span class="badge badge-green">Pago</span></td>
        </tr>`;
      });
      tc('orders').where('status','==','pending').get().then(ps=>{ps.forEach(d=>{pendente+=(d.data().amount||0);});const pe=document.getElementById('fin-pendente');if(pe)pe.textContent='R$'+(pendente).toLocaleString('pt-BR');});
      const fr=document.getElementById('fin-receita');   if(fr) fr.textContent='R$'+total.toLocaleString('pt-BR');
      const fc=document.getElementById('fin-comissao');  if(fc) fc.textContent='R$'+comissao.toLocaleString('pt-BR',{minimumFractionDigits:2});
      const fe=document.getElementById('fin-leiloes-enc'); if(fe) fe.textContent=enc;
      const tb=document.getElementById('transacoes-tbody');
      if(tb) tb.innerHTML=rows.length?rows.join(''):'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Sem transações.</td></tr>';
    });
  },

  openNewLeilao(){ document.getElementById('modal-leilao').classList.add('open'); document.getElementById('nl-nome').focus(); },

  async createLeilao(){
    const nome=document.getElementById('nl-nome').value.trim();
    const cat=document.getElementById('nl-cat').value;
    const min=parseFloat(document.getElementById('nl-min').value)||0;
    const aval=parseFloat(document.getElementById('nl-aval').value)||0;
    const end=document.getElementById('nl-end').value;
    const desc=document.getElementById('nl-desc').value.trim();
    const fb=document.getElementById('nl-feedback');
    const btn=document.getElementById('nl-btn');
    if(!nome){if(fb){fb.style.cssText='display:block;background:rgba(255,61,113,.1);border:1px solid rgba(255,61,113,.3);color:var(--red)';fb.textContent='⚠️ Nome do ativo é obrigatório.';} return;}
    btn.disabled=true; btn.textContent='Criando…';
    try{
      await tc('leiloes').add({nome,categoria:cat,lanceMin:min,avalicao:aval,lanceAtual:0,descricao:desc,encerra:end||null,status:'active',createdAt:FS.serverTimestamp()});
      toast('🏛️ Leilão criado com sucesso!','success');
      document.getElementById('modal-leilao').classList.remove('open');
      ['nl-nome','nl-min','nl-aval','nl-end','nl-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    }catch(e){if(fb){fb.style.cssText='display:block;background:rgba(255,61,113,.1);border:1px solid rgba(255,61,113,.3);color:var(--red)';fb.textContent='✖ '+e.message;}}
    finally{btn.disabled=false;btn.textContent='🏛️ Criar Leilão';}
  },

  async encerrarLeilao(id){ await tc('leiloes').doc(id).update({status:'ended',encerradoAt:FS.serverTimestamp()}); toast('Leilão encerrado.','info'); },
  async deleteLeilao(id){ if(!confirm('Excluir este leilão?')) return; await tc('leiloes').doc(id).delete(); toast('Leilão removido.','info'); },
  async toggleVip(id,vip){ await tc('investors').doc(id).update({vip}); toast(vip?'VIP ativado!':'VIP removido.','success'); },
  openNewAtivo(){ toast('Em breve: cadastro de ativos.','info'); },

  async saveConfig(){
    const name=document.getElementById('cfg-name').value.trim();
    const color=document.getElementById('cfg-color').value;
    await db.collection('tenants').doc(TENANT_ID).collection('config').doc('brand').set({brandName:name||'Bezsan',color,updatedAt:FS.serverTimestamp()},{merge:true});
    toast('Configurações salvas!','success');
    if(color){ const r=document.documentElement; const hex=color.replace('#',''); const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16); r.style.setProperty('--gold',color); r.style.setProperty('--gold3',`rgba(${rr},${gg},${bb},0.12)`); }
  },
};

// ── SITE BUILDER ─────────────────────────────────────────────────
let _bzsGjs = null;
const BZS_BUILDER = {
  _inited: false,
  init(){
    if(this._inited) return;
    this._inited = true;
    this._initGrapesJS();
    this.loadFromLanding();
  },
  _initGrapesJS(){
    if(_bzsGjs){ _bzsGjs.destroy(); _bzsGjs=null; }
    _bzsGjs = grapesjs.init({
      container:'#bzs-gjs', height:'100%', storageManager:false, plugins:[],
      blockManager:{ appendTo:'#bzs-gjs-blocks', blocks:[
        {id:'hero',   label:'🌟 Hero Gold',   category:'Layout',  content:'<section style="background:#0A0A0A;min-height:60vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 20px"><h1 style="font-family:Sora,sans-serif;font-size:52px;font-weight:800;color:#D4AF37">Seu Título Aqui</h1></section>'},
        {id:'text',   label:'📝 Parágrafo',   category:'Texto',   content:'<p style="color:rgba(255,255,255,0.65);font-size:16px;line-height:1.75;max-width:680px;margin:0 auto">Texto descritivo do ativo ou leilão.</p>'},
        {id:'cta',    label:'🥇 Botão Gold',  category:'Ações',   content:'<a href="#" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#F0C84A);color:#000;padding:14px 36px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">Participar do Leilão</a>'},
        {id:'img',    label:'🖼 Imagem',       category:'Mídia',   content:'<img src="https://images.unsplash.com/photo-1560472355-536de3962603?w=900&q=80" style="width:100%;border-radius:12px">'},
        {id:'badge',  label:'🏷 Badge',        category:'Texto',   content:'<span style="background:rgba(212,175,55,0.12);color:#D4AF37;border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700">Premium</span>'},
      ]},
      canvas:{ styles:['https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800&display=swap'] },
    });
    _bzsGjs.Panels.removePanel('options');
    _bzsGjs.Panels.removePanel('devices-c');
  },
  async loadFromLanding(){
    const fb=document.getElementById('bzs-builder-feedback');
    // 1. Try Firestore saved layout
    try{
      const doc=await tc('public_site').doc('layout').get();
      if(doc.exists&&doc.data().html&&_bzsGjs){ _bzsGjs.setComponents(doc.data().html); _bzsGjs.setStyle(doc.data().css||''); if(fb)fb.textContent='✓ Layout do Firestore'; return; }
    }catch(e){}
    // 2. Fetch real landing page via DOMParser
    try{
      const res=await fetch('/bezsan/bezsan-landing.html');
      const raw=await res.text();
      const dom=new DOMParser().parseFromString(raw,'text/html');
      dom.querySelectorAll('script,link[rel="stylesheet"]').forEach(el=>el.remove());
      if(_bzsGjs) _bzsGjs.setComponents(dom.body.innerHTML);
      if(fb) fb.textContent='✓ Landing carregada';
    }catch(e){ if(fb) fb.textContent='✗ '+e.message; }
  },
  reset(){ this._initGrapesJS(); this.loadFromLanding(); },
  async save(){
    if(!_bzsGjs){toast('Editor não iniciado.','error');return;}
    const html=_bzsGjs.getHtml(), css=_bzsGjs.getCss();
    try{
      await tc('public_site').doc('layout').set({html,css,updatedAt:FS.serverTimestamp()});
      toast('🚀 Site Bezsan publicado!','success');
    }catch(e){toast('Erro: '+e.message,'error');}
  },
};

// ── NEXIA I18N + THEME BOOT ────────────────────────────────────────
(function(){
  NexiaI18n.init('pt');
  NexiaI18n.initTheme();
  document.addEventListener('DOMContentLoaded', function(){
    const sw = document.getElementById('bzs-lang-switcher');
    if(sw) sw.innerHTML = NexiaI18n.renderLangSwitcher('display:flex;gap:4px;flex-wrap:wrap');
  });
})();
function toggleBzsTheme(){ NexiaI18n.toggleTheme(); }

// ── AUTH GATE ─────────────────────────────────────────────────────
NexiaAuth.guard('SUPER_ADMIN','NEXIA_ADMIN','BEZSAN_ADMIN');
NexiaAuth.onReady(function(session){
  if(!session||!['SUPER_ADMIN','NEXIA_ADMIN','BEZSAN_ADMIN'].includes(session.role)){
    window.location.href='/login.html?tenant=bezsan'; return;
  }
  document.getElementById('shell').style.display='flex';
  BZS.loadDashboard();
  if(typeof NexiaSeed!=='undefined') NexiaSeed.run(db,'BEZSAN_01');
  const sw=document.getElementById('bzs-lang-switcher');
  if(sw) sw.innerHTML=NexiaI18n.renderLangSwitcher('display:flex;gap:4px;flex-wrap:wrap');
});
</script>

<script>
// ─── BEZSAN Tour 3D Virtual ───────────────────────────────────────
const TOUR3D_BZS = {
  _tours: [],

  init() {
    this.loadList();
  },

  async loadList() {
    const el = document.getElementById('tour3d-list');
    if (!el) return;
    // Tentar Firestore, fallback localStorage
    let tours = [];
    try {
      const db = firebase.firestore();
      const snap = await db.collection('tenants').doc('BEZSAN_01').collection('tours3d').orderBy('createdAt','desc').get();
      snap.forEach(d => tours.push({ id: d.id, ...d.data() }));
    } catch(e) {
      const saved = localStorage.getItem('bezsan_tours3d');
      tours = saved ? JSON.parse(saved) : this._demoTours();
    }
    this._tours = tours;
    this._renderList(el);
  },

  _demoTours() {
    return [
      { id:'demo1', name:'Cobertura Jardins — 420m²', value:'R$ 4.200.000', url:'https://my.matterport.com/show/?m=SxQL3iGyoDo', active:true },
      { id:'demo2', name:'Penthouse Itaim Bibi',       value:'R$ 7.800.000', url:'https://my.matterport.com/show/?m=Zh14WDtkjdC', active:true },
      { id:'demo3', name:'Casa Alphaville Premium',    value:'R$ 2.100.000', url:'https://my.matterport.com/show/?m=aSx1MpRRqif', active:false },
    ];
  },

  _renderList(el) {
    if (!this._tours.length) {
      el.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">Nenhum tour cadastrado. Adicione o primeiro acima.</div>';
      return;
    }
    el.innerHTML = this._tours.map(t => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background='rgba(212,175,55,0.04)'" onmouseout="this.style.background=''">
        <div style="width:40px;height:40px;border-radius:8px;background:var(--gold3);border:1px solid var(--border-gold,rgba(212,175,55,0.2));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🥽</div>
        <div style="flex:1;min-width:0">
          <div style="color:var(--text);font-size:12px;font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
          <div style="color:var(--gold);font-size:10px;font-weight:600">${t.value || '—'}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button onclick="TOUR3D_BZS.openViewer('${t.id}')" style="background:var(--gold3);border:1px solid var(--gold);color:var(--gold);border-radius:6px;padding:5px 12px;font-size:10px;font-weight:700;cursor:pointer">▶ Abrir</button>
          <button onclick="TOUR3D_BZS.remove('${t.id}')" style="background:rgba(255,61,90,0.08);border:1px solid rgba(255,61,90,0.2);color:#ff3d5a;border-radius:6px;padding:5px 10px;font-size:10px;cursor:pointer">✕</button>
        </div>
      </div>`).join('');
  },

  async add() {
    const name  = document.getElementById('tour3d-name').value.trim();
    const url   = document.getElementById('tour3d-url').value.trim();
    const value = document.getElementById('tour3d-value').value.trim();
    const fb    = document.getElementById('tour3d-feedback');
    if (!name) { fb.textContent = '⚠️ Informe o nome do imóvel'; fb.style.color = '#ffaa00'; return; }
    if (!url)  { fb.textContent = '⚠️ Informe a URL do tour';   fb.style.color = '#ffaa00'; return; }
    fb.textContent = '⏳ Salvando...'; fb.style.color = '#8a9dc0';
    const tour = { name, url, value, active: true, createdAt: Date.now() };
    try {
      const db = firebase.firestore();
      await db.collection('tenants').doc('BEZSAN_01').collection('tours3d').add(tour);
      fb.textContent = '✅ Tour salvo no Firestore!'; fb.style.color = '#00e87a';
    } catch(e) {
      const existing = JSON.parse(localStorage.getItem('bezsan_tours3d') || '[]');
      existing.unshift({ id: 'local_' + Date.now(), ...tour });
      localStorage.setItem('bezsan_tours3d', JSON.stringify(existing));
      fb.textContent = '✅ Tour salvo localmente!'; fb.style.color = '#00e87a';
    }
    document.getElementById('tour3d-name').value = '';
    document.getElementById('tour3d-url').value  = '';
    document.getElementById('tour3d-value').value = '';
    setTimeout(() => fb.textContent = '', 3000);
    this.loadList();
  },

  openViewer(id) {
    const tour = this._tours.find(t => t.id === id);
    if (!tour) return;
    const box   = document.getElementById('tour3d-viewer-box');
    const title = document.getElementById('tour3d-viewer-title');
    const iframe = document.getElementById('tour3d-iframe');
    title.textContent = '🥽 ' + tour.name;
    iframe.src = tour.url;
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  preview() {
    const url = document.getElementById('tour3d-url').value.trim();
    if (!url) { document.getElementById('tour3d-feedback').textContent = '⚠️ Cole uma URL primeiro'; return; }
    const box   = document.getElementById('tour3d-viewer-box');
    const title = document.getElementById('tour3d-viewer-title');
    const iframe = document.getElementById('tour3d-iframe');
    const name  = document.getElementById('tour3d-name').value.trim() || 'Prévia do Tour';
    title.textContent = '👁 Prévia — ' + name;
    iframe.src = url;
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async remove(id) {
    if (!confirm('Remover este tour?')) return;
    try {
      const db = firebase.firestore();
      await db.collection('tenants').doc('BEZSAN_01').collection('tours3d').doc(id).delete();
    } catch(e) {
      const existing = JSON.parse(localStorage.getItem('bezsan_tours3d') || '[]');
      localStorage.setItem('bezsan_tours3d', JSON.stringify(existing.filter(t => t.id !== id)));
    }
    this.loadList();
  }
};

// Auto-load quando tab tour3d é aberto
document.addEventListener('DOMContentLoaded', () => {
  const originalNav = BZS.nav.bind(BZS);
  BZS.nav = function(id, navEl) {
    originalNav(id, navEl);
    if (id === 'tour3d') {
      setTimeout(() => TOUR3D_BZS.init(), 100);
    }
  };
});
</script>
</body>
</html>
