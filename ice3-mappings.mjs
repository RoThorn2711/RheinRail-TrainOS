import {ice1Mappings} from './ice1-mappings.mjs';
const lzbFields=['lzbActive','lzbReady','lzbShowDistance','lzbDistance','lzbTargetSpeed','lzbPermittedSpeed'];
const numericAliases={
 forcePercent:['DisplayedTractiveEffortPercent','DisplayedForcePercent','SignedTractiveEffortPercent','TractionBrakePercent'],
 tractionPercent:['DisplayedTractionPercent','TractionPercent','TractiveEffortPercent'],
 brakePercent:['DisplayedBrakePercent','BrakingPercent','BrakingEffortPercent'],
 vehicleMaxSpeed:['VehicleMaxSpeedKph','VehicleMaxSpeedKmh'],
};
const normalize=s=>s.replace(/[^a-z0-9]/gi,'').toLowerCase();
export async function resolveIce3Mappings(read){
 const mappings={speed:ice1Mappings.speed,clock:ice1Mappings.clock,sifa:{path:null,key:null},forcePercent:{path:null,key:null,kind:'signedPercent',unit:'%'}};
 for(const name of lzbFields)mappings[name]={...ice1Mappings[name],path:null};
 const components=[];
 try{
  const root=await read('list/CurrentDrivableActor');
  const nodes=(root.Nodes||[]).map(n=>n.Name).filter(n=>typeof n==='string'&&/^(?:BP_)?LZB(?:_Service)?$/i.test(n));
  components.push({path:'CurrentDrivableActor',nodes:(root.Nodes||[]).map(n=>n.Name).filter(n=>typeof n==='string')});
  for(const component of nodes.slice(0,2)){
   const path='CurrentDrivableActor/'+component;
   try{
    const r=await read('list/'+path),endpoints=new Set((r.Endpoints||[]).filter(e=>e.Writable===false).map(e=>e.Name));
    components.push({path,endpoints:[...endpoints]});
    for(const name of lzbFields){const endpoint=ice1Mappings[name].path.split('.').slice(1).join('.');if(!mappings[name].path&&endpoints.has(endpoint))mappings[name]={...ice1Mappings[name],path:path+'.'+endpoint};}
   }catch{components.push({path,error:'Komponentenliste nicht verfügbar'});}
  }
  for(const [path,data] of [['CurrentDrivableActor',root],...await Promise.all(['DD_Service','DD_DataStore'].map(async n=>{const p='CurrentDrivableActor/'+n;try{return [p,await read('list/'+p)];}catch{return [p,{}];}}))]){
   const properties=(data.Endpoints||[]).filter(e=>e.Writable===false&&typeof e.Name==='string'&&/^Property\.[a-zA-Z0-9_ -]+$/.test(e.Name));
   components.push({path,properties:properties.map(e=>e.Name)});
   for(const [name,aliases] of Object.entries(numericAliases)){
    const property=properties.find(e=>aliases.some(a=>normalize(a)===normalize(e.Name.slice(9))));
    if(property&&!mappings[name]?.path)mappings[name]={path:path+'.'+encodeURIComponent(property.Name),key:'Value',kind:name==='vehicleMaxSpeed'?'kmh':name==='forcePercent'?'signedPercent':'percent',unit:name==='vehicleMaxSpeed'?'km/h':'%'};
   }
  }
 }catch{components.push({path:'CurrentDrivableActor',error:'Komponentenliste nicht verfügbar'});}
 return {mappings,extraComponents:components};
}
export function decodeIce3(name,values,mapping){
 const v=values?.[mapping.key];
 if(mapping.kind==='boolean')return typeof v==='boolean'?v:null;
 if(mapping.kind==='clock')return typeof v==='string'&&/T\d{2}:\d{2}:\d{2}/.test(v)?v.split('T')[1].slice(0,8):null;
 if(typeof v!=='number'||!Number.isFinite(v))return null;
 if(mapping.kind==='speed')return name==='speed'?Math.abs(v)*3.6:v>=0?v*3.6:null;
 if(mapping.kind==='distance'||mapping.kind==='kmh')return v>=0?v:null;
 if(mapping.kind==='signedPercent')return v>=-100&&v<=100?v:null;
 if(mapping.kind==='percent')return v>=0&&v<=100?v:null;
 return null;
}
