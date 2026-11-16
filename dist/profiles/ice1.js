// ICE 1 presentation demo. Live field assignments have not been verified.
import {distanceY, lampVisible} from './br101.js';
const ink='#e5e6dc', yellow='#eeec73';
const point=(cx,cy,r,a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];
const line=(a,b,c,d,attrs='')=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" ${attrs}/>`;
const text=(x,y,value,size=16,attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${value}</text>`;
export const pzbLamps=[['55','55','#646ff0'],['70','70','#646ff0'],['85','85','#646ff0'],['Hz1000','1000 Hz','#ead568'],['Hz500','500 Hz','#e26461'],['Befehl40','Bef 40',ink]];
export function layout(){
 let s=`<defs><linearGradient id="iceCase" x2="0" y2="1"><stop stop-color="#30302e"/><stop offset="1" stop-color="#161817"/></linearGradient><linearGradient id="iceGlass" x2="0" y2="1"><stop stop-color="#2c3743"/><stop offset="1" stop-color="#37424e"/></linearGradient></defs><rect x="2" y="2" width="1236" height="716" rx="16" fill="url(#iceCase)" stroke="#090b0b" stroke-width="4"/><path d="M620 4V716" stroke="#080a0a" stroke-width="22"/><g id="screen">`;
 for(const x of [100,650]){
  s+=`<rect x="${x-17}" y="24" width="507" height="672" rx="8" fill="#121719" stroke="#090c0d" stroke-width="3"/><rect x="${x}" y="40" width="470" height="640" rx="5" fill="url(#iceGlass)"/><g stroke="#82919a" stroke-opacity=".12" fill="none">`;
  for(const y of [447,505,563,621])s+=line(x+10,y,x+460,y);
  for(let i=0;i<9;i++)s+=line(x+10+i*56,447,x+10+i*56,505);
  s+=`<rect x="${x+10}" y="78" width="450" height="560"/></g>`;
 }
 s+=`<g fill="${ink}" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">`;
 const cx=345,cy=265;
 for(let v=0;v<=400;v+=10){const a=132+v/400*276,[x,y]=point(cx,cy,162,a),[u,w]=point(cx,cy,v%50===0?141:151,a);s+=line(x,y,u,w,`stroke="${ink}" stroke-width="${v%50===0?2:1.4}"`);if(v%50===0){const [tx,ty]=point(cx,cy,122,a);s+=text(tx,ty+6,v,23);}}
 s+=`<circle cx="${cx}" cy="${cy}" r="162" fill="none" stroke="${ink}"/><g id="iceSpeedNeedle"><path d="M338 258L231 393L242 387L352 272Z" fill="${ink}"/></g><circle cx="345" cy="265" r="31" fill="${ink}"/>${text(345,275,'0',25,'id="iceSpeed" fill="#3d4548"')}<path id="icePermitted" d="M224 382l15 13 1-20z" fill="#ee6262"/>${text(345,394,'0',36,`id="iceTarget" fill="${yellow}" font-family="monospace"`)}${text(550,98,'10:05:47',16,'id="iceClockLeft" text-anchor="end"')}`;
 for(const [v,y] of [[4000,105],[3000,133],[2000,161],[1000,189],[750,217],[500,245],[250,273],[100,296],[0,312]])s+=text(139,125+(y-105)*1.18,v,9,'text-anchor="end"');
 for(let y=125;y<=370;y+=5)s+=line(144,y,154,y,`stroke="${ink}" stroke-width="1"`);
 s+=`<rect id="iceDistance" x="158" y="125" width="10" height="245" fill="${yellow}"/>${text(155,112,'',13,`id="iceDistanceValue" fill="${yellow}"`)}${text(128,497,'LZB',13)}<g id="iceLampB"><rect x="161" y="451" width="48" height="52" fill="#646ff0"/>${text(185,493,'B',44,'font-weight="bold"')}</g>`;
 pzbLamps.forEach(([id,label,color],i)=>{const x=216+i*56;s+=`<g id="icePzb${id}"><rect x="${x}" y="451" width="53" height="52" fill="${color}"/>${text(x+26.5,484,label,label.length>3?12:25,`fill="${i<3?ink:'#26313a'}" font-weight="bold"`)}</g>`;});
 s+=`<g id="iceSifa"><rect x="1000" y="451" width="104" height="52" fill="${ink}"/>${text(1052,486,'Sifa',26,'fill="#303a43"')}</g>`;
 const fx=885,fy=265;
 for(let i=-15;i<=15;i++){const a=-90+i/15*145,points=[point(fx,fy,151,a-4),point(fx,fy,151,a+4),point(fx,fy,130,a+4),point(fx,fy,130,a-4)];s+=`<polygon id="iceForceSegment${i}" points="${points.map(p=>p.join(',')).join(' ')}" fill="${ink}"/>`;}
 for(const side of [-1,1])for(let i=side<0?1:0;i<=5;i++){const [x,y]=point(fx,fy,111,-90+side*i/5*145);s+=text(x,y+5,i*(side<0?30:10),16);}
 s+=`${text(fx,fy+6,'kN',18)}<path id="iceForcePointer" d="M877 101L893 101L885 118Z" fill="${yellow}"/>${text(fx,fy+64,'0',20,`id="iceForceValue" fill="${yellow}"`)}${text(844,446,'Bremsen',17)}${text(930,446,'Fahren',17)}${line(888,417,888,458,`stroke="${ink}" stroke-width="4"`)}${text(1095,609,'10:05:47',17,'id="iceClockRight" text-anchor="end"')}</g></g>`;
 for(const x of [55,1185])for(let i=0;i<5;i++)s+=`<circle cx="${x}" cy="${257+i*54}" r="5" fill="#555653"/>`;
 return s;
}
export function render(svg,data){
 const node=id=>svg.querySelector('#'+id),show=(id,on)=>node(id).style.display=on?'':'none';
 const speed=Number.isFinite(data.speed),force=Number.isFinite(data.force),lzb=data.lzbActive===true;
 node('iceSpeed').textContent=speed?Math.round(data.speed):'—';show('iceSpeedNeedle',speed);
 node('iceSpeedNeedle').setAttribute('transform',`rotate(${Math.max(0,Math.min(400,data.speed||0))/400*276} 345 265)`);
 for(const id of ['iceClockLeft','iceClockRight'])node(id).textContent=data.clock||'—';
 const target=lzb&&Number.isFinite(data.lzbTargetSpeed),permitted=lzb&&Number.isFinite(data.lzbPermittedSpeed),distance=lzb&&data.lzbShowDistance===true&&Number.isFinite(data.lzbDistance);
 show('iceTarget',target);node('iceTarget').textContent=target?Math.round(data.lzbTargetSpeed):'';
 show('icePermitted',permitted);node('icePermitted').setAttribute('transform',`rotate(${Math.max(0,Math.min(400,data.lzbPermittedSpeed||0))/400*276} 345 265)`);
 show('iceDistance',distance);show('iceDistanceValue',distance);
 if(distance){const y=125+(distanceY(data.lzbDistance)-105)*1.18;node('iceDistance').setAttribute('y',y);node('iceDistance').setAttribute('height',Math.max(1,369.26-y));node('iceDistanceValue').textContent=Math.round(Math.max(0,data.lzbDistance));}
 show('iceLampB',lampVisible(data.lamps?.B));
 for(const [id] of pzbLamps)show('icePzb'+id,lampVisible(data.lamps?.[id]));
 show('iceSifa',data.sifa===true);
 const f=force?Math.max(-150,Math.min(50,data.force)):0,color=f<0?yellow:'#6578f0';
 show('iceForcePointer',force);node('iceForcePointer').setAttribute('transform',`rotate(${f<0?f/150*145:f/50*145} 885 265)`);
 node('iceForceValue').textContent=force?data.force.toFixed(1):'-';
 for(let i=-15;i<=15;i++)node('iceForceSegment'+i).setAttribute('fill',(f>0&&i>0&&i/15<=f/50)||(f<0&&i<0&&-i/15<=-f/150)?color:ink);
}
