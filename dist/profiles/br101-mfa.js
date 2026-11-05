import {lampVisible} from './br101.js';

const ink='#a7c3bd',needle='#d5c17a';
const point=(cx,cy,r,a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];
const line=(a,b,c,d,extra='')=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" ${extra}/>`;
const text=(x,y,value,size=17,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${value}</text>`;
const lamps=[
 ['highBrake','hohe Ab-\nbremsung',158,'#e0aa64'],['zsOff','ZS\naus',214,'#e1b27a'],['door','T',270,'#d9b27a'],['sifa','Sifa',326,'#eee3ca'],
 ['55','55',498,'#536aba'],['70','70',554,'#536aba'],['85','85',610,'#536aba'],['H','H',666,'#d46776'],['Befehl40','Bef\n40',722,'#d9d9cc'],['Ende','Ende',778,'#e3bb66'],['B','B',834,'#536aba'],['U','Ü',890,'#536aba'],
 ['Hz1000','1000\nHz',554,'#deb84a',574],['Hz500','500\nHz',610,'#dc5b62',574],['G','G',666,'#dfb447',574],['EL','EL',722,'#dfdfcc',574],['V40','V\n40',778,'#e0dfd4',574],['S','S',834,'#da6269',574],['Stoer','Stör',890,'#f0e5cc',574],
];
export const mfaLampIds=lamps.map(l=>l[0]);
function housing(cx,cy,r){return `<circle cx="${cx}" cy="${cy}" r="${r+16}" fill="#090d0f" stroke="#262b2d" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="${r+7}" fill="url(#mfa-bezel)" stroke="#050709" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#mfa-face)" stroke="#343b36" stroke-width="2"/><path d="M${cx-r*.73} ${cy-r*.69}A${r} ${r} 0 0 1 ${cx+r*.75} ${cy-r*.66}" fill="none" stroke="#9a9e50" stroke-opacity=".65" stroke-width="2"/>`;}
export function layout(){
 let s=`<defs><linearGradient id="mfa-case" x2=".4" y2="1"><stop stop-color="#171c1e"/><stop offset=".5" stop-color="#111719"/><stop offset="1" stop-color="#1d2427"/></linearGradient><radialGradient id="mfa-face"><stop stop-color="#1e2a2c"/><stop offset=".8" stop-color="#182326"/><stop offset="1" stop-color="#10191c"/></radialGradient><linearGradient id="mfa-bezel" x2=".5" y2="1"><stop stop-color="#303638"/><stop offset=".45" stop-color="#101516"/><stop offset="1" stop-color="#292e30"/></linearGradient></defs><rect x="3" y="3" width="1234" height="714" rx="13" fill="url(#mfa-case)" stroke="#30383b" stroke-width="3"/><path d="M4 41H1236 M4 679H1236" stroke="#05090a" stroke-width="4"/><g id="screen">`;
 for(const x of [37,1203])for(const y of [37,680])s+=`<circle cx="${x}" cy="${y}" r="10" fill="#080b0c" stroke="#3b4346"/>${line(x-4,y+4,x+4,y-4,'stroke="#555d60" stroke-width="2"')}`;
 s+=housing(318,257,185)+housing(922,257,185);
 s+=`<g fill="${ink}" stroke="none" font-family="Arial,Helvetica,sans-serif" font-weight="bold" text-anchor="middle">`;
 // Analogue MFA: brake effort on the left, traction per motor on the right.
 for(let i=-30;i<=30;i++){const a=-90+i*5,[x,y]=point(318,257,155,a),[u,v]=point(318,257,i%5===0?136:145,a);s+=line(x,y,u,v,`stroke="${ink}" stroke-width="${i%5===0?3:2}"`);}
 for(let v=50;v<=150;v+=50){const [x,y]=point(318,257,117,-90-v);s+=text(x,y+7,String(v),24);}
 for(let v=20;v<=80;v+=20){const [x,y]=point(318,257,115,-90+v/80*150);s+=text(x,y+7,String(v),24);}
 s+=text(318,105,'0',20)+text(263,380,'kN',16)+text(370,380,'kN/FM',16);
 s+=text(250,300,'Bremsen',11,'transform="rotate(-63 250 300)"')+text(392,294,'Zugkraft',11,'transform="rotate(63 392 294)"');
 s+=`<g id="mfaForceNeedle"><path d="M310 263L316 104L321 104L326 263Z" fill="${needle}" stroke="#ece1ad" stroke-width=".6"/></g><path d="M306 250L330 250L311 276L325 276Z" fill="#171e21" stroke="${ink}" stroke-width="2"/>${text(318,323,'—',21,'id="mfaForceMissing"')}`;
 for(let v=0;v<=260;v+=5){const a=130+v*1.15,[x,y]=point(922,257,155,a),[u,w]=point(922,257,v%10===0?137:145,a);s+=line(x,y,u,w,`stroke="${ink}" stroke-width="${v%10===0?3:2}"`);if(v%50===0){const [tx,ty]=point(922,257,117,a);s+=text(tx,ty+7,String(v),25);}}
 s+=text(922,365,'km/h',18)+text(922,325,'V-soll',13)+text(862,366,'V-ziel',13)+text(980,325,'V-ist',13);
 s+=`<g id="mfaSpeedNeedle"><path d="M916 251L917 109L922 103L927 251L929 266L916 266Z" fill="${needle}"/></g><circle cx="922" cy="257" r="8" fill="#cfbd7b"/>${text(922,214,'—',20,'id="mfaSpeedMissing"')}${text(922,214,'',21,'id="mfaActualValue"')}`;
 // Moving triangular marker for LZB permitted speed, separate from the actual needle.
 s+=`<g id="mfaPermittedMarker"><path d="M916 90L928 90L922 106Z" fill="#dd8762"/></g><g id="mfaTargetSpeed">${text(871,345,'',22,'id="mfaTargetValue" fill="#c5cf81"')}${text(977,303,'',17,'id="mfaPermittedValue" fill="#c5cf81"')}</g>`;
 s+=`<rect x="587" y="91" width="66" height="349" rx="3" fill="#080e10" stroke="#30383a"/>`;
 const marks=[[4000,132],[3000,173],[2000,214],[1000,255],[750,290],[500,325],[250,360],[100,393],[0,423]];
 for(const [value,y] of marks)s+=text(640,y+5,String(value)+(value===0?'m':''),19,'text-anchor="end" fill="#b7c184"');
 for(let y=129;y<=423;y+=5)s+=line(591,y,597,y,'stroke="#8caaa1" stroke-width="1.3"');
 s+=`<g id="mfaDistance"><rect id="mfaDistanceBar" x="600" y="132" width="7" height="291" fill="#b7c962"/>${text(620,113,'',16,'id="mfaDistanceValue" fill="#c0ce76"')}</g>${text(620,274,'—',20,'id="mfaDistanceMissing"')}<circle cx="535" cy="285" r="10" fill="#dbe2d6" stroke="#4a575a" stroke-width="2"/>`;
 s+=`</g><g font-family="Arial,Helvetica,sans-serif" text-anchor="middle"><rect x="98" y="508" width="1044" height="121" fill="#101719" stroke="#303b3f"/>`;
 // Unlit lenses remain visible, as on the physical annunciator panel.
 for(const [id,label,x,color,row=518] of lamps){const y=row;const lines=label.split('\n');s+=`<g id="mfa-lamp-${id}"><rect x="${x}" y="${y}" width="49" height="48" fill="${color}" stroke="#070b0c" stroke-width="3"/><g fill="${['55','70','85','B','U'].includes(id)?'#dfe7ec':'#1d2629'}" font-size="${lines.length>1?14:20}" font-weight="bold">`;lines.forEach((l,i)=>s+=text(x+24.5,y+(lines.length>1?20+i*16:31),l,lines.length>1?13:20));s+='</g></g>';}
 for(const [label,x,y] of [['LM-\nPrüfung',116,538],['Fahren\nBremse',438,594],['Leucht-\nmelder',1064,540],['Leucht-\nmelder',1064,593]]){s+=`<rect x="${x-23}" y="${y-22}" width="47" height="47" fill="#172024" stroke="#354043"/>`;label.split('\n').forEach((t,i)=>s+=text(x,y-2+i*13,t,10,'fill="#839a9c"'));}
 s+=`<rect x="152" y="574" width="49" height="48" fill="#0c1214" stroke="#303b3f"/>${text(176,596,'nicht',10,'fill="#73898c"')}${text(176,611,'belegt',10,'fill="#73898c"')}${text(318,475,'ZUG- / BREMSKRAFT',10,'fill="#6e8386" letter-spacing="2"')}${text(922,475,'GESCHWINDIGKEIT',10,'fill="#6e8386" letter-spacing="2"')}</g></g>`;
 return s;
}
export function mfaDistanceY(m){const ticks=[[0,423],[100,393],[250,360],[500,325],[750,290],[1000,255],[2000,214],[3000,173],[4000,132]],v=Math.max(0,Math.min(4000,m));for(let i=1;i<ticks.length;i++){const [b,yb]=ticks[i],[a,ya]=ticks[i-1];if(v<=b)return ya+(yb-ya)*(v-a)/(b-a);}return 132;}
export function render(svg,data){
 const node=id=>svg.querySelector('#'+id),show=(id,yes)=>node(id).style.display=yes?'':'none';
 const speed=Number.isFinite(data.speed),force=Number.isFinite(data.force);
 show('mfaSpeedNeedle',speed);show('mfaSpeedMissing',!speed);show('mfaForceNeedle',force);show('mfaForceMissing',!force);
 show('mfaActualValue',speed);node('mfaActualValue').textContent=speed?Math.round(data.speed):'';
 // Both needles are drawn vertically before rotation; speed zero sits at 130 degrees.
 if(speed)node('mfaSpeedNeedle').setAttribute('transform',`rotate(${220+Math.min(260,Math.max(0,data.speed))*1.15} 922 257)`);
 if(force){const angle=data.force>=0?Math.min(80,data.force)/80*150:Math.max(-150,data.force);node('mfaForceNeedle').setAttribute('transform',`rotate(${angle} 318 257)`);}
 const lzb=data.lzbActive===true;
 const distance=lzb&&data.lzbShowDistance===true&&Number.isFinite(data.lzbDistance);
 show('mfaDistance',distance);show('mfaDistanceMissing',lzb&&data.lzbShowDistance!==false&&!distance);
 if(distance){const y=mfaDistanceY(data.lzbDistance);node('mfaDistanceBar').setAttribute('y',y);node('mfaDistanceBar').setAttribute('height',423-y);node('mfaDistanceValue').textContent=Math.round(Math.min(4000,data.lzbDistance));}
 show('mfaPermittedMarker',lzb&&Number.isFinite(data.lzbPermittedSpeed));
 if(lzb&&Number.isFinite(data.lzbPermittedSpeed))node('mfaPermittedMarker').setAttribute('transform',`rotate(${220+Math.min(260,data.lzbPermittedSpeed)*1.15} 922 257)`);
 show('mfaTargetSpeed',lzb);node('mfaTargetValue').textContent=lzb&&Number.isFinite(data.lzbTargetSpeed)?Math.round(data.lzbTargetSpeed):'';node('mfaPermittedValue').textContent=lzb&&Number.isFinite(data.lzbPermittedSpeed)?Math.round(data.lzbPermittedSpeed):'';
 for(const [id] of lamps){let on=null;if(['sifa','zsOff','highBrake'].includes(id))on=data[id];else if(id!=='door'){const lamp=data.lamps?.[id];if(lamp?.on!==null&&lamp?.on!==undefined)on=lampVisible(lamp);}node('mfa-lamp-'+id).setAttribute('opacity',on===true?'1':'.2');}
}
