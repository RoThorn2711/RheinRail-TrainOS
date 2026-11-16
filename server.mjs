import {restrictLiveState} from './dist/vehicle-profiles.js';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
import {collect,collect145,collectIce1,collectIce3,collectIceT} from './telemetry.mjs';
import {discoverIce1,discoverIce3,discoverIceT} from './ice1-discovery.mjs';
import {collectNavigation,loadStations} from './navigation.mjs';
const root=new URL('./dist/',import.meta.url),port=Number(process.env.PORT||8787),host=process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
let state={connected:false,fields:{},message:'Noch keine Live-Abfrage'},pending,lastRequest=0;
const state145={data:{connected:false,fields:{},message:'Noch keine Live-Abfrage'},pending:null,lastRequest:0};
const stateIce1={data:{connected:false,fields:{},message:'Noch keine Live-Abfrage'},pending:null,lastRequest:0};
const stateIce3={data:{connected:false,fields:{},message:'Noch keine Live-Abfrage'},pending:null,lastRequest:0};
const stateIceT={data:{connected:false,fields:{},message:'Noch keine Live-Abfrage'},pending:null,lastRequest:0};
let naviState={connected:false,events:[],updatedAt:0},naviPending,naviRequest=0;
let ice1DiscoveryPending;
let ice3DiscoveryPending;
let icetDiscoveryPending;
function refreshNavigation(){if(!naviPending)naviPending=collectNavigation().then(s=>naviState=s).catch(()=>naviState={connected:false,events:[],position:null,updatedAt:Date.now()}).finally(()=>naviPending=null);return naviPending;}
function refresh(){if(!pending){pending=collect().then(s=>state=s).catch(()=>state={connected:false,supported:false,fields:{},updatedAt:Date.now(),message:'TSW nicht erreichbar. Spiel, HTTP API und Schlüsseldatei prüfen.'}).finally(()=>pending=null);}return pending;}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; frame-ancestors 'self'");
 if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});return res.end('Nur lesender Zugriff');}
 const authority=req.headers.host||'';const hostName=authority.split(':')[0];const allowed=new Set(['localhost','127.0.0.1',...Object.values(networkInterfaces()).flat().filter(Boolean).map(n=>n.address)]);
 if(!allowed.has(hostName)){res.writeHead(403);return res.end('Host nicht erlaubt');}
 if(req.headers.origin&&req.headers.origin!==`http://${authority}`){res.writeHead(403);return res.end('Origin nicht erlaubt');}
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(path==='/api/icet/diagnostics'){
  res.setHeader('Content-Type','application/json');
  try{if(!icetDiscoveryPending)icetDiscoveryPending=discoverIceT().finally(()=>icetDiscoveryPending=null);return res.end(JSON.stringify(await icetDiscoveryPending));}
  catch(e){res.writeHead(503);return res.end(JSON.stringify({message:e.message}));}
 }
 if(path==='/api/ice3/diagnostics'){
  res.setHeader('Content-Type','application/json');
  try{if(!ice3DiscoveryPending)ice3DiscoveryPending=discoverIce3().finally(()=>ice3DiscoveryPending=null);return res.end(JSON.stringify(await ice3DiscoveryPending));}
  catch(e){res.writeHead(503);return res.end(JSON.stringify({message:e.message}));}
 }
 if(path==='/api/ice1/diagnostics'){
  res.setHeader('Content-Type','application/json');
  try{if(!ice1DiscoveryPending)ice1DiscoveryPending=discoverIce1().finally(()=>ice1DiscoveryPending=null);return res.end(JSON.stringify(await ice1DiscoveryPending));}
  catch(e){res.writeHead(503);return res.end(JSON.stringify({message:e.message}));}
 }
 if(path==='/api/state'&&new URL(req.url,'http://localhost').searchParams.get('profile')==='icet'){
  if(Date.now()-stateIceT.lastRequest>750&&!stateIceT.pending){stateIceT.lastRequest=Date.now();stateIceT.pending=collectIceT().then(data=>stateIceT.data=data).catch(()=>stateIceT.data={connected:false,supported:false,fields:{},updatedAt:Date.now(),message:'ICE T: TSW nicht erreichbar oder Fahrzeugwechsel. Spiel und HTTP API prüfen.'}).finally(()=>stateIceT.pending=null);}
  res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(restrictLiveState({...stateIceT.data,pending:!!stateIceT.pending},'icet')));
 }
 if(path==='/api/state'&&new URL(req.url,'http://localhost').searchParams.get('profile')==='ice3'){
  if(Date.now()-stateIce3.lastRequest>750&&!stateIce3.pending){stateIce3.lastRequest=Date.now();stateIce3.pending=collectIce3().then(data=>stateIce3.data=data).catch(()=>stateIce3.data={connected:false,supported:false,fields:{},updatedAt:Date.now(),message:'ICE 3: TSW nicht erreichbar oder Fahrzeugwechsel. Spiel und HTTP API prüfen.'}).finally(()=>stateIce3.pending=null);}
  res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(restrictLiveState({...stateIce3.data,pending:!!stateIce3.pending},'ice3')));
 }
 if(path==='/api/state'&&new URL(req.url,'http://localhost').searchParams.get('profile')==='ice1'){
  if(Date.now()-stateIce1.lastRequest>750&&!stateIce1.pending){stateIce1.lastRequest=Date.now();stateIce1.pending=collectIce1().then(data=>stateIce1.data=data).catch(()=>stateIce1.data={connected:false,supported:false,fields:{},updatedAt:Date.now(),message:'ICE 1: TSW nicht erreichbar oder Fahrzeugwechsel. Spiel, HTTP API und Schlüsseldatei prüfen.'}).finally(()=>stateIce1.pending=null);}
  res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(restrictLiveState({...stateIce1.data,pending:!!stateIce1.pending},'ice1')));
 }
 if(path==='/api/state'&&new URL(req.url,'http://localhost').searchParams.get('profile')==='br145'){
  if(Date.now()-state145.lastRequest>750&&!state145.pending){state145.lastRequest=Date.now();state145.pending=collect145().then(data=>state145.data=data).catch(()=>state145.data={connected:false,fields:{},updatedAt:Date.now(),message:'TSW nicht erreichbar oder Fahrzeugwechsel. Spiel, HTTP API und Schlüsseldatei prüfen.'}).finally(()=>state145.pending=null);}
  res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(restrictLiveState({...state145.data,pending:!!state145.pending},'br145')));
 }
 if(path==='/api/state'){const now=Date.now();if(now-lastRequest>750){lastRequest=now;refresh();}res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(restrictLiveState({...state,pending:!!pending},new URL(req.url,'http://localhost').searchParams.get('profile')||'mfd')));}
 if(path==='/api/navi'){if(Date.now()-naviRequest>750){naviRequest=Date.now();refreshNavigation();}res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({...naviState,pending:!!naviPending}));}
 if(path==='/api/navi/stations'){res.setHeader('Content-Type','application/json');try{if(Date.now()-naviState.updatedAt>5000)throw Error('Keine aktuelle Zugposition');return res.end(JSON.stringify(await loadStations(naviState.position)));}catch(e){res.writeHead(503);return res.end(JSON.stringify({message:e.message}));}}
 const files={'/vehicle-profiles.js':'vehicle-profiles.js','/assets/rainrail-logo.svg':'assets/rainrail-logo.svg','/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/sources.js':'sources.js','/profiles/br101.js':'profiles/br101.js','/profiles/ice1.js':'profiles/ice1.js','/profiles/ice3.js':'profiles/ice3.js','/profiles/icet.js':'profiles/icet.js','/profiles/br101-mfa.js':'profiles/br101-mfa.js','/profiles/br145-mfa.js':'profiles/br145-mfa.js','/route-strip.js':'route-strip.js','/strip-model.js':'strip-model.js','/route-strip.css':'route-strip.css','/navi.js':'navi.js','/navi.css':'navi.css','/navi-demo.json':'navi-demo.json','/vendor/leaflet.js':'vendor/leaflet.js','/vendor/leaflet.css':'vendor/leaflet.css','/vendor/leaflet-LICENSE.txt':'vendor/leaflet-LICENSE.txt'};
 if(path==='/'&&['navi','navigator'].includes(new URL(req.url,'http://localhost').searchParams.get('display')))files['/']='navi.html';
 if(!files[path]){res.writeHead(404);return res.end('Nicht gefunden');}
 try{const file=files[path];const ext=file.slice(file.lastIndexOf('.'));res.setHeader('Content-Type',types[ext]);res.end(await readFile(new URL(file,root)));}catch{res.writeHead(500);res.end('Datei nicht verfügbar');}
});
server.listen(port,host,()=>{console.log(`TSW MFD: http://localhost:${port}`);if(host==='0.0.0.0')for(const n of Object.values(networkInterfaces()).flat())if(n?.family==='IPv4'&&!n.internal)console.log(`Tablet: http://${n.address}:${port}`);console.log('Demo startet ohne Spiel. Live ist rein lesend. Beenden: Strg+C.');});
