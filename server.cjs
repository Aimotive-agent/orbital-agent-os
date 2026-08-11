const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const path = require('path')

const app = express()

const proxyOpts = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: (p) => p.replace(/^\/app\/[^/]+/, '') || '/',
  on: {
    proxyRes: (proxyRes) => {
      delete proxyRes.headers['x-frame-options']
      if (proxyRes.headers['content-security-policy']) {
        proxyRes.headers['content-security-policy'] = proxyRes.headers['content-security-policy']
          .replace(/frame-ancestors[^;]*;?/gi, '')
      }
      const loc = proxyRes.headers['location']
      if (loc) {
        const prefix = proxyRes.req.originalUrl?.split('/').slice(0, 3).join('/') || ''
        if (loc.startsWith('/') && !loc.startsWith(prefix)) {
          proxyRes.headers['location'] = prefix + loc
        }
      }
    },
    error: (err, req, res) => {
      res.writeHead(503, { 'Content-Type': 'text/plain' })
      res.end('Service unavailable: ' + (err.message || 'connection failed'))
    },
  },
})

app.use('/app/jellyfin', proxyOpts('http://192.168.1.42:8096'))
app.use('/app/immich', proxyOpts('http://192.168.1.42:2283'))
app.use('/app/n8n', proxyOpts('http://192.168.1.42:5678'))
app.use('/app/homepage', proxyOpts('http://192.168.1.42:3699'))
app.use('/app/lmstudio', proxyOpts('http://192.168.1.42:3004'))
app.use('/app/hivekeep', proxyOpts('http://192.168.1.42:8018'))
app.use('/app/karakeep', proxyOpts('http://192.168.1.42:3088'))
app.use('/app/paperless', proxyOpts('http://192.168.1.42:8060'))
app.use('/app/dify', proxyOpts('http://192.168.1.42:3003'))
app.use('/app/convex', proxyOpts('http://192.168.1.42:6791'))
app.use('/app/weather', proxyOpts('http://192.168.1.42:8070'))
app.use('/app/search', proxyOpts('http://192.168.1.42:3100'))
app.use('/app/local', proxyOpts('http://192.168.1.42:3101'))
app.use('/app/files', proxyOpts('http://192.168.1.42:3102'))
app.use('/app/openwebui', proxyOpts('http://64.118.132.92:8080'))
app.use('/app/langflow', proxyOpts('http://64.118.132.92:7860'))
app.use('/app/kestra', proxyOpts('http://64.118.132.92:8085'))

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 5173
app.listen(PORT, '0.0.0.0', () => {
  console.log('Orbital Agent OS running on port ' + PORT)
})
