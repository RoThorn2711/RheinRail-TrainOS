import {distanceY,lampVisible} from './br101.js';
import {pzbLamps} from './ice1.js';
const white='#e1e3d9',yellow='#ebed77';
const p=(x,y,r,a)=>[x+r*Math.cos(a*Math.PI/180),y+r*Math.sin(a*Math.PI/180)];
const line=(x1,y1,x2,y2,a='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${a}/>`;
const text=(x,y,v,size=18,a='')=>`<text x="${x}" y="${y}" font-size="${size}" ${a}>${v}</text>`;
export function speedAngle(value){const v=Math.max(0,Math.min(400,value));return v<=200?v*.9:180+(v-200)*.45;}
export function layout(){
 let s=`<defs><linearGradient id="ice3Case" x2="0" y2="1"><stop stop-color="#292a27"/><stop offset="1" stop-color="#171a18"/></linearGradient><linearGradient id="ice3Glass" x2="0" y2="1"><stop stop-color="#41474d"/><stop offset="1" stop-color="#4a515a"/></linearGradient></defs><rect x="2" y="2" width="1236" height="896" rx="14" fill="url(#ice3Case)" stroke="#0c0e0d" stroke-width="4"/>`;
 for(const x of [65,655])s+=`<rect x="${x}" y="25" width="520" height="840" rx="13" fill="#181b1a" stroke="#090c0a" stroke-width="3"/><rect x="${x+40}" y="125" width="440" height="650" fill="url(#ice3Glass)"/>`;
 s+='<g id="screen">';
 // Separate display glasses and their unused lower annunciator grids.
 for(const x of [105,695]){
  s+=`<rect x="${x}" y="125" width="440" height="650" fill="url(#ice3Glass)"/><g stroke="#c0c8ca" stroke-opacity=".13" fill="none">`;
  for(const y of [540,610,675,725])s+=line(x+8,y,x+430,y);
  for(let i=0;i<7;i++)s+=line(x+8+i*60,540,x+8+i*60,610);
  s+=`<rect x="${x+8}" y="165" width="420" height="560"/></g>`;
 }
 s+=`<g fill="${white}" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">`;
 const cx=365,cy=365,r=169;
 const start=p(cx,cy,r,135),end=p(cx,cy,r,405);
 s+=`<path d="M${start.join(' ')}A${r} ${r} 0 1 1 ${end.join(' ')}" fill="none" stroke="${white}" stroke-width="1.5"/>`;
 for(let v=0;v<=400;v+=10){const a=135+speedAngle(v),major=[0,50,100,150,200,300,400].includes(v),[x,y]=p(cx,cy,r,a),[u,w]=p(cx,cy,major?146:155,a);s+=line(x,y,u,w,`stroke="${white}" stroke-width="${major?2.6:1.6}"`);if(major){const [tx,ty]=p(cx,cy,127,a);s+=text(tx,ty+8,v,26);}}
 s+=`<g id="ice3SpeedNeedle"><path d="M358 358L239 491L252 484L372 372Z" fill="${white}"/></g><circle cx="365" cy="365" r="28" fill="${white}"/>${text(365,376,'0',25,'id="ice3Speed" fill="#3b4447"')}${text(532,186,'10:40:42',17,'id="ice3ClockLeft" text-anchor="end"')}<path id="ice3Permitted" d="M237 479l17 16 1-21z" fill="#ef6561"/>${text(365,505,'0',30,`id="ice3Target" fill="${yellow}" font-family="monospace"`)}`;
 s+='<g id="ice3DistanceScale">';
 for(const [v,y] of [[4000,105],[3000,133],[2000,161],[1000,189],[750,217],[500,245],[250,273],[100,296],[0,312]])s+=text(148,240+(y-105)*1.08,v,9,'text-anchor="end"');
 for(let y=240;y<465;y+=5)s+=line(153,y,162,y,`stroke="${white}"`);
 s+=`</g><rect id="ice3Distance" x="166" y="240" width="9" height="224" fill="${yellow}"/>${text(151,224,'',13,`id="ice3DistanceValue" fill="${yellow}"`)}${text(132,601,'LZB',14,'id="ice3LzbLabel"')}<g id="ice3B"><rect x="173" y="550" width="53" height="58" fill="#626bf0"/>${text(199.5,597,'B',47,'font-weight="bold"')}</g>`;
 pzbLamps.forEach(([id,label,color],i)=>{const x=231+i*50;s+=`<g id="ice3Pzb${id}"><rect x="${x}" y="550" width="48" height="58" fill="${color}"/>${text(x+24,586,label,label.length>3?11:25,`fill="${i<3?white:'#303b42'}" font-weight="bold"`)}</g>`;});
 const fx=860,fy=355;
 for(let i=-14;i<=14;i++){const a=-90+i/14*145,points=[p(fx,fy,146,a-4.4),p(fx,fy,146,a+4.4),p(fx,fy,122,a+4.4),p(fx,fy,122,a-4.4)];s+=`<polygon id="ice3Effort${i}" points="${points.map(x=>x.join(',')).join(' ')}" fill="${white}"/>`;}
 for(const side of [-1,1])for(let i=side<0?1:0;i<=5;i++){const [x,y]=p(fx,fy,105,-90+side*i/5*145);s+=text(x,y+5,i*20,17);}
 s+=`${text(fx,fy+6,'%',20)}<path id="ice3EffortPointer" d="M852 191L868 191L860 207Z" fill="${yellow}"/>${text(fx,fy+66,'',18,`id="ice3EffortValue" fill="${yellow}"`)}${text(819,494,'Bremsen',15)}${text(901,494,'Fahren',15)}${line(862,462,862,508,`stroke="${white}" stroke-width="4"`)}<g id="ice3Sifa"><rect x="1023" y="617" width="100" height="58" fill="${white}"/>${text(1073,655,'Sifa',26,'fill="#354047"')}</g>`;
 s+=`${text(728,700,'320',18,'id="ice3MaxSpeed"')}${text(1119,700,'10:40:42',18,'id="ice3ClockRight" text-anchor="end"')}</g></g>`;
 for(const x of [33,1207])for(let i=0;i<5;i++)s+=`<circle cx="${x}" cy="${395+i*42}" r="5.5" fill="${i===1?'#e18b54':'#50534d'}"/>`;
 return s;
}
export function render(svg,data){
 const node=id=>svg.querySelector('#'+id),show=(id,on)=>node(id).style.display=on?'':'none';
 const speed=Number.isFinite(data.speed),lzb=data.lzbActive===true;
 node('ice3Speed').textContent=speed?Math.round(data.speed):'-';show('ice3SpeedNeedle',speed);
 node('ice3SpeedNeedle').setAttribute('transform',`rotate(${speedAngle(data.speed||0)} 365 365)`);
 for(const id of ['ice3ClockLeft','ice3ClockRight'])node(id).textContent=data.clock||'-';
 const target=lzb&&Number.isFinite(data.lzbTargetSpeed),permitted=lzb&&Number.isFinite(data.lzbPermittedSpeed),distance=lzb&&data.lzbShowDistance===true&&Number.isFinite(data.lzbDistance);
 show('ice3Target',target);node('ice3Target').textContent=target?Math.round(data.lzbTargetSpeed):'';
 show('ice3Permitted',permitted);node('ice3Permitted').setAttribute('transform',`rotate(${speedAngle(data.lzbPermittedSpeed||0)} 365 365)`);
 show('ice3Distance',distance);show('ice3DistanceValue',distance);show('ice3DistanceScale',distance);
 if(distance){const y=240+(distanceY(data.lzbDistance)-105)*1.08;node('ice3Distance').setAttribute('y',y);node('ice3Distance').setAttribute('height',Math.max(1,463.56-y));node('ice3DistanceValue').textContent=Math.round(data.lzbDistance);}
 const ready=lampVisible(data.lamps?.B),showB=ready&&(data.demo!==true||lzb);
 show('ice3B',showB);show('ice3LzbLabel',lzb||showB);for(const [id] of pzbLamps)show('ice3Pzb'+id,lampVisible(data.lamps?.[id]));show('ice3Sifa',data.sifa===true);
 // Never render the ICE 1's kN field as percent. Only an explicit percentage.
 const known=Number.isFinite(data.forcePercent),f=known?Math.max(-100,Math.min(100,data.forcePercent)):0,color=f<0?yellow:'#6578ed';
 show('ice3EffortPointer',known);node('ice3EffortPointer').setAttribute('transform',`rotate(${f/100*145} 860 355)`);
 node('ice3EffortValue').textContent=known?Math.round(f):'-';
 for(let i=-14;i<=14;i++)node('ice3Effort'+i).setAttribute('fill',(f>0&&i>0&&i/14<=f/100)||(f<0&&i<0&&-i/14<=-f/100)?color:white);
 node('ice3MaxSpeed').textContent=data.demo===true?'320':Number.isFinite(data.vehicleMaxSpeed)?Math.round(data.vehicleMaxSpeed):'';
}
