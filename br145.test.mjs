import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collect145} from './telemetry.mjs';
import {render} from './dist/profiles/br145-mfa.js';
import {normalizeLive} from './dist/sources.js';
const reader=(calls,vehicle='TEST_BR145_C')=>async route=>{calls.push(route);if(route==='info')return {Meta:{}};if(route.endsWith('ObjectClass'))return {Values:{ObjectClass:vehicle}};if(route.endsWith('VehicleID'))return {Values:{VehicleID:'synthetic-actor'}};if(route.endsWith('HUD_GetSpeed'))return {Values:{'Speed (ms)':10}};if(route.endsWith('TimeOfDay.Data'))return {Values:{LocalTimeISO8601:'2026-11-15T12:00:00Z'}};throw Error('Unexpected vehicle component request');};
test('145 probes named optional contracts without inventing missing values and rejects other vehicle families',async()=>{const calls=[];const data=await collect145(reader(calls));assert.equal(data.partial,true);assert.equal(data.fields.speed.value,36);assert.equal(data.fields.clock.value,'12:00:00');assert.equal(data.fields.force.value,null);assert.ok(calls.some(c=>c.includes('/Simulation/')));assert.ok(calls.some(c=>c.includes('MFA_Indicators')));assert.equal(data.provisional,true);assert.ok(data.diagnostics.missing.includes('force'));assert.ok(!JSON.stringify(data.diagnostics).includes('synthetic-actor'));const other=await collect145(reader([],'TEST_BR101_C'));assert.equal(other.supported,false);assert.deepEqual(other.fields,{});});
test('145 rejects a switch between actors of the same class',async()=>{let ids=0;const read=reader([]);await assert.rejects(()=>collect145(route=>route.endsWith('VehicleID')?{Values:{VehicleID:++ids===1?'actor-a':'actor-b'}}:read(route)),/Fahrzeugwechsel/);});
test('145 live never keeps demo needles, lamps or stale values',()=>{const nodes=new Map();const svg={querySelector(id){if(!nodes.has(id))nodes.set(id,{style:{},setAttribute(k,v){this[k]=v;}});return nodes.get(id);}};render(svg,{demo:true,speed:100,force:30,lzbActive:true,lzbDistance:1000,sifa:true,lamps:{B:{on:true}}});assert.equal(nodes.get('#lamp145-0-13').opacity,'1');render(svg,normalizeLive({connected:false}));for(const id of ['#speed145','#force145','#distance145'])assert.equal(nodes.get(id).style.display,'none');assert.equal(nodes.get('#lamp145-0-13').opacity,'0');assert.equal(nodes.get('#target145').textContent,'');const live=normalizeLive({connected:true,supported:true,partial:true,updatedAt:10000,fields:{speed:{value:36,at:9999}}},10000);assert.equal(live.status,'LIVE · TEILDATEN');assert.equal(live.force,null);render(svg,live);assert.equal(nodes.get('#speed145').style.display,'');assert.equal(nodes.get('#force145').style.display,'none');});

