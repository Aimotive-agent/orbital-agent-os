import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, Bot, Box, ChevronDown, CircleDot, Code2, Command, Cpu,
  Gauge, HardDrive, LayoutDashboard, MemoryStick, MessageSquare,
  MoreHorizontal, PanelLeftClose, Play, Plus, Search, Settings,
  Sparkles, Terminal, Wifi, X, Server, Globe, Zap, Database,
  Film, Camera, FileText, BookOpen, Workflow, Brain, Cloud,
  FolderOpen, RefreshCw, ArrowRight, Home, Monitor, Key, Link, Trash2, Check, ClipboardCopy
} from 'lucide-react'
import './styles.css'

const TABS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
  { id: 'agents', label: 'Agents', icon: <Bot /> },
  { id: 'apps', label: 'Apps', icon: <Box /> },
  { id: 'activity', label: 'Activity', icon: <Activity /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
]

const WORKSPACES = [
  { id: 'local', name: 'This Machine', icon: 'C', color: '#674d78', type: 'local', host: 'localhost', desc: 'Your workstation · 2 agents active' },
  { id: 'homelab', name: 'Homelab', icon: 'H', color: '#274451', type: 'homelab', host: '192.168.1.42', desc: 'Unraid · 15+ services' },
  { id: 'vps', name: 'VPS', icon: 'V', color: '#4a3f2e', type: 'vps', host: '64.118.132.92', desc: 'Debian · 4 services' },
]

const initialTasks = [
  { id: 1, title: 'Build agent status protocol', owner: 'Codex', status: 'In progress', time: 'now' },
  { id: 2, title: 'Sync homelab services into dashboard', owner: 'System', status: 'In progress', time: 'now' },
  { id: 3, title: 'Add inline app workspace system', owner: 'You', status: 'In progress', time: 'now' },
  { id: 4, title: 'Review workspace connections', owner: 'You', status: 'Ready', time: 'today' },
]

const LOCAL_AGENTS = [
  { id: 'codex', name: 'Codex', icon: <Code2 />, kind: 'Coding agent', state: 'Working', color: '#9b8cff', task: 'Agent OS interface', usage: '1.8 GB', port: null, group: 'Agents', url: null },
  { id: 'opencode', name: 'OpenCode', icon: <Terminal />, kind: 'Coding agent', state: 'Running', color: '#64d3aa', task: 'Interactive coding', usage: '—', port: 36783, group: 'Agents', url: 'http://192.168.1.33:36783/' },
  { id: 'hermes', name: 'Hermes', icon: <Brain />, kind: 'AI Agent', state: 'Running', color: '#c084fc', task: 'LLM agent', usage: '—', port: 9119, group: 'Agents', url: 'http://192.168.1.33:9119/' },
  { id: 'unsloth', name: 'Unsloth Studio', icon: <Workflow />, kind: 'Fine-tuning', state: 'Running', color: '#f472b6', task: 'Model training', usage: '—', port: 8888, group: 'Agents', url: 'http://192.168.1.33:8888/' },
  { id: 't3code', name: 'T3 Code', icon: <Code2 />, kind: 'Code editor', state: 'Running', color: '#38bdf8', task: 'Web IDE', usage: '—', port: 3773, group: 'Agents', url: 'http://192.168.1.33:3773/' },
  { id: 'terminal', name: 'Terminal', icon: <Terminal />, kind: 'System shell', state: 'Running', color: '#86d5b2', task: 'vite dev server', usage: '112 MB', port: null, group: 'System', url: null },
  { id: 'browser', name: 'Browser', icon: <Box />, kind: 'Web workspace', state: 'Running', color: '#78b7ff', task: '6 tabs open', usage: '1.2 GB', port: null, group: 'System', url: null },
  { id: 'ollama-local', name: 'Ollama (local)', icon: <Bot />, kind: 'AI Runtime', state: 'Running', color: '#ffb870', task: 'Checking status', usage: '—', port: 11434, group: 'AI', url: null },
]

