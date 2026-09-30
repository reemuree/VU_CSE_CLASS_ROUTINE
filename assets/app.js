(()=>{
const $=s=>document.querySelector(s),app=$('#app');
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WK=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const LBL={live:['🔵','ONGOING'],today:['🔴','TODAY'],tomorrow:['🟠','TOMORROW'],soon:['🟢','UPCOMING'],done:['✓','COMPLETED']};
const NAV=[['home','🏠','Home'],['routine','📝','Routine'],['calendar','📅','Calendar'],['search','🔍','Search'],['settings','⚙️','Settings']];
const ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch(e){return null}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const hm24=t=>{let[h,m]=t.split(':').map(Number);if(h>=1&&h<=7)h+=12;return{h,m}}; // routine.json stores afternoon hours 1-7 without +12
const mins=t=>{const{h,m}=hm24(t);return h*60+m};
const f12=t=>{const{h,m}=hm24(t);return(h%12||12)+':'+pad(m)+' '+(h<12?'AM':'PM')};
const now=()=>Date.now()+6*36e5; // Dhaka wall clock in UTC fields
const t0=()=>{const d=new Date(now());return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())};
let D,slots={},tch=new Map(),sem=+ls('sem')||0,sec=+ls('sec')||0,day=null,cal=null,selOff=0,q='';

const sched=()=>D.schedules.find(s=>s.semesterId===sem&&s.sectionId===sec);
const forDay=(sc,off)=>{const T=t0()+off*864e5,d=new Date(T),dn=sc.days.find(x=>x.name===DAYS[d.getUTCDay()]);
 return(dn?dn.classes:[]).map(c=>{const sl=slots[c.slot];return{...c,off,T,s:sl.start,e:sl.end,start:T+mins(sl.start)*6e4,end:T+mins(sl.end)*6e4}})};
const occs=(sc,from,n)=>Array.from({length:n},(_,i)=>forDay(sc,from+i)).flat();
const status=(o,n)=>n>=o.end?'done':n>=o.start?'live':o.off===0?'today':o.off===1?'tomorrow':'soon';
const norm=s=>s.toLowerCase().replace(/\(cse\)/g,'').replace(/\b(prof|dr|md|mst|mohd)\b\.?/g,'').replace(/[^a-z]/g,'');
const info=n=>tch.get(norm(n));
const teachers=(o,c)=>o.teachers.map(n=>`<button class="tn${c?' sm':''}" data-t="${esc(n)}" title="Tap for teacher details"><i>${esc(n.replace(/^((prof|dr|md|mst)\.?\s*)+/i,'').charAt(0)||'?')}</i><em>${esc(n)}</em></button>`).join('');
const dlabel=(o)=>o.off===0?'Today':o.off===1?'Tomorrow':DAYS[new Date(o.T).getUTCDay()];
const cd=ms=>{ms=Math.max(0,ms);const s=Math.floor(ms/1e3),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);
 return d?`${d}d ${pad(h)}h ${pad(m)}m`:`${pad(h)}:${pad(m)}:${pad(s%60)}`};
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const sub=code=>(code.match(/[A-Za-z]+/)||[code])[0].slice(0,3).toUpperCase();

const card=(o,n)=>{const s=status(o,n),h=hue(o.code);return`<article class="cls ${s}"><span class="ic" style="--h:${h}">${esc(sub(o.code))}</span><div class="m"><div class="top"><span class="tag">${LBL[s][0]} ${LBL[s][1]}</span><span class="tm">${f12(o.s)}–${f12(o.e)}</span></div><h3>${esc(o.title)}</h3><div class="pills"><span class="pill code">${esc(o.code)}</span><span class="pill rm">🚪 Room ${esc(o.room)}</span>${o.type==='lab'?'<span class="pill">🧪 LAB</span>':''}</div><div class="tl">${teachers(o)}</div></div></article>`};
const list=(a,n,m)=>a.length?`<div class="list">${a.map(o=>card(o,n)).join('')}</div>`:`<p class="empty">${m||'No classes.'}</p>`;

