import {request} from './telemetry.mjs';
import {readFile} from 'node:fs/promises';
export const validPosition=p=>!!p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
const number=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e20?v:null;
const kmh=v=>number(v)!==null&&v>=0&&v<1000?v*3.6:null;
const metres=v=>number(v)!==null&&v>=0?v/100:null;
export function normalizeNavigation(raw){
 const position={lat:raw.position?.Lat,lon:raw.position?.Lon};const a=raw.aid||{},t=raw.track||{};
 const events=[];
 for(const [i,s] of (Array.isArray(a.nextSignals)?a.nextSignals:[]).entries()){const distance=metres(s.distanceToNextSignal);if(distance!==null)events.push({id:'signal-'+i,kind:'signal',name:'Signal voraus',distance,aspect:typeof s.value==='string'?s.value:null,position:null,source:'TSW'});}
 for(const [i,s] of (Array.isArray(a.nextSpeedLimits)?a.nextSpeedLimits:[]).entries()){const distance=metres(s.distanceToNextSpeedLimit),speed=kmh(s.value?.value);if(distance!==null&&speed!==null)events.push({id:'speed-'+i,kind:'speed',name:'Geschwindigkeitswechsel',distance,speed,restriction:typeof s.restrictionType==='string'?s.restrictionType:null,position:null,source:'TSW'});}
 for(const [i,m] of (Array.isArray(t.markers)?t.markers:[]).entries()){if(typeof m.markerName==='string')events.push({id:'marker-'+i,kind:'station',name:m.markerName,distance:metres(m.distanceToStationCM),position:null,source:'TSW',markerType:m.markerType||null});}
 events.sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
 return {position:validPosition(position)?position:null,vehicle:typeof raw.vehicle==='string'?raw.vehicle:null,vehicleId:raw.vehicleId||null,speed:kmh(raw.speed?.['Speed (ms)']),trackSpeed:kmh(a.trackMaxSpeed?.value),permittedSpeed:kmh(a.speedLimit?.value),speedSource:a.currentSpeedLimitSource||null,lzbActive:typeof raw.lzb?.bIsActive==='boolean'?raw.lzb.bIsActive:null,lzbPermittedSpeed:kmh(raw.lzbSpeed?.['Speed (ms)']),pzbActive:typeof raw.pzb?.IsActive==='boolean'?raw.pzb.IsActive:null,service:typeof raw.player?.currentServiceName==='string'?raw.player.currentServiceName:null,place:events.find(e=>e.kind==='station')?.name||null,route:null,chainage:null,events,rawYaw:number(raw.rotation?.ReturnValue?.yaw),heading:null,trail:[]};
}
export function distance(a,b){const r=Math.PI/180,dy=(b.lat-a.lat)*r,dx=(b.lon-a.lon)*r;const h=Math.sin(dy/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dx/2)**2;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(h)));}
export function bearing(a,b){const r=Math.PI/180,dl=(b.lon-a.lon)*r;return (Math.atan2(Math.sin(dl)*Math.cos(b.lat*r),Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos(dl))/r+360)%360;}
let previous,heading=null,trail=[],session;
export async function collectNavigation(read=request){
 const sampledAt=Date.now();
 const info=await read('info');const identity=await read('get/CurrentDrivableActor.VehicleID');
 const paths={position:'CurrentDrivableActor.LatLon',vehicle:'CurrentDrivableActor.ObjectClass',speed:'CurrentDrivableActor.Function.HUD_GetSpeed',aid:'DriverAid.Data',track:'DriverAid.TrackData',player:'DriverAid.PlayerInfo',rotation:'CurrentDrivableActor.Function.K2_GetActorRotation',lzb:'CurrentDrivableActor/LZB.Function.LZB_GetIsActive',lzbSpeed:'CurrentDrivableActor/LZB.Function.LZB_GetMaxPermissibleSpeed',pzb:'CurrentDrivableActor/MFA_Indicators.Function.GetIsActivePZB'};
 const raw={},errors=[];await Promise.all(Object.entries(paths).map(async([k,p])=>{try{const d=await read('get/'+p);raw[k]=d.Values;}catch{errors.push(k);}}));raw.vehicle=raw.vehicle?.ObjectClass;raw.vehicleId=identity.Values?.VehicleID;
 const after=await read('get/CurrentDrivableActor.VehicleID');if(after.Values?.VehicleID!==raw.vehicleId)throw Error('Fahrzeugwechsel');
 const data=normalizeNavigation(raw),key=String(info.Meta?.GameInstanceID)+':'+raw.vehicleId;
 if(session!==key){session=key;previous=null;heading=null;trail=[];}
 if(data.position){if(previous){const gap=distance(previous,data.position);if(gap>1500){trail=[];heading=null;previous=null;}else if(gap>=2){heading=bearing(previous,data.position);trail.push([data.position.lat,data.position.lon]);previous=data.position;}}if(!previous){previous=data.position;trail.push([data.position.lat,data.position.lon]);}}
 trail=trail.slice(-1200);data.heading=data.position?heading:null;data.trail=data.position?trail:[];
 return {...data,connected:true,updatedAt:sampledAt,errors,headingSource:'GPS-Bewegungsrichtung',distanceUnit:'DriverAid: cm → m',recorded:false};
}
let stationsCache,stationsPending,stationsAttempt=0;
export async function loadStations(position){
 if(!validPosition(position))throw Error('Keine aktuelle Zugposition');
 // A single verified OSM object remains usable when public Overpass services are overloaded.
 const reference=JSON.parse(await readFile(new URL('./data/osm-reference-stations.json',import.meta.url),'utf8'));
 const nearby=reference.stations.filter(s=>distance(s.position,position)<5000);
 if(nearby.length)return {source:reference.source,localReference:true,stations:nearby};
 if(stationsCache&&Date.now()-stationsCache.at<900000&&distance(stationsCache.position,position)<2000)return stationsCache.data;
 if(stationsPending)return stationsPending;if(Date.now()-stationsAttempt<60000)throw Error('Bahnhofsdaten können nach einer Minute erneut geladen werden');stationsAttempt=Date.now();
 stationsPending=(async()=>{const query=`[out:json][timeout:20];node[railway~"^(station|halt)$"](around:5000,${position.lat},${position.lon});out body;`;const res=await fetch('https://overpass.private.coffee/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'RheinRailNavigator-local/1.0'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error('OSM-Bahnhofsdaten derzeit nicht erreichbar');const json=await res.json();const data={source:'OpenStreetMap · reale Welt, keine TSW-Streckendaten',stations:(json.elements||[]).filter(n=>validPosition({lat:n.lat,lon:n.lon})).slice(0,200).map(n=>({id:'osm-'+n.id,name:n.tags?.name||'Unbenannter Bahnhof',position:{lat:n.lat,lon:n.lon},source:'OSM',kind:'station'}))};stationsCache={at:Date.now(),position,data};return data;})().finally(()=>stationsPending=null);return stationsPending;
}
