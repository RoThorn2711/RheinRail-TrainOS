// One shared rule for server responses, instruments and Navigator navigation.
export function liveDisplays(vehicle){
 if(vehicle==='RVM_CRG_DB_BR101_ETCS_C')return ['mfd'];
 if(vehicle==='RVM_CRG_DB_BR101_C')return ['mfa'];
 // Includes standard and NV class names containing the 145 family number.
 // Actual 145 variant class names still require in-game confirmation.
 if(typeof vehicle==='string'&&/(?:^|[^0-9])145(?:[^0-9]|$)/.test(vehicle))return ['br145'];
 return [];
}
export function restrictLiveState(raw,profile,now=Date.now()){
 const current=raw.connected===true&&Number.isFinite(raw.updatedAt)&&now-raw.updatedAt<=5000;
 const availableDisplays=current?liveDisplays(raw.vehicle):[];
 if(profile&&!availableDisplays.includes(profile))return {...raw,supported:false,fields:{},availableDisplays,message:current?'Für das aktuelle Fahrzeug ist '+(availableDisplays[0]==='mfd'?'nur das BR 101 ETCS MFD':availableDisplays[0]==='mfa'?'nur das BR 101 Expert MFA':availableDisplays[0]==='br145'?'nur das BR 145 MFA':'keine Instrumentenansicht')+' freigegeben.':raw.message};
 return {...raw,availableDisplays};
}
