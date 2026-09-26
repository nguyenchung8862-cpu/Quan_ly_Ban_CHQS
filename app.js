"use strict";

const MAGIC = "BCHQS_BGM_ENCRYPTED";
const FORMAT_VERSION = 1;
const AAD_TEXT = "BCHQS-BGM|1";
const DB_NAME = "bchqs_chihuy_pwa";
const DB_STORE = "encrypted_files";
const DB_KEY = "latest";

let currentData = null;
let currentEnvelopeText = null;
let selectedText = null;
let selectedName = "";
let taskFilter = "all";

const $ = id => document.getElementById(id);

// Khóa pinch-zoom / gesture zoom trong khung PWA.
document.addEventListener("gesturestart", e => e.preventDefault(), {passive:false});
document.addEventListener("gesturechange", e => e.preventDefault(), {passive:false});
document.addEventListener("gestureend", e => e.preventDefault(), {passive:false});
document.addEventListener("touchmove", e => {
  if (e.touches && e.touches.length > 1) e.preventDefault();
}, {passive:false});
let lastTouchEnd = 0;
document.addEventListener("touchend", e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 280) e.preventDefault();
  lastTouchEnd = now;
}, {passive:false});
document.addEventListener("dblclick", e => e.preventDefault(), {passive:false});

function bytesToBase64(bytes){
  let bin=""; const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk){bin+=String.fromCharCode(...bytes.subarray(i,i+chunk));}
  return btoa(bin);
}
function base64ToBytes(s){
  const bin=atob(s); const out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
function enc(s){return new TextEncoder().encode(s)}
function dec(b){return new TextDecoder().decode(b)}

async function deriveKey(password, salt, iterations){
  const base = await crypto.subtle.importKey("raw",enc(password),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey(
    {name:"PBKDF2",hash:"SHA-256",salt,iterations},
    base,{name:"AES-GCM",length:256},false,["decrypt"]
  );
}

async function decryptEnvelope(text,password){
  let env;
  try{env=JSON.parse(text)}catch{throw new Error("File không đúng định dạng BCHQS Mobile.")}
  if(env.magic!==MAGIC || env.version!==FORMAT_VERSION) throw new Error("Phiên bản file dữ liệu không được hỗ trợ.");
  if(env.kdf?.name!=="PBKDF2-HMAC-SHA-256" || env.cipher?.name!=="AES-256-GCM") throw new Error("Thuật toán mã hóa không hợp lệ.");
  const salt=base64ToBytes(env.kdf.salt);
  const iv=base64ToBytes(env.cipher.iv);
  const ct=base64ToBytes(env.ciphertext);
  const key=await deriveKey(password,salt,env.kdf.iterations);
  try{
    const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:enc(AAD_TEXT),tagLength:128},key,ct);
    const data=JSON.parse(dec(new Uint8Array(plain)));
    validateData(data);
    return data;
  }catch(err){
    throw new Error("Mật khẩu không đúng hoặc file đã bị thay đổi.");
  }
}

function validateData(data){
  if(!data || typeof data!=="object") throw new Error("Dữ liệu không hợp lệ.");
  if(data.schema!=="BCHQS_MOBILE_DATA_V1") throw new Error("Dữ liệu không đúng chuẩn BCHQS Mobile.");
  ["tasks","guards","alerts"].forEach(k=>{ if(!Array.isArray(data[k])) data[k]=[]; });
}

function openDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
async function dbPut(value){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(value,DB_KEY);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function dbGet(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(DB_STORE,"readonly").objectStore(DB_STORE).get(DB_KEY);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}

function msg(text,type=""){$("gateMsg").textContent=text;$('gateMsg').className="message"+(type?" "+type:"")}

function normalizeEnvelopeText(text){
  return String(text||"").replace(/^\uFEFF/,"").trim();
}

function inspectEnvelopeText(text){
  let env;
  try{env=JSON.parse(normalizeEnvelopeText(text))}catch{throw new Error("File không đúng định dạng dữ liệu BCHQS.")}
  if(env?.magic!==MAGIC || Number(env?.version)!==FORMAT_VERSION) throw new Error("File không phải dữ liệu BCHQS Chỉ huy hợp lệ.");
  return env;
}

function setSelected(name,text){
  selectedName=name; selectedText=normalizeEnvelopeText(text);
  $("selectedFile").textContent=name;
  $("selectedFile").classList.remove("hidden");
  $("passwordBlock").classList.remove("hidden");
  $("password").value="";
  $("password").focus();
  msg("");
}

$("bgmFile").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try{
    if(file.size>20*1024*1024) throw new Error("File dữ liệu quá lớn.");
    const text=normalizeEnvelopeText(await file.text());
    inspectEnvelopeText(text);
    setSelected(file.name||"Du_lieu_BCHQS_BGM.json",text);
  }catch(err){
    selectedText=null;
    msg(err?.message||"Không đọc được file dữ liệu BCHQS.","error");
  }
});

$("togglePassword").addEventListener("click",()=>{
  const p=$("password");p.type=p.type==="password"?"text":"password";
});

$("password").addEventListener("keydown",e=>{if(e.key==="Enter")$("unlockBtn").click()});

$("unlockBtn").addEventListener("click",async()=>{
  const password=$("password").value;
  if(!selectedText){msg("Chưa chọn file dữ liệu.","error");return}
  if(!password){msg("Hãy nhập mật khẩu mở khóa.","error");return}
  const b=$("unlockBtn");b.disabled=true;b.textContent="Đang mở khóa...";msg("");
  try{
    currentData=await decryptEnvelope(selectedText,password);
    currentEnvelopeText=selectedText;
    await dbPut({name:selectedName,text:selectedText,savedAt:Date.now()});
    $("password").value="";
    renderApp();showMain();
  }catch(err){msg(err.message||"Không mở được dữ liệu.","error")}
  finally{b.disabled=false;b.textContent="Mở khóa dữ liệu"}
});

$("reuseBtn").addEventListener("click",async()=>{
  const x=await dbGet(); if(!x)return;
  setSelected(x.name||"Du_lieu_BCHQS_BGM.json",x.text);
});

$("lockBtn").addEventListener("click",lockApp);
$("importAgainBtn").addEventListener("click",()=>{lockApp();$("bgmFile").click()});

function lockApp(){
  currentData=null; currentEnvelopeText=null; selectedText=null; selectedName="";
  $("main").classList.remove("active");$("gate").classList.add("active");
  $("selectedFile").classList.add("hidden");$("passwordBlock").classList.add("hidden");
  $("bgmFile").value="";$("password").value="";msg("Ứng dụng đã khóa.","ok");
  dbGet().then(x=>$("reuseBtn").classList.toggle("hidden",!x));
}

function showMain(){
  $("gate").classList.remove("active");$("main").classList.add("active");
  updateOnlineState();
}

