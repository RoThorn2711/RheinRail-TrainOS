import {lampVisible} from './br101.js';
const ink='#d4ddbf';
const point=(x,y,r,a)=>[x+r*Math.cos(a*Math.PI/180),y+r*Math.sin(a*Math.PI/180)];
const text=(x,y,t,size=18,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${t}</text>`;
const line=(x,y,u,v,w=2)=>`<line x1="${x}" y1="${y}" x2="${u}" y2="${v}" stroke="${ink}" stroke-width="${w}"/>`;
const labels=[['','ZS aus','T','Sifa','','','','55','70','85','H','E 40','Ende','B','Ü'],['Elektr. Bremse','HS aus','','Not- bremse','','','','Befehl 40','500 Hz','1000 Hz','G','EL','V 40','S','PZB Stör']];
// Tinted physical lenses stay visible when their illumination is off.
const lensColors={
 blank:{off:'#303333',edge:'#222526',on:'#eee6d2',textOff:'#a5987c',textOn:'#302d26'},
 blue:{off:'#515650',edge:'#3b403d',on:'#55cbf5',textOff:'#aaa18c',textOn:'#f4f5ed'},
 white:{off:'#6c6555',edge:'#514d42',on:'#f2e9d6',textOff:'#252721',textOn:'#36372e'},
 amber:{off:'#785b34',edge:'#59452c',on:'#f6c65c',textOff:'#25251e',textOn:'#302a1b'},
 red:{off:'#603b38',edge:'#452d2c',on:'#f36b60',textOff:'#ac9682',textOn:'#3b231e'},
};
const lensTypes=[
 ['blank','white','amber','white','blank','blank','blank','blue','blue','blue','red','white','amber','blue','blue'],
 ['blank','blank','blank','red','blank','blank','blank','white','red','amber','red','white','white','red','white'],
];
export function layout(){
 let s=`<defs><linearGradient id="case145" x2="0.7" y2="1"><stop stop-color="#272929"/><stop offset=".5" stop-color="#1b1d1e"/><stop offset="1" stop-color="#292b2b"/></linearGradient><radialGradient id="face145"><stop stop-color="#424641"/><stop offset="1" stop-color="#343936"/></radialGradient><radialGradient id="lens145"><stop stop-color="#3a3b38"/><stop offset="1" stop-color="#25282a"/></radialGradient></defs><rect x="3" y="3" width="1234" height="714" rx="10" fill="url(#case145)" stroke="#080909" stroke-width="6"/><g id="screen" font-family="Arial,Helvetica,sans-serif" text-anchor="middle" fill="${ink}">`;
 s=s.replace('</defs>',Object.entries(lensColors).map(([name,c])=>`<radialGradient id="lens145-off-${name}" cx="42%" cy="35%" r="75%"><stop stop-color="${c.off}"/><stop offset="1" stop-color="${c.edge}"/></radialGradient>`).join('')+'</defs>');
 for(const x of [35,1205])for(const y of [35,680])s+=`<circle cx="${x}" cy="${y}" r="17" fill="#45494a" stroke="#101212" stroke-width="4"/><path d="M${x-9} ${y-9}l18 18m-18 0l18-18" stroke="#17191a" stroke-width="3"/>`;
 for(const x of [300,940])s+=`<circle cx="${x}" cy="245" r="185" fill="url(#face145)" stroke="#101212" stroke-width="5"/>`;
 for(let i=-30;i<=30;i++){const a=-90+i*5;const [x,y]=point(300,245,162,a),[u,v]=point(300,245,i%5===0?136:148,a);s+=line(x,y,u,v,i%5===0?3:2);}
 for(const v of [50,100,150]){const [x,y]=point(300,245,121,-90-v);s+=text(x,y+7,v,23);}
 for(const v of [20,40,60,80]){const [x,y]=point(300,245,120,-90+v/85*150);s+=text(x,y+7,v,23);}
 s+=text(300,145,'0',20)+text(300,335,'Traktion',22)+text(263,385,'Bremsen',13)+text(278,401,'kN',13)+text(331,385,'Fahren',13)+text(338,401,'kN/FM',13)+line(300,360,300,425)+text(197,352,'Lok1',12)+text(187,366,'Lok2',12);
 s+=`<path d="M291 168h18l-18 30h18Z" fill="none" stroke="${ink}" stroke-width="2"/><g id="force145"><path d="M297 249L298 77L302 77L303 249Z" fill="#e3ddd1"/><path d="M295 87L300 63L305 87L300 100Z" fill="#e6a064"/></g><circle cx="300" cy="245" r="19" fill="#343737" stroke="#292b2a"/>`;
 for(let v=0;v<=160;v+=5){const a=140+v*1.625;const [x,y]=point(940,245,162,a),[u,w]=point(940,245,v%20===0?135:147,a);s+=line(x,y,u,w,v%20===0?3:2);if(v%20===0){const [tx,ty]=point(940,245,117,a);s+=text(tx,ty+8,v,23);}}
 s+=text(940,345,'km/h',22)+text(880,359,'V-ist',12)+text(880,382,'V-soll',12)+text(1005,374,'V-Ziel',12)+`<path d="M931 164h18l-18 30h18Z" fill="none" stroke="${ink}" stroke-width="2"/><rect x="905" y="355" width="70" height="57" fill="#202321" stroke="#4b4c43"/>`;
 for(let x=909;x<970;x+=22)s+=`<rect x="${x}" y="360" width="17" height="46" fill="#292c28" stroke="#161817"/>`;
 s+=`<g id="permitted145"><path d="M932 58h16l-8 21Z" fill="#e6a064"/></g>`+text(940,390,'',29,'id="target145"')+`<g id="speed145"><path d="M937 250L938 81L942 81L943 250Z" fill="#e3ddd1"/><path d="M935 88L940 67L945 88L940 101Z" fill="#e6a064"/></g><circle cx="940" cy="245" r="19" fill="#343737" stroke="#292b2a"/>`;
 s+=`<rect x="575" y="33" width="126" height="425" fill="#222525" stroke="#131515" stroke-width="3"/><rect x="582" y="43" width="112" height="33" fill="#191c1c"/><rect x="585" y="98" width="19" height="342" fill="#53583d"/><rect id="distance145" x="586" y="440" width="17" height="0" fill="#c5cc82"/>`;
 for(let i=0;i<=80;i++){const y=440-i*4.25;s+=line(607,y,i%10===0?687: i%5===0?659:641,y,1);}
 for(const [v,y] of [[4000,100],[3000,143],[2000,186],[1000,229],[750,272],[500,315],[250,358],[100,401],[0,440]])s+=text(690,y-3,v,21,'text-anchor="end" fill="#c8ccc4"');
 for(let row=0;row<2;row++)for(let i=0;i<15;i++){
  const x=220+i*58,y=535+row*69,label=labels[row][i],parts=label.split(' '),type=lensTypes[row][i],colors=lensColors[type];
  s+=`<circle cx="${x}" cy="${y}" r="26" fill="url(#lens145-off-${type})" stroke="#111415" stroke-width="2"/><circle id="lamp145-${row}-${i}" cx="${x}" cy="${y}" r="24" fill="${colors.on}" opacity="0"/><g id="lamp145-label-${row}-${i}" fill="${colors.textOff}" font-weight="${['55','70','85','B','Ü'].includes(label)?'bold':'normal'}">`;
  parts.forEach((t,j)=>s+=text(x,y+(parts.length===1?6:-2+j*13),t,parts.length===1?19:12));
  s+='</g>';
 }

 for(const x of [105,1138]){s+=`<path d="M${x-15} 538v56a22 22 0 1 0 30 0v-56a22 22 0 1 0-30 0Z" fill="none" stroke="#c3c5c0" stroke-width="4"/>`+text(x,534,'+',26)+text(x,609,'−',26);}
 s+=text(143,569,'Lampen',11)+text(143,584,'Test',11)+text(110,672,'Instrumenten',12)+text(110,689,'Beleuchtung',12)+text(1134,672,'LED-Anzeige',12)+text(1134,689,'Leuchtmelder',12);
 for(const x of [790,910,970,1030])s+=`<circle cx="${x}" cy="665" r="22" fill="#171b1b" stroke="#c4c7c2" stroke-width="4"/><path d="M${x-10} 658q10-12 20 0" fill="none" stroke="#a9ada6" stroke-width="4"/>`;
 return s+'</g>';
}
export function render(svg,data){
 const node=id=>svg.querySelector('#'+id),speed=Math.max(0,Math.min(160,data.speed??0)),force=Math.max(-150,Math.min(85,data.force??0));
 node('speed145').style.display=Number.isFinite(data.speed)?'':'none';
 node('force145').style.display=Number.isFinite(data.force)?'':'none';
 node('speed145').setAttribute('transform',`rotate(${230+speed*1.625} 940 245)`);
 node('force145').setAttribute('transform',`rotate(${force<0?force:force/85*150} 300 245)`);
 node('target145').textContent=data.lzbActive===true&&Number.isFinite(data.lzbTargetSpeed)?Math.round(data.lzbTargetSpeed):'';
 node('distance145').style.display=data.lzbActive===true&&data.lzbShowDistance===true&&Number.isFinite(data.lzbDistance)?'':'none';
 const distance=data.lzbActive?Math.max(0,Math.min(4000,data.lzbDistance??0)):0;
 const ticks=[[0,440],[100,401],[250,358],[500,315],[750,272],[1000,229],[2000,186],[3000,143],[4000,100]];
 let y=440;for(let i=1;i<ticks.length;i++)if(distance<=ticks[i][0]){const [a,ay]=ticks[i-1],[b,by]=ticks[i];y=ay+(by-ay)*(distance-a)/(b-a);break;}
 node('distance145').setAttribute('y',y);node('distance145').setAttribute('height',440-y);
 node('permitted145').style.display=data.lzbActive===true&&Number.isFinite(data.lzbPermittedSpeed)?'':'none';
 if(data.lzbActive===true&&Number.isFinite(data.lzbPermittedSpeed))node('permitted145').setAttribute('transform',`rotate(${230+Math.max(0,Math.min(160,data.lzbPermittedSpeed))*1.625} 940 245)`);
 const keys=[[null,'zsOff','door','sifa',null,null,null,'55','70','85','H','E40','Ende','B','U'],['electricBrake','mainSwitchOff',null,'emergencyBrake',null,null,null,'Befehl40','Hz500','Hz1000','G','EL','V40','S','Stoer']];
 for(let row=0;row<2;row++)for(let i=0;i<15;i++){
  const key=keys[row][i];
  const on=key==='zsOff'||key==='sifa'?data[key]===true:key?lampVisible(data.lamps?.[key]):false;
  node(`lamp145-${row}-${i}`).setAttribute('opacity',on?'1':'0');
  const colors=lensColors[lensTypes[row][i]];node(`lamp145-label-${row}-${i}`).setAttribute('fill',on?colors.textOn:colors.textOff);
 }
}
