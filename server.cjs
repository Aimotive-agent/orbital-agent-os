const express = require('express')
const httpProxy = require('http-proxy')
const cheerio = require('cheerio')
const path = require('path')
const crypto = require('crypto')

const app = express()

const AUTH_USER = process.env.AUTH_USER || 'Homelab'
const AUTH_PASS = process.env.AUTH_PASS || 'Zasada3434'
if (!process.env.AUTH_USER || !process.env.AUTH_PASS) console.warn('[auth] AUTH_USER/AUTH_PASS not set — using built-in default credentials. Set them as environment variables to override.')
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
  nextcloud: 'https://192.168.1.42:8866', // HTTPS-only upstream (self-signed)
  'ollama-hl': 'http://192.168.1.42:11434',
  opencode: 'http://192.168.1.33:36783',
  hermes: 'http://192.168.1.33:9119',
  unsloth: 'http://192.168.1.33:8888',
  t3code: 'http://192.168.1.33:3773',
}

function buildPatchScript(base) {
  const b = JSON.stringify(base)
  return `(function(){var b=${b};function r(u){if(typeof u==='string'){var o=window.location.origin;if(u.indexOf(o)===0&&u.indexOf(o+b)!==0)return o+b+u.slice(o.length).replace(/^\\//,'');if(u.charAt(0)==='/'&&u.charAt(1)!=='/'&&u.indexOf(b)!==0)return b+u.slice(1);var wm=u.match(/^(wss?:\\/\\/[^/]+)(\\/.*|$)/);if(wm&&wm[2].indexOf(b)!==0)return wm[1]+b+wm[2].slice(1);}return u;}var of=window.fetch;if(of){window.fetch=function(i,o){if(typeof i==='string'){i=r(i);}else if(i&&i.url&&i.constructor&&i.constructor.name==='Request'){try{i=new Request(r(i.url),i);}catch(e){}}return of.call(this,i,o);};}var oo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=r(u);return oo.apply(this,arguments);};var oe=window.EventSource;if(oe){window.EventSource=function(u,o){return new oe(r(u),o);};window.EventSource.prototype=oe.prototype;window.EventSource.CONNECTING=oe.CONNECTING;window.EventSource.OPEN=oe.OPEN;window.EventSource.CLOSED=oe.CLOSED;}var ow=window.WebSocket;if(ow){window.WebSocket=function(u,p){return new ow(r(u),p);};window.WebSocket.prototype=ow.prototype;window.WebSocket.CONNECTING=ow.CONNECTING;window.WebSocket.OPEN=ow.OPEN;window.WebSocket.CLOSING=ow.CLOSING;window.WebSocket.CLOSED=ow.CLOSED;}var oh=window.history&&window.history.pushState;if(oh){window.history.pushState=function(){if(typeof arguments[2]==='string'){arguments[2]=r(arguments[2]);}return oh.apply(this,arguments);};var or2=window.history&&window.history.replaceState;if(or2){window.history.replaceState=function(){if(typeof arguments[2]==='string'){arguments[2]=r(arguments[2]);}return or2.apply(this,arguments);};}}var oc=document.createElement;if(oc){document.createElement=function(t){var e=oc.call(this,t);if(e&&typeof t==='string'){var tg=String(t).toLowerCase();var p=tg==='link'?'href':(tg==='script'||tg==='img'||tg==='iframe'||tg==='audio'||tg==='video'||tg==='source'||tg==='embed')?'src':null;if(p){try{var d=Object.getOwnPropertyDescriptor(e.__proto__,p)||Object.getOwnPropertyDescriptor(e,p);if(d&&d.set){Object.defineProperty(e,p,{configurable:true,get:function(){return d.get.call(e)},set:function(v){d.set.call(e,r(v))}});}}catch(_){}}}return e;};}})();`
}

