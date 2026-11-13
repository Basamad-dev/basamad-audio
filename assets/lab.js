(()=>{
const C=window.LAB,$=s=>document.querySelector(s),css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const sel={};C.controls.forEach(c=>sel[c.id]=c.options[0].v);
const opt=(c,v)=>c.options.find(o=>o.v===v);
const key=(o=sel)=>{const ig=[];C.controls.forEach(c=>{const p=opt(c,o[c.id]);if(p&&p.ig)ig.push(...p.ig)});return C.controls.map(c=>ig.includes(c.id)?'x':o[c.id]).join('_')};
const path=k=>`audio/${C.dir}/${k}.${C.ext||'wav'}`;
let ctx,an,cur,buf={},t0=0,dur=8,tok=0,met=null,fd;
$('#chain').innerHTML=C.chain.map(s=>`<span>${s}</span>`).join('<em>›</em>');
C.controls.forEach(c=>{const d=document.createElement('div');d.className='ctl';d.innerHTML=`<b>${c.label}</b><div class="seg"></div>`;
 c.options.forEach(o=>{const b=document.createElement('button');b.textContent=o.l;b.dataset.c=c.id;b.dataset.v=o.v;
  b.onclick=()=>{sel[c.id]=o.v;mark();change()};d.lastChild.append(b)});$('#controls').append(d)});
function mark(){const sc=opt(C.controls[0],sel[C.controls[0].id]);
 C.controls.forEach(c=>{const vis=c.options.filter(o=>!o.sc||o.sc.includes(sel[C.controls[0].id]));if(!vis.some(o=>o.v===sel[c.id]))sel[c.id]=vis[0].v});
 document.querySelectorAll('#controls button').forEach(b=>{const c=C.controls.find(c=>c.id===b.dataset.c),o=opt(c,b.dataset.v);
  b.hidden=!!(o.sc&&!o.sc.includes(sel[C.controls[0].id]));b.setAttribute('aria-pressed',sel[b.dataset.c]===b.dataset.v)});
 polar(sc);showMetrics()}
function polar(sc){const sv=$('#polar');if(!sc.src){sv.parentNode.hidden=true;return}
 const tg=C.target&&sel[C.target];
 let h='<circle class="g" cx="110" cy="110" r="90"/><circle class="g" cx="110" cy="110" r="45"/><path class="g" d="M110 20V200M20 110H200"/><rect x="92" y="108" width="36" height="5" fill="currentColor"/>';
 sc.src.forEach(s=>{const a=s.a*Math.PI/180,x=110+78*Math.sin(a),y=110-78*Math.cos(a),t=tg?s.l===tg:s.t;
  h+=`<circle cx="${x}" cy="${y}" r="7" fill="${t?css('--ac'):css('--wr')}"/><text x="${x}" y="${y+(y<60?20:-12)}" text-anchor="middle">${s.l} ${s.a}°</text>`});
 sv.innerHTML=h}
function showMetrics(){const m=met&&met[key()];$('#metrics').innerHTML=m?'<table>'+Object.entries(m).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')+'</table>':'<p class="small">No measurements stored for this setting. Add them to metrics.json.</p>'}
fetch(`audio/${C.dir}/metrics.json`).then(r=>r.ok?r.json():null).then(j=>{met=j;showMetrics()}).catch(()=>{});
function ph(k){const p=k.split('_');let n=0;C.controls.forEach((c,i)=>{const o=opt(c,p[i]);n+=o&&o.n||0});
 const sr=ctx.sampleRate,L=sr*8,b=ctx.createBuffer(1,L,sr),d=b.getChannelData(0);let s=1;
 for(let i=0;i<L;i++){const t=i/sr,f=110+25*Math.sin(6.28*.4*t),e=Math.max(0,Math.sin(6.28*1.6*t))**2;let v=0;
  for(let h=1;h<12;h++)v+=Math.sin(6.28*f*h*t)/h*Math.exp(-((h*f-700)**2)/4e5);
  s=(s*16807)%2147483647;d[i]=.25*e*v+n*.15*(s/2147483647-.5)}return b}
async function get(k,pre){if(buf[k])return buf[k];
 try{const r=await fetch(path(k));if(!r.ok)throw 0;return buf[k]=await ctx.decodeAudioData(await r.arrayBuffer())}
 catch(e){if(pre)return null;const b=buf[k]=ph(k);b.ph=1;return b}}
function note(b){$('#note').textContent=b.ph?`Placeholder signal. No file found at ${path(key())}`:path(key())}
function fade(b){const now=ctx.currentTime,pos=cur?(now-t0)%dur:0;dur=b.duration;t0=now-pos;
 const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;s.loop=true;s.connect(g);g.connect(an);
 g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(1,now+.03);s.start(0,pos%dur);
 if(cur){const o=cur;o.g.gain.cancelScheduledValues(now);o.g.gain.setValueAtTime(1,now);o.g.gain.linearRampToValueAtTime(0,now+.03);o.s.stop(now+.04)}
 cur={s,g}}
async function change(){if(!ctx||!cur)return;const my=++tok,b=await get(key());if(my!==tok)return;fade(b);note(b)}
async function prefetch(){if(buf[key()].ph)return;for(const c of C.controls)for(const o of c.options)await get(key({...sel,[c.id]:o.v}),1)}
const cv=$('#spec'),g=cv.getContext('2d');cv.width=900;cv.height=230;g.fillStyle='#060F1E';g.fillRect(0,0,900,230);
function draw(){requestAnimationFrame(draw);if(ctx.state!=='running')return;
 const W=900,H=230,n=an.frequencyBinCount,top=Math.round(8000/(ctx.sampleRate/2)*n);fd=fd||new Float32Array(n);an.getFloatFrequencyData(fd);
 g.drawImage(cv,-2,0);
 for(let y=0;y<H;y++){const v=fd[Math.floor((1-y/H)*top)],t=Math.max(0,Math.min(1,(v+100)/70));g.fillStyle=`hsl(${215-t*30},90%,${5+t*65}%)`;g.fillRect(W-2,y,2,1)}
 $('#pos').style.width=((ctx.currentTime-t0)%dur)/dur*100+'%'}
function label(){$('#play').textContent=ctx&&ctx.state==='running'?'Pause':'Play'}
$('#play').onclick=async()=>{
 if(!ctx){ctx=new AudioContext();an=ctx.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=.3;an.connect(ctx.destination);
  $('#play').textContent='Loading…';const b=await get(key());fade(b);note(b);draw();prefetch()}
 else if(ctx.state==='running')await ctx.suspend();else await ctx.resume();label()};
mark();
})();
