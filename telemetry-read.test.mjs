import test from 'node:test';
import assert from 'node:assert/strict';
import {readMappedField} from './telemetry-read.mjs';
test('shared 101/ICE reader leaves request policy to the authenticated API reader and retries next sample',async()=>{
 let n=0;const read=async(...args)=>{assert.deepEqual(args,['get/vehicle.value']);if(++n===1)throw Error('Temporary socket reset');return {Values:{Value:42}};};
 const mapping={path:'vehicle.value'},decode=v=>typeof v?.Value==='number'?v.Value:null;
 assert.equal((await readMappedField(read,mapping,decode)).value,null);
 assert.equal((await readMappedField(read,mapping,decode)).value,42);
});
