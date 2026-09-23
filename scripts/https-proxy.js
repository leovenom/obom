/**
 * Termina TLS na frente de `next start` (HTTP) para testes no iPhone.
 * Uso interno: scripts/prod-mobile.sh
 */
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CERT_DIR = path.join(ROOT, 'certificates');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || process.env.PORT || '3001', 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '13001', 10);
const BACKEND = `127.0.0.1:${BACKEND_PORT}`;

const keyPath = path.join(CERT_DIR, 'mobile-key.pem');
const certPath = path.join(CERT_DIR, 'mobile.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Certificados em falta. Corra: npm run start:mobile (gera automaticamente)');
  process.exit(1);
}

const server = https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
  (clientReq, clientRes) => {
    const opts = {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: clientReq.url,
      method: clientReq.method,
      headers: { ...clientReq.headers, host: clientReq.headers.host || BACKEND },
    };

    const proxy = http.request(opts, (upstream) => {
      clientRes.writeHead(upstream.statusCode || 502, upstream.headers);
      upstream.pipe(clientRes);
    });

    proxy.on('error', (err) => {
      console.error('[https-proxy] upstream error:', err.message);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      clientRes.end('Servidor OBOM indisponível. Aguarde o arranque do Next.js.');
    });

    clientReq.pipe(proxy);
  }
);

server.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`[https-proxy] HTTPS :${HTTPS_PORT} → http://${BACKEND}`);
});
