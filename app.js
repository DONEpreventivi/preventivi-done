const DEFAULT_PRODUCTS = [
  {name:"Pizza Margherita", pdfName:"Pizza al padellino margherita", price:7, pieces:6, cost:1.20, qty:0},
  {name:"Pizza Special", pdfName:"Pizza al padellino speciale", price:9, pieces:6, cost:2.00, qty:0},
  {name:"Churros salati", pdfName:"Churros salati patate e parmigiano con maionese al wasabi", price:7, pieces:6, cost:1.50, qty:0},
  {name:"Farinata fritta", pdfName:"Farinata fritta con salsa romesco", price:6, pieces:8, cost:1.00, qty:0},
  {name:"Hummus", pdfName:"Hummus di ceci, limone, erba cipollina, verdure fresche", price:7, pieces:1, cost:0, qty:0},
  {name:"Sandwich classico", pdfName:"Club Sandwich classico", price:15, pieces:4, cost:2.50, qty:0},
  {name:"Sandwich vegetariano", pdfName:"Club Sandwich vegetariano", price:13, pieces:4, cost:2.00, qty:0},
  {name:"Tapas da 6€", pdfName:"Tapas da 6€", price:6, pieces:1, cost:0, qty:0},
  {name:"Tapas da 8€", pdfName:"Tapas da 8€", price:8, pieces:1, cost:0, qty:0}
];

const DEFAULT_BEVERAGES = [
  {name:"Vino/birra base", price:5, qty:0},
  {name:"Vino/birra (tutti)", price:6, qty:0},
  {name:"Cocktail classici", price:9, qty:0},
  {name:"Cocktail da carta drink", price:11, qty:0}
];

const DEFAULT_WINE_BOTTLES = [
  {name:"Bottiglia di vino", price:23, qty:0},
  {name:"Bottiglia di vino", price:26, qty:0}
];


