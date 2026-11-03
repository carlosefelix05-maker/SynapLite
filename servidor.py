#!/usr/bin/env python3
"""Servidor local de SynapLite: sirve la carpeta app/ sin caché HTTP (para que siempre se
reciba la versión más reciente) en IPv4 e IPv6. Uso: python3 servidor.py [puerto]"""
import http.server, socket, sys, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        if self.path.split('?')[0].endswith('sw.js'):
            self.send_header('Service-Worker-Allowed', '/')
        super().end_headers()
    def log_message(self, *a):
        pass

class DualStack(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6
    def server_bind(self):
        try: self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except Exception: pass
        super().server_bind()

if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app'))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    with DualStack(('::', port), Handler) as s:
        print(f'SynapLite en http://localhost:{port}  (Ctrl+C para detener)')
        s.serve_forever()
