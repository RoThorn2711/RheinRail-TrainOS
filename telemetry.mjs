import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';

export const API='http://127.0.0.1:31270';
export const supportedClass='RVM_CRG_DB_BR101_ETCS_C';
export const supportedClasses=new Set([supportedClass,'RVM_CRG_DB_BR101_C']);
export const mappings={
 speed:{path:'CurrentDrivableActor.Function.HUD_GetSpeed',key:'Speed (ms)',unit:'m/s → km/h'},
 clock:{path:'TimeOfDay.Data',key:'LocalTimeISO8601',unit:'Spielzeit'},
 sifa:{path:'CurrentDrivableActor/BP_Sifa_Service.Function.WarningDevices_GetWarningIndicator',key:'WarningState',unit:'Warnung oder ausgeschaltet'},
 zsOff:{path:'CurrentDrivableActor/Simulation/Trainline.Enabled',key:'Enabled',unit:'0/1, invertiert'},
 highBrake:{path:'CurrentDrivableActor/Simulation/HighBrake.Result',key:'Result',unit:'0 / 1'},
 force:{path:'CurrentDrivableActor/Simulation/MFA_TractiveEffort_N.Result',key:'Result',unit:'N → kN, Zugkraft pro FM / Bremskraft gesamt'},
 lzbActive:{path:'CurrentDrivableActor/LZB.Function.LZB_GetIsActive',key:'bIsActive'},
 lzbShowDistance:{path:'CurrentDrivableActor/LZB.Function.LZB_GetShowLZBDistanceBare',key:'bShowDistance'},
 lzbDistance:{path:'CurrentDrivableActor/LZB.Function.LZB_GetTargetSpeedDistance',key:'Distance (m)'},
 lzbTargetSpeed:{path:'CurrentDrivableActor/LZB.Function.LZB_GetExpectedTargetSpeed',key:'Speed (ms)'},
 lzbPermittedSpeed:{path:'CurrentDrivableActor/LZB.Function.LZB_GetMaxPermissibleSpeed',key:'Speed (ms)'},
};
export async function keyFile(){return process.env.TSW_KEY_FILE||join(process.env.USERPROFILE||homedir(),'Documents','My Games','TrainSimWorld7','Saved','Config','CommAPIKey.txt');}
export async function request(route){
 const key=(await readFile(await keyFile(),'utf8')).trim();
 // The game sometimes resets an idle TCP connection; retry GET once with a fresh connection.
 for(let attempt=0;attempt<2;attempt++){try{const response=await fetch(`${API}/${route}`,{headers:{DTGCommKey:key,Connection:'close'},signal:AbortSignal.timeout(3500)});if(!response.ok)throw Error(`TSW HTTP ${response.status}`);const data=await response.json();if(data.Result&&data.Result!=='Success')throw Error('TSW liefert keinen gültigen Wert');return data;}catch(error){if(attempt===1)throw error;}}
}
export function decode(name,values){let v=values?.[mappings[name].key];switch(name){case 'speed':case 'lzbTargetSpeed':case 'lzbPermittedSpeed':return typeof v==='number'&&Number.isFinite(v)?Math.abs(v)*3.6:null;case 'lzbDistance':return typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;case 'lzbActive':case 'lzbShowDistance':return typeof v==='boolean'?v:null;case 'force':return typeof v==='number'&&Number.isFinite(v)?(Math.abs(v)<1?0:v/1000):null;case 'clock':return typeof v==='string'&&/T\d{2}:\d{2}:\d{2}/.test(v)?v.split('T')[1].slice(0,8):null;case 'sifa':return typeof v==='boolean'&&typeof values.EnabledState==='boolean'?v||!values.EnabledState:null;case 'zsOff':return v===0?true:v===1?false:null;case 'highBrake':return v===0?false:v===1?true:null;default:return null;}}