const APP_KEY="done-v2-current";
const ARCHIVE_KEY="done-v2-archive";
const HISTORY_KEY="done-v2-history";
let products=structuredClone(DEFAULT_PRODUCTS);
let beverages=structuredClone(DEFAULT_BEVERAGES).map(b=>({...b,qty:Number(b.qty)||0}));
let wineBottles=structuredClone(DEFAULT_WINE_BOTTLES);
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
    <article class="beverage-option ${b.qty>0?"":"not-selected"}">
      <div class="beverage-row">
        <div>
          <div class="beverage-name">${esc(b.name)}</div>
          <div class="beverage-meta">${euro(b.price)} per persona</div>
        </div>
        <div class="qty-control">
          <button onclick="changeBeverageQty(${i},-1)">−</button>
          <input type="number" min="0" inputmode="numeric" value="${b.qty}" oninput="setBeverageQty(${i},this.value)">
          <button onclick="changeBeverageQty(${i},1)">+</button>
        </div>
      </div>
      <div class="beverage-details">
        <div class="beverage-chip">Giri<strong>${b.qty}</strong></div>
        <div class="beverage-chip">Spesa<strong>${euro(b.price*b.qty*people)}</strong></div>
      </div>
    </article>`).join("");
}
function changeBeverageQty(i,d){beverages[i].qty=Math.max(0,(Number(beverages[i].qty)||0)+d);calculate()}
function setBeverageQty(i,v){beverages[i].qty=Math.max(0,Number(v)||0);calculate()}

function renderWineBottles(){
  $("wineBottleList").innerHTML=wineBottles.map((b,i)=>`
    <article class="wine-bottle-card">
      <div>
        <div class="wine-bottle-name">${esc(b.name)} da ${euro(b.price)}</div>
        <div class="wine-bottle-meta">Prezzo per bottiglia</div>
      </div>
      <div class="wine-bottle-right">
        <div class="wine-qty">
          <button onclick="changeWineQty(${i},-1)">−</button>
          <input type="number" min="0" inputmode="numeric" value="${b.qty}" oninput="setWineQty(${i},this.value)">
          <button onclick="changeWineQty(${i},1)">+</button>
        </div>
        <div class="wine-bottle-total">${euro(b.qty*b.price)}</div>
      </div>
    </article>`).join("");
}
function changeWineQty(i,d){wineBottles[i].qty=Math.max(0,(Number(wineBottles[i].qty)||0)+d);calculate()}
function setWineQty(i,v){wineBottles[i].qty=Math.max(0,Number(v)||0);calculate()}

function renderSettings(){
  $("settingsList").innerHTML=products.map((p,i)=>`
    <article class="settings-card">
      <strong>${esc(p.name)}</strong>
      <div class="settings-grid">
        <label class="mini-field"><span>Nome app</span><input value="${esc(p.name)}" oninput="updateProduct(${i},'name',this.value)"></label><label class="mini-field"><span>Nome PDF</span><input value="${esc(p.pdfName || p.name)}" oninput="updateProduct(${i},'pdfName',this.value)"></label>
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
  const beverageBudget=beverages.reduce((s,b)=>s+(b.qty*b.price*people),0)+wineBottles.reduce((s,b)=>s+b.price*b.qty,0);
  const total=foodBudget+beverageBudget;
  const residual=foodBudget-foodSpent;

  $("foodBudgetDock").textContent=euro(foodBudget);
  $("bevBudgetDock").textContent=euro(beverageBudget);
  $("beverageSectionTotal").textContent=euro(beverageBudget);
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

  renderProducts();renderBeverages();renderWineBottles();saveCurrentState();
}
function changeQty(i,d){products[i].qty=Math.max(0,(Number(products[i].qty)||0)+d);calculate()}
function setQty(i,v){products[i].qty=Math.max(0,Number(v)||0);calculate()}
function updateProduct(i,key,v){products[i][key]=(key==="name"||key==="pdfName")?v:Math.max(0,Number(v)||0);renderProducts();saveCurrentState()}
function updateBeverage(i,key,v){beverages[i][key]=key==="name"?v:Math.max(0,Number(v)||0);renderBeverages();saveCurrentState()}

function collectQuote(){
  const people=Number($("people").value)||0, perPerson=Number($("perPerson").value)||0;
  const beverageBudget=beverages.reduce((s,b)=>s+(b.qty*b.price*people),0)+wineBottles.reduce((s,b)=>s+b.price*b.qty,0);
  return {
    id:currentQuoteId||uid(),savedAt:new Date().toISOString(),
    proposal:$("proposal").value,client:$("client").value,phone:$("phone").value,email:$("email").value,date:$("date").value,time:$("time").value,reasons:Array.from(document.querySelectorAll(".reason-checkbox:checked")).map(x=>x.value),otherReason:$("otherReasonText").value,
    placePreference:$("placePreference").value,notes:$("notes").value,publishNotes:$("publishNotes").checked,
    people,perPerson,foodBudget:people*perPerson,beverageBudget,grandBudget:people*perPerson+beverageBudget,
    products:structuredClone(products),beverages:structuredClone(beverages),wineBottles:structuredClone(wineBottles)
  };
}
function applyQuote(q){
  currentQuoteId=q.id||null;
  ["proposal","client","phone","email","date","time","placePreference","notes"].forEach(k=>{if($(k))$(k).value=q[k]||"";});document.querySelectorAll(".reason-checkbox").forEach(cb=>cb.checked=Array.isArray(q.reasons)&&q.reasons.includes(cb.value));$("otherReasonText").value=q.otherReason||"";$("otherReasonWrap").classList.toggle("hidden",!$("reasonOther").checked);
  $("publishNotes").checked=q.publishNotes!==false;
  $("people").value=q.people||1;$("perPerson").value=q.perPerson||0;
  products=structuredClone(q.products||DEFAULT_PRODUCTS);
  beverages=structuredClone(q.beverages||DEFAULT_BEVERAGES).map(b=>({
    ...b,
    qty:Number.isFinite(Number(b.qty))?Number(b.qty):(b.selected?1:0)
  }));
  wineBottles=structuredClone(q.wineBottles||DEFAULT_WINE_BOTTLES);
  renderSettings();renderWineBottles();calculate();switchPanel("quotePanel");window.scrollTo({top:0,behavior:"smooth"});
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
  const q=collectQuote();q.id=uid();q.proposal=nextProposalName(q.proposal);q.savedAt=new Date().toISOString();currentQuoteId=q.id;
  const a=getArchive();a.unshift(q);setArchive(a);addHistory("Duplicato",q);applyQuote(q);
}
function duplicateById(id){
  const source=getArchive().find(x=>x.id===id);if(!source)return;
  const q=structuredClone(source);q.id=uid();q.proposal=nextProposalName(source.proposal);q.savedAt=new Date().toISOString();currentQuoteId=q.id;
  const a=getArchive();a.unshift(q);setArchive(a);addHistory("Duplicato",q);applyQuote(q);
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
  document.body.classList.toggle("panel-secondary",id!=="quotePanel");
  if(id==="archivePanel")renderArchive();
  if(id==="historyPanel")renderHistory();
  if(id==="settingsPanel")renderSettings();
}


