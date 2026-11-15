import {liveDisplays} from './vehicle-profiles.js';
import * as mfd from './profiles/br101.js';
import * as mfa from './profiles/br101-mfa.js';
import * as br145 from './profiles/br145-mfa.js';
import {DemoSource,LiveSource} from './sources.js';
const $=s=>document.querySelector(s),svg=$('#mfd');
const profiles={mfd,mfa,br145};let display=new URLSearchParams(location.search).get('display');
if(!display){try{display=localStorage.getItem('tsw-mfd-display');}catch{}}if(!profiles[display])display='mfd';
function draw(data){profiles[display].render(svg,data);}
function setDisplay(value){
 display=profiles[value]?value:'mfd';const is145=display==='br145',analog=display!=='mfd';
 svg.setAttribute('viewBox',analog?'0 0 1240 720':'0 0 1240 800');
 svg.setAttribute('aria-label',is145?'Analoges MFA der BR 145 Expert':analog?'Analoge MFA der BR 101 Expert':'Digitales MFD der BR 101 Expert');
 svg.innerHTML=profiles[display].layout();document.body.dataset.display=display;$('#instrument').value=display;
 document.querySelector('.brand').firstChild.textContent=is145?'145 ':'101 ';
 document.querySelector('.brand span').textContent='EXPERT / '+(analog?'MFA': 'MFD');
 $('#displayLabel').textContent=(is145?'BR 145':'BR 101')+' EXPERT • '+(analog?'MFA ANALOG':'MFD DIGITAL');document.title=(is145?'145 Expert':'BR 101')+' · '+(analog?'MFA':'MFD');
 $('#demoSpeed').max=is145?160:260;$('#demoForce').min=analog?-150:-140;$('#demoForce').max=is145?85:analog?80:70;
 $('#demo145Settings').hidden=!is145;$('#br145LiveInfo').hidden=!is145;$('#mode').disabled=false;
 $('#screen').style.filter=`brightness(${$('#brightness').value}%)`;
}

setDisplay(display);
$('#instrument').onchange=e=>{if(e.target.value==='navi'){location.href='/?display=navi';return;}setDisplay(e.target.value);syncDemoLimits();generation++;live.profile=display;latest=null;present({demo:mode==='demo',status:mode==='demo'?'DEMO':'VERBINDUNG…',message:'Datenquelle wird geladen.'});try{localStorage.setItem('tsw-mfd-display',display);}catch{}const url=new URL(location.href);url.searchParams.set('display',display);history.replaceState(null,'',url);if(latest)draw(latest);};
const demo=new DemoSource(),live=new LiveSource(display);let mode='live';try{mode=localStorage.getItem('tsw-mfd-mode')||'live';}catch{}if(!['demo','live'].includes(mode))mode='live';let source=mode==='demo'?demo:live,latest,generation=0;$('#mode').value=mode;$('#demoSettings').hidden=mode!=='demo';
const names={speed:'Geschwindigkeit',clock:'Spielzeit',sifa:'Sifa-Leuchte',zsOff:'Zugsammelschiene aus',highBrake:'Hohe Abbremsung',force:'Zugkraft pro FM (+) / Bremskraft gesamt (−)',lzbActive:'LZB aktiv',lzbShowDistance:'LZB-Entfernungsanzeige',lzbDistance:'LZB-Zielentfernung',lzbTargetSpeed:'LZB-Zielgeschwindigkeit',lzbPermittedSpeed:'LZB-zulässige Geschwindigkeit'};
function present(data){latest=data;draw(data);$('#connection').textContent=data.status;$('#connection').className=data.status.startsWith('LIVE')?'live':data.demo?'':'error';$('#sourceLabel').textContent=data.demo?'SIMULIERTE DATEN':data.status.startsWith('LIVE')?'TSW 7 · NUR LESEN':data.status;$('#liveMessage').textContent=data.message;$('#fields').replaceChildren();for(const [key,name] of Object.entries(names)){const row=document.createElement('div');row.className='field';const label=document.createElement('span'),val=document.createElement('span');label.textContent=name;const v=data[key];val.textContent=v===null||v===undefined?'Nicht verfügbar':typeof v==='boolean'?(v?'Aktiv':'Inaktiv'):String(typeof v==='number'?Math.round(v*10)/10:v)+(['speed','lzbTargetSpeed','lzbPermittedSpeed'].includes(key)?' km/h':key==='force'?' kN':key==='lzbDistance'?' m':'');row.append(label,val);$('#fields').append(row);}}
async function tick(){const g=generation;try{const data=await source.read();if(g===generation){if(!updateVehicleAvailability(data.raw))present(data);}}catch{if(g===generation){updateVehicleAvailability();present({demo:false,status:'OFFLINE',message:'Lokaler Adapter nicht erreichbar. Live-Werte ausgeblendet.'});}}setTimeout(tick,mode==='demo'?150:500);}
function changeMode(value){mode=value;$('#mode').value=mode;try{localStorage.setItem('tsw-mfd-mode',mode);}catch{}source=mode==='demo'?demo:live;generation++;$('#demoSettings').hidden=mode!=='demo';updateVehicleAvailability();present(mode==='demo'?{demo:true,status:'DEMO',message:'Demo-Modus · alle Werte sind simuliert.'}:{demo:false,status:'VERBINDUNG…',message:'TSW-Verbindung wird geprüft.'});}
$('#mode').addEventListener('change',e=>changeMode(e.target.value));
function updateVehicleAvailability(raw){
 const current=mode==='live'&&raw?.connected===true&&Date.now()-raw.updatedAt<=5000;
 const allowed=current?liveDisplays(raw.vehicle):[];
 for(const option of $('#instrument').options)option.disabled=mode==='live'&&option.value!=='navi'&&!allowed.includes(option.value);
 if(current&&allowed.length&&!allowed.includes(display)){
  setDisplay(allowed[0]);syncDemoLimits();live.profile=display;generation++;
  try{localStorage.setItem('tsw-mfd-display',display);}catch{}
  const url=new URL(location.href);url.searchParams.set('display',display);history.replaceState(null,'',url);
  present({demo:false,status:'VERBINDUNG…',message:'Passende Anzeige für das aktuelle Fahrzeug wird geladen.'});
  return true;
 }
 return false;
}
updateVehicleAvailability();
function syncDemoLimits(){for(const [id,key,out,unit] of [['demoSpeed','speed','speedOutput',' km/h'],['demoForce','force','forceOutput',' kN']]){const input=$('#'+id);demo[key]=Math.max(Number(input.min),Math.min(Number(input.max),demo[key]));input.value=demo[key];$('#'+out).textContent=demo[key]+unit;}}
syncDemoLimits();
$('#download145Diagnostics').onclick=()=>{
 const diagnostics=latest?.raw?.diagnostics;
 const payload=diagnostics?{...diagnostics,status:latest.status}:{profile:'br145',status:latest?.status||'KEINE DATEN',message:latest?.message||'Bitte zuerst TSW Live auswählen.'};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='rheinrail-145-diagnose.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('#demoLzb').onchange=e=>demo.lzbActive=e.target.checked;
for(const [id,key,out,unit] of [['demoDistance','lzbDistance','distanceOutput',' m'],['demoTarget','lzbTargetSpeed','targetOutput',' km/h']])$('#'+id).oninput=e=>{demo[key]=Number(e.target.value);$('#'+out).textContent=demo[key]+unit;};

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
