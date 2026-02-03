#!/usr/bin/env python3
"""Simple HTTP health server for WireGuard VPN"""

import http.server
import json
import os
import subprocess
import socketserver

PORT = int(os.environ.get('HEALTH_PORT', 9090))
WG_INTERFACE = os.environ.get('WIREGUARD_INTERFACE', 'wg0')


class HealthHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress logging

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_text(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(data.encode())

    def check_interface(self):
        try:
            result = subprocess.run(
                ['ip', 'link', 'show', WG_INTERFACE],
                capture_output=True, timeout=5
            )
            return result.returncode == 0
        except:
            return False

    def check_wireguard(self):
        try:
            result = subprocess.run(
                ['wg', 'show', WG_INTERFACE],
                capture_output=True, timeout=5
            )
            return result.returncode == 0
        except:
            return False

    def get_wg_stats(self):
        try:
            result = subprocess.run(
                ['wg', 'show', WG_INTERFACE, 'transfer'],
                capture_output=True, text=True, timeout=5
            )
            rx, tx = 0, 0
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split()
                    if len(parts) >= 3:
                        rx += int(parts[1])
                        tx += int(parts[2])

            peers_result = subprocess.run(
                ['wg', 'show', WG_INTERFACE, 'peers'],
                capture_output=True, text=True, timeout=5
            )
            peers = len([l for l in peers_result.stdout.strip().split('\n') if l])

            return peers, rx, tx
        except:
            return 0, 0, 0

    def do_GET(self):
        if self.path == '/health':
            if self.check_interface():
                self.send_json(200, {'status': 'healthy', 'interface': WG_INTERFACE})
            else:
                self.send_json(503, {'status': 'unhealthy', 'error': 'interface down'})

        elif self.path == '/ready':
            if self.check_wireguard():
                self.send_json(200, {'status': 'ready'})
            else:
                self.send_json(503, {'status': 'not ready'})

        elif self.path == '/metrics':
            peers, rx, tx = self.get_wg_stats()
            metrics = f"""# HELP wireguard_peers Number of connected peers
# TYPE wireguard_peers gauge
wireguard_peers{{interface="{WG_INTERFACE}"}} {peers}
# HELP wireguard_received_bytes Total bytes received
# TYPE wireguard_received_bytes counter
wireguard_received_bytes{{interface="{WG_INTERFACE}"}} {rx}
# HELP wireguard_sent_bytes Total bytes sent
# TYPE wireguard_sent_bytes counter
wireguard_sent_bytes{{interface="{WG_INTERFACE}"}} {tx}
"""
            self.send_text(200, metrics)

        elif self.path == '/info':
            public_key = os.environ.get('SERVER_PUBLIC_KEY', 'unknown')
            port = os.environ.get('WIREGUARD_PORT', '51820')
            self.send_json(200, {
                'publicKey': public_key,
                'interface': WG_INTERFACE,
                'port': port
            })

        else:
            self.send_json(404, {'error': 'not found'})


if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), HealthHandler) as httpd:
        print(f'Health server listening on port {PORT}')
        httpd.serve_forever()
