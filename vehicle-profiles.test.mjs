import {test} from 'node:test';
import assert from 'node:assert/strict';
import {liveDisplays,restrictLiveState} from './dist/vehicle-profiles.js';
import {normalizeLive} from './dist/sources.js';

test('101 ETCS unlocks only MFD and analogue Expert unlocks only MFA',()=>{
 assert.deepEqual(liveDisplays('RVM_CRG_DB_BR101_ETCS_C'),['mfd']);
 assert.deepEqual(liveDisplays('RVM_CRG_DB_BR101_C'),['mfa']);
 for(const name of ['ICE','BR101','RVM_CRG_DB_BR101_ETCS_FAKE_C',null,undefined])assert.deepEqual(liveDisplays(name),[]);
});
test('145 family recognition covers synthetic standard/NV names but excludes 1145 and 1450',()=>{
 for(const name of ['SYNTHETIC_BR145_C','SYNTHETIC_BR145_NV_C','SYNTHETIC_BR_145_NV_C'])assert.deepEqual(liveDisplays(name),['br145']);
 for(const name of ['SYNTHETIC_BR1145_C','SYNTHETIC_BR1450_C','NV'])assert.deepEqual(liveDisplays(name),[]);
});
test('wrong direct profile requests cannot expose another vehicle display data',()=>{
 for(const [vehicle,allowed] of [['RVM_CRG_DB_BR101_ETCS_C','mfd'],['RVM_CRG_DB_BR101_C','mfa'],['SYNTHETIC_BR145_NV_C','br145']]){
  const raw={connected:true,supported:true,vehicle,updatedAt:10000,fields:{speed:{value:80,at:10000}}};
  for(const requested of ['mfd','mfa','br145']){
   const filtered=restrictLiveState(raw,requested,10000);
   assert.deepEqual(filtered.availableDisplays,[allowed]);
   assert.equal(filtered.supported,requested===allowed);
   const data=normalizeLive(filtered,10000);assert.equal(data.speed,requested===allowed?80:null);
  }
 }
});
test('offline and stale vehicle states unlock no instrument',()=>{
 const raw={connected:true,supported:true,vehicle:'RVM_CRG_DB_BR101_ETCS_C',updatedAt:1,fields:{speed:{value:80,at:1}}};
 assert.deepEqual(restrictLiveState(raw,'mfd',10000).availableDisplays,[]);
 assert.equal(normalizeLive(restrictLiveState(raw,'mfd',10000),10000).status,'DATEN VERALTET');
 assert.deepEqual(restrictLiveState({...raw,connected:false},'mfd',1).availableDisplays,[]);
});