function openSettings(){
  $("settingsModal").classList.remove("hidden");
  $("settingsModal").setAttribute("aria-hidden","false");
}
function closeSettings(){
  $("settingsModal").classList.add("hidden");
  $("settingsModal").setAttribute("aria-hidden","true");
}
function downloadJson(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportArchiveBackup(){
  const now=new Date();
  const pad=n=>String(n).padStart(2,"0");
  const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const backup={
    app:"Preventivi D.ONE",
    version:"3.0",
    exportedAt:now.toISOString(),
    archive:getArchive(),
    history:getHistory(),
    current:getJson(APP_KEY,null),
    catalog:{
      products:structuredClone(products),
      beverages:structuredClone(beverages),
      wineBottles:structuredClone(wineBottles)
    }
  };
  downloadJson(`preventivi-done-backup-${stamp}.json`,backup);
  closeSettings();
}
function isValidBackup(data){
  return !!data &&
    typeof data==="object" &&
    Array.isArray(data.archive) &&
    Array.isArray(data.history);
}
async function restoreArchiveBackup(file){
  try{
    const data=JSON.parse(await file.text());
    if(!isValidBackup(data)){
      alert("Il file selezionato non è un backup valido di Preventivi D.ONE.");
      return;
    }
    const ok=confirm(
      `Ripristinare questo backup?\n\nPreventivi: ${data.archive.length}\nVoci storico: ${data.history.length}\n\nI dati attuali verranno sostituiti.`
    );
    if(!ok)return;

    setArchive(data.archive);
    setHistory(data.history);

    if(data.current){
      setJson(APP_KEY,data.current);
    }else{
      localStorage.removeItem(APP_KEY);
    }

    if(data.catalog){
      if(Array.isArray(data.catalog.products))products=structuredClone(data.catalog.products);
      if(Array.isArray(data.catalog.beverages))beverages=structuredClone(data.catalog.beverages);
      if(Array.isArray(data.catalog.wineBottles))wineBottles=structuredClone(data.catalog.wineBottles);
    }

    if(data.current && data.current.quote){
      applyQuote(data.current.quote);
    }else{
      renderSettings();
      renderWineBottles();
      calculate();
    }
    renderArchive();
    renderHistory();
    closeSettings();
    alert("Backup ripristinato correttamente.");
  }catch(error){
    alert("Impossibile ripristinare il backup. Verifica che il file JSON sia corretto.");
  }finally{
    $("importArchiveInput").value="";
  }
}


const TURIN_LAT=45.0703,TURIN_LON=7.6869;
let weatherTimer=null,weatherAbortController=null;
function weatherCodeLabel(code){
  const m={0:"Sereno",1:"Prevalentemente sereno",2:"Parzialmente nuvoloso",3:"Coperto",45:"Nebbia",48:"Nebbia con brina",51:"Pioviggine lieve",53:"Pioviggine",55:"Pioviggine intensa",61:"Pioggia lieve",63:"Pioggia",65:"Pioggia intensa",71:"Neve lieve",73:"Neve",75:"Neve intensa",80:"Rovesci lievi",81:"Rovesci",82:"Rovesci intensi",95:"Temporale",96:"Temporale con grandine",99:"Temporale forte"};
  return m[code]||"Variabile";
}
function weatherAdviceText(code,rain,wind,temp){
  if([95,96,99,65,82].includes(code)||rain>=60)return"Conviene prevedere il tavolo all’interno.";
  if(wind>=30)return"Spazio esterno sconsigliato per vento sostenuto.";
  if(temp<12)return"Spazio esterno possibile, ma con temperatura fresca.";
  if(rain<=25&&wind<22&&temp>=16)return"Spazio esterno probabilmente utilizzabile.";
  return"Condizioni da ricontrollare più vicino alla data.";
}
function setWeatherMessage(message,status=""){
  $("weatherCard").classList.remove("hidden");$("weatherStatus").textContent=status;
  $("weatherError").textContent=message;$("weatherContent").style.display=message?"none":"block";
}
function scheduleWeatherUpdate(){clearTimeout(weatherTimer);weatherTimer=setTimeout(loadWeatherForEvent,450)}
async function loadWeatherForEvent(){
  const date=$("date").value,time=$("time").value;
  if(!date||!time){$("weatherCard").classList.add("hidden");return}
  const eventDate=new Date(`${date}T${time}:00`),now=new Date(),maxDate=new Date(now.getTime()+16*86400000);
  if(eventDate<now){setWeatherMessage("La data selezionata è già trascorsa.","Non disponibile");return}
  if(eventDate>maxDate){setWeatherMessage("La previsione sarà disponibile circa 16 giorni prima dell’evento.","Data troppo distante");return}
  if(weatherAbortController)weatherAbortController.abort();
  weatherAbortController=new AbortController();
  $("weatherCard").classList.remove("hidden");$("weatherContent").style.display="none";$("weatherError").textContent="Caricamento previsione…";$("weatherStatus").textContent="Online";
  const params=new URLSearchParams({latitude:String(TURIN_LAT),longitude:String(TURIN_LON),hourly:"temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m",timezone:"Europe/Rome",forecast_days:"16"});
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal:weatherAbortController.signal});
    if(!r.ok)throw new Error();
    const d=await r.json(),target=`${date}T${time.slice(0,2)}:00`;
    let i=d.hourly.time.indexOf(target);
    if(i<0){const ms=new Date(target).getTime();i=d.hourly.time.reduce((best,t,j)=>Math.abs(new Date(t).getTime()-ms)<best.diff?{i:j,diff:Math.abs(new Date(t).getTime()-ms)}:best,{i:-1,diff:Infinity}).i}
    if(i<0)throw new Error();
    const code=d.hourly.weather_code[i],temp=Math.round(d.hourly.temperature_2m[i]),app=Math.round(d.hourly.apparent_temperature[i]),rain=Math.round(d.hourly.precipitation_probability[i]||0),prec=d.hourly.precipitation[i]||0,wind=Math.round(d.hourly.wind_speed_10m[i]||0);
    $("weatherSubtitle").textContent=`${eventDate.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}, ore ${time}`;
    $("weatherStatus").textContent="Previsione indicativa";$("weatherCondition").textContent=weatherCodeLabel(code);$("weatherTemp").textContent=`${temp} °C`;$("weatherRain").textContent=`${rain}%`;$("weatherWind").textContent=`${wind} km/h`;
    $("weatherAdvice").textContent=`${weatherAdviceText(code,rain,wind,temp)} Percepita ${app} °C${prec>0?`, precipitazioni ${String(prec).replace(".",",")} mm`:""}.`;
    $("weatherError").textContent="";$("weatherContent").style.display="block";
  }catch(e){if(e.name!=="AbortError")setWeatherMessage("Impossibile caricare il meteo. Controlla la connessione.","Errore")}
}
function nextProposalName(current){
  const m=String(current||"").trim().match(/proposta\s*([a-z])/i),letter=m?m[1].toUpperCase():"A";
  return `PROPOSTA ${String.fromCharCode(Math.min(letter.charCodeAt(0)+1,90))}`;
}

