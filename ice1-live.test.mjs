import test from 'node:test';
import assert from 'node:assert/strict';
import {collectIce1,indicatorNames} from './telemetry.mjs';
import {ice1Mappings as mappings} from './ice1-mappings.mjs';
import {liveDisplays,restrictLiveState} from './dist/vehicle-profiles.js';
import {normalizeLive} from './dist/sources.js';
import {layout,render} from './dist/profiles/ice1.js';
import {readFile} from 'node:fs/promises';
test('ICE 1 mapped vehicle endpoints exist in the recorded component listing',async()=>{
 const fixture=JSON.parse(await readFile(new URL('./test/fixtures/ice1-components.json',import.meta.url),'utf8'));
 for(const [name,m] of Object.entries(mappings)){
  if(!m.path||name==='clock')continue;
  const component=fixture.components.find(c=>m.path.startsWith(c.path+'.'));
  assert.ok(component, name+': recorded component missing');
  assert.ok(component.endpoints.includes(m.path.slice(component.path.length+1)),name+': endpoint absent from recorded listing');
 }
});
function reader({vehicle='TEST_DB_BR401_C',missing=false}={}){
 const calls=[],values={speed:{'Speed (ms)':80},clock:{LocalTimeISO8601:'2026-11-16T12:34:56Z'},force:{Result:-90000},sifa:{WarningState:true,EnabledState:true},lzbReady:{Value:true},lzbActive:{bIsActive:true},lzbShowDistance:{bShowDistance:true},lzbDistance:{'Distance (m)':1200},lzbTargetSpeed:{'Speed (ms)':60},lzbPermittedSpeed:{'Speed (ms)':80}};
 const routes=new Map(Object.entries(mappings).filter(([name])=>values[name]).map(([name,m])=>['get/'+m.path,{Values:values[name]}]));
 const flags=Object.fromEntries(indicatorNames.map(n=>[n,false]));Object.assign(flags,{'B_IsActive':true,'85_IsActive_PZB':true,'1000Hz_IsActive_PZB':true});
 for(const [name,value] of Object.entries(flags))routes.set('get/CurrentDrivableActor/MFA_Indicators.Property.'+encodeURIComponent(name),{Values:{Value:value}});
 const read=async route=>{calls.push(route);if(route==='info')return {Meta:{}};if(route.endsWith('ObjectClass'))return {Values:{ObjectClass:vehicle}};if(route.endsWith('VehicleID'))return {Values:{VehicleID:'private-session-id'}};if(missing&&!route.endsWith('HUD_GetSpeed')&&!route.endsWith('TimeOfDay.Data'))throw Error('Not available');if(routes.has(route))return routes.get(route);throw Error('Unexpected route');};return {read,calls};
}
test('ICE 1 class recognition excludes ICE 2/3 and other numeric families',()=>{
 for(const name of ['RVM_DB_BR401_C','BP_ICE1_C','ICE_1_C','DB_401_C'])assert.deepEqual(liveDisplays(name),['ice1']);
 for(const name of ['BP_ICE10_C','DB_BR4010_C','DB_BR402_C'])assert.deepEqual(liveDisplays(name),[]);
});
test('synthetic ICE 1 telemetry drives mapped speed, force, B and LZB; unknown lamps stay dark',async()=>{
 const {read}=reader(),raw=await collectIce1(read),data=normalizeLive(restrictLiveState(raw,'ice1'));
 assert.equal(raw.provisional,true);assert.equal(raw.partial,true);assert.equal(data.speed,288);assert.equal(data.force,-90);assert.equal(data.sifa,null);
 assert.equal(raw.diagnostics.profile,'ice1');assert.ok(!JSON.stringify(raw.diagnostics).includes('private-session-id'));
 const nodes=new Map([...layout().matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{style:{},setAttribute(k,v){this[k]=v;}}]));
 const svg={querySelector:id=>{assert.ok(nodes.has(id.slice(1)),id);return nodes.get(id.slice(1));}};
 render(svg,data);assert.equal(nodes.get('iceSpeed').textContent,288);assert.equal(nodes.get('iceForceValue').textContent,'-90.0');assert.equal(nodes.get('iceTarget').textContent,216);
 for(const id of ['iceSifa','icePzb85','icePzbHz1000'])assert.equal(nodes.get(id).style.display,'none');
 render(svg,{...data,lzbActive:false});assert.equal(nodes.get('iceLampB').style.display,'');assert.equal(nodes.get('iceTarget').style.display,'none');
 for(const id of ['iceLampB'])assert.equal(nodes.get(id).style.display,'');
 render(svg,normalizeLive({connected:false}));for(const id of ['iceSifa','icePzb85','icePzbHz1000','iceLampB','iceSpeedNeedle','iceForcePointer','iceDistance'])assert.equal(nodes.get(id).style.display,'none');
});
test('ICE 1 unavailable endpoints stay unknown and are retried on the next poll',async()=>{
 const {read,calls}=reader({missing:true}),raw=await collectIce1(read);
 assert.equal(raw.fields.speed.value,288);assert.equal(raw.fields.force.value,null);assert.equal(raw.fields.sifa.value,null);assert.equal(raw.partial,true);
 assert.ok(raw.diagnostics.missing.includes('force'));assert.ok(!('zsOff' in raw.fields));
 calls.length=0;await collectIce1(read);assert.ok(calls.includes('get/CurrentDrivableActor/Simulation/ForceNSummarized.Result'));assert.equal(calls.filter(p=>p.startsWith('list/')).length,0);
});
test('ICE 1 reads advertised display lamps and Sifa, but never controls or arbitrary functions',async()=>{
 const base=reader().read,calls=[];let sifa=true,blink=true;
 const names=['LM_Sifa','LM_55','LM_70','LM_85','LM_1000Hz','LM_500Hz','LM_Befehl40'];
 const read=async route=>{
  calls.push(route);
  if(route==='list/CurrentDrivableActor/DD_Service')return {Endpoints:[...names.map(Name=>({Name:'Property.'+Name,Writable:false})),{Name:'Function.ApplyEmergencyBrake',Writable:false},{Name:'Property.IsSifaPedalPressed',Writable:false},{Name:'Property.SifaWarning',Writable:true}]};
  if(route==='list/CurrentDrivableActor/DD_DataStore')return {Endpoints:[]};
  if(route.includes('/DD_Service.Property.LM_'))return {Values:{Value:route.endsWith('LM_Sifa')?sifa:route.endsWith('LM_85')?blink:false}};
  return base(route);
 };
 let raw=await collectIce1(read),data=normalizeLive(raw);
 assert.equal(data.sifa,true);assert.equal(data.lamps['85'].on,true);assert.equal(data.lamps.Hz500.on,false);
 assert.equal(raw.partial,false);assert.ok(!calls.some(p=>p.startsWith('get/')&&/ApplyEmergencyBrake|IsSifaPedalPressed|SifaWarning/.test(p)));
 sifa=false;blink=false;data=normalizeLive(await collectIce1(read));assert.equal(data.sifa,false);assert.equal(data.lamps['85'].on,false);
 assert.equal(calls.filter(p=>p.startsWith('list/')).length,2);
});
test('ICE 1 display discovery is invalidated on a same-class actor change',async()=>{
 const base=reader().read;let id='one',lists=0;
 const read=async route=>{
  if(route.endsWith('VehicleID'))return {Values:{VehicleID:id}};
  if(route.startsWith('list/')){lists++;return {Endpoints:[]};}
  return base(route);
 };
 await collectIce1(read);await collectIce1(read);assert.equal(lists,2);
 id='two';await collectIce1(read);assert.equal(lists,4);
});
test('ICE 1 rejects conflicting direct display booleans and does not turn pedal activity into a warning',async()=>{
 const base=reader().read;
 const read=async route=>{
  if(route.startsWith('list/'))return {Endpoints:[{Name:'Property.SifaLamp',Writable:false},{Name:'Property.IsSifaActive',Writable:false}]};
  if(route.endsWith('Property.SifaLamp'))return {Values:{Value:route.includes('DD_Service.')}};
  return base(route);
 };
 assert.equal((await collectIce1(read)).fields.sifa.value,null);
});
test('ICE 1 rejects the wrong vehicle and same-class actor switches',async()=>{
 const other=await collectIce1(reader({vehicle:'TEST_BR101_C'}).read);assert.equal(other.supported,false);assert.deepEqual(other.fields,{});
 const base=reader().read;let ids=0;
 await assert.rejects(()=>collectIce1(route=>route.endsWith('VehicleID')?{Values:{VehicleID:++ids===1?'one':'two'}}:base(route)),/Fahrzeugwechsel/);
});
test('ICE 1 rejects incompatible response shapes and old data',async()=>{
 const base=reader().read;
 const raw=await collectIce1(route=>route.includes('/Simulation/')||route.includes('BP_Sifa')?{Values:{Result:'90000',WarningState:'true',EnabledState:true}}:base(route));
 assert.equal(raw.fields.force.value,null);assert.equal(raw.fields.sifa.value,null);
 const stale=restrictLiveState({...raw,updatedAt:1},'ice1',10000);assert.deepEqual(stale.fields,{});assert.deepEqual(stale.availableDisplays,[]);
 const wrong=restrictLiveState(raw,'mfd');assert.equal(wrong.supported,false);assert.deepEqual(wrong.fields,{});
});
