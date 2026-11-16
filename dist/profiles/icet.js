import {distanceY,lampVisible} from './br101.js';
import {pzbLamps} from './ice1.js';
const white='#e4e5db',yellow='#ece76c';
const point=(x,y,r,a)=>[x+r*Math.cos(a*Math.PI/180),y+r*Math.sin(a*Math.PI/180)];
const line=(x1,y1,x2,y2,attrs='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
const text=(x,y,value,size=18,attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${value}</text>`;
export const speedAngle=v=>Math.max(0,Math.min(240,v))/240*270;
export function layout(){
 let s=`<defs><linearGradient id="icetCase" x2="0" y2="1"><stop stop-color="#454740"/><stop offset="1" stop-color="#34362f"/></linearGradient><linearGradient id="icetGlass" x2="0" y2="1"><stop stop-color="#42453e"/><stop offset="1" stop-color="#50534b"/></linearGradient></defs><rect x="2" y="2" width="1236" height="896" rx="5" fill="url(#icetCase)"/><g id="screen">`;
 for(const x of [30,650])s+=`<rect x="${x}" y="12" width="558" height="876" fill="url(#icetGlass)" stroke="#181b17" stroke-width="6"/><g stroke="#b7bca9" stroke-opacity=".07" fill="none"><rect x="${x+10}" y="540" width="538" height="300"/>${line(x+10,610,x+548,610)}${line(x+10,680,x+548,680)}${line(x+10,750,x+548,750)}</g>`;
 s+=`<g fill="${white}" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">`;
 const cx=350,cy=310;
 for(let v=0;v<=240;v+=5){const a=135+speedAngle(v),major=v%20===0,[x,y]=point(cx,cy,190,a),[u,w]=point(cx,cy,major?164:176,a);s+=line(x,y,u,w,`stroke="${white}" stroke-width="${major?2:1.4}"`);if(major){const [tx,ty]=point(cx,cy,146,a);s+=text(tx,ty+7,v,25);}}
 s+=`<g id="icetSpeedNeedle"><path d="M344 304L215 445L227 438L356 316Z" fill="${white}"/></g><circle cx="350" cy="310" r="37" fill="${white}"/>${text(367,324,'0',29,'id="icetSpeed" fill="#3b4037" font-weight="bold"')}${text(565,90,'10:52:42',19,'id="icetClockLeft" text-anchor="end"')}<path id="icetPermitted" d="M205 436l16 15 1-22z" fill="#ed6b66"/>${text(370,440,'0',37,`id="icetTarget" fill="${yellow}" font-family="monospace"`)}<g id="icetDistanceScale">`;
 for(const [v,y] of [[4000,105],[3000,133],[2000,161],[1000,189],[750,217],[500,245],[250,273],[100,296],[0,312]])s+=text(92,170+(y-105)*1.47,v,10,'text-anchor="end"');
 for(let y=170;y<=475;y+=5)s+=line(98,y,109,y,`stroke="${white}"`);
 s+=`</g><rect id="icetDistance" x="114" y="170" width="12" height="305" fill="${yellow}"/>${text(99,151,'',16,`id="icetDistanceValue" fill="${yellow}"`)}<g id="icetLzbLabel"><rect x="45" y="546" width="91" height="39" fill="none" stroke="${white}"/>${text(90,574,'LZB',17,'font-style="italic" font-weight="bold"')}</g><g id="icetB"><rect x="138" y="546" width="65" height="78" fill="#6263d3"/>${text(170,599,'B',40,'font-weight="bold"')}</g>`;
 pzbLamps.forEach(([id,label,color],i)=>{const x=208+i*60;s+=`<g id="icetPzb${id}"><rect x="${x}" y="546" width="57" height="78" fill="${color}"/>${text(x+28.5,593,label,label.length>3?13:29,`fill="${i<3?white:'#30392e'}" font-weight="bold"`)}</g>`;});
 const fx=880,fy=310;
 for(let i=-14;i<=14;i++){const a=-90+i/14*145,pts=[point(fx,fy,177,a-4.3),point(fx,fy,177,a+4.3),point(fx,fy,149,a+4.3),point(fx,fy,149,a-4.3)];s+=`<polygon id="icetEffort${i}" points="${pts.map(p=>p.join(',')).join(' ')}" fill="${white}"/>`;}
 for(const side of [-1,1])for(let i=side<0?1:0;i<=5;i++){const [x,y]=point(fx,fy,127,-90+side*i/5*145);s+=text(x,y+6,i*20,20);}
 s+=`${text(fx,fy+6,'%',24)}<path id="icetEffortPointer" d="M870 116L890 116L880 136Z" fill="${yellow}"/>${text(fx,fy+73,'',20,`id="icetEffortValue" fill="${yellow}"`)}${text(828,469,'Bremsen',19)}${text(935,469,'Fahren',19)}${line(883,432,883,487,`stroke="${white}" stroke-width="4"`)}<g id="icetGnt"><rect x="1010" y="546" width="82" height="80" fill="#636ba1"/>${text(1051,596,'GNT',25,'font-weight="bold"')}</g><g id="icetSifa"><rect x="1000" y="650" width="105" height="57" fill="${white}"/>${text(1052,688,'Sifa',26,'fill="#3b4338"')}</g>${text(1110,752,'10:52:42',22,'id="icetClockRight" text-anchor="end"')}</g></g>`;
 return s;
}
export function render(svg,data){
 const node=id=>svg.querySelector('#'+id),show=(id,on)=>node(id).style.display=on?'':'none';
 const known=Number.isFinite(data.speed),lzb=data.lzbActive===true;
 node('icetSpeed').textContent=known?Math.round(data.speed):'-';show('icetSpeedNeedle',known);node('icetSpeedNeedle').setAttribute('transform',`rotate(${speedAngle(data.speed||0)} 350 310)`);
 for(const id of ['icetClockLeft','icetClockRight'])node(id).textContent=data.clock||'-';
 const target=lzb&&Number.isFinite(data.lzbTargetSpeed),permitted=lzb&&Number.isFinite(data.lzbPermittedSpeed),distance=lzb&&data.lzbShowDistance===true&&Number.isFinite(data.lzbDistance);
 show('icetTarget',target);node('icetTarget').textContent=target?Math.round(data.lzbTargetSpeed):'';
 show('icetPermitted',permitted);node('icetPermitted').setAttribute('transform',`rotate(${speedAngle(data.lzbPermittedSpeed||0)} 350 310)`);
 for(const id of ['icetDistance','icetDistanceScale','icetDistanceValue'])show(id,distance);
 if(distance){const y=170+(distanceY(data.lzbDistance)-105)*1.47;node('icetDistance').setAttribute('y',y);node('icetDistance').setAttribute('height',Math.max(1,474.29-y));node('icetDistanceValue').textContent=Math.round(data.lzbDistance);}
 const b=lampVisible(data.lamps?.B)&&(data.demo!==true||lzb);show('icetB',b);show('icetLzbLabel',lzb||b);
 for(const [id] of pzbLamps)show('icetPzb'+id,lampVisible(data.lamps?.[id]));
 show('icetSifa',data.sifa===true);show('icetGnt',data.demo===true?data.gntActive===true:lampVisible(data.lamps?.GNT));
 const effort=Number.isFinite(data.forcePercent),f=effort?Math.max(-100,Math.min(100,data.forcePercent)):0,color=f<0?yellow:'#6f78d8';
 show('icetEffortPointer',effort);node('icetEffortPointer').setAttribute('transform',`rotate(${f/100*145} 880 310)`);node('icetEffortValue').textContent=effort?Math.round(f):'-';
 for(let i=-14;i<=14;i++)node('icetEffort'+i).setAttribute('fill',(f>0&&i>0&&i/14<=f/100)||(f<0&&i<0&&-i/14<=-f/100)?color:white);
}
