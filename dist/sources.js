export class DemoSource{
 constructor(){this.speed=0;this.force=0;this.sifa=true;this.start=Date.now();}
 async read(){const d=new Date(Date.UTC(2000,0,1,10,0,25)+(Date.now()-this.start));return {demo:true,speed:this.speed,force:this.force,sifa:this.sifa,zsOff:true,highBrake:true,lamps:Object.fromEntries(['55','70','85','B','U','Ende','E40','V40','H','EL','Befehl40','Hz1000','Hz500','G','S','Stoer'].map(n=>[n,{on:['85','B','U'].includes(n),flash:false,inverted:false}])),clock:d.toISOString().slice(11,19),status:'DEMO',message:'Demo-Modus · alle Werte sind simuliert.'};}
}
export function normalizeLive(raw,now=Date.now()){
 const data={demo:false,speed:null,force:null,sifa:null,zsOff:null,highBrake:null,clock:null,lamps:null,lzbActive:null,lzbShowDistance:null,lzbDistance:null,lzbTargetSpeed:null,lzbPermittedSpeed:null,status:'VERBINDUNG…',message:raw.message||'Warte auf TSW',raw};
 if(!raw.connected){data.status=raw.pending?'VERBINDUNG…':'OFFLINE';return data;}
 if(!raw.supported){data.status='ANDERES FAHRZEUG';return data;}
 for(const name of ['speed','force','sifa','zsOff','highBrake','clock','lamps','lzbActive','lzbShowDistance','lzbDistance','lzbTargetSpeed','lzbPermittedSpeed']){const f=raw.fields?.[name];if(f&&now-f.at<=5000)data[name]=f.value;}
 data.status=now-raw.updatedAt>5000?'DATEN VERALTET':'LIVE';return data;
}
export class LiveSource{async read(){const res=await fetch('/api/state',{cache:'no-store',signal:AbortSignal.timeout(4000)});if(!res.ok)throw Error('Adapter nicht erreichbar');return normalizeLive(await res.json());}}
