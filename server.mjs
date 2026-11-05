import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
import {collect} from './telemetry.mjs';
import {collectNavigation,loadStations} from './navigation.mjs';
const root=new URL('./dist/',import.meta.url),port=Number(process.env.PORT||8787),host=process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
let state={connected:false,fields:{},message:'Noch keine Live-Abfrage'},pending,lastRequest=0;
let naviState={connected:false,events:[],updatedAt:0},naviPending,naviRequest=0;
function refreshNavigation(){if(!naviPending)naviPending=collectNavigation().then(s=>naviState=s).catch(()=>naviState={connected:false,events:[],position:null,updatedAt:Date.now()}).finally(()=>naviPending=null);return naviPending;}
function refresh(){if(!pending){pending=collect().then(s=>state=s).catch(()=>state={connected:false,supported:false,fields:{},updatedAt:Date.now(),message:'TSW nicht erreichbar. Spiel, HTTP API und Schlüsseldatei prüfen.'}).finally(()=>pending=null);}return pending;}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; frame-ancestors 'self'");
 if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});return res.end('Nur lesender Zugriff');}
 const authority=req.headers.host||'';const hostName=authority.split(':')[0];const allowed=new Set(['localhost','127.0.0.1',...Object.values(networkInterfaces()).flat().filter(Boolean).map(n=>n.address)]);
 if(!allowed.has(hostName)){res.writeHead(403);return res.end('Host nicht erlaubt');}
 if(req.headers.origin&&req.headers.origin!==`http://${authority}`){res.writeHead(403);return res.end('Origin nicht erlaubt');}
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(path==='/api/state'){const now=Date.now();if(now-lastRequest>750){lastRequest=now;refresh();}res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({...state,pending:!!pending}));}
 if(path==='/api/navi'){if(Date.now()-naviRequest>750){naviRequest=Date.now();refreshNavigation();}res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({...naviState,pending:!!naviPending}));}
 if(path==='/api/navi/stations'){res.setHeader('Content-Type','application/json');try{if(Date.now()-naviState.updatedAt>5000)throw Error('Keine aktuelle Zugposition');return res.end(JSON.stringify(await loadStations(naviState.position)));}catch(e){res.writeHead(503);return res.end(JSON.stringify({message:e.message}));}}
 const files={'/assets/rainrail-logo.svg':'assets/rainrail-logo.svg','/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/sources.js':'sources.js','/profiles/br101.js':'profiles/br101.js','/profiles/br101-mfa.js':'profiles/br101-mfa.js','/route-strip.js':'route-strip.js','/strip-model.js':'strip-model.js','/route-strip.css':'route-strip.css','/navi.js':'navi.js','/navi.css':'navi.css','/navi-demo.json':'navi-demo.json','/vendor/leaflet.js':'vendor/leaflet.js','/vendor/leaflet.css':'vendor/leaflet.css','/vendor/leaflet-LICENSE.txt':'vendor/leaflet-LICENSE.txt'};
 if(path==='/'&&['navi','navigator'].includes(new URL(req.url,'http://localhost').searchParams.get('display')))files['/']='navi.html';
 if(!files[path]){res.writeHead(404);return res.end('Nicht gefunden');}
 try{const file=files[path];const ext=file.slice(file.lastIndexOf('.'));res.setHeader('Content-Type',types[ext]);res.end(await readFile(new URL(file,root)));}catch{res.writeHead(500);res.end('Datei nicht verfügbar');}
});
server.listen(port,host,()=>{console.log(`TSW MFD: http://localhost:${port}`);if(host==='0.0.0.0')for(const n of Object.values(networkInterfaces()).flat())if(n?.family==='IPv4'&&!n.internal)console.log(`Tablet: http://${n.address}:${port}`);console.log('Demo startet ohne Spiel. Live ist rein lesend. Beenden: Strg+C.');});
