import React, { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL || window.location.origin

const USERS = [
  { id: 'me', name: '백인헌', team: '연구개발본부 차체설계', avatar: 'ME' },
  { id: 'p1', name: '김태훈', team: '차체설계', avatar: 'KT' },
  { id: 'p2', name: '박지민', team: '차체설계', avatar: 'PJ' },
  { id: 'p3', name: '이성호', team: '차체설계', avatar: 'LS' },
  { id: 'p4', name: '최현우', team: '차체설계', avatar: 'CH' },
  { id: 'p5', name: '정민수', team: '차체설계', avatar: 'JM' },
  { id: 'p6', name: '윤상우', team: '차체설계', avatar: 'YS' },
  { id: 'p7', name: '오준호', team: '차체설계', avatar: 'OJ' },
]

const ROOMS = ['차체설계-일반', '차체설계-검토', '공지']

function Header(){
  return (
    <div className="header">
      <div className="brand">
        <img src="/logo.svg" alt="logo" />
        <div className="title">
          <div className="k">H-Talk</div>
        </div>
      </div>
    </div>
  )
}

function MessageRow({ m }){
  const isMe = m.userId === 'me'
  return (
    <div className={'msg-row ' + (isMe ? 'me' : '')}>
      {!isMe && <div className="avatar">{m.avatar}</div>}
      <div>
        <div className="bubble">{m.text}</div>
        <div className="meta">{m.name} · {m.time}</div>
      </div>
      {isMe && <div className="avatar">{m.avatar}</div>}
    </div>
  )
}

function DaySep({ date }){
  const str = date.toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short'})
  return <div className="sep"><span>{str}</span></div>
}

export default function App(){
  const [loggedIn, setLoggedIn] = useState(false)
  const [id, setId] = useState('blh0615')
  const [pw, setPw] = useState('1234')
  const [room, setRoom] = useState(ROOMS[0])
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const listRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    if(listRef.current){
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loggedIn, room])

  useEffect(() => {
    if (!loggedIn) return
    fetch(`${API}/api/messages?room=${encodeURIComponent(room)}`)
      .then(r=>r.json())
      .then(data => setMessages(data))
      .catch(()=> setMessages([]))
    if (wsRef.current) { wsRef.current.close() }
    const wsUrl = API.replace(/^http/,'ws') + '/ws'
    const ws = new WebSocket(wsUrl)
    ws.onopen = () => { ws.send(JSON.stringify({ type:'join', room })) }
    ws.onmessage = (evt) => {
      try{
        const msg = JSON.parse(evt.data)
        if(msg.type === 'new_message' && msg.payload.room === room){
          setMessages(prev => [...prev, msg.payload])
        }
      }catch(e){}
    }
    wsRef.current = ws
    return () => { ws.close() }
  }, [loggedIn, room])

  function handleLogin(e){
    e.preventDefault()
    if(id === 'blh0615' && pw === '1234') setLoggedIn(true)
    else alert('아이디 또는 비밀번호가 올바르지 않습니다.')
  }

  async function handleSend(){
    const v = text.trim()
    if(!v) return
    setText('')
    const payload = { room, userId: 'me', text: v }
    await fetch(`${API}/api/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  }

  const grouped = []
  let lastDay = null
  for(const m of messages){
    if(m.day !== lastDay){
      grouped.push({sep: new Date(m.day)})
      lastDay = m.day
    }
    grouped.push(m)
  }

  if(!loggedIn){
    return (
      <div className="app">
        <div className="shell">
          <Header />
          <div className="login">
            <div className="card">
              <form className="form" onSubmit={handleLogin}>
                <div>
                  <label>아이디</label>
                  <input value={id} onChange={e=>setId(e.target.value)} placeholder="사번 또는 아이디" />
                </div>
                <div>
                  <label>비밀번호</label>
                  <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" />
                </div>
                <button type="submit" style={{marginTop:8}} className="input-button">로그인</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="shell">
        <Header />
        <div className="tabs">
          {ROOMS.map(r => (
            <button key={r} className={'tab '+ (r===room?'active':'')} onClick={()=>setRoom(r)}>{r}</button>
          ))}
        </div>
        <div className="main">
          <aside className="sidebar">
            {USERS.filter(u=>u.id!=='me').map(u => (
              <div key={u.id} className={'member'}>
                <div className="avatar">{u.avatar}</div>
                <div style={{fontSize:12}}>{u.name}</div>
              </div>
            ))}
          </aside>
          <div className="content">
            <div className="messages" ref={listRef}>
              {grouped.map((g, i) => ('sep' in g) ? (
                <div key={'d'+i}><DaySep date={g.sep} /></div>
              ) : (
                <div key={i}>
                  <MessageRow m={g} />
                </div>
              ))}
            </div>
            <div className="input">
              <input
                placeholder="메시지 입력… (엔터 전송)"
                value={text}
                onChange={e=>setText(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); handleSend() } }}
              />
              <button onClick={handleSend}>전송</button>
            </div>
          </div>
        </div>
        <div className="footer">연구개발본부 차체설계 · {new Date().toLocaleDateString('ko-KR')}</div>
      </div>
    </div>
  )
}
