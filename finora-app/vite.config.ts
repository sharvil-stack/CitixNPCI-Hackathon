
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const targets: Record<string, string> = {
    cardwise: env.CARDWISE_URL || 'http://127.0.0.1:8000',
    schemes: env.SCHEMES_URL || 'http://127.0.0.1:8001',
    study: env.STUDY_URL || 'http://127.0.0.1:8002',
    scam: env.SCAM_URL || 'http://127.0.0.1:8080',
    auth: env.AUTH_URL || 'http://127.0.0.1:8080',
  };

  const proxy: Record<string, any> = {};

  for (const [name, target] of Object.entries(targets)) {
    proxy[`/svc/${name}`] = {
      target,
      changeOrigin: true,
      timeout: 120000,
      proxyTimeout: 120000,
      rewrite: (p: string) =>
        p.replace(new RegExp(`^/svc/${name}`), ''),
      configure: (p: any) =>
        p.on('error', (_e: any, _req: any, res: any) => {
          if (res && !res.headersSent && res.writeHead) {
            res.writeHead(502, {
              'content-type': 'application/json',
            });
            res.end(
              JSON.stringify({
                error: 'service_unreachable',
                service: name,
                target,
              }),
            );
          }
        }),
    };
  }

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 5173, proxy },
  };
});

