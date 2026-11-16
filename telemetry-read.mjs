// Shared by BR 101 and ICE 1: the caller supplies the same authenticated GET
// reader. Decode only the declared shape; a failed request remains unknown.
export async function readMappedField(read,mapping,decode){
 const started=Date.now();
 if(!mapping.path)return {value:null,at:started,error:'Noch nicht zugeordnet'};
 try{
  const response=await read('get/'+mapping.path);
  const value=decode(response.Values);
  return {value,at:started,...(value===null?{error:'Antwortformat nicht passend'}:{})};
 }catch{return {value:null,at:started,error:'API-Pfad nicht verfügbar'};}
}
export async function parallelRead(items,run){
 let next=0;
 await Promise.all(Array.from({length:6},async()=>{while(next<items.length)await run(items[next++]);}));
}
