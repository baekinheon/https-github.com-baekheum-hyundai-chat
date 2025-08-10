
const { useState, useEffect, useMemo, useRef } = React;

const MEMBERS = [
  { id: "u1", name: "백인헌", role: "연구원", me: true },
  { id: "u2", name: "김도현", role: "선임연구원" },
  { id: "u3", name: "이수진", role: "책임연구원" },
  { id: "u4", name: "박정우", role: "연구원" },
  { id: "u5", name: "최민재", role: "연구원" },
  { id: "u6", name: "오지현", role: "선임" },
  { id: "u7", name: "장기훈", role: "연구원" },
];

const ROOMS = [
  { id: "r1", name: "차체설계 TF", subtitle: "연구개발본부 · 차체설계" },
  { id: "r2", name: "도어모듈 개선", subtitle: "설계개선 · 품질" },
  { id: "r3", name: "NVH 개선", subtitle: "진동소음 · 해석" },
];

const MY_CHAT_DAYS = new Set([1,4,5,6]);        // 월,목,금,토
const OTHERS_CHAT_DAYS = new Set([1,2,3,4,5,6]); // 월~토
const SEGMENTS = [
  { label: "오전", start: 9, end: 11 },
  { label: "오후", start: 12, end: 17 },
  { label: "저녁", start: 18, end: 21 },
];

function fmtTime(d){
  const h=String(d.getHours()).padStart(2,"0");
  const m=String(d.getMinutes()).padStart(2,"0");
  return `${h}:${m}`;
}

function seedRoom(roomId){
  const base = new Date(); base.setHours(10, 3, 0, 0);
  const lines = [
    ["u3","오늘 3열 시트 브라켓 간섭 검토 결과 공유드립니다."],
    ["u2","간섭 발생 구간 도면 번호는 HB-BC-221-04 입니다."],
    ["u4","형상 단순화하면 용접 접근성은 확보될 것 같습니다."],
    ["u5","CAE 1차 해석은 16시까지 업데이트하겠습니다."],
  ];
  return lines.map((l,i)=>({ id:`${roomId}-seed-${i}`, roomId, author:l[0], text:l[1], time:fmtTime(new Date(base.getTime()+i*12*60*1000)) }));
}

const FIXED_OTHER = [
  "어제 공유드린 문서 확인 부탁드립니다.",
  "도면 수정본 업로드 했습니다.",
  "해석 결과가 예상보다 좋게 나왔습니다.",
  "회의 일정이 내일 오전으로 변경되었습니다.",
  "품질팀 피드백 반영해서 수정했습니다.",
  "JT 파일 최신본으로 교체했습니다.",
  "간섭 구간은 5mm 이격으로 해결 가능합니다.",
  "측정 데이터는 시트 'MEAS-07'에 정리했습니다.",
  "강성 마진은 7% 수준으로 추정됩니다.",
  "토크 값은 시방서 값 유지로 정리했습니다.",
];
const FIXED_ME = [
  "도면 최신본 기준으로 다시 확인하겠습니다.",
  "해석 조건 파일 갱신해서 공유드리겠습니다.",
  "금형 수정안 쪽으로 정리하는 걸로 하겠습니다.",
  "회의 전에 간단 체크리스트 정리해서 올리겠습니다.",
  "리비전 메모를 문서 첫 페이지에 추가하겠습니다.",
  "측정값 비교표도 함께 올리겠습니다.",
];
const PARTS_OTHER = {
  subject: ["자료","도면","해석","회의","품질 이슈","금형","일정","체크리스트","JT 파일","스냅샷","리스크","간섭","공차","배선","강성","NVH","토크 값"],
  verb: ["공유했습니다","업데이트했습니다","확인 부탁드립니다","반영했습니다","검토하겠습니다","전달하겠습니다","정리했습니다","업로드했습니다","요청드립니다","점검했습니다","적용했습니다"],
  tail: ["드라이브에 올렸습니다.","세부 코멘트는 2페이지에 적었습니다.","내일 오전까지 반영 일정입니다.","비교 그래프 포함했습니다.","협력사에도 동일 내용 전달했습니다.","측정값은 시트에 정리했습니다.","리비전은 R02로 관리하겠습니다."]
};
const PARTS_ME = {
  subject: ["도면","해석 조건","금형 수정안","체크리스트","간섭 스냅샷","시방서","공차","데이터"],
  verb: ["다시 확인하겠습니다","갱신해서 공유드리겠습니다","정리하겠습니다","회의 전에 올리겠습니다","반영해 보겠습니다","문서화하겠습니다","업데이트하겠습니다"],
  tail: ["오늘 중으로 진행하겠습니다.","저녁 전에 공유드리겠습니다.","메신저에도 링크 남기겠습니다.","세부 수치는 노션에 정리하겠습니다.","검토 포인트는 별도로 표기하겠습니다."]
};

