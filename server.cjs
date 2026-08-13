const express = require('express')
const httpProxy = require('http-proxy')
const cheerio = require('cheerio')
const path = require('path')
const crypto = require('crypto')

const app = express()

const AUTH_USER = process.env.AUTH_USER || 'Homelab'
const AUTH_PASS = process.env.AUTH_PASS || 'Zasada3434'
const AUTH_TTL = 24 * 60 * 60 * 1000
const sessions = new Map()

function makeToken () {
  return crypto.randomBytes(32).toString('hex')
}
function getToken (req) {
  const h = req.headers.authorization || ''
  return h.replace(/^Bearer\s+/i, '') || null
}
function validSession (token) {
  if (!token || !sessions.has(token)) return false
  if (Date.now() - sessions.get(token) > AUTH_TTL) {
    sessions.delete(token)
    return false
  }
  return true
}

const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true, selfHandleResponse: true })
const plainProxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true })

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
  'ollama-hl': 'http://192.168.1.42:11434',
  opencode: 'http://192.168.1.33:36783',
  hermes: 'http://192.168.1.33:9119',
  unsloth: 'http://192.168.1.33:8888',
  t3code: 'http://192.168.1.33:3773',
}

function buildPatchScript(base) {
  const b = JSON.stringify(base)
  return `(function(){var b=${b};function r(u){if(typeof u==='string'){var o=window.location.origin;if(u.indexOf(o)===0&&u.indexOf(o+b)!==0)return o+b+u.slice(o.length).replace(/^\\//,'');if(u.charAt(0)==='/'&&u.charAt(1)!=='/'&&u.indexOf(b)!==0)return b+u.slice(1);var wm=u.match(/^(wss?:\\/\\/[^/]+)(\\/.*|$)/);if(wm&&wm[2].indexOf(b)!==0)return wm[1]+b+wm[2].slice(1);}return u;}var of=window.fetch;if(of){window.fetch=function(i,o){if(typeof i==='string'){i=r(i);}else if(i&&i.url&&i.constructor&&i.constructor.name==='Request'){try{i=new Request(r(i.url),i);}catch(e){}}return of.call(this,i,o);};}var oo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=r(u);return oo.apply(this,arguments);};var oe=window.EventSource;if(oe){window.EventSource=function(u,o){return new oe(r(u),o);};window.EventSource.prototype=oe.prototype;window.EventSource.CONNECTING=oe.CONNECTING;window.EventSource.OPEN=oe.OPEN;window.EventSource.CLOSED=oe.CLOSED;}var ow=window.WebSocket;if(ow){window.WebSocket=function(u,p){return new ow(r(u),p);};window.WebSocket.prototype=ow.prototype;window.WebSocket.CONNECTING=ow.CONNECTING;window.WebSocket.OPEN=ow.OPEN;window.WebSocket.CLOSING=ow.CLOSING;window.WebSocket.CLOSED=ow.CLOSED;}})();`
}

proxy.on('proxyReq', function (proxyReq, req, res, options) {
  proxyReq.removeHeader('accept-encoding')
  proxyReq.removeHeader('Accept-Encoding')

  try {
    const turl = new URL(req._proxyTarget || 'http://localhost')
    const targetOrigin = turl.protocol + '//' + turl.host
    proxyReq.setHeader('Origin', targetOrigin)
    if (req.headers.referer) {
      proxyReq.setHeader('Referer', targetOrigin + '/')
    }
  } catch {}
})

proxy.on('proxyRes', function (proxyRes, req, res) {
  const base = req._proxyBase || '/'

  delete proxyRes.headers['x-frame-options']
  if (proxyRes.headers['content-security-policy']) {
    proxyRes.headers['content-security-policy'] = proxyRes.headers['content-security-policy']
      .replace(/frame-ancestors[^;]*;?/gi, '')
      .replace(/script-src[^;]*;?/gi, '')
      .replace(/default-src[^;]*;?/gi, '')
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
        } else {
          $('base').attr('href', base)
        }
        $('head').prepend(`<script>${buildPatchScript(base)}</script>`)
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

  if (req.params.name === 'ollama-hl') {
    return plainProxy.web(req, res, { target: 'http://192.168.1.42:11434', changeOrigin: true })
  }

  proxy.web(req, res, { target, selfHandleResponse: true })
})

app.use('/ollama/api', function (req, res) {
  req.url = '/api' + (req.url || '')
  plainProxy.web(req, res, { target: 'http://192.168.1.42:11434', changeOrigin: true })
})

app.use('/hl-ollama/api', function (req, res) {
  req.url = '/api' + (req.url || '')
  plainProxy.web(req, res, { target: 'http://192.168.1.42:11434', changeOrigin: true })
})

app.use('/hl-lmstudio', function (req, res) {
  req.url = req.url || '/'
  plainProxy.web(req, res, { target: 'http://172.23.0.8:1234', changeOrigin: true })
})

app.post('/api/login', express.json(), function (req, res) {
  const body = req.body || {}
  if (body.username === AUTH_USER && body.password === AUTH_PASS) {
    const token = makeToken()
    sessions.set(token, Date.now())
    res.json({ token, username: AUTH_USER })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

app.post('/api/logout', function (req, res) {
  const token = getToken(req)
  if (token) sessions.delete(token)
  res.json({ ok: true })
})

app.get('/api/me', function (req, res) {
  const token = getToken(req)
  if (validSession(token)) {
    res.json({ username: AUTH_USER })
  } else {
    res.status(401).json({ error: 'Unauthorized' })
  }
})

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 5173
const server = app.listen(PORT, '0.0.0.0', function () {
  console.log('Orbital Agent OS running on port ' + PORT)
})

server.on('upgrade', function (req, socket, head) {
  const url = req.url || ''
  const m = url.match(/^\/app\/([^/]+)/)
  if (!m) {
    if (url.indexOf('/ollama/') === 0) return plainProxy.ws(req, socket, head, { target: 'http://localhost:11434' })
    if (url.indexOf('/hl-ollama/') === 0) return plainProxy.ws(req, socket, head, { target: 'http://192.168.1.42:11434' })
    return socket.destroy()
  }
  const name = m[1]
  const target = targets[name]
  if (!target) { return socket.destroy() }
  req.url = url.replace('/app/' + name, '') || '/'
  proxy.ws(req, socket, head, { target })
})
