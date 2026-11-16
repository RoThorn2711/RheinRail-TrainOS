import test from 'node:test';
import assert from 'node:assert/strict';
import {layout,render,speedAngle} from './dist/profiles/ice3.js';
import {collectIce3} from './telemetry.mjs';
import {normalizeLive} from './dist/sources.js';
import {liveDisplays,restrictLiveState} from './dist/vehicle-profiles.js';
function screen(){const nodes=new Map([...layout().matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}}]));return {nodes,querySelector:id=>{assert.ok(nodes.has(id.slice(1)),id);return nodes.get(id.slice(1));}};}
test('ICE 3 has no door symbols and demo LZB off clears B, label and target indicators',()=>{
 assert.ok(!/ice3Door/.test(layout()));
 const svg=screen(),n=id=>svg.nodes.get(id),data={demo:true,lzbActive:true,lzbShowDistance:true,lzbDistance:12800,lzbTargetSpeed:200,lamps:{B:{on:true}},forcePercent:50};
 render(svg,data);assert.equal(n('ice3DistanceValue').textContent,12800);assert.equal(n('ice3B').style.display,'');
 render(svg,{...data,lzbActive:false});for(const id of ['ice3B','ice3LzbLabel','ice3Target','ice3Distance','ice3DistanceScale'])assert.equal(n(id).style.display,'none');
 render(svg,{...data,demo:false,lzbActive:false});assert.equal(n('ice3B').style.display,'');
});
test('ICE 3 uses the reference speed spacing and never treats kN as percent',()=>{
 assert.equal(speedAngle(150),135);assert.equal(speedAngle(200),180);assert.equal(speedAngle(400),270);
 const svg=screen();render(svg,{speed:400,force:50});assert.equal(svg.nodes.get('ice3EffortPointer').style.display,'none');
 render(svg,{forcePercent:-100});assert.match(svg.nodes.get('ice3EffortPointer').attrs.transform,/rotate\(-145 /);
});
function reader({percent=true}={}){
 const calls=[];let actor='one',value=55;
 const endpoints=['LZB_GetIsActive','LZB_GetShowLZBDistanceBare','LZB_GetTargetSpeedDistance','LZB_GetExpectedTargetSpeed','LZB_GetMaxPermissibleSpeed'].map(n=>({Name:'Function.'+n,Writable:false}));endpoints.push({Name:'Property.bIsReady',Writable:false});
 const read=async route=>{calls.push(route);
  if(route==='info')return {Meta:{}};
  if(route.endsWith('ObjectClass'))return {Values:{ObjectClass:'RVM_TEST_ICE3_403_C'}};
  if(route.endsWith('VehicleID'))return {Values:{VehicleID:actor}};
  if(route==='list/CurrentDrivableActor')return {Nodes:[{Name:'LZB_Service'},{Name:'DD_Service'}],Endpoints:percent?[{Name:'Property.DisplayedTractiveEffortPercent',Writable:false}]:[]};
  if(route==='list/CurrentDrivableActor/LZB_Service')return {Nodes:[],Endpoints:endpoints};
  if(route==='list/CurrentDrivableActor/DD_Service')return {Endpoints:[{Name:'Property.LM_Sifa',Writable:false},{Name:'Property.LM_85',Writable:false},{Name:'Function.SetPower',Writable:false}]};
  if(route==='list/CurrentDrivableActor/DD_DataStore')return {Endpoints:[]};
  if(route.endsWith('Property.DisplayedTractiveEffortPercent'))return {Values:{Value:value}};
  if(route.includes('DD_Service.Property.LM_'))return {Values:{Value:true}};
  if(route.endsWith('HUD_GetSpeed'))return {Values:{'Speed (ms)':80}};
  if(route==='get/TimeOfDay.Data')return {Values:{LocalTimeISO8601:'2026-11-16T13:20:00Z'}};
  if(route.endsWith('Property.bIsReady'))return {Values:{Value:true}};
  if(route.endsWith('LZB_GetIsActive'))return {Values:{bIsActive:true}};
  if(route.endsWith('LZB_GetShowLZBDistanceBare'))return {Values:{bShowDistance:true}};
  if(route.endsWith('LZB_GetTargetSpeedDistance'))return {Values:{'Distance (m)':12800}};
  if(route.endsWith('LZB_GetExpectedTargetSpeed')||route.endsWith('LZB_GetMaxPermissibleSpeed'))return {Values:{'Speed (ms)':80}};
  throw Error('Unexpected route: '+route);
 };return {read,calls,setActor:v=>actor=v,setPercent:v=>value=v};
}
test('ICE 3 live reads advertised LZB, Sifa, PZB and explicit percentage end to end',async()=>{
 const {read,calls}=reader(),raw=await collectIce3(read),data=normalizeLive(restrictLiveState(raw,'ice3'));
 assert.equal(data.speed,288);assert.equal(data.forcePercent,55);assert.equal(data.sifa,true);assert.equal(data.lamps['85'].on,true);assert.equal(data.lzbDistance,12800);
 assert.deepEqual(raw.diagnostics.missing.filter(n=>n==='forcePercent'),[]);assert.ok(!JSON.stringify(raw.diagnostics).includes('"one"'));
 const svg=screen();render(svg,data);assert.match(svg.nodes.get('ice3EffortPointer').attrs.transform,/rotate\(79.75 /);assert.equal(svg.nodes.get('ice3B').style.display,'');
 assert.ok(!calls.some(p=>p.includes('SetPower')));
 render(svg,normalizeLive({connected:false}));for(const id of ['ice3SpeedNeedle','ice3EffortPointer','ice3Sifa','ice3B','ice3Pzb85','ice3Distance'])assert.equal(svg.nodes.get(id).style.display,'none');
});
test('ICE 3 unknown or invalid percentage remains empty instead of kN fallback',async()=>{
 const unknown=await collectIce3(reader({percent:false}).read);assert.equal(unknown.fields.forcePercent.value,null);assert.ok(unknown.diagnostics.missing.includes('forcePercent'));
 const r=reader();r.setPercent(200000);assert.equal((await collectIce3(r.read)).fields.forcePercent.value,null);
});
test('ICE 3 actor switches abort the sample and wrong profiles cannot expose its data',async()=>{
 const r=reader();let n=0;
 await assert.rejects(()=>collectIce3(route=>route.endsWith('VehicleID')?{Values:{VehicleID:++n===1?'one':'two'}}:r.read(route)),/Fahrzeugwechsel/);
 const raw=await collectIce3(reader().read);assert.deepEqual(restrictLiveState(raw,'ice1').fields,{});
 assert.deepEqual(liveDisplays('RVM_DB_BR403_C'),['ice3']);assert.deepEqual(liveDisplays('RVM_DB_BR406_C'),['ice3']);assert.deepEqual(liveDisplays('RVM_DB_BR4030_C'),[]);
});