import {mappings,indicatorNames} from './telemetry.mjs';
function fullReader(){
 const responses={speed:{'Speed (ms)':20},clock:{LocalTimeISO8601:'2026-11-15T12:00:00Z'},force:{Result:-60000},sifa:{WarningState:true,EnabledState:true},zsOff:{Enabled:0},highBrake:{Result:0},lzbActive:{bIsActive:true},lzbShowDistance:{bShowDistance:true},lzbDistance:{'Distance (m)':2000},lzbTargetSpeed:{'Speed (ms)':20},lzbPermittedSpeed:{'Speed (ms)':30}};
 const routes=new Map(Object.entries(mappings).map(([name,m])=>['get/'+m.path,{Values:responses[name]}]));
 const flags=Object.fromEntries(indicatorNames.map(n=>[n,false]));Object.assign(flags,{B_IsActive:true,'Ü_IsActive':true,'70_IsActive_PZB':true,'1000Hz_IsActive_PZB':true});
 for(const [name,value] of Object.entries(flags))routes.set('get/CurrentDrivableActor/MFA_Indicators.Property.'+encodeURIComponent(name),{Values:{Value:value}});
 const base=reader([]);return async route=>routes.has(route)?routes.get(route):base(route);
}
test('synthetic 145 contracts drive force, Sifa, LZB and named lamps end to end',async()=>{
 const sample=await collect145(fullReader());assert.equal(sample.partial,false);assert.equal(sample.provisional,true);assert.equal(sample.fields.force.value,-60);assert.equal(sample.fields.lzbDistance.value,2000);assert.equal(sample.fields.lzbPermittedSpeed.value,108);
 const data=normalizeLive(sample);assert.equal(data.status,'LIVE · VORLÄUFIG');
 const nodes=new Map(),svg={querySelector(id){if(!nodes.has(id))nodes.set(id,{style:{},setAttribute(k,v){this[k]=v;}});return nodes.get(id);}};
 render(svg,data);assert.equal(nodes.get('#force145').transform,'rotate(-60 300 245)');assert.equal(nodes.get('#target145').textContent,72);assert.equal(nodes.get('#distance145').height,254);assert.equal(nodes.get('#permitted145').transform,'rotate(405.5 940 245)');assert.equal(nodes.get('#lamp145-0-3').opacity,'1');assert.equal(nodes.get('#lamp145-0-13').opacity,'1');assert.equal(nodes.get('#lamp145-1-9').opacity,'1');assert.equal(nodes.get('#lamp145-0-2').opacity,'0');
 render(svg,{});for(const id of ['#force145','#distance145','#permitted145'])assert.equal(nodes.get(id).style.display,'none');assert.equal(nodes.get('#lamp145-0-3').opacity,'0');
});
test('145 unavailable optional paths are cached and reset on a vehicle change',async()=>{
 const calls=[];const base=reader(calls);let vehicleId='one';const read=async route=>route.endsWith('VehicleID')?{Values:{VehicleID:vehicleId}}:base(route);
 await collect145(read);const optionalCalls=calls.filter(c=>c.includes('MFA_Indicators')).length;assert.ok(optionalCalls>0);calls.length=0;
 await collect145(read);assert.equal(calls.filter(c=>c.includes('MFA_Indicators')).length,0);assert.ok(calls.some(c=>c.endsWith('HUD_GetSpeed')));
 vehicleId='two';calls.length=0;await collect145(read);assert.equal(calls.filter(c=>c.includes('MFA_Indicators')).length,optionalCalls);
});
test('145 wrong response shapes and string booleans remain unknown',async()=>{
 const base=reader([]);const data=await collect145(async route=>route.includes('/Simulation/')||route.includes('MFA_Indicators')||route.includes('/LZB.')||route.includes('BP_Sifa')?{Values:{Result:'60000',Value:'true',bIsActive:'true',WarningState:1,EnabledState:true}}:base(route));
 assert.equal(data.fields.force.value,null);assert.equal(data.fields.sifa.value,null);assert.equal(data.fields.lzbActive.value,null);assert.equal(data.fields.lamps.value.B.on,null);assert.equal(data.partial,true);
});
test('missing distance permission and stale LZB cannot light the 145 distance bar',()=>{
 const nodes=new Map(),svg={querySelector(id){if(!nodes.has(id))nodes.set(id,{style:{},setAttribute(k,v){this[k]=v;}});return nodes.get(id);}};
 render(svg,{lzbActive:true,lzbDistance:2000});assert.equal(nodes.get('#distance145').style.display,'none');
 const data=normalizeLive({connected:true,supported:true,partial:true,updatedAt:10000,fields:{lzbActive:{value:true,at:1},lzbDistance:{value:2000,at:1},lzbShowDistance:{value:true,at:1},speed:{value:10,at:9999}}},10000);
 render(svg,data);assert.equal(nodes.get('#distance145').style.display,'none');assert.equal(nodes.get('#permitted145').style.display,'none');
});
