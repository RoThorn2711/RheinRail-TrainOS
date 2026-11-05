export const ranges=[2000,5000,10000,20000];
export const validDistance=n=>Number.isFinite(n)&&n>=0;
export function positionFor(distance,range,width){return 24+distance*(Math.max(100,width-48)/range);}
export function axisTicks(domain,range){const step=range<=2000?250:range<=5000?500:range<=10000?1000:2000;return Array.from({length:Math.floor(domain/step)+1},(_,i)=>({distance:i*step,label:i===0?'0':(i*step/1000).toLocaleString('de-DE',{maximumFractionDigits:2})+' km'}));}
export function prepareEvents(events){return (events||[]).filter(e=>['signal','speed','station'].includes(e.kind)&&validDistance(e.distance)).slice().sort((a,b)=>a.distance-b.distance);}
export function speedSections(data){
 const grouped=new Map();for(const e of prepareEvents(data.events)){if(e.kind!=='speed'||!['TrackRuleSpeedLimit','TrackPropertySpeedLimit'].includes(e.restriction)||!Number.isFinite(e.speed))continue;const values=grouped.get(e.distance)||new Set();values.add(e.speed);grouped.set(e.distance,values);}
 let start=0,speed=Number.isFinite(data.trackSpeed)?data.trackSpeed:null;const result=[];
 for(const [end,values] of [...grouped].sort((a,b)=>a[0]-b[0])){if(end>start&&speed!==null)result.push({start,end,speed,source:'API-Grenzen',derived:true});start=end;speed=values.size===1?[...values][0]:null;}
 // No extrapolation beyond the final reported boundary, and no HUD/LZB value as track speed.
 return result;
}
export function speedColor(speed){return speed<=60?'#b9866c':speed<=120?'#baab65':speed<=160?'#70a990':speed<=230?'#659ab4':'#8d8cc1';}
