
const APP_KEY="done-v2-current";
const ARCHIVE_KEY="done-v2-archive";
const HISTORY_KEY="done-v2-history";
let products=structuredClone(DEFAULT_PRODUCTS);
let beverages=structuredClone(DEFAULT_BEVERAGES);
let currentQuoteId=null;

const $=id=>document.getElementById(id);
const euro=n=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

function getJson(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function setJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function setSaved(text="Salvato"){ $("saveState").textContent=text; }

function renderProducts(){
  $("productList").innerHTML=products.map((p,i)=>`
    <article class="product-card ${p.qty===0?"zero-qty":""}">
      <div class="product-top">
        <div>
          <div class="product-name">${esc(p.name)}</div>
          <div class="product-meta">${euro(p.price)} cad. · ${p.pieces} pezzi per quantità</div>
        </div>
        <div class="qty-control">
          <button onclick="changeQty(${i},-1)">−</button>
          <input type="number" min="0" inputmode="numeric" value="${p.qty}" oninput="setQty(${i},this.value)">
          <button onclick="changeQty(${i},1)">+</button>
        </div>
      </div>
      <div class="product-stats">
        <div class="stat-chip">Pezzi totali<strong>${p.qty*p.pieces}</strong></div>
        <div class="stat-chip">Spesa totale<strong>${euro(p.qty*p.price)}</strong></div>
      </div>
    </article>`).join("");
}
function renderBeverages(){
  const people=Number($("people").value)||0;
  $("beverageList").innerHTML=beverages.map((b,i)=>`
    <label class="beverage-option ${b.selected?"":"not-selected"}">
      <input type="checkbox" ${b.selected?"checked":""} onchange="toggleBeverage(${i},this.checked)">
      <div><div class="beverage-name">${esc(b.name)}</div><div class="beverage-meta">${euro(b.price)} per persona</div></div>
      <div class="beverage-total">${euro(b.selected?b.price*people:0)}</div>
    </label>`).join("");
}
function renderSettings(){
  $("settingsList").innerHTML=products.map((p,i)=>`
    <article class="settings-card">
      <strong>${esc(p.name)}</strong>
      <div class="settings-grid">
        <label class="mini-field"><span>Nome</span><input value="${esc(p.name)}" oninput="updateProduct(${i},'name',this.value)"></label>
        <label class="mini-field"><span>Prezzo</span><input type="number" step=".1" value="${p.price}" oninput="updateProduct(${i},'price',this.value)"></label>
        <label class="mini-field"><span>Pezzi</span><input type="number" value="${p.pieces}" oninput="updateProduct(${i},'pieces',this.value)"></label>
        <label class="mini-field"><span>Costo</span><input type="number" step=".1" value="${p.cost}" oninput="updateProduct(${i},'cost',this.value)"></label>
      </div>
    </article>`).join("");
  $("beverageSettings").innerHTML=beverages.map((b,i)=>`
    <article class="settings-card">
      <strong>${esc(b.name)}</strong>
      <div class="settings-grid">
        <label class="mini-field"><span>Nome</span><input value="${esc(b.name)}" oninput="updateBeverage(${i},'name',this.value)"></label>
        <label class="mini-field"><span>Prezzo/persona</span><input type="number" step=".1" value="${b.price}" oninput="updateBeverage(${i},'price',this.value)"></label>
      </div>
    </article>`).join("");
}
function calculate(){
  const people=Number($("people").value)||0;
  const perPerson=Number($("perPerson").value)||0;
  const foodBudget=people*perPerson;
  const foodSpent=products.reduce((s,p)=>s+p.price*p.qty,0);
  const pieces=products.reduce((s,p)=>s+p.pieces*p.qty,0);
  const cost=products.reduce((s,p)=>s+p.cost*p.qty,0);
  const beverageBudget=beverages.reduce((s,b)=>s+(b.selected?b.price*people:0),0);
  const total=foodBudget+beverageBudget;
  const residual=foodBudget-foodSpent;

  $("foodBudgetDock").textContent=euro(foodBudget);
  $("bevBudgetDock").textContent=euro(beverageBudget);
  $("foodSpentDock").textContent=euro(foodSpent);
  $("foodResidualDock").textContent=euro(residual);
  $("grandBudgetDock").textContent=euro(total);
  $("residualDock").classList.toggle("negative",residual<0);

  $("foodBudget").textContent=euro(foodBudget);
  $("beverageBudget").textContent=euro(beverageBudget);
  $("grandBudget").textContent=euro(total);
  $("piecesTotal").textContent=pieces;
  $("foodSpent").textContent=euro(foodSpent);
  $("costTotal").textContent=euro(cost);
  $("profitTotal").textContent=euro(foodSpent-cost);
  $("foodResidual").textContent=euro(residual);
  $("notesCard").classList.toggle("hide-in-pdf",!$("publishNotes").checked);

  renderProducts();renderBeverages();saveCurrentState();
}
function changeQty(i,d){products[i].qty=Math.max(0,(Number(products[i].qty)||0)+d);calculate()}
function setQty(i,v){products[i].qty=Math.max(0,Number(v)||0);calculate()}
function toggleBeverage(i,v){beverages[i].selected=v;calculate()}
function updateProduct(i,key,v){products[i][key]=key==="name"?v:Math.max(0,Number(v)||0);renderProducts();saveCurrentState()}
function updateBeverage(i,key,v){beverages[i][key]=key==="name"?v:Math.max(0,Number(v)||0);renderBeverages();saveCurrentState()}

function collectQuote(){
  const people=Number($("people").value)||0, perPerson=Number($("perPerson").value)||0;
  const beverageBudget=beverages.reduce((s,b)=>s+(b.selected?b.price*people:0),0);
  return {
    id:currentQuoteId||uid(),savedAt:new Date().toISOString(),
    proposal:$("proposal").value,client:$("client").value,phone:$("phone").value,date:$("date").value,time:$("time").value,
    placePreference:$("placePreference").value,notes:$("notes").value,publishNotes:$("publishNotes").checked,
    people,perPerson,foodBudget:people*perPerson,beverageBudget,grandBudget:people*perPerson+beverageBudget,
    products:structuredClone(products),beverages:structuredClone(beverages)
  };
}
function applyQuote(q){
  currentQuoteId=q.id||null;
  ["proposal","client","phone","date","time","placePreference","notes"].forEach(k=>$(k).value=q[k]||"");
  $("publishNotes").checked=q.publishNotes!==false;
  $("people").value=q.people||1;$("perPerson").value=q.perPerson||0;
  products=structuredClone(q.products||DEFAULT_PRODUCTS);
  beverages=structuredClone(q.beverages||DEFAULT_BEVERAGES);
  renderSettings();calculate();switchPanel("quotePanel");window.scrollTo({top:0,behavior:"smooth"});
}
function saveCurrentState(){
  setSaved("Salvataggio…");
  setJson(APP_KEY,{quote:collectQuote()});
  setTimeout(()=>setSaved(),140);
}
function loadCurrentState(){
  const data=getJson(APP_KEY,null);
  if(data?.quote)applyQuote(data.quote);
}

function getArchive(){return getJson(ARCHIVE_KEY,[])}
function setArchive(v){setJson(ARCHIVE_KEY,v)}
function getHistory(){return getJson(HISTORY_KEY,[])}
function setHistory(v){setJson(HISTORY_KEY,v.slice(0,150))}
function addHistory(action,q){
  const h=getHistory();h.unshift({id:uid(),action,at:new Date().toISOString(),quote:structuredClone(q)});setHistory(h);renderHistory();
}
function saveQuote(){
  const q=collectQuote();currentQuoteId=q.id;
  const a=getArchive(),i=a.findIndex(x=>x.id===q.id);
  if(i>=0)a[i]=q;else a.unshift(q);
  setArchive(a);addHistory(i>=0?"Modificato":"Creato",q);renderArchive();alert("Preventivo salvato.");
}
function duplicateCurrent(){
  const q=collectQuote();q.id=uid();q.proposal=(q.proposal||"PROPOSTA A")+" - COPIA";currentQuoteId=q.id;
  const a=getArchive();a.unshift(q);setArchive(a);addHistory("Duplicato",q);applyQuote(q);
}
function duplicateById(id){const q=getArchive().find(x=>x.id===id);if(!q)return;currentQuoteId=null;applyQuote({...structuredClone(q),id:uid(),proposal:(q.proposal||"PROPOSTA A")+" - COPIA"})}
function openQuote(id){const q=getArchive().find(x=>x.id===id);if(q)applyQuote(q)}
function deleteQuote(id){
  if(!confirm("Eliminare questo preventivo?"))return;
  const a=getArchive(),q=a.find(x=>x.id===id);setArchive(a.filter(x=>x.id!==id));if(q)addHistory("Eliminato",q);renderArchive();
}
function restoreHistory(id){const item=getHistory().find(x=>x.id===id);if(!item)return;const q={...structuredClone(item.quote),id:uid()};const a=getArchive();a.unshift(q);setArchive(a);addHistory("Ripristinato",q);applyQuote(q)}
function fmtDate(v){if(!v)return"Data non indicata";const p=v.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v}
function renderArchive(){
  const term=($("archiveSearch").value||"").toLowerCase().trim();
  const list=getArchive().filter(q=>[q.client,q.phone,q.proposal,q.date].join(" ").toLowerCase().includes(term));
  $("archiveCount").textContent=list.length;
  $("archiveList").innerHTML=list.length?list.map(q=>`
    <article class="archive-item">
      <div class="archive-head">
        <div><div class="archive-client">${esc(q.client||"Cliente non indicato")}</div>
        <div class="archive-meta">${esc(q.proposal||"")} · ${fmtDate(q.date)} ${q.time?"· "+esc(q.time):""}<br>${q.people||0} persone ${q.phone?"· "+esc(q.phone):""}</div>
        <span class="status-pill">${esc(q.placePreference||"Indifferente")}</span></div>
        <div class="archive-total">${euro(q.grandBudget||0)}</div>
      </div>
      <div class="archive-actions">
        <button class="mini-action open-btn" onclick="openQuote('${q.id}')">Apri</button>
        <button class="mini-action duplicate-btn" onclick="duplicateById('${q.id}')">Duplica</button>
        <button class="mini-action delete-btn" onclick="deleteQuote('${q.id}')">Elimina</button>
      </div>
    </article>`).join(""):`<div class="empty-state">Nessun preventivo trovato.</div>`;
}
function renderHistory(){
  const list=getHistory();
  $("historyList").innerHTML=list.length?list.map(i=>`
    <article class="history-item">
      <strong>${esc(i.action)} · ${esc(i.quote.client||"Cliente non indicato")}</strong>
      <div class="history-meta">${new Date(i.at).toLocaleString("it-IT")}<br>${esc(i.quote.proposal||"")} · ${fmtDate(i.quote.date)} · ${euro(i.quote.grandBudget||0)}</div>
      <div class="history-actions"><button class="mini-action restore-btn" onclick="restoreHistory('${i.id}')">Ripristina come copia</button></div>
    </article>`).join(""):`<div class="empty-state">Nessuna modifica registrata.</div>`;
}
function switchPanel(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.panel===id));
  document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id===id));
  if(id==="archivePanel")renderArchive();if(id==="historyPanel")renderHistory();if(id==="settingsPanel")renderSettings();
}

