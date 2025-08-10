import express from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5174
const BOT_MIN_SEC = Number(process.env.BOT_MIN_SEC || 60)
const BOT_MAX_SEC = Number(process.env.BOT_MAX_SEC || 120)
const AUTO_REPLY = process.env.AUTO_REPLY !== '0'
const REPLY_MIN_SEC = Number(process.env.REPLY_MIN_SEC || 180)
const REPLY_MAX_SEC = Number(process.env.REPLY_MAX_SEC || 300)
const MENTION_REMOTE = process.env.MENTION_REMOTE === '1'

const DATA_FILE = path.join(__dirname, 'data', 'messages.json')
const PHRASES_FILE = path.join(__dirname, 'shared', 'phrases.json')
const RULES_FILE = path.join(__dirname, 'shared', 'rules.json')

const USERS = [
  { id: 'me', name: '백인헌', team: '연구개발본부 차체설계', avatar: 'ME' },
  { id: 'p1', name: '김태훈', team: '차체설계', avatar: 'KT' },
  { id: 'p2', name: '박지민', team: '차체설계', avatar: 'PJ' },
  { id: 'p3', name: '이성호', team: '차체설계', avatar: 'LS' },
  { id: 'p4', name: '최현우', team: '차체설계', avatar: 'CH' },
  { id: 'p5', name: '정민수', team: '차체설계', avatar: 'JM' },
  { id: 'p6', name: '윤상우', team: '차체설계', avatar: 'YS' },
  { id: 'p7', name: '오준호', team: '차체설계', avatar: 'OJ' },
  { id: 'bot', name: '차체봇', team: '자동응답', avatar: 'CB' },
]
const ROOMS = ['차체설계-일반', '차체설계-검토', '공지']

const app = express()
app.use(cors())
app.use(express.json())

function fmtTime(d){
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${hh}:${mm}`
}
function readJSON(fp, fallback){ try{ return JSON.parse(fs.readFileSync(fp, 'utf-8')) }catch(e){ return fallback } }

let DB = readJSON(DATA_FILE, { rooms: { '차체설계-일반': [], '차체설계-검토': [], '공지': [] } })
let PHRASES = readJSON(PHRASES_FILE, [])
let RULES = readJSON(RULES_FILE, {})

app.get('/api/messages', (req, res) => {
  const room = req.query.room || '차체설계-일반'
  const msgs = DB.rooms[room] || []
  res.json(msgs)
})

app.post('/api/messages', (req, res) => {
  const { room, userId, text } = req.body || {}
  if(!room || !userId || !text) return res.status(400).json({ error: 'room,userId,text 필수' })
  const u = USERS.find(u => u.id === userId) || USERS[0]
  const d = new Date()
  const msg = { room, day: d.toDateString(), userId, name: u.name, avatar: u.avatar, text, time: fmtTime(d) }
  if(!DB.rooms[room]) DB.rooms[room] = []
  DB.rooms[room].push(msg)
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf-8')
  broadcast({ type:'new_message', payload: msg })

  if (AUTO_REPLY) {
    const replyText = pickRuleReply(text)
    if (replyText) scheduleAutoReply(room, replyText)
  }

  res.json({ ok: true })
})

const server = app.listen(PORT, () => {
  console.log('API+Web listening on', PORT)
})

const wss = new WebSocketServer({ server, path: '/ws' })
const clients = new Set()
wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('message', (raw) => { try{ JSON.parse(raw.toString()) }catch(e){} })
})

function broadcast(obj){
  const raw = JSON.stringify(obj)
  for(const ws of clients){
    try{ ws.send(raw) }catch(e){}
  }
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a }

let botTimer = null
function scheduleBot(){
  const sec = randInt(BOT_MIN_SEC, BOT_MAX_SEC)
  if(botTimer) clearTimeout(botTimer)
  botTimer = setTimeout(()=>{
    try{
      const room = ROOMS[randInt(0, ROOMS.length-1)]
      const others = USERS.filter(u=>u.id!=='me' && u.id!=='bot')
      const who = others[randInt(0, others.length-1)]
      if(!scheduleBot.bag || scheduleBot.bag.length===0){
        scheduleBot.bag = PHRASES.slice().sort(()=>Math.random()-0.5)
      }
      const text = scheduleBot.bag.pop()
      const d = new Date()
      const msg = { room, day: d.toDateString(), userId: who.id, name: who.name, avatar: who.avatar, text, time: fmtTime(d) }
      if(!DB.rooms[room]) DB.rooms[room] = []
      DB.rooms[room].push(msg)
      fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf-8')
      broadcast({ type:'new_message', payload: msg })
    }catch(e){
      console.error('bot error', e)
    }finally{
      scheduleBot()
    }
  }, sec*1000)
}
scheduleBot()

function sanitizeRemoteText(s){
  if (MENTION_REMOTE) return s
  try{
    s = s.replace(/\s*\([^)]*(재택|원격|VPN|현장|외근)[^)]*\)/gi, '')
    s = s.replace(/^(재택|원격|VPN\s*연결\s*후|지금\s*사무실\s*외근이라)\s*/gi, '')
    s = s.replace(/\s{2,}/g, ' ').trim()
  }catch(e){}
  return s
}
function pickRuleReply(text){
  for (const pattern in RULES){
    try{
      const re = new RegExp(pattern, 'i')
      if(re.test(text)){
        const arr = RULES[pattern]
        const out = arr[Math.floor(Math.random()*arr.length)]
        return sanitizeRemoteText(out)
      }
    }catch(e){}
  }
  return null
}
function scheduleAutoReply(room, replyText){
  const sec = randInt(REPLY_MIN_SEC, REPLY_MAX_SEC)
  setTimeout(() => {
    try{
      const bot = USERS.find(u=>u.id==='bot')
      const d = new Date()
      const msg = { room, day: d.toDateString(), userId: bot.id, name: bot.name, avatar: bot.avatar, text: replyText, time: fmtTime(d) }
      if(!DB.rooms[room]) DB.rooms[room] = []
      DB.rooms[room].push(msg)
      fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf-8')
      broadcast({ type:'new_message', payload: msg })
    }catch(e){ console.error('auto-reply error', e) }
  }, sec*1000)
}

// Serve built frontend
const dist = path.join(__dirname, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  console.log('[warn] dist/ not found. Run: npm run build')
}
