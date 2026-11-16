import {resolveIce3Mappings} from './ice3-mappings.mjs';
// GNT_Service and these properties are present in the user's actual
// RVM_FTF_DB_BR411_TW_0_C listing. Enabled and activated are distinct states.
export async function resolveIceTMappings(read){
 const result=await resolveIce3Mappings(read);
 const path='CurrentDrivableActor/GNT_Service';
 const names={gntEnabled:'bIsEnabled',gntReady:'bIsReady',gntMonitoringActive:'bIsActivated'};
 let endpoints=new Set();
 try{
  const r=await read('list/'+path);
  endpoints=new Set((r.Endpoints||[]).filter(e=>e.Writable===false).map(e=>e.Name));
  result.extraComponents.push({path,endpoints:[...endpoints]});
 }catch{result.extraComponents.push({path,error:'GNT-Komponentenliste nicht verfügbar'});}
 for(const [name,property] of Object.entries(names))result.mappings[name]={path:endpoints.has('Property.'+property)?path+'.Property.'+property:null,key:'Value',kind:'boolean'};
 return result;
}
