import test from 'node:test';
import assert from 'node:assert/strict';
import {layout,render} from './dist/profiles/ice1.js';
import {liveDisplays} from './dist/vehicle-profiles.js';
import {DemoSource} from './dist/sources.js';
test('ICE 1 demo drives Sifa and selectable PZB lamps including flashing',async()=>{
 const svg=screen(),demo=new DemoSource();demo.sifa=true;demo.pzbType='70';demo.pzbExtra={Hz1000:true};
 render(svg,await demo.read());const n=id=>svg.nodes.get(id);
 assert.equal(n('iceSifa').style.display,'');assert.equal(n('icePzb70').style.display,'');assert.equal(n('icePzb85').style.display,'none');assert.equal(n('icePzbHz1000').style.display,'');
 demo.sifa=false;demo.pzbType='off';demo.pzbExtra={};render(svg,await demo.read());
 for(const id of ['iceSifa','icePzb70','icePzbHz1000'])assert.equal(n(id).style.display,'none');
 demo.pzbFlash=true;demo.pzbType='55';assert.equal((await demo.read()).lamps['55'].flash,true);
 render(svg,{});assert.equal(n('iceSifa').style.display,'none');
});
function screen(){const nodes=new Map([...layout().matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{style:{},attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v;}}]));return {nodes,querySelector(s){assert.ok(nodes.has(s.slice(1)),s);return nodes.get(s.slice(1));}};}
test('ICE 1 demo reaches 400 km/h and both asymmetric force endpoints',()=>{
 const svg=screen(),n=id=>svg.nodes.get(id);
 render(svg,{speed:400,force:50,clock:'10:05:47'});
 assert.equal(n('iceSpeed').textContent,400);assert.match(n('iceSpeedNeedle').attrs.transform,/rotate\(276 /);
 assert.match(n('iceForcePointer').attrs.transform,/rotate\(145 /);
 render(svg,{speed:0,force:-150});assert.match(n('iceForcePointer').attrs.transform,/rotate\(-145 /);
});
test('ICE 1 LZB requires active guidance and missing values remain blank',()=>{
 const svg=screen(),n=id=>svg.nodes.get(id),data={lzbActive:true,lzbShowDistance:true,lzbDistance:1000,lzbTargetSpeed:280,lzbPermittedSpeed:300,lamps:{B:{on:true}}};
 render(svg,data);assert.equal(n('iceTarget').textContent,280);assert.equal(n('iceLampB').style.display,'');assert.equal(n('iceDistance').style.display,'');
 render(svg,{});for(const id of ['iceTarget','icePermitted','iceDistance','iceLampB','iceSpeedNeedle','iceForcePointer'])assert.equal(n(id).style.display,'none');
 assert.equal(n('iceSpeed').textContent,'—');assert.deepEqual(liveDisplays('ICE_1_C'),['ice1']);
});