function myClass(sc){
 const ti=new Date(t0()).getUTCDay(),sems=[...new Map(D.schedules.map(s=>[s.semesterId,s.semester]))],secs=D.schedules.filter(s=>s.semesterId===sem);
 const cols=WK.map(d=>{const cl=sc.days.find(x=>x.name===d).classes;if(!cl.length)return'';const td=DAYS[ti]===d;
  return`<div class="dc ${td?'td':''}" tabindex="0" role="button" data-goday="${d}"><b>${d.slice(0,3)}${td?' · Today':''}</b>${cl.map(c=>`<span class="mi"><span class="mit"><span class="ic sm" style="--h:${hue(c.code)}">${esc(sub(c.code))}</span><span><strong>${esc(c.title)}</strong><em>${f12(slots[c.slot].start)} · ${esc(c.code)} · Room ${esc(c.room)}</em></span></span><div class="tl sm">${teachers(c,1)}</div></span>`).join('')}</div>`}).join('');
 return`<section class="card mycls"><div class="mh"><div><small>MY CLASS</small><h3>${esc(sc.semester)} · Section ${esc(sc.section)}</h3></div>
 <div class="pk"><select id="sem" aria-label="Semester">${sems.map(([id,l])=>`<option value="${id}" ${id===sem?'selected':''}>${esc(l)}</option>`).join('')}</select><select id="sec" aria-label="Section">${secs.map(s=>`<option value="${s.sectionId}" ${s.sectionId===sec?'selected':''}>Sec ${esc(s.section)}</option>`).join('')}</select></div></div>
 <div class="wk">${cols}</div></section>`}
function home(sc,n){
 const all=occs(sc,0,15),live=all.find(o=>n>=o.start&&n<o.end),nx=all.find(o=>o.start>n),c=live||nx;
 const today=forDay(sc,0),done=today.filter(o=>n>=o.end).length;
 let h;
 if(!c)h='<div class="hero soon"><h1>No upcoming classes</h1><p>Enjoy the break!</p></div>';
 else{const s=live?'live':status(c,n),tg=live?c.end:c.start;
  h=`<section class="hero ${s}"><div class="k">${live?'CLASS IN PROGRESS':'NEXT CLASS'}<span>${LBL[s][0]} ${LBL[s][1]}</span></div>
  <div class="cd" data-t="${tg}" data-live="${live?1:0}">${cd(tg-n)}</div><div class="sub">${live?'until this class ends':'until it starts'}</div>
  <h1>${esc(c.title)}</h1><p>${esc(c.code)} · ${dlabel(c)}, ${f12(c.s)} – ${f12(c.e)}</p><div class="hp"><span>🚪 Room ${esc(c.room)}</span>${teachers(c)}</div><p class="hint">👆 Tap a teacher's name for contact details</p>
  ${live?`<div class="bar"><i data-s="${c.start}" data-e="${c.end}" style="width:${(n-c.start)/(c.end-c.start)*100}%"></i></div>`:''}</section>`}
 const after=all.filter(o=>o.start>n&&o!==c&&o.off>=0).slice(0,4);
 return`${myClass(sc)}<div class="home"><div>${h}<div class="stats"><div><b>${today.length}</b>Classes today</div><div><b>${done}</b>Completed</div><div><b>${today.length-done}</b>Remaining</div></div></div>
 <div><h2>Today’s timeline</h2>${list(today,n,'No classes today.')}<h2>Coming next</h2>${list(after,n,'Nothing scheduled ahead.')}</div></div>`}

function routine(sc,n){
 const ti=new Date(t0()).getUTCDay();if(day===null)day=DAYS[ti];
 const tabs=WK.map(d=>`<button class="${d===day?'on':''}" data-day="${d}">${d.slice(0,3)}<small>${sc.days.find(x=>x.name===d).classes.length} cls</small></button>`).join('');
 const off=(DAYS.indexOf(day)-ti+7)%7;
 return`<div class="tabs">${tabs}</div>${list(forDay(sc,off),n,'No classes on '+day+'.')}`}

