import {request} from './telemetry.mjs';
import {liveDisplays,isIce3Vehicle,isIceTVehicle} from './dist/vehicle-profiles.js';

// Enumerate component metadata, then read only listed telemetry properties and
// explicitly allowed getters. Never invoke arbitrary Function.* endpoints.
const relevant=/gnt|neigetechnik|lzb|pzb|sifa|mfa|mfd|indicator|display|tractive|traction|effort|force|brems|brak|zugkraft|safety|warning|speed|simulation|DD_Service|DD_DataStore/i;
const getters=new Set(['WarningDevices_GetWarningIndicator','LZB_GetIsActive','LZB_GetIsReady','LZB_GetShowLZBDistanceBare','LZB_GetTargetSpeedDistance','LZB_GetExpectedTargetSpeed','LZB_GetMaxPermissibleSpeed','GetIsActivePZB','PZB_GetDataStruct','PZB_GetProgramMode','PZB_GetActiveState','IsSifaEnabled','IsSifaActive','HUD_GetAlerter','HUD_GetTractiveEffort','IS_GetTractiveEffortN','IS_GetBrakingEffortN']);
const validName=n=>typeof n==='string'&&n.length>0&&n.length<=180&&!/[\/\\?#\r\n]/.test(n)&&n!=='.'&&n!=='..';
const encodePath=p=>p.split('/').map(encodeURIComponent).join('/');
function scalars(values,depth=0){
 if(depth>4)return {};
 return Object.fromEntries(Object.entries(values||{}).slice(0,200).filter(([key,v])=>key.length<120&&key!=='__proto__'&&(typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||v&&typeof v==='object')).map(([key,v])=>[key,v&&typeof v==='object'?scalars(v,depth+1):v]));
}
export const discoverIce1=(read=request)=>discoverIce(read,'ice1');
export const discoverIce3=(read=request)=>discoverIce(read,'ice3');
export const discoverIceT=(read=request)=>discoverIce(read,'icet');
async function discoverIce(read,profile){
 const label=profile==='icet'?'ICE T':profile==='ice3'?'ICE 3':'ICE 1';
 const identity=async()=>{const a=await read('get/CurrentDrivableActor.ObjectClass'),b=await read('get/CurrentDrivableActor.VehicleID');return {vehicle:a.Values?.ObjectClass,id:b.Values?.VehicleID};};
 const before=await identity();
 const matches=profile==='icet'?isIceTVehicle(before.vehicle):profile==='ice3'?isIce3Vehicle(before.vehicle):liveDisplays(before.vehicle).includes('ice1');
 if(!matches||typeof before.id!=='string'||!before.id)throw Error('Bitte im '+label+' sitzen, bevor die Komponentenabfrage gestartet wird.');
 const report={profile,schema:3,vehicle:before.vehicle,createdAt:new Date().toISOString(),components:[],samples:[],warnings:[]};
 const queue=[{path:'CurrentDrivableActor',depth:0,interesting:false}],visited=new Set(),reads=[];
 const deadline=Date.now()+18000;
 while(queue.length&&visited.size<80&&Date.now()<deadline){
  const batch=queue.splice(0,4);
  await Promise.all(batch.map(async item=>{
   if(visited.has(item.path))return;visited.add(item.path);
   try{
    const data=await read('list/'+encodePath(item.path),{timeoutMs:900,attempts:1});
    if(!Array.isArray(data.Nodes)&&!Array.isArray(data.Endpoints))throw Error('Unerwartetes Listenformat');
    const children=(data.Nodes||[]).map(n=>n.Name).filter(validName).slice(0,500);
    const endpoints=(data.Endpoints||[]).filter(e=>validName(e.Name)).slice(0,700).map(e=>({name:e.Name,writable:e.Writable===true}));
    report.components.push({path:item.path,children,endpoints});
    for(const e of data.Endpoints||[]){
     if(!validName(e.Name))continue;
     const getter=e.Name.startsWith('Function.')&&getters.has(e.Name.slice(9));
     const service=/\/(?:DD_Service|DD_DataStore|LZB_Service|PZB_Service|TimeTimeSifa|GNT_Service)$/.test(item.path);
     const telemetry=e.Writable===false&&!e.Name.startsWith('Function.')&&(relevant.test(e.Name)||service&&/^Property\./.test(e.Name)||item.interesting&&/^(?:Property\.)?(?:Result|Value|Enabled|IsActive|WarningState|EnabledState)$/.test(e.Name));
     if(getter||telemetry)reads.push(item.path+'.'+e.Name);
    }
    if(item.depth<3)for(const name of children){const interesting=relevant.test(name);const control=/_(?:F|FL|FR)$|Button|Pedal|FuseControl|Switch|^ABT_|Brightness|LightsIncrease|LightsDecrease/i.test(name);if(interesting&&!control)queue.push({path:item.path+'/'+name,depth:item.depth+1,interesting});}
   }catch{report.components.push({path:item.path,error:'Komponentenliste nicht verfügbar'});}
  }));
 }
 if(queue.length)report.warnings.push('Komponentenabfrage begrenzt; weitere Unterknoten vorhanden.');
 const priority=p=>/GNT|gnt/.test(p)?0:/Function\.(?:LZB_|PZB_|IsSifa|HUD_GetAlerter|IS_Get.*Effort)/.test(p)?0:/DD_Service|DD_DataStore|ForceNSummarized/.test(p)?1:/LZB_Service|PZB_Service|TimeTimeSifa/.test(p)?2:3;
 const unique=[...new Set(reads)].sort((a,b)=>priority(a)-priority(b)).slice(0,160);if(reads.length>160)report.warnings.push('Maximal 160 Messpfade abgefragt.');
 for(let i=0;i<unique.length&&Date.now()<deadline;i+=6)await Promise.all(unique.slice(i,i+6).map(async path=>{
  try{const r=await read('get/'+encodePath(path),{timeoutMs:750,attempts:1});report.samples.push({path,values:scalars(r.Values)});}catch{report.samples.push({path,error:'Messwert nicht verfügbar'});}
 }));
 if(Date.now()>=deadline)report.warnings.push('Zeitlimit erreicht; Abfrage unvollständig.');
 const after=await identity();if(after.vehicle!==before.vehicle||after.id!==before.id)throw Error('Fahrzeug während der Abfrage gewechselt. Bitte erneut starten.');
 return report;
}
