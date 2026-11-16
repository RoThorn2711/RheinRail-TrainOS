// The two display components are present in the user's component listing.
// Resolve only advertised, read-only properties. Function calls are never
// inferred from names. Exact lamp aliases avoid confusing controls with lamps.
const normalize=s=>s.replace(/[^a-z0-9]/gi,'').toLowerCase();
const directAliases={
 GNT:['GNTLamp','GNTLight','LM_GNT','LeuchtmelderGNT'],
 sifa:['SifaWarning','SifaWarningIndicator','SifaLamp','SifaLight','LM_Sifa','LeuchtmelderSifa'],
 B:['LampB','LightB','LM_B','LeuchtmelderB','LZBReadyLamp'],
 '55':['Lamp55','Light55','LM_55','Leuchtmelder55','PZB55Lamp'],
 '70':['Lamp70','Light70','LM_70','Leuchtmelder70','PZB70Lamp'],
 '85':['Lamp85','Light85','LM_85','Leuchtmelder85','PZB85Lamp'],
 Hz1000:['Lamp1000Hz','Light1000Hz','LM_1000Hz','Leuchtmelder1000Hz','PZB1000HzLamp'],
 Hz500:['Lamp500Hz','Light500Hz','LM_500Hz','Leuchtmelder500Hz','PZB500HzLamp'],
 Befehl40:['LampBefehl40','LightBefehl40','LM_Befehl40','LeuchtmelderBefehl40','PZBBefehl40Lamp'],
};
const direct=new Map(Object.entries(directAliases).flatMap(([id,aliases])=>aliases.map(alias=>[normalize(alias),id])));
export async function discoverIndicatorProperties(read,names,options={}){
 const found=[],components=[];
 const paths=['CurrentDrivableActor/DD_Service','CurrentDrivableActor/DD_DataStore'];
 if(options.gnt){
  paths.push('CurrentDrivableActor','CurrentDrivableActor/MFA_Indicators');
  try{const root=await read('list/CurrentDrivableActor');for(const n of root.Nodes||[]){if(typeof n.Name==='string'&&/^[a-zA-Z0-9_ -]+$/.test(n.Name)&&/gnt/i.test(n.Name))paths.push('CurrentDrivableActor/'+n.Name);}}catch{}
 }
 for(const path of [...new Set(paths)]){
  try{
   const response=await read('list/'+path);
   if(!Array.isArray(response.Endpoints))throw Error('Format');
   const endpoints=response.Endpoints.filter(e=>e.Writable===false&&typeof e.Name==='string'&&/^Property\.[a-zA-Z0-9_ÄÖÜäöüß -]+$/.test(e.Name));
   components.push({path,properties:endpoints.map(e=>e.Name)});
   for(const e of endpoints){
    const property=e.Name.slice(9),id=direct.get(normalize(property));
    const descriptor={path:path+'.'+encodeURIComponent(e.Name),property};
    const display=/\/(?:DD_Service|DD_DataStore|MFA_Indicators)$/.test(path)||/gnt.*(?:lamp|light|indicator|leucht)|(?:lamp|light|indicator|leucht).*gnt/i.test(path);
    const gntFlag=display?({gnt:'on',gntisactive:'on',gntison:'on',gntisflashing:'flash',gntisinhibited:'inhibit'})[normalize(property)]:undefined;
    if(options.gnt&&gntFlag)found.push({...descriptor,kind:'gntFlag',aspect:gntFlag,id:'GNT'});
    else if(names.includes(property))found.push({...descriptor,kind:'flag'});
    else if(id)found.push({path:path+'.'+encodeURIComponent(e.Name),property,id,kind:'direct'});
   }
  }catch{components.push({path,error:'Komponentenliste nicht verfügbar'});}
 }
 return {found,components};
}
export const displayedLampIds=['B','55','70','85','Hz1000','Hz500','Befehl40'];
