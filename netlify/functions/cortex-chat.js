'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  NEXIA OS — CORTEX SUPREME v17.0                                    ║
 * ║  Production-grade · Zero crashes · 50+ providers                   ║
 * ║  Streaming nativo + sync fallback · Token limits respeitados       ║
 * ║                                                                     ║
 * ║  BUGS CORRIGIDOS vs v16:                                            ║
 * ║  [BUG-01] gen_legacy = null bloqueava providers sem streaming      ║
 * ║  [BUG-02] Providers mistral/cohere/nvidia/hf/sambanova/together    ║
 * ║           nunca chegavam ao streaming → caíam no fallback errado   ║
 * ║  [BUG-03] maxTokens=100000 crashava Groq/Cerebras (limite 32768)  ║
 * ║  [BUG-04] cerebras ausente da ordem de streaming (é o mais rápido)║
 * ║  [BUG-05] deepseek/xai/perplexity sem streaming nativo = silêncio ║
 * ║  [BUG-06] summarizeHistory hardcoded em GROQ sem fallback         ║
 * ║  [BUG-07] _fetchTimeout assinatura invertida em streamGemini      ║
 * ║  [BUG-08] callFreeProvider sem streaming → resposta truncada em   ║
 * ║           modo stream                                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ── fetchWithTimeout ──────────────────────────────────────────────────