function synth(parts, seed){
  const s = parts.subject[seed % parts.subject.length];
  const v = parts.verb[seed % parts.verb.length];
  const t = parts.tail[seed % parts.tail.length];
  return `${s} ${v}. ${t}`;
}

function loadUsed(){ try{ const raw=localStorage.getItem("htalk_used_texts"); return raw? new Set(JSON.parse(raw)) : new Set(); }catch{ return new Set(); } }
function saveUsed(s){ try{ localStorage.setItem("htalk_used_texts", JSON.stringify(Array.from(s))); }catch{} }

function pickSegment(){ return SEGMENTS[Math.floor(Math.random()*SEGMENTS.length)]; }
function randomTimeIn(seg){ const hour = Math.floor(Math.random()*(seg.end-seg.start+1))+seg.start; const minute = Math.floor(Math.random()*60); const d=new Date(); d.setHours(hour,minute,Math.floor(Math.random()*60),0); return d; }

function uniqueLine(isMe, usedGlobal, usedDay, idx){
  const fixed = isMe ? FIXED_ME : FIXED_OTHER;
  for(const line of fixed){ if(!usedGlobal.has(line) && !usedDay.has(line)){ usedGlobal.add(line); usedDay.add(line); return line; } }
  let attempt = 0;
  while(attempt<200){
    const parts = isMe? PARTS_ME : PARTS_OTHER;
    const line = synth(parts, idx + attempt + Math.floor(Math.random()*1000));
    if(!usedGlobal.has(line) && !usedDay.has(line)){ usedGlobal.add(line); usedDay.add(line); return line; }
    attempt++;
  }
  const fb = (isMe?"메모":"알림")+" "+(Date.now()%100000);
  usedGlobal.add(fb); usedDay.add(fb); return fb;
}

function generateDay(date){
  const dow = date.getDay();
  const canMe = MY_CHAT_DAYS.has(dow);
  const canOthers = OTHERS_CHAT_DAYS.has(dow);
  const target = 20; // per your request
  const distribution = [{room:"r1",n:20},{room:"r2",n:0},{room:"r3",n:0}]; // all to main room

  const times=[];
  for(let i=0;i<target;i++){ const seg=pickSegment(); const t=new Date(date); const r=randomTimeIn(seg); t.setHours(r.getHours(), r.getMinutes(), r.getSeconds(), 0); times.push(t); }
  times.sort((a,b)=>a-b);

  const others = MEMBERS.filter(m=>!m.me);
  const usedGlobal = loadUsed();
  const usedDay = new Set();
  const meId = "u1";
  const meTarget = canMe? Math.max(3, Math.min(8, Math.round(target*(0.25 + (Math.random()*0.2-0.1))))) : 0;
  let meLeft = meTarget;

  const out=[];
  let timeIdx=0;
  for(const {room,n} of distribution){
    for(let i=0;i<n;i++){
      const t = times[timeIdx++];
      let candidates = [];
      if(canOthers) candidates = candidates.concat(others.map(o=>o.id));
      if(canMe && meLeft>0) candidates.push(meId);
      if(candidates.length===0) continue;
      const prev = out.length? out[out.length-1].author : null;
      const filtered = candidates.filter(c=>c!==prev);
      const picked = (filtered.length? filtered : candidates)[Math.floor(Math.random()*(filtered.length?filtered.length:candidates.length))];
      if(picked===meId) meLeft = Math.max(0, meLeft-1);
      const line = uniqueLine(picked===meId, usedGlobal, usedDay, i);
      out.push({ id:`${room}-auto-${t.getTime()}-${i}`, roomId:room, author:picked, text:line, time:fmtTime(t) });
    }
  }
  saveUsed(usedGlobal);
  return out;
}

function generateSince(lastSeenISO){
  const add = { r1:[], r2:[], r3:[] };
  if(!lastSeenISO) return add;
  const last = new Date(lastSeenISO);
  const today = new Date();
  const cur = new Date(last); cur.setHours(0,0,0,0); cur.setDate(cur.getDate()+1);
  const end = new Date(today); end.setHours(0,0,0,0);
  while(cur.getTime()<=end.getTime()){
    const dayMsgs = generateDay(cur);
    for(const m of dayMsgs){ add[m.roomId].push(m); }
    cur.setDate(cur.getDate()+1);
  }
  return add;
}

