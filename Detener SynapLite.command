#!/bin/bash
# Detiene el servidor local de SynapLite (puerto 8766). Los datos no se borran.
PIDS=$(lsof -nP -t -iTCP:8766 -sTCP:LISTEN)
if [ -z "$PIDS" ]; then echo "SynapLite no estaba en ejecución."; else kill $PIDS && echo "Servidor de SynapLite detenido."; fi