// Static rewriting of root-absolute asset/module paths inside SERVED JS and
// CSS. The runtime hooks in buildPatchScript cannot catch every load path —
// e.g. Next.js loads chunks via setAttribute/document.write with webpack's
// publicPath baked into the bundle, and CSS urls never touch JS at all — so
// the shipped code itself is rewritten before it reaches the browser.
function rewriteTextAssets(body, base) {
  // webpack/Next publicPath (i.p = "/_next/") — chunk URLs are derived from it
  body = body.replace(/(\.p\s*=\s*["'])(\/[^"']*)(["'])/g, function (m, pre, v, post) {
    if (v.indexOf(base) === 0) return m
    return pre + base + v.replace(/^\//, '') + post
  })
  // template literals building root-absolute dirs: `${x}/_next/` etc.
  // (skip when the interpolation is assetPrefix — that case is handled by the
  // assetPrefix rewrite in the HTML pass, and prefixing twice would break)
  body = body.replace(/(\$\{(?![^}]*assetPrefix)[^}]*\}\/)(_next|_app|static|assets)(\/)/g, function (m, p, d, t) {
    return p + base.slice(1) + d + t
  })
  // quoted root-absolute paths under well-known static asset dirs
  body = body.replace(/(["'`])(\/(?:_next|_app|static|assets)\/[^"'`]*)(["'`])/g, function (m, q, p, q2) {
    if (p.indexOf(base) === 0) return m
    return q + base + p.slice(1) + q2
  })
  // quoted root-absolute paths ending in an asset extension
  body = body.replace(/(["'`])(\/(?!\/)[^"'`]*?\.(?:js|mjs|css|png|jpe?g|svg|gif|webp|avif|ico|woff2?|ttf|otf|eot|json|wasm|mp3|mp4|webm|map|manifest|webmanifest)(?:[?#][^"'`]*)?)(["'`])/g, function (m, q, p, q2) {
    if (p.indexOf(base) === 0) return m
    return q + base + p.slice(1) + q2
  })
  // CSS url(...) with root-absolute asset paths
  body = body.replace(/(url\(\s*["']?)(\/(?!\/)[^)"']+\.(?:png|jpe?g|svg|gif|webp|avif|ico|woff2?|ttf|otf|eot)(?:[?#][^)"']*)?)(["']?\s*\))/g, function (m, pre, p, post) {
    if (p.indexOf(base) === 0) return m
    return pre + base + p.slice(1) + post
  })
  return body
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
  const isJS = ct.includes('javascript') || ct.includes('ecmascript')
  const isCSS = ct.includes('text/css')

  if (isHTML) {
    delete proxyRes.headers['content-length']
    let chunks = []
    proxyRes.on('data', chunk => chunks.push(chunk))
    proxyRes.on('end', () => {
      try {
        let body = Buffer.concat(chunks).toString()
        // Some apps (SvelteKit, etc.) emit root-absolute asset/module paths
        // inside inline scripts — dynamic import(), runtime URL strings —
        // which the attribute rewrites below cannot fix. Repoint them at
        // the proxied base so they load through the proxy.
        body = body.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, function (full, open, inner, close) {
          if (/\bsrc\s*=/.test(open)) return full
          // SvelteKit-style router base: built for '/', served under a subpath.
          // Note: SvelteKit requires base WITHOUT a trailing slash (it does
          // pathname.slice(base.length) for route matching).
          inner = inner.replace(/\bbase\s*:\s*["']([^"']*)["']/g, function (m, v) {
            if (v === '' || v.charAt(0) === '/') return 'base:"' + base.replace(/\/$/, '') + '"'
            return m
          })
          // Next.js: assetPrefix drives the runtime public path (chunk loading)
          inner = inner.replace(/\bassetPrefix\s*:\s*["']([^"']*)["']/g, function (m, v) {
            if (v === '' || v === '/') return 'assetPrefix:"' + base.replace(/\/$/, '') + '"'
            return m
          })
          inner = inner.replace(/(["'])(\/(?!\/)[^"']*?\.(?:js|mjs|css|png|jpe?g|svg|gif|webp|ico|woff2?|ttf|otf|json|wasm)(?:[?#][^"']*)?)/g, function (m, q, p) {
            return p.indexOf(base) === 0 ? m : q + base + p.slice(1)
          })
          return open + inner + close
        })
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
  } else if (isJS || isCSS) {
    delete proxyRes.headers['content-length']
    let chunks = []
    proxyRes.on('data', chunk => chunks.push(chunk))
    proxyRes.on('end', () => {
      try {
        const body = rewriteTextAssets(Buffer.concat(chunks).toString(), base)
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        res.end(body)
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

  proxy.web(req, res, { target, selfHandleResponse: true, secure: false })
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

// Some proxied apps (e.g. SvelteKit/Open WebUI) do client-side redirects to
// root-absolute paths like /auth?redirect=/app/openwebui/. Map them back
// under the proxied base so they don't fall into the dashboard SPA.
app.use(function (req, res, next) {
  if (req.method !== 'GET') return next()
  if (!/^\/(auth|login|signin|signup|oauth|sso|oidc)(\/.*)?$/.test(req.path)) return next()
  const rd = req.query && typeof req.query.redirect === 'string' ? req.query.redirect : ''
  let m = rd.match(/^\/(app\/[^/]+)/)
  if (!m) {
    // No redirect param (e.g. Immich goes straight to /auth/login) — use the
    // Referer to figure out which proxied app sent us here.
    const ref = String(req.headers.referer || '')
    m = ref.match(/https?:\/\/[^/]+\/(app\/[^/]+)/)
  }
  if (!m) return next()
  return res.redirect(302, '/' + m[1] + req.path + req.originalUrl.slice(req.path.length))
})

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
  proxy.ws(req, socket, head, { target, secure: false })
})
