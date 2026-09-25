const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const sliderDefs={
  temperature:{label:'Temperature',min:0,max:38,step:.5,value:24,unit:'°C'},
  salinity:{label:'Salinity',min:0,max:40,step:.5,value:18,unit:'ppt'},
  dissolvedOxygen:{label:'Dissolved oxygen',min:0,max:14,step:.1,value:6.5,unit:'mg/L'},
  ph:{label:'pH',min:6.5,max:9.2,step:.05,value:8.0,unit:''},
  turbidity:{label:'Turbidity',min:0,max:120,step:1,value:18,unit:'NTU'},
  chlorophyll:{label:'Chlorophyll',min:0,max:80,step:1,value:12,unit:'µg/L'}
};
const defaults={siteType:'deer',startMonth:0,duration:365,initialSize:35,density:100,eventOn:true,eventStart:120,eventDuration:21,eventSeverity:55};
const state={day:0,timer:null,series:[]};
const $=id=>document.getElementById(id);

function buildControls(){
  MONTHS.forEach((m,i)=>$('startMonth').add(new Option(m,i)));
  const root=$('sliders');
  Object.entries(sliderDefs).forEach(([id,d])=>{
    const wrap=document.createElement('div');wrap.className='slider-row';
    wrap.innerHTML=`<div class="slider-head"><span>${d.label}</span><span id="${id}Val">${d.value} ${d.unit}</span></div><input id="${id}" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${d.value}">`;
    root.appendChild(wrap);
    wrap.querySelector('input').addEventListener('input',()=>{updateSliderLabel(id);recompute();});
  });
  Object.assign($('siteType'),{value:defaults.siteType});
  $('startMonth').value=defaults.startMonth;$('duration').value=defaults.duration;$('initialSize').value=defaults.initialSize;$('density').value=defaults.density;
  $('eventOn').checked=defaults.eventOn;$('eventStart').value=defaults.eventStart;$('eventDuration').value=defaults.eventDuration;$('eventSeverity').value=defaults.eventSeverity;
}
function updateSliderLabel(id){const d=sliderDefs[id];$(`${id}Val`).textContent=`${$(id).value} ${d.unit}`;}
function g(x,opt,spread){return Math.exp(-0.5*((x-opt)/spread)**2)}
function stressAndGrowth(day){
  const t=+$('temperature').value,s=+$('salinity').value,o=+$('dissolvedOxygen').value,p=+$('ph').value,tu=+$('turbidity').value,ch=+$('chlorophyll').value,density=+$('density').value;
  const seasonal=1+0.18*Math.sin((2*Math.PI*(day+(+$('startMonth').value)*30-100))/365);
  let suitability=0.22*g(t,24,8)+0.20*g(s,18,11)+0.22*g(o,7,3.3)+0.12*g(p,8.05,.55)+0.10*g(tu,15,35)+0.14*g(ch,15,22);
  const densityPenalty=Math.max(.45,1-0.00055*Math.max(0,density-80));
  let eventPenalty=1, event=false;
  if($('eventOn').checked){const st=+$('eventStart').value,du=+$('eventDuration').value;if(day>=st&&day<st+du){event=true;eventPenalty=1-(+$('eventSeverity').value/100)*.8;}}
  const siteFactor={flow:1.05,deer:1,reef:.94}[$('siteType').value];
  const mmPerDay=Math.max(0,0.105*suitability*seasonal*densityPenalty*eventPenalty*siteFactor);
  const stress=Math.min(100,Math.max(0,(1-suitability)*72+(1-densityPenalty)*35+(event?+$('eventSeverity').value*.7:0)));
  return {mmPerDay,stress,event,suitability};
}
function recompute(){
  const days=+$('duration').value, initial=+$('initialSize').value;
  $('timeline').max=days;$('eventStart').max=days;
  state.series=[];let size=initial;
  for(let d=0;d<=days;d++){const r=stressAndGrowth(d);if(d>0)size+=r.mmPerDay;state.series.push({day:d,size,...r});}
  state.day=Math.min(state.day,days);$('timeline').value=state.day;render();
}
function render(){
  const p=state.series[state.day]||state.series[0]; if(!p)return;
  $('dayMetric').textContent=state.day;$('sizeMetric').textContent=`${p.size.toFixed(1)} mm`;$('growthMetric').textContent=`+${(p.size-state.series[0].size).toFixed(1)} mm`;
  $('conditionMetric').textContent=p.event?'Disturbance':p.stress>55?'High stress':p.stress>30?'Moderate':'Favorable';
  const base=new Date(2026,+$('startMonth').value,1);base.setDate(base.getDate()+state.day);$('dateLabel').textContent=base.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  $('tempStatus').textContent=status(+$('temperature').value,18,30);$('salStatus').textContent=status(+$('salinity').value,8,30);$('doStatus').textContent=(+$('dissolvedOxygen').value<3?'Low':'Adequate');$('stressStatus').textContent=`${p.stress.toFixed(0)} / 100`;
  drawChart();
}
function status(x,lo,hi){return x<lo?'Below preferred':x>hi?'Above preferred':'Within prototype band'}
function drawChart(){
  const c=$('growthChart'),ctx=c.getContext('2d'),W=c.width,H=c.height,pad={l:58,r:20,t:24,b:42};ctx.clearRect(0,0,W,H);
  const arr=state.series,maxD=arr[arr.length-1].day,minY=Math.min(...arr.map(x=>x.size)),maxY=Math.max(...arr.map(x=>x.size)),ySpan=Math.max(5,maxY-minY);
  ctx.strokeStyle='#234653';ctx.lineWidth=1;ctx.font='12px system-ui';ctx.fillStyle='#8fb1b8';
  for(let i=0;i<=4;i++){const y=pad.t+(H-pad.t-pad.b)*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();const val=maxY-ySpan*i/4;ctx.fillText(`${val.toFixed(0)} mm`,7,y+4)}
  for(let i=0;i<=5;i++){const x=pad.l+(W-pad.l-pad.r)*i/5;const d=Math.round(maxD*i/5);ctx.fillText(`${d}d`,x-10,H-16)}
  if($('eventOn').checked){const st=+$('eventStart').value,du=+$('eventDuration').value;const x1=pad.l+(W-pad.l-pad.r)*Math.min(st,maxD)/maxD,x2=pad.l+(W-pad.l-pad.r)*Math.min(st+du,maxD)/maxD;ctx.fillStyle='rgba(255,114,133,.12)';ctx.fillRect(x1,pad.t,Math.max(0,x2-x1),H-pad.t-pad.b)}
  ctx.strokeStyle='#5dd6c7';ctx.lineWidth=3;ctx.beginPath();arr.forEach((v,i)=>{const x=pad.l+(W-pad.l-pad.r)*v.day/maxD,y=H-pad.b-(H-pad.t-pad.b)*(v.size-minY)/ySpan;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  const p=arr[state.day],x=pad.l+(W-pad.l-pad.r)*p.day/maxD,y=H-pad.b-(H-pad.t-pad.b)*(p.size-minY)/ySpan;ctx.fillStyle='#79b8ff';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();
}
function play(){if(state.timer)return;state.timer=setInterval(()=>{const step=+$('speed').value;state.day=Math.min(state.day+step,+$('duration').value);$('timeline').value=state.day;render();if(state.day>=+$('duration').value)pause();},300)}
function pause(){clearInterval(state.timer);state.timer=null}
function reset(){pause();state.day=0;Object.entries(sliderDefs).forEach(([id,d])=>{$(id).value=d.value;updateSliderLabel(id)});$('siteType').value=defaults.siteType;$('startMonth').value=defaults.startMonth;$('duration').value=defaults.duration;$('initialSize').value=defaults.initialSize;$('density').value=defaults.density;$('eventOn').checked=defaults.eventOn;$('eventStart').value=defaults.eventStart;$('eventDuration').value=defaults.eventDuration;$('eventSeverity').value=defaults.eventSeverity;$('eventSeverityVal').textContent=defaults.eventSeverity;recompute()}

buildControls();
['siteType','startMonth','duration','initialSize','density','eventOn','eventStart','eventDuration','eventSeverity'].forEach(id=>$(id).addEventListener(id==='eventOn'?'change':'input',()=>{if(id==='eventSeverity')$('eventSeverityVal').textContent=$(id).value;recompute()}));
$('timeline').addEventListener('input',e=>{state.day=+e.target.value;render()});$('playBtn').onclick=play;$('pauseBtn').onclick=pause;$('resetBtn').onclick=reset;window.addEventListener('resize',drawChart);recompute();
