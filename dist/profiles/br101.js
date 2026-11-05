// Presentation profile only. No assumption that other vehicles expose these data.
export const br101 = {id:'br101',name:'BR 101 Expert',speedMax:260,tractionMax:70,brakeMax:140};
export const colors={blue:'#5b67ee',yellow:'#edf06b',white:'#e6e9e5',idle:'#e1e5e4'};
export const forceColor=f=>Number.isFinite(f)&&f>0?colors.blue:Number.isFinite(f)&&f<0?colors.yellow:colors.idle;
export function distanceY(m){const ticks=[[0,312],[100,296],[250,273],[500,245],[750,217],[1000,189],[2000,161],[3000,133],[4000,105]];const v=Math.max(0,Math.min(4000,m));for(let i=1;i<ticks.length;i++){const [b,yb]=ticks[i],[a,ya]=ticks[i-1];if(v<=b)return ya+(yb-ya)*(v-a)/(b-a);}return 105;}
function digitalNumber(value,cx,y,height){const str=String(Math.round(value)),w=height*.48,gap=height*.18;const digits=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];const coords={a:[0,0,w,0],b:[w,0,w,height/2],c:[w,height/2,w,height],d:[0,height,w,height],e:[0,height/2,0,height],f:[0,0,0,height/2],g:[0,height/2,w,height/2]};return `<g stroke="${colors.yellow}" stroke-width="${height*.09}" stroke-linecap="square">`+[...str].map((d,i)=>{const x=cx-(str.length*(w+gap)-gap)/2+i*(w+gap);return [...(digits[Number(d)]||'')].map(s=>{const [a,b,c,e]=coords[s];return line(x+a,y+b,x+c,y+e);}).join('');}).join('')+'</g>';}
const rad=a=>a*Math.PI/180;
const p=(x,y,r,a)=>[x+r*Math.cos(rad(a)),y+r*Math.sin(rad(a))];
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const text=(x,y,s,size=16,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${s}</text>`;
function key(x,y,w,h,label){return `<g class="frame-key" aria-hidden="true"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="url(#key)" stroke="#91a4b2" stroke-width="3"/>${text(x+9,y+23,label,17,'fill="#91a4b2"')}</g>`;}
export const lampLayout=[['55','55',65,345,49,57,colors.blue],['70','70',114,345,49,57,colors.blue],['85','85',163,345,49,57,colors.blue],['Hz1000','1000 Hz',212,345,49,57,'#f2df62'],['Hz500','500 Hz',261,345,49,57,'#e85e5d'],['Befehl40','Bef 40',310,345,49,57,'#e6e9e5'],['G','G',359,345,50,57,'#f2df62'],...['U','B','Ende','E40','V40','H','EL','S','Stoer'].map((n,i)=>[n,n==='U'?'Ü':n==='Stoer'?'Stör':n,65+i*74.2,404,74.2,37,['B','U'].includes(n)?colors.blue:n==='S'?'#e85e5d':n==='Stoer'?'#f2df62':'#e6e9e5'])];
export function layout(){
 let s=`<defs><linearGradient id="case" x2=".8" y2="1"><stop stop-color="#35434e"/><stop offset=".5" stop-color="#202c36"/><stop offset="1" stop-color="#34434f"/></linearGradient><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#202a35"/><stop offset="1" stop-color="#344151"/></linearGradient><linearGradient id="key" x2=".5" y2="1"><stop stop-color="#202a34"/><stop offset="1" stop-color="#2c3945"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity=".65"/></filter></defs><rect x="2" y="2" width="1236" height="796" rx="9" fill="url(#case)" stroke="#46555e" stroke-width="2"/><path d="M35 0V800 M1205 0V800" stroke="#ffffff05" stroke-width="25"/>`;
 for(const x of [30,1210])for(const y of [33,767])s+=`<circle cx="${x}" cy="${y}" r="13" fill="#080c0f" stroke="#3b4850"/>`;
 const top=['☼','', 'i','St','V &gt; 0','V = 0','☀','◐','UD']; top.forEach((v,i)=>{s+=key(269+i*76,25,58,53,v)});
 for(let i=0;i<10;i++)s+=key(270+i*76,718,58,53,String((i+1)%10));
 [['C',125,57],['▲',220,57],['▼',315,57],['E',410,146],['•',625,57]].forEach(([v,y,h])=>s+=key(1080,y,58,h,v));
 s+=`<rect x="244" y="103" width="819" height="596" fill="#10161b" stroke="#50606c" stroke-width="3"/><svg id="screen" x="250" y="109" width="807" height="584" viewBox="0 0 807 584"><rect width="807" height="584" fill="url(#glass)"/><g fill="none" stroke="#d6d9d6" stroke-width="1.2"><rect x="1" y="1" width="805" height="582"/>${line(65,0,65,508)}${line(410,0,410,508)}${line(0,344,807,344)}${line(0,403,807,403)}${line(65,442,733,442)}${line(65,477,807,477)}${line(0,508,807,508)}${line(733,344,733,508)}${line(0,64,65,64)}${line(0,316,65,316)}`;
 for(let i=0;i<10;i++)s+=line(65+i*48,344,65+i*48,403);
 for(let i=0;i<10;i++)s+=line(10+i*80,508,10+i*80,584);
 for(let y=382;y<508;y+=42)s+=line(0,y,65,y);
 s+=`</g><g fill="#e7e9e6" font-family="Arial,Helvetica,sans-serif" font-weight="bold" text-anchor="middle">`;
 // 0 at lower left; tick labels match the reference's 50 km/h intervals.
 for(let v=0;v<=260;v+=5){let a=120+v/260*312;let [x,y]=p(237,170,143,a);let [u,w]=p(237,170,v%10===0?131:136,a);s+=line(x,y,u,w,'stroke="#e2e5e3" stroke-width="2.5"');if(v>0&&v%50===0){let [tx,ty]=p(237,170,111,a);s+=text(tx,ty+6,String(v),17);}}
 s+=`<g id="speedNeedle"><path d="M228 165L166 293L178 282L245 173Z" fill="#e7e9e6"/></g><circle cx="237" cy="170" r="30" fill="#e7e9e6"/>${text(237,180,'000',26,'id="speedValue" fill="#29333d" font-weight="normal"')}${text(389,23,'10:00:25',18,'id="clock" text-anchor="end"')}<path id="permittedMarker" d="M151 304l16 7-1-19z" fill="#f35e68"/>`;
 // Bipolar traction/braking scale: each half has its own unit range.
 for(let i=-14;i<=14;i++){let a=-90+i/14*145;let [x,y]=p(599,168,150,a-4.5),[u,v]=p(599,168,150,a+4.5),[j,k]=p(599,168,116,a+4.5),[l,m]=p(599,168,116,a-4.5);s+=`<path id="force-segment-${i}" d="M${x} ${y}L${u} ${v}L${j} ${k}L${l} ${m}Z" fill="#e1e5e4"/>`;}
 for(let i=0;i<=7;i++){for(const side of [-1,1]){if(i===0&&side===-1)continue;let [x,y]=p(599,168,98,-90+side*i/7*145);s+=text(x,y+5,String(i*(side<0?20:10)),16);}}
 s+=text(599,177,'kN',20)+text(565,318,'Bremsen',14)+text(656,308,'Zugkraft',14)+text(656,326,'pro FM',14)+line(603,280,603,331,'stroke="#e7e9e6" stroke-width="5"')+`<path id="forcePointer" d="M590 0L607 0L599 17Z" fill="#f35e68"/>${text(599,226,'—',25,'id="forceMissing" fill="#e7e9e6"')}${text(599,225,'0.0',21,'id="forceValue" fill="#e7e9e6"')}`;
 for(const [id,label,x,y,w,h,color] of lampLayout)s+=`<g id="lamp-${id}"><rect x="${x+1}" y="${y}" width="${w-2}" height="${h}" fill="${color}"/>${text(x+w/2,y+h/2+6,label,label.length>4?11:18,`fill="${['55','70','85','B','U'].includes(id)?colors.white:'#25313d'}"`)}</g>`;
 for(const [id,label,x,y,w,h] of [['B','B',65,345,49,57],['U','Ü',114,345,49,57],['55','55',139.2,404,74.2,37],['70','70',65,404,74.2,37]])s+=`<g id="lamp-lzb-${id}"><rect x="${x+1}" y="${y}" width="${w-2}" height="${h}" fill="${colors.blue}"/>${text(x+w/2,y+h/2+7,label,22,`fill="${colors.white}"`)}</g>`;
 s+=`<g id="zsLamp"><rect x="411" y="345" width="47" height="57" fill="#e6e9e5"/>${text(434,369,'ZS',20,'fill="#2d3741"')}${text(434,391,'aus',20,'fill="#2d3741"')}</g><g id="highLamp"><rect x="506" y="345" width="48" height="57" fill="#e6e9e5"/>${text(530,359,'hohe',12,'fill="#2d3741"')}${text(530,373,'Ab-',12,'fill="#2d3741"')}${text(530,386,'brem-',12,'fill="#2d3741"')}${text(530,399,'sung',12,'fill="#2d3741"')}</g><g id="sifaLamp"><rect x="734" y="345" width="72" height="57" fill="#e6e9e5"/>${text(770,379,'Sifa',21,'fill="#3f4531" font-weight="normal"')}</g>${text(770,380,'—',20,'id="sifaMissing"')}${text(434,380,'—',20,'id="zsMissing"')}${text(530,380,'—',20,'id="highMissing"')}`;
 s+=`<image id="rainrailLogo" x="738" y="458" width="65" height="34" href="/assets/rainrail-logo.svg" preserveAspectRatio="xMidYMid meet"/><g font-weight="normal" text-anchor="end">`;
 const distances=[['4000',105],['3000',133],['2000',161],['1000',189],['750',217],['500',245],['250',273],['100',296],['0',312]];distances.forEach(([v,y])=>s+=text(38,y,v,12));for(let y=101;y<316;y+=5)s+=line(43,y,50,y,'stroke="#e0e5e3"');s+=`<g id="lzbDistance"><rect id="distanceBar" x="54" y="105" width="9" height="207" fill="${colors.yellow}"/><g id="distanceValue"></g></g><g id="lzbTargetValue"></g>${text(35,333,'—',16,'id="distanceMissing"')}</g></g></svg>`;
 for(let i=0;i<3;i++)s+=`<circle cx="158" cy="${118+i*24}" r="9" fill="#152029" stroke="#41515e"/>`;
 for(const x of [110,190,1153])s+=`<g fill="none" stroke="#95aab8" stroke-width="2.5"><circle cx="${x}" cy="748" r="22"/><circle cx="${x}" cy="748" r="10"/>${line(x-17,748,x+17,748)}${line(x,731,x,738)}${line(x,758,x,765)}</g>`;
 return s;
}
export function lampVisible(lamp,now=Date.now()){if(lamp?.on!==true)return false;if(lamp.flash!==true)return true;const phase=Math.floor(now/500)%2===0;return lamp.inverted===true?!phase:phase;}
export function render(svg,data){
 const node=id=>svg.querySelector('#'+id);
 const set=(id,value)=>node(id).textContent=value;
 const show=(id,yes)=>node(id).style.display=yes?'':'none';
 set('speedValue',Number.isFinite(data.speed)?String(Math.round(data.speed)).padStart(3,'0'):'—');
 show('speedNeedle',Number.isFinite(data.speed));
 node('speedNeedle').setAttribute('transform',`rotate(${Math.min(260,Math.max(0,data.speed||0))/260*312} 237 170)`);
 set('clock',data.clock||'—:—:—');
 const knownForce=Number.isFinite(data.force),f=knownForce?data.force:0,color=forceColor(data.force);
 show('forceMissing',!knownForce);show('forceValue',knownForce);show('forcePointer',knownForce);
 set('forceValue',knownForce?f.toFixed(1):'');node('forceValue').setAttribute('fill',color);
 node('forcePointer').setAttribute('fill',color);
 node('forcePointer').setAttribute('transform',`rotate(${f<0?Math.max(-140,f)/140*145:Math.min(70,f)/70*145} 599 168)`);
 for(let i=-14;i<=14;i++){const lit=f>0?i>0&&i/14<=Math.min(f/70,1):f<0?i<0&&-i/14<=Math.min(-f/140,1):false;node('force-segment-'+i).setAttribute('fill',lit?color:colors.idle);}
 for(const [id,val] of [['sifa',data.sifa],['zs',data.zsOff],['high',data.highBrake]]){show(id+'Lamp',val===true);show(id+'Missing',val===null||val===undefined);}
 const lzb=data.lzbActive===true;
 for(const [id] of lampLayout){show('lamp-'+id,!(lzb&&['B','U','55','70'].includes(id))&&lampVisible(data.lamps?.[id]));}
 // Reuse the primary blue-lamp cells while LZB is guiding the train.
 for(const id of ['B','U','55','70'])show('lamp-lzb-'+id,lzb&&lampVisible(data.lamps?.[id]));
 const distance=lzb&&data.lzbShowDistance===true&&Number.isFinite(data.lzbDistance);
 show('lzbDistance',distance);show('distanceMissing',lzb&&data.lzbShowDistance!==false&&!distance);
 if(distance){const y=distanceY(data.lzbDistance);node('distanceBar').setAttribute('y',y);node('distanceBar').setAttribute('height',312-y);node('distanceValue').innerHTML=digitalNumber(Math.min(4000,data.lzbDistance),32,78,14);}
 const target=lzb&&Number.isFinite(data.lzbTargetSpeed);
 show('lzbTargetValue',target);if(target)node('lzbTargetValue').innerHTML=digitalNumber(data.lzbTargetSpeed,237,280,29);
 const permitted=lzb&&Number.isFinite(data.lzbPermittedSpeed);
 show('permittedMarker',permitted);if(permitted)node('permittedMarker').setAttribute('transform',`rotate(${Math.min(260,Math.max(0,data.lzbPermittedSpeed))*1.2} 237 170)`);
}
