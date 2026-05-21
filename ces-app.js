<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0A0A0A">
<title>Bezsan — Cofre VIP do Investidor</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0A0A0A; --bg2:#111110; --bg3:#161614; --sur:rgba(255,255,255,.04);
  --brd:rgba(255,255,255,.07); --brd2:rgba(212,175,55,.2);
  --txt:#F2F0E8; --muted:#9A9890; --muted2:#525248;
  --gold:#D4AF37; --gold2:#F0C84A; --gold3:rgba(212,175,55,.12);
  --green:#00E87A; --red:#FF3D71; --amber:#FFB020;
  --ff:'Sora',sans-serif; --ffm:'JetBrains Mono',monospace;
  --nav-h:68px;
}
html,body{min-height:100vh;background:var(--bg)}
body{font-family:var(--ff);color:var(--txt);-webkit-font-smoothing:antialiased;overflow-x:hidden;padding-bottom:calc(var(--nav-h) + 20px)}

/* ── LOGIN SCREEN ── */
#login-screen{
  min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:32px 20px;text-align:center;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(212,175,55,.06) 0%,transparent 70%);
}
.ls-gem{width:68px;height:68px;border-radius:18px;background:linear-gradient(135deg,#D4AF37,#F0C84A);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#000;margin:0 auto 16px;box-shadow:0 0 40px rgba(212,175,55,.25)}
.ls-title{font-size:22px;font-weight:800;color:var(--txt);margin-bottom:6px}
.ls-sub{font-size:13px;color:var(--muted);margin-bottom:32px;line-height:1.5}
.ls-input{width:100%;max-width:320px;background:var(--bg2);border:1px solid var(--brd2);border-radius:10px;padding:13px 16px;color:var(--txt);font-family:var(--ff);font-size:14px;outline:none;margin-bottom:12px;text-align:center;letter-spacing:.06em;text-transform:uppercase}
.ls-btn{width:100%;max-width:320px;padding:14px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#000;font-family:var(--ff);font-size:13px;font-weight:800;border:none;border-radius:10px;cursor:pointer;letter-spacing:.04em}
.ls-hint{font-size:11px;color:var(--muted2);margin-top:14px}
#ls-err{color:var(--red);font-size:12px;margin-top:8px;min-height:16px}

/* ── TOPBAR ── */
#topbar{
  position:fixed;top:0;left:0;right:0;z-index:100;
  height:56px;padding:0 20px;
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(10,10,10,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--brd);
}
.tb-brand{display:flex;align-items:center;gap:8px}
.tb-mark{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#000}
.tb-name{font-size:13px;font-weight:700}
.tb-name span{color:var(--gold)}
.tb-av{width:32px;height:32px;border-radius:50%;background:var(--gold3);border:1.5px solid var(--brd2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--gold)}

/* ── MAIN CONTENT ── */
#app{padding-top:72px;padding-left:16px;padding-right:16px}
.section-eyebrow{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.section-title{font-size:18px;font-weight:700;margin-bottom:16px}

/* ── SALDO CARD ── */
.saldo-card{
  background:linear-gradient(135deg,rgba(212,175,55,.1) 0%,rgba(212,175,55,.04) 100%);
  border:1px solid var(--brd2);border-radius:16px;padding:22px;margin-bottom:20px;position:relative;overflow:hidden;
}
.saldo-card::before{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,.1),transparent 70%)}
.saldo-label{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);opacity:.8;margin-bottom:6px}
.saldo-val{font-size:30px;font-weight:800;font-family:var(--ffm);color:var(--gold);line-height:1}
.saldo-sub{font-size:11px;color:var(--muted);margin-top:6px}

/* ── LEILÕES LIST ── */
.leilao-card{
  background:var(--bg2);border:1px solid var(--brd);border-radius:14px;
  padding:16px;margin-bottom:12px;transition:border-color .2s;
}
.leilao-card:active{border-color:var(--brd2)}
.lc-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
.lc-ico{width:44px;height:44px;border-radius:10px;background:var(--gold3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.lc-nome{font-size:13px;font-weight:700;margin-bottom:3px}
.lc-cat{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);opacity:.7}
.lc-lances-row{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(212,175,55,.04);border-radius:8px;margin-bottom:10px}
.lc-lance-min span,.lc-lance-atual span{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:2px}
.lc-lance-min strong,.lc-lance-atual strong{font-family:var(--ffm);font-size:14px;color:var(--txt)}
.lc-lance-atual strong{color:var(--gold)}
.lc-countdown{font-size:10px;color:var(--amber);font-family:var(--ffm);margin-bottom:10px}
.btn-lance{
  width:100%;padding:12px;background:linear-gradient(135deg,var(--gold),var(--gold2));
  color:#000;border:none;border-radius:10px;font-family:var(--ff);font-size:12px;font-weight:800;cursor:pointer;
  letter-spacing:.04em;transition:opacity .2s;
}
.btn-lance:active{opacity:.85}

/* ── MEUS LANCES ── */
.meu-lance-item{background:var(--bg2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px}
.ml-status{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.ml-status.winning{background:var(--green)}
.ml-status.losing{background:var(--red)}
.ml-status.ended{background:var(--muted)}

/* ── BOTTOM NAV ── */
#bottom-nav{
  position:fixed;bottom:0;left:0;right:0;z-index:100;
  height:var(--nav-h);
  background:rgba(10,10,10,.95);backdrop-filter:blur(20px);border-top:1px solid var(--brd);
  display:flex;align-items:center;padding:0 8px;padding-bottom:env(safe-area-inset-bottom);
}
.nb{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  padding:8px 4px;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted2);border:none;background:none;cursor:pointer;transition:color .2s;
}
.nb.active{color:var(--gold)}
.nb-ico{font-size:20px;line-height:1}

/* ── LANCE MODAL ── */
#modal-lance{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;align-items:flex-end;justify-content:center}
#modal-lance.open{display:flex}
.ml-box{background:var(--bg2);border:1px solid var(--brd2);border-radius:24px 24px 0 0;padding:24px 20px 32px;width:100%;max-width:480px}
.ml-title{font-size:15px;font-weight:700;margin-bottom:6px}
.ml-ativo{font-size:12px;color:var(--muted);margin-bottom:16px}
.ml-input{width:100%;background:var(--bg3);border:2px solid var(--brd2);border-radius:12px;padding:14px 16px;color:var(--gold);font-family:var(--ffm);font-size:22px;font-weight:700;outline:none;text-align:center;margin-bottom:14px}
.ml-input:focus{border-color:var(--gold)}
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

<!-- LOGIN SCREEN -->
<div id="login-screen">
  <div class="ls-gem">Bz</div>
  <div class="ls-title">Bezsan <span style="color:var(--gold)">VIP</span></div>
  <div class="ls-sub">Cofre do Investidor.<br>Insira sua chave de acesso.</div>
  <input class="ls-input" id="ls-code" type="text" placeholder="INVESTOR-XXXXX" onkeydown="if(event.key==='Enter')APP.login()">
  <input class="ls-input" id="ls-name" type="text" placeholder="Seu nome" style="text-transform:none;letter-spacing:0" onkeydown="if(event.key==='Enter')APP.login()">
  <button class="ls-btn" onclick="APP.login()">Entrar no Cofre →</button>
  <div class="ls-hint">Acesso limitado a investidores credenciados</div>
  <div id="ls-err"></div>
</div>

<!-- MAIN APP (hidden until login) -->
<div id="main-app" style="display:none">
  <div id="topbar">
    <div class="tb-brand">
      <div class="tb-mark">Bz</div>
      <div class="tb-name">Bez<span>san</span></div>
    </div>
    <div class="tb-av" id="tb-av">?</div>
  </div>

  <div id="app">
    <!-- VIEW: HOME -->
    <div id="view-home">
      <div id="saldo-card" class="saldo-card">
        <div class="saldo-label">Saldo Disponível</div>
        <div class="saldo-val" id="saldo-val">R$ —</div>
        <div class="saldo-sub" id="saldo-sub">Carregando carteira…</div>
      </div>
      <div style="margin-bottom:8px">
        <div class="section-eyebrow">Leilões ao Vivo</div>
      </div>
      <div id="leiloes-list"><div style="text-align:center;padding:30px;color:var(--muted)">⏳ Carregando…</div></div>
    </div>

    <!-- VIEW: MEUS LANCES -->
    <div id="view-lances" style="display:none">
      <div class="section-title" style="padding-top:8px">⚡ Meus Lances</div>
      <div id="meus-lances-list"><div style="text-align:center;padding:30px;color:var(--muted)">⏳ Carregando…</div></div>
    </div>

    <!-- VIEW: COFRE -->
    <div id="view-cofre" style="display:none">
      <div class="section-eyebrow">Vault VIP</div>
      <div class="section-title">💎 Meu Cofre</div>
      <div id="cofre-docs"><div style="text-align:center;padding:30px;color:var(--muted)">⏳ Carregando documentos…</div></div>
    </div>

    <!-- VIEW: PERFIL -->
    <div id="view-perfil" style="display:none">
      <div class="section-title" style="padding-top:8px">👤 Perfil</div>
      <div style="background:var(--bg2);border:1px solid var(--brd);border-radius:14px;padding:20px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:52px;height:52px;border-radius:50%;background:var(--gold3);border:2px solid var(--brd2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:var(--gold)" id="pf-av">?</div>
          <div><div style="font-weight:700;font-size:15px" id="pf-name">—</div><div style="font-size:11px;color:var(--muted)" id="pf-email">—</div></div>
        </div>
      </div>
      <div id="pf-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px"></div>
      <button onclick="APP.logout()" style="width:100%;padding:13px;background:rgba(255,61,113,.1);border:1px solid rgba(255,61,113,.3);border-radius:10px;color:var(--red);font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer">Sair da Conta</button>
    </div>
  </div>

  <nav id="bottom-nav">
    <button class="nb active" onclick="APP.nav('home',this)"><span class="nb-ico">🏠</span>Início</button>
    <button class="nb" onclick="APP.nav('lances',this)"><span class="nb-ico">⚡</span>Lances</button>
    <button class="nb" onclick="APP.nav('cofre',this)"><span class="nb-ico">💎</span>Cofre</button>
    <button class="nb" onclick="APP.nav('perfil',this)"><span class="nb-ico">👤</span>Perfil</button>
  </nav>
</div>

<!-- MODAL LANCE -->
<div id="modal-lance">
  <div class="ml-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="ml-title">⚡ Fazer Lance</div>
      <button onclick="APP.closeLance()" style="font-size:18px;color:var(--muted);background:none;border:none;cursor:pointer">✕</button>
    </div>
    <div class="ml-ativo" id="ml-ativo-name">—</div>
    <div style="font-size:10px;color:var(--muted);margin-bottom:6px;letter-spacing:.1em;text-transform:uppercase">Lance mínimo: <span id="ml-min" style="color:var(--gold);font-family:var(--ffm)">—</span></div>
    <input class="ml-input" id="ml-valor" type="number" placeholder="0,00">
    <button class="btn-lance" onclick="APP.confirmarLance()">🏛️ Confirmar Lance</button>
  </div>
</div>

<script>
'use strict';

const TENANT_ID = 'BEZSAN_01';
const FB_CFG = {
  apiKey:'AIzaSyC9L592zKSUjx-YglmbGpxjv2hsXm_gbBM',
  authDomain:'nexia-c8710.firebaseapp.com',
  projectId:'nexia-c8710',
  appId:'1:623044447905:web:13f70e1584fb0fcf8d2ae0'
};
if(!firebase.apps.length) firebase.initializeApp(FB_CFG);
const db  = firebase.firestore();
const FS  = firebase.firestore.FieldValue;
function tc(col){ return db.collection('tenants').doc(TENANT_ID).collection(col); }

const APP = {
  user: { name:'', initials:'?', investorId:null, saldo:0 },
  _currentLeilao: null,
  _unsubs: [],

  login(){
    const code = document.getElementById('ls-code').value.trim().toUpperCase();
    const name = document.getElementById('ls-name').value.trim();
    const err  = document.getElementById('ls-err');
    if(!name){ err.textContent='Digite seu nome.'; return; }
    if(!code){ err.textContent='Informe sua chave de acesso.'; return; }

    err.textContent='⏳ Verificando credenciais…';

    tc('investors').where('accessCode','==',code).limit(1).get()
      .then(snap => {
        if(snap.empty){
          // Auto-cria investidor se não existir (primeiro acesso)
          return tc('investors').add({
            name, accessCode: code, saldo: 50000, vip: false, lances: 0,
            email: code.toLowerCase()+'@investor.bezsan.com',
            createdAt: FS.serverTimestamp(),
          }).then(ref => ({ id: ref.id, data: () => ({ name, saldo:50000, vip:false, lances:0 }) }));
        }
        return snap.docs[0];
      })
      .then(doc => {
        const d = doc.data ? doc.data() : doc;
        this.user.name        = name || d.name || '';
        this.user.investorId  = doc.id || doc.id;
        this.user.saldo       = d.saldo || 0;
        const parts = this.user.name.split(' ');
        this.user.initials    = ((parts[0]||'?')[0] + (parts[1]?parts[1][0]:'')).toUpperCase();

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display     = 'block';
        document.getElementById('tb-av').textContent          = this.user.initials;
        err.textContent = '';
        this.startApp();
      })
      .catch(e => { err.textContent = '✖ Erro: ' + e.message; });
  },

  startApp(){
    this._loadSaldo();
    this._loadLeiloes();
  },

  nav(view, navEl){
    ['home','lances','cofre','perfil'].forEach(v=>{
      const el=document.getElementById('view-'+v);
      if(el) el.style.display='none';
    });
    const target=document.getElementById('view-'+view);
    if(target) target.style.display='block';
    document.querySelectorAll('.nb').forEach(nb=>nb.classList.remove('active'));
    if(navEl) navEl.classList.add('active');

    if(view==='lances') this._loadMeusLances();
    if(view==='cofre')  this._loadCofre();
    if(view==='perfil') this._loadPerfil();
  },

  _loadSaldo(){
    if(!this.user.investorId) return;
    tc('investors').doc(this.user.investorId).onSnapshot(snap=>{
      if(!snap.exists) return;
      const d=snap.data();
      this.user.saldo=d.saldo||0;
      const sv=document.getElementById('saldo-val');
      const ss=document.getElementById('saldo-sub');
      if(sv) sv.textContent='R$ '+(d.saldo||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
      if(ss) ss.textContent=(d.vip?'✦ Investidor VIP · ':'')+'Disponível para lances';
    });
  },

  _loadLeiloes(){
    const unsub = tc('leiloes').where('status','==','active').orderBy('createdAt','desc')
      .onSnapshot(snap=>{
        const el=document.getElementById('leiloes-list');
        if(!el) return;
        if(snap.empty){ el.innerHTML='<div style="text-align:center;padding:30px;color:var(--muted)">Nenhum leilão ativo no momento.</div>'; return; }
        el.innerHTML=snap.docs.map(d=>{
          const l=d.data();
          const catIco={imovel:'🏠',arte:'🖼️',veiculo:'🚗',empresa:'🏢',crypto:'₿',outro:'💎'}[l.categoria]||'💎';
          const encStr = l.encerra?this._timeLeft(new Date(l.encerra)):'Sem prazo';
          const lAtual = l.lanceAtual||l.lanceMin||0;
          return `<div class="leilao-card">
            <div class="lc-header">
              <div class="lc-ico">${catIco}</div>
              <div><div class="lc-nome">${l.nome||'—'}</div><div class="lc-cat">${l.categoria||'ativo'}</div></div>
            </div>
            <div class="lc-lances-row">
              <div class="lc-lance-min"><span>Lance Mínimo</span><strong>R$ ${(l.lanceMin||0).toLocaleString('pt-BR')}</strong></div>
              <div class="lc-lance-atual"><span>Lance Atual</span><strong>R$ ${lAtual.toLocaleString('pt-BR')}</strong></div>
            </div>
            <div class="lc-countdown">⏱ Encerra: ${encStr}</div>
            <button class="btn-lance" onclick="APP.openLance('${d.id}','${(l.nome||'').replace(/'/g,"\\'")}',${lAtual},${l.lanceMin||0})">
              🏛️ Fazer Lance
            </button>
          </div>`;
        }).join('');
      }, ()=>{});
    this._unsubs.push(unsub);
  },

  _timeLeft(end){
    const diff=end-Date.now();
    if(diff<=0) return 'Encerrado';
    const d=Math.floor(diff/86400000);
    const h=Math.floor((diff%86400000)/3600000);
    const m=Math.floor((diff%3600000)/60000);
    return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}min`;
  },

  openLance(leilaoId, nome, lanceAtual, lanceMin){
    this._currentLeilao={id:leilaoId, nome, lanceAtual, lanceMin};
    const minLance = Math.max(lanceAtual, lanceMin) * 1.05;
    document.getElementById('ml-ativo-name').textContent = nome;
    document.getElementById('ml-min').textContent = 'R$ '+minLance.toLocaleString('pt-BR',{minimumFractionDigits:2});
    document.getElementById('ml-valor').value = '';
    document.getElementById('modal-lance').classList.add('open');
    setTimeout(()=>document.getElementById('ml-valor').focus(),200);
  },

  closeLance(){ document.getElementById('modal-lance').classList.remove('open'); this._currentLeilao=null; },

  async confirmarLance(){
    const l=this._currentLeilao;
    if(!l) return;
    const val=parseFloat(document.getElementById('ml-valor').value)||0;
    const minLance=Math.max(l.lanceAtual,l.lanceMin)*1.05;
    if(val<minLance){ alert(`Lance mínimo: R$ ${minLance.toLocaleString('pt-BR',{minimumFractionDigits:2})}`); return; }
    if(val>this.user.saldo){ alert('Saldo insuficiente para este lance.'); return; }
    try{
      const batch=db.batch();
      batch.set(tc('lances').doc(),{
        leilaoId:l.id, ativo:l.nome, valor:val, investidor:this.user.name,
        investorId:this.user.investorId, status:'active', ts:FS.serverTimestamp(),
      });
      batch.update(tc('leiloes').doc(l.id),{lanceAtual:val, ultimoLance:FS.serverTimestamp()});
      batch.update(tc('investors').doc(this.user.investorId),{lances:FS.increment(1)});
      await batch.commit();
      this.closeLance();
      alert(`✅ Lance de R$ ${val.toLocaleString('pt-BR',{minimumFractionDigits:2})} registrado com sucesso!`);
    }catch(e){ alert('Erro ao registrar lance: '+e.message); }
  },

  _loadMeusLances(){
    if(!this.user.investorId) return;
    tc('lances').where('investorId','==',this.user.investorId).orderBy('ts','desc').limit(30)
      .onSnapshot(snap=>{
        const el=document.getElementById('meus-lances-list');
        if(!el) return;
        if(snap.empty){ el.innerHTML='<div style="text-align:center;padding:30px;color:var(--muted)">Você ainda não fez nenhum lance.</div>'; return; }
        el.innerHTML=snap.docs.map(d=>{
          const l=d.data();
          const ts=l.ts?.toDate?l.ts.toDate().toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'';
          const winning=l.status==='winning';
          return `<div class="meu-lance-item">
            <div class="ml-status ${winning?'winning':'losing'}"></div>
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${l.ativo||'—'}</div><div style="font-size:11px;color:var(--muted)">${ts}</div></div>
            <div style="font-family:var(--ffm);font-weight:700;color:var(--gold)">R$ ${(l.valor||0).toLocaleString('pt-BR')}</div>
          </div>`;
        }).join('');
      }, ()=>{});
  },

  _loadCofre(){
    if(!this.user.investorId) return;
    tc('investors').doc(this.user.investorId).collection('vault').onSnapshot(snap=>{
      const el=document.getElementById('cofre-docs');
      if(!el) return;
      if(snap.empty){
        el.innerHTML='<div style="background:var(--bg2);border:1px solid var(--brd);border-radius:12px;padding:20px;text-align:center;color:var(--muted)">Seu cofre está vazio.<br><small>Documentos VIP aparecerão aqui após negociações.</small></div>';
        return;
      }
      el.innerHTML=snap.docs.map(d=>{
        const doc=d.data();
        return `<div style="background:var(--bg2);border:1px solid var(--brd2);border-radius:12px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
          <div style="font-size:28px">${doc.icon||'📄'}</div>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${doc.title||'—'}</div><div style="font-size:11px;color:var(--muted)">${doc.meta||''}</div></div>
          ${doc.url?`<a href="${doc.url}" target="_blank" style="padding:7px 12px;background:var(--gold3);border:1px solid var(--brd2);border-radius:7px;color:var(--gold);font-size:11px;font-weight:600;text-decoration:none">Abrir</a>`:''}
        </div>`;
      }).join('');
    }, ()=>{});
  },

  _loadPerfil(){
    const n=document.getElementById('pf-name'); if(n) n.textContent=this.user.name;
    const e=document.getElementById('pf-email'); if(e) e.textContent=this.user.investorId?'ID: '+this.user.investorId:'—';
    const a=document.getElementById('pf-av'); if(a) a.textContent=this.user.initials;
    const stats=document.getElementById('pf-stats');
    if(stats) stats.innerHTML=`
      <div style="background:var(--bg2);border:1px solid var(--brd);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:20px;font-weight:700;font-family:var(--ffm);color:var(--gold)">R$ ${this.user.saldo.toLocaleString('pt-BR')}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:.1em">Saldo</div>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--brd);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:20px;font-weight:700;font-family:var(--ffm);color:var(--gold)">—</div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:.1em">Lances</div>
      </div>`;
  },

  logout(){
    document.getElementById('main-app').style.display='none';
    document.getElementById('login-screen').style.display='flex';
    document.getElementById('ls-code').value='';
    document.getElementById('ls-name').value='';
    this._unsubs.forEach(u=>u&&u());
    this._unsubs=[];
    this.user={name:'',initials:'?',investorId:null,saldo:0};
  },
};

// Service Worker registration
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/bezsan/sw-bezsan.js').catch(()=>{});
}
</script>

<script>
// ═══════════════════════════════════════════════════════════════════
// BEZSAN APP — WebAuthn para confirmar lances + Haptic feedback
// ═══════════════════════════════════════════════════════════════════
window.BZS_AUTH = {
  async confirmBid(valor, onConfirmed) {
    const formatted = typeof valor === 'number'
      ? 'R$ ' + valor.toLocaleString('pt-BR', {minimumFractionDigits:0})
      : valor;

    // Tentar WebAuthn primeiro
    if (window.PublicKeyCredential) {
      try {
        const avail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (avail) {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 30000,
              userVerification: 'preferred',
              rpId: window.location.hostname || 'localhost'
            }
          });
          // Haptic feedback
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          onConfirmed(true, 'biometric');
          return;
        }
      } catch (e) {
        // Usuário cancelou ou não suportado — fallback para confirm
      }
    }

    // Fallback: confirm dialog
    const ok = confirm(`Confirmar lance de ${formatted}?

Essa ação é irreversível.`);
    if (ok && navigator.vibrate) navigator.vibrate(200);
    onConfirmed(ok, 'dialog');
  },

  _showToast(msg, type) {
    let t = document.getElementById('bzs-auth-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'bzs-auth-toast';
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;transition:opacity 0.3s;pointer-events:none;font-family:Sora,sans-serif';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = type === 'success' ? 'rgba(0,232,122,0.9)' : 'rgba(255,61,90,0.9)';
    t.style.color = type === 'success' ? '#000' : '#fff';
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 3500);
  }
};

// Interceptar botões de lance existentes para adicionar WebAuthn
document.addEventListener('DOMContentLoaded', () => {
  // Observar quando botões de lance são criados dinamicamente
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        // Procurar botões de lance
        const bidBtns = node.querySelectorAll ? node.querySelectorAll('[class*="bid"], [id*="bid"], [onclick*="bid"], [onclick*="lance"], [onclick*="Bid"]') : [];
        bidBtns.forEach(btn => {
          if (btn.dataset.webauthnWrapped) return;
          btn.dataset.webauthnWrapped = '1';
          const origClick = btn.onclick;
          btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const valor = btn.dataset.valor || btn.textContent.match(/R\$[^)]+/)?.[0] || 'valor do lance';
            await BZS_AUTH.confirmBid(valor, (ok, method) => {
              if (ok) {
                BZS_AUTH._showToast(`✅ Lance confirmado${method === 'biometric' ? ' via biometria' : ''}!`, 'success');
                if (origClick) origClick.call(btn, e);
              } else {
                BZS_AUTH._showToast('❌ Lance cancelado', 'error');
              }
            });
          };
        });
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
</script>
</body>
</html>
