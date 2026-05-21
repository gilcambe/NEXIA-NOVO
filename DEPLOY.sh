#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# NEXIA OS — DEPLOY DEFINITIVO v2
# Execute na raiz do repositório local:
#   chmod +x DEPLOY.sh && ./DEPLOY.sh
# ═══════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   NEXIA OS — DEPLOY DEFINITIVO v2   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Garantir que está na raiz do repo
if [ ! -f "server.js" ]; then
  echo "❌ ERRO: Execute este script na raiz do repositório (onde está server.js)"
  exit 1
fi

# 2. Verificar que package.json é JSON válido
echo "→ Verificando package.json..."
node -e "const p = require('./package.json'); console.log('  ✓ package.json válido — versão', p.version)" || {
  echo "❌ ERRO: package.json corrompido. Use o package.json do ZIP."
  exit 1
}

# 3. Verificar que out/index.html existe
echo "→ Verificando out/ pré-compilado..."
if [ ! -f "out/index.html" ]; then
  echo "❌ ERRO: out/index.html não encontrado. Extraia o ZIP completo primeiro."
  exit 1
fi
ASSET_COUNT=$(ls out/assets/ 2>/dev/null | wc -l)
echo "  ✓ out/index.html existe — $ASSET_COUNT assets"

# 4. Verificar server.js
echo "→ Verificando server.js..."
node --check server.js && echo "  ✓ server.js válido" || { echo "❌ server.js com erro"; exit 1; }

# 5. Git: adicionar TUDO incluindo out/
echo ""
echo "→ Adicionando arquivos ao Git..."
git add -A
git add -f out/
echo "  ✓ git add concluído"

# 6. Verificar que out/index.html está staged
STAGED=$(git status --short | grep "out/index.html" || true)
if [ -z "$STAGED" ]; then
  # Pode já estar commitado e sem mudanças — verificar se existe no repo
  TRACKED=$(git ls-files out/index.html)
  if [ -z "$TRACKED" ]; then
    echo "❌ ERRO: out/index.html não está sendo incluído no commit."
    echo "  Execute: git rm -r --cached out/ 2>/dev/null; git add -f out/"
    exit 1
  fi
  echo "  ✓ out/ já rastreado no repositório"
else
  echo "  ✓ out/ incluído no commit"
fi

# 7. Commit
echo "→ Fazendo commit..."
git commit -m "deploy: NEXIA OS v59 — package.json corrigido + out/ pre-compilado" || echo "  (nada novo para commitar)"

# 8. Push forçado
echo "→ Push para GitHub (force)..."
git push origin main --force
echo "  ✓ Push concluído"

# 9. Verificar no GitHub
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ DEPLOY ENVIADO PARA O GITHUB            ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║  AGORA FAÇA NO RENDER:                      ║"
echo "║  1. dashboard.render.com → NEXIA OS         ║"
echo "║  2. Settings → Build Command:               ║"
echo "║     npm install --omit=dev                  ║"
echo "║  3. Manual Deploy → Clear build cache       ║"
echo "║                                             ║"
echo "║  O log CORRETO vai mostrar APENAS:          ║"
echo "║  • npm install (SEM vite build)             ║"
echo "║  • [NEXIA] Frontend React: ✓               ║"
echo "╚═════════════════════════════════════════════╝"
