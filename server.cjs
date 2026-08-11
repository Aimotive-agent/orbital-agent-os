const express = require('express')
const httpProxy = require('http-proxy')
const path = require('path')

const app = express()
const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: false })

proxy.on('proxyRes', function (proxyRes, req) {
  delete proxyRes.headers['x-frame-options']
  if (proxyRes.headers['content-security-policy']) {
    proxyRes.headers['content-security-policy'] = proxyRes.headers['content-security-policy']
      .replace(/frame-ancestors[^;]*;?/gi, '')
  }
  const loc = proxyRes.headers['location']
  if (loc) {
    const base = '/' + req.url.split('/').slice(1, 3).join('/') + '/'
    if (loc.startsWith('/') && !loc.startsWith(base)) {
      proxyRes.headers['location'] = base + loc.replace(/^\//, '')
    }
  }
})

proxy.on('error', function (err, req, res) {
  res.writeHead(503, { 'Content-Type': 'text/plain' })
  res.end('Service unavailable')
})

const targets = {
  jellyfin: 'http://192.168.1.42:8096',
  immich: 'http://192.168.1.42:2283',
  n8n: 'http://192.168.1.42:5678',
  homepage: 'http://192.168.1.42:3699',
  lmstudio: 'http://192.168.1.42:3004',
  hivekeep: 'http://192.168.1.42:8018',
  karakeep: 'http://192.168.1.42:3088',
  paperless: 'http://192.168.1.42:8060',
  dify: 'http://192.168.1.42:3003',
  convex: 'http://192.168.1.42:6791',
  weather: 'http://192.168.1.42:8070',
  search: 'http://192.168.1.42:3100',
  local: 'http://192.168.1.42:3101',
  files: 'http://192.168.1.42:3102',
  openwebui: 'http://64.118.132.92:8080',
  langflow: 'http://64.118.132.92:7860',
  kestra: 'http://64.118.132.92:8085',
}

app.use('/app/:name', function (req, res) {
  const target = targets[req.params.name]
  if (!target) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    return res.end('Service not found')
  }
  req.url = req.url.replace('/app/' + req.params.name, '') || '/'
  proxy.web(req, res, { target })
})

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 5173
app.listen(PORT, '0.0.0.0', function () {
  console.log('Orbital Agent OS running on port ' + PORT)
})