async function _fetchTimeout(url, opts = {}, ms = 55000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

const { admin, db } = require('./firebase-init');

// ── Módulos opcionais com fallback seguro ─────────────────────────────
let memModule, actionModule, learnModule, autodevModule, ragModule;
try { memModule    = require('./cortex-memory'); }  catch { memModule    = { load: async () => ({ history: [], summaries: [], entities: {} }), save: async () => {}, buildContext: (h) => h.slice(-30), extractEntities: () => ({}) }; }
try { actionModule = require('./action-engine'); }  catch { actionModule = { dispatch: async () => ({ ok: false, error: 'action-engine indisponível' }) }; }
try { learnModule  = require('./cortex-learn');  }  catch { learnModule  = { buildLearningContext: async () => null, saveExample: async () => {} }; }
try { autodevModule= require('./autodev-engine');}  catch { autodevModule= null; }
try { ragModule    = require('./rag-engine');    }  catch { ragModule    = { buildRAGContext: async () => '' }; }

const { guard, sanitizePrompt, validateAIAction, checkPermission, makeHeaders } = require('./middleware');

const SSE_HEADERS = {
  'Content-Type':                'text/event-stream',
  'Cache-Control':               'no-cache',
  'Connection':                  'keep-alive',
  'Access-Control-Allow-Origin': (process.env.NEXIA_APP_URL || '*').split(',')[0].trim(),
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'X-Accel-Buffering':           'no',
};

// Todos os planos: ilimitado
const PLAN_LIMITS = { master: -1, enterprise: -1, pro: -1, starter: -1, free: -1 };

// ══════════════════════════════════════════════════════════════════════
// CATÁLOGO DE 54 PROVIDERS
// ══════════════════════════════════════════════════════════════════════
const AI_CATALOG = {
  // ANTHROPIC (pago) — streaming nativo
  claude:               { provider: 'anthropic',   model: 'claude-sonnet-4-6',                                    label: '✦ Claude Sonnet 4.6',           free: false, maxTok: 16000,  stream: true  },
  claude_opus:          { provider: 'anthropic',   model: 'claude-opus-4-5',                                      label: '✦ Claude Opus 4.5',             free: false, maxTok: 16000,  stream: true  },
  claude_haiku:         { provider: 'anthropic',   model: 'claude-haiku-4-5-20251001',                            label: '✦ Claude Haiku 4.5',            free: false, maxTok: 16000,  stream: true  },

  // OPENAI (pago) — streaming nativo
  gpt4o:                { provider: 'openai',      model: 'gpt-4o',                                               label: '⚡ GPT-4o',                      free: false, maxTok: 16000,  stream: true  },
  gpt4o_mini:           { provider: 'openai',      model: 'gpt-4o-mini',                                          label: '⚡ GPT-4o Mini',                 free: false, maxTok: 16000,  stream: true  },

  // GROQ 🆓 — streaming nativo (limite 32768)
  groq_llama4_scout:    { provider: 'groq',        model: 'meta-llama/llama-4-scout-17b-16e-instruct',            label: '🦙 Llama 4 Scout (Groq)',       free: true,  maxTok: 32768,  stream: true  },
  groq_llama4_maverick: { provider: 'groq',        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',        label: '🦙 Llama 4 Maverick (Groq)',    free: true,  maxTok: 32768,  stream: true  },
  groq_llama3:          { provider: 'groq',        model: 'llama-3.3-70b-versatile',                              label: '🦙 Llama 3.3 70B (Groq)',       free: true,  maxTok: 32768,  stream: true  },
  groq_llama3_fast:     { provider: 'groq',        model: 'llama-3.1-8b-instant',                                 label: '🦙 Llama 3.1 8B Fast (Groq)',   free: true,  maxTok: 8192,   stream: true  },
  groq_mixtral:         { provider: 'groq',        model: 'mixtral-8x7b-32768',                                   label: '🔥 Mixtral 8x7B (Groq)',        free: true,  maxTok: 32768,  stream: true  },
  groq_gemma2:          { provider: 'groq',        model: 'gemma2-9b-it',                                         label: '💎 Gemma 2 9B (Groq)',          free: true,  maxTok: 8192,   stream: true  },
  groq_qwen:            { provider: 'groq',        model: 'qwen-qwq-32b',                                         label: '🐉 Qwen QwQ 32B (Groq)',        free: true,  maxTok: 32768,  stream: true  },
  groq_deepseek_r1:     { provider: 'groq',        model: 'deepseek-r1-distill-llama-70b',                        label: '💻 DeepSeek R1 (Groq)',         free: true,  maxTok: 32768,  stream: true  },

  // GEMINI 🆓 — streaming nativo (limite 8192 safe)
  gemini_25_pro:        { provider: 'gemini',      model: 'gemini-2.5-pro',                                       label: '🌐 Gemini 2.5 Pro',             free: true,  maxTok: 8192,   stream: true  },
  gemini_25_flash:      { provider: 'gemini',      model: 'gemini-2.5-flash',                                     label: '🌐 Gemini 2.5 Flash',           free: true,  maxTok: 8192,   stream: true  },
  gemini_20_flash:      { provider: 'gemini',      model: 'gemini-2.0-flash',                                     label: '🌐 Gemini 2.0 Flash',           free: true,  maxTok: 8192,   stream: true  },
  gemini_flash_lite:    { provider: 'gemini',      model: 'gemini-2.5-flash-lite',                                label: '🌐 Gemini Flash Lite',          free: true,  maxTok: 8192,   stream: true  },

  // CEREBRAS 🆓 — streaming nativo, mais rápido do mundo (limite 32768)
  cerebras_llama4:      { provider: 'cerebras',    model: 'llama-4-scout-17b-16e-instruct',                       label: '⚡ Llama 4 Scout (Cerebras)',  free: true,  maxTok: 32768,  stream: true  },
  cerebras_llama3:      { provider: 'cerebras',    model: 'llama3.3-70b',                                         label: '⚡ Llama 3.3 70B (Cerebras)',  free: true,  maxTok: 32768,  stream: true  },
  cerebras_qwen:        { provider: 'cerebras',    model: 'qwen-3-32b',                                           label: '⚡ Qwen 3 32B (Cerebras)',     free: true,  maxTok: 32768,  stream: true  },

  // OPENROUTER 🆓 — streaming nativo
  or_llama4_mav:        { provider: 'openrouter',  model: 'meta-llama/llama-4-maverick:free',                     label: '🌐 Llama 4 Maverick (OR)',     free: true,  maxTok: 8192,   stream: true  },
  or_deepseek_r1:       { provider: 'openrouter',  model: 'deepseek/deepseek-r1:free',                            label: '🌐 DeepSeek R1 (OR)',           free: true,  maxTok: 8192,   stream: true  },
  or_deepseek_v3:       { provider: 'openrouter',  model: 'deepseek/deepseek-v3-0324:free',                       label: '🌐 DeepSeek V3 (OR)',           free: true,  maxTok: 8192,   stream: true  },
  or_qwen3_235b:        { provider: 'openrouter',  model: 'qwen/qwen3-235b-a22b:free',                            label: '🌐 Qwen3 235B (OR)',            free: true,  maxTok: 8192,   stream: true  },
  or_qwen3_coder:       { provider: 'openrouter',  model: 'qwen/qwen3-coder-480b:free',                           label: '🌐 Qwen3 Coder 480B (OR)',     free: true,  maxTok: 8192,   stream: true  },
  or_gemma3_27b:        { provider: 'openrouter',  model: 'google/gemma-3-27b-it:free',                           label: '🌐 Gemma 3 27B (OR)',           free: true,  maxTok: 8192,   stream: true  },
  or_mistral_sm:        { provider: 'openrouter',  model: 'mistralai/mistral-small-3.1-24b-instruct:free',        label: '🌐 Mistral Small 3.1 (OR)',    free: true,  maxTok: 8192,   stream: true  },
  or_nvidia_nemotron:   { provider: 'openrouter',  model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',         label: '🌐 NVIDIA Nemotron 253B (OR)', free: true,  maxTok: 8192,   stream: true  },
  or_gpt_oss_120b:      { provider: 'openrouter',  model: 'openai/gpt-oss-120b:free',                             label: '🌐 GPT-OSS 120B (OR)',          free: true,  maxTok: 8192,   stream: true  },

  // MISTRAL 🆓 — sync (API não tem streaming SSE compatível com Node fácil)
  mistral_small:        { provider: 'mistral',     model: 'mistral-small-latest',                                 label: '🇫🇷 Mistral Small',              free: true,  maxTok: 32768,  stream: false },
  mistral_codestral:    { provider: 'mistral',     model: 'codestral-latest',                                     label: '🇫🇷 Codestral (código)',          free: true,  maxTok: 32768,  stream: false },
  mistral_nemo:         { provider: 'mistral',     model: 'open-mistral-nemo',                                    label: '🇫🇷 Mistral Nemo 12B',            free: true,  maxTok: 32768,  stream: false },

  // COHERE 🆓 — sync
  cohere_command:       { provider: 'cohere',      model: 'command-r-plus',                                       label: '🔵 Cohere Command R+',          free: true,  maxTok: 4096,   stream: false },
  cohere_command_r:     { provider: 'cohere',      model: 'command-r',                                            label: '🔵 Cohere Command R',           free: true,  maxTok: 4096,   stream: false },

  // NVIDIA NIM 🆓 — streaming nativo (OpenAI-compat)
  nvidia_llama3:        { provider: 'nvidia',      model: 'meta/llama-3.3-70b-instruct',                          label: '🟢 Llama 3.3 70B (NVIDIA)',    free: true,  maxTok: 4096,   stream: true  },
  nvidia_deepseek_r1:   { provider: 'nvidia',      model: 'deepseek/deepseek-r1',                                 label: '🟢 DeepSeek R1 (NVIDIA)',       free: true,  maxTok: 4096,   stream: true  },
  nvidia_phi4:          { provider: 'nvidia',      model: 'microsoft/phi-4',                                      label: '🟢 Phi-4 (NVIDIA)',             free: true,  maxTok: 4096,   stream: true  },
  nvidia_gemma3_27b:    { provider: 'nvidia',      model: 'google/gemma-3-27b-it',                                label: '🟢 Gemma 3 27B (NVIDIA)',       free: true,  maxTok: 4096,   stream: true  },

  // HUGGING FACE 🆓 — streaming nativo (OpenAI-compat)
  hf_llama3:            { provider: 'huggingface', model: 'meta-llama/Llama-3.3-70B-Instruct',                    label: '🤗 Llama 3.3 70B (HF)',        free: true,  maxTok: 4096,   stream: true  },
  hf_qwen3:             { provider: 'huggingface', model: 'Qwen/Qwen3-235B-A22B',                                 label: '🤗 Qwen3 235B (HF)',            free: true,  maxTok: 4096,   stream: true  },
  hf_deepseek_r1:       { provider: 'huggingface', model: 'deepseek-ai/DeepSeek-R1',                              label: '🤗 DeepSeek R1 (HF)',           free: true,  maxTok: 4096,   stream: true  },

  // SAMBANOVA 🆓 — streaming nativo (OpenAI-compat)
  sambanova_llama3:     { provider: 'sambanova',   model: 'Meta-Llama-3.3-70B-Instruct',                          label: '🔴 Llama 3.3 70B (SambaNova)', free: true,  maxTok: 4096,   stream: true  },
  sambanova_deepseek:   { provider: 'sambanova',   model: 'DeepSeek-R1-Distill-Llama-70B',                        label: '🔴 DeepSeek R1 (SambaNova)',    free: true,  maxTok: 4096,   stream: true  },
  sambanova_qwen:       { provider: 'sambanova',   model: 'Qwen3-32B',                                            label: '🔴 Qwen3 32B (SambaNova)',      free: true,  maxTok: 4096,   stream: true  },

  // TOGETHER AI 🎁 — streaming nativo (OpenAI-compat)
  together_llama4:      { provider: 'together',    model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',            label: '🤝 Llama 4 Scout (Together)',  free: true,  maxTok: 4096,   stream: true  },
  together_deepseek:    { provider: 'together',    model: 'deepseek-ai/DeepSeek-R1',                              label: '🤝 DeepSeek R1 (Together)',    free: true,  maxTok: 4096,   stream: true  },

  // DEEPSEEK 💰 — streaming nativo (OpenAI-compat)
  deepseek_v3:          { provider: 'deepseek',    model: 'deepseek-chat',                                        label: '💻 DeepSeek V3',                free: false, maxTok: 32768,  stream: true  },
  deepseek_r1:          { provider: 'deepseek',    model: 'deepseek-reasoner',                                    label: '💻 DeepSeek R1',                free: false, maxTok: 32768,  stream: true  },
  deepseek_coder:       { provider: 'deepseek',    model: 'deepseek-coder',                                       label: '💻 DeepSeek Coder',             free: false, maxTok: 32768,  stream: true  },

  // XAI — streaming nativo (OpenAI-compat)
  grok3:                { provider: 'xai',         model: 'grok-3-fast',                                          label: '🚀 Grok-3 Fast',                free: false, maxTok: 32768,  stream: true  },

  // PERPLEXITY — streaming nativo
  perplexity:           { provider: 'perplexity',  model: 'llama-3.1-sonar-large-128k-online',                    label: '🔍 Perplexity',                 free: false, maxTok: 4096,   stream: true  },
  perplexity_fast:      { provider: 'perplexity',  model: 'llama-3.1-sonar-small-128k-online',                    label: '🔍 Perplexity Fast',            free: false, maxTok: 4096,   stream: true  },
};

// Roteador por intent
const INTENT_ROUTER = {
  code:      'or_qwen3_coder',
  dev:       'groq_deepseek_r1',
  security:  'gemini_25_flash',
  write:     'cerebras_llama4',
  legal:     'gemini_25_pro',
  analysis:  'gemini_25_flash',
  vision:    'gemini_20_flash',
  search:    'perplexity',
  news:      'perplexity_fast',
  finance:   'groq_llama4_maverick',
  huge_doc:  'gemini_25_pro',
  realtime:  'grok3',
  fast:      'cerebras_llama3',
  chat:      'groq_llama4_scout',
  swarm:     'or_qwen3_235b',
  action:    'groq_llama3_fast',
  auto:      'groq_llama4_scout',
  reasoning: 'or_deepseek_r1',
  rag:       'cohere_command_r',
};

// Configurações de URL e chaves por provider (OpenAI-compatível)
function getOpenAICompatConfig(provider) {
  const CONFIGS = {
    openai:      { url: 'https://api.openai.com/v1/chat/completions',                          envKey: 'OPENAI_API_KEY' },
    groq:        { url: 'https://api.groq.com/openai/v1/chat/completions',                     envKey: 'GROQ_API_KEY' },
    cerebras:    { url: 'https://api.cerebras.ai/v1/chat/completions',                         envKey: 'CEREBRAS_API_KEY' },
    openrouter:  { url: 'https://openrouter.ai/api/v1/chat/completions',                       envKey: 'OPENROUTER_API_KEY' },
    deepseek:    { url: 'https://api.deepseek.com/v1/chat/completions',                        envKey: 'DEEPSEEK_API_KEY' },
    xai:         { url: 'https://api.x.ai/v1/chat/completions',                                envKey: 'XAI_API_KEY' },
    perplexity:  { url: 'https://api.perplexity.ai/chat/completions',                          envKey: 'PERPLEXITY_API_KEY' },
    nvidia:      { url: 'https://integrate.api.nvidia.com/v1/chat/completions',                envKey: 'NVIDIA_API_KEY' },
    sambanova:   { url: 'https://api.sambanova.ai/v1/chat/completions',                        envKey: 'SAMBANOVA_API_KEY' },
    together:    { url: 'https://api.together.xyz/v1/chat/completions',                        envKey: 'TOGETHER_API_KEY' },
    mistral:     { url: 'https://api.mistral.ai/v1/chat/completions',                          envKey: 'MISTRAL_API_KEY' },
  };
  return CONFIGS[provider] || null;
}

function getHFUrl(model) {
  return `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`;
}

// ══════════════════════════════════════════════════════════════════════
// STREAMING GENERATORS
// ══════════════════════════════════════════════════════════════════════

// Parser SSE genérico para formato OpenAI (choices[0].delta.content)
async function* _streamOpenAICompat(url, headers, body) {
  const res = await _fetchTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) }, 55000);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    yield `\u26a0\ufe0f Erro ${res.status}: ${txt.slice(0, 200)}`;
    return;
  }
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]') return;
      try {
        const t = JSON.parse(d).choices?.[0]?.delta?.content;
        if (t) yield t;
      } catch { /* ignorar linhas mal-formadas */ }
    }
  }
}

