import test from 'node:test';
import assert from 'node:assert/strict';
import {layout,render,speedAngle} from './dist/profiles/icet.js';
import {collectIceT} from './telemetry.mjs';
import {liveDisplays,restrictLiveState} from './dist/vehicle-profiles.js';
import {normalizeLive} from './dist/sources.js';
function screen(){const nodes=new Map([...layout().matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}}]));return {nodes,querySelector:id=>{assert.ok(nodes.has(id.slice(1)),id);return nodes.get(id.slice(1));}};}
test('ICE T dial reaches 240, has no menu tabs and preserves full LZB distance',()=>{
 assert.equal(speedAngle(120),135);assert.equal(speedAngle(240),270);assert.ok(!/Haupt|Daten ansehen|Spezial|<button/.test(layout()));
 const svg=screen();render(svg,{demo:true,speed:240,lzbActive:true,lzbShowDistance:true,lzbDistance:12800,forcePercent:100,gntActive:true,lamps:{B:{on:true}}});
 assert.equal(svg.nodes.get('icetSpeed').textContent,240);assert.equal(svg.nodes.get('icetDistanceValue').textContent,12800);assert.equal(svg.nodes.get('icetGnt').style.display,'');assert.match(svg.nodes.get('icetSpeedNeedle').attrs.transform,/rotate\(270 /);
 render(svg,{demo:true,lzbActive:false,lamps:{B:{on:true}}});for(const id of ['icetB','icetLzbLabel','icetDistance','icetTarget'])assert.equal(svg.nodes.get(id).style.display,'none');
});
test('ICE T never renders kN as percent and clears unknown lamps',()=>{
 const svg=screen();render(svg,{force:80,lamps:{GNT:{on:true}},sifa:true});assert.equal(svg.nodes.get('icetEffortPointer').style.display,'none');assert.equal(svg.nodes.get('icetGnt').style.display,'');
 render(svg,normalizeLive({connected:false}));for(const id of ['icetSpeedNeedle','icetEffortPointer','icetSifa','icetGnt'])assert.equal(svg.nodes.get(id).style.display,'none');
});
test('ICE T recognises 411/415 and keeps its live data separate',async()=>{
 for(const vehicle of ['RVM_DB_BR411_C','RVM_DB_415_C','RVM_ICE_T_C'])assert.deepEqual(liveDisplays(vehicle),['icet']);
 assert.deepEqual(liveDisplays('RVM_DB_BR4110_C'),[]);assert.deepEqual(liveDisplays('RVM_ICE3_C'),['ice3']);
 const read=async route=>{
  if(route==='info')return {};
  if(route.endsWith('ObjectClass'))return {Values:{ObjectClass:'RVM_TEST_ICE_T_411_C'}};
  if(route.endsWith('VehicleID'))return {Values:{VehicleID:'private-actor'}};
  if(route==='list/CurrentDrivableActor')return {Nodes:[{Name:'DD_Service'}],Endpoints:[{Name:'Property.DisplayedTractiveEffortPercent',Writable:false}]};
  if(route==='list/CurrentDrivableActor/DD_Service')return {Endpoints:[{Name:'Property.LM_GNT',Writable:false}]};
  if(route==='list/CurrentDrivableActor/DD_DataStore')return {Endpoints:[]};
  if(route.endsWith('HUD_GetSpeed'))return {Values:{'Speed (ms)':40}};
  if(route==='get/TimeOfDay.Data')return {Values:{LocalTimeISO8601:'2026-11-16T10:52:42Z'}};
  if(route.endsWith('Property.DisplayedTractiveEffortPercent'))return {Values:{Value:-60}};
  if(route.endsWith('Property.LM_GNT'))return {Values:{Value:true}};
  throw Error('Unexpected route');
 };
 const raw=await collectIceT(read),data=normalizeLive(restrictLiveState(raw,'icet'));
 assert.equal(data.speed,144);assert.equal(data.forcePercent,-60);assert.equal(data.lamps.GNT.on,true);assert.ok(!JSON.stringify(raw.diagnostics).includes('private-actor'));
 assert.deepEqual(restrictLiveState(raw,'ice3').fields,{});
 const svg=screen();render(svg,data);assert.equal(svg.nodes.get('icetGnt').style.display,'');assert.match(svg.nodes.get('icetEffortPointer').attrs.transform,/rotate\(-87 /);
});