function fmtDateTime(v){
  if(!v)return "—"; const d=new Date(v); if(Number.isNaN(d.getTime()))return String(v);
  return new Intl.DateTimeFormat("vi-VN",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
}
function fmtShortDate(v){
  if(!v)return "—"; const d=new Date(v); if(Number.isNaN(d.getTime()))return String(v);
  return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d);
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function isDone(x){return !!x?.done || /hoàn thành|đã xong|xong/i.test(String(x?.status||""))}
function isIncoming(x){return String(x?.sourceType||x?.type||"").toLowerCase()==="incoming" || /^\s*\[vb đến\]/i.test(String(x?.title||x?.content||""))}
function isOverdue(x){
  if(isDone(x))return false;
  if(/quá hạn/i.test(String(x?.status||"")))return true;
  if(!x?.deadline)return false; const t=new Date(x.deadline).getTime(); return Number.isFinite(t)&&t<Date.now();
}
function isSoon(x){
  if(isDone(x)||isOverdue(x))return false;
  if(/sắp/i.test(String(x?.status||"")))return true;
  if(!x?.deadline)return false; const t=new Date(x.deadline).getTime();
  return Number.isFinite(t)&&t>=Date.now()&&t-Date.now()<=72*3600*1000;
}
function statusClass(s){s=String(s||"").toLowerCase();if(/quá|nguy|mất|chưa nhận|bất thường/.test(s))return"danger";if(/sắp|chờ|cảnh báo|muộn/.test(s))return"warn";if(/xong|hoàn|bình thường|đã nhận|đang trực/.test(s))return"ok";return"muted"}
function taskStateClass(x){return isOverdue(x)?"danger-card":isSoon(x)?"warn-card":isDone(x)?"ok-card":""}
function cleanTaskTitle(x){return String(x?.title||x?.content||"Nhiệm vụ").replace(/^\s*\[vb đến\]\s*/i,"").trim()||"Nhiệm vụ"}
function deadlineInfo(x){
  if(!x?.deadline)return {text:"Chưa có hạn",cls:""};
  const t=new Date(x.deadline).getTime(); if(!Number.isFinite(t))return {text:String(x.deadline),cls:""};
  if(isDone(x))return {text:"Hạn: "+fmtShortDate(x.deadline),cls:""};
  const diff=t-Date.now(), abs=Math.abs(diff), hours=Math.ceil(abs/3600000);
  if(diff<0){
    const text=hours<24?`Quá ${hours} giờ`:`Quá ${Math.ceil(hours/24)} ngày`;
    return {text:`⚠ ${text} · ${fmtShortDate(x.deadline)}`,cls:"due-danger"};
  }
  if(diff<=72*3600000){
    const text=hours<24?`Còn ${Math.max(1,hours)} giờ`:`Còn ${Math.ceil(hours/24)} ngày`;
    return {text:`◷ ${text} · ${fmtShortDate(x.deadline)}`,cls:"due-warn"};
  }
  return {text:"Hạn: "+fmtShortDate(x.deadline),cls:""};
}

function renderApp(){
  const d=currentData; if(!d)return;
  $("syncTime").textContent="Cập nhật: "+fmtDateTime(d.generatedAt);
  renderStale(d.generatedAt);
  const tasks=d.tasks||[], guards=d.guards||[], alerts=d.alerts||[];
  const active=tasks.filter(x=>!isDone(x));
  const overdue=tasks.filter(isOverdue);
  const soon=tasks.filter(isSoon);
  const kpiData=[
    [active.length,"Đang xử lý","","✓"],
    [soon.length,"Sắp đến hạn","warn","◷"],
    [overdue.length,"Quá hạn","danger","!"],
    [alerts.length,"Cảnh báo","danger","⚠"]
  ];
  $("kpis").innerHTML=kpiData.map(([n,l,c,i])=>`<div class="kpi ${c}"><div class="kpi-icon">${i}</div><small>${esc(l).toUpperCase()}</small><strong>${n}</strong></div>`).join("");

  const attention=[
    ...alerts.slice(0,3),
    ...overdue.slice(0,3).map(t=>({title:cleanTaskTitle(t),type:isIncoming(t)?"VB đến quá hạn":"Nhiệm vụ quá hạn",status:"Quá hạn"}))
  ];
  $("attentionList").innerHTML=attention.length?attention.map(renderSimple).join(""):'<div class="empty">✓ Không có cảnh báo đáng chú ý.</div>';

  const near=[...tasks].filter(x=>x.deadline&&!isDone(x)).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,5);
  $("nearDueList").innerHTML=near.length?near.map(renderTaskCard).join(""):'<div class="empty">Không có công việc gần hạn.</div>';
  renderTasks();
  $("guardList").innerHTML=guards.length?guards.map(renderGuardCard).join(""):'<div class="empty">Chưa có dữ liệu trực gác.</div>';
  $("alertList").innerHTML=alerts.length?alerts.map(renderAlertCard).join(""):'<div class="empty">✓ Không có cảnh báo.</div>';
  bindCards();
}

