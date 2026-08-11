const express = require('express')
const httpProxy = require('http-proxy')
const cheerio = require('cheerio')
const path = require('path')
const url = require('url')

const app = express()
const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: false, selfHandleResponse: true })
const plainProxy = httpProxy.createProxyServer({ changeOrigin: true, ws: false })

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
  openship: 'http://192.168.1.42:3148',
  nextcloud: 'http://192.168.1.42:8866',
}

proxy.on('proxyReq', function (proxyReq, req, res, options) {
  proxyReq.removeHeader('accept-encoding')
  proxyReq.removeHeader('Accept-Encoding')

  const turl = new url.URL(req._proxyTarget || 'http://localhost')
  const targetOrigin = turl.protocol + '//' + turl.host
  proxyReq.setHeader('Origin', targetOrigin)
  if (req.headers.referer) {
    proxyReq.setHeader('Referer', targetOrigin + '/')
  }
})

proxy.on('proxyRes', function (proxyRes, req, res) {
  const base = req._proxyBase || '/'

  delete proxyRes.headers['x-frame-options']
  if (proxyRes.headers['content-security-policy']) {
    proxyRes.headers['content-security-policy'] = proxyRes.headers['content-security-policy']
      .replace(/frame-ancestors[^;]*;?/gi, '')
      .replace(/;\s*$/, '')
    if (!proxyRes.headers['content-security-policy'].trim()) delete proxyRes.headers['content-security-policy']
  }

  const loc = proxyRes.headers['location']
  if (loc) {
    if (loc.startsWith('/') && !loc.startsWith(base)) {
      proxyRes.headers['location'] = base + loc.replace(/^\//, '')
    }
  }

  const ct = (proxyRes.headers['content-type'] || '').toLowerCase()
  const isHTML = ct.includes('text/html') || ct.includes('application/xhtml')

  if (isHTML) {
    delete proxyRes.headers['content-length']
    let chunks = []
    proxyRes.on('data', chunk => chunks.push(chunk))
    proxyRes.on('end', () => {
      try {
        let body = Buffer.concat(chunks).toString()
        const $ = cheerio.load(body)
        if ($('base').length === 0) {
          $('head').prepend(`<base href="${base}">`)
        }
        $('[src^="/"]').each((i, el) => {
          const src = $(el).attr('src')
          if (src && !src.startsWith(base)) $(el).attr('src', base + src.replace(/^\//, ''))
        })
        $('[href^="/"]').each((i, el) => {
          const href = $(el).attr('href')
          if (href && !href.startsWith(base) && !href.startsWith('#')) $(el).attr('href', base + href.replace(/^\//, ''))
        })
        $('form[action^="/"]').each((i, el) => {
          const action = $(el).attr('action')
          if (action && !action.startsWith(base)) $(el).attr('action', base + action.replace(/^\//, ''))
        })
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        res.end($.html())
      } catch {
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        res.end(Buffer.concat(chunks))
      }
    })
  } else {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  }
})

proxy.on('error', function (err, req, res) {
  if (!res.headersSent) { res.writeHead(503); res.end('Service unavailable') }
})

plainProxy.on('error', function (err, req, res) {
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Ollama unreachable', message: err.message }))
  }
})

app.use('/app/:name', function (req, res) {
  const target = targets[req.params.name]
  if (!target) { res.writeHead(404); return res.end('Service not found') }
  req._proxyBase = '/app/' + req.params.name + '/'
  req._proxyTarget = target
  req.url = req.url.replace('/app/' + req.params.name, '') || '/'
  proxy.web(req, res, { target, selfHandleResponse: true })
})

app.use('/ollama/api', function (req, res) {
  plainProxy.web(req, res, { target: 'http://localhost:11434', changeOrigin: true })
})

app.use('/hl-ollama/api', function (req, res) {
  plainProxy.web(req, res, { target: 'http://192.168.1.42:11434', changeOrigin: true })
})

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 5173
app.listen(PORT, '0.0.0.0', function () {
  console.log('Orbital Agent OS running on port ' + PORT)
})
