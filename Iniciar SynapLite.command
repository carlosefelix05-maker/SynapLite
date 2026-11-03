#!/bin/bash
# SynapLite · Pase de visita — regenera la app, inicia el servidor local (si no está corriendo) y la abre.
# Doble clic para usar. Puede cerrar esta ventana: el servidor sigue en segundo plano.
cd "$(dirname "$0")" || exit 1
PORT=8766
URL="http://localhost:$PORT"
python3 build_app.py >/dev/null 2>&1 || echo "Aviso: no se pudo regenerar app/ (se usa la última versión)."
if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "SynapLite ya está en ejecución en $URL"
else
  echo "Iniciando SynapLite en $URL ..."
  nohup python3 servidor.py $PORT >/dev/null 2>&1 &
  disown
  for i in 1 2 3 4 5 6 7 8 9 10; do
    lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1 && break
    sleep 0.3
  done
fi
open "$URL"
echo "Listo. Puede cerrar esta ventana."
