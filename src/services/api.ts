/**
 * NEXIA OS — API Service v4.0
 *
 * FIX CRÍTICO v4:
 * [BUG-401] streamCortex e TODOS os endpoints não enviavam
 *           Authorization: Bearer <token> — o middleware retornava 401
 *           em 100% das chamadas autenticadas.
 *
 * SOLUÇÃO: getAuthToken() busca o Firebase ID Token atualizado antes
 * de CADA request. Token expirado é renovado automaticamente via
 * getIdToken(forceRefresh=false) — Firebase já cuida da renovação.
 *
 * FALLBACK: se Firebase não está inicializado ou usuário não logado,
 * as chamadas ainda funcionam — o middleware aceita sem token para
 * rotas públicas, e retorna 401 claro para rotas protegidas.
 */

import { apiPath, healthUrl, firebaseConfigUrl } from "@/config/env";

// ── Token helper ──────────────────────────────────────────────────────
/**
 * Retorna o Firebase ID Token do usuário logado.
 * Retorna null se não há usuário autenticado (sem lançar erro).
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Importação dinâmica para não quebrar se Firebase não estiver pronto
    const { initFirebase } = await import("@/services/firebase");
    const result = await initFirebase();
    if (!result?.auth?.currentUser) return null;
    // forceRefresh=false: usa cache se token ainda válido (< 1h)
    return await result.auth.currentUser.getIdToken(false);
  } catch {
    return null;
  }
}

/**
 * Monta os headers padrão incluindo Authorization se houver token.
 */
async function buildHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Tipos ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  version: string;
  uptime: number;
  timestamp: string;
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface SentinelReport {
  okCount: number;
  totalEndpoints: number;
  errorCount: number;
  errors?: { url: string; error: string; status?: number }[];
}

export interface CortexStreamChunk {
  token?: string;
  done?: boolean;
  model?: string;
  intent?: string;
  actions?: unknown[];
  swarm?: unknown[];
  usage?: { calls: number; limit: number; unlimited?: boolean };
}

export interface CortexReply {
  reply: string;
  type: string;
  intent: string;
  _meta: {
    layer: number | string;
    ms: number;
    modelUsed: string;
    version: string;
    conversationId: string;
    plan: string;
    unlimited: boolean;
    usage: { calls: number; limit: number };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

// ── Fetch helper genérico ─────────────────────────────────────────────
async function _fetch<T>(
  url: string,
  opts: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<ApiResponse<T>> {
  try {
    const headers = await buildHeaders(opts.headers || {});
    const res = await fetch(url, {
      headers,
      method: opts.method ?? "GET",
      body: opts.body,
      signal: opts.signal,
    });
    const status = res.status;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Tenta parsear JSON de erro para mensagem mais legível
      try {
        const j = JSON.parse(body);
        return { error: j.error || j.message || body || `HTTP ${status}`, status };
      } catch {
        return { error: body || `HTTP ${status}`, status };
      }
    }
    const data = (await res.json()) as T;
    return { data, status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro de rede";
    return { error: msg, status: 0 };
  }
}

// ── streamCortex ──────────────────────────────────────────────────────
/**
 * Streaming SSE do Cortex com autenticação automática.
 * Retorna um AsyncGenerator que emite CortexStreamChunk a cada token.
 */
export async function* streamCortex(
  payload: {
    message: string;
    model?: string;
    tenantId?: string;
    conversationId?: string;
    ragEnabled?: boolean;
  },
  signal?: AbortSignal
): AsyncGenerator<CortexStreamChunk, void, unknown> {
  const url = apiPath("/cortex");

  const body = JSON.stringify({
    message:        payload.message,
    model:          payload.model === "auto" ? "auto" : (payload.model ?? "auto"),
    tenantId:       payload.tenantId ?? "nexia",
    stream:         true,
    conversationId: payload.conversationId ?? "default",
    ragEnabled:     payload.ragEnabled ?? false,
  });

  // Busca token ANTES do fetch — evita race condition de autenticação
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body, signal });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha de rede";
    yield { token: `❌ Erro de rede: ${msg}`, done: true };
    return;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let errMsg = `Erro na API (${res.status})`;
    if (res.status === 401) errMsg = "❌ Não autenticado — faça login novamente.";
    else if (res.status === 403) errMsg = "❌ Sem permissão para este tenant.";
    else if (res.status === 429) errMsg = "⏳ Limite de requisições atingido. Aguarde alguns segundos.";
    else {
      try { errMsg = JSON.parse(txt).error || errMsg; } catch { /* usa padrão */ }
    }
    yield { token: errMsg, done: true };
    return;
  }

