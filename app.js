const KEY={events:"event_parent_v1",products:"product_v1",schedules:"schedule_v1"};
let events=load(KEY.events,[]),products=load(KEY.products,[]),schedules=load(KEY.schedules,[]);
// 旧形式（開始日時・終了日時）の予定が残っている場合も、新しい予定日・時刻形式へ引き継ぐ
schedules=schedules.map(s=>{if(!s.date&&s.start){const parts=String(s.start).split("T");s.date=parts[0]||"";s.meetingTime=s.meetingTime||parts[1]||"";s.startTime=s.startTime||parts[1]||"";}return s;});
const state={page:"home",returnPage:"home",eventId:null,productId:null,scheduleId:null,orderId:null,saleItemIndex:null,calendarDate:new Date(),selectedDate:new Date(),filters:{events:{type:"",keyword:""},products:{type:"",keyword:""},schedules:{type:"",keyword:""}},scheduleSections:{current:true,future:true,past:false}};
function load(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function id(){return Date.now()+Math.random().toString(16).slice(2)}function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function date(v){if(!v)return"-";const d=new Date(v+"T00:00:00");return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`}
function dt(v){return v?v.replace("T"," "):"-"}
function detail(k,v){return `<div class="detail"><span>${esc(k)}</span><b>${esc(v||"-")}</b></div>`}
function urlDetail(k,v){const raw=String(v||"").trim();if(!raw)return detail(k,"");const href=/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`;return `<div class="detail"><span>${esc(k)}</span><b><a class="detail-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a></b></div>`}
function title(t,back=false){
  document.getElementById("pageTitle").textContent=t;
  document.getElementById("backButton").classList.toggle("hidden",!back);
}
function nav(){
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
  const add = document.getElementById("addButton");
  if(add){
    const hideAdd = ["event","eventForm","product","productForm","schedule","scheduleForm","orderForm","saleItemForm"].includes(state.page);
    add.classList.toggle("hidden", hideAdd);
  }
}
function render(){nav();switch(state.page){case"home":home();break;case"calendar":calendar();break;case"events":eventsList();break;case"event":eventDetail();break;case"eventForm":eventForm();break;case"products":productsList();break;case"product":productDetail();break;case"productForm":productForm();break;case"schedules":scheduleList();break;case"schedule":scheduleDetail();break;case"scheduleForm":scheduleForm();break;case"orderForm":orderForm();break;case"saleItemForm":saleItemForm();break}}
function go(p){state.page=p;state.eventId=null;state.productId=null;state.scheduleId=null;state.orderId=null;state.saleItemIndex=null;render()}
document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>go(b.dataset.page));
document.getElementById("backButton").onclick=goBack;
function goBack(){
  const p=state.page;
  let target=state.returnPage||"home";
  if(p==="eventForm") target=state.eventId?"event":target;
  else if(p==="orderForm") target="event";
  else if(p==="productForm") target=state.productId?"product":target;
  else if(p==="scheduleForm") target=state.scheduleId?"schedule":target;
  else if(p==="saleItemForm") target="product";
  else if(p==="event") target=state.returnPage||"events";
  else if(p==="product") target=state.returnPage||"products";
  else if(p==="schedule") target=state.returnPage||"schedules";
  else if(p==="calendar") target="home";
  state.page=target;
  render();
}
document.getElementById("addButton").onclick=()=>document.getElementById("addModal").classList.remove("hidden");
function closeAdd(){document.getElementById("addModal").classList.add("hidden")}
function newEvent(){closeAdd();state.returnPage=state.page;state.page="eventForm";state.eventId=null;render()}
function newProduct(){closeAdd();state.returnPage=state.page;state.page="productForm";state.productId=null;render()}
function newOrder(){closeAdd();state.returnPage=state.page;state.page="orderForm";state.orderId=null;state.saleItemIndex=null;render()}
function newSchedule(){closeAdd();state.returnPage=state.page;state.page="scheduleForm";state.scheduleId=null;render()}
function openEvent(id){state.returnPage=state.page;state.eventId=id;state.page="event";render()}
function home(){
 const today=new Date(); today.setHours(0,0,0,0);
 const recentEvents=events.map(e=>{
   const dates=(e.performances||[]).map(p=>p.date).filter(Boolean).map(d=>new Date(d+"T00:00:00")).filter(d=>!isNaN(d)&&d>=today);
   return {event:e,nextDate:dates.length?new Date(Math.min(...dates.map(d=>d.getTime()))):null};
 }).filter(x=>x.nextDate).sort((a,b)=>a.nextDate-b.nextDate).slice(0,3).map(x=>x.event);
 title("ホーム");
 document.getElementById("screen").innerHTML=`<div class="hero"><h2>抽選管理</h2><div class="sub">イベントを中心に、公演日と申込・注文をまとめて管理</div></div><div class="grid"><div class="card stat" onclick="go('events')"><strong>${events.length}</strong><span>イベント</span></div><div class="card stat" onclick="go('products')"><strong>${products.length}</strong><span>商品</span></div><div class="card stat"><strong>${events.reduce((n,e)=>n+(e.applications||[]).length,0)}</strong><span class="home-application-label">申込・注文</span></div><div class="card stat" onclick="go('schedules')"><strong>${schedules.length}</strong><span>予定</span></div></div><div class="section"><h2>最近のイベント</h2><span class="count">${recentEvents.length}件</span></div>${recentEvents.length?`<div class="list">${recentEvents.map(eventCard).join("")}</div>`:`<div class="empty">今後の公演予定があるイベントはありません。</div>`}`
}
function applicationStatusSummary(e){
 const apps=e.applications||[];
 if(!apps.length)return `<span class="status status-none">申込なし</span>`;
 if(apps.length===1)return `<span class="status status-${statusClass(apps[0].status)}">${esc(apps[0].status||"未応募")}</span>`;
 const priority={"受付中":100,"応募予定":90,"受付前":80,"当落発表待ち":70,"応募済み":60,"当選":55,"購入済み":55,"落選":50,"発送済み":45,"完了":30,"受付終了":20,"未応募":10};
 const sorted=[...apps].sort((a,b)=>(priority[b.status]??0)-(priority[a.status]??0));
 const main=sorted[0], others=sorted.slice(1);
 const mainName=main.name?`（${esc(main.name)}）`:``;
 const applied=others.filter(a=>["応募済み","当選","購入済み","発送済み","完了"].includes(a.status));
 const appliedText=applied.length?`<span class="status status-applied">✓ ${applied.length}件対応済み</span>`:"";
 return `<span class="status status-${statusClass(main.status)}">${esc(main.status||"未応募")}${mainName}</span><span class="status-count">＋${apps.length-1}件</span>${appliedText}`;
}
function statusClass(status){return ({"受付中":"open","応募予定":"planned","受付前":"before","当落発表待ち":"waiting","応募済み":"applied","当選":"won","購入済み":"won","落選":"lost","発送済み":"done","完了":"done","受付終了":"closed","未応募":"none"}[status]||"none")}
function applicationRows(e){
 const apps=e.applications||[];
 if(!apps.length)return `<div class="application-empty">申込・注文はありません</div>`;
 return `<div class="application-table"><div class="application-row application-head"><span>名称</span><span>期間</span><span>発表日</span><span>ステータス</span></div>${apps.map(a=>`<div class="application-row"><span class="application-name">${esc(a.name||"申込・注文")}</span><span class="application-period">${a.start||a.end?`<span>${dt(a.start)}</span><span>～ ${dt(a.end)}</span>`:"―"}</span><span>${a.announcement?date(a.announcement):"―"}</span><span class="status status-${statusClass(a.status)}">${esc(a.status||"未応募")}</span></div>`).join("")}</div>`;
}
function eventCard(e){return `<div class="item" onclick="openEvent('${e.id}')"><div class="row"><h3>${esc(e.name)}</h3><span class="badge">${esc(e.type)}</span></div><p>公演 ${e.performances?.length||0}件　<span class="event-application-label">申込・注文</span> ${(e.applications||[]).length}件</p><div class="application-summary application-summary-full"><span class="summary-label">申込・注文</span>${applicationRows(e)}</div></div>`}
function eventsList(){
 const f=state.filters.events;
 const filtered=events.filter(e=>(!f.type||e.type===f.type)&&(!f.keyword||[e.name,e.performers].join(" ").toLowerCase().includes(f.keyword.toLowerCase())));
 const today=new Date(); today.setHours(0,0,0,0);
 const nextMonthStart=new Date(today.getFullYear(),today.getMonth()+1,1);
 const getPerformanceDates=e=>(e.performances||[]).map(p=>p.date).filter(Boolean).map(d=>{const x=new Date(d+"T00:00:00");x.setHours(0,0,0,0);return x;});
 const current=[],future=[],past=[];
 filtered.forEach(e=>{
   const dates=getPerformanceDates(e);
   const hasCurrent=dates.some(d=>d>=today&&d<nextMonthStart);
   const hasFuture=dates.some(d=>d>=nextMonthStart);
   if(hasCurrent) current.push(e);
   else if(hasFuture) future.push(e);
   else past.push(e);
 });
 const nearestDate=e=>{const dates=getPerformanceDates(e);return dates.length?Math.min(...dates.map(d=>Math.abs(d-today))):Infinity};
 current.sort((a,b)=>nearestDate(a)-nearestDate(b));
 future.sort((a,b)=>nearestDate(a)-nearestDate(b));
 past.sort((a,b)=>nearestDate(a)-nearestDate(b));
 title("イベント一覧");

 const visibility=state.eventSections||{current:true,future:true,past:false};
 const toggleSection=key=>{
   state.eventSections=state.eventSections||{current:true,future:true,past:false};
   state.eventSections[key]=!state.eventSections[key];
   render();
 };
 const block=(key,label,list,cls)=>{
   if(!list.length)return "";
   const open=visibility[key]!==false;
   return `<div class="event-list-block ${cls}">
     <div class="section event-list-heading">
       <h2>${label}</h2>
       <div class="section-actions">
         <span class="count">${list.length}件</span>
         <button class="section-toggle ${open?"open":""}" onclick="toggleEventSection('${key}')" aria-label="${open?"一覧を閉じる":"一覧を表示"}">${open?"−":"＋"}</button>
       </div>
     </div>
     ${open?`<div class="list">${list.map(eventCard).join("")}</div>`:""}
   </div>`;
 };
 window.toggleEventSection=toggleSection;
 document.getElementById("screen").innerHTML=`<div class="section list-section"><h2>イベント</h2><div class="section-actions"><span class="count">${filtered.length}件</span><button class="filter-button ${f.type||f.keyword?"active":""}" onclick="openFilter('events')">☰ 絞り込み</button></div></div>${block("current","今月の予定",current,"current-events")}${block("future","来月以降の予定",future,"future-events")}${block("past","過去の予定",past,"past-events")}${!filtered.length?`<div class="empty">${events.length?"条件に一致するイベントがありません。":"イベントがありません。"}</div>`:""}`;
}
function eventDetail(){
 const e=events.find(x=>x.id==state.eventId);
 if(!e){go("events");return}
 title("イベント詳細",true);
 const apps=e.applications||[];
 document.getElementById("screen").innerHTML=`
 <div class="hero">
   <div class="row">
     <span class="badge">${esc(e.type)}</span>
     <button class="secondary" style="width:auto;padding:6px 12px;font-size:8px" onclick="editEvent('${e.id}')">編集</button>
   </div>
   <h2>${esc(e.name)}</h2>
   <div class="sub">${esc(e.performers||"出演者未登録")}</div>
 </div>
 <div class="card">${detail("イベント名",e.name)}${detail("イベント種別",e.type)}${detail("出演者",e.performers)}${urlDetail("イベントURL",e.url)}${detail("メモ",e.memo)}</div>
 <div class="section"><h2>公演日</h2><span class="count">${e.performances.length}件</span></div>
 ${e.performances.map((p,i)=>`<div class="card" style="margin-bottom:8px">
   <div class="row"><b style="font-size:9px">公演 ${i+1}</b><span class="badge">${date(p.date)}</span></div>
   ${detail("開場",p.open)}${detail("開演",p.start)}${detail("会場",p.venue)}${detail("メモ",p.memo)}
 </div>`).join("")}
 <div class="section"><h2>申込・注文</h2><span class="count">${apps.length}件</span></div>
 ${apps.length?`<div class="list">${apps.map(a=>`<div class="item">
   <div class="row"><h3>${esc(a.name||"申込・注文")}</h3><span class="badge">${esc(a.method)}</span></div>
   <p>${dt(a.start)} ～ ${dt(a.end)}</p>
   <span class="status">${esc(a.status)}</span>
   <div class="actions">
     <button class="secondary" onclick="editApplication('${e.id}','${a.id}')">編集</button>
     <button class="danger" onclick="deleteApplication('${e.id}','${a.id}')">削除</button>
   </div>
 </div>`).join("")}</div>`:`<div class="empty">このイベントの申込・注文はありません。</div>`}
 <button class="primary" style="margin-top:10px" onclick="addApplication('${e.id}')">＋ このイベントに申込・注文を追加</button>
 <div class="actions"><button class="danger" onclick="deleteEvent('${e.id}')">イベントを削除</button></div>`;
}
function editEvent(id){state.eventId=id;state.page="eventForm";render()}
function eventForm(){const e=events.find(x=>x.id==state.eventId)||{name:"",type:"ライブ",performers:"",url:"",memo:"",performances:[{}]};title(state.eventId?"イベント編集":"イベント登録",true);document.getElementById("screen").innerHTML=`<form class="form" id="eventForm"><div class="group"><label>イベント名 <b class="req">必須</b></label><input class="input" name="name" required value="${esc(e.name)}"></div><div class="group"><label>イベント種別</label><select class="input" name="type">${["ライブ","舞台","イベント","その他"].map(x=>`<option ${x==e.type?"selected":""}>${x}</option>`).join("")}</select></div><div class="group"><label>出演者</label><input class="input" name="performers" value="${esc(e.performers)}"></div><div class="group"><label>イベントURL</label><input class="input" name="url" type="url" value="${esc(e.url)}"></div><div class="group"><label>メモ</label><textarea class="input textarea" name="memo">${esc(e.memo)}</textarea></div><div class="section"><h2>公演日</h2><span class="count">1件以上必須</span></div><div id="performanceList">${e.performances.length?e.performances.map(perf).join(""):perf({})}</div><button type="button" class="secondary" onclick="addPerformance()">＋ 公演日を追加</button><button class="primary" style="margin-top:10px">${state.eventId?"変更を保存":"イベントを登録"}</button></form>`;const form=document.getElementById("eventForm");form.onsubmit=saveEvent;form.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&ev.target.tagName!=="TEXTAREA"){ev.preventDefault();}})}
function perf(p={}){return `<div class="performance"><div class="performance-title"><b>公演日</b><button type="button" class="remove" onclick="this.closest('.performance').remove()">削除</button></div><div class="group"><label>日付 <b class="req">必須</b></label><input class="input" data-p="date" type="date" required value="${esc(p.date||"")}"></div><div class="time-grid"><div class="group"><label>開場時間</label><input class="input" data-p="open" type="time" value="${esc(p.open||"")}"></div><div class="group"><label>開演時間</label><input class="input" data-p="start" type="time" value="${esc(p.start||"")}"></div></div><div class="group"><label>会場</label><input class="input" data-p="venue" value="${esc(p.venue||"")}"></div><div class="group"><label>メモ</label><textarea class="input textarea" data-p="memo">${esc(p.memo||"")}</textarea></div></div>`}
function addPerformance(){document.getElementById("performanceList").insertAdjacentHTML("beforeend",perf({}))}
function saveEvent(ev){ev.preventDefault();const f=new FormData(ev.target),rows=[...document.querySelectorAll(".performance")];if(!rows.length){alert("公演日は1件以上必要です");return}const performances=rows.map(r=>{const p={};r.querySelectorAll("[data-p]").forEach(x=>p[x.dataset.p]=x.value);return p});if(performances.some(x=>!x.date)){alert("公演日の日付は必須です");return}const d={name:String(f.get("name")).trim(),type:f.get("type"),performers:String(f.get("performers")||""),url:String(f.get("url")||""),memo:String(f.get("memo")||""),performances};if(state.eventId){Object.assign(events.find(x=>x.id==state.eventId),d)}else{const e={id:id(),...d,applications:[]};events.unshift(e);state.eventId=e.id}save(KEY.events,events);state.page="event";render()}
function deleteEvent(i){if(!confirm("イベントを削除しますか？"))return;events=events.filter(e=>e.id!=i);save(KEY.events,events);go("events")}
function addApplication(eventId){state.returnPage="event";state.eventId=eventId;state.orderId=null;state.page="orderForm";render()}
function editApplication(eventId,appId){state.returnPage="event";state.eventId=eventId;state.orderId=appId;state.page="orderForm";render()}
function orderForm(){const e=events.find(x=>x.id==state.eventId);if(!e){go("events");return}const a=(e.applications||[]).find(x=>x.id==state.orderId)||{name:"",method:"抽選",start:"",end:"",announcement:"",status:"未応募",quantity:1,payment:"",shipping:"",memo:""};title(state.orderId?"申込・注文編集":"申込・注文登録",true);document.getElementById("screen").innerHTML=`<form class="form" id="orderForm"><div class="card" style="margin-bottom:12px">${detail("対象イベント",e.name)}</div><div class="group"><label>名称 <b class="req">必須</b></label><input class="input" name="name" required placeholder="例：1次応募、2次応募、一般販売" value="${esc(a.name)}"></div><div class="group"><label>販売・申込方式</label><select class="input" name="method">${["抽選","先着","受注生産","通常販売"].map(x=>`<option ${x==a.method?"selected":""}>${x}</option>`).join("")}</select></div><div class="time-grid"><div class="group"><label>受付開始日時</label><input class="input compact-order-date" name="start" type="datetime-local" value="${esc(a.start)}"></div><div class="group"><label>受付終了日時</label><input class="input compact-order-date" name="end" type="datetime-local" value="${esc(a.end)}"></div></div><div class="group announcement-group ${a.method==="抽選"?"":"hidden"}"><label>発表日</label><input class="input compact-order-date" name="announcement" type="date" value="${esc(a.announcement||"")}"></div><div class="group"><label>ステータス</label><select class="input" name="status">${["未応募","応募予定","受付中","応募済み","当選","落選","購入済み","発送済み","完了"].map(x=>`<option ${x==a.status?"selected":""}>${x}</option>`).join("")}</select></div><div class="group"><label>数量</label><input class="input" name="quantity" type="number" min="1" value="${a.quantity||1}"></div><div class="group"><label>支払情報</label><input class="input" name="payment" value="${esc(a.payment)}"></div><div class="group"><label>発送情報</label><input class="input" name="shipping" value="${esc(a.shipping)}"></div><div class="group"><label>メモ</label><textarea class="input textarea" name="memo">${esc(a.memo)}</textarea></div><button class="primary">保存</button></form>`;const form=document.getElementById("orderForm");const method=form.querySelector('[name="method"]');const announcementGroup=form.querySelector(".announcement-group");method.addEventListener("change",()=>announcementGroup.classList.toggle("hidden",method.value!=="抽選"));form.onsubmit=saveApplication}
function saveApplication(ev){ev.preventDefault();const e=events.find(x=>x.id==state.eventId),f=new FormData(ev.target),d={name:String(f.get("name")).trim(),method:f.get("method"),start:f.get("start"),end:f.get("end"),announcement:f.get("method")==="抽選"?f.get("announcement"):"",status:f.get("status"),quantity:Number(f.get("quantity")||1),payment:String(f.get("payment")||""),shipping:String(f.get("shipping")||""),memo:String(f.get("memo")||"")};if(!d.name){alert("名称を入力してください");return}e.applications=e.applications||[];if(state.orderId)Object.assign(e.applications.find(a=>a.id==state.orderId),d);else e.applications.push({id:id(),...d});save(KEY.events,events);state.page="event";render()}
function deleteApplication(eid,aid){if(!confirm("この申込・注文を削除しますか？"))return;const e=events.find(x=>x.id==eid);e.applications=e.applications.filter(a=>a.id!=aid);save(KEY.events,events);render()}