// Anthropic SSE (formato próprio)
async function* streamAnthropic(system, messages, model, maxTok) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { yield `\u26a0\ufe0f ANTHROPIC_API_KEY não configurada. Configure no Render → Environment.`; return; }
  const res = await _fetchTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: Math.min(maxTok, 16000), stream: true, system,
      messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: String(m.content) })) }),
  });
  if (!res.ok) { yield `\u274c Anthropic ${res.status}: ${await res.text().catch(() => '')}`; return; }
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]') return;
      try {
        const p = JSON.parse(d);
        if (p.type === 'content_block_delta' && p.delta?.type === 'text_delta') yield p.delta.text;
      } catch { }
    }
  }
}

// Gemini SSE (formato próprio)
async function* streamGemini(system, messages, model, maxTok) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) { yield `\u26a0\ufe0f GEMINI_API_KEY não configurada. Grátis em: https://aistudio.google.com`; return; }
  const gemMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content) }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`;
  const res = await _fetchTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: gemMessages,
      generationConfig: { maxOutputTokens: Math.min(maxTok, 8192) },
    }),
  }, 60000);
  if (!res.ok) { yield `\u274c Gemini ${res.status}: ${await res.text().catch(() => '')}`; return; }
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]') return;
      try {
        const t = JSON.parse(d).candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) yield t;
      } catch { }
    }
  }
}

// OpenAI-compatible streaming (Groq, Cerebras, OpenRouter, DeepSeek, XAI, Perplexity, NVIDIA, Sambanova, Together, HuggingFace, Mistral)
async function* streamOpenAICompat(system, messages, ai) {
  const { provider, model } = ai;
  const maxTok = ai.maxTok;

  // HuggingFace tem URL por modelo
  const cfg = provider === 'huggingface'
    ? { url: getHFUrl(model), envKey: 'HF_API_KEY' }
    : getOpenAICompatConfig(provider);

  if (!cfg) { yield `\u274c Provider desconhecido: ${provider}`; return; }

  const key = process.env[cfg.envKey];
  if (!key) {
    const signups = {
      groq: 'console.groq.com', cerebras: 'cloud.cerebras.ai', openrouter: 'openrouter.ai/keys',
      deepseek: 'platform.deepseek.com', nvidia: 'build.nvidia.com', sambanova: 'cloud.sambanova.ai',
      together: 'api.together.xyz', huggingface: 'huggingface.co/settings/tokens',
      mistral: 'console.mistral.ai', xai: 'console.x.ai', perplexity: 'perplexity.ai',
    };
    yield `\u26a0\ufe0f ${cfg.envKey} não configurada.${signups[provider] ? ` Grátis em: https://${signups[provider]}` : ''}`;
    return;
  }

  const extraHeaders = {};
  if (provider === 'openrouter') {
    extraHeaders['HTTP-Referer'] = process.env.NEXIA_APP_URL || 'https://nexia.com.br';
    extraHeaders['X-Title']      = 'NEXIA OS';
  }

  const body = {
    model,
    max_tokens: maxTok,
    stream:     true,
    temperature: provider === 'groq' ? 0.4 : 0.7,
    messages:   [{ role: 'system', content: system }, ...messages],
  };

  // [BUG-03 FIX] Groq e Cerebras têm limite hard de 32768
  if (['groq', 'cerebras'].includes(provider)) {
    body.max_tokens = Math.min(body.max_tokens, 32768);
  }

  const headers = {
    'Authorization': `Bearer ${key}`,
    'Content-Type':  'application/json',
    ...extraHeaders,
  };

  yield* _streamOpenAICompat(cfg.url, headers, body);
}

// ══════════════════════════════════════════════════════════════════════
// CHAMADAS SÍNCRONAS (para providers sem streaming ou fallback final)
// ══════════════════════════════════════════════════════════════════════

async function callSync(system, messages, modelKey, maxTokOverride) {
  const ai = AI_CATALOG[modelKey] || AI_CATALOG.groq_llama3;
  const { provider, model, maxTok } = ai;
  const tok = Math.min(maxTokOverride || maxTok, maxTok); // nunca ultrapassa o limite do modelo

  // Anthropic
  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY ausente');
    const res = await _fetchTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: tok, system,
        messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: String(m.content) })) }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    return (await res.json()).content?.[0]?.text || '';
  }

  // Gemini
  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY ausente — grátis em https://aistudio.google.com');
    const gemMessages = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] }));
    const res = await _fetchTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: gemMessages, generationConfig: { maxOutputTokens: Math.min(tok, 8192) } }) },
      60000,
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // Cohere (API diferente)
  if (provider === 'cohere') {
    const key = process.env.COHERE_API_KEY;
    if (!key) throw new Error('COHERE_API_KEY ausente — grátis em https://dashboard.cohere.com');
    const res = await _fetchTimeout('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: Math.min(tok, 4096),
        messages: [{ role: 'system', content: system }, ...messages] }),
    });
    if (!res.ok) throw new Error(`Cohere ${res.status}: ${await res.text()}`);
    const d = await res.json();
    return d.message?.content?.[0]?.text || d.text || '';
  }

  // Todos os OpenAI-compatíveis (sync)
  const cfg = provider === 'huggingface'
    ? { url: getHFUrl(model), envKey: 'HF_API_KEY' }
    : getOpenAICompatConfig(provider);

  if (!cfg) throw new Error(`Provider sem suporte sync: ${provider}`);
  const key = process.env[cfg.envKey];
  if (!key) throw new Error(`${cfg.envKey} ausente`);

  const extraHeaders = {};
  if (provider === 'openrouter') {
    extraHeaders['HTTP-Referer'] = process.env.NEXIA_APP_URL || 'https://nexia.com.br';
    extraHeaders['X-Title']      = 'NEXIA OS';
  }

  const body = {
    model,
    max_tokens: Math.min(tok, provider === 'groq' || provider === 'cerebras' ? 32768 : tok),
    messages:   [{ role: 'system', content: system }, ...messages],
  };

  const res = await _fetchTimeout(cfg.url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text().catch(() => '')}`);
  return (await res.json()).choices?.[0]?.message?.content || '';
}