function filterTasks(list,filter){
  if(filter==="incoming")return list.filter(isIncoming);
  if(filter==="overdue")return list.filter(isOverdue);
  if(filter==="soon")return list.filter(isSoon);
  if(filter==="done")return list.filter(isDone);
  return list;
}
function updateTaskFilterCounts(tasks){
  const map={
    filterCountAll:tasks.length,
    filterCountIncoming:tasks.filter(isIncoming).length,
    filterCountOverdue:tasks.filter(isOverdue).length,
    filterCountSoon:tasks.filter(isSoon).length,
    filterCountDone:tasks.filter(isDone).length
  };
  for(const [id,n] of Object.entries(map)){const el=$(id);if(el)el.textContent=n}
}
function renderTasks(){
  const all=currentData?.tasks||[];
  updateTaskFilterCounts(all);
  const q=($("taskSearch").value||"").trim().toLowerCase();
  let list=filterTasks(all,taskFilter).filter(x=>!q||JSON.stringify(x).toLowerCase().includes(q));
  list=[...list].sort((a,b)=>{
    const rank=x=>isOverdue(x)?0:isSoon(x)?1:!isDone(x)?2:3;
    const r=rank(a)-rank(b); if(r)return r;
    const ad=a.deadline?new Date(a.deadline).getTime():Number.MAX_SAFE_INTEGER;
    const bd=b.deadline?new Date(b.deadline).getTime():Number.MAX_SAFE_INTEGER;
    return ad-bd;
  });
  if($("taskCountLabel"))$("taskCountLabel").textContent=`${list.length} việc`;
  $("taskList").innerHTML=list.length?list.map(renderTaskCard).join(""):'<div class="empty">Không có công việc phù hợp bộ lọc.</div>';
  bindCards();
}
$("taskSearch").addEventListener("input",renderTasks);
for(const btn of document.querySelectorAll(".filter-btn")){
  btn.addEventListener("click",()=>{
    taskFilter=btn.dataset.filter||"all";
    document.querySelectorAll(".filter-btn").forEach(x=>x.classList.toggle("active",x===btn));
    renderTasks();
    $("content").scrollTop=0;
  });
}

function renderTaskCard(x){
  const incoming=isIncoming(x), due=deadlineInfo(x);
  const status=isOverdue(x)?"Quá hạn":isSoon(x)&&!/sắp/i.test(String(x.status||""))?"Sắp đến hạn":String(x.status|| (isDone(x)?"Hoàn thành":"Đang xử lý"));
  return `<div class="item-card task-card ${taskStateClass(x)} clickable" data-kind="task" data-id="${esc(x.id)}">
    <div class="item-top">
      <div class="item-heading">
        <span class="source-tag ${incoming?"incoming":""}">${incoming?"VĂN BẢN ĐẾN":"NHIỆM VỤ"}</span>
        <div class="item-title">${esc(cleanTaskTitle(x))}</div>
      </div>
      <span class="badge ${statusClass(status)}">${esc(status)}</span>
    </div>
    <div class="item-sub"><span>👤</span><span><strong>${esc(x.assignee||"Chưa rõ người thực hiện")}</strong>${x.supervisor?` · phụ trách: ${esc(x.supervisor)}`:""}</span></div>
    <div class="meta-row"><span class="meta-chip ${due.cls}">${esc(due.text)}</span>${x.progress!=null?`<span class="meta-chip">Tiến độ: ${esc(x.progress)}%</span>`:""}</div>
  </div>`;
}
function renderGuardCard(x){
  return `<div class="item-card clickable" data-kind="guard" data-id="${esc(x.id)}"><div class="item-top"><div class="item-heading"><span class="source-tag">CA TRỰC</span><div class="item-title">${esc(x.post||"Vị trí trực")}</div></div><span class="badge ${statusClass(x.status)}">${esc(x.status||"—")}</span></div><div class="item-sub"><span>👤</span><span><strong>${esc(x.person||"Chưa phân công")}</strong>${x.shift?` · ${esc(x.shift)}`:""}</span></div><div class="meta-row"><span class="meta-chip">Xác nhận: ${esc(fmtShortDate(x.lastCheck))}</span></div></div>`;
}
function renderAlertCard(x){
  return `<div class="item-card clickable" data-kind="alert" data-id="${esc(x.id)}"><div class="item-top"><div class="item-heading"><span class="source-tag">CẢNH BÁO</span><div class="item-title">${esc(x.title||"Cảnh báo")}</div></div><span class="badge ${statusClass(x.level||x.status||"Cảnh báo")}">${esc(x.level||x.status||"Cảnh báo")}</span></div><div class="item-sub"><span>⚠</span><span>${esc(x.message||"")}</span></div><div class="meta-row"><span class="meta-chip">${esc(fmtDateTime(x.time))}</span></div></div>`;
}
function renderSimple(x){
  return `<div class="item-card"><div class="item-top"><div class="item-heading"><div class="item-title">${esc(x.title||x.message||x.content||"Cảnh báo")}</div></div><span class="badge ${statusClass(x.level||x.status||x.type)}">${esc(x.level||x.status||x.type||"Chú ý")}</span></div>${x.message?`<div class="item-sub"><span>⚠</span><span>${esc(x.message)}</span></div>`:""}</div>`;
}

