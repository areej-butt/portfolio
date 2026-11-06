// Records Marine Link interactions with CDP screencast -> looping mp4/webm + poster.
const { chromium } = require('playwright'); const fs=require('fs'); const {execFileSync}=require('child_process');
const S=process.env.S, OUTDIR=S+'/vid', W=1280, H=800;
const CURSOR=`(()=>{const c=document.createElement('div');c.id='__cur';c.style.cssText='position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid rgba(33,31,46,.55);z-index:2147483647;pointer-events:none;transition:transform .15s;transform:translate(-100px,-100px)';
document.documentElement.appendChild(c);let x=-100,y=-100;
addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;c.style.transform='translate('+x+'px,'+y+'px)'},true);
addEventListener('mousedown',e=>{c.style.transform='translate('+x+'px,'+y+'px) scale(.75)';const r=document.createElement('div');r.style.cssText='position:fixed;left:'+x+'px;top:'+y+'px;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid rgba(255,255,255,.95);z-index:2147483646;pointer-events:none;transition:transform .55s ease-out,opacity .55s ease-out';document.documentElement.appendChild(r);requestAnimationFrame(()=>{r.style.transform='scale(4)';r.style.opacity='0'});setTimeout(()=>r.remove(),700)},true);
addEventListener('mouseup',()=>{c.style.transform='translate('+x+'px,'+y+'px)'},true);})()`;
async function setup(b){const p=await b.newPage({viewport:{width:W,height:H}});
 await p.goto('https://areej-butt.github.io/marine-link/',{waitUntil:'networkidle',timeout:60000});await p.waitForTimeout(1500);
 await p.evaluate(CURSOR);await p.mouse.move(640,560);return p;}
const center=async(p,sel,filt)=>p.evaluate(([sel,filt])=>{const els=[...document.querySelectorAll(sel)].filter(e=>!filt||(e.getAttribute('aria-label')||e.innerText||'').trim().startsWith(filt));
 const r=els.map(e=>e.getBoundingClientRect()).filter(r=>r.width>4&&r.left>0&&r.right<1280&&r.top>0&&r.bottom<800).sort((a,b)=>Math.abs(a.x+a.width/2-640)-Math.abs(b.x+b.width/2-640))[0];return r&&{x:r.x+r.width/2,y:r.y+r.height/2}},[sel,filt||null]);