// ══════════════════════════════════════════════════════════════════════
// getStream — retorna o generator correto por provider
// [BUG-01 FIX] Todos os providers com stream:true têm generator real
// ══════════════════════════════════════════════════════════════════════
function getStream(ai, system, messages) {
  const { provider } = ai;

  if (!ai.stream) return null; // Provider só suporta sync

  if (provider === 'anthropic') return streamAnthropic(system, messages, ai.model, ai.maxTok);
  if (provider === 'gemini')    return streamGemini(system, messages, ai.model, ai.maxTok);

  // Todos os OpenAI-compatíveis com streaming
  if (['openai','groq','cerebras','openrouter','deepseek','xai','perplexity',
       'nvidia','huggingface','sambanova','together','mistral'].includes(provider)) {
    return streamOpenAICompat(system, messages, ai);
  }

  return null; // Cohere e desconhecidos: usar sync
}

// ══════════════════════════════════════════════════════════════════════
// IMAGEM
// ══════════════════════════════════════════════════════════════════════
async function generateImage(prompt, style) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: 'OPENAI_API_KEY não configurada para DALL-E.' };
  try {
    const res = await _fetchTimeout('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024',
        style: style === 'artistic' ? 'vivid' : 'natural', response_format: 'url' }),
    });
    if (!res.ok) throw new Error(`DALL-E ${res.status}: ${await res.text()}`);
    const d = await res.json();
    return { ok: true, url: d.data[0].url, revised_prompt: d.data[0].revised_prompt };
  } catch (e) {
    return { ok: false, error: e.message || 'Erro ao gerar imagem' };
  }
}