const HOMELAB_SERVICES = [
  { id: 'ollama-hl', name: 'Ollama', icon: <Bot />, kind: 'AI · 17 models', state: 'Running', color: '#ffb870', task: 'LLM runtime', usage: '—', port: 11434, group: 'AI', url: null },
  { id: 'lmstudio', name: 'LM Studio', icon: <Brain />, kind: 'AI Desktop', state: 'Running', color: '#c084fc', task: 'Model server', usage: '—', port: 3004, group: 'AI', url: 'http://192.168.1.42:3004/' },
  { id: 'dify', name: 'Dify AI', icon: <Workflow />, kind: 'AI Dev Platform', state: 'Running', color: '#60a5fa', task: 'Agent builder + RAG', usage: '—', port: 3003, group: 'AI', url: null },
  { id: 'convex', name: 'Convex', icon: <Database />, kind: 'Backend', state: 'Running', color: '#f472b6', task: 'Real-time backend', usage: '—', port: 6791, group: 'Dev', url: null },
  { id: 'n8n', name: 'n8n', icon: <Workflow />, kind: 'Automation', state: 'Running', color: '#fb923c', task: 'Workflow automation', usage: '—', port: 5678, group: 'Dev', url: 'http://192.168.1.42:5678/' },
  { id: 'jellyfin', name: 'Jellyfin', icon: <Film />, kind: 'Media Server', state: 'Running', color: '#a78bfa', task: 'Media streaming', usage: '—', port: 8096, group: 'Media', url: 'http://192.168.1.42:8096/web/' },
  { id: 'immich', name: 'Immich', icon: <Camera />, kind: 'Photo Library', state: 'Running', color: '#34d399', task: 'Photo management', usage: '—', port: 2283, group: 'Media', url: 'http://192.168.1.42:2283/' },
  { id: 'nextcloud', name: 'Nextcloud', icon: <Cloud />, kind: 'Cloud Storage', state: 'Running', color: '#38bdf8', task: 'File sync & share', usage: '—', port: 8866, group: 'Productivity', url: null },
  { id: 'paperless', name: 'Paperless-ngx', icon: <FileText />, kind: 'Doc Manager', state: 'Running', color: '#a3e635', task: 'Document archive', usage: '—', port: 8060, group: 'Productivity', url: 'http://192.168.1.42:8060/' },
  { id: 'obsidian', name: 'Obsidian', icon: <BookOpen />, kind: 'Knowledge Base', state: 'Running', color: '#c084fc', task: 'Notes & wiki', usage: '—', port: 3000, group: 'Productivity', url: null },
  { id: 'hivekeep', name: 'HiveKeep', icon: <FolderOpen />, kind: 'Password Mgr', state: 'Running', color: '#fbbf24', task: 'Secrets', usage: '—', port: 8018, group: 'Productivity', url: 'http://192.168.1.42:8018/' },
  { id: 'karakeep', name: 'KaraKeep', icon: <BookOpen />, kind: 'Bookmarks', state: 'Running', color: '#fb7185', task: 'Link archive', usage: '—', port: 3088, group: 'Productivity', url: 'http://192.168.1.42:3088/' },
  { id: 'homepage', name: 'Homepage', icon: <Home />, kind: 'Dashboard', state: 'Running', color: '#818cf8', task: 'Service overview', usage: '—', port: 3699, group: 'Monitoring', url: 'http://192.168.1.42:3699/' },
  { id: 'weather', name: 'Weather', icon: <Cloud />, kind: 'Weather Dashboard', state: 'Running', color: '#38bdf8', task: 'Weather forecast', usage: '—', port: 8070, group: 'Monitoring', url: 'http://192.168.1.42:8070/' },
  { id: 'dify-web', name: 'Dify Web', icon: <Workflow />, kind: 'AI Platform UI', state: 'Running', color: '#60a5fa', task: 'Dify interface', usage: '—', port: 3003, group: 'AI', url: 'http://192.168.1.42:3003/' },
  { id: 'convex-dash', name: 'Convex', icon: <Database />, kind: 'Backend Dashboard', state: 'Running', color: '#f472b6', task: 'Convex dashboard', usage: '—', port: 6791, group: 'Dev', url: 'http://192.168.1.42:6791/' },
  { id: 'workcover', name: 'Workcover', icon: <Search />, kind: 'Search Engine', state: 'Running', color: '#fb923c', task: 'Document search', usage: '—', port: 3100, group: 'Productivity', url: 'http://192.168.1.42:3100/' },
  { id: 'localsearch', name: 'Local Search', icon: <Search />, kind: 'File Search', state: 'Running', color: '#a78bfa', task: 'Local file search', usage: '—', port: 3101, group: 'Productivity', url: 'http://192.168.1.42:3101/' },
  { id: 'fileserver', name: 'File Server', icon: <FolderOpen />, kind: 'File Browser', state: 'Running', color: '#34d399', task: 'File management', usage: '—', port: 3102, group: 'Productivity', url: 'http://192.168.1.42:3102/' },
  { id: 'postgres-hl', name: 'PostgreSQL', icon: <Database />, kind: 'Database', state: 'Running', color: '#60a5fa', task: 'Primary DB', usage: '—', port: 5432, group: 'Infrastructure', url: null },
  { id: 'redis-hl', name: 'Redis', icon: <Zap />, kind: 'Cache', state: 'Running', color: '#f87171', task: 'In-memory cache', usage: '—', port: 6379, group: 'Infrastructure', url: null },
  { id: 'openship', name: 'OpenShip', icon: <Server />, kind: 'Deploy', state: 'Running', color: '#e879f9', task: 'Orchestration', usage: '—', port: null, group: 'Infrastructure', url: 'http://192.168.1.42:3148/' },
]

const VPS_SERVICES = [
  { id: 'openwebui', name: 'Open WebUI', icon: <MessageSquare />, kind: 'AI Chat', state: 'Running', color: '#818cf8', task: 'Chat interface', usage: '—', port: 8080, group: 'AI', url: 'http://64.118.132.92:8080/' },
  { id: 'langflow', name: 'Langflow', icon: <Workflow />, kind: 'AI Workflows', state: 'Running', color: '#f472b6', task: 'Flow builder', usage: '—', port: 7860, group: 'AI', url: 'http://64.118.132.92:7860/' },
  { id: 'kestra', name: 'Kestra', icon: <RefreshCw />, kind: 'Orchestration', state: 'Running', color: '#a78bfa', task: 'Workflow engine', usage: '—', port: 8085, group: 'Dev', url: 'http://64.118.132.92:8085/' },
  { id: 'vps-nodeapp', name: 'VPS Status', icon: <Monitor />, kind: 'Status Check', state: 'Running', color: '#34d399', task: 'VPS-HKG1 online', usage: '—', port: 3000, group: 'Monitoring', url: null },
]

const HOMELAB_OLLAMA_MODELS = [
  { name: 'deepseek-r1:7b', size: '7.6B', family: 'qwen2' },
  { name: 'qwen3.5:4b', size: '4.7B', family: 'qwen35' },
  { name: 'gemma4:12b', size: '11.9B', family: 'gemma4' },
  { name: 'qwen2.5:7b', size: '7.6B', family: 'qwen2' },
  { name: 'qwen3-vl:8b', size: '8.8B', family: 'qwen3vl' },
  { name: 'ornith:9b', size: '9.0B', family: 'qwen35' },
  { name: 'lfm2.5:2.6b', size: '2.7B', family: 'lfm2' },
  { name: 'embeddinggemma', size: '307M', family: 'gemma3' },
  { name: 'gemma3n:e2b', size: '4.5B', family: 'gemma3n' },
  { name: 'qwen3.5:0.8b', size: '873M', family: 'qwen35' },
  { name: 'deepseek-v4-pro:cloud', size: 'Cloud', family: 'cloud' },
  { name: 'kimi-k2.6:cloud', size: '1T', family: 'kimi-k2' },
  { name: 'minimax-m2.7:cloud', size: 'Cloud', family: 'minimax' },
  { name: 'glm-5.2:cloud', size: '756B', family: 'cloud' },
  { name: 'glm-5.1:cloud', size: 'Cloud', family: 'cloud' },
]