async function tap(p,sel,filt,wait=1100){const c=await center(p,sel,filt);if(!c)throw new Error('not found '+sel+' '+filt);await p.mouse.move(c.x,c.y,{steps:22});await p.waitForTimeout(250);await p.mouse.down();await p.waitForTimeout(90);await p.mouse.up();await p.waitForTimeout(wait);}
async function tapText(p,text,wait=1100){const c=await p.evaluate(t=>{const els=[...document.querySelectorAll('body *')].filter(e=>(e.innerText||'').trim().toLowerCase()===t&&e.children.length<4);const r=els.map(e=>e.getBoundingClientRect()).filter(r=>r.width>4&&r.left>0&&r.right<1280&&r.top>0&&r.bottom<800).sort((a,b)=>a.width*a.height-b.width*b.height)[0];return r&&{x:r.x+r.width/2,y:r.y+r.height/2}},text.toLowerCase());if(!c)throw new Error('no text '+text);await p.mouse.move(c.x,c.y,{steps:22});await p.waitForTimeout(250);await p.mouse.down();await p.waitForTimeout(90);await p.mouse.up();await p.waitForTimeout(wait);}
async function scroller(p){return p.evaluateHandle(()=>[...document.querySelectorAll('div')].find(e=>{const c=getComputedStyle(e);return (c.overflowY==='auto'||c.overflowY==='scroll')&&e.scrollHeight>5000}));}
async function glide(p,sc,from,to,ms){await sc.evaluate((e,[from,to,ms])=>new Promise(res=>{const t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/ms);const q=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;e.scrollTop=from+(to-from)*q;k<1?requestAnimationFrame(f):res()};requestAnimationFrame(f)}),[from,to,ms]);}
async function record(name, prep, act){
 const b=await chromium.launch();const p=await setup(b);await prep(p);
 const cdp=await p.context().newCDPSession(p);const frames=[];
 cdp.on('Page.screencastFrame',async f=>{frames.push({d:f.data,t:f.metadata.timestamp});try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId})}catch(e){}});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,everyNthFrame:1,maxWidth:W,maxHeight:H});
 await p.waitForTimeout(400);await act(p);await p.waitForTimeout(300);
 await cdp.send('Page.stopScreencast');await b.close();
 const dir=`${S}/ml/rec-${name}`;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 let list='';frames.forEach((f,i)=>{const fn=`${dir}/${String(i).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.d,'base64'));const dur=i<frames.length-1?Math.max(0.001,frames[i+1].t-f.t):0.04;list+=`file '${fn}'\nduration ${dur.toFixed(4)}\n`;});
 list+=`file '${dir}/${String(frames.length-1).padStart(5,'0')}.jpg'\n`;fs.writeFileSync(dir+'/list.txt',list);
 const raw=`${dir}/raw.mp4`, out=`${OUTDIR}/${name}`;
 execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',dir+'/list.txt','-vf','fps=30,scale=1120:-2:flags=lanczos','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',raw]);
 const dur=parseFloat(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',raw]).toString());
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',raw,'-frames:v','1','-q:v','3',`${out}-poster.jpg`]);
 // loop: crossfade the end back into the first frame
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',raw,'-loop','1','-t','1','-i',`${out}-poster.jpg`,'-filter_complex',`[1:v]scale=1120:700,fps=30,format=yuv420p,setsar=1,settb=1/30[s];[0:v]fps=30,setsar=1,settb=1/30[a];[a][s]xfade=transition=fade:duration=0.7:offset=${(dur-0.7).toFixed(2)},format=yuv420p`,'-c:v','libx264','-preset','slow','-crf','27','-movflags','+faststart','-an',`${out}.mp4`]);
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',`${out}.mp4`,'-c:v','libvpx-vp9','-b:v','0','-crf','40','-row-mt','1','-an',`${out}.webm`]);
 console.log(name,'frames',frames.length,'dur',dur.toFixed(1)+'s');
}
async function enter(p){await tap(p,'button','Start Exploring',1200);await tap(p,'button','Skip tutorial',900);const sc=await scroller(p);await sc.evaluate(e=>e.scrollTo({top:900}));await p.waitForTimeout(1300);}
module.exports={record,tap,tapText,scroller,glide,center};
if (require.main===module) (async()=>{
 const which=process.argv.slice(2);
 const J={
  'ml-hero': [async p=>{await tap(p,'button','Start Exploring',1200);await tap(p,'button','Skip tutorial',900);await p.evaluate(()=>{const c=document.getElementById('__cur');if(c)c.style.display='none'});await p.mouse.move(1279,799);},
    async p=>{const sc=await scroller(p);let at=0;await p.waitForTimeout(1300);
      for (const y of [900,5000,7500,10000,12600,15200]){await glide(p,sc,at,y,1150);at=y;await p.waitForTimeout(1250);} }],
  'ml-card': [async p=>{},
    async p=>{await p.waitForTimeout(1600);await tap(p,'button','Start Exploring',2000);await tap(p,'button','Next tip',1900);await tap(p,'button','Next tip',1900);await tap(p,'button','Next tip',1900);await tap(p,'button','Skip tutorial',1600);}],
  'ml-octopus': [async p=>{await tap(p,'button','Start Exploring',1200);await tap(p,'button','Skip tutorial',900);const sc=await scroller(p);await sc.evaluate(e=>e.scrollTo({top:900}));await p.waitForTimeout(1200);await p.mouse.move(800,620);},
    async p=>{await p.waitForTimeout(500);await tap(p,'img[alt="octopus"]',null,2200);await tapText(p,'tap to flip',2600);await tapText(p,'flip back',1800);await tap(p,'button','Close',1000);}],
  'ml-card-front': [async p=>{await enter(p);await p.mouse.move(820,640);},
    async p=>{await p.waitForTimeout(500);await tap(p,'img[alt="octopus"]',null,3400);await tap(p,'button','Close',1300);}],
  'ml-card-flip': [async p=>{await enter(p);await tap(p,'img[alt="octopus"]',null,1600);await p.mouse.move(760,600);},
    async p=>{await p.waitForTimeout(900);await tapText(p,'tap to flip',2800);await tapText(p,'flip back',2200);}],
  'ml-search-browse': [async p=>{await enter(p);await p.mouse.move(900,300);},
    async p=>{await p.waitForTimeout(400);await tap(p,'button','Search for a creature',1600);await tap(p,'button','Sunlight Zone',1500);await tap(p,'button','Deep Sea',1600);await tap(p,'button','Unexplored',1500);}],
  'ml-search-find': [async p=>{await enter(p);await p.mouse.move(900,300);},
    async p=>{await p.waitForTimeout(400);await tap(p,'button','Search for a creature',1200);const c=await center(p,'input');await p.mouse.move(c.x,c.y,{steps:15});await p.mouse.down();await p.mouse.up();await p.keyboard.type('mahi',{delay:170});await p.waitForTimeout(1300);await tap(p,'button','Mahi',2600);}],
  'ml-map': [async p=>{await enter(p);await p.mouse.move(900,300);},
    async p=>{await p.waitForTimeout(400);await tap(p,'button','Open map',2000);await tap(p,'button','Unexplored',1500);await tap(p,'button','Explored',1500);await tap(p,'button','All',1600);}],
  'ml-quiz': [async p=>{await enter(p);await p.mouse.move(900,300);},
    async p=>{await p.waitForTimeout(400);await tap(p,'button','Open quiz',1700);
      for (let q=0;q<2;q++){const pt=await p.evaluate(()=>{const m=document.body.innerText.match(/Which one is the ([^?]+)\?/i);if(!m)return null;const name=m[1].trim().toLowerCase();const img=[...document.querySelectorAll('img')].find(i=>{const b=i.getBoundingClientRect();return (i.alt||'').toLowerCase()===name&&b.width>40&&b.left>0&&b.right<1280&&b.top>200&&b.bottom<800&&i.closest('[role=button],button')});if(!img)return null;const r=(img.closest('button,[role=button]')||img).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
        if(!pt)break;await p.mouse.move(pt.x,pt.y,{steps:22});await p.waitForTimeout(250);await p.mouse.down();await p.waitForTimeout(90);await p.mouse.up();await p.waitForTimeout(2300);
        const nx=await center(p,'button','next question');if(nx){await tap(p,'button','next question',1500);}}}],
 };
 for (const k of which) await record(k,...J[k]);
})();