// Only named boolean properties exposed by /list are read. No functions with side effects.
export const indicatorNames=[
 'Ü_IsActive','Ü_IsActive_Test','Ü_IsInhibited_LZB_Fault','Ü_IsFlashing','Ü_IsFlashing_Test','Ü_IsFlashing_LZB_Fault',
 ...['B','Ende','E40','V40','H','EL'].flatMap(x=>[x+'_IsActive',x+'_IsFlashing']),
 'Befehl40_IsActive_LZB','Befehl40_IsFlashing_LZB','Befehl40_IsActive_PZB',
 '1000Hz_IsActive_PZB','1000Hz_IsFlashing_PZB','1000Hz_IsFlashing_BP','1000Hz_IsFlashing_Cutout','1000Hz_IsFlashing_FaultIsolation','500Hz_IsActive',
 'G_IsActive_LZB','G_IsFlashing_LZB','G_IsActive_PZB','G_IsFlashing_PZB','S_IsActive_LZB','S_IsFlashing_LZB','S_IsActive_PZB','S_IsActive_Test',
 '55_IsActive_PZB','55_IsActive_TrainData','55_IsInhibited_LZB','55_IsInhibited_Test','55_IsFlashing_PZB','55_IsFlashing_Grunddaten',
 '70_IsActive_PZB','70_IsActive_TrainData','70_IsInhibited_LZB','70_IsInhibited_Test','70_IsFlashing_PZB','70_IsFlashing_Inverted','70_IsFlashing_Grunddaten',
 '85_IsActive_PZB','85_IsActive_TrainData','85_IsInibited_Test','85_IsFlashing_PZB','85_IsFlashing_LZB','85_IsFlashing_Grunddaten',
 'Stoer_IsActive_LZB','Stoer_IsActive_LZB_Fault','Stoer_Ersatzzugdaten','Stoer_Grunddaten','Stoer_IsInhibited_Test','Stoer_IsFlashing_FaultIsolation',
];
const any=vs=>vs.includes(true)?true:vs.every(v=>v===false)?false:null;
const all=vs=>vs.includes(false)?false:vs.every(v=>v===true)?true:null;
const not=v=>v===null?null:!v;
export function deriveIndicators(raw){
 const b=n=>typeof raw[n]==='boolean'?raw[n]:null;
 const or=(...ns)=>any(ns.map(b));
 const lamp=(on,flash=false,inverted=false)=>({on:any([on,flash]),flash,inverted});
 const result={};
 for(const n of ['B','Ende','E40','V40','H','EL'])result[n]=lamp(b(n+'_IsActive'),b(n+'_IsFlashing'));
 result.U=lamp(all([or('Ü_IsActive','Ü_IsActive_Test'),not(b('Ü_IsInhibited_LZB_Fault'))]),or('Ü_IsFlashing','Ü_IsFlashing_Test','Ü_IsFlashing_LZB_Fault'));
 for(const n of ['55','70','85']){const inhibit=n==='85'?b('85_IsInibited_Test'):or(n+'_IsInhibited_LZB',n+'_IsInhibited_Test');const flash=or(n+'_IsFlashing_PZB',n+'_IsFlashing_Grunddaten',...(n==='85'?['85_IsFlashing_LZB']:[]));result[n]=lamp(all([or(n+'_IsActive_PZB',n+'_IsActive_TrainData'),not(inhibit)]),all([flash,not(inhibit)]),n==='70'?b('70_IsFlashing_Inverted'):false);}
 result.Befehl40=lamp(or('Befehl40_IsActive_LZB','Befehl40_IsActive_PZB'),b('Befehl40_IsFlashing_LZB'));
 result.Hz1000=lamp(b('1000Hz_IsActive_PZB'),or('1000Hz_IsFlashing_PZB','1000Hz_IsFlashing_BP','1000Hz_IsFlashing_Cutout','1000Hz_IsFlashing_FaultIsolation'));
 result.Hz500=lamp(b('500Hz_IsActive'));
 result.G=lamp(or('G_IsActive_LZB','G_IsActive_PZB'),or('G_IsFlashing_LZB','G_IsFlashing_PZB'));
 result.S=lamp(or('S_IsActive_LZB','S_IsActive_PZB','S_IsActive_Test'),b('S_IsFlashing_LZB'));
 result.Stoer=lamp(all([or('Stoer_IsActive_LZB','Stoer_IsActive_LZB_Fault','Stoer_Ersatzzugdaten','Stoer_Grunddaten'),not(b('Stoer_IsInhibited_Test'))]),b('Stoer_IsFlashing_FaultIsolation'));
 return result;
}
async function boundedMap(items,run){let next=0;await Promise.all(Array.from({length:6},async()=>{while(next<items.length){const item=items[next++];await run(item);}}));}
export async function collect(read=request){
 const startedAt=Date.now();const info=await read('info');const identity=await read('get/CurrentDrivableActor.ObjectClass');const vehicle=identity.Values?.ObjectClass;const fields={};
 if(!supportedClasses.has(vehicle))return {connected:true,supported:false,vehicle,build:info.Meta?.GameBuildNumber,updatedAt:Date.now(),fields,message:'Fahrzeugprofil nicht bestätigt. Live-Werte werden ausgeblendet.'};
 // Bounded parallel reads keep the complete lamp sample fast enough for live operation.
 const indicators={};await boundedMap([...Object.keys(mappings),...indicatorNames.map(n=>'lamp:'+n)],async name=>{if(name.startsWith('lamp:')){const n=name.slice(5);try{const r=await read('get/CurrentDrivableActor/MFA_Indicators.Property.'+encodeURIComponent(n));indicators[n]=typeof r.Values?.Value==='boolean'?r.Values.Value:null;}catch{indicators[n]=null;}}else{try{const r=await read('get/'+mappings[name].path);fields[name]={value:decode(name,r.Values),at:Date.now()};}catch{fields[name]={value:null,at:Date.now(),error:'Nicht erreichbar'};}}});
 // Recheck the actor after the sample to avoid mixing values across a vehicle switch.
 const endIdentity=await read('get/CurrentDrivableActor.ObjectClass');if(endIdentity.Values?.ObjectClass!==vehicle)throw Error('Fahrzeugwechsel · erneut verbinden');
 fields.lamps={value:deriveIndicators(indicators),at:Date.now()};
 return {connected:true,supported:true,vehicle,build:info.Meta?.GameBuildNumber,startedAt,updatedAt:Date.now(),fields,message:'Live · Geschwindigkeit, Zug-/Bremskraft, Meldeleuchten und LZB-Zielanzeigen.'};
}