function cleanFilePart(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"")}
function pdfDate(v){if(!v)return"senza-data";const p=v.split("-");return p.length===3?`${p[2]}-${p[1]}-${p[0].slice(-2)}`:cleanFilePart(v)}

function populatePrintSheet(){
  const people=Number($("people").value)||0;
  const perPerson=Number($("perPerson").value)||0;
  const foodTotal=people*perPerson;
  const beverageTotal=beverages.reduce((s,b)=>s+(b.qty*b.price*people),0)+wineBottles.reduce((s,b)=>s+b.price*b.qty,0);

  const sourceLogo=document.querySelector(".brand-logo");
  if(sourceLogo)$("printLogo").src=sourceLogo.src;
  $("printProposal").textContent=$("proposal").value||"PROPOSTA";

  const meta=[
    ["Cliente",$("client").value||"—"],
    ["Data",$("date").value?new Date($("date").value+"T12:00:00").toLocaleDateString("it-IT"):"—"],
    ["Ora",$("time").value||"—"],
    ["Persone",people],
    ["Telefono",$("phone").value||"—"],["Email",$("email").value||"—"],
    ["Preferenza",$("placePreference").value||"—"],["Motivo",(()=>{const vals=Array.from(document.querySelectorAll(".reason-checkbox:checked")).map(x=>x.value==="Altro"?($("otherReasonText").value||"Altro"):x.value);return vals.join(", ")||"—";})()],
    ["Budget food/persona",euro(perPerson)],
    ["Totale evento",euro(foodTotal+beverageTotal)]
  ];
  $("printMeta").innerHTML=meta.map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join("");

  $("printFoodRows").innerHTML=products.filter(p=>p.qty>0).map(p=>`
    <tr>
      <td>${p.qty}</td>
      <td>${esc(p.pdfName || p.name)}<br><small>${euro(p.price)} cad.</small></td>
      <td>${p.qty*p.pieces}</td>
      <td class="right">${euro(p.qty*p.price)}</td>
    </tr>`).join("");

  const beverageRows=[];
  beverages.filter(b=>b.qty>0).forEach(b=>{
    beverageRows.push(`<tr><td>${b.qty}</td><td>${esc(b.name)}<br><small>${euro(b.price)} per persona</small></td><td>${people} persone</td><td class="right">${euro(b.price*b.qty*people)}</td></tr>`);
  });
  wineBottles.filter(b=>b.qty>0).forEach(b=>{
    beverageRows.push(`<tr><td>${b.qty}</td><td>${esc(b.name)} da ${euro(b.price)}</td><td>bottiglie</td><td class="right">${euro(b.price*b.qty)}</td></tr>`);
  });
  $("printBeverageRows").innerHTML=beverageRows.join("");
  $("printBeverageBlock").style.display=beverageRows.length?"block":"none";

  // 3. Show note text only, without any "Note" label.
  const noteText=$("notes").value.trim();
  $("printNotes").textContent=noteText;
  $("printNotes").style.display=$("publishNotes").checked&&noteText?"block":"none";

  $("printFoodTotal").textContent=euro(foodTotal);
  $("printBeverageTotal").textContent=euro(beverageTotal);
  $("printGrandTotal").textContent=euro(foodTotal+beverageTotal);
}

