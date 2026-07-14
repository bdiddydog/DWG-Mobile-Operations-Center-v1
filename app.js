let vapidPublicKey='';
const $=id=>document.getElementById(id);
const checklistTasks=['Read NWS Mount Holly AFD','Check ensemble trends','Review HRRR and CAM guidance','Review Euro and GFS','Check surface map and fronts','Review SPC outlook','Review radar, satellite and lightning','Write Brandon’s Take','Publish Facebook forecast','Update portal and newsletter'];

window.addEventListener('load',async()=>{
  setupNavigation();
  setupChecklist();
  setupAlertCenter();
  setupSettings();
  if('serviceWorker'in navigator)await navigator.serviceWorker.register('/sw.js');
  await loadConfig();
  await loadWeather();
  updatePushStatus();
});

$('refresh').onclick=loadWeather;
$('enablePush').onclick=enablePush;
$('testPush').onclick=testPush;

function setupNavigation(){
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active-page'));
    btn.classList.add('active');
    $(btn.dataset.page).classList.add('active-page');
    window.scrollTo({top:0,behavior:'smooth'});
  }));
}

function setupChecklist(){
  const saved=JSON.parse(localStorage.getItem('dwgChecklist')||'{}');
  $('checklistItems').innerHTML=checklistTasks.map((task,i)=>`<label class="check-item"><input type="checkbox" data-index="${i}" ${saved[i]?'checked':''}><span>${esc(task)}</span></label>`).join('');
  $('checklistItems').addEventListener('change',e=>{
    if(!e.target.matches('input[type="checkbox"]'))return;
    const state={};document.querySelectorAll('#checklistItems input').forEach(x=>state[x.dataset.index]=x.checked);
    localStorage.setItem('dwgChecklist',JSON.stringify(state));
  });
  $('resetChecklist').onclick=()=>{localStorage.removeItem('dwgChecklist');document.querySelectorAll('#checklistItems input').forEach(x=>x.checked=false)};
}

function setupAlertCenter(){
  document.querySelectorAll('.alert-template').forEach(btn=>btn.onclick=()=>{
    const type=btn.dataset.type;
    $('alertEditor').value=`${type} ⚠️\n\nA ${type.toLowerCase()} is in effect for [affected Delaware areas] until [time].\n\nMain concerns: [hazards and impacts]. Move to a safe location and follow official instructions.\n\nThis is an official alert update. Stay weather-aware and check back for changes.\n\n— Delaware Weather Guy | Data Over Drama`;
  });
  $('copyAlert').onclick=async()=>{const text=$('alertEditor').value;if(!text)return alert('Create an alert message first.');await navigator.clipboard.writeText(text);alert('Alert text copied.')};
  $('clearAlert').onclick=()=>$('alertEditor').value='';
}

function setupSettings(){
  $('settingsEnablePush').onclick=enablePush;
  $('settingsRefresh').onclick=loadWeather;
}

async function loadConfig(){
  try{const r=await fetch('/api/config',{cache:'no-store'}),d=await r.json();vapidPublicKey=d.vapidPublicKey||'';if((d.missing||[]).length){$('setup').classList.remove('hidden');$('setup').textContent='Setup required in Netlify: '+d.missing.join(', ')}}
  catch(e){$('setup').classList.remove('hidden');$('setup').textContent='Netlify backend is not available yet.'}
}

async function loadWeather(){
  $('loadState').textContent='Updating…';
  try{
    const r=await fetch('/api/weather',{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.error||'Weather request failed');
    $('forecast').innerHTML=d.locations.map(x=>`<article class="card"><div class="zone">${esc(x.zone)}</div><h3>${esc(x.name)}</h3><div class="current"><div class="temp">${num(x.temperatureF)}°</div><div class="condition">${esc(x.condition)}</div></div><div class="metrics"><div class="metric"><span>Feels like</span><strong>${num(x.feelsLikeF)}°F</strong></div><div class="metric"><span>Rain chance</span><strong>${num(x.precipChance)}%</strong></div><div class="metric"><span>Wind</span><strong>${esc(x.wind)}</strong></div><div class="metric"><span>Gust</span><strong>${num(x.windGustMph)} mph</strong></div></div></article>`).join('');
    $('alerts').innerHTML=d.alerts.length?d.alerts.map(a=>`<article class="alert"><strong>${esc(a.event)}</strong><p>${esc(a.areaDesc)}</p></article>`).join(''):'<p class="muted">No active Delaware NWS alerts.</p>';
    $('alertCount').textContent=d.alerts.length;$('updated').textContent=new Date(d.generatedAt).toLocaleString();$('loadState').textContent='Current';
  }catch(e){$('forecast').innerHTML=`<article class="card">${esc(e.message)}</article>`;$('loadState').textContent='Error'}
}

async function enablePush(){
  try{
    if(!vapidPublicKey)return alert('Add VAPID_PUBLIC_KEY in Netlify first.');
    if(!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window))return alert('This browser does not support web push notifications.');
    const p=await Notification.requestPermission();if(p!=='granted')return updatePushStatus();
    const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(vapidPublicKey)});
    const r=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub)});if(!r.ok)throw Error('Could not save phone subscription');
    updatePushStatus();alert('DWG phone alerts are enabled.');
  }catch(e){alert(e.message||'Could not enable notifications.')}
}

async function testPush(){
  const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(!sub)return alert('Enable phone alerts first.');
  const r=await fetch('/api/test-push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub)});if(!r.ok)alert('Test notification failed.');
}

function updatePushStatus(){
  const status=('Notification'in window&&Notification.permission==='granted')?'Enabled':'Not enabled';
  $('pushStatus').textContent=status;
  if($('settingsPushStatus'))$('settingsPushStatus').textContent=status;
}
function b64(s){const p='='.repeat((4-s.length%4)%4),v=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...v].map(c=>c.charCodeAt(0)))}
function num(v){return Number.isFinite(Number(v))?Math.round(Number(v)):'—'}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}