function App(){
  const [active, setActive] = useState("r1");
  const [messages, setMessages] = useState(()=>{
    const obj={}; ROOMS.forEach(r=>obj[r.id]=seedRoom(r.id)); return obj;
  });
  const listRef = useRef(null);

  useEffect(()=>{
    const lastSeen = localStorage.getItem("htalk_lastSeen");
    const add = generateSince(lastSeen);
    setMessages(prev=>({ r1:[...prev.r1,...add.r1], r2:[...prev.r2,...add.r2], r3:[...prev.r3,...add.r3] }));
    localStorage.setItem("htalk_lastSeen", new Date().toISOString());
  },[]);

  useEffect(()=>{
    if(listRef.current){ listRef.current.scrollTop = listRef.current.scrollHeight; }
  },[messages, active]);

  const roomMsgs = messages[active]||[];

  return (
    <div className="container">
      <div className="header">H‑Talk</div>
      <div className="topline">
        <div><strong>{ROOMS.find(r=>r.id===active).name}</strong></div>
        <div className="small">현대차 스타일 사내 메신저</div>
      </div>
      <div className="rooms">
        {ROOMS.map(r=>(
          <button key={r.id} className={"room-btn"+(active===r.id?" active":"")} onClick={()=>setActive(r.id)}>
            {r.name}
          </button>
        ))}
      </div>
      <div className="list" ref={listRef}>
        {roomMsgs.map((m,idx)=>{
          const author = MEMBERS.find(x=>x.id===m.author);
          const me = !!author?.me;
          return (
            <div key={m.id+"-"+idx} className={"msg " + (me?"me":"other")}>
              {!me && <div className="author">{author?.name} {author?.role||""}</div>}
              <div className="bubble">{m.text}</div>
              <div className="time">{m.time}</div>
            </div>
          );
        })}
      </div>
      {/* Simple input (manual send, optional) */}
      <div className="input">
        <textarea rows="1" id="composer" placeholder="메시지를 입력하세요" onKeyDown={(e)=>{
          if(e.key==="Enter" && !e.shiftKey){
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if(!val) return;
            const meId="u1";
            const now=new Date();
            const used=loadUsed(); let safe=val; if(used.has(val)){ safe = val+" ("+(Date.now()%1000)+")"; } used.add(safe); saveUsed(used);
            const item = { id:`${active}-${Date.now()}`, roomId:active, author:meId, text:safe, time:fmtTime(now) };
            setMessages(prev=>({ ...prev, [active]:[...prev[active], item] }));
            e.currentTarget.value="";
            setTimeout(()=>{
              // auto reply with unique line
              const others = MEMBERS.filter(m=>!m.me);
              const who = others[Math.floor(Math.random()*others.length)];
              const reply = uniqueLine(false, loadUsed(), new Set(), Math.floor(Math.random()*1000));
              const bot = { id:`${active}-${Date.now()+1}`, roomId:active, author:who.id, text:reply, time:fmtTime(new Date()) };
              setMessages(prev=>({ ...prev, [active]:[...prev[active], bot] }));
            }, 20000);
          }
        }} />
        <button onClick={()=>{
          const ta = document.getElementById("composer");
          const val = ta.value.trim(); if(!val) return;
          const meId="u1"; const now=new Date();
          const used=loadUsed(); let safe=val; if(used.has(val)){ safe = val+" ("+(Date.now()%1000)+")"; } used.add(safe); saveUsed(used);
          const item = { id:`${active}-${Date.now()}`, roomId:active, author:meId, text:safe, time:fmtTime(now) };
          setMessages(prev=>({ ...prev, [active]:[...prev[active], item] }));
          ta.value="";
          setTimeout(()=>{
            const others = MEMBERS.filter(m=>!m.me);
            const who = others[Math.floor(Math.random()*others.length)];
            const reply = uniqueLine(false, loadUsed(), new Set(), Math.floor(Math.random()*1000));
            const bot = { id:`${active}-${Date.now()+1}`, roomId:active, author:who.id, text:reply, time:fmtTime(new Date()) };
            setMessages(prev=>({ ...prev, [active]:[...prev[active], bot] }));
          }, 20000);
        }}>전송</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