function createPdf(){
  populatePrintSheet();
  window.scrollTo(0,0);
  const raw=($("proposal").value||"PROPOSTA A").trim(),m=raw.match(/proposta\s*([a-z0-9]+)/i);
  const proposal=m?`proposta${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}`:cleanFilePart(raw);
  const old=document.title;document.title=`${pdfDate($("date").value)}_${cleanFilePart($("client").value)||"cliente"}_${proposal||"propostaA"}`;
  window.print();setTimeout(()=>document.title=old,1200);
}
function newQuote(){
  if(!confirm("Creare un nuovo preventivo?"))return;
  currentQuoteId=null;products=structuredClone(DEFAULT_PRODUCTS);beverages=structuredClone(DEFAULT_BEVERAGES);wineBottles=structuredClone(DEFAULT_WINE_BOTTLES);
  $("proposal").value="PROPOSTA A";$("client").value="";$("phone").value="";$("email").value="";$("date").value="";$("time").value="";
  $("placePreference").value="Indifferente";$("notes").value="";$("publishNotes").checked=true;document.querySelectorAll(".reason-checkbox").forEach(cb=>cb.checked=false);$("otherReasonText").value="";$("otherReasonWrap").classList.add("hidden");
  renderSettings();renderWineBottles();calculate();switchPanel("quotePanel");window.scrollTo({top:0,behavior:"smooth"});
}