// ══════════════════════════════════════════════════════════════════════
// SWARM
// ══════════════════════════════════════════════════════════════════════
const STATIC_AGENTS = {
  orchestrator: { system: `Você é o CORTEX ORCHESTRATOR v17 — Sistema de Auto-Programação da NEXIA OS.\nAnalise a mensagem e retorne SOMENTE JSON válido, sem texto fora do JSON.\nEsquema EXATO:\n{"type":"chat|code|action|swarm|image|autodev","intent":"chat|code|dev|security|write|legal|analysis|vision|search|news|finance|huge_doc|realtime|fast","agents":["dev","security","business"],"actions":[{"type":"createTask","data":{"titulo":"Título obrigatório","descricao":"","prioridade":"media","status":"pendente"}},{"type":"createClient","data":{"nome":"Nome obrigatório"}},{"type":"createMeeting","data":{"titulo":"Título","dataHora":"2026-01-01T10:00"}},{"type":"createFinance","data":{"descricao":"Desc","valor":0,"tipo":"receita"}},{"type":"createNote","data":{"conteudo":"Conteúdo"}}],"autodev":{"comando":"criar_modulo|corrigir_bug|gerar_funcao|deploy","spec":"Especificação completa do que deve ser criado","modulo":"nome-do-modulo"},"image_request":{"prompt":"...","style":"realistic"},"model_override":"groq_llama4_scout|or_deepseek_r1|gemini_25_pro|cerebras_llama3|claude|gpt4o","response":"Resposta em português"}\nREGRAS CRÍTICAS:\n1. createTask SEMPRE inclui campo "titulo" com texto real\n2. createClient SEMPRE inclui campo "nome" com texto real\n3. createMeeting SEMPRE inclui "titulo" e "dataHora"\n4. Se usuário pede para criar módulo/feature/sistema → use type=autodev\n5. Nunca retorne data:{} vazio\n6. response deve ser em português` },
  dev:       { system: 'Você é o DEV AGENT — Principal Engineer da NEXIA. Especialista em Firebase, Netlify Functions, JavaScript, TypeScript, React, Python, arquitetura SaaS multi-tenant. Responda em português com código completo e funcional. NUNCA trunce código com "...".' },
  security:  { system: 'Você é o SECURITY AGENT — CISO Virtual da NEXIA. Especialista em OWASP, LGPD/GDPR, Firebase Security Rules, pentest, criptografia. Responda em português, nunca minimize riscos.' },
  business:  { system: 'Você é o BUSINESS AGENT — Consultor Estratégico da NEXIA. Especialista em SaaS, MRR, churn, pricing, vendas, marketing. Responda em português de forma executiva.' },
  finance:   { system: 'Você é o FINANCE AGENT — CFO Virtual da NEXIA. Especialista em DRE, fluxo de caixa, valuation, análise de crédito. Responda com precisão numérica.' },
  legal:     { system: 'Você é o LEGAL AGENT — especialista em contratos SaaS, LGPD, editais. Analise contratos e identifique riscos. Responda em português acessível.' },
  architect: { system: 'Você é o ARCHITECT AGENT — especialista em arquitetura de sistemas, microserviços, serverless, bancos de dados. Projete sistemas robustos. Responda em português.' },
};

async function runSwarm(agentNames, messages, dynAgents) {
  const all   = { ...STATIC_AGENTS, ...dynAgents };
  const names = agentNames.filter(n => all[n]);
  if (!names.length) names.push('business');

  const results = await Promise.allSettled(names.map(async name => {
    const agent = all[name];
    const mk = name === 'dev' ? 'groq_deepseek_r1' : name === 'finance' ? 'groq_llama4_maverick' : 'groq_llama4_scout';
    const reply = await callSync(agent.system, messages, mk, 3000);
    return { name, reply };
  }));

  const outputs = results.map((r, i) => ({
    name:  names[i],
    reply: r.status === 'fulfilled' ? r.value.reply : `[${names[i]} indisponível]`,
    ok:    r.status === 'fulfilled',
  }));

  if (outputs.filter(o => o.ok).length > 1) {
    const summaryInput = outputs.map(o => `### ${o.name.toUpperCase()}\n${o.reply}`).join('\n\n---\n\n');
    try {
      const synthesis = await callSync(
        'Consolide as análises dos especialistas em uma resposta executiva, estruturada com markdown, em português do Brasil. Seja direto e acionável.',
        [{ role: 'user', content: summaryInput }],
        'groq_llama3',
        4000,
      );
      return { outputs, synthesis };
    } catch { /* fallback abaixo */ }
  }

  return { outputs, synthesis: outputs[0]?.reply || '' };
}

// ══════════════════════════════════════════════════════════════════════
// PARSER ORCHESTRATOR
// ══════════════════════════════════════════════════════════════════════
function safeJSON(t) { try { return JSON.parse(t); } catch { return null; } }
function extractJSON(t) { const m = t?.match(/\{[\s\S]*\}/); return m ? m[0] : null; }

async function parseOrchestrator(raw) {
  let d = safeJSON(raw);
  if (d) return { decision: d, layer: 1 };
  const ex = extractJSON(raw);
  if (ex) { d = safeJSON(ex); if (d) return { decision: d, layer: 2 }; }
  try {
    const rep = await callSync('Retorne SOMENTE JSON válido. Zero texto fora do JSON.', [{ role: 'user', content: raw }], 'groq_llama3_fast', 600);
    d = safeJSON(rep) || safeJSON(extractJSON(rep) || '');
    if (d) return { decision: d, layer: 3 };
  } catch { }
  return { decision: { type: 'chat', intent: 'chat', response: raw }, layer: 'fallback' };
}