function bindCards(){
  document.querySelectorAll("[data-kind][data-id]").forEach(el=>{el.onclick=()=>openDetail(el.dataset.kind,el.dataset.id)});
}
function openDetail(kind,id){
  const arr=kind==="task"?currentData.tasks:kind==="guard"?currentData.guards:currentData.alerts;
  const x=arr.find(v=>String(v.id)===String(id)); if(!x)return;
  $("detailTitle").textContent=kind==="task"?(isIncoming(x)?"Chi tiết văn bản đến":"Chi tiết nhiệm vụ"):kind==="guard"?"Chi tiết trực gác":"Chi tiết cảnh báo";
  const labels=kind==="task"?{
    title:"Nội dung",assignee:"Người thực hiện",supervisor:"Người phụ trách",deadline:"Hạn xử lý",status:"Trạng thái",progress:"Tiến độ",report:"Báo cáo gần nhất",note:"Ghi chú"
  }:kind==="guard"?{post:"Vị trí",person:"Người trực",shift:"Ca trực",status:"Trạng thái",receivedAt:"Nhận ca",lastCheck:"Xác nhận gần nhất",note:"Ghi chú"}:{title:"Cảnh báo",message:"Nội dung",level:"Mức độ",time:"Thời gian",source:"Nguồn"};
  $("detailBody").innerHTML=Object.entries(labels).filter(([k])=>x[k]!=null&&x[k]!=="").map(([k,l])=>`<div class="detail-row"><small>${esc(l)}</small><div>${esc(k==="deadline"||k.endsWith("At")||k==="time"||k==="lastCheck"?fmtDateTime(x[k]):k==="progress"?x[k]+"%":x[k])}</div></div>`).join("")||'<div class="empty">Không có chi tiết.</div>';
  $("detailModal").classList.remove("hidden");
}
$("detailClose").onclick=()=>$("detailModal").classList.add("hidden");
$("detailModal").addEventListener("click",e=>{if(e.target===$("detailModal"))$("detailModal").classList.add("hidden")});

function renderStale(v){
  const b=$("staleBanner"); const t=new Date(v).getTime();
  if(!t){b.classList.add("hidden");return}
  const mins=Math.floor((Date.now()-t)/60000);
  if(mins>=60){const h=Math.floor(mins/60),m=mins%60;b.textContent=`⚠ Dữ liệu đã cũ ${h?`${h} giờ `:""}${m} phút · nên nhập file mới`;b.classList.remove("hidden")}else b.classList.add("hidden");
}
function updateOnlineState(){ $("offlineBanner").classList.toggle("hidden",navigator.onLine); }
window.addEventListener("online",updateOnlineState);window.addEventListener("offline",updateOnlineState);

for(const btn of document.querySelectorAll(".nav-btn")){
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x===btn));
    document.querySelectorAll(".tab-page").forEach(p=>p.classList.toggle("active",p.dataset.page===btn.dataset.nav));
    $("content").scrollTop=0;
  });
}

(async function init(){
  if("serviceWorker" in navigator){try{await navigator.serviceWorker.register("./sw.js")}catch(e){console.warn("SW",e)}}
  try{const x=await dbGet();$("reuseBtn").classList.toggle("hidden",!x)}catch{}
  updateOnlineState();
})();