  if (!res.body) {
    yield { token: "❌ Resposta vazia do servidor.", done: true };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        if (!data) continue;
        try {
          const parsed = JSON.parse(data) as CortexStreamChunk;
          yield parsed;
        } catch {
          // Linha mal-formada — emite como texto bruto
          yield { token: data, done: false };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── cortexChatSync ────────────────────────────────────────────────────
export async function cortexChatSync(payload: {
  message: string;
  model?: string;
  tenantId?: string;
  conversationId?: string;
}): Promise<ApiResponse<CortexReply>> {
  return _fetch<CortexReply>(apiPath("/cortex"), {
    method: "POST",
    body: JSON.stringify({
      message:        payload.message,
      model:          payload.model === "auto" ? "auto" : (payload.model ?? "auto"),
      tenantId:       payload.tenantId ?? "nexia",
      stream:         false,
      conversationId: payload.conversationId ?? "default",
    }),
  });
}

// ── API object ────────────────────────────────────────────────────────
export const api = {
  health: () => _fetch<HealthStatus>(healthUrl()),

  firebaseConfig: () => _fetch<FirebaseClientConfig>(firebaseConfigUrl()),

  sentinelScan: () =>
    _fetch<SentinelReport>(apiPath("/sentinel-qa"), {
      method: "POST",
      body: JSON.stringify({ mode: "scan" }),
    }),

  sentinelPing: () =>
    _fetch<{ ok: boolean; ts?: string }>(apiPath("/sentinel-qa") + "?action=ping"),

  sentinelHeal: (issues: AnyObj[]) =>
    _fetch<AnyObj>(apiPath("/sentinel-qa"), {
      method: "POST",
      body: JSON.stringify({ mode: "heal", issues }),
    }),

  cortexChat: cortexChatSync,

  models: () => _fetch<unknown>(apiPath("/models")),

  usage: (tenantId?: string) =>
    _fetch<unknown>(apiPath("/usage") + (tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "")),

  logs: (tenantId?: string) =>
    _fetch<unknown>(apiPath("/logs") + (tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "")),

  swarmRun: (payload: AnyObj) =>
    _fetch<unknown>(apiPath("/swarm"), {
      method: "POST",
      body: JSON.stringify({ ...payload, tenantId: payload.tenantId || "nexia" }),
    }),

  authHealth: () =>
    _fetch<unknown>(apiPath("/auth"), {
      method: "POST",
      body: JSON.stringify({ action: "health" }),
    }),

  tenantInfo: (tenantId: string) =>
    _fetch<unknown>(apiPath("/tenant") + `?tenantId=${encodeURIComponent(tenantId)}`),

  billingStatus: (tenantId: string) =>
    _fetch<unknown>(apiPath("/billing") + `?tenantId=${encodeURIComponent(tenantId)}`),

  agentRun: (payload: AnyObj) =>
    _fetch<unknown>(apiPath("/agent-run"), {
      method: "POST",
      body: JSON.stringify({ ...payload, tenantId: payload.tenantId || "nexia" }),
    }),

  metrics: (tenantId: string) =>
    _fetch<unknown>(apiPath("/metrics") + `?tenantId=${encodeURIComponent(tenantId)}`),

  observe: (tenantId: string) =>
    _fetch<unknown>(apiPath("/observe") + `?tenantId=${encodeURIComponent(tenantId)}`),

  kpiSummary: (tenantId: string) =>
    _fetch<unknown>(apiPath("/kpi") + `?action=summary&tenantId=${encodeURIComponent(tenantId)}`),

  memoryGet: (tenantId: string, conversationId = "default") =>
    _fetch<unknown>(apiPath("/memory"), {
      method: "POST",
      body: JSON.stringify({ tenantId, action: "get", conversationId }),
    }),

  memoryClear: (tenantId: string, conversationId = "default") =>
    _fetch<unknown>(apiPath("/memory"), {
      method: "POST",
      body: JSON.stringify({ tenantId, action: "clear", conversationId }),
    }),
};

export default api;