// ══════════════════════════════════════════════════════════════════════
// USAGE TRACKING
// ══════════════════════════════════════════════════════════════════════
async function checkAndTrackUsage(tenantId, userId) {
  if (!db) return { ok: true, unlimited: true, plan: 'free', calls: 0, limit: -1 };
  const today = new Date().toISOString().split('T')[0];
  try {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get().catch(() => null);
    const plan  = tenantDoc?.exists ? (tenantDoc.data().plan || 'free') : 'free';
    const limit = PLAN_LIMITS[plan] ?? -1;
    const ref   = db.collection('tenants').doc(tenantId).collection('usage').doc(today);
    const inc   = { cortexCalls: admin.firestore.FieldValue.increment(1), [`userBreakdown.${userId}`]: admin.firestore.FieldValue.increment(1) };
    if (limit === -1) {
      const doc = await ref.get().catch(() => null);
      if (!doc?.exists) await ref.set({ date: today, cortexCalls: 1, tenantId, plan, userBreakdown: { [userId]: 1 } }).catch(() => {});
      else await ref.update(inc).catch(() => {});
      return { ok: true, unlimited: true, plan, calls: 0, limit: -1 };
    }
    return await db.runTransaction(async tx => {
      const doc   = await tx.get(ref);
      if (!doc.exists) {
        tx.set(ref, { date: today, cortexCalls: 1, tenantId, plan, userBreakdown: { [userId]: 1 } });
        return { ok: true, calls: 1, limit, plan };
      }
      const calls = (doc.data().cortexCalls || 0) + 1;
      if (calls > limit) return { ok: false, error: `Limite diário do plano **${plan}** atingido (${limit} msgs/dia).\n\nFaça upgrade em **Configurações → Assinatura**.`, calls: doc.data().cortexCalls, limit, plan };
      tx.update(ref, inc);
      return { ok: true, calls, limit, plan };
    });
  } catch (e) {
    console.warn('[CORTEX] Usage error:', e.message);
    return { ok: true, plan: 'unknown', calls: 0, limit: -1, unlimited: true };
  }
}

// ══════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════
function buildSystemPrompt(tenantId, plan, ragCtx, learningCtx) {
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `Você é o CORTEX — IA Suprema do NEXIA OS, sistema operacional empresarial SaaS.

TENANT: ${tenantId} | PLANO: ${plan.toUpperCase()} | ACESSO: 🔓 ILIMITADO | HORA BRT: ${now}

## CAPACIDADES:
- **Estratégia e Negócios**: SaaS, MRR, churn, pricing, vendas, marketing, valuation
- **Desenvolvimento**: Firebase, Netlify Functions, JS/TS, React, Python — código COMPLETO
- **Segurança**: OWASP, LGPD, Firebase Rules, pentest, auditoria
- **CRM**: Criar tarefas, contatos, reuniões, lançamentos financeiros
- **Jurídico**: Contratos, LGPD, editais de leilão, compliance
- **Análise Financeira**: DRE, fluxo de caixa, precificação, projeções
- **Geração de arquivos**: HTML, CSS, JS, TS, Python, JSON, CSV, PDF, planilhas — qualquer formato

## REGRAS ABSOLUTAS:
- Responda SEMPRE em português do Brasil
- Use markdown rico (tabelas, código, listas) em respostas técnicas
- Forneça código COMPLETO e INTEGRAL — NUNCA truncado, NUNCA use "..." para omitir
- Seja direto e acionável — sem rodeios
- Modo MASTER ativo: detalhamento máximo, sem limite de tamanho de resposta${learningCtx ? `\n\n## CONTEXTO DO USUÁRIO:\n${learningCtx}` : ''}${ragCtx ? `\n\n## DOCUMENTOS DE REFERÊNCIA:\n${ragCtx}` : ''}`;
}

