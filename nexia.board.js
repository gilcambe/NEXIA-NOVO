/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA OS — NEXIA BUILDER UI v4.0 · PATCH V13
 * ---------------------------------------------------------------
 * FIXES v4.0:
 *  1. GrapesJS: resolve "appendTo element not found" e
 *     "SelectComponent null parentNode" — DOM garantido antes do init.
 *  2. Sem travamento ao sair do builder (destroi instância GJS).
 *  3. Site Builder edita QUALQUER conteúdo da landing e do app:
 *     textos, imagens, PIX, redes sociais, botões, banners, hero.
 *  4. Cliente (CLIENT_ADMIN) e Master (SUPER_ADMIN) têm acesso total.
 *  5. Layouts mudam TODO o layout da página (não só cores).
 * ═══════════════════════════════════════════════════════════════════
 */
'use strict';

window.NexiaBuilderUI = (function () {

  /* ── I18N labels ─────────────────────────────────────────────── */
  var T = {
    pt: {
      title: '🏗️ Construtor Visual',
      selectPage: 'Selecionar Página',
      landing: 'Landing Page',
      passenger: 'App Passageiro',
      guide: 'App Guia',
      save: '💾 Salvar Rascunho',
      publish: '🚀 Publicar Site',
      layouts: '🎨 Layouts',
      preview: '👁 Preview',
      desktop: '🖥 Desktop',
      tablet: '📱 Tablet',
      mobile: '📲 Mobile',
      blocks: '📦 Blocos',
      styles: '🎨 Estilos',
      props: '⚙️ Propriedades',
      saving: '⏳ Salvando...',
      publishing: '⏳ Publicando...',
      saved: '✅ Salvo!',
      published: '✅ Publicado!',
      loaded: '✅ Página carregada!',
      exit: '✕ Fechar Builder',
      layout_title: 'Escolher Layout',
      layout_sub: 'Selecione um layout. O conteúdo atual será substituído.',
      layout_apply: 'Aplicar Layout',
      layout_cancel: 'Cancelar',
      pix_title: '💳 Dados de Pagamento',
      social_title: '🔗 Redes Sociais',
      edit_title: '✏️ Editar Conteúdo',
      hero_title: '🖼️ Banner Principal',
    },
    en: {
      title: '🏗️ Visual Builder',
      selectPage: 'Select Page',
      landing: 'Landing Page',
      passenger: 'Passenger App',
      guide: 'Guide App',
      save: '💾 Save Draft',
      publish: '🚀 Publish Site',
      layouts: '🎨 Layouts',
      preview: '👁 Preview',
      desktop: '🖥 Desktop',
      tablet: '📱 Tablet',
      mobile: '📲 Mobile',
      blocks: '📦 Blocks',
      styles: '🎨 Styles',
      props: '⚙️ Properties',
      saving: '⏳ Saving...',
      publishing: '⏳ Publishing...',
      saved: '✅ Saved!',
      published: '✅ Published!',
      loaded: '✅ Page loaded!',
      exit: '✕ Close Builder',
      layout_title: 'Choose Layout',
      layout_sub: 'Select a layout. Current content will be replaced.',
      layout_apply: 'Apply Layout',
      layout_cancel: 'Cancel',
      pix_title: '💳 Payment Data',
      social_title: '🔗 Social Media',
      edit_title: '✏️ Edit Content',
      hero_title: '🖼️ Hero Banner',
    },
    es: {
      title: '🏗️ Constructor Visual',
      selectPage: 'Seleccionar Página',
      landing: 'Página de Inicio',
      passenger: 'App Pasajero',
      guide: 'App Guía',
      save: '💾 Guardar Borrador',
      publish: '🚀 Publicar Sitio',
      layouts: '🎨 Diseños',
      preview: '👁 Vista Previa',
      desktop: '🖥 Escritorio',
      tablet: '📱 Tableta',
      mobile: '📲 Móvil',
      blocks: '📦 Bloques',
      styles: '🎨 Estilos',
      props: '⚙️ Propiedades',
      saving: '⏳ Guardando...',
      publishing: '⏳ Publicando...',
      saved: '✅ ¡Guardado!',
      published: '✅ ¡Publicado!',
      loaded: '✅ ¡Cargado!',
      exit: '✕ Cerrar Constructor',
      layout_title: 'Elegir Diseño',
      layout_sub: 'Seleccione un diseño. El contenido actual será reemplazado.',
      layout_apply: 'Aplicar Diseño',
      layout_cancel: 'Cancelar',
      pix_title: '💳 Datos de Pago',
      social_title: '🔗 Redes Sociales',
      edit_title: '✏️ Editar Contenido',
      hero_title: '🖼️ Banner Principal',
    }
  };

  /* ── LAYOUTS (30 opções com estrutura real) ──────────────────── */
  var LAYOUTS = [
    { id:'light-clean',    name:'Light Clean',       emoji:'☀️', tier:'all',   bg:'#FAF8F5', surface:'#ffffff', accent:'#0071e3', text:'#1d1d1f', heroType:'centered', navStyle:'solid'    },
    { id:'dark-nexia',     name:'NEXIA Dark',        emoji:'🌑', tier:'all',   bg:'#0a0c14', surface:'#111827', accent:'#00c6ff', text:'#e2e8f0', heroType:'fullbg',  navStyle:'glass'    },
    { id:'gold-luxury',    name:'Gold Luxury',        emoji:'✨', tier:'all',   bg:'#0c0a05', surface:'#1a1505', accent:'#f5c842', text:'#faf8f0', heroType:'split-l', navStyle:'dark'     },
    { id:'emerald-tech',   name:'Emerald Tech',       emoji:'💚', tier:'all',   bg:'#f0fdf4', surface:'#dcfce7', accent:'#16a34a', text:'#14532d', heroType:'split-r', navStyle:'minimal'  },
    { id:'violet-split',   name:'Violet Split',       emoji:'🟣', tier:'all',   bg:'#faf5ff', surface:'#f3e8ff', accent:'#9333ea', text:'#3b0764', heroType:'columns', navStyle:'glass'    },
    { id:'cobalt-corp',    name:'Cobalt Corporate',   emoji:'🔵', tier:'all',   bg:'#eff6ff', surface:'#dbeafe', accent:'#1d4ed8', text:'#1e3a8a', heroType:'centered', navStyle:'solid'   },
    { id:'rose-modern',    name:'Rose Modern',        emoji:'🌸', tier:'all',   bg:'#fff1f2', surface:'#ffe4e6', accent:'#e11d48', text:'#881337', heroType:'hero-xl', navStyle:'minimal'  },
    { id:'warmth-cream',   name:'Warmth Cream',       emoji:'🤍', tier:'all',   bg:'#FFFBF5', surface:'#FFF7EE', accent:'#C2853A', text:'#2D1B00', heroType:'split-l', navStyle:'solid'    },
    { id:'midnight-dark',  name:'Midnight Dark',      emoji:'🌚', tier:'all',   bg:'#050015', surface:'#0a0025', accent:'#8b5cf6', text:'#e9d5ff', heroType:'fullbg',  navStyle:'glass'    },
    { id:'ocean-teal',     name:'Ocean Teal',         emoji:'🌊', tier:'all',   bg:'#f0fdfa', surface:'#ccfbf1', accent:'#0d9488', text:'#134e4a', heroType:'centered', navStyle:'minimal' },
    { id:'neon-cyber',     name:'Neon Cyber',         emoji:'⚡', tier:'super', bg:'#000510', surface:'#000d1f', accent:'#00ff88', text:'#d0ffe8', heroType:'fullbg',  navStyle:'glass'    },
    { id:'arctic-white',   name:'Arctic White',       emoji:'❄️', tier:'super', bg:'#f0f9ff', surface:'#e0f2fe', accent:'#0284c7', text:'#0c4a6e', heroType:'split-r', navStyle:'solid'    },
    { id:'forest-deep',    name:'Forest Deep',        emoji:'🌲', tier:'super', bg:'#f0fdf4', surface:'#d1fae5', accent:'#047857', text:'#064e3b', heroType:'hero-xl', navStyle:'minimal'  },
    { id:'volcanic-red',   name:'Volcanic Red',       emoji:'🌋', tier:'super', bg:'#0c0000', surface:'#1c0000', accent:'#ff3d00', text:'#ffe8e0', heroType:'fullbg',  navStyle:'dark'     },
    { id:'flamingo-pop',   name:'Flamingo Pop',       emoji:'🦩', tier:'super', bg:'#fdf2f8', surface:'#fce7f3', accent:'#db2777', text:'#500724', heroType:'columns', navStyle:'glass'    },
    { id:'amber-glow',     name:'Amber Glow',         emoji:'🟡', tier:'super', bg:'#fffbeb', surface:'#fef3c7', accent:'#d97706', text:'#451a03', heroType:'split-l', navStyle:'solid'    },
    { id:'matrix-green',   name:'Matrix Green',       emoji:'💻', tier:'super', bg:'#000300', surface:'#001000', accent:'#00ff00', text:'#ccffcc', heroType:'fullbg',  navStyle:'dark'     },
    { id:'ruby-elite',     name:'Ruby Elite',         emoji:'💎', tier:'super', bg:'#0a0000', surface:'#1a0000', accent:'#dc2626', text:'#fef2f2', heroType:'hero-xl', navStyle:'dark'     },
    { id:'bronze-age',     name:'Bronze Age',         emoji:'🏆', tier:'super', bg:'#1a0f00', surface:'#2d1a00', accent:'#cd7f32', text:'#fdf0e0', heroType:'centered', navStyle:'dark'    },
    { id:'galaxy-storm',   name:'Galaxy Storm',       emoji:'🌌', tier:'super', bg:'#050015', surface:'#0a0025', accent:'#8b5cf6', text:'#e9d5ff', heroType:'fullbg',  navStyle:'glass'    },
    { id:'tropical',       name:'Tropical Breeze',    emoji:'🌴', tier:'super', bg:'#ecfeff', surface:'#cffafe', accent:'#0891b2', text:'#083344', heroType:'split-r', navStyle:'solid'    },
    { id:'pearl-minimal',  name:'Pearl Minimal',      emoji:'⬜', tier:'super', bg:'#ffffff', surface:'#f9fafb', accent:'#111827', text:'#000000', heroType:'minimal', navStyle:'minimal'  },
    { id:'sand-dunes',     name:'Sand Dunes',         emoji:'🏜️', tier:'super', bg:'#fdf6e3', surface:'#f5e6c8', accent:'#92400e', text:'#3d1a00', heroType:'split-l', navStyle:'solid'    },
    { id:'cobalt-steel',   name:'Cobalt Steel',       emoji:'🔷', tier:'super', bg:'#eff6ff', surface:'#dbeafe', accent:'#2563eb', text:'#1e40af', heroType:'centered', navStyle:'solid'   },
    { id:'electric-blue',  name:'Electric Blue',      emoji:'🔌', tier:'super', bg:'#eff6ff', surface:'#dbeafe', accent:'#06b6d4', text:'#0e7490', heroType:'columns', navStyle:'glass'    },
    { id:'slate-pro',      name:'Slate Pro',          emoji:'🩶', tier:'super', bg:'#f8fafc', surface:'#f1f5f9', accent:'#475569', text:'#0f172a', heroType:'minimal', navStyle:'solid'    },
    { id:'pastel-dream',   name:'Pastel Dream',       emoji:'🌈', tier:'super', bg:'#fdf8ff', surface:'#f3e8ff', accent:'#9333ea', text:'#3b0764', heroType:'centered', navStyle:'minimal' },
    { id:'arctic-storm',   name:'Arctic Storm',       emoji:'🌨️', tier:'super', bg:'#f0f9ff', surface:'#e0f2fe', accent:'#7c3aed', text:'#1e1b4b', heroType:'hero-xl', navStyle:'dark'    },
    { id:'midnight-gold',  name:'Midnight Gold',      emoji:'🌟', tier:'super', bg:'#0a0c05', surface:'#14180a', accent:'#eab308', text:'#fefce8', heroType:'fullbg',  navStyle:'glass'    },
    { id:'sunset-orange',  name:'Sunset Orange',      emoji:'🌅', tier:'super', bg:'#fff7ed', surface:'#ffedd5', accent:'#ea580c', text:'#431407', heroType:'split-r', navStyle:'solid'    },
  ];

  /* ── PÁGINAS DISPONÍVEIS POR TENANT ─────────────────────────── */
  var CLIENT_PAGES = {
    'viajante-pro': [
      { id:'landing',   label:{pt:'Landing Page',   en:'Landing Page', es:'Página Inicio'}, path:'/viajante-pro/vp-landing.html',   fsPath:'tenants/viajante-pro/public_site/landing' },
      { id:'passenger', label:{pt:'App Passageiro', en:'Passenger App',es:'App Pasajero'},  path:'/viajante-pro/vp-passenger.html', fsPath:'tenants/viajante-pro/public_site/passenger' },
    ],
    'ces': [
      { id:'landing',   label:{pt:'Landing CES',    en:'CES Landing',  es:'Inicio CES'},    path:'/ces/ces-landing.html',          fsPath:'tenants/ces/public_site/landing' },
      { id:'executivo', label:{pt:'App Executivo',  en:'Executive App',es:'App Ejecutivo'}, path:'/ces/ces-app-executivo.html',    fsPath:'tenants/ces/public_site/executivo' },
    ],
    'bezsan': [
      { id:'landing',   label:{pt:'Landing Bezsan', en:'Bezsan Landing',es:'Inicio Bezsan'}, path:'/bezsan/bezsan-landing.html',   fsPath:'tenants/bezsan/public_site/landing' },
      { id:'app',       label:{pt:'App Bezsan',     en:'Bezsan App',   es:'App Bezsan'},     path:'/bezsan/bezsan-app.html',       fsPath:'tenants/bezsan/public_site/app' },
    ],
  };

  /* ── ESTADO INTERNO ─────────────────────────────────────────── */
  var _gjsInstance = null;
  var _containerId = null;
  var _tenant = null;
  var _lang = 'pt';
  var _isSuperAdmin = false;
  var _db = null;
  var _currentPage = null;
  var _wrapId = 'nexia-builder-wrap';

  /* ── DESTRÓI INSTÂNCIA GJS EXISTENTE ────────────────────────── */
  function _destroyGJS() {
    if (_gjsInstance) {
      try { _gjsInstance.destroy(); } catch(e) {}
      _gjsInstance = null;
    }
  }

  /* ── CSS BUILDER ────────────────────────────────────────────── */
  var BUILDER_CSS = `
    #nexia-builder-wrap {
      position: fixed; inset: 0; z-index: 10000;
      background: #FAF8F5; display: flex; flex-direction: column;
      font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #nexia-builder-wrap * { box-sizing: border-box; }
    #nb-toolbar {
      height: 52px; background: #1d1d1f; display: flex;
      align-items: center; gap: 8px; padding: 0 16px; flex-shrink: 0;
      border-bottom: 1px solid #333;
    }
    #nb-toolbar .nb-title { color: #fff; font-size: 14px; font-weight: 700; margin-right: 8px; }
    #nb-toolbar select {
      background: #2d2d2f; border: 1px solid #444; color: #fff;
      padding: 5px 10px; border-radius: 6px; font-size: 12px;
      font-family: inherit; cursor: pointer;
    }
    .nb-btn {
      padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid #444; background: #2d2d2f; color: #ccc;
      font-family: inherit; transition: all 0.15s; white-space: nowrap;
    }
    .nb-btn:hover { background: #3d3d3f; color: #fff; }
    .nb-btn.nb-primary { background: #0071e3; border-color: #0071e3; color: #fff; }
    .nb-btn.nb-primary:hover { background: #0077ed; }
    .nb-btn.nb-success { background: #1c7a3d; border-color: #1c7a3d; color: #fff; }
    .nb-btn.nb-exit { background: transparent; border-color: #ff453a; color: #ff453a; margin-left: auto; }
    .nb-btn.nb-exit:hover { background: rgba(255,69,58,0.15); }
    .nb-sep { width: 1px; height: 24px; background: #444; margin: 0 4px; flex-shrink: 0; }
    #nb-body { flex: 1; display: flex; overflow: hidden; }
    #nb-left-panel {
      width: 220px; background: #1d1d1f; border-right: 1px solid #333;
      display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
    }
    #nb-tabs { display: flex; border-bottom: 1px solid #333; }
    .nb-tab {
      flex: 1; padding: 10px 4px; text-align: center; font-size: 11px;
      color: #888; cursor: pointer; transition: all 0.15s; font-family: inherit;
      border: none; background: none; font-weight: 600;
    }
    .nb-tab.active { color: #0071e3; border-bottom: 2px solid #0071e3; }
    #nb-blocks-panel { flex: 1; overflow-y: auto; padding: 8px; }
    #nb-styles-panel { flex: 1; overflow-y: auto; padding: 8px; display: none; }
    #nb-props-panel  { flex: 1; overflow-y: auto; padding: 8px; display: none; }
    #nb-content-panel { flex: 1; overflow-y: auto; padding: 8px; display: none; }
    #nb-canvas-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    #gjs { flex: 1; }
    /* GrapesJS overrides */
    .gjs-cv-canvas { background: #f5f5f5 !important; }
    .gjs-pn-panels { display: none !important; }
    /* Tabs */
    .nb-panel-section { margin-bottom: 12px; }
    .nb-panel-title { font-size: 10px; font-weight: 700; color: #666; letter-spacing: 1px; text-transform: uppercase; padding: 4px 0; margin-bottom: 6px; }
    .nb-block {
      background: #2d2d2f; border: 1px solid #444; border-radius: 8px;
      padding: 10px 8px; margin-bottom: 6px; cursor: pointer; font-size: 11px;
      color: #ccc; display: flex; align-items: center; gap: 8px;
      transition: all 0.15s;
    }
    .nb-block:hover { border-color: #0071e3; color: #fff; background: #1a3a6e; }
    /* Quick Edit */
    .nb-field-group { margin-bottom: 12px; }
    .nb-field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
    .nb-field-input {
      width: 100%; padding: 7px 10px; border-radius: 6px;
      border: 1px solid #444; background: #2d2d2f; color: #fff;
      font-size: 12px; font-family: inherit; outline: none;
    }
    .nb-field-input:focus { border-color: #0071e3; }
    .nb-save-section { padding: 8px; border-top: 1px solid #333; }
    .nb-save-btn {
      width: 100%; padding: 9px; border-radius: 8px; font-size: 12px; font-weight: 700;
      cursor: pointer; border: none; background: #0071e3; color: #fff; font-family: inherit;
      transition: background 0.15s;
    }
    .nb-save-btn:hover { background: #0077ed; }
    /* Layout modal */
    #nb-layout-modal {
      position: fixed; inset: 0; z-index: 20000; background: rgba(0,0,0,0.85);
      display: flex; align-items: center; justify-content: center;
    }
    .nb-modal-box {
      background: #1d1d1f; border: 1px solid #333; border-radius: 16px;
      padding: 28px; width: 680px; max-width: 95vw; max-height: 85vh;
      overflow-y: auto;
    }
    .nb-modal-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .nb-modal-sub { font-size: 12px; color: #888; margin-bottom: 20px; }
    .nb-layout-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
    .nb-layout-item {
      background: #2d2d2f; border: 2px solid #444; border-radius: 10px;
      padding: 14px 8px; cursor: pointer; text-align: center;
      transition: all 0.15s;
    }
    .nb-layout-item:hover { border-color: #0071e3; background: #1a3a6e; }
    .nb-layout-item.selected { border-color: #0071e3; background: #1a3a6e; }
    .nb-layout-emoji { font-size: 20px; margin-bottom: 4px; }
    .nb-layout-name { font-size: 10px; color: #ccc; }
    .nb-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
    /* Toast */
    #nb-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 30000;
      background: #1d1d1f; border: 1px solid #0071e3; border-radius: 10px;
      padding: 12px 20px; font-size: 13px; color: #fff;
      transform: translateX(200px); opacity: 0; transition: all 0.3s;
    }
    #nb-toast.show { transform: none; opacity: 1; }
  `;

  /* ── INJETA CSS ─────────────────────────────────────────────── */
  function _injectCSS() {
    if (document.getElementById('nexia-builder-css')) return;
    var s = document.createElement('style');
    s.id = 'nexia-builder-css';
    s.textContent = BUILDER_CSS;
    document.head.appendChild(s);
  }

  /* ── TOAST ──────────────────────────────────────────────────── */
  function _toast(msg, duration) {
    var t = document.getElementById('nb-toast');
    if (!t) { t = document.createElement('div'); t.id = 'nb-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, duration || 2500);
  }

  /* ── GERA HTML DO LAYOUT ────────────────────────────────────── */
  function _generateLayoutHTML(layout, pageData) {
    var bg      = layout.bg || '#FAF8F5';
    var surface = layout.surface || '#ffffff';
    var accent  = layout.accent || '#0071e3';
    var text    = layout.text || '#1d1d1f';
    var heroType = layout.heroType || 'centered';

    var siteName  = (pageData && pageData.siteName)  || 'Meu Site';
    var heroTitle = (pageData && pageData.heroTitle) || 'Bem-vindo ao ' + siteName;
    var heroSub   = (pageData && pageData.heroSub)   || 'Sua solução completa.';
    var ctaText   = (pageData && pageData.ctaText)   || 'Saiba Mais';
    var logoSrc   = (pageData && pageData.logoSrc)   || '';
    var pixKey    = (pageData && pageData.pixKey)    || '';
    var instagram = (pageData && pageData.instagram) || '';
    var whatsapp  = (pageData && pageData.whatsapp)  || '';

    var heroHTML = '';
    if (heroType === 'centered') {
      heroHTML = `<section style="background:${bg};padding:80px 20px;text-align:center">
        <h1 style="font-size:3rem;font-weight:800;color:${text};margin-bottom:16px" data-editable="heroTitle">${heroTitle}</h1>
        <p style="font-size:1.2rem;color:${text};opacity:0.7;margin-bottom:32px" data-editable="heroSub">${heroSub}</p>
        <a href="#" style="display:inline-block;background:${accent};color:#fff;padding:16px 40px;border-radius:50px;font-weight:700;font-size:1rem;text-decoration:none" data-editable="ctaText">${ctaText}</a>
      </section>`;
    } else if (heroType === 'split-l') {
      heroHTML = `<section style="background:${bg};padding:60px 40px;display:flex;gap:60px;align-items:center;max-width:1200px;margin:0 auto">
        <div style="flex:1">
          <h1 style="font-size:2.8rem;font-weight:800;color:${text};margin-bottom:16px" data-editable="heroTitle">${heroTitle}</h1>
          <p style="font-size:1.1rem;color:${text};opacity:0.7;margin-bottom:28px" data-editable="heroSub">${heroSub}</p>
          <a href="#" style="display:inline-block;background:${accent};color:#fff;padding:14px 36px;border-radius:50px;font-weight:700;text-decoration:none" data-editable="ctaText">${ctaText}</a>
        </div>
        <div style="flex:1;background:${surface};border-radius:20px;height:300px;display:flex;align-items:center;justify-content:center;color:${accent};font-size:4rem">🏖️</div>
      </section>`;
    } else if (heroType === 'fullbg') {
      heroHTML = `<section style="background:linear-gradient(135deg,${bg},${surface});padding:100px 20px;text-align:center;min-height:500px;display:flex;align-items:center;justify-content:center;flex-direction:column">
        <h1 style="font-size:3.5rem;font-weight:900;color:${accent};margin-bottom:16px;letter-spacing:-1px" data-editable="heroTitle">${heroTitle}</h1>
        <p style="font-size:1.3rem;color:${text};opacity:0.8;margin-bottom:36px;max-width:600px" data-editable="heroSub">${heroSub}</p>
        <a href="#" style="display:inline-block;background:${accent};color:${bg};padding:18px 48px;border-radius:50px;font-weight:800;font-size:1.1rem;text-decoration:none" data-editable="ctaText">${ctaText}</a>
      </section>`;
    } else if (heroType === 'hero-xl') {
      heroHTML = `<section style="background:${bg};padding:120px 20px 80px;text-align:center">
        <div style="display:inline-block;background:${accent};color:${bg};padding:4px 16px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:2px;margin-bottom:20px">NOVO</div>
        <h1 style="font-size:4rem;font-weight:900;color:${text};margin-bottom:16px;max-width:800px;margin-left:auto;margin-right:auto" data-editable="heroTitle">${heroTitle}</h1>
        <p style="font-size:1.3rem;color:${text};opacity:0.65;margin-bottom:40px;max-width:600px;margin-left:auto;margin-right:auto" data-editable="heroSub">${heroSub}</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
          <a href="#" style="display:inline-block;background:${accent};color:#fff;padding:16px 40px;border-radius:50px;font-weight:700;text-decoration:none" data-editable="ctaText">${ctaText}</a>
          <a href="#" style="display:inline-block;background:transparent;color:${accent};padding:16px 40px;border-radius:50px;font-weight:700;text-decoration:none;border:2px solid ${accent}">Saiba mais</a>
        </div>
      </section>`;
    } else {
      /* minimal / columns */
      heroHTML = `<section style="background:${bg};padding:60px 20px;text-align:center">
        <h1 style="font-size:2.5rem;font-weight:800;color:${text};margin-bottom:12px" data-editable="heroTitle">${heroTitle}</h1>
        <p style="color:${text};opacity:0.7;margin-bottom:24px" data-editable="heroSub">${heroSub}</p>
        <a href="#" style="display:inline-block;background:${accent};color:#fff;padding:12px 32px;border-radius:8px;font-weight:700;text-decoration:none" data-editable="ctaText">${ctaText}</a>
      </section>`;
    }

    return `<!DOCTYPE html><html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${siteName}</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:${bg};color:${text};font-family:'Sora',-apple-system,sans-serif}
nav{background:${layout.navStyle==='glass'?'rgba(0,0,0,0.5)':layout.navStyle==='dark'?surface:bg};backdrop-filter:blur(12px);padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(128,128,128,0.15);position:sticky;top:0;z-index:100}
.logo{font-size:1.2rem;font-weight:800;color:${accent}}
.nav-links{display:flex;gap:28px}
.nav-links a{color:${text};text-decoration:none;font-size:0.9rem;opacity:0.8}
.nav-links a:hover{opacity:1;color:${accent}}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;padding:60px 40px;max-width:1200px;margin:0 auto}
.feature-card{background:${surface};border-radius:16px;padding:28px;border:1px solid rgba(128,128,128,0.12)}
.feature-icon{font-size:2.5rem;margin-bottom:16px}
.feature-title{font-size:1.1rem;font-weight:700;margin-bottom:8px;color:${text}}
.feature-text{font-size:0.9rem;opacity:0.7;line-height:1.6;color:${text}}
.pix-section{background:${surface};padding:60px 40px;text-align:center}
.pix-section h2{font-size:2rem;font-weight:800;color:${text};margin-bottom:8px}
.pix-key{background:${bg};border:2px dashed ${accent};border-radius:12px;padding:20px 40px;display:inline-block;font-size:1.2rem;font-weight:700;color:${accent};margin-top:16px;letter-spacing:1px}
.social-bar{background:${bg};padding:40px;text-align:center;border-top:1px solid rgba(128,128,128,0.1)}
.social-bar a{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:${accent};color:#fff;text-decoration:none;font-size:1.2rem;margin:0 6px;transition:transform 0.2s}
.social-bar a:hover{transform:scale(1.15)}
footer{background:${surface};padding:30px 40px;text-align:center;font-size:0.8rem;opacity:0.6;color:${text};border-top:1px solid rgba(128,128,128,0.1)}
</style>
</head>
<body>
<nav>
  <div class="logo" data-editable="siteName">${logoSrc ? '<img src="'+logoSrc+'" style="height:36px;object-fit:contain">' : siteName}</div>
  <div class="nav-links">
    <a href="#">Início</a><a href="#">Serviços</a><a href="#">Sobre</a><a href="#">Contato</a>
  </div>
</nav>

${heroHTML}

<div class="features">
  <div class="feature-card"><div class="feature-icon">✈️</div><div class="feature-title" data-editable="f1title">Viagens Exclusivas</div><div class="feature-text" data-editable="f1text">Destinos selecionados com serviço premium para você.</div></div>
  <div class="feature-card"><div class="feature-icon">🌍</div><div class="feature-title" data-editable="f2title">Destinos Únicos</div><div class="feature-text" data-editable="f2text">Roteiros personalizados pelo mundo todo.</div></div>
  <div class="feature-card"><div class="feature-icon">🏆</div><div class="feature-title" data-editable="f3title">Atendimento 24h</div><div class="feature-text" data-editable="f3text">Suporte completo antes, durante e após sua viagem.</div></div>
</div>

${pixKey ? `<div class="pix-section"><h2>💳 Pagamento via PIX</h2><p style="color:${text};opacity:0.7;margin-top:8px">Transferência rápida e segura</p><div class="pix-key" data-editable="pixKey">${pixKey}</div></div>` : ''}

<div class="social-bar">
  <p style="font-size:0.9rem;margin-bottom:16px;color:${text};opacity:0.7">Siga-nos nas redes sociais</p>
  ${instagram ? `<a href="https://instagram.com/${instagram.replace('@','')}" target="_blank">📷</a>` : ''}
  ${whatsapp  ? `<a href="https://wa.me/${whatsapp.replace(/\D/g,'')}" target="_blank">💬</a>` : ''}
  <a href="#" style="background:${surface};color:${accent}">🌐</a>
</div>

<footer data-editable="footerText">© 2025 ${siteName}. Todos os direitos reservados.</footer>
</body></html>`;
  }

  /* ── CONSTRÓI HTML DO BUILDER ────────────────────────────────── */
  function _buildHTML(tenant, lang, isSuperAdmin) {
    var t = T[lang] || T['pt'];
    var pages = CLIENT_PAGES[tenant] || CLIENT_PAGES['viajante-pro'];
    var pageOptions = pages.map(function(p) {
      return '<option value="' + p.id + '">' + (p.label[lang] || p.label.pt) + '</option>';
    }).join('');

    return `
<div id="${_wrapId}">
  <!-- TOAST -->
  <div id="nb-toast"></div>
  <!-- TOOLBAR -->
  <div id="nb-toolbar">
    <span class="nb-title">${t.title}</span>
    <div class="nb-sep"></div>
    <select id="nb-page-select" title="${t.selectPage}">
      ${pageOptions}
    </select>
    <div class="nb-sep"></div>
    <button class="nb-btn" id="nb-btn-desktop" title="${t.desktop}">🖥</button>
    <button class="nb-btn" id="nb-btn-tablet" title="${t.tablet}">📱</button>
    <button class="nb-btn" id="nb-btn-mobile" title="${t.mobile}">📲</button>
    <div class="nb-sep"></div>
    <button class="nb-btn" id="nb-btn-layouts">${t.layouts}</button>
    <button class="nb-btn nb-primary" id="nb-btn-save">${t.save}</button>
    <button class="nb-btn nb-success" id="nb-btn-publish">${t.publish}</button>
    <button class="nb-btn nb-exit" id="nb-btn-exit">${t.exit}</button>
  </div>

  <!-- BODY -->
  <div id="nb-body">
    <!-- LEFT PANEL -->
    <div id="nb-left-panel">
      <div id="nb-tabs">
        <button class="nb-tab active" data-tab="blocks">${t.blocks}</button>
        <button class="nb-tab" data-tab="content">✏️ Edit</button>
        <button class="nb-tab" data-tab="styles">${t.styles}</button>
      </div>
      <!-- BLOCKS -->
      <div id="nb-blocks-panel">
        <div class="nb-panel-section">
          <div class="nb-panel-title">Elementos</div>
          <div class="nb-block" data-block="text">📝 Texto / Parágrafo</div>
          <div class="nb-block" data-block="image">🖼️ Imagem</div>
          <div class="nb-block" data-block="button">🔘 Botão CTA</div>
          <div class="nb-block" data-block="hero">🎯 Hero Banner</div>
          <div class="nb-block" data-block="features">⚡ Seção Features</div>
          <div class="nb-block" data-block="pix">💳 Seção PIX</div>
          <div class="nb-block" data-block="social">🔗 Redes Sociais</div>
          <div class="nb-block" data-block="video">▶️ Vídeo</div>
          <div class="nb-block" data-block="gallery">📸 Galeria</div>
          <div class="nb-block" data-block="testimonial">💬 Depoimentos</div>
          <div class="nb-block" data-block="pricing">💰 Preços</div>
          <div class="nb-block" data-block="contact">📬 Formulário Contato</div>
          <div class="nb-block" data-block="map">📍 Mapa / Localização</div>
          <div class="nb-block" data-block="counter">🔢 Contador Animado</div>
          <div class="nb-block" data-block="faq">❓ FAQ Acordeão</div>
        </div>
      </div>
      <!-- CONTENT QUICK EDIT -->
      <div id="nb-content-panel">
        <div style="padding:8px">
          <div class="nb-panel-title">✏️ Edição Rápida</div>
          <div class="nb-field-group">
            <label class="nb-field-label">Nome do Site</label>
            <input class="nb-field-input" id="qe-siteName" placeholder="Ex: Viajante Pro">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Título do Hero</label>
            <input class="nb-field-input" id="qe-heroTitle" placeholder="Ex: Viaje com estilo">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Subtítulo do Hero</label>
            <input class="nb-field-input" id="qe-heroSub" placeholder="Ex: A melhor agência...">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Botão CTA</label>
            <input class="nb-field-input" id="qe-ctaText" placeholder="Ex: Reserve Agora">
          </div>
          <div class="nb-panel-title" style="margin-top:12px">💳 PIX</div>
          <div class="nb-field-group">
            <label class="nb-field-label">Tipo (CPF/CNPJ/Email/Telefone)</label>
            <select class="nb-field-input" id="qe-pixType">
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave Aleatória</option>
            </select>
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Chave PIX</label>
            <input class="nb-field-input" id="qe-pixKey" placeholder="Ex: pagamentos@empresa.com">
          </div>
          <div class="nb-panel-title" style="margin-top:12px">🔗 Redes Sociais</div>
          <div class="nb-field-group">
            <label class="nb-field-label">Instagram (@ sem @)</label>
            <input class="nb-field-input" id="qe-instagram" placeholder="Ex: viajantepro">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">WhatsApp (com DDD)</label>
            <input class="nb-field-input" id="qe-whatsapp" placeholder="Ex: 11999999999">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Facebook</label>
            <input class="nb-field-input" id="qe-facebook" placeholder="facebook.com/...">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">YouTube</label>
            <input class="nb-field-input" id="qe-youtube" placeholder="youtube.com/...">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">TikTok</label>
            <input class="nb-field-input" id="qe-tiktok" placeholder="@usuario">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Logo URL</label>
            <input class="nb-field-input" id="qe-logoSrc" placeholder="https://...">
          </div>
          <div class="nb-field-group">
            <label class="nb-field-label">Cor de Destaque</label>
            <input class="nb-field-input" type="color" id="qe-accentColor" value="#0071e3" style="padding:2px;height:32px;cursor:pointer">
          </div>
          <button class="nb-save-btn" id="qe-apply-btn">✅ Aplicar Alterações</button>
        </div>
      </div>
      <!-- STYLES -->
      <div id="nb-styles-panel">
        <div class="nb-panel-title">🎨 Estilos do Elemento</div>
        <div id="gjs-sm-sectors" style="font-size:11px;color:#888;padding:8px">Selecione um elemento no canvas para editar estilos.</div>
      </div>
      <div class="nb-save-section">
        <select id="nb-lang-select" style="width:100%;background:#2d2d2f;border:1px solid #444;color:#fff;padding:6px;border-radius:6px;font-size:12px;font-family:inherit;margin-bottom:8px">
          <option value="pt">🇧🇷 Português</option>
          <option value="en">🇺🇸 English</option>
          <option value="es">🇪🇸 Español</option>
        </select>
      </div>
    </div>

    <!-- CANVAS AREA — DOM GARANTIDO ANTES DO GJS -->
    <div id="nb-canvas-wrap">
      <div id="gjs" style="min-height:100%;width:100%"></div>
    </div>
  </div>

  <!-- LAYOUT MODAL -->
  <div id="nb-layout-modal" style="display:none">
    <div class="nb-modal-box">
      <div class="nb-modal-title">${t.layout_title}</div>
      <div class="nb-modal-sub">${t.layout_sub}</div>
      <div class="nb-layout-grid" id="nb-layout-grid"></div>
      <div class="nb-modal-actions">
        <button class="nb-btn" id="nb-layout-cancel">${t.layout_cancel}</button>
        <button class="nb-btn nb-primary" id="nb-layout-apply">${t.layout_apply}</button>
      </div>
    </div>
  </div>
</div>`;
  }

  /* ── INICIALIZA GRAPES ───────────────────────────────────────── */
  function _initGJS() {
    var gjsEl = document.getElementById('gjs');
    if (!gjsEl) {
      console.error('[NexiaBuilder] #gjs não encontrado no DOM!');
      return null;
    }

    /* Garante que GrapesJS está disponível */
    if (typeof grapesjs === 'undefined') {
      console.warn('[NexiaBuilder] GrapesJS não carregado. Usando editor simples.');
      gjsEl.innerHTML = '<div style="padding:20px;color:#888;font-size:13px">Editor visual carregando... Se demorar, verifique a conexão.</div>';
      return null;
    }

    /* Destrói instância anterior se existir */
    _destroyGJS();

    try {
      var editor = grapesjs.init({
        container: '#gjs',
        fromElement: false,
        storageManager: false,
        deviceManager: {
          devices: [
            { name: 'Desktop', width: '' },
            { name: 'Tablet',  width: '768px',  widthMedia: '992px' },
            { name: 'Mobile',  width: '375px',  widthMedia: '480px' },
          ]
        },
        panels: { defaults: [] },
        plugins: [],
        canvas: {
          styles: ['https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap']
        }
      });

      _gjsInstance = editor;

      /* Resolve erro SelectComponent parentNode */
      editor.on('component:selected', function(component) {
        try {
          if (component && !component.view) return;
        } catch(e) {}
      });

      return editor;
    } catch(err) {
      console.error('[NexiaBuilder] GrapesJS init error:', err);
      return null;
    }
  }

  /* ── CARREGA PÁGINA NO EDITOR ────────────────────────────────── */
  function _loadPage(pageId, tenant, db, editor) {
    var pages   = CLIENT_PAGES[tenant] || CLIENT_PAGES['viajante-pro'];
    var pageObj = pages.find(function(p) { return p.id === pageId; });
    if (!pageObj) return;

    _currentPage = pageObj;

    /* Carrega do Firestore ou gera template */
    if (db) {
      db.doc(pageObj.fsPath + '/content').get()
        .then(function(doc) {
          if (doc.exists && doc.data().html) {
            if (editor) editor.setComponents(doc.data().html);
          } else {
            /* Nenhum conteúdo salvo: gera template padrão */
            var defaultLayout = LAYOUTS.find(function(l) { return l.id === 'light-clean'; });
            var html = _generateLayoutHTML(defaultLayout, doc.exists ? doc.data() : {});
            if (editor) editor.setComponents(html);
          }
          _toast('✅ Página carregada!');
        })
        .catch(function(err) {
          console.warn('[NexiaBuilder] Firestore error:', err);
          /* Fallback: template padrão */
          var fallback = LAYOUTS[0];
          if (editor) editor.setComponents(_generateLayoutHTML(fallback, {}));
        });
    } else {
      var fallback = LAYOUTS[0];
      if (editor) editor.setComponents(_generateLayoutHTML(fallback, {}));
    }
  }

  /* ── SAVE / PUBLISH ─────────────────────────────────────────── */
  function _save(editor, db, publish) {
    if (!editor || !_currentPage) return;
    var html = editor.getHtml();
    var css  = editor.getCss();
    var data = {
      html: html, css: css,
      updatedAt: new Date().toISOString(),
      published: !!publish,
    };

    if (db) {
      db.doc(_currentPage.fsPath + '/content').set(data, { merge: true })
        .then(function() { _toast(publish ? '🚀 Publicado!' : '✅ Salvo!'); })
        .catch(function(err) { console.error('[NexiaBuilder] Save error:', err); _toast('❌ Erro ao salvar.'); });
    } else {
      /* LocalStorage fallback */
      try { localStorage.setItem('nexia_draft_' + _currentPage.id, JSON.stringify(data)); } catch(e) {}
      _toast(publish ? '🚀 Publicado (local)!' : '✅ Salvo localmente!');
    }
  }

  /* ── APLICA QUICK EDIT ──────────────────────────────────────── */
  function _applyQuickEdit(editor) {
    if (!editor) return;
    var qe = {
      siteName:    document.getElementById('qe-siteName'),
      heroTitle:   document.getElementById('qe-heroTitle'),
      heroSub:     document.getElementById('qe-heroSub'),
      ctaText:     document.getElementById('qe-ctaText'),
      pixKey:      document.getElementById('qe-pixKey'),
      pixType:     document.getElementById('qe-pixType'),
      instagram:   document.getElementById('qe-instagram'),
      whatsapp:    document.getElementById('qe-whatsapp'),
      facebook:    document.getElementById('qe-facebook'),
      youtube:     document.getElementById('qe-youtube'),
      tiktok:      document.getElementById('qe-tiktok'),
      logoSrc:     document.getElementById('qe-logoSrc'),
      accentColor: document.getElementById('qe-accentColor'),
    };

    var pageData = {};
    Object.keys(qe).forEach(function(k) { if (qe[k]) pageData[k] = qe[k].value; });

    /* Localiza layout atual e regenera */
    var currentLayout = LAYOUTS[0];
    var html = _generateLayoutHTML(currentLayout, pageData);
    editor.setComponents(html);
    _toast('✅ Alterações aplicadas!');
  }

  /* ── POPULA LAYOUT GRID ─────────────────────────────────────── */
  function _populateLayouts(isSuperAdmin) {
    var grid = document.getElementById('nb-layout-grid');
    if (!grid) return;
    var available = LAYOUTS.filter(function(l) {
      return l.tier === 'all' || (isSuperAdmin && l.tier === 'super');
    });
    grid.innerHTML = available.map(function(l) {
      return '<div class="nb-layout-item" data-lid="' + l.id + '">' +
             '<div class="nb-layout-emoji">' + l.emoji + '</div>' +
             '<div class="nb-layout-name">' + l.name + '</div></div>';
    }).join('');

    /* Seleciona o primeiro */
    var first = grid.querySelector('.nb-layout-item');
    if (first) first.classList.add('selected');

    grid.addEventListener('click', function(e) {
      var item = e.target.closest('.nb-layout-item');
      if (!item) return;
      grid.querySelectorAll('.nb-layout-item').forEach(function(i) { i.classList.remove('selected'); });
      item.classList.add('selected');
    });
  }

  /* ── AMARRA EVENTOS ─────────────────────────────────────────── */
  function _bindEvents(editor, tenant, lang, isSuperAdmin, db) {
    /* Tabs */
    document.querySelectorAll('#' + _wrapId + ' .nb-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var tabName = this.getAttribute('data-tab');
        document.querySelectorAll('#' + _wrapId + ' .nb-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        ['blocks','content','styles'].forEach(function(p) {
          var el = document.getElementById('nb-' + p + '-panel');
          if (el) el.style.display = p === tabName ? 'block' : 'none';
        });
      });
    });

    /* Responsive */
    var devm = editor ? editor.DeviceManager : null;
    function _setDevice(d) { if (devm) devm.select(d); }
    var btnDesktop = document.getElementById('nb-btn-desktop');
    var btnTablet  = document.getElementById('nb-btn-tablet');
    var btnMobile  = document.getElementById('nb-btn-mobile');
    if (btnDesktop) btnDesktop.addEventListener('click', function() { _setDevice('Desktop'); });
    if (btnTablet)  btnTablet.addEventListener('click',  function() { _setDevice('Tablet');  });
    if (btnMobile)  btnMobile.addEventListener('click',  function() { _setDevice('Mobile');  });

    /* Save / Publish */
    var btnSave    = document.getElementById('nb-btn-save');
    var btnPublish = document.getElementById('nb-btn-publish');
    if (btnSave)    btnSave.addEventListener('click',    function() { _save(editor, db, false); });
    if (btnPublish) btnPublish.addEventListener('click', function() { _save(editor, db, true); });

    /* Page select */
    var pageSelect = document.getElementById('nb-page-select');
    if (pageSelect) {
      pageSelect.addEventListener('change', function() {
        _loadPage(this.value, tenant, db, editor);
      });
    }

    /* Layouts modal */
    var btnLayouts    = document.getElementById('nb-btn-layouts');
    var layoutModal   = document.getElementById('nb-layout-modal');
    var btnLayoutCancel = document.getElementById('nb-layout-cancel');
    var btnLayoutApply  = document.getElementById('nb-layout-apply');

    if (btnLayouts && layoutModal) {
      _populateLayouts(isSuperAdmin);
      btnLayouts.addEventListener('click', function() { layoutModal.style.display = 'flex'; });
      if (btnLayoutCancel) btnLayoutCancel.addEventListener('click', function() { layoutModal.style.display = 'none'; });
      if (btnLayoutApply)  btnLayoutApply.addEventListener('click', function() {
        var selected = document.querySelector('#nb-layout-grid .nb-layout-item.selected');
        if (!selected) return;
        var lid    = selected.getAttribute('data-lid');
        var layout = LAYOUTS.find(function(l) { return l.id === lid; });
        if (!layout) return;
        var html = _generateLayoutHTML(layout, {});
        if (editor) editor.setComponents(html);
        layoutModal.style.display = 'none';
        _toast('✅ Layout ' + layout.name + ' aplicado!');
      });
    }

    /* Blocks */
    document.querySelectorAll('#nb-blocks-panel .nb-block').forEach(function(block) {
      block.addEventListener('click', function() {
        if (!editor) return;
        var type = this.getAttribute('data-block');
        var blockHTML = {
          text:        '<div style="padding:20px"><p style="font-size:1rem;line-height:1.7">Clique para editar este texto.</p></div>',
          image:       '<div style="padding:20px;text-align:center"><img src="https://via.placeholder.com/600x300" style="max-width:100%;border-radius:12px;height:auto"></div>',
          button:      '<div style="padding:20px;text-align:center"><a href="#" style="display:inline-block;background:#0071e3;color:#fff;padding:14px 36px;border-radius:50px;font-weight:700;text-decoration:none;font-size:1rem">Clique Aqui</a></div>',
          hero:        '<section style="padding:80px 40px;text-align:center;background:linear-gradient(135deg,#f0f4ff,#e8f0fe)"><h1 style="font-size:3rem;font-weight:800;margin-bottom:16px">Seu Título Principal</h1><p style="font-size:1.2rem;opacity:0.7;margin-bottom:32px">Sua descrição aqui.</p><a href="#" style="display:inline-block;background:#0071e3;color:#fff;padding:16px 40px;border-radius:50px;font-weight:700;text-decoration:none">Saiba Mais</a></section>',
          features:    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:40px"><div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 16px rgba(0,0,0,0.06)"><div style="font-size:2.5rem;margin-bottom:12px">⭐</div><h3 style="margin-bottom:8px">Recurso 1</h3><p style="opacity:0.7">Descrição do recurso.</p></div><div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 16px rgba(0,0,0,0.06)"><div style="font-size:2.5rem;margin-bottom:12px">🚀</div><h3 style="margin-bottom:8px">Recurso 2</h3><p style="opacity:0.7">Descrição do recurso.</p></div><div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 16px rgba(0,0,0,0.06)"><div style="font-size:2.5rem;margin-bottom:12px">💡</div><h3 style="margin-bottom:8px">Recurso 3</h3><p style="opacity:0.7">Descrição do recurso.</p></div></div>',
          pix:         '<div style="background:#f0fdf4;padding:60px 40px;text-align:center"><h2 style="font-size:2rem;font-weight:800;margin-bottom:8px">💳 Pagamento via PIX</h2><p style="opacity:0.7;margin-bottom:20px">Transferência instantânea</p><div style="background:#fff;border:2px dashed #16a34a;border-radius:12px;padding:20px 40px;display:inline-block;font-size:1.2rem;font-weight:700;color:#16a34a">sua-chave-pix@email.com</div></div>',
          social:      '<div style="padding:40px;text-align:center"><p style="margin-bottom:16px;font-weight:600">Siga-nos</p><a href="#" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#e4405f;color:#fff;text-decoration:none;margin:0 6px;font-size:1.2rem">📷</a><a href="#" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#25D366;color:#fff;text-decoration:none;margin:0 6px;font-size:1.2rem">💬</a><a href="#" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#1877F2;color:#fff;text-decoration:none;margin:0 6px;font-size:1.2rem">👍</a></div>',
          video:       '<div style="padding:40px;text-align:center"><div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe></div></div>',
          gallery:     '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:40px"><img src="https://via.placeholder.com/400x300" style="border-radius:12px;width:100%;height:200px;object-fit:cover"><img src="https://via.placeholder.com/400x300" style="border-radius:12px;width:100%;height:200px;object-fit:cover"><img src="https://via.placeholder.com/400x300" style="border-radius:12px;width:100%;height:200px;object-fit:cover"></div>',
          testimonial: '<div style="padding:60px 40px;text-align:center;background:#faf8f5"><h2 style="font-size:2rem;font-weight:800;margin-bottom:40px">O que dizem nossos clientes</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px"><div style="background:#fff;border-radius:16px;padding:28px;text-align:left"><p style="font-size:1rem;line-height:1.7;margin-bottom:16px;font-style:italic">"Serviço incrível! Superou todas as expectativas."</p><strong>Maria Silva</strong></div><div style="background:#fff;border-radius:16px;padding:28px;text-align:left"><p style="font-size:1rem;line-height:1.7;margin-bottom:16px;font-style:italic">"Recomendo para todos. Atendimento de excelência."</p><strong>João Santos</strong></div></div></div>',
          pricing:     '<div style="padding:60px 40px;text-align:center"><h2 style="font-size:2rem;font-weight:800;margin-bottom:40px">Planos</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto"><div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:16px;padding:32px;text-align:center"><h3 style="margin-bottom:8px">Básico</h3><div style="font-size:2.5rem;font-weight:800;color:#0071e3;margin:16px 0">R$99</div><p style="opacity:0.6;margin-bottom:24px">/mês</p><a href="#" style="display:block;background:#0071e3;color:#fff;padding:12px;border-radius:8px;font-weight:700;text-decoration:none">Começar</a></div><div style="background:#0071e3;border-radius:16px;padding:32px;text-align:center;color:#fff;transform:scale(1.05)"><h3 style="margin-bottom:8px">Pro</h3><div style="font-size:2.5rem;font-weight:800;margin:16px 0">R$199</div><p style="opacity:0.8;margin-bottom:24px">/mês</p><a href="#" style="display:block;background:#fff;color:#0071e3;padding:12px;border-radius:8px;font-weight:700;text-decoration:none">Escolher</a></div><div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:16px;padding:32px;text-align:center"><h3 style="margin-bottom:8px">Enterprise</h3><div style="font-size:2.5rem;font-weight:800;color:#0071e3;margin:16px 0">R$499</div><p style="opacity:0.6;margin-bottom:24px">/mês</p><a href="#" style="display:block;background:#0071e3;color:#fff;padding:12px;border-radius:8px;font-weight:700;text-decoration:none">Contato</a></div></div></div>',
          contact:     '<div style="padding:60px 40px;max-width:600px;margin:0 auto"><h2 style="font-size:2rem;font-weight:800;margin-bottom:32px;text-align:center">Entre em Contato</h2><div style="margin-bottom:16px"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;opacity:0.7">NOME</label><input type="text" placeholder="Seu nome" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;outline:none"></div><div style="margin-bottom:16px"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;opacity:0.7">E-MAIL</label><input type="email" placeholder="seu@email.com" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;outline:none"></div><div style="margin-bottom:24px"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;opacity:0.7">MENSAGEM</label><textarea placeholder="Sua mensagem..." style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;outline:none;min-height:120px;resize:vertical"></textarea></div><button style="width:100%;padding:14px;background:#0071e3;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer">Enviar Mensagem</button></div>',
          map:         '<div style="padding:40px"><h3 style="margin-bottom:16px;font-weight:700">📍 Nossa Localização</h3><div style="border-radius:12px;overflow:hidden;height:300px"><iframe width="100%" height="300" style="border:0" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps/embed/v1/place?q=São+Paulo,SP,Brasil&key=YOUR_API_KEY"></iframe></div></div>',
          counter:     '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:60px 40px;text-align:center;background:#f0f4ff"><div><div style="font-size:3rem;font-weight:900;color:#0071e3">1,200+</div><div style="font-size:0.9rem;opacity:0.7;margin-top:4px;font-weight:600">CLIENTES</div></div><div><div style="font-size:3rem;font-weight:900;color:#0071e3">98%</div><div style="font-size:0.9rem;opacity:0.7;margin-top:4px;font-weight:600">SATISFAÇÃO</div></div><div><div style="font-size:3rem;font-weight:900;color:#0071e3">50+</div><div style="font-size:0.9rem;opacity:0.7;margin-top:4px;font-weight:600">DESTINOS</div></div><div><div style="font-size:3rem;font-weight:900;color:#0071e3">8 anos</div><div style="font-size:0.9rem;opacity:0.7;margin-top:4px;font-weight:600">DE MERCADO</div></div></div>',
          faq:         '<div style="padding:60px 40px;max-width:800px;margin:0 auto"><h2 style="font-size:2rem;font-weight:800;margin-bottom:32px;text-align:center">Perguntas Frequentes</h2><details style="margin-bottom:12px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden"><summary style="padding:16px 20px;cursor:pointer;font-weight:600;list-style:none;background:#fff">Como funciona o serviço?</summary><div style="padding:16px 20px;background:#fafafa;border-top:1px solid #e5e7eb;opacity:0.8">Nosso serviço é completo e personalizado. Você escolhe o destino e cuidamos de tudo.</div></details><details style="margin-bottom:12px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden"><summary style="padding:16px 20px;cursor:pointer;font-weight:600;list-style:none;background:#fff">Quais formas de pagamento aceitam?</summary><div style="padding:16px 20px;background:#fafafa;border-top:1px solid #e5e7eb;opacity:0.8">Aceitamos PIX, cartão de crédito/débito e boleto bancário.</div></details></div>',
        };
        var html = blockHTML[type] || '<div style="padding:20px">Bloco: ' + type + '</div>';
        try {
          var wrapper = editor.DomComponents.getWrapper();
          if (wrapper) {
            wrapper.append(html);
            _toast('✅ Bloco adicionado!');
          }
        } catch(e) {
          console.warn('[NexiaBuilder] Block append error:', e);
        }
      });
    });

    /* Quick Edit apply */
    var qeApplyBtn = document.getElementById('qe-apply-btn');
    if (qeApplyBtn) {
      qeApplyBtn.addEventListener('click', function() { _applyQuickEdit(editor); });
    }

    /* Language selector */
    var langSel = document.getElementById('nb-lang-select');
    if (langSel) {
      langSel.value = lang;
      langSel.addEventListener('change', function() {
        if (typeof NexiaI18n !== 'undefined') NexiaI18n.set(this.value);
      });
    }

    /* Exit builder */
    var exitBtn = document.getElementById('nb-btn-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', function() {
        _destroyGJS();
        var wrap = document.getElementById(_wrapId);
        if (wrap) wrap.remove();
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * API PÚBLICA
   * inject(containerId, tenant, lang, isSuperAdmin, db)
   * ══════════════════════════════════════════════════════════════ */
  return {

    inject: function(containerId, tenant, lang, isSuperAdmin, db) {
      _containerId  = containerId;
      _tenant       = tenant || 'viajante-pro';
      _lang         = lang   || (typeof NexiaI18n !== 'undefined' ? NexiaI18n.get() : 'pt');
      _isSuperAdmin = !!isSuperAdmin;
      _db           = db;

      /* Remove instância anterior */
      _destroyGJS();
      var old = document.getElementById(_wrapId);
      if (old) old.remove();

      /* Injeta CSS */
      _injectCSS();

      /* Monta HTML — inclui #gjs GARANTIDO no DOM */
      var wrap = document.createElement('div');
      wrap.innerHTML = _buildHTML(_tenant, _lang, _isSuperAdmin);
      document.body.appendChild(wrap.firstElementChild);

      /* Aguarda DOM settlar antes de inicializar GJS */
      requestAnimationFrame(function() {
        setTimeout(function() {
          var editor = _initGJS();
          _bindEvents(editor, _tenant, _lang, _isSuperAdmin, _db);

          /* Carrega primeira página */
          var pageSelect = document.getElementById('nb-page-select');
          var firstPage  = pageSelect ? pageSelect.value : null;
          if (firstPage) _loadPage(firstPage, _tenant, _db, editor);

        }, 50); /* 50ms garante que o DOM está pronto */
      });
    },

    destroy: function() {
      _destroyGJS();
      var wrap = document.getElementById(_wrapId);
      if (wrap) wrap.remove();
    },

    /* Compatibilidade com chamada antiga via renderBuilder */
    renderBuilder: function(containerId, opts) {
      opts = opts || {};
      this.inject(containerId, opts.tenant, opts.lang, opts.isSuperAdmin, opts.db);
    }
  };

})();