function cleanFilePart(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"")}
function pdfDate(v){if(!v)return"senza-data";const p=v.split("-");return p.length===3?`${p[2]}-${p[1]}-${p[0].slice(-2)}`:cleanFilePart(v)}
function createPdf(){
  const raw=($("proposal").value||"PROPOSTA A").trim(),m=raw.match(/proposta\s*([a-z0-9]+)/i);
  const proposal=m?`proposta${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}`:cleanFilePart(raw);
  const old=document.title;document.title=`${pdfDate($("date").value)}_${cleanFilePart($("client").value)||"cliente"}_${proposal||"propostaA"}`;
  window.print();setTimeout(()=>document.title=old,1200);
}
function newQuote(){
  if(!confirm("Creare un nuovo preventivo?"))return;
  currentQuoteId=null;products=structuredClone(DEFAULT_PRODUCTS);beverages=structuredClone(DEFAULT_BEVERAGES);
  $("proposal").value="PROPOSTA A";$("client").value="";$("phone").value="";$("date").value="";$("time").value="";
  $("placePreference").value="Indifferente";$("notes").value="";$("publishNotes").checked=true;
  renderSettings();calculate();switchPanel("quotePanel");window.scrollTo({top:0,behavior:"smooth"});
}

["people","perPerson","proposal","client","phone","date","time","placePreference","notes","publishNotes"].forEach(id=>{
  $(id).addEventListener($(id).type==="checkbox"?"change":"input",calculate);
});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>switchPanel(btn.dataset.panel)));
$("archiveSearch").addEventListener("input",renderArchive);
$("resetBtn").addEventListener("click",()=>{if(confirm("Azzerare quantità food e beverage?")){products.forEach(p=>p.qty=0);beverages.forEach(b=>b.selected=false);calculate()}});
$("pdfBtn").addEventListener("click",createPdf);
$("saveQuoteBtn").addEventListener("click",saveQuote);
$("duplicateCurrentBtn").addEventListener("click",duplicateCurrent);
$("newQuoteBtn").addEventListener("click",newQuote);
$("collapseFoodBtn").addEventListener("click",()=>{
  $("productList").classList.toggle("compact");
  $("collapseFoodBtn").textContent=$("productList").classList.contains("compact")?"Espandi":"Comprimi";
});

renderSettings();renderArchive();renderHistory();calculate();
loadCurrentState();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
