import { defineConfig } from 'vite'

const proxyResHandler = (prefix) => (proxyRes, req, res) => {
  delete proxyRes.headers['x-frame-options']
  if (proxyRes.headers['content-security-policy']) {
    proxyRes.headers['content-security-policy'] = proxyRes.headers['content-security-policy']
      .replace(/frame-ancestors[^;]*;?/gi, '')
  }
  const loc = proxyRes.headers['location']
  if (loc && loc.startsWith('/') && !loc.startsWith(`/${prefix}/`)) {
    proxyRes.headers['location'] = `/${prefix}${loc}`
  }
}

const makeProxy = (host, port, prefix) => ({
  target: 'http://' + host + ':' + port,
  changeOrigin: true,
  rewrite: p => p.replace(new RegExp('^/' + prefix), '') || '/',
  configure: (proxy) => proxy.on('proxyRes', proxyResHandler(prefix)),
})

export default defineConfig({
  server: {
    proxy: {
      '/ollama': { target: 'http://127.0.0.1:11434', changeOrigin: true, rewrite: p => p.replace(/^\/ollama/, '') || '/' },
      '/hl-ollama': makeProxy('192.168.1.42', 11434, 'hl-ollama'),
      '/hl-jellyfin': makeProxy('192.168.1.42', 8096, 'hl-jellyfin'),
      '/hl-immich': makeProxy('192.168.1.42', 2283, 'hl-immich'),
      '/hl-n8n': makeProxy('192.168.1.42', 5678, 'hl-n8n'),
      '/hl-homepage': makeProxy('192.168.1.42', 3699, 'hl-homepage'),
      '/hl-lmstudio': makeProxy('192.168.1.42', 3004, 'hl-lmstudio'),
      '/hl-karakeep': makeProxy('192.168.1.42', 3088, 'hl-karakeep'),
      '/hl-hivekeep': makeProxy('192.168.1.42', 8018, 'hl-hivekeep'),
      '/hl-paperless': makeProxy('192.168.1.42', 8060, 'hl-paperless'),
      '/hl-dify': makeProxy('192.168.1.42', 3003, 'hl-dify'),
      '/hl-convex': makeProxy('192.168.1.42', 6791, 'hl-convex'),
      '/hl-weather': makeProxy('192.168.1.42', 8070, 'hl-weather'),
      '/hl-search': makeProxy('192.168.1.42', 3100, 'hl-search'),
      '/hl-local': makeProxy('192.168.1.42', 3101, 'hl-local'),
      '/hl-files': makeProxy('192.168.1.42', 3102, 'hl-files'),
      '/vps-openwebui': makeProxy('64.118.132.92', 8080, 'vps-openwebui'),
      '/vps-langflow': makeProxy('64.118.132.92', 7860, 'vps-langflow'),
      '/vps-kestra': makeProxy('64.118.132.92', 8085, 'vps-kestra'),
    },
  },
})