function calendar(sc,n){
 const b=new Date(t0());if(!cal)cal={y:b.getUTCFullYear(),m:b.getUTCMonth()};
 const first=new Date(Date.UTC(cal.y,cal.m,1)),lead=(first.getUTCDay()+1)%7,dim=new Date(Date.UTC(cal.y,cal.m+1,0)).getUTCDate();
 let g=WK.map(d=>`<div class="w">${d.slice(0,2)}</div>`).join('')+'<span></span>'.repeat(lead);
 for(let d=1;d<=dim;d++){const T=Date.UTC(cal.y,cal.m,d),off=Math.round((T-t0())/864e5),has=(sc.days.find(x=>x.name===DAYS[new Date(T).getUTCDay()])||{classes:[]}).classes.length>0;
  g+=`<button class="${has?'has ':''}${off===0?'td ':''}${off===selOff?'on':''}" data-off="${off}">${d}</button>`}
 const title=first.toLocaleString('en',{month:'long',year:'numeric',timeZone:'UTC'});
 const sd=new Date(t0()+selOff*864e5).toLocaleDateString('en',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
 return`<div class="cal" id="cal"><div class="hd"><button data-mv="-1" aria-label="Previous month">‹</button><b>${title}</b><button data-mv="1" aria-label="Next month">›</button></div><div class="grid">${g}</div></div>
 <h2>${sd}</h2>${list(forDay(sc,selOff),n,'No classes on this day.')}`}

function search(){
 return`<input type="search" id="q" placeholder="Course, teacher or room…" value="${esc(q)}" autocomplete="off"><div class="res" id="res">${results()}</div>`}
function results(){
 const k=q.trim().toLowerCase();if(k.length<2)return'<p class="empty">Type at least 2 letters to search all semesters and sections.</p>';
 const out=[];
 for(const sc of D.schedules)for(const d of sc.days)for(const c of d.classes){
  if([c.code,c.title,c.room,...c.teachers].join(' ').toLowerCase().includes(k)){const sl=slots[c.slot];
   out.push(`<article class="card"><div class="meta">${esc(sc.semester)} · Section ${esc(sc.section)}</div><h3>${esc(c.title)}</h3><p style="color:var(--mu);font-size:13px">${esc(c.code)} · ${d.name} ${f12(sl.start)}–${f12(sl.end)} · Room ${esc(c.room)}</p><p style="font-size:13px">${teachers(c)}</p></article>`);if(out.length>=50)return out.join('')+'<p class="note">Showing first 50 results. Refine your search.</p>'}}
 return out.join('')||'<p class="empty">No matches.</p>'}

function settings(){
 const th=ls('theme')||'system',sems=[...new Map(D.schedules.map(s=>[s.semesterId,s.semester]))];
 const secs=D.schedules.filter(s=>s.semesterId===sem);
 return`<div class="card"><h2 style="margin-top:0">Appearance</h2><div class="seg">${[['light','☀️ Light'],['dark','🌙 Dark'],['system','💻 System']].map(([v,l])=>`<button data-th="${v}" class="${th===v?'on':''}">${l}</button>`).join('')}</div></div>
 <div class="card sel"><h2 style="margin-top:0">My class</h2><label><span>Semester</span><select id="sem">${sems.map(([id,l])=>`<option value="${id}" ${id===sem?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
 <label><span>Section</span><select id="sec">${secs.map(s=>`<option value="${s.sectionId}" ${s.sectionId===sec?'selected':''}>${esc(s.section)}</option>`).join('')}</select></label>
 <p class="note">Saved on this device.</p></div>
 <p class="note">${esc(D.meta.program)} · Last synced ${esc((D.meta.lastSyncedAt||'').replace('T',' ').slice(0,16))} (BD time) · ${D.meta.coverage.loadedSchedules} routines</p>`}

const dlg=document.createElement('dialog');document.body.append(dlg);
dlg.addEventListener('click',e=>{if(e.target===dlg||e.target.dataset.x!==undefined)dlg.close()});
function openT(n){const t=info(n)||{},ph=(t.contact||'').split(/[;]/).map(s=>s.trim()).filter(Boolean);
 dlg.innerHTML=`<div class="tdw">${t.image?`<img src="${esc(t.image)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=av>'+this.alt+'</div>'">`:`<div class="av">${esc(n.replace(/^((prof|dr|md|mst)\.?\s*)+/i,'').charAt(0)||'?')}</div>`}<div><h3>${esc(t.name||n)}</h3><p>${esc(t.designation||'Faculty, Dept. of CSE')}</p></div>
 <div class="tdl">${t.email?`<a href="mailto:${esc(t.email)}">✉️ ${esc(t.email)}</a>`:''}${ph.map(p=>`<a href="tel:${esc(p.replace(/[^+\d]/g,''))}">📞 ${esc(p)}</a>`).join('')}${t.profile?`<a href="${esc(t.profile)}" target="_blank" rel="noopener">🌐 Official profile</a>`:''}${!t.email&&!ph.length&&!t.profile?'<p>Contact details are not listed yet.</p>':''}</div><button class="cl" data-x>Close</button></div>`;
 dlg.showModal()}
function view(){return(location.hash||'#home').slice(1)}
function render(){
 if(!D)return;
 const v=NAV.some(x=>x[0]===view())?view():'home',n=now();
 $('#nav').innerHTML=NAV.map(([id,i,l])=>`<a href="#${id}" class="${id===v?'on':''}" ${id===v?'aria-current="page"':''}><i>${i}</i>${id==='settings'?'<span class="mb">More</span><span class="dk">Settings</span>':l}</a>`).join('');
 if(!sched()){const f=D.schedules[0];sem=f.semesterId;sec=f.sectionId}
 const sc=sched(),keep=document.activeElement&&document.activeElement.id==='q';
 if(keep&&v==='search')return;
 app.innerHTML=v==='home'?home(sc,n):v==='routine'?routine(sc,n):v==='calendar'?calendar(sc,n):v==='search'?search():settings();
 if(v!=='search')scrollTo({top:0});
 if(v==='search'&&!q)$('#q').focus({preventScroll:true});
}
function tick(){
 const n=now(),d=new Date(n);
 $('#clk').textContent=`${(d.getUTCHours()%12||12)}:${pad(d.getUTCMinutes())} ${d.getUTCHours()<12?'AM':'PM'}`;
 $('#clkd').textContent=d.toLocaleDateString('en',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
 const c=document.querySelector('.cd');
 if(c){const t=+c.dataset.t;if(n>=t)return render();c.textContent=cd(t-n);const b=document.querySelector('.bar i');if(b)b.style.width=(n-b.dataset.s)/(b.dataset.e-b.dataset.s)*100+'%'}
 if(Math.floor(n/6e4)!==tick.m){tick.m=Math.floor(n/6e4);if(view()!=='search'&&view()!=='settings')render()}
}
function theme(t){ls('theme',t);const r=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;
 document.documentElement.dataset.theme=r;document.querySelector('meta[name=theme-color]').content=r==='dark'?'#090d18':'#f4f6fb'}
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>(ls('theme')||'system')==='system'&&theme('system'));

app.addEventListener('click',e=>{
 const b=e.target.closest('button,[role=button]');if(!b)return;const d=b.dataset;
 if(d.t)openT(d.t);
 else if(d.goday){day=d.goday;location.hash='#routine'}
 else if(d.day){day=d.day;render()}
 else if(d.off!==undefined){selOff=+d.off;render()}
 else if(d.mv){cal.m+=+d.mv;if(cal.m>11){cal.m=0;cal.y++}if(cal.m<0){cal.m=11;cal.y--}render()}
 else if(d.th){theme(d.th);render()}
});
app.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){e.preventDefault();e.target.click()}
});
app.addEventListener('change',e=>{
 if(e.target.id==='sem'){sem=+e.target.value;sec=D.schedules.find(s=>s.semesterId===sem).sectionId;ls('sem',sem);ls('sec',sec);render()}
 if(e.target.id==='sec'){sec=+e.target.value;ls('sec',sec);render()}
});
app.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;$('#res').innerHTML=results()}});
let sx=0;
app.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
app.addEventListener('touchend',e=>{if(!e.target.closest('#cal'))return;const dx=e.changedTouches[0].clientX-sx;
 if(Math.abs(dx)>60){const b=document.querySelector(`[data-mv="${dx<0?1:-1}"]`);b&&b.click()}},{passive:true});
addEventListener('hashchange',render);

Promise.all([
 fetch('./routine.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw 0;return r.json()}),
 fetch('./assets/teachers.json').then(r=>r.json()).catch(()=>({teachers:[]})),
 fetch('./assets/official-faculty.json').then(r=>r.json()).catch(()=>({faculty:[]}))
]).then(([r,t,of])=>{
 D=r;D.slots.forEach(s=>slots[s.id]=s);
 t.teachers.forEach(x=>[x.name,...(x.aliases||[])].forEach(n=>tch.set(norm(n),x)));
 (of.faculty||[]).forEach(f=>{const k=norm(f.name),x=tch.get(k);x?Object.assign(x,{image:x.image||f.image,profile:x.profile||f.profile,email:x.email||f.email}):tch.set(k,f)});
 render();tick();setInterval(tick,1000);
}).catch(()=>{app.innerHTML='<p class="load">Could not load routine.json. Run <code>python app.py</code> or host the site on GitHub Pages (opening index.html directly will not work).</p>'});
})();