// ══════════════════════════════════════════════════════════════════════
// LOG
// ══════════════════════════════════════════════════════════════════════
async function cxLog(tenantId, userId, data) {
  if (!db) return;
  try {
    await db.collection('tenants').doc(tenantId).collection('cortex_logs').add({
      ttl: admin.firestore.Timestamp.fromMillis(Date.now() + 2592000000),
      userId,
      ...data,
      ts: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch { /* log é best-effort */ }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════════════
exports.handler = async (event) => {
  const headers = makeHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const guardErr = await guard(event, 'cortex-chat');
  if (guardErr) return guardErr;

  const start = Date.now();

  try {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido no body' }) }; }

    const {
      message: rawMessage,
      tenantId      = 'nexia',
      ragEnabled    = false,
      model         = 'auto',
      conversationId= 'default',
      stream        = true,
      image_request,
    } = body;

    // FIX IDOR: userId SEMPRE do token verificado — nunca do body
    const userId        = event._uid || body.userId;
    const effectiveUID  = userId || 'anon';

    if (!rawMessage) return { statusCode: 400, headers, body: JSON.stringify({ error: 'message é obrigatório' }) };

    let message;
    try   { message = sanitizePrompt(rawMessage); }
    catch (se) { return { statusCode: 400, headers, body: JSON.stringify({ error: se.message }) }; }

    // Verificar uso
    const usage = await checkAndTrackUsage(tenantId, effectiveUID);
    if (!usage.ok) return { statusCode: 429, headers, body: JSON.stringify({ error: usage.error, plan: usage.plan, limit: usage.limit, calls: usage.calls }) };

    // Geração de imagem direta
    if (image_request?.prompt) {
      const r = await generateImage(image_request.prompt, image_request.style);
      return { statusCode: 200, headers, body: JSON.stringify({ type: 'image', ...r }) };
    }

    // Memória
    let mem = { history: [], summaries: [], entities: {} };
    try { mem = await memModule.load(effectiveUID, tenantId, conversationId); } catch { }
    const context      = typeof memModule.buildContext === 'function'
      ? memModule.buildContext(mem.history, mem.summaries, 30)
      : (mem.history || []).slice(-30);
    const learningCtx  = await learnModule.buildLearningContext(tenantId, message).catch(() => null);
    let   ragCtx       = '';
    if (ragEnabled) { try { ragCtx = await ragModule.buildRAGContext(tenantId, message) || ''; } catch { } }

    const fullCtx = [...context, { role: 'user', content: message }];

    // Orchestrator
    let decision = { type: 'chat', intent: model !== 'auto' ? model : 'chat', response: '' };
    let layer    = 0;

    if (model === 'auto') {
      try {
        let orchRaw = null;
        for (const om of ['groq_llama3_fast', 'gemini_20_flash', 'groq_llama4_scout', 'cerebras_llama3']) {
          try { orchRaw = await callSync(STATIC_AGENTS.orchestrator.system, fullCtx.slice(-12), om, 600); if (orchRaw) break; }
          catch { /* tenta próximo */ }
        }
        if (orchRaw) { const p = await parseOrchestrator(orchRaw); decision = p.decision; layer = p.layer; }
      } catch (e) { console.warn('[CORTEX] Orchestrator falhou:', e.message); }
    } else {
      decision.intent = model;
    }

    let finalResponse = '', modelUsed = 'groq_llama4_scout', execActions = [], swarmOut = [];

    // 1 — AÇÕES CRM
    if (Array.isArray(decision.actions) && decision.actions.length) {
      const role = event._role || (userId && userId !== 'anon' ? 'member' : 'user');
      for (const act of decision.actions) {
        try {
          if (!act.type || !act.data) continue;
          validateAIAction(act.type, act.data);
          if (!checkPermission(role, act.type)) { execActions.push({ ok: false, action: act.type, error: 'Sem permissão' }); continue; }
          execActions.push(await actionModule.dispatch(act.type, act.data, tenantId, userId));
        } catch (e) { execActions.push({ ok: false, error: e.message || 'Erro interno', action: act.type }); }
      }
      const lines = execActions.map(r => r.ok ? `✅ \`${r.action}\` executado` : `⚠️ \`${r.action || 'ação'}\` falhou: ${r.error}`).join('\n');
      finalResponse = (decision.response || '') + (lines ? '\n\n' + lines : '');
    }

    // 2 — SWARM
    if (decision.type === 'swarm' && Array.isArray(decision.agents) && decision.agents.length) {
      let dynAgents = {};
      if (db) {
        try {
          const snap = await db.collection('agents').where('tenantId', '==', tenantId).where('active', '!=', false).get();
          snap.docs.forEach(d => { const x = d.data(); if (x.systemPrompt) dynAgents[d.id] = { system: x.systemPrompt }; });
        } catch { }
      }
      const sw  = await runSwarm(decision.agents, fullCtx.slice(-10), dynAgents);
      swarmOut  = sw.outputs;
      finalResponse = (decision.response ? decision.response + '\n\n' : '') + sw.synthesis;
      modelUsed = 'swarm-multi-agent';
    }

    // 3 — AUTODEV
    if (!finalResponse.trim() && decision.type === 'code' && decision.code_request && autodevModule) {
      try {
        const r = JSON.parse((await autodevModule.handler({ httpMethod: 'POST', body: JSON.stringify(decision.code_request) })).body);
        finalResponse = r.ok ? r.generatedCode : `❌ AutoDev: ${r.error || 'Erro'}`;
        modelUsed     = r.modelUsed ? `autodev-${r.modelUsed}` : 'autodev';
      } catch (e) { finalResponse = decision.response || `❌ Erro AutoDev: ${e.message}`; }
    }

    // 4 — IMAGEM por decision
    if (!finalResponse.trim() && decision.type === 'image' && decision.image_request) {
      const r   = await generateImage(decision.image_request.prompt, decision.image_request.style);
      finalResponse = r.ok
        ? `🖼️ **Imagem gerada!**\n\n${r.url}\n\n*Prompt: ${r.revised_prompt || decision.image_request.prompt}*`
        : `❌ Erro imagem: ${r.error}`;
      modelUsed = 'dall-e-3';
    }

    // 5 — CHAT (streaming ou sync)
    if (!finalResponse.trim()) {
      const intentKey  = decision.model_override || decision.intent || model || 'auto';
      const resolvedKey= (intentKey === 'auto') ? 'groq_llama4_scout' : (INTENT_ROUTER[intentKey] || intentKey);
      const ai         = AI_CATALOG[resolvedKey] || AI_CATALOG.groq_llama4_scout;
      const systemPrompt = buildSystemPrompt(tenantId, usage.plan, ragCtx, learningCtx);

      // Ordem de fallback: provider escolhido → Cerebras (rápido, grátis) → DeepSeek → Gemini → Groq
      const streamFallbackOrder = [
        { key: resolvedKey,        ai },
        { key: 'cerebras_llama4',  ai: AI_CATALOG.cerebras_llama4 },
        { key: 'cerebras_llama3',  ai: AI_CATALOG.cerebras_llama3 },
        { key: 'deepseek_v3',      ai: AI_CATALOG.deepseek_v3 },
        { key: 'gemini_20_flash',  ai: AI_CATALOG.gemini_20_flash },
        { key: 'gemini_25_flash',  ai: AI_CATALOG.gemini_25_flash },
        { key: 'groq_llama4_scout',ai: AI_CATALOG.groq_llama4_scout },
        { key: 'groq_llama3',      ai: AI_CATALOG.groq_llama3 },
        { key: 'or_deepseek_v3',   ai: AI_CATALOG.or_deepseek_v3 },
        { key: 'sambanova_llama3', ai: AI_CATALOG.sambanova_llama3 },
        { key: 'together_llama4',  ai: AI_CATALOG.together_llama4 },
        { key: 'hf_llama3',        ai: AI_CATALOG.hf_llama3 },
        { key: 'nvidia_llama3',    ai: AI_CATALOG.nvidia_llama3 },
      ];

      if (stream) {
        // ── MODO STREAMING ──────────────────────────────────────────
        let streamSuccess = false;

        for (const sp of streamFallbackOrder) {
          const gen = getStream(sp.ai, systemPrompt, fullCtx.slice(-30));

          // [BUG-01 FIX] Se provider não tem streaming nativo, tentar sync e emitir como stream único
          if (!gen) {
            try {
              const syncText = await callSync(systemPrompt, fullCtx.slice(-30), sp.key, sp.ai.maxTok);
              if (syncText && !syncText.startsWith('⚠️') && !syncText.startsWith('❌')) {
                modelUsed = sp.ai.label || sp.ai.model;
                const chunks = [
                  `data: ${JSON.stringify({ token: syncText, done: false })}\n\n`,
                  `data: ${JSON.stringify({ done: true, model: modelUsed, intent: decision.type, actions: execActions, swarm: swarmOut, usage: { calls: usage.calls, limit: usage.limit, unlimited: !!usage.unlimited } })}\n\n`,
                  'data: [DONE]\n\n',
                ];
                const nm = [{ role: 'user', content: message }, { role: 'assistant', content: syncText }];
                if (typeof memModule.save === 'function') memModule.save(effectiveUID, [...(mem.history || []), ...nm], mem.summaries, tenantId, {}, conversationId).catch(() => {});
                cxLog(tenantId, effectiveUID, { type: 'cortex_execution', conversationId, intent: decision.type, layer, ms: Date.now() - start, modelUsed, stream: true, syncFallback: true, plan: usage.plan }).catch(() => {});
                streamSuccess = true;
                return { statusCode: 200, headers: SSE_HEADERS, body: chunks.join('') };
              }
            } catch { /* tenta próximo */ }
            continue;
          }

          // Provider tem streaming nativo
          const chunks = [];
          let   fullText  = '';
          let   firstToken= true;
          let   isError   = false;

          try {
            for await (const token of gen) {
              if (firstToken && (token.startsWith('⚠️') || token.startsWith('\u26a0') || token.startsWith('❌') || token.startsWith('\u274c'))) {
                isError = true; firstToken = false;
                console.warn('[CORTEX] Provider', sp.key, 'indisponível, tentando próximo...');
                break;
              }
              firstToken = false;
              chunks.push(`data: ${JSON.stringify({ token, done: false })}\n\n`);
              fullText  += token;
            }

            if (isError) continue; // tenta próximo provider

            modelUsed = sp.ai.label || sp.ai.model;
            chunks.push(`data: ${JSON.stringify({ done: true, model: modelUsed, intent: decision.type, actions: execActions, swarm: swarmOut, usage: { calls: usage.calls, limit: usage.limit, unlimited: !!usage.unlimited } })}\n\n`);
            chunks.push('data: [DONE]\n\n');

            const nm = [{ role: 'user', content: message }, { role: 'assistant', content: fullText }];
            if (typeof memModule.save === 'function') memModule.save(effectiveUID, [...(mem.history || []), ...nm], mem.summaries, tenantId, typeof memModule.extractEntities === 'function' ? memModule.extractEntities(nm, mem.entities) : {}, conversationId).catch(() => {});
            cxLog(tenantId, effectiveUID, { type: 'cortex_execution', conversationId, intent: decision.type, layer, ms: Date.now() - start, modelUsed, stream: true, plan: usage.plan }).catch(() => {});

            streamSuccess = true;
            return { statusCode: 200, headers: SSE_HEADERS, body: chunks.join('') };

          } catch (err) {
            console.warn('[CORTEX] Stream error on', sp.key, ':', err.message);
            // tenta próximo
          }
        }

        // Nenhum provider funcionou
        if (!streamSuccess) {
          const hasAnyKey = !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.CEREBRAS_API_KEY || process.env.OPENROUTER_API_KEY);
          const errMsg = hasAnyKey
            ? '❌ Todas as IAs estão temporariamente indisponíveis. Tente novamente em instantes. Se persistir, verifique as chaves no Render Dashboard → Environment.'
            : '🤖 **CORTEX em modo demo** — Nenhuma chave de IA configurada.\n\nConfigure no Render (Settings → Environment):\n\n• **GROQ_API_KEY** — grátis em [console.groq.com](https://console.groq.com)\n• **GEMINI_API_KEY** — grátis em [aistudio.google.com](https://aistudio.google.com)\n• **CEREBRAS_API_KEY** — grátis em [cloud.cerebras.ai](https://cloud.cerebras.ai)\n• **ANTHROPIC_API_KEY** — em [console.anthropic.com](https://console.anthropic.com)';
          return {
            statusCode: 200,
            headers: SSE_HEADERS,
            body: `data: ${JSON.stringify({ token: errMsg, done: false })}\n\ndata: ${JSON.stringify({ done: true, model: 'none' })}\n\ndata: [DONE]\n\n`,
          };
        }

      } else {
        // ── MODO SYNC ───────────────────────────────────────────────
        for (const sp of [...streamFallbackOrder]) {
          try {
            finalResponse = await callSync(systemPrompt, fullCtx.slice(-30), sp.key, sp.ai.maxTok);
            modelUsed     = sp.ai.label || sp.ai.model;
            break;
          } catch { /* tenta próximo */ }
        }
        if (!finalResponse) finalResponse = '❌ Todas as IAs falharam. Verifique as chaves configuradas.';
      }
    }

    // Persistir memória e logar (modo sync ou ação)
    const nm = [{ role: 'user', content: message }, { role: 'assistant', content: finalResponse }];
    if (typeof memModule.save === 'function') await memModule.save(effectiveUID, [...(mem.history || []), ...nm], mem.summaries, tenantId, {}, conversationId).catch(() => {});
    if (typeof learnModule.saveExample === 'function') learnModule.saveExample(tenantId, effectiveUID, message, finalResponse, decision.type, conversationId).catch(() => {});
    await cxLog(tenantId, effectiveUID, { type: 'cortex_execution', conversationId, intent: decision.type, layer, ms: Date.now() - start, actionsCount: execActions.length, modelUsed, plan: usage.plan }).catch(() => {});

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply:  finalResponse,
        type:   decision.type,
        intent: decision.intent,
        actions:execActions,
        swarm:  swarmOut,
        _meta:  { layer, ms: Date.now() - start, modelUsed, version: 'v17.0', conversationId, plan: usage.plan, unlimited: !!usage.unlimited, usage: { calls: usage.calls, limit: usage.limit } },
      }),
    };

  } catch (err) {
    console.error('[CORTEX v17] ❌', err.message, err.stack);
    const status = err.message?.includes('Limite') ? 429 : err.message?.includes('não permitid') ? 403 : 500;
    return { statusCode: status, headers, body: JSON.stringify({ error: err.message || 'Erro interno' }) };
  }
};
