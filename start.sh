#!/bin/bash
set -e
echo "[START.SH] Rodando build..."
npm run build
echo "[START.SH] Build OK. Subindo servidor..."
exec node server.js
