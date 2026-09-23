const { spawn } = require('child_process');
const net = require('net');
const os = require('os');

const BASE_PORT = parseInt(process.env.PORT, 10) || 3001;
const MAX_ATTEMPTS = 10;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const n of iface || []) {
      if (n.family === 'IPv4' && !n.internal) return n.address;
    }
  }
  return null;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findPort(start) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const port = start + i;
    if (await isPortFree(port)) return port;
    console.warn(`Porta ${port} em uso, tentando ${port + 1}...`);
  }
  throw new Error(`Nenhuma porta livre entre ${start} e ${start + MAX_ATTEMPTS - 1}`);
}

(async () => {
  const port = await findPort(BASE_PORT);
  const ip = getLocalIp();

  console.log(`Iniciando Next.js na porta ${port}...`);
  console.log(`Local:   http://localhost:${port}`);
  if (ip) console.log(`Celular: http://${ip}:${port}`);

  const child = spawn('npx', ['next', 'start', '-p', String(port)], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(port) },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
})();