function productsList(){const f=state.filters.products;const list=products.filter(p=>(!f.type||((p.type||"POP UP")===f.type))&&(!f.keyword||[p.name,p.venue].join(" ").toLowerCase().includes(f.keyword.toLowerCase())));title("グッズ・販売");document.getElementById("screen").innerHTML=`<div class="section list-section"><h2>グッズ・販売</h2><div class="section-actions"><span class="count">${list.length}件</span><button class="filter-button ${f.type||f.keyword?"active":""}" onclick="openFilter('products')">☰ 絞り込み</button></div></div>${list.length?`<div class="list">${list.map(p=>`<div class="item" onclick="openProduct('${p.id}')"><div class="row"><h3>${esc(p.name)}</h3><span class="badge">${esc(p.type||"POP UP")}</span></div><p>${p.start?date(p.start):"-"} ～ ${p.end?date(p.end):"-"}</p><p>買いたい商品 ${p.items?.length||0}件</p></div>`).join("")}</div>`:`<div class="empty">${products.length?"条件に一致する販売情報がありません。":"POP UP・受注販売などがありません。"}</div>`}`}
function openProduct(i){state.returnPage="products";state.productId=i;state.page="product";render()}
function productDetail(){
 const p=products.find(x=>x.id==state.productId);
 if(!p){go("products");return}
 title("販売詳細",true);
 document.getElementById("screen").innerHTML=`
 <div class="hero">
   <div class="row"><span class="badge">${esc(p.type||"POP UP")}</span>
   <button class="secondary" style="width:auto;padding:6px 12px;font-size:8px" onclick="editProduct('${p.id}')">編集</button></div>
   <h2>${esc(p.name)}</h2>
   <div class="sub">${p.start?date(p.start):"-"} ～ ${p.end?date(p.end):"-"}</div>
 </div>
 <div class="card">${detail("販売名",p.name)}${detail("販売種別",p.type)}${detail("開始日",p.start?date(p.start):"")}${detail("終了日",p.end?date(p.end):"")}${detail("会場",p.venue)}${urlDetail("URL",p.url)}${detail("メモ",p.memo)}</div>
 <div class="section"><h2>買いたい商品</h2><span class="count">${p.items?.length||0}件</span></div>
 ${p.items?.length?`<div class="list">${p.items.map((it,i)=>`
   <div class="item">
     <div class="row"><h3>${esc(it.name)}</h3><b style="font-size:10px">¥${Number(it.price||0).toLocaleString()}</b></div>
     <p>数量：${it.quantity||1}</p>
     ${it.url?`<p><a class="detail-link" href="${esc(/^\w[\w+.-]*:\/\//.test(it.url)?it.url:`https://${it.url}`)}" target="_blank" rel="noopener noreferrer">${esc(it.url)}</a></p>`:""}
     ${it.memo?`<p>${esc(it.memo)}</p>`:""}
     <div class="actions"><button class="secondary" onclick="editSaleItem('${p.id}',${i})">編集</button><button class="danger" onclick="deleteSaleItem('${p.id}',${i})">削除</button></div>
   </div>`).join("")}</div>`:
   `<div class="empty">買いたい商品がありません。</div>`}
 <button class="primary" style="margin-top:10px" onclick="addSaleItem('${p.id}')">＋ 買いたい商品を追加</button>
 <div class="actions"><button class="danger" onclick="deleteProduct('${p.id}')">販売情報を削除</button></div>`;
}
function editProduct(i){state.productId=i;state.returnPage="product";state.page="productForm";render()}
function productForm(){
 const p=products.find(x=>x.id==state.productId)||{name:"",type:"POP UP",start:"",end:"",venue:"",url:"",memo:"",items:[]};
 title(state.productId?"販売情報編集":"POP UP・販売登録",true);
 document.getElementById("screen").innerHTML=`
 <form class="form" id="productForm">
 <div class="group"><label>販売名 <b class="req">必須</b></label><input class="input" name="name" required placeholder="例：○○ POP UP STORE" value="${esc(p.name)}"></div>
 <div class="group"><label>販売種別</label><select class="input" name="type">${["POP UP","受注販売","通常販売"].map(x=>`<option ${x==p.type?"selected":""}>${x}</option>`).join("")}</select></div>
 <div class="time-grid"><div class="group"><label>開始日</label><input class="input product-form-date" name="start" type="date" value="${esc(p.start)}"></div><div class="group"><label>終了日</label><input class="input product-form-date" name="end" type="date" value="${esc(p.end)}"></div></div>
 <div class="group"><label>会場</label><input class="input" name="venue" placeholder="POP UP会場など" value="${esc(p.venue)}"></div>
 <div class="group"><label>販売URL</label><input class="input" name="url" type="url" value="${esc(p.url)}"></div>
 <div class="group"><label>メモ</label><textarea class="input textarea" name="memo">${esc(p.memo)}</textarea></div>
 <button class="primary">保存</button>
 </form>`;
 document.getElementById("productForm").onsubmit=saveProduct;
}
function saveProduct(ev){
 ev.preventDefault();
 const f=new FormData(ev.target),d={
   name:String(f.get("name")).trim(),type:f.get("type"),start:f.get("start"),end:f.get("end"),
   venue:String(f.get("venue")||""),url:String(f.get("url")||""),memo:String(f.get("memo")||"")
 };
 if(!d.name){alert("販売名を入力してください");return}
 if(state.productId) Object.assign(products.find(p=>p.id==state.productId),d);
 else {const p={id:id(),...d,items:[]};products.unshift(p);state.productId=p.id}
 save(KEY.products,products);state.page="product";render();
}
function addSaleItem(pid){state.productId=pid;state.saleItemIndex=null;state.page="saleItemForm";state.returnPage="product";render()}
function editSaleItem(pid,index){state.productId=pid;state.saleItemIndex=index;state.page="saleItemForm";state.returnPage="product";render()}
function saleItemForm(){
 const p=products.find(x=>x.id==state.productId);
 if(!p){go("products");return}
 const editing=Number.isInteger(state.saleItemIndex) && state.saleItemIndex>=0 && p.items?.[state.saleItemIndex];
 const it=editing?p.items[state.saleItemIndex]:{name:"",price:"",quantity:1,url:"",memo:""};
 title(editing?"買いたい商品を編集":"買いたい商品を追加",true);
 document.getElementById("screen").innerHTML=`
 <form class="form" id="saleItemForm">
   <div class="card" style="margin-bottom:12px">${detail("販売情報",p.name)}</div>
   <div class="group"><label>商品名 <b class="req">必須</b></label><input class="input" name="name" required placeholder="例：Tシャツ ブラック M" value="${esc(it.name||"")}"></div>
   <div class="group"><label>価格</label><input class="input" name="price" type="number" min="0" placeholder="例：5500" value="${it.price??""}"></div>
   <div class="group"><label>数量</label><input class="input" name="quantity" type="number" min="1" value="${it.quantity||1}"></div>
   <div class="group"><label>商品URL</label><input class="input" name="url" type="url" placeholder="https://..." value="${esc(it.url||"")}"></div>
   <div class="group"><label>メモ</label><textarea class="input textarea" name="memo" placeholder="サイズ・カラーなど">${esc(it.memo||"")}</textarea></div>
   <button class="primary">${editing?"変更を保存":"商品を追加"}</button>
 </form>`;
 document.getElementById("saleItemForm").onsubmit=saveSaleItem;
}
function saveSaleItem(ev){
 ev.preventDefault();
 const p=products.find(x=>x.id==state.productId);
 if(!p)return;
 const f=new FormData(ev.target),name=String(f.get("name")||"").trim();
 if(!name){alert("商品名を入力してください");return}
 p.items=p.items||[];
 const item={id:id(),name,price:Number(f.get("price")||0),quantity:Math.max(1,Number(f.get("quantity")||1)),memo:String(f.get("memo")||""),url:String(f.get("url")||"")};
 if(Number.isInteger(state.saleItemIndex) && state.saleItemIndex>=0 && p.items[state.saleItemIndex]){
   item.id=p.items[state.saleItemIndex].id||item.id;
   p.items[state.saleItemIndex]=item;
 }else{p.items.push(item)}
 save(KEY.products,products);state.saleItemIndex=null;state.page="product";render();
}
function deleteSaleItem(pid,index){
 if(!confirm("この商品を削除しますか？"))return;
 const p=products.find(x=>x.id==pid);p.items.splice(index,1);save(KEY.products,products);render();
}
function deleteProduct(i){if(!confirm("この販売情報を削除しますか？"))return;products=products.filter(p=>p.id!=i);save(KEY.products,products);go("products")}
function scheduleList(){
 const f=state.filters.schedules;
 const list=schedules.filter(x=>(!f.type||x.type===f.type)&&(!f.keyword||[x.name,x.related,x.memo].join(" ").toLowerCase().includes(f.keyword.toLowerCase())));
 const today=new Date(); today.setHours(0,0,0,0);
 const nextMonthStart=new Date(today.getFullYear(),today.getMonth()+1,1);
 const getDate=s=>{if(s.date){const d=new Date(s.date+"T00:00:00");d.setHours(0,0,0,0);return d}if(s.start){const d=new Date(String(s.start).replace("T"," "));d.setHours(0,0,0,0);return d}return null};
 const current=[],future=[],past=[];
 list.forEach(s=>{const d=getDate(s);if(!d){past.push(s);return}if(d>=today&&d<nextMonthStart)current.push(s);else if(d>=nextMonthStart)future.push(s);else past.push(s)});
 const sortByDate=(a,b)=>(getDate(a)||new Date(8640000000000000))-(getDate(b)||new Date(8640000000000000));
 current.sort(sortByDate);future.sort(sortByDate);past.sort((a,b)=>sortByDate(b,a));
 title("予定");
 const visibility=state.scheduleSections||{current:true,future:true,past:false};
 const toggleScheduleSection=key=>{state.scheduleSections=state.scheduleSections||{current:true,future:true,past:false};state.scheduleSections[key]=!state.scheduleSections[key];render()};
 window.toggleScheduleSection=toggleScheduleSection;
 const card=s=>{const cls=s.type==="イベント関連"?"schedule-event":s.type==="商品関連"?"schedule-product":s.type==="申込・注文関連"?"schedule-order":"schedule-other";const time=[s.meetingTime?`集合 ${s.meetingTime}`:"",s.startTime?`開始 ${s.startTime}`:""].filter(Boolean).join(" / ");return `<div class="item schedule-item ${cls}" onclick="openSchedule('${s.id}')"><div class="row"><h3>${esc(s.name)}</h3><span class="badge">${esc(s.type)}</span></div><p>${date(s.date||String(s.start||"").slice(0,10))}${time?`　${esc(time)}`:""}</p></div>`};
 const block=(key,label,items)=>{if(!items.length)return "";const open=visibility[key]!==false;return `<div class="event-list-block schedule-list-block ${key}"><div class="section event-list-heading"><h2>${label}</h2><div class="section-actions"><span class="count">${items.length}件</span><button class="section-toggle ${open?"open":""}" onclick="toggleScheduleSection('${key}')" aria-label="${open?"一覧を閉じる":"一覧を表示"}">${open?"−":"＋"}</button></div></div>${open?`<div class="list">${items.map(card).join("")}</div>`:""}</div>`};
 document.getElementById("screen").innerHTML=`<div class="section list-section"><h2>予定</h2><div class="section-actions"><span class="count">${list.length}件</span><button class="filter-button ${f.type||f.keyword?"active":""}" onclick="openFilter('schedules')">☰ 絞り込み</button></div></div>${block("current","今月の予定",current)}${block("future","来月以降の予定",future)}${block("past","過去の予定",past)}${!list.length?`<div class="empty">${schedules.length?"条件に一致する予定がありません。":"予定がありません。"}</div>`:""}`;
}
function openFilter(kind){const f=state.filters[kind];const configs={events:{title:"イベントの絞り込み",label:"イベント種別",options:["ライブ","舞台","イベント","その他"],placeholder:"イベント名・出演者を検索"},products:{title:"販売情報の絞り込み",label:"販売種別",options:["POP UP","受注販売","通常販売"],placeholder:"販売名・会場を検索"},schedules:{title:"予定の絞り込み",label:"予定種別",options:["イベント関連","商品関連","申込・注文関連","その他"],placeholder:"予定名・関連情報を検索"}}[kind];const old=document.getElementById("filterModal");if(old)old.remove();const div=document.createElement("div");div.id="filterModal";div.className="overlay";div.innerHTML=`<div class="sheet filter-sheet"><button class="close" onclick="closeFilter()">×</button><h2>${configs.title}</h2><div class="group"><label>${configs.label}</label><select class="input" id="filterType"><option value="">すべて</option>${configs.options.map(x=>`<option ${f.type===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="group"><label>キーワード</label><input class="input" id="filterKeyword" placeholder="${configs.placeholder}" value="${esc(f.keyword)}"></div><div class="filter-actions"><button class="secondary" onclick="clearFilter('${kind}')">クリア</button><button class="primary" onclick="applyFilter('${kind}')">この条件で絞り込む</button></div></div>`;document.body.appendChild(div)}
function closeFilter(){document.getElementById("filterModal")?.remove()}
function clearFilter(kind){state.filters[kind]={type:"",keyword:""};closeFilter();render()}
function applyFilter(kind){state.filters[kind]={type:document.getElementById("filterType").value,keyword:document.getElementById("filterKeyword").value.trim()};closeFilter();render()}
function openSchedule(i){state.returnPage="schedules";state.scheduleId=i;state.page="schedule";render()} function openScheduleFromCalendar(i){state.returnPage="calendar";state.scheduleId=i;state.page="schedule";render()} window.openScheduleFromCalendar=openScheduleFromCalendar;
function scheduleDetail(){const s=schedules.find(x=>x.id==state.scheduleId);if(!s){go("schedules");return}const d=s.date||String(s.start||"").slice(0,10);const meeting=s.meetingTime||(s.start?String(s.start).split("T")[1]:"");const startTime=s.startTime||(s.start?String(s.start).split("T")[1]:"");title("予定詳細",true);document.getElementById("screen").innerHTML=`<div class="hero"><span class="badge">${esc(s.type)}</span><h2>${esc(s.name)}</h2></div><div class="card">${detail("予定日",date(d))}${detail("集合時間",meeting)}${detail("集合場所",s.meetingPlace||"")}${detail("予定開始時刻",startTime)}${detail("予定種別",s.type)}${detail("関連情報",s.related)}${detail("メモ",s.memo)}</div><div class="actions"><button class="secondary" onclick="editSchedule('${s.id}')">編集</button><button class="danger" onclick="deleteSchedule('${s.id}')">削除</button></div>`}
function editSchedule(i){state.scheduleId=i;state.returnPage="schedule";state.page="scheduleForm";render()}
function scheduleForm(){const old=schedules.find(x=>x.id==state.scheduleId)||{};const s={name:"",date:"",meetingTime:"",startTime:"",type:"イベント関連",related:"",memo:"",...old};if(!s.date&&s.start)s.date=String(s.start).slice(0,10);if(!s.meetingTime&&s.start)s.meetingTime=String(s.start).split("T")[1]||"";if(!s.startTime&&s.start)s.startTime=String(s.start).split("T")[1]||"";title(state.scheduleId?"予定編集":"予定登録",true);document.getElementById("screen").innerHTML=`<form class="form" id="scheduleForm"><div class="group"><label>予定名 <b class="req">必須</b></label><input class="input" name="name" required value="${esc(s.name)}"></div><div class="group"><label>予定日 <b class="req">必須</b></label><input class="input" name="date" type="date" required value="${esc(s.date)}"></div><div class="time-grid"><div class="group"><label>集合時間</label><input class="input" name="meetingTime" type="time" value="${esc(s.meetingTime)}"></div><div class="group"><label>予定開始時刻</label><input class="input" name="startTime" type="time" value="${esc(s.startTime)}"></div></div><div class="group"><label>集合場所</label><input class="input" name="meetingPlace" value="${esc(s.meetingPlace||"")}"></div><div class="group"><label>予定種別</label><select class="input" name="type">${["イベント関連","商品関連","申込・注文関連","その他"].map(x=>`<option ${x==s.type?"selected":""}>${x}</option>`).join("")}</select></div><div class="group"><label>関連情報</label><input class="input" name="related" value="${esc(s.related)}"></div><div class="group"><label>メモ</label><textarea class="input textarea" name="memo">${esc(s.memo)}</textarea></div><button class="primary">保存</button></form>`;document.getElementById("scheduleForm").onsubmit=saveSchedule}
function saveSchedule(ev){ev.preventDefault();const f=new FormData(ev.target),d={name:String(f.get("name")).trim(),date:f.get("date"),meetingTime:f.get("meetingTime"),meetingPlace:String(f.get("meetingPlace")||"").trim(),startTime:f.get("startTime"),type:f.get("type"),related:String(f.get("related")||""),memo:String(f.get("memo")||"")};if(!d.name){alert("予定名を入力してください");return}if(!d.date){alert("予定日を入力してください");return}if(state.scheduleId)Object.assign(schedules.find(s=>s.id==state.scheduleId),d);else{const s={id:id(),...d};schedules.unshift(s);state.scheduleId=s.id}save(KEY.schedules,schedules);state.page="schedule";render()}
function deleteSchedule(i){if(!confirm("予定を削除しますか？"))return;schedules=schedules.filter(s=>s.id!=i);save(KEY.schedules,schedules);go("schedules")}

function openCalendarDetail(item){
 if(!item || !item.entityId) return;
 if(item.kind==="event"){state.returnPage="calendar";state.eventId=item.entityId;state.page="event";render();}
 else if(item.kind==="product"){state.returnPage="calendar";state.productId=item.entityId;state.page="product";render();}
 else if(item.kind==="schedule"){openScheduleFromCalendar(item.entityId);}
}
window.openCalendarDetail=openCalendarDetail;

function calendar(){
 title("カレンダー");
 const y=state.calendarDate.getFullYear(),m=state.calendarDate.getMonth();
 const first=new Date(y,m,1),startDate=new Date(y,m,1-first.getDay()),days=[];
 for(let i=0;i<42;i++){const d=new Date(startDate);d.setDate(startDate.getDate()+i);days.push(d)}
 const key=x=>x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
 const today=key(new Date()),sk=key(state.selectedDate);

 function addCalendarItem(list,item){
   if(item && item.name) list.push(item);
 }
 function getItems(k){
   const items=[];
   events.forEach(e=>(e.performances||[]).forEach(p=>{
     if(p.date===k) addCalendarItem(items,{name:e.name,text:"公演 "+(p.venue||"")+" "+(p.start||""),type:"イベント",cls:"cal-event",entityId:e.id,kind:"event"});
   }));
   events.forEach(e=>(e.applications||[]).forEach(a=>{
     const statusCls=(a.status||"未応募").replace(/[^\wぁ-んァ-ヶ一-龠]/g,"");
     if(a.start&&a.start.slice(0,10)===k)
       addCalendarItem(items,{name:e.name,text:(a.name||"申込・注文")+" 受付開始",type:"申込開始",cls:"cal-application-start",status:a.status,entityId:e.id,kind:"event"});
     if(a.end&&a.end.slice(0,10)===k)
       addCalendarItem(items,{name:e.name,text:(a.name||"申込・注文")+" 受付終了",type:"申込終了",cls:"cal-application-end",status:a.status,entityId:e.id,kind:"event"});
     if(a.method==="抽選"&&a.announcement===k)
       addCalendarItem(items,{name:e.name,text:(a.name||"申込・注文")+" 発表日",type:"発表日",cls:"cal-announcement",status:a.status,entityId:e.id,kind:"event"});
   }));
   products.forEach(p=>{
     const type=p.type||"POP UP";
     const cls=type==="受注販売"?"cal-order":"cal-popup";
     if(p.start===k) addCalendarItem(items,{name:p.name,text:type+" 開始",type:type+"開始",cls,entityId:p.id,kind:"product"});
     if(p.end===k) addCalendarItem(items,{name:p.name,text:type+" 終了",type:type+"終了",cls,entityId:p.id,kind:"product"});
   });
   schedules.forEach(x=>{
     if((x.date||String(x.start||"").slice(0,10))===k) { const times=[x.meetingTime?`集合 ${x.meetingTime}`:"",x.startTime?`開始 ${x.startTime}`:""].filter(Boolean).join(" / "); addCalendarItem(items,{name:x.name,text:times||"予定",type:"予定",cls:"cal-schedule",scheduleId:x.id,entityId:x.id,kind:"schedule"}); }
   });
   return items;
 }
 let cells="";
 days.forEach(d=>{
   const k=key(d),items=getItems(k);
   cells+=`<div class="day ${d.getMonth()!=m?"other":""} ${k===today?"today":""}" onclick="selectCalendar('${k}')"><b>${d.getDate()}</b>`;
   items.slice(0,3).forEach(x=>cells+=`<span class="dot ${x.cls}" title="${esc(x.text)}">● ${esc(x.name)}</span>`);
   if(items.length>3) cells+=`<span class="more-dot">＋${items.length-3}件</span>`;
   cells+='</div>';
 });

 const selectedItems=getItems(sk);
 const details=selectedItems.map(x=>`
   <div class="card event-group ${x.cls}">
     <div class="calendar-detail-head">
       <strong>${esc(x.name)}</strong>
       <span class="calendar-type">${esc(x.type)}</span>
     </div>
     <div>${esc(x.text)}${x.status?`　<span class="calendar-status">${esc(x.status)}</span>`:""}</div>
     ${x.entityId?`<div class="calendar-detail-actions"><button type="button" class="primary calendar-detail-button" onclick="event.stopPropagation(); openCalendarDetail(${JSON.stringify(x).replace(/"/g,'&quot;')})">${x.kind==="event"?"イベント詳細を見る":x.kind==="product"?"販売詳細を見る":"予定詳細を見る"}</button></div>`:""}
   </div>`).join("");

 document.getElementById("screen").innerHTML=`
   <div class="calendar-head">
     <button onclick="changeMonth(-1)">‹</button>
     <span class="calendar-title">${y}年 ${m+1}月</span>
     <button onclick="changeMonth(1)">›</button>
   </div>
   <div class="calendar-legend">
     <span><i class="legend-dot cal-event"></i>公演</span>
     <span><i class="legend-dot cal-application-start"></i>受付開始</span>
     <span><i class="legend-dot cal-application-end"></i>受付終了</span>
    <span><i class="legend-dot cal-announcement"></i>発表日</span>
     <span><i class="legend-dot cal-popup"></i>POP UP</span>
     <span><i class="legend-dot cal-order"></i>受注販売</span>
     <span><i class="legend-dot cal-schedule"></i>予定</span>
   </div>
   <div class="week"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div>
   <div class="cal-grid">${cells}</div>
   <div class="selected-day">
     <div class="section"><h2>${date(sk)}</h2><span class="count">${selectedItems.length}件</span></div>
     ${details||'<div class="empty">この日の予定はありません。</div>'}
   </div>`;
}
function changeMonth(n){state.calendarDate.setMonth(state.calendarDate.getMonth()+n);render()}
function selectCalendar(k){state.selectedDate=new Date(k+"T00:00:00");render()}
render();
