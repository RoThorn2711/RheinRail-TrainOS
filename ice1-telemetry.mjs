import {ice1Mappings,decodeIce1} from './ice1-mappings.mjs';
import {liveDisplays} from './dist/vehicle-profiles.js';
import {readMappedField,parallelRead} from './telemetry-read.mjs';
import {discoverIndicatorProperties,displayedLampIds} from './ice1-indicators.mjs';
const capabilities=new WeakMap();
export async function collectIce1Profile(read,{indicatorNames,deriveIndicators},config={}){
 const profile=config.profile||'ice1',label=config.label||'ICE 1';
 const startedAt=Date.now(),info=await read('info');
 const identity=async()=>{const cls=await read('get/CurrentDrivableActor.ObjectClass'),id=await read('get/CurrentDrivableActor.VehicleID');return {vehicle:cls.Values?.ObjectClass,id:id.Values?.VehicleID};};
 const before=await identity(),vehicle=before.vehicle;
 const diagnostics={profile,mapping:profile==='ice1'?'component-confirmed':'provisional',vehicle,fields:{},lamps:{},components:[],missing:[]};
 if(!liveDisplays(vehicle).includes(profile))return {connected:true,supported:false,vehicle,fields:{},updatedAt:Date.now(),diagnostics,message:'Aktuelles Fahrzeug passt nicht zum '+label+'-Profil.'};
 if(typeof before.id!=='string'||!before.id)throw Error('Unbekannte Fahrzeugidentität');
 const key=profile+':'+vehicle+':'+before.id;
 let capability=capabilities.get(read);
 if(!capability||capability.key!==key||Date.now()-capability.at>30000){
  capability={key,at:Date.now(),...await discoverIndicatorProperties(read,indicatorNames,config.indicatorOptions),...(config.resolveMappings?await config.resolveMappings(read):{})};
  capabilities.set(read,capability);
 }
 diagnostics.components=[...capability.components,...(capability.extraComponents||[])];
 const selectedMappings=capability.mappings||ice1Mappings;
 const fields={},flags={},flagSamples={},direct={},gntFlags={};
 await parallelRead([...Object.keys(selectedMappings).map(name=>({name})),...capability.found.map(property=>({property}))],async task=>{
  if(task.name){const name=task.name,mapping=selectedMappings[name];fields[name]=await readMappedField(read,mapping,values=>config.decode?config.decode(name,values,mapping):decodeIce1(name,values));diagnostics.fields[name]={...mapping,...fields[name]};return;}
  const p=task.property;
  const field=await readMappedField(read,p,v=>typeof v?.Value==='boolean'?v.Value:null);
  diagnostics.lamps[p.path]={property:p.property,kind:p.kind,...field};
  if(p.kind==='gntFlag')(gntFlags[p.aspect]??=[]).push(field);
  else if(p.kind==='flag')(flagSamples[p.property]??=[]).push(field);
  else{(direct[p.id]??=[]).push(field);}
 });
 // Preserve the 101's Active/Flashing/Inhibited processing where those exact
 // advertised flags exist. Direct display booleans represent the visible lamp.
 const lampAt=Date.now();
 for(const [name,samples] of Object.entries(flagSamples)){
  const valid=samples.filter(f=>f.value!==null&&lampAt-f.at<=5000),values=new Set(valid.map(f=>f.value));
  flags[name]=values.size===1?valid[0].value:null;
 }
 const lamps=deriveIndicators(flags),lampIds=[...displayedLampIds,...(config.extraLampIds||[])];
 for(const id of config.extraLampIds||[])lamps[id]={on:null,flash:false,inverted:false};
 for(const id of lampIds){
  const values=direct[id]?.filter(f=>f.value!==null&&lampAt-f.at<=5000);
  if(values?.length){const unique=new Set(values.map(f=>f.value));lamps[id]={on:unique.size===1?values[0].value:null,flash:false,inverted:false};}
 }
 if(profile==='icet'){
  const resolve=items=>{const valid=(items||[]).filter(f=>f.value!==null&&lampAt-f.at<=5000),values=new Set(valid.map(f=>f.value));return values.size===1?valid[0].value:null;};
  if(lamps.GNT.on===null){const on=resolve(gntFlags.on),flash=resolve(gntFlags.flash),inhibit=resolve(gntFlags.inhibit);lamps.GNT={on:inhibit===true?false:on===true||flash===true?true:on,flash:inhibit===true?false:flash===true,inverted:false};}
  const enabled=fields.gntEnabled;
  if(lamps.GNT.on===null&&typeof enabled?.value==='boolean'&&lampAt-enabled.at<=5000){
   lamps.GNT={on:enabled.value,flash:false,inverted:false};
   diagnostics.gntLampSource='GNT_Service.bIsEnabled (provisional display association)';
  }
  const samples=Object.values(diagnostics.lamps).filter(p=>p.kind==='gntFlag'||capability.found.some(f=>f.path&&f.id==='GNT'&&f.property===p.property));
  fields.gntActive={value:lamps.GNT.on,at:samples.length?Math.min(...samples.map(f=>f.at)):enabled?.at??startedAt};
  diagnostics.fields.gntActive={...fields.gntActive,source:diagnostics.gntLampSource||'advertised-GNT-lamp'};
 }
 const sifa=direct.sifa?.filter(f=>f.value!==null&&lampAt-f.at<=5000);
 if(sifa?.length){const unique=new Set(sifa.map(f=>f.value));fields.sifa={value:unique.size===1?sifa[0].value:null,at:Math.min(...sifa.map(f=>f.at))};diagnostics.fields.sifa={...fields.sifa,paths:capability.found.filter(p=>p.id==='sifa').map(p=>p.path)};}
 if(lamps.B.on===null)lamps.B={on:fields.lzbReady?.value??null,flash:false,inverted:false};
 // Stamp the lamp group conservatively, so slow reads cannot refresh old flags.
 const timestamps=Object.values(diagnostics.lamps).map(f=>f.at);timestamps.push(fields.lzbReady.at);
 if(profile==='icet')timestamps.push(fields.gntActive.at);
 fields.lamps={value:lamps,at:Math.min(...timestamps)};
 const after=await identity();if(after.vehicle!==vehicle||after.id!==before.id){capabilities.delete(read);throw Error('Fahrzeugwechsel – erneut verbinden');}
 const fresh=f=>f?.value!==null&&f?.value!==undefined&&Date.now()-f.at<=5000;
 for(const name of Object.keys(selectedMappings))if(!fresh(fields[name]))diagnostics.missing.push(name);
 for(const id of lampIds)if(lamps[id]?.on===null||!fresh(fields.lamps))diagnostics.missing.push('lamp:'+id);
 if(['ice3','icet'].includes(profile)&&fields.forcePercent?.value===null){
  const a=fields.tractionPercent,b=fields.brakePercent;
  if(fresh(a)&&fresh(b)&&!(a.value>0&&b.value>0)){fields.forcePercent={value:b.value>0?-b.value:a.value,at:Math.min(a.at,b.at)};diagnostics.fields.forcePercent={...fields.forcePercent,unit:'%',source:'explicit-percent-properties'};diagnostics.missing=diagnostics.missing.filter(n=>n!=='forcePercent');}
 }
 const partial=diagnostics.missing.length>0;
 return {connected:true,supported:true,provisional:true,partial,vehicle,build:info.Meta?.GameBuildNumber,startedAt,updatedAt:Date.now(),fields,diagnostics,message:label+': Live-Abfragen über denselben API-Leser wie BR 101. '+(partial?'Noch nicht verfügbar: '+diagnostics.missing.join(', ')+'.':'Messwerte verfügbar. ')+'Kraftskalierung und Anzeigezustände bitte mit dem Spiel vergleichen.'};
}