function Ring({ value, color, label, detail }) {
  return <div className="metric">
    <div className="ring" style={{ '--value': `${value * 3.6}deg`, '--ring': color }}><span>{value}%</span></div>
    <div><strong>{label}</strong><small>{detail}</small></div>
  </div>
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return <div style={{ color: '#f2a5a8', padding: '40px', fontFamily: 'DM Mono', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
      <h3>Error</h3><p>{this.state.error.message}</p><pre>{this.state.error.stack?.split('\n').slice(0, 8).join('\n')}</pre>
    </div>
    return this.props.children
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeWorkspace, setActiveWorkspace] = useState('local')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tasks, setTasks] = useState(initialTasks)
  const [newTask, setNewTask] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [cpu, setCpu] = useState(37)
  const [ollamaLocal, setOllamaLocal] = useState({ available: false, models: [], active: [] })
  const [ollamaOpen, setOllamaOpen] = useState(false)
  const [ollamaModel, setOllamaModel] = useState('')
  const [ollamaPrompt, setOllamaPrompt] = useState('')
  const [ollamaReply, setOllamaReply] = useState('')
  const [ollamaError, setOllamaError] = useState('')
  const [ollamaBusy, setOllamaBusy] = useState(false)
  const [activity, setActivity] = useState([
    ['09:42', 'Codex', 'Started implementation: Agent OS interface'],
    ['09:38', 'Terminal', 'Started development server on port 5173'],
    ['09:30', 'System', 'Background health check completed'],
    ['09:15', 'Ollama', 'Model runtime entered idle state'],
  ])
  const [homelabStatus, setHomelabStatus] = useState({})
  const [hlOllamaModels, setHlOllamaModels] = useState([])
  const [hlOllamaActive, setHlOllamaActive] = useState([])
  const [openApps, setOpenApps] = useState([])
  const [activeAppId, setActiveAppId] = useState(null)

  const [providers, setProviders] = useState([
    { id: 'ollama-local', name: 'Ollama (Local)', endpoint: 'http://localhost:11434', models: 'auto', status: 'Connected' },
    { id: 'ollama-hl', name: 'Ollama (Homelab)', endpoint: 'http://192.168.1.42:11434', models: 'auto', status: 'Connected' },
    { id: 'openwebui', name: 'Open WebUI API', endpoint: 'http://64.118.132.92:8080', models: 'auto', status: 'Connected' },
  ])
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'OpenAI API Key', key: '••••••••sk-abc', provider: 'OpenAI' },
    { id: 2, name: 'Anthropic API Key', key: '••••••••ant-xyz', provider: 'Anthropic' },
  ])
  const [mcpServers, setMcpServers] = useState([
    { id: 1, name: 'Zapier MCP', endpoint: 'https://mcp.zapier.com/api/v1/connect', type: 'remote', status: 'Connected' },
  ])
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [showAddApiKey, setShowAddApiKey] = useState(false)
  const [showAddMcp, setShowAddMcp] = useState(false)
  const [newProvider, setNewProvider] = useState({ name: '', endpoint: '' })
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '', provider: '' })
  const [newMcp, setNewMcp] = useState({ name: '', endpoint: '', type: 'remote' })
  const [customApps, setCustomApps] = useState([])
  const [showAddApp, setShowAddApp] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [newApp, setNewApp] = useState({ name: '', url: '', workspace: ['local'], icon: '', kind: '', group: '', port: '' })
  const [localAppMode, setLocalAppMode] = useState(null)
  const [localAgentsBase, setLocalAgentsBase] = useState(LOCAL_AGENTS)
  const [homelabBase, setHomelabBase] = useState(HOMELAB_SERVICES)
  const [vpsBase, setVpsBase] = useState(VPS_SERVICES)

  const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const fetchTO = (url, ms = 5000) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return fetch(url, { signal: c.signal }).finally(() => clearTimeout(t)) }

  useEffect(() => { const id = setInterval(() => setCpu(v => Math.max(19, Math.min(78, v + Math.round(Math.random() * 14 - 7)))), 1800); return () => clearInterval(id) }, [])
  useEffect(() => {
    let c = false; const chk = async () => {
      try { const [tR, pR] = await Promise.all([fetch('/ollama/api/tags'), fetch('/ollama/api/ps')]); if (!tR.ok || !pR.ok) throw new Error(); const [t, p] = await Promise.all([tR.json(), pR.json()]); if (!c) { const m = t.models || []; setOllamaLocal({ available: true, models: m, active: p.models || [] }); setOllamaModel(v => v || m.find(x => x.name === 'qwen2.5:0.5b')?.name || m[0]?.name || '') } }
      catch { if (!c) setOllamaLocal({ available: false, models: [], active: [] }) }
    }; chk(); const id = setInterval(chk, 10000); return () => { c = true; clearInterval(id) }
  }, [])
  useEffect(() => {
    let c = false; const chk = async () => {
      try {
        const [o, j, i, n8, hp, lm] = await Promise.allSettled([fetchTO('/hl-ollama/api/tags'), fetchTO('/hl-jellyfin/System/Info/Public'), fetchTO('/hl-immich/api/server-info'), fetchTO('/hl-n8n/healthz'), fetchTO('/hl-homepage/api/status'), fetchTO('/hl-lmstudio/api/v0/models')])
        if (c) return; const s = {}
        s['ollama-hl'] = o.status === 'fulfilled' && o.value.ok ? 'Running' : 'Offline'
        s['jellyfin'] = j.status === 'fulfilled' ? 'Running' : 'Offline'
        s['immich'] = i.status === 'fulfilled' ? 'Running' : 'Offline'
        s['n8n'] = n8.status === 'fulfilled' && n8.value.ok ? 'Running' : 'Offline'
        s['homepage'] = hp.status === 'fulfilled' ? 'Running' : 'Offline'
        s['lmstudio'] = lm.status === 'fulfilled' && lm.value.ok ? 'Running' : 'Offline'
        setHomelabStatus(s)
        if (o.status === 'fulfilled' && o.value.ok) { const d = await o.value.json(); setHlOllamaModels(d.models || []); try { const pR = await fetchTO('/hl-ollama/api/ps'); if (pR.ok) setHlOllamaActive((await pR.json()).models || []) } catch {} }
      } catch {}
    }; chk(); const id = setInterval(chk, 15000); return () => { c = true; clearInterval(id) }
  }, [])

  const localAgents = localAgentsBase.map(a => a.id === 'ollama-local' ? { ...a, state: ollamaLocal.available ? (ollamaLocal.active.length ? 'Working' : 'Running') : 'Unavailable', task: ollamaLocal.available ? (ollamaLocal.active.length ? `${ollamaLocal.active.length} model loaded` : `${ollamaLocal.models.length} models`) : 'API unavailable', usage: ollamaLocal.active.length ? 'Model loaded' : '—' } : a)
  const hlSvcs = homelabBase.map(s => homelabStatus[s.id] ? { ...s, state: homelabStatus[s.id] } : s)
  const vpsSvcs = vpsBase.map(s => ({ ...s, workspace: 'vps' }))
  const allWorkspaceServices = { local: [...localAgents, ...customApps.filter(a => a.workspace?.includes('local'))], homelab: [...hlSvcs, ...customApps.filter(a => a.workspace?.includes('homelab'))], vps: [...vpsSvcs, ...customApps.filter(a => a.workspace?.includes('vps'))] }
  const filteredServices = allWorkspaceServices[activeWorkspace] || []
  const filteredAgents = filteredServices.filter(s => s.group === 'AI' || s.group === 'Agents')
  const filteredApps = filteredServices.filter(s => s.group !== 'AI' && s.group !== 'Agents')
  const ws = WORKSPACES.find(w => w.id === activeWorkspace)

  const openService = (svc) => {
    if (!svc.url) return
    const exists = openApps.find(a => a.id === svc.id)
    if (exists) { setActiveAppId(svc.id); return }
    setOpenApps(a => [...a, { id: svc.id, name: svc.name, icon: svc.icon, url: svc.url, color: svc.color }])
    setActiveAppId(svc.id)
  }
  const saveAppEdit = (app) => {
    const id = app.id
    if (localAgentsBase.some(a => a.id === id)) setLocalAgentsBase(arr => arr.map(a => a.id === id ? { ...a, ...app } : a))
    else if (homelabBase.some(a => a.id === id)) setHomelabBase(arr => arr.map(a => a.id === id ? { ...a, ...app } : a))
    else if (vpsBase.some(a => a.id === id)) setVpsBase(arr => arr.map(a => a.id === id ? { ...a, ...app } : a))
    else setCustomApps(arr => arr.map(a => a.id === id ? { ...a, ...app } : a))
  }
  const handleLocalApp = (svc) => {
    if (svc.id === 'codex' || svc.id === 'ollama-local') {
      setLocalAppMode('ai-chat')
      setOllamaOpen(true)
      if (!ollamaModel) setOllamaModel(ollamaLocal.available ? (ollamaLocal.models[0]?.name || '') : HOMELAB_OLLAMA_MODELS[0]?.name || '')
    } else if (svc.id === 'terminal') {
      setLocalAppMode('terminal')
      setOllamaOpen(true)
    } else if (svc.id === 'browser') {
      setLocalAppMode('browser')
      setOllamaOpen(true)
    }
    setActivity(a => [[now(), 'Workspace', `Opened ${svc.name}`], ...a])
  }
  const closeApp = (id) => {
    setOpenApps(a => a.filter(x => x.id !== id))
    if (activeAppId === id) setActiveAppId(openApps.length > 1 ? openApps.find(a => a.id !== id)?.id || null : null)
  }

  const addTask = e => { e.preventDefault(); if (!newTask.trim()) return; setTasks(t => [{ id: Date.now(), title: newTask.trim(), owner: 'You', status: 'Queued', time: 'just now' }, ...t]); setActivity(a => [[now(), 'You', `Created task: ${newTask.trim()}`], ...a]); setNewTask(''); setShowComposer(false) }
  const runTask = t => { setTasks(ts => ts.map(x => x.id === t.id ? { ...x, status: 'In progress', owner: 'Codex' } : x)); setActivity(a => [[now(), 'Codex', `Accepted task: ${t.title}`], ...a]) }
  const askOllama = async e => { e.preventDefault(); if (!ollamaPrompt.trim() || !ollamaModel || ollamaBusy) return; setOllamaBusy(true); setOllamaError(''); setOllamaReply(''); const apiBase = ollamaLocal.available ? '/ollama' : '/app/ollama-hl'; try { const r = await fetch(apiBase + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ollamaModel, prompt: ollamaPrompt.trim(), stream: false }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || d.message || 'Request failed'); setOllamaReply(d.response || 'No response from model.'); setActivity(a => [[now(), 'Ollama', `Prompted ${ollamaModel}`], ...a]) } catch (er) { setOllamaError(er.message || 'Connection failed — is Ollama running on the homelab?') } finally { setOllamaBusy(false) } }

  const homelabOnline = Object.values(homelabStatus).filter(s => s === 'Running').length
  const homelabOffline = Object.values(homelabStatus).filter(s => s === 'Offline').length
  const activeApp = openApps.find(a => a.id === activeAppId)



  const renderDashboard = () => <>
    <header>
      <div>
        <p className="eyebrow">{activeWorkspace.toUpperCase()} <span>/</span> {activeTab.toUpperCase()}</p>
        <h1>{ws?.name === 'This Machine' ? 'Good morning, Chris.' : ws?.name}</h1>
        <p className="subhead">
          {activeWorkspace === 'local' && <>Your workspace is healthy. <b>2 agents</b> ready.</>}
          {activeWorkspace === 'homelab' && <><b>{homelabOnline}</b> online · <b>{homelabOffline}</b> offline</>}
          {activeWorkspace === 'vps' && <>Debian VM · <b>{vpsSvcs.length} services</b></>}
        </p>
      </div>
      <div className="header-actions">
        <button className="search"><Search size={17} />Search anything <kbd>Ctrl K</kbd></button>
        <button className="icon-button"><MessageSquare size={18} /><i /></button>
        <button className="command"><Command size={17} />Command palette</button>
      </div>
    </header>
    <section className="status-strip">
      <div className="online">{activeWorkspace === 'homelab' ? <Server size={17} /> : activeWorkspace === 'vps' ? <Globe size={17} /> : <Wifi size={17} />}
        <span><b>{ws?.host || 'Offline'}</b><small>{activeWorkspace === 'local' ? 'All services responding' : `${filteredServices.length} services`}</small></span>
      </div>
      <div className="strip-stat"><Cpu size={17} /><span>CPU <b>{cpu}%</b></span><div className="mini-bar"><i style={{ width: `${cpu}%` }} /></div></div>
      <div className="strip-stat"><MemoryStick size={17} /><span>Memory <b>6.4 / 16 GB</b></span><div className="mini-bar"><i style={{ width: '40%' }} /></div></div>
      <div className="strip-stat"><Wifi size={17} /><span>Network <b>18 Mbps</b></span></div>
    </section>

    {activeTab === 'overview' && <div className="content-grid">
      <section className="panel apps-panel">
        <div className="panel-heading"><div><p className="eyebrow">{activeWorkspace === 'homelab' ? 'HOMELAB' : activeWorkspace === 'vps' ? 'VPS' : 'RUNTIME'}</p><h2>{activeWorkspace === 'local' ? 'Apps & agents' : 'Services'}</h2></div><button className="text-button">View all <span>→</span></button></div>
        <div className="app-list">
          {filteredServices.map(svc => (
            <button key={svc.id} className="app-row" onClick={() => svc.url ? openService(svc) : activeWorkspace === 'local' ? handleLocalApp(svc) : null}>
              <span className="app-icon" style={{ color: svc.color, background: `${svc.color}17` }}>{svc.icon}</span>
              <span className="app-info"><b>{svc.name}</b><small>{svc.kind} · {svc.task}</small></span>
              <span className={`state ${svc.state.toLowerCase()}`}><i />{svc.state}</span>
              <span className="usage">{svc.usage}</span>
              {svc.url && <span className="launch-hint">Launch →</span>}
              <MoreHorizontal size={17} />
            </button>
          ))}
        </div>
        <div className="selected-app">
          <div><span className="pulse" /><p><b>{filteredServices[0]?.name}</b> is {filteredServices[0]?.state?.toLowerCase()}</p><small>{filteredServices[0]?.task}</small></div>
          <button onClick={() => { if (activeWorkspace === 'local' && !filteredServices[0]?.url) handleLocalApp(filteredServices[0]); else if (filteredServices[0]?.url) openService(filteredServices[0]) }} disabled={activeWorkspace === 'local' ? false : !filteredServices[0]?.url}><Play size={15} />{activeWorkspace === 'local' && filteredServices[0]?.id === 'codex' ? 'AI Chat' : activeWorkspace === 'local' ? filteredServices[0]?.id === 'ollama-local' ? 'AI Chat' : 'Open' : 'Open'}</button>
        </div>
      </section>

      {activeWorkspace === 'local' && ollamaOpen && <section className="panel ollama-workspace">
        <div className="panel-heading"><div><p className="eyebrow">{localAppMode === 'ai-chat' ? 'AI CHAT' : localAppMode === 'terminal' ? 'TERMINAL' : 'BROWSER'}</p><h2>{localAppMode === 'ai-chat' ? 'AI Assistant' : localAppMode === 'terminal' ? 'System Info' : 'Web Browser'}</h2></div><button onClick={() => { setOllamaOpen(false); setLocalAppMode(null) }} className="dots"><X size={18} /></button></div>
        {localAppMode === 'ai-chat' && <>
          {!ollamaLocal.available && <div style={{ padding: '12px 16px', background: '#1a1720', borderRadius: '8px', marginBottom: '8px', fontSize: '12px', color: '#8b8792' }}>
            <b style={{ color: '#ffb870' }}>Local Ollama offline.</b> Using Homelab Ollama (17 models available).
          </div>}
          <form onSubmit={askOllama}>
            <div className="ollama-controls">
              <label>MODEL
                <select value={ollamaModel} onChange={e => setOllamaModel(e.target.value)}>
                  {(ollamaLocal.available ? ollamaLocal.models : HOMELAB_OLLAMA_MODELS).map(m => {
                    const name = typeof m === 'string' ? m : m.name
                    return <option value={name} key={name}>{name}</option>
                  })}
                </select>
              </label>
              <span><i className="live-dot" />{ollamaLocal.available ? 'Local node' : 'Homelab node'}</span>
            </div>
            <textarea value={ollamaPrompt} onChange={e => setOllamaPrompt(e.target.value)} placeholder="Ask any question…" />
            <div className="ollama-submit"><small>{ollamaLocal.available ? 'Runs locally' : 'Runs on homelab'} via Ollama API.</small><button disabled={ollamaBusy || !ollamaPrompt.trim()}>{ollamaBusy ? 'Thinking…' : 'Send'} <Play size={14} /></button></div>
          </form>
          {(ollamaReply || ollamaError) && <div className={`ollama-response ${ollamaError ? 'error' : ''}`}><p>{ollamaError || ollamaReply}</p></div>}
        </>}
        {localAppMode === 'terminal' && <div style={{ padding: '16px', background: '#1a1720', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '12px', lineHeight: '1.7', color: '#86d5b2' }}>
          <div><b style={{ color: '#a595ff' }}>$</b> uname -a</div>
          <div>Linux chrispc-workstation 6.13.8 x86_64</div>
          <div style={{ marginTop: '8px' }}><b style={{ color: '#a595ff' }}>$</b> node -v</div>
          <div>v22.23.2</div>
          <div style={{ marginTop: '8px' }}><b style={{ color: '#a595ff' }}>$</b> free -h</div>
          <div>Mem: 16G · Used: 6.4G · Free: 9.6G</div>
          <div style={{ marginTop: '8px' }}><b style={{ color: '#a595ff' }}>$</b> df -h /</div>
          <div>Disk: 310G / 500G (62%)</div>
          <div style={{ marginTop: '8px' }}><b style={{ color: '#a595ff' }}>$</b> uptime</div>
          <div>3 days, 14 hours</div>
          <div style={{ marginTop: '8px', color: '#8b8792' }}>CPU: {cpu}% · Vite dev server active</div>
        </div>}
        {localAppMode === 'browser' && <div style={{ padding: '0' }}>
          <div style={{ padding: '8px 16px', background: '#1a1720', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input id="browser-url" defaultValue="https://en.wikipedia.org" style={{ flex: 1, background: '#121118', border: '1px solid #3d3850', borderRadius: '7px', color: '#eee', padding: '9px 11px', fontSize: '13px' }} onKeyDown={e => { if (e.key === 'Enter') { const u = e.target.value; const iframe = document.getElementById('browser-iframe'); if (iframe && u) { iframe.src = u.startsWith('http') ? u : 'https://' + u } } }} placeholder="Enter URL…" />
            <button onClick={() => { const u = document.getElementById('browser-url')?.value; const iframe = document.getElementById('browser-iframe'); if (iframe && u) iframe.src = u.startsWith('http') ? u : 'https://' + u }} style={{ padding: '8px 14px', borderRadius: '7px', background: '#302e33', color: '#78b7ff', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Go</button>
          </div>
          <iframe id="browser-iframe" src="https://en.wikipedia.org" style={{ width: '100%', height: '420px', border: 'none', background: '#fff', display: 'block' }} />
        </div>}
      </section>}

      <section className="panel health-panel">
        <div className="panel-heading"><div><p className="eyebrow">THIS MACHINE</p><h2>Resource health</h2></div><button className="dots"><MoreHorizontal /></button></div>
        <div className="rings"><Ring value={cpu} color="#a595ff" label="Processor" detail="8-core · 3.42 GHz" /><Ring value={40} color="#64d3aa" label="Memory" detail="6.4 of 16 GB" /><Ring value={62} color="#ffb56b" label="Storage" detail="310 of 500 GB" /></div>
        <div className="uptime"><span><Gauge size={17} />UPTIME</span><b>3 days, 14 hours</b><small>Last health check: just now</small></div>
      </section>

      <section className="panel tasks-panel">
        <div className="panel-heading"><div><p className="eyebrow">ORCHESTRATION</p><h2>Task queue <span>{tasks.length}</span></h2></div><button onClick={() => setShowComposer(true)} className="add-task"><Plus size={16} />New task</button></div>
        {showComposer && <form className="composer" onSubmit={addTask}><input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="What should an agent work on?" /><button type="button" onClick={() => setShowComposer(false)}><X size={16} /></button><button type="submit">Add</button></form>}
        <div className="task-list">{tasks.map(t => <div className="task" key={t.id}><CircleDot size={18} /><div><b>{t.title}</b><small><span>{t.owner}</span> · {t.time}</small></div><span className={`task-status ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>{t.status !== 'In progress' && <button onClick={() => runTask(t)} className="run" title="Run"><Play size={14} /></button>}</div>)}</div>
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Live activity</h2></div><button className="text-button">Open log <span>→</span></button></div>
        <div className="timeline">{activity.map(([time, source, message], i) => <div className="event" key={`${time}-${i}`}><time>{time}</time><i className={source.toLowerCase()} /><div><b>{source}</b><span>{message}</span></div></div>)}</div>
      </section>
    </div>}

    {activeTab === 'agents' && <div className="content-grid">
      <section className="panel apps-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="panel-heading"><div><p className="eyebrow">{activeWorkspace.toUpperCase()}</p><h2>All Agents <span>{filteredAgents.length}</span></h2></div></div>
        <div className="app-list">{filteredAgents.map(svc => (
          <div key={svc.id} className="app-row" onClick={() => svc.url ? openService(svc) : null}>
            <span className="app-icon" style={{ color: svc.color, background: `${svc.color}17` }}>{svc.icon}</span>
            <span className="app-info"><b>{svc.name}</b><small>{svc.kind}</small></span>
            <span className={`state ${svc.state.toLowerCase()}`}><i />{svc.state}</span>
            <span className="usage">{svc.task}</span>
            {svc.port && <span className="port-tag">:{svc.port}</span>}
            {svc.url && <span className="launch-hint">Launch →</span>}
            <MoreHorizontal size={17} />
          </div>
        ))}</div>
        {activeWorkspace === 'homelab' && hlOllamaModels.length > 0 && <div style={{ borderTop: '1px solid #302e33', marginTop: '16px', paddingTop: '16px' }}>
          <div className="panel-heading"><div><p className="eyebrow">OLLAMA MODELS</p><h2>{HOMELAB_OLLAMA_MODELS.length} models on homelab</h2></div></div>
          <div className="model-grid">{HOMELAB_OLLAMA_MODELS.map(m => <div key={m.name} className="model-chip"><Bot size={14} style={{ color: '#8978f3' }} /><div><b>{m.name}</b><small>{m.size} · {m.family}</small></div>{hlOllamaActive.some(a => a.model === m.name) && <span className="live-dot" />}</div>)}</div>
        </div>}
      </section>
    </div>}

    {activeTab === 'apps' && <div className="content-grid">
      {['System', 'AI', 'Dev', 'Media', 'Productivity', 'Monitoring', 'Infrastructure'].map(group => {
        const ga = filteredApps.filter(a => a.group === group)
        if (!ga.length) return null
        return <section key={group} className="panel apps-panel" style={group === 'AI' ? { gridColumn: '1 / -1' } : {}}>
          <div className="panel-heading"><div><p className="eyebrow">{activeWorkspace.toUpperCase()}</p><h2>{group}</h2></div></div>
          <div className="app-list">{ga.map(svc => (
            <div key={svc.id} className="app-row" onClick={() => svc.url ? openService(svc) : null}>
              <span className="app-icon" style={{ color: svc.color, background: `${svc.color}17` }}>{svc.icon}</span>
              <span className="app-info"><b>{svc.name}</b><small>{svc.kind}</small></span>
              <span className={`state ${svc.state.toLowerCase()}`}><i />{svc.state}</span>
              <span className="usage">{svc.task}</span>
              {svc.port && <span className="port-tag">:{svc.port}</span>}
              {svc.url && <span className="launch-hint">Launch →</span>}
              <MoreHorizontal size={17} />
            </div>
          ))}</div>
        </section>
      })}
    </div>}

    {activeTab === 'activity' && <div className="content-grid">
      <section className="panel activity-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="panel-heading"><div><p className="eyebrow">FULL AUDIT TRAIL</p><h2>All activity</h2></div></div>
        <div className="timeline" style={{ maxHeight: '600px', overflow: 'auto' }}>{activity.map(([time, source, message], i) => <div className="event" key={`${time}-${i}`}><time>{time}</time><i className={source.toLowerCase()} /><div><b>{source}</b><span>{message}</span></div></div>)}</div>
      </section>
    </div>}

    {activeTab === 'settings' && <div className="content-grid">
      <section className="panel" style={{ gridColumn: '1' }}>
        <div className="panel-heading"><div><p className="eyebrow">AI PROVIDERS</p><h2>Model Providers</h2></div><button onClick={() => setShowAddProvider(true)} className="add-task"><Plus size={16} />Add</button></div>
        {showAddProvider && <div className="composer" style={{ flexWrap: 'wrap' }}>
          <input value={newProvider.name} onChange={e => setNewProvider({ ...newProvider, name: e.target.value })} placeholder="Provider name" style={{ flex: '1 1 120px' }} />
          <input value={newProvider.endpoint} onChange={e => setNewProvider({ ...newProvider, endpoint: e.target.value })} placeholder="Endpoint URL" style={{ flex: '1 1 200px' }} />
          <button type="button" onClick={() => setShowAddProvider(false)}><X size={16} /></button>
          <button type="submit" onClick={() => { if (newProvider.name && newProvider.endpoint) { setProviders(p => [...p, { id: Date.now(), ...newProvider, models: 'auto', status: 'Untested' }]); setNewProvider({ name: '', endpoint: '' }); setShowAddProvider(false); setActivity(a => [[now(), 'Settings', `Added provider: ${newProvider.name}`], ...a]) } }}>Save</button>
        </div>}
        <div className="app-list">
          {providers.map(p => <div key={p.id} className="app-row">
            <span className="app-icon" style={{ color: '#a595ff', background: '#a595ff17' }}><Server size={18} /></span>
            <span className="app-info"><b>{p.name}</b><small>{p.endpoint} · {p.models} models</small></span>
            <span className={`state ${p.status === 'Connected' ? 'running' : 'offline'}`}><i />{p.status}</span>
            <button onClick={() => { setActivity(a => [[now(), 'Settings', `Testing connection to ${p.name}…`], ...a]); fetch(p.endpoint + '/api/tags', { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined }).then(r => r.ok).catch(() => false).then(ok => setProviders(ps => ps.map(x => x.id === p.id ? { ...x, status: ok ? 'Connected' : 'Unreachable' } : x))) }} className="run" title="Test connection"><Play size={14} /></button>
            <button onClick={() => { setProviders(ps => ps.filter(x => x.id !== p.id)); setActivity(a => [[now(), 'Settings', `Removed provider: ${p.name}`], ...a]) }} style={{ background: 'transparent', border: 0, color: '#ee7777', padding: '4px', borderRadius: '4px' }}><Trash2 size={14} /></button>
          </div>)}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">API KEYS</p><h2>Keys & Secrets</h2></div><button onClick={() => setShowAddApiKey(true)} className="add-task"><Plus size={16} />Add</button></div>
        {showAddApiKey && <div className="composer" style={{ flexWrap: 'wrap' }}>
          <input value={newApiKey.name} onChange={e => setNewApiKey({ ...newApiKey, name: e.target.value })} placeholder="Key name" style={{ flex: '1 1 120px' }} />
          <input value={newApiKey.key} onChange={e => setNewApiKey({ ...newApiKey, key: e.target.value })} placeholder="API key" style={{ flex: '1 1 150px' }} />
          <input value={newApiKey.provider} onChange={e => setNewApiKey({ ...newApiKey, provider: e.target.value })} placeholder="Provider" style={{ flex: '1 1 100px' }} />
          <button type="button" onClick={() => setShowAddApiKey(false)}><X size={16} /></button>
          <button type="submit" onClick={() => { if (newApiKey.name && newApiKey.key) { setApiKeys(k => [...k, { id: Date.now(), ...newApiKey, key: '••••••••' + newApiKey.key.slice(-6) }]); setNewApiKey({ name: '', key: '', provider: '' }); setShowAddApiKey(false) } }}>Save</button>
        </div>}
        <div className="app-list">
          {apiKeys.map(k => <div key={k.id} className="app-row">
            <span className="app-icon" style={{ color: '#fbbf24', background: '#fbbf2417' }}><Key size={18} /></span>
            <span className="app-info"><b>{k.name}</b><small>{k.provider} · {k.key}</small></span>
            <button onClick={() => { navigator.clipboard?.writeText(k.key); setActivity(a => [[now(), 'Settings', `Copied key: ${k.name}`], ...a]) }} style={{ background: 'transparent', border: 0, color: '#8b8792', padding: '4px', borderRadius: '4px' }}><ClipboardCopy size={14} /></button>
            <button onClick={() => setApiKeys(ks => ks.filter(x => x.id !== k.id))} style={{ background: 'transparent', border: 0, color: '#ee7777', padding: '4px', borderRadius: '4px' }}><Trash2 size={14} /></button>
          </div>)}
        </div>
      </section>

      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <div className="panel-heading"><div><p className="eyebrow">MCP SERVERS</p><h2>MCP Server Connections</h2></div><button onClick={() => setShowAddMcp(true)} className="add-task"><Plus size={16} />Add</button></div>
        {showAddMcp && <div className="composer" style={{ flexWrap: 'wrap' }}>
          <input value={newMcp.name} onChange={e => setNewMcp({ ...newMcp, name: e.target.value })} placeholder="Server name" style={{ flex: '1 1 120px' }} />
          <input value={newMcp.endpoint} onChange={e => setNewMcp({ ...newMcp, endpoint: e.target.value })} placeholder="Endpoint URL" style={{ flex: '1 1 220px' }} />
          <select value={newMcp.type} onChange={e => setNewMcp({ ...newMcp, type: e.target.value })} style={{ flex: '0 0 100px', background: '#19171d', color: '#eee', border: '1px solid #3d3850', borderRadius: '7px', padding: '9px 11px', fontSize: '13px' }}>
            <option value="remote">Remote</option><option value="local">Local</option>
          </select>
          <button type="button" onClick={() => setShowAddMcp(false)}><X size={16} /></button>
          <button type="submit" onClick={() => { if (newMcp.name && newMcp.endpoint) { setMcpServers(s => [...s, { id: Date.now(), ...newMcp, status: 'Added' }]); setNewMcp({ name: '', endpoint: '', type: 'remote' }); setShowAddMcp(false) } }}>Save</button>
        </div>}
        <div className="app-list">
          {mcpServers.map(s => <div key={s.id} className="app-row">
            <span className="app-icon" style={{ color: '#60a5fa', background: '#60a5fa17' }}><Link size={18} /></span>
            <span className="app-info"><b>{s.name}</b><small>{s.endpoint} · {s.type}</small></span>
            <span className={`state ${s.status === 'Connected' ? 'running' : 'offline'}`}><i />{s.status}</span>
            <button onClick={() => { setActivity(a => [[now(), 'Settings', `Testing MCP: ${s.name}…`], ...a]); fetch(s.endpoint).then(r => r.ok).catch(() => false).then(ok => setMcpServers(ms => ms.map(x => x.id === s.id ? { ...x, status: ok ? 'Connected' : 'Unreachable' } : x))) }} className="run" title="Test"><Play size={14} /></button>
            <button onClick={() => setMcpServers(ms => ms.filter(x => x.id !== s.id))} style={{ background: 'transparent', border: 0, color: '#ee7777', padding: '4px', borderRadius: '4px' }}><Trash2 size={14} /></button>
          </div>)}
        </div>
      </section>
      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <div className="panel-heading"><div><p className="eyebrow">APP MANAGEMENT</p><h2>Custom Apps & Services</h2></div><button onClick={() => { setShowAddApp(true); setNewApp({ name: '', url: '', workspace: ['local'], icon: '', kind: '', group: '', port: '' }) }} className="add-task"><Plus size={16} />Add</button></div>
        {showAddApp && <div className="composer" style={{ flexWrap: 'wrap', gap: '6px' }}>
          <input value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} placeholder="Name" style={{ flex: '1 1 120px' }} />
          <input value={newApp.url} onChange={e => setNewApp({ ...newApp, url: e.target.value })} placeholder="URL (e.g. http://192.168.1.42:8096/)" style={{ flex: '1 1 260px' }} />
          <select value={(newApp.workspace || ['local'])[0]} onChange={e => setNewApp({ ...newApp, workspace: [e.target.value] })} style={{ background: '#26242a', color: '#e5e1e8', border: '1px solid #454049', borderRadius: '5px', padding: '6px 9px' }}>
            <option value="local">This PC</option>
            <option value="homelab">Homelab</option>
            <option value="vps">VPS</option>
          </select>
          <button type="button" onClick={() => setShowAddApp(false)}><X size={16} /></button>
          <button type="submit" onClick={() => { if (newApp.name) { const ws = newApp.workspace || ['local']; setCustomApps(c => [...c, { id: 'custom-' + Date.now(), name: newApp.name, icon: <Box />, kind: 'Service', state: 'Running', color: '#aaa', task: '', usage: '—', port: null, group: 'Custom', url: newApp.url || null, workspace: ws }]); setShowAddApp(false); setNewApp({ name: '', url: '', workspace: ['local'] }); setActivity(a => [[now(), 'Settings', `Added app: ${newApp.name}`], ...a]) } }}>Add App</button>
        </div>}
        {editingApp && <div className="composer" style={{ flexWrap: 'wrap', gap: '6px', borderColor: '#5e5285' }}>
          <span style={{ fontSize: '11px', color: '#8978f3', width: '100%' }}>Editing: {editingApp.name}</span>
          <input value={editingApp.name} onChange={e => setEditingApp({ ...editingApp, name: e.target.value })} placeholder="Name" style={{ flex: '1 1 120px' }} />
          <input value={editingApp.url || ''} onChange={e => setEditingApp({ ...editingApp, url: e.target.value || null })} placeholder="URL" style={{ flex: '1 1 260px' }} />
          <button type="button" onClick={() => setEditingApp(null)}><X size={16} /></button>
          <button type="submit" onClick={() => { saveAppEdit(editingApp); setEditingApp(null); setActivity(a => [[now(), 'Settings', `Updated app: ${editingApp.name}`], ...a]) }} style={{ background: '#3d355c', color: '#e1daff', borderRadius: '6px', padding: '0 13px', fontSize: '11px' }}><Check size={14} /> Save</button>
        </div>}
        <div className="app-list" style={{ maxHeight: '300px', overflow: 'auto' }}>
          {[...localAgentsBase, ...homelabBase, ...vpsBase, ...customApps].map(a => <div key={a.id} className="app-row">
            <span className="app-icon" style={{ color: a.color, background: `${a.color}17` }}>{a.icon}</span>
            <span className="app-info"><b>{a.name}</b><small>{a.kind} · {a.group} · {a.port ? ':' + a.port : 'no port'} {a.url ? '→ ' + a.url : '· no link'}</small></span>
            <span className={`state ${a.state?.toLowerCase()}`}><i />{a.state}</span>
            {a.url && <button onClick={() => openService(a)} className="run" title="Test launch"><Play size={14} /></button>}
            <button onClick={() => setEditingApp({ ...a })} style={{ background: 'transparent', border: 0, color: '#8978f3', padding: '4px', borderRadius: '4px' }} title="Edit"><Settings size={14} /></button>
            {customApps.some(x => x.id === a.id) && <button onClick={() => setCustomApps(cs => cs.filter(x => x.id !== a.id))} style={{ background: 'transparent', border: 0, color: '#ee7777', padding: '4px', borderRadius: '4px' }}><Trash2 size={14} /></button>}
          </div>)}
        </div>
      </section>
    </div>}

  </>

  return <div className={`shell ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
    <button className="expand-sidebar" onClick={() => setSidebarOpen(true)}><Sparkles size={17} /></button>
    <aside className="sidebar">
      <div className="brand"><div className="logo"><Sparkles size={17} /></div><span>ORBITAL</span><button onClick={() => setSidebarOpen(false)}><PanelLeftClose size={17} /></button></div>
      <nav>
        {TABS.map(tab => (
          <button key={tab.id} className={`nav ${activeTab === tab.id && !activeAppId ? 'active' : ''}`} onClick={() => { setActiveTab(tab.id); setActiveAppId(null) }}>
            {tab.icon}{tab.label}
            {tab.id === 'agents' && <em>{filteredAgents.length}</em>}
            {tab.id === 'apps' && <em>{filteredApps.length}</em>}
          </button>
        ))}
      </nav>
      <div className="side-label">WORKSPACES</div>
      {WORKSPACES.map(w => (
        <button key={w.id} className={`workspace ${activeWorkspace === w.id ? 'active' : ''}`} onClick={() => { setActiveWorkspace(w.id); setActiveAppId(null) }}>
          <span className="workspace-icon" style={{ background: w.color }}>{w.icon}</span>
          <span>{w.name}<small>{w.desc}</small></span>
          {w.type !== 'vps' && <span className="ws-dot online" />}
        </button>
      ))}
      <button className="new-workspace"><Plus size={16} />New workspace</button>
      <div className="sidebar-bottom">
        <button className="nav"><Settings />Settings</button>
        <div className="user"><div className="avatar">C</div><span>Chris<small>Local admin</small></span><ChevronDown size={15} /></div>
      </div>
      {openApps.length > 0 && <div style={{ borderTop: '1px solid #29282c', marginTop: '12px', paddingTop: '12px' }}>
        <div className="side-label">OPEN APPS</div>
        {openApps.map(a => (
          <button key={a.id} className={`nav ${activeAppId === a.id ? 'active' : ''}`} onClick={() => setActiveAppId(a.id)}>
            <span style={{ color: a.color }}>{a.icon}</span>{a.name}
            <button className="close-app-btn" onClick={e => { e.stopPropagation(); closeApp(a.id) }}><X size={12} /></button>
          </button>
        ))}
      </div>}
    </aside>

    <main style={activeAppId ? { padding: '0', display: 'flex', flexDirection: 'column' } : {}}>
      <div className="workspace-tabs">
        <button className={`ws-tab ${!activeAppId ? 'active' : ''}`} onClick={() => setActiveAppId(null)}>
          <LayoutDashboard size={15} /> Dashboard
        </button>
        {openApps.map(a => (
          <button key={a.id} className={`ws-tab ${activeAppId === a.id ? 'active' : ''}`} onClick={() => setActiveAppId(a.id)}>
            <span style={{ color: a.color }}>{a.icon}</span> {a.name}
            <span className="ws-tab-close" onClick={e => { e.stopPropagation(); closeApp(a.id) }}><X size={13} /></span>
          </button>
        ))}
      </div>

      {!activeAppId ? (
        renderDashboard()
      ) : (
        <div className="app-frame-wrapper">
          {activeApp && activeApp.url ? (
            <div className="app-frame-container">
              <div className="app-frame-bar">
                <span style={{ color: activeApp.color, display: 'flex', alignItems: 'center', gap: '6px' }}>{activeApp.icon} {activeApp.name}</span>
                <span className="app-frame-url">{activeApp.url}</span>
                <button onClick={() => { const f = document.getElementById(`frame-${activeApp.id}`); if (f) f.src = f.src }} title="Reload"><RefreshCw size={14} /></button>
              </div>
              <iframe id={`frame-${activeApp.id}`} src={activeApp.url} className="app-iframe" title={activeApp.name} />
            </div>
          ) : (
            <div className="panel" style={{ padding: '60px', textAlign: 'center' }}>
              <h2>{activeApp?.name}</h2>
              <p style={{ color: '#89848f' }}>This service doesn't have a web interface.</p>
            </div>
          )}
        </div>
      )}
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>)
