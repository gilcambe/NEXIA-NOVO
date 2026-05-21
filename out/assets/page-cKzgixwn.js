import{j as e}from"./index-DG2_VE8C.js";import{r}from"./vendor-i18n-GiKYIiB7.js";import{S as h}from"./useScrollReveal-DLxG7Hel.js";import{a as b}from"./vendor-react-20oZQn72.js";import"./vendor-firebase-B3GH3FqA.js";const g=[{id:"all",label:"Todos",icon:"ri-folder-line"},{id:"config",label:"Config",icon:"ri-settings-3-line"},{id:"services",label:"Services",icon:"ri-server-line"},{id:"hooks",label:"Hooks",icon:"ri-link-m"},{id:"pages",label:"Pages",icon:"ri-pages-line"},{id:"components",label:"Components",icon:"ri-layout-line"},{id:"data",label:"Data",icon:"ri-database-2-line"}],c=[{path:"src/config/env.ts",category:"config",description:"Configuração de URLs e helpers de path para a API",content:"export const NEXIA_API_BASE = import.meta.env.VITE_NEXIA_API_URL || 'https://nexia-os.onrender.com';\nexport function apiPath(route: string): string {\n  return `${NEXIA_API_BASE}/api${route.startsWith('/') ? route : '/' + route}`;\n}\nexport function healthUrl(): string { return `${NEXIA_API_BASE}/health`; }\nexport function firebaseConfigUrl(): string { return `${NEXIA_API_BASE}/api/firebase-config`; }"},{path:"src/services/api.ts",category:"services",description:"Cliente HTTP completo com SSE streaming para o CORTEX",content:`import { apiPath, healthUrl } from '@/config/env';

async function _fetch<T>(url: string, opts = {}): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!res.ok) return { error: await res.text(), status: res.status };
    return { data: await res.json(), status: res.status };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error', status: 0 };
  }
}

export async function* streamCortex(payload, signal) {
  const res = await fetch(apiPath('/cortex'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: true }), signal
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try { yield JSON.parse(data); } catch { yield { token: data }; }
    }
  }
}`},{path:"src/services/firebase.ts",category:"services",description:"Inicialização dinâmica do Firebase via API",content:`import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { api } from './api';

let app = null;

export async function initFirebase() {
  if (app) return { app, auth: getAuth(app) };
  const { data: cfg } = await api.firebaseConfig();
  if (!cfg) return null;
  app = initializeApp(cfg);
  return { app, auth: getAuth(app) };
}`},{path:"src/contexts/AuthContext.tsx",category:"components",description:"Contexto global de autenticação Firebase com login, register e logout",content:`import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initFirebase } from '@/services/firebase';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initFirebase().then(result => {
      if (!result) { setLoading(false); return; }
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        onAuthStateChanged(result.auth, fbUser => {
          setUser(fbUser ? { uid: fbUser.uid, email: fbUser.email } : null);
          setLoading(false);
        });
      });
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await initFirebase();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(result.auth, email, password);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);`},{path:"src/hooks/useScrollReveal.ts",category:"hooks",description:"Hook de scroll reveal com IntersectionObserver nativo",content:`import { createElement, useEffect, useState } from 'react';

export function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [uniqueClass] = useState(() => 'sr-' + Math.random().toString(36).slice(2, 9));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.querySelector('.' + uniqueClass);
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [uniqueClass]);

  const tClass = direction === 'up' ? 'translate-y-6' : direction === 'left' ? 'translate-x-6' : '-translate-x-6';
  const cn = className + ' ' + tClass + ' opacity-0 transition-all ' + (visible ? '!translate-x-0 !translate-y-0 !opacity-100' : '') + ' ' + uniqueClass;
  return createElement('div', { className: cn, style: { transitionDuration: '700ms', transitionDelay: delay + 'ms' } }, children);
}`},{path:"server.js",category:"config",description:"Express server com SPA fallback e proxy para o backend NEXIA_OS",content:`const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'out')));

// API proxy → https://nexia-os.onrender.com
app.use('/api', async (req, res) => {
  const url = 'https://nexia-os.onrender.com/api' + req.path;
  const { default: fetch } = await import('node-fetch');
  const response = await fetch(url, { method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined });
  res.status(response.status);
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await response.buffer());
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'out', 'index.html')));

app.listen(PORT, () => console.log('NEXIA OS running on port ' + PORT));`},{path:"vite.config.ts",category:"config",description:"Configuração do Vite com React, aliases e build otimizado",content:`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const base = process.env.BASE_PATH || '/';

export default defineConfig({
  define: { __BASE_PATH__: JSON.stringify(base) },
  plugins: [react()],
  base,
  build: { outDir: 'out' },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  server: { port: 3000, host: '0.0.0.0' },
});`},{path:"tailwind.config.ts",category:"config",description:"Paleta NEXIA OS com cores, animações e fontes customizadas",content:`export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nexia: {
          bg: '#0a0a0f', surface: '#111118', surface2: '#1a1a24',
          border: '#2a2a35', cyan: '#00d4aa', 'cyan-dim': '#00a884',
          accent: '#10b981', text: '#e5e7eb', muted: '#9ca3af',
        }
      },
      animation: { marquee: 'marquee 30s linear infinite', float: 'float 6s ease-in-out infinite' },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
      },
    },
  },
};`}];function y({file:s}){const[n,p]=r.useState(!1),[a,l]=r.useState(!1),d=r.useCallback(()=>{navigator.clipboard.writeText(`// ===== ${s.path} =====
${s.content}`).then(()=>{l(!0),setTimeout(()=>l(!1),1500)})},[s]),x=s.content.split(`
`).length,o={ts:"text-blue-400",tsx:"text-nexia-cyan",js:"text-yellow-400",json:"text-orange-400",css:"text-pink-400"},u=s.path.split(".").pop()||"ts",m=o[u]||"text-nexia-muted";return e.jsxs("div",{className:"rounded-xl bg-nexia-surface border border-nexia-border overflow-hidden hover:border-nexia-cyan/15 transition-all",children:[e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 cursor-pointer",onClick:()=>p(!n),children:[e.jsx("div",{className:"w-7 h-7 flex items-center justify-center rounded-md bg-nexia-surface2 border border-nexia-border flex-shrink-0",children:e.jsx("i",{className:`ri-file-code-line ${m} text-sm`})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-mono text-white truncate",children:s.path}),e.jsx("p",{className:"text-xs text-nexia-muted truncate",children:s.description})]}),e.jsxs("div",{className:"flex items-center gap-3 flex-shrink-0",children:[e.jsxs("span",{className:"text-[10px] text-nexia-muted bg-nexia-surface2 px-2 py-0.5 rounded-full border border-nexia-border",children:[x," linhas"]}),e.jsxs("button",{onClick:t=>{t.stopPropagation(),d()},className:"flex items-center gap-1 px-2 py-1 rounded-md text-xs text-nexia-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap",children:[e.jsx("i",{className:a?"ri-check-line text-emerald-400":"ri-file-copy-line"}),a?"Copiado":"Copiar"]}),e.jsx("i",{className:`${n?"ri-arrow-up-s-line":"ri-arrow-down-s-line"} text-nexia-muted`})]})]}),n&&e.jsx("div",{className:"border-t border-nexia-border",children:e.jsx("pre",{className:"p-4 font-mono text-[11px] text-nexia-muted leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto",children:e.jsx("code",{children:s.content})})})]})}function A(){const s=b(),[n,p]=r.useState("all"),[a,l]=r.useState(""),[d,x]=r.useState(!1),o=r.useMemo(()=>c.filter(t=>{const i=n==="all"||t.category===n,f=!a||t.path.toLowerCase().includes(a.toLowerCase())||t.description.toLowerCase().includes(a.toLowerCase())||t.content.toLowerCase().includes(a.toLowerCase());return i&&f}),[n,a]),u=r.useMemo(()=>c.reduce((t,i)=>t+i.content.split(`
`).length,0),[]),m=r.useCallback(()=>{const t=c.map(i=>`// ===== ${i.path} =====
${i.content}`).join(`

`);navigator.clipboard.writeText(t).then(()=>{x(!0),setTimeout(()=>x(!1),2500)})},[]);return e.jsxs("div",{className:"min-h-screen bg-[#0a0a0f] text-white font-display antialiased",children:[e.jsx("header",{className:"border-b border-nexia-border bg-[#0a0a0f]",children:e.jsxs("div",{className:"px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("button",{onClick:()=>s("/"),className:"flex items-center gap-2 text-sm text-nexia-muted hover:text-white transition-colors cursor-pointer",children:[e.jsx("div",{className:"w-7 h-7 flex items-center justify-center rounded-md bg-nexia-cyan/20",children:e.jsx("i",{className:"ri-arrow-left-line text-nexia-cyan text-sm"})}),"Voltar ao site"]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("button",{onClick:()=>s("/pipeline"),className:"flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-nexia-cyan bg-nexia-cyan/10 border border-nexia-cyan/20 rounded-lg hover:bg-nexia-cyan/15 transition-colors cursor-pointer whitespace-nowrap",children:[e.jsx("i",{className:"ri-node-tree"})," Pipeline"]}),e.jsxs("button",{onClick:()=>s("/sentinel"),className:"flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-nexia-cyan bg-nexia-cyan/10 border border-nexia-cyan/20 rounded-lg hover:bg-nexia-cyan/15 transition-colors cursor-pointer whitespace-nowrap",children:[e.jsx("i",{className:"ri-shield-keyhole-line"})," Sentinel QA"]}),e.jsxs("button",{onClick:()=>s("/docs"),className:"flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-nexia-cyan bg-nexia-cyan/10 border border-nexia-cyan/20 rounded-lg hover:bg-nexia-cyan/15 transition-colors cursor-pointer whitespace-nowrap",children:[e.jsx("i",{className:"ri-book-open-line"})," Docs"]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 mb-2",children:[e.jsx("div",{className:"w-10 h-10 flex items-center justify-center rounded-xl bg-nexia-cyan/10 border border-nexia-cyan/20",children:e.jsx("i",{className:"ri-code-box-line text-nexia-cyan text-xl"})}),e.jsx("h1",{className:"text-2xl md:text-3xl font-bold text-white tracking-tight",children:"Código-Fonte NEXIA OS"})]}),e.jsx("p",{className:"text-sm md:text-base text-nexia-muted max-w-lg",children:"Todo o código gerado. Copie, cole no Cursor/VS Code e entregue à Claude para incorporar no projeto."})]})}),e.jsxs("main",{className:"px-4 md:px-8 py-6 max-w-7xl mx-auto",children:[e.jsx(h,{direction:"up",delay:0,children:e.jsxs("div",{className:"flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[e.jsx("div",{className:"px-3 py-1.5 rounded-lg bg-nexia-surface border border-nexia-border",children:e.jsxs("span",{className:"text-xs text-nexia-muted",children:[c.length," arquivos"]})}),e.jsx("div",{className:"px-3 py-1.5 rounded-lg bg-nexia-surface border border-nexia-border",children:e.jsxs("span",{className:"text-xs text-nexia-muted",children:[u.toLocaleString()," linhas"]})}),e.jsx("div",{className:"px-3 py-1.5 rounded-lg bg-nexia-surface border border-nexia-border",children:e.jsx("span",{className:"text-xs text-nexia-muted",children:"React 18 + TypeScript + Tailwind"})})]}),e.jsxs("div",{className:"flex items-center gap-3 w-full lg:w-auto",children:[e.jsxs("div",{className:"flex-1 lg:flex-none relative",children:[e.jsx("i",{className:"ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-nexia-muted text-xs"}),e.jsx("input",{type:"text",value:a,onChange:t=>l(t.target.value),placeholder:"Buscar arquivo, função ou código...",className:"w-full lg:w-72 pl-9 pr-3 py-2 rounded-lg bg-nexia-bg border border-nexia-border text-sm text-white placeholder-nexia-muted focus:outline-none focus:border-nexia-cyan/40 transition-colors"})]}),e.jsxs("button",{onClick:m,className:"flex items-center gap-2 px-4 py-2 rounded-lg bg-nexia-cyan text-[#0a0a0f] text-sm font-semibold hover:bg-nexia-cyan-dim transition-colors cursor-pointer whitespace-nowrap flex-shrink-0",children:[e.jsx("i",{className:d?"ri-check-line":"ri-file-copy-line"})," ",d?"Copiado!":"Copiar Tudo"]})]})]})}),e.jsx(h,{direction:"up",delay:60,children:e.jsx("div",{className:"flex flex-wrap gap-2 mb-6",children:g.map(t=>e.jsxs("button",{onClick:()=>p(t.id),className:`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer whitespace-nowrap ${n===t.id?"bg-nexia-cyan/15 text-nexia-cyan border-nexia-cyan/40":"bg-nexia-surface2 text-nexia-muted border-nexia-border hover:border-nexia-border/60"}`,children:[e.jsx("i",{className:t.icon})," ",t.label]},t.id))})}),e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsx("div",{className:"flex items-center justify-between mb-2",children:e.jsxs("span",{className:"text-xs text-nexia-muted",children:["Mostrando ",o.length," de ",c.length," arquivos"]})}),o.map((t,i)=>e.jsx(h,{direction:"up",delay:80+i*40,children:e.jsx(y,{file:t})},t.path)),o.length===0&&e.jsxs("div",{className:"flex flex-col items-center py-16 text-center",children:[e.jsx("i",{className:"ri-search-line text-nexia-muted text-2xl mb-3"}),e.jsx("p",{className:"text-sm text-nexia-muted",children:"Nenhum arquivo encontrado para esta busca."})]})]})]}),e.jsx("footer",{className:"border-t border-nexia-border bg-nexia-surface mt-8",children:e.jsxs("div",{className:"px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-7 h-7 flex items-center justify-center rounded-lg bg-nexia-cyan/20",children:e.jsx("i",{className:"ri-brain-fill text-nexia-cyan text-sm"})}),e.jsxs("span",{className:"text-white font-bold text-sm tracking-tight",children:["NEXIA",e.jsx("span",{className:"text-nexia-cyan",children:"OS"})]})]}),e.jsx("span",{className:"text-[11px] text-nexia-muted",children:"Código-fonte completo · Build 2026.05.03 · Pronto para exportação"})]})})]})}export{A as default};