["people","perPerson","proposal","client","phone","email","date","time","placePreference","notes","publishNotes"].forEach(id=>{
  $(id).addEventListener($(id).type==="checkbox"?"change":"input",calculate);
});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>switchPanel(btn.dataset.panel)));
document.querySelectorAll(".reason-checkbox").forEach(cb=>cb.addEventListener("change",()=>{
  $("otherReasonWrap").classList.toggle("hidden",!$("reasonOther").checked);
  calculate();
}));
$("date").addEventListener("change",scheduleWeatherUpdate);
$("time").addEventListener("change",scheduleWeatherUpdate);
$("date").addEventListener("input",scheduleWeatherUpdate);
$("time").addEventListener("input",scheduleWeatherUpdate);
$("archiveSearch").addEventListener("input",renderArchive);
$("resetBtn").addEventListener("click",()=>{
  if(confirm("Azzerare tutte le quantità, il numero di persone e il budget?")){
    products.forEach(p=>p.qty=0);
    beverages.forEach(b=>b.qty=0);
    wineBottles.forEach(b=>b.qty=0);
    $("people").value=0;
    $("perPerson").value=0;
    calculate();
  }
});
$("pdfBtn").addEventListener("click",createPdf);
$("saveQuoteBtn").addEventListener("click",saveQuote);
$("duplicateCurrentBtn").addEventListener("click",duplicateCurrent);
$("newQuoteBtn").addEventListener("click",newQuote);
$("collapseBeverageBtn").addEventListener("click",()=>{
  $("beverageList").classList.toggle("compact");
  $("collapseBeverageBtn").textContent=$("beverageList").classList.contains("compact")?"Espandi":"Comprimi";
});
$("collapseFoodBtn").addEventListener("click",()=>{
  $("productList").classList.toggle("compact");
  $("collapseFoodBtn").textContent=$("productList").classList.contains("compact")?"Espandi":"Comprimi";
});


$("settingsBtn").addEventListener("click",openSettings);
$("closeSettingsBtn").addEventListener("click",closeSettings);
$("settingsBackdrop").addEventListener("click",closeSettings);
$("exportArchiveBtn").addEventListener("click",exportArchiveBackup);
$("importArchiveBtn").addEventListener("click",()=>$("importArchiveInput").click());
$("importArchiveInput").addEventListener("change",event=>{
  const file=event.target.files && event.target.files[0];
  if(file)restoreArchiveBackup(file);
});

document.body.classList.remove("panel-secondary");
renderSettings();renderArchive();renderHistory();renderWineBottles();calculate();

loadCurrentState();
scheduleWeatherUpdate();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}