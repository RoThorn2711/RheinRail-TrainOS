import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverIce1} from './ice1-discovery.mjs';
function reader(){
 const calls=[];let vehicleId='one';
 const read=async route=>{calls.push(route);
  if(route.endsWith('ObjectClass'))return {Values:{ObjectClass:'RVM_NWB_DB_ICE1_401_0_C'}};
  if(route.endsWith('VehicleID'))return {Values:{VehicleID:vehicleId}};
  if(route==='list/CurrentDrivableActor')return {Nodes:[{Name:'BP_ICE_LZB'},{Name:'../bad'},{Name:'CabDoor'}],Endpoints:[{Name:'Property.SifaWarning',Writable:false},{Name:'Function.SetLZB',Writable:false},{Name:'Property.LZBEnabled',Writable:true}]};
  if(route==='list/CurrentDrivableActor/BP_ICE_LZB')return {Nodes:[],Endpoints:[{Name:'Function.LZB_GetIsActive'},{Name:'Property.B_IsActive',Writable:false},{Name:'Function.EmergencyBrake',Writable:false}]};
  if(route==='get/CurrentDrivableActor.Property.SifaWarning')return {Values:{Value:false,IgnoredSecret:'private'}};
  if(route.endsWith('Function.LZB_GetIsActive'))return {Values:{bIsActive:true}};
  throw Error('Unexpected route');};
 return {read,calls,setId:id=>vehicleId=id};
}
test('ICE 1 discovery records actual components and allowed getter samples without control calls',async()=>{
 const {read,calls}=reader(),report=await discoverIce1(read);
 assert.equal(report.schema,3);assert.equal(report.vehicle,'RVM_NWB_DB_ICE1_401_0_C');assert.equal(report.components.length,2);
 assert.ok(report.samples.some(s=>s.path.endsWith('Function.LZB_GetIsActive')&&s.values.bIsActive===true));
 assert.ok(!calls.some(s=>s.startsWith('get/')&&/SetLZB|EmergencyBrake|Property.LZBEnabled/.test(s)));
 assert.ok(!calls.some(s=>s.includes('../')));assert.ok(!JSON.stringify(report).includes('private'));
});
test('ICE 1 discovery rejects actor changes and incorrect vehicle families',async()=>{
 const base=reader();let n=0;
 await assert.rejects(()=>discoverIce1(route=>route.endsWith('VehicleID')?{Values:{VehicleID:++n===1?'one':'two'}}:base.read(route)),/gewechselt/);
 await assert.rejects(()=>discoverIce1(route=>route.endsWith('ObjectClass')?{Values:{ObjectClass:'BR403_C'}}:base.read(route)),/ICE 1 sitzen/);
});
