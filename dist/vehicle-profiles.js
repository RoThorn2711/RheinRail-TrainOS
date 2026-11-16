// One shared rule for server responses, instruments and Navigator navigation.
export function isIce3Vehicle(vehicle){return typeof vehicle==='string'&&/(?:^|[^a-z0-9])(?:br[_-]?40[36]|40[36]|ice[_-]?0?3)(?=[^0-9]|$)/i.test(vehicle);}
export function isIceTVehicle(vehicle){return typeof vehicle==='string'&&/(?:^|[^a-z0-9])(?:br[_-]?41[15]|41[15]|ice[_-]?t)(?=[^a-z0-9]|$)/i.test(vehicle);}
export function liveDisplays(vehicle){
 if(isIceTVehicle(vehicle))return ['icet'];
 if(isIce3Vehicle(vehicle))return ['ice3'];
 if(typeof vehicle==='string'&&/(?:^|[^a-z0-9])(?:br[_-]?401|401|ice[_-]?0?1)(?=[^0-9]|$)/i.test(vehicle))return ['ice1'];
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
 if(profile&&!availableDisplays.includes(profile))return {...raw,supported:false,fields:{},availableDisplays,message:current?'Für das aktuelle Fahrzeug ist '+(availableDisplays[0]==='mfd'?'nur das BR 101 ETCS MFD':availableDisplays[0]==='mfa'?'nur das BR 101 Expert MFA':availableDisplays[0]==='br145'?'nur das BR 145 MFA':availableDisplays[0]==='ice1'?'nur das ICE 1 Doppeldisplay':availableDisplays[0]==='ice3'?'nur das ICE 3 Doppeldisplay':availableDisplays[0]==='icet'?'nur das ICE T Doppeldisplay':'keine Instrumentenansicht')+' freigegeben.':raw.message};
 return {...raw,availableDisplays};
}
