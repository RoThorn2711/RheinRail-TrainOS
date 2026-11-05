import * as mfd from './profiles/br101.js';
import * as mfa from './profiles/br101-mfa.js';
import {DemoSource,LiveSource} from './sources.js';
const $=s=>document.querySelector(s),svg=$('#mfd');
const profiles={mfd,mfa};let display=new URLSearchParams(location.search).get('display');
if(!display){try{display=localStorage.getItem('tsw-mfd-display');}catch{}}if(!profiles[display])display='mfd';
function draw(data){profiles[display].render(svg,data);}
function setDisplay(value){display=profiles[value]?value:'mfd';svg.setAttribute('viewBox',display==='mfa'?'0 0 1240 720':'0 0 1240 800');svg.setAttribute('aria-label',display==='mfa'?'Analoge MFA der BR 101 Expert mit Kraftmesser, Tachometer und Leuchtmeldern':'Digitales MFD der BR 101 Expert');svg.innerHTML=profiles[display].layout();document.body.dataset.display=display;$('#instrument').value=display;document.querySelector('.brand span').textContent='EXPERT / '+display.toUpperCase();$('#displayLabel').textContent='BR 101 EXPERT • '+(display==='mfa'?'MFA ANALOG':'MFD DIGITAL');document.title='BR 101 · '+display.toUpperCase();$('#demoForce').min=display==='mfa'?-150:-140;$('#demoForce').max=display==='mfa'?80:70;$('#screen').style.filter=`brightness(${$('#brightness').value}%)`;}
setDisplay(display);
$('#instrument').onchange=e=>{if(e.target.value==='navi'){location.href='/?display=navi';return;}setDisplay(e.target.value);try{localStorage.setItem('tsw-mfd-display',display);}catch{}const url=new URL(location.href);url.searchParams.set('display',display);history.replaceState(null,'',url);if(latest)draw(latest);};
const demo=new DemoSource(),live=new LiveSource();let mode='live';try{mode=localStorage.getItem('tsw-mfd-mode')||'live';}catch{}if(!['demo','live'].includes(mode))mode='live';let source=mode==='demo'?demo:live,latest,generation=0;$('#mode').value=mode;$('#demoSettings').hidden=mode!=='demo';
const names={speed:'Geschwindigkeit',clock:'Spielzeit',sifa:'Sifa-Leuchte',zsOff:'Zugsammelschiene aus',highBrake:'Hohe Abbremsung',force:'Zugkraft pro FM (+) / Bremskraft gesamt (−)'};
function present(data){latest=data;draw(data);$('#connection').textContent=data.status;$('#connection').className=data.status==='LIVE'?'live':data.demo?'':'error';$('#sourceLabel').textContent=data.demo?'SIMULIERTE DATEN':data.status==='LIVE'?'TSW 7 · NUR LESEN':data.status;$('#liveMessage').textContent=data.message;$('#fields').replaceChildren();for(const [key,name] of Object.entries(names)){const row=document.createElement('div');row.className='field';const label=document.createElement('span'),val=document.createElement('span');label.textContent=name;const v=data[key];val.textContent=v===null||v===undefined?'Nicht verfügbar':typeof v==='boolean'?(v?'Aktiv':'Inaktiv'):String(typeof v==='number'?Math.round(v*10)/10:v)+(key==='speed'?' km/h':key==='force'?' kN':'');row.append(label,val);$('#fields').append(row);}}
async function tick(){const g=generation;try{const data=await source.read();if(g===generation)present(data);}catch{if(g===generation)present({demo:false,status:'OFFLINE',message:'Lokaler Adapter nicht erreichbar. Live-Werte ausgeblendet.'});}setTimeout(tick,mode==='demo'?150:500);}
$('#mode').addEventListener('change',e=>{mode=e.target.value;try{localStorage.setItem('tsw-mfd-mode',mode);}catch{}source=mode==='demo'?demo:live;generation++;$('#demoSettings').hidden=mode!=='demo';present(mode==='demo'?{demo:true,status:'DEMO',message:'Demo-Modus'}:{demo:false,status:'VERBINDUNG…',message:'TSW-Verbindung wird geprüft.'});});
for(const id of ['settings','details'])$('#'+id).onclick=()=>$('#panel').showModal();
$('#panel').addEventListener('click',e=>{if(e.target===$('#panel')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#brightness').oninput=e=>$('#screen').style.filter=`brightness(${e.target.value}%)`;
$('#demoSpeed').oninput=e=>{demo.speed=Number(e.target.value);$('#speedOutput').textContent=demo.speed+' km/h';};
$('#demoForce').oninput=e=>{demo.force=Number(e.target.value);$('#forceOutput').textContent=demo.force+' kN';};
$('#demoSifa').onchange=e=>demo.sifa=e.target.checked;
let wakeLock;
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.body.requestFullscreen();try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}}}catch{$('#liveMessage').textContent='Vollbild wird in diesem Browser nicht unterstützt.';$('#panel').showModal();}};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)wakeLock?.release();});
// Animate paired PZB flash lamps independently of network round-trip timing.
setInterval(()=>{if(latest)draw(latest);},100);
tick();
