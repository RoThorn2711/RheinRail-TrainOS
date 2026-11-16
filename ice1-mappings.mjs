// Paths confirmed by the user's RVM_NWB_DB_ICE1_401_0_C component listing.
// Values and physical scaling still require comparison while driving.
export const ice1Mappings={
 speed:{path:'CurrentDrivableActor.Function.HUD_GetSpeed',key:'Speed (ms)',unit:'m/s → km/h',kind:'speed'},
 clock:{path:'TimeOfDay.Data',key:'LocalTimeISO8601',unit:'Spielzeit',kind:'clock'},
 force:{path:'CurrentDrivableActor/Simulation/ForceNSummarized.Result',key:'Result',unit:'N → kN; aggregierter Kraftwert, Skalenbezug noch offen',kind:'force'},
 sifa:{path:null,key:null,unit:'Sifa-Meldezustand noch nicht zugeordnet'},
 lzbActive:{path:'CurrentDrivableActor/LZB_Service.Function.LZB_GetIsActive',key:'bIsActive',kind:'boolean'},
 lzbReady:{path:'CurrentDrivableActor/LZB_Service.Property.bIsReady',key:'Value',kind:'boolean'},
 lzbShowDistance:{path:'CurrentDrivableActor/LZB_Service.Function.LZB_GetShowLZBDistanceBare',key:'bShowDistance',kind:'boolean'},
 lzbDistance:{path:'CurrentDrivableActor/LZB_Service.Function.LZB_GetTargetSpeedDistance',key:'Distance (m)',unit:'m',kind:'distance'},
 lzbTargetSpeed:{path:'CurrentDrivableActor/LZB_Service.Function.LZB_GetExpectedTargetSpeed',key:'Speed (ms)',unit:'m/s → km/h',kind:'speed'},
 lzbPermittedSpeed:{path:'CurrentDrivableActor/LZB_Service.Function.LZB_GetMaxPermissibleSpeed',key:'Speed (ms)',unit:'m/s → km/h',kind:'speed'},
};
export function decodeIce1(name,values){
 const m=ice1Mappings[name],v=values?.[m.key];
 if(m.kind==='boolean')return typeof v==='boolean'?v:null;
 if(m.kind==='clock')return typeof v==='string'&&/T\d{2}:\d{2}:\d{2}/.test(v)?v.split('T')[1].slice(0,8):null;
 if(typeof v!=='number'||!Number.isFinite(v))return null;
 if(m.kind==='speed')return name==='speed'?Math.abs(v)*3.6:v>=0?v*3.6:null;
 if(m.kind==='force')return v/1000;
 if(m.kind==='distance')return v>=0?v:null;
 return null;
}
