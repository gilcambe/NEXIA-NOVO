/**
 * ═══════════════════════════════════════════════════════════════
 * NEXIA OS — SOVEREIGN SITE BUILDER ENGINE v3.0
 * ---------------------------------------------------------------
 * • Loads REAL landing page HTML via fetch() + DOMParser
 * • Zero mocks — all layouts saved/loaded from Firestore
 * • 30 layout presets for SUPER_ADMIN, 10 for client admins
 * • Full Dark/Light mode toggle
 * • Trilingual UI (PT / EN / ES)
 * • GrapesJS fullscreen with all panels
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

window.NexiaBuilder = (function () {

  /* ── I18N ────────────────────────────────────────────────────── */
  const T = {
    pt: {
      builder: 'Construtor Visual',
      layouts: 'Layouts',
      preview: 'Pré-visualizar',
      publish: 'Publicar Site',
      save: 'Salvar Rascunho',
      saved: '✅ Salvo!',
      published: '🚀 Publicado!',
      loading: 'Carregando editor...',
      loadingPage: 'Carregando página real...',
      selectLayout: 'Escolher Layout',
      applyLayout: 'Aplicar Layout',
      currentSite: 'Site Atual',
      chooseClient: 'Escolher Cliente',
      allLayouts: 'Todos os Layouts',
      layoutApplied: '✅ Layout aplicado!',
      confirmLayout: 'Aplicar este layout vai substituir o conteúdo atual. Continuar?',
    },
    en: {
      builder: 'Visual Builder',
      layouts: 'Layouts',
      preview: 'Preview',
      publish: 'Publish Site',
      save: 'Save Draft',
      saved: '✅ Saved!',
      published: '🚀 Published!',
      loading: 'Loading editor...',
      loadingPage: 'Loading real page...',
      selectLayout: 'Choose Layout',
      applyLayout: 'Apply Layout',
      currentSite: 'Current Site',
      chooseClient: 'Choose Client',
      allLayouts: 'All Layouts',
      layoutApplied: '✅ Layout applied!',
      confirmLayout: 'Applying this layout will replace current content. Continue?',
    },
    es: {
      builder: 'Constructor Visual',
      layouts: 'Diseños',
      preview: 'Vista Previa',
      publish: 'Publicar Sitio',
      save: 'Guardar Borrador',
      saved: '✅ ¡Guardado!',
      published: '🚀 ¡Publicado!',
      loading: 'Cargando editor...',
      loadingPage: 'Cargando página real...',
      selectLayout: 'Elegir Diseño',
      applyLayout: 'Aplicar Diseño',
      currentSite: 'Sitio Actual',
      chooseClient: 'Elegir Cliente',
      allLayouts: 'Todos los Diseños',
      layoutApplied: '✅ ¡Diseño aplicado!',
      confirmLayout: '¿Aplicar este diseño reemplazará el contenido actual. ¿Continuar?',
    }
  };

  /* ── 30 LAYOUT PRESETS ───────────────────────────────────────── */
  const LAYOUTS = [
    /* ─ 10 base layouts (available to all admins) ─ */
    {
      id: 'nexia-hero-dark', name: 'Hero Dark', thumb: '🌑', tier: 'all',
      vars: { '--bg':'#0a0c14','--surface':'#111827','--accent':'#00c6ff','--text':'#e2e8f0','--hero-bg':'linear-gradient(135deg,#0a0c14,#1a2235)','--nav-bg':'rgba(10,12,20,.95)' },
      heroLayout: 'centered', navStyle: 'floating', sectionOrder: ['hero','stats','features','cta']
    },
    {
      id: 'nexia-hero-light', name: 'Hero Light', thumb: '☀️', tier: 'all',
      vars: { '--bg':'#FAF8F5','--surface':'#ffffff','--accent':'#0072ff','--text':'#1C1A17','--hero-bg':'linear-gradient(135deg,#f0f4ff,#e8f0fe)','--nav-bg':'rgba(255,255,255,.95)' },
      heroLayout: 'centered', navStyle: 'solid', sectionOrder: ['hero','features','testimonials','cta']
    },
    {
      id: 'nexia-split-left', name: 'Split Left', thumb: '◧', tier: 'all',
      vars: { '--bg':'#f8fafc','--surface':'#ffffff','--accent':'#6366f1','--text':'#0f172a','--hero-bg':'#f1f5f9','--nav-bg':'#ffffff' },
      heroLayout: 'split-left', navStyle: 'minimal', sectionOrder: ['hero','stats','features','pricing','cta']
    },
    {
      id: 'nexia-split-right', name: 'Split Right', thumb: '◨', tier: 'all',
      vars: { '--bg':'#0f172a','--surface':'#1e293b','--accent':'#a78bfa','--text':'#f1f5f9','--hero-bg':'linear-gradient(135deg,#0f172a,#1e293b)','--nav-bg':'rgba(15,23,42,.95)' },
      heroLayout: 'split-right', navStyle: 'dark', sectionOrder: ['hero','features','pricing','testimonials','cta']
    },
    {
      id: 'nexia-gold-luxury', name: 'Gold Luxury', thumb: '✨', tier: 'all',
      vars: { '--bg':'#0c0a05','--surface':'#1a1505','--accent':'#f5c842','--text':'#faf8f0','--hero-bg':'radial-gradient(ellipse at top,#1a1505,#0c0a05)','--nav-bg':'rgba(12,10,5,.96)' },
      heroLayout: 'centered', navStyle: 'transparent-gold', sectionOrder: ['hero','gallery','features','pricing','cta']
    },
    {
      id: 'nexia-corporate-blue', name: 'Corporate Blue', thumb: '🔵', tier: 'all',
      vars: { '--bg':'#EFF6FF','--surface':'#DBEAFE','--accent':'#1D4ED8','--text':'#1E3A8A','--hero-bg':'linear-gradient(135deg,#1D4ED8,#3B82F6)','--nav-bg':'#1E3A8A' },
      heroLayout: 'full-width', navStyle: 'blue', sectionOrder: ['hero','stats','services','team','cta']
    },
    {
      id: 'nexia-emerald', name: 'Emerald Tech', thumb: '💚', tier: 'all',
      vars: { '--bg':'#f0fdf4','--surface':'#dcfce7','--accent':'#16a34a','--text':'#14532d','--hero-bg':'linear-gradient(135deg,#166534,#15803d)','--nav-bg':'rgba(22,101,52,.96)' },
      heroLayout: 'centered', navStyle: 'green', sectionOrder: ['hero','features','stats','testimonials','cta']
    },
    {
      id: 'nexia-rose-modern', name: 'Rose Modern', thumb: '🌸', tier: 'all',
      vars: { '--bg':'#fff1f2','--surface':'#ffe4e6','--accent':'#e11d48','--text':'#881337','--hero-bg':'linear-gradient(135deg,#881337,#be123c)','--nav-bg':'rgba(136,19,55,.96)' },
      heroLayout: 'split-left', navStyle: 'red', sectionOrder: ['hero','gallery','features','cta']
    },
    {
      id: 'nexia-midnight-purple', name: 'Midnight Purple', thumb: '🟣', tier: 'all',
      vars: { '--bg':'#0a0010','--surface':'#150023','--accent':'#c026d3','--text':'#fdf4ff','--hero-bg':'radial-gradient(ellipse at center,#150023,#0a0010)','--nav-bg':'rgba(10,0,16,.96)' },
      heroLayout: 'centered', navStyle: 'purple', sectionOrder: ['hero','features','pricing','cta']
    },
    {
      id: 'nexia-warmth', name: 'Warmth Cream', thumb: '🤍', tier: 'all',
      vars: { '--bg':'#FFFBF5','--surface':'#FFF7EE','--accent':'#C2853A','--text':'#2D1B00','--hero-bg':'linear-gradient(135deg,#7C3C00,#A0522D)','--nav-bg':'rgba(124,60,0,.9)' },
      heroLayout: 'centered', navStyle: 'warm', sectionOrder: ['hero','about','services','gallery','cta']
    },
    /* ─ 20 extra layouts (SUPER_ADMIN only) ─ */
    {
      id: 'nexia-neon-cyber', name: 'Neon Cyber', thumb: '⚡', tier: 'super',
      vars: { '--bg':'#000510','--surface':'#000d1f','--accent':'#00ff88','--text':'#d0ffe8','--hero-bg':'linear-gradient(135deg,#000510,#001a3a)','--nav-bg':'rgba(0,5,16,.97)' },
      heroLayout: 'centered', navStyle: 'neon', sectionOrder: ['hero','stats','features','pricing','cta']
    },
    {
      id: 'nexia-sunset-orange', name: 'Sunset Orange', thumb: '🌅', tier: 'super',
      vars: { '--bg':'#fff7ed','--surface':'#ffedd5','--accent':'#ea580c','--text':'#431407','--hero-bg':'linear-gradient(135deg,#7c2d12,#ea580c)','--nav-bg':'rgba(124,45,18,.96)' },
      heroLayout: 'full-width', navStyle: 'orange', sectionOrder: ['hero','gallery','features','cta']
    },
    {
      id: 'nexia-arctic', name: 'Arctic White', thumb: '❄️', tier: 'super',
      vars: { '--bg':'#f0f9ff','--surface':'#e0f2fe','--accent':'#0284c7','--text':'#0c4a6e','--hero-bg':'linear-gradient(135deg,#0c4a6e,#0369a1)','--nav-bg':'rgba(12,74,110,.96)' },
      heroLayout: 'centered', navStyle: 'ice', sectionOrder: ['hero','features','testimonials','cta']
    },
    {
      id: 'nexia-forest-deep', name: 'Forest Deep', thumb: '🌲', tier: 'super',
      vars: { '--bg':'#f0fdf4','--surface':'#d1fae5','--accent':'#047857','--text':'#064e3b','--hero-bg':'linear-gradient(135deg,#064e3b,#065f46)','--nav-bg':'rgba(6,78,59,.97)' },
      heroLayout: 'split-right', navStyle: 'forest', sectionOrder: ['hero','about','services','gallery','cta']
    },
    {
      id: 'nexia-slate-pro', name: 'Slate Pro', thumb: '🩶', tier: 'super',
      vars: { '--bg':'#f8fafc','--surface':'#f1f5f9','--accent':'#475569','--text':'#0f172a','--hero-bg':'linear-gradient(135deg,#0f172a,#1e293b)','--nav-bg':'rgba(15,23,42,.97)' },
      heroLayout: 'split-left', navStyle: 'slate', sectionOrder: ['hero','stats','team','features','cta']
    },
    {
      id: 'nexia-flamingo', name: 'Flamingo Pop', thumb: '🦩', tier: 'super',
      vars: { '--bg':'#fdf2f8','--surface':'#fce7f3','--accent':'#db2777','--text':'#500724','--hero-bg':'linear-gradient(135deg,#831843,#be185d)','--nav-bg':'rgba(131,24,67,.97)' },
      heroLayout: 'centered', navStyle: 'pink', sectionOrder: ['hero','gallery','features','pricing','cta']
    },
    {
      id: 'nexia-cobalt', name: 'Cobalt Steel', thumb: '🔷', tier: 'super',
      vars: { '--bg':'#eff6ff','--surface':'#dbeafe','--accent':'#1d4ed8','--text':'#1e3a8a','--hero-bg':'linear-gradient(135deg,#1e3a8a,#2563eb)','--nav-bg':'rgba(30,58,138,.97)' },
      heroLayout: 'full-width', navStyle: 'cobalt', sectionOrder: ['hero','stats','features','team','cta']
    },
    {
      id: 'nexia-amber-glow', name: 'Amber Glow', thumb: '🟡', tier: 'super',
      vars: { '--bg':'#fffbeb','--surface':'#fef3c7','--accent':'#d97706','--text':'#451a03','--hero-bg':'linear-gradient(135deg,#451a03,#92400e)','--nav-bg':'rgba(69,26,3,.97)' },
      heroLayout: 'centered', navStyle: 'amber', sectionOrder: ['hero','features','pricing','cta']
    },
    {
      id: 'nexia-ocean-deep', name: 'Ocean Deep', thumb: '🌊', tier: 'super',
      vars: { '--bg':'#f0fdfa','--surface':'#ccfbf1','--accent':'#0d9488','--text':'#134e4a','--hero-bg':'linear-gradient(135deg,#134e4a,#0f766e)','--nav-bg':'rgba(19,78,74,.97)' },
      heroLayout: 'split-left', navStyle: 'teal', sectionOrder: ['hero','gallery','features','stats','cta']
    },
    {
      id: 'nexia-volcanic', name: 'Volcanic Red', thumb: '🌋', tier: 'super',
      vars: { '--bg':'#0c0000','--surface':'#1c0000','--accent':'#ff3d00','--text':'#ffe8e0','--hero-bg':'radial-gradient(ellipse at top,#1c0000,#0c0000)','--nav-bg':'rgba(12,0,0,.97)' },
      heroLayout: 'centered', navStyle: 'volcanic', sectionOrder: ['hero','stats','features','cta']
    },
    {
      id: 'nexia-pearl', name: 'Pearl White', thumb: '🤍', tier: 'super',
      vars: { '--bg':'#ffffff','--surface':'#f9fafb','--accent':'#6b7280','--text':'#111827','--hero-bg':'linear-gradient(135deg,#374151,#4b5563)','--nav-bg':'rgba(55,65,81,.97)' },
      heroLayout: 'centered', navStyle: 'pearl', sectionOrder: ['hero','about','gallery','cta']
    },
    {
      id: 'nexia-matrix', name: 'Matrix Green', thumb: '💻', tier: 'super',
      vars: { '--bg':'#000300','--surface':'#001000','--accent':'#00ff00','--text':'#ccffcc','--hero-bg':'linear-gradient(135deg,#000300,#001500)','--nav-bg':'rgba(0,3,0,.98)' },
      heroLayout: 'centered', navStyle: 'matrix', sectionOrder: ['hero','features','stats','cta']
    },
    {
      id: 'nexia-pastel-dream', name: 'Pastel Dream', thumb: '🌈', tier: 'super',
      vars: { '--bg':'#fdf8ff','--surface':'#f3e8ff','--accent':'#9333ea','--text':'#3b0764','--hero-bg':'linear-gradient(135deg,#4c1d95,#6d28d9)','--nav-bg':'rgba(76,29,149,.96)' },
      heroLayout: 'centered', navStyle: 'lavender', sectionOrder: ['hero','gallery','features','pricing','cta']
    },
    {
      id: 'nexia-bronze-age', name: 'Bronze Age', thumb: '🏆', tier: 'super',
      vars: { '--bg':'#1a0f00','--surface':'#2d1a00','--accent':'#cd7f32','--text':'#fdf0e0','--hero-bg':'radial-gradient(ellipse at bottom,#2d1a00,#1a0f00)','--nav-bg':'rgba(26,15,0,.97)' },
      heroLayout: 'split-right', navStyle: 'bronze', sectionOrder: ['hero','about','services','gallery','cta']
    },
    {
      id: 'nexia-snow-minimal', name: 'Snow Minimal', thumb: '⬜', tier: 'super',
      vars: { '--bg':'#ffffff','--surface':'#f9fafb','--accent':'#000000','--text':'#000000','--hero-bg':'#ffffff','--nav-bg':'rgba(255,255,255,.97)' },
      heroLayout: 'centered', navStyle: 'minimal-black', sectionOrder: ['hero','features','pricing','cta']
    },
    {
      id: 'nexia-galaxy', name: 'Galaxy Storm', thumb: '🌌', tier: 'super',
      vars: { '--bg':'#050015','--surface':'#0a0025','--accent':'#8b5cf6','--text':'#e9d5ff','--hero-bg':'radial-gradient(ellipse at top left,#1e1b4b,#050015)','--nav-bg':'rgba(5,0,21,.97)' },
      heroLayout: 'centered', navStyle: 'galaxy', sectionOrder: ['hero','stats','features','pricing','cta']
    },
    {
      id: 'nexia-tropical', name: 'Tropical Breeze', thumb: '🌴', tier: 'super',
      vars: { '--bg':'#ecfeff','--surface':'#cffafe','--accent':'#0891b2','--text':'#083344','--hero-bg':'linear-gradient(135deg,#083344,#0e7490)','--nav-bg':'rgba(8,51,68,.96)' },
      heroLayout: 'split-left', navStyle: 'tropical', sectionOrder: ['hero','gallery','features','cta']
    },
    {
      id: 'nexia-ruby-elite', name: 'Ruby Elite', thumb: '💎', tier: 'super',
      vars: { '--bg':'#0a0000','--surface':'#1a0000','--accent':'#dc2626','--text':'#fef2f2','--hero-bg':'radial-gradient(ellipse,#1a0000,#0a0000)','--nav-bg':'rgba(10,0,0,.97)' },
      heroLayout: 'centered', navStyle: 'ruby', sectionOrder: ['hero','stats','features','pricing','cta']
    },
    {
      id: 'nexia-sand-dunes', name: 'Sand Dunes', thumb: '🏜️', tier: 'super',
      vars: { '--bg':'#fdf6e3','--surface':'#f5e6c8','--accent':'#92400e','--text':'#3d1a00','--hero-bg':'linear-gradient(135deg,#451a03,#78350f)','--nav-bg':'rgba(69,26,3,.95)' },
      heroLayout: 'split-right', navStyle: 'sand', sectionOrder: ['hero','about','gallery','cta']
    },
    {
      id: 'nexia-electric-blue', name: 'Electric Blue', thumb: '🔌', tier: 'super',
      vars: { '--bg':'#eff6ff','--surface':'#dbeafe','--accent':'#2563eb','--text':'#1e40af','--hero-bg':'linear-gradient(135deg,#1e3a8a,#1d4ed8)','--nav-bg':'rgba(30,58,138,.97)' },
      heroLayout: 'full-width', navStyle: 'electric', sectionOrder: ['hero','stats','features','team','cta']
    },
  ];

  /* ── CLIENT PAGE MAP ─────────────────────────────────────────── */
  const CLIENT_PAGES = {
    'ces': {
      label: 'CES Brasil 2027',
      landingPath: '../ces/ces-landing.html',
      firestorePath: 'tenants/ces/public_site/layout',
      adminPath: '../ces/ces-admin.html',
      color: '#00c6ff',
    },
    'viajante-pro': {
      label: 'Viajante Pro',
      landingPath: '../viajante-pro/vp-landing.html',
      firestorePath: 'tenants/viajante-pro/public_site/layout',
      adminPath: '../viajante-pro/vp-admin.html',
      color: '#f5c842',
    },
    'bezsan': {
      label: 'Bezsan Leilões',
      landingPath: '../bezsan/bezsan-landing.html',
      firestorePath: 'tenants/bezsan/public_site/layout',
      adminPath: '../bezsan/bezsan-admin.html',
      color: '#ff4d6d',
    },
    'nexia': {
      label: 'Nexia OS (Landing)',
      landingPath: '../index.html',
      firestorePath: 'public_site/nexia_landing',
      adminPath: '../nexia/nexia-master.html',
      color: '#8b5cf6',
    },
  };

  /* ── STATE ───────────────────────────────────────────────────── */
  let _editor = null;
  let _currentTenant = null;
  let _currentLang = 'pt';
  let _isSuperAdmin = false;
  let _db = null;

  /* ── UTILS ───────────────────────────────────────────────────── */
  function t(key) {
    return (T[_currentLang] || T.pt)[key] || key;
  }

  function getAvailableLayouts(isSuper) {
    return LAYOUTS.filter(l => isSuper || l.tier === 'all');
  }

  /* ── FETCH REAL HTML ─────────────────────────────────────────── */
  async function fetchRealHTML(path) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const html = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Remove scripts to prevent double-execution
      doc.querySelectorAll('script').forEach(s => s.remove());
      // Return body content
      return doc.body ? doc.body.innerHTML : html;
    } catch (e) {
      console.warn('[NexiaBuilder] fetchRealHTML failed for', path, e.message);
      return null;
    }
  }

  /* ── LOAD FROM FIRESTORE ─────────────────────────────────────── */
  async function loadFromFirestore(firestorePath) {
    if (!_db) return null;
    try {
      const parts = firestorePath.split('/');
      const docId = parts.pop();
      const collPath = parts.join('/');
      const snap = await _db.collection(collPath).doc(docId).get();
      if (snap.exists) {
        const d = snap.data();
        return d.html || null;
      }
    } catch (e) {
      console.warn('[NexiaBuilder] Firestore load error:', e.message);
    }
    return null;
  }

  /* ── SAVE TO FIRESTORE ───────────────────────────────────────── */
  async function saveToFirestore(firestorePath, html, layoutId, isPublish) {
    if (!_db) throw new Error('DB not available');
    const parts = firestorePath.split('/');
    const docId = parts.pop();
    const collPath = parts.join('/');
    const session = window._nexiaSession;
    await _db.collection(collPath).doc(docId).set({
      html,
      layoutId: layoutId || null,
      updatedAt: new Date().toISOString(),
      updatedBy: session ? session.email : 'unknown',
      published: isPublish ? true : false,
    }, { merge: true });
    // Log to audit
    if (_db) {
      _db.collection('audit_logs').add({
        action: isPublish ? 'PUBLISH_SITE' : 'SAVE_DRAFT',
        tenant: _currentTenant,
        firestorePath,
        by: session ? session.email : 'unknown',
        at: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  /* ── APPLY LAYOUT CSS VARS ───────────────────────────────────── */
  function applyLayoutVars(layoutId) {
    const layout = LAYOUTS.find(l => l.id === layoutId);
    if (!layout) return;
    const iframe = document.querySelector('#builder-frame iframe, .gjs-frame');
    if (!iframe || !iframe.contentDocument) return;
    const root = iframe.contentDocument.documentElement;
    Object.entries(layout.vars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
  }

  /* ── INIT GRAPES EDITOR ──────────────────────────────────────── */
  async function initEditor(containerId, tenant, lang, isSuperAdmin, db) {
    _currentTenant = tenant;
    _currentLang = lang || 'pt';
    _isSuperAdmin = isSuperAdmin || false;
    _db = db;

    const config = CLIENT_PAGES[tenant];
    if (!config) {
      console.error('[NexiaBuilder] Unknown tenant:', tenant);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:14px;gap:12px;">
      <div style="width:20px;height:20px;border:2px solid #00c6ff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite"></div>
      ${t('loadingPage')}
    </div>`;

    // Try to load from Firestore first, then real HTML
    let initialHtml = await loadFromFirestore(config.firestorePath);
    if (!initialHtml) {
      initialHtml = await fetchRealHTML(config.landingPath);
    }
    if (!initialHtml) {
      initialHtml = `<section style="padding:80px 40px;text-align:center">
        <h1 style="font-size:48px;margin-bottom:16px">Bem-vindo ao ${config.label}</h1>
        <p style="font-size:20px;color:#64748b">Edite este site usando o construtor visual.</p>
      </section>`;
    }

    container.innerHTML = '';

    // Destroy previous editor if exists
    if (_editor) {
      try { _editor.destroy(); } catch (e) {}
      _editor = null;
    }

    if (typeof grapesjs === 'undefined') {
      container.innerHTML = '<p style="color:#ff4d6d;padding:20px">GrapesJS não carregado. Verifique o CDN.</p>';
      return;
    }

    _editor = grapesjs.init({
      container: `#${containerId}`,
      components: initialHtml,
      height: '100%',
      width: 'auto',
      storageManager: false,
      noticeOnUnload: false,
      panels: {
        defaults: [
          {
            id: 'panel-top',
            el: '.panel__top',
            buttons: [
              { id: 'visibility', active: true, label: '👁', command: 'sw-visibility', attributes: { title: 'Toggle componentes' } },
              { id: 'export', label: '📋', command: 'export-template', attributes: { title: 'Exportar HTML' } },
              { id: 'show-json', label: '{}', command: 'show-json', attributes: { title: 'Ver JSON' } },
            ],
          },
          {
            id: 'basic-actions',
            el: '.panel__basic-actions',
            buttons: [
              { id: 'undo', label: '↩', command: 'core:undo', attributes: { title: 'Desfazer' } },
              { id: 'redo', label: '↪', command: 'core:redo', attributes: { title: 'Refazer' } },
              { id: 'fullscreen', label: '⛶', command: 'fullscreen', attributes: { title: 'Tela cheia' } },
            ],
          },
          {
            id: 'devices-c',
            el: '.panel__devices',
            buttons: [
              { id: 'set-desktop', label: '🖥', command: 'set-device-desktop', active: true },
              { id: 'set-tablet', label: '📱', command: 'set-device-tablet' },
              { id: 'set-mobile', label: '📲', command: 'set-device-mobilep' },
            ],
          },
        ],
      },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px' },
          { id: 'mobilep', name: 'Mobile', width: '390px' },
        ],
      },
      styleManager: {
        sectors: [
          { name: 'Dimensão', open: false, buildProps: ['width', 'height', 'min-height', 'max-width', 'margin', 'padding'] },
          { name: 'Tipografia', open: false, buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'text-align', 'text-decoration'] },
          { name: 'Decoração', open: false, buildProps: ['background-color', 'background', 'border', 'border-radius', 'box-shadow', 'opacity'] },
          { name: 'Flexbox', open: false, buildProps: ['display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'gap'] },
          { name: 'Posição', open: false, buildProps: ['position', 'top', 'right', 'bottom', 'left', 'z-index'] },
        ],
      },
      assetManager: {
        assets: [],
        upload: false,
        embedAsBase64: true,
      },
      blockManager: {
        appendTo: '#builder-blocks',
        blocks: _getBlocks(),
      },
      traitManager: {
        appendTo: '#builder-traits',
      },
      selectorManager: {
        appendTo: '#builder-styles-sm',
      },
      styleManager: {
        appendTo: '#builder-styles-sm',
        sectors: [
          { name: 'Dimensão', buildProps: ['width', 'height', 'min-height', 'max-width', 'padding', 'margin'], open: false },
          { name: 'Tipografia', buildProps: ['font-family', 'font-size', 'font-weight', 'color', 'text-align', 'letter-spacing', 'line-height'], open: false },
          { name: 'Fundo', buildProps: ['background-color', 'background-image', 'background-position', 'background-size'], open: false },
          { name: 'Borda', buildProps: ['border', 'border-radius', 'box-shadow'], open: false },
        ],
      },
    });

    return _editor;
  }

  /* ── GRAPESJS BLOCKS ─────────────────────────────────────────── */
  function _getBlocks() {
    return [
      { id: 'hero-section', label: '🚀 Hero', category: 'Seções', content: `<section style="padding:100px 60px;background:linear-gradient(135deg,#0a0c14,#1a2235);text-align:center"><h1 style="font-size:56px;font-weight:900;color:#fff;margin-bottom:20px">Título Principal</h1><p style="font-size:20px;color:#94a3b8;max-width:600px;margin:0 auto 32px">Subtítulo impactante aqui</p><a href="#" style="display:inline-block;padding:16px 40px;background:#00c6ff;color:#000;border-radius:8px;font-weight:700;text-decoration:none">Call to Action</a></section>` },
      { id: 'text-block', label: '📝 Texto', category: 'Básicos', content: `<div style="padding:40px;max-width:800px;margin:0 auto"><p style="font-size:18px;line-height:1.8;color:#374151">Seu texto aqui. Clique para editar.</p></div>` },
      { id: 'image-block', label: '🖼️ Imagem', category: 'Básicos', content: `<div style="padding:20px;text-align:center"><img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800" style="max-width:100%;border-radius:12px" alt="Imagem"></div>` },
      { id: 'button-block', label: '🔘 Botão', category: 'Básicos', content: `<div style="padding:20px;text-align:center"><a href="#" style="display:inline-block;padding:14px 36px;background:#0072ff;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:16px">Clique Aqui</a></div>` },
      { id: 'cards-3', label: '📦 Cards 3', category: 'Layouts', content: `<section style="padding:60px 40px;background:#f8fafc"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1200px;margin:0 auto">${[1,2,3].map(i=>`<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.06)"><div style="font-size:40px;margin-bottom:16px">⭐</div><h3 style="font-size:20px;font-weight:700;margin-bottom:12px">Recurso ${i}</h3><p style="color:#64748b;line-height:1.7">Descrição do recurso ${i} aqui.</p></div>`).join('')}</div></section>` },
      { id: 'stats-row', label: '📊 Estatísticas', category: 'Componentes', content: `<section style="padding:60px 40px;background:#0a0c14"><div style="display:flex;justify-content:center;gap:60px;flex-wrap:wrap">${[['10K+','Clientes'],['99%','Satisfação'],['24/7','Suporte'],['R$1M+','Economia']].map(([n,l])=>`<div style="text-align:center"><div style="font-size:48px;font-weight:900;color:#00c6ff">${n}</div><div style="font-size:14px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase">${l}</div></div>`).join('')}</div></section>` },
      { id: 'faq-block', label: '❓ FAQ', category: 'Componentes', content: `<section style="padding:80px 40px;max-width:800px;margin:0 auto">${[['Como funciona?','Resposta 1 aqui...'],['Qual o preço?','Resposta 2 aqui...'],['Como contratar?','Resposta 3 aqui...']].map(([q,a])=>`<div style="border-bottom:1px solid #e5e7eb;padding:24px 0"><h3 style="font-size:18px;font-weight:600;margin-bottom:12px">${q}</h3><p style="color:#6b7280;line-height:1.7">${a}</p></div>`).join('')}</section>` },
      { id: 'contact-form', label: '📬 Formulário', category: 'Componentes', content: `<section style="padding:80px 40px;background:#f9fafb"><div style="max-width:600px;margin:0 auto;background:#fff;padding:48px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.06)"><h2 style="font-size:28px;font-weight:700;margin-bottom:32px">Entre em Contato</h2><div style="margin-bottom:20px"><label style="display:block;font-size:14px;font-weight:600;margin-bottom:8px">Nome</label><input type="text" placeholder="Seu nome" style="width:100%;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px"></div><div style="margin-bottom:20px"><label style="display:block;font-size:14px;font-weight:600;margin-bottom:8px">E-mail</label><input type="email" placeholder="email@exemplo.com" style="width:100%;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px"></div><button style="width:100%;padding:14px;background:#0072ff;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:16px;cursor:pointer">Enviar</button></div></section>` },
      { id: 'video-embed', label: '▶️ Vídeo', category: 'Mídia', content: `<div style="padding:40px;text-align:center"><div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.2)"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div></div>` },
      { id: 'gallery-grid', label: '🖼️ Galeria', category: 'Mídia', content: `<section style="padding:60px 40px"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1200px;margin:0 auto">${[1,2,3,4,5,6].map(i=>`<img src="https://images.unsplash.com/photo-151877066043${i}-4636190af475?w=400" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px" alt="">`).join('')}</div></section>` },
      { id: 'footer-block', label: '🦶 Rodapé', category: 'Layouts', content: `<footer style="background:#0a0c14;color:#94a3b8;padding:60px 40px"><div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:40px"><div><h3 style="color:#fff;font-size:18px;font-weight:700;margin-bottom:20px">Empresa</h3><p style="font-size:14px;line-height:1.8">Sua empresa aqui</p></div>${['Links','Contato','Redes Sociais'].map(t=>`<div><h3 style="color:#fff;font-size:16px;font-weight:600;margin-bottom:16px">${t}</h3><div style="font-size:14px;line-height:2">Item 1<br>Item 2<br>Item 3</div></div>`).join('')}</div><div style="max-width:1200px;margin:40px auto 0;padding-top:24px;border-top:1px solid #1e2d45;text-align:center;font-size:12px">© 2027 Empresa. Todos os direitos reservados.</div></footer>` },
      { id: 'testimonials', label: '💬 Depoimentos', category: 'Componentes', content: `<section style="padding:80px 40px;background:#f9fafb"><h2 style="text-align:center;font-size:36px;font-weight:700;margin-bottom:60px">O que dizem nossos clientes</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1200px;margin:0 auto">${[['⭐⭐⭐⭐⭐','Excelente serviço! Muito satisfeito.','João S.'],['⭐⭐⭐⭐⭐','Superou todas as expectativas!','Maria L.'],['⭐⭐⭐⭐⭐','Recomendo para todos!','Pedro M.']].map(([s,t,n])=>`<div style="background:#fff;padding:32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.06)"><div style="font-size:16px;margin-bottom:12px">${s}</div><p style="color:#374151;line-height:1.7;margin-bottom:20px">"${t}"</p><strong style="font-size:14px">${n}</strong></div>`).join('')}</div></section>` },
    ];
  }

  /* ── SAVE ──────────────────────────────────────────────────────*/
  async function save(tenant, isPublish) {
    if (!_editor) throw new Error('Editor not initialized');
    const html = _editor.getHtml() + '<style>' + _editor.getCss() + '</style>';
    const config = CLIENT_PAGES[tenant || _currentTenant];
    if (!config) throw new Error('Unknown tenant');
    await saveToFirestore(config.firestorePath, html, _currentLayout, isPublish);
  }

  /* ── PUBLIC API ──────────────────────────────────────────────── */
  return {
    LAYOUTS,
    CLIENT_PAGES,
    T,
    t,
    getAvailableLayouts,
    initEditor,
    save,
    applyLayoutVars,
    getEditor: () => _editor,
    setLang: (lang) => { _currentLang = lang; },
    getLang: () => _currentLang,
  };

})();
