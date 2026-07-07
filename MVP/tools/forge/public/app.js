/* SHT Forge — Character module UI (vanilla, zero deps) */
const $ = id => document.getElementById(id);
const DIRS = ['S','SE','E','NE','N','NW','W','SW'];
let CONTRACT = null, current = null;

function tier(v){
  if(v<=9)return{label:'Average',color:'#94a3b8'}; if(v<=19)return{label:'Above-avg',color:'#38bdf8'};
  if(v<=29)return{label:'Exceptional',color:'#22d3ee'}; if(v<=39)return{label:'Max Human',color:'#2dd4bf'};
  if(v<=49)return{label:'Low Super',color:'#a3e635'}; if(v<=74)return{label:'Superhuman',color:'#facc15'};
  if(v<=99)return{label:'High Super',color:'#f59e0b'}; if(v<=149)return{label:'Low Cosmic',color:'#fb923c'};
  if(v<=999)return{label:'Cosmic',color:'#ef4444'}; return{label:'Beyond',color:'#f8fafc'};
}
const norm = v => v<=39? (v/39)*70 : v<=99? 70+((v-39)/60)*22 : v<=999? 92+((v-99)/900)*7 : 100;
const status = (s,err) => { const el=$('status'); el.textContent=s||''; el.style.color=err?'#f0a48a':'var(--green)'; };

async function api(path, body){
  const res = await fetch(path, body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
  const j = await res.json();
  if(!res.ok) throw new Error(j.error||res.status);
  return j;
}

async function boot(){
  try{
    const h = await api('/api/health');
    CONTRACT = await api('/api/contract');
    const bal = await api('/api/balance');
    const conv = (await api('/api/conventions')).conventions;
    $('healthchip').innerHTML = `llm <b>${h.llmProvider}</b> · art <b>${h.art}</b> · ` +
      (bal.mock ? `pixellab <b>mock</b>` : `credits <b>${bal.usd ?? bal.credits ?? '?'}</b>`) +
      (conv?.sampleSize ? ` · 🧠 learned from <b>${conv.sampleSize}</b>` : '');
    const os = $('f-origin');
    os.innerHTML = Object.entries(CONTRACT.origins).map(([k,v])=>`<option value="${k}">${k} — ${v}</option>`).join('');
    $('f-role').innerHTML = CONTRACT.roles.map(r=>`<option>${r}</option>`).join('');
    refreshGallery();
  }catch(e){ $('healthchip').textContent = 'server error: '+e.message; }
}

function renderStats(){
  const wrap = $('stats'); wrap.innerHTML='';
  for(const k of ['MEL','AGL','STR','STA','INT','INS','CON']){
    const v = current.stats[k], t = tier(v);
    const row = document.createElement('div'); row.className='statrow';
    row.innerHTML = `<span class="k">${k===('CON')?'PSI':k}</span>
      <input type="number" min="1" max="5000" value="${v}" data-k="${k}">
      <div class="statbar"><i style="width:${norm(v)}%;background:${t.color}"></i></div>
      <span class="tier" style="color:${t.color}">${t.label}</span>`;
    row.querySelector('input').addEventListener('input', e=>{
      current.stats[k] = Math.round(Number(e.target.value)||0);
      if(k==='CON') current.stats.PSI = current.stats.CON;
      const tt = tier(current.stats[k]);
      row.querySelector('i').style.cssText = `width:${norm(current.stats[k])}%;background:${tt.color}`;
      row.querySelector('.tier').style.color = tt.color; row.querySelector('.tier').textContent = tt.label;
      renderDerived();
    });
    wrap.appendChild(row);
  }
  renderDerived();
}
function renderDerived(){
  const s=current.stats;
  $('derived').innerHTML = `HEALTH <b>${s.MEL+s.AGL+s.STA+s.STR}</b> <span style="color:var(--dim)">(MEL+AGL+STA+STR)</span>`;
}

function renderCard(){
  $('card').classList.add('show');
  $('f-name').value = current.name; $('f-realName').value = current.realName;
  $('f-origin').value = String(current.origin); $('f-role').value = current.role;
  $('f-faction').value = current.faction; $('f-backstory').value = current.backstory;
  $('f-lsw').innerHTML = current.isLSW ? '<span class="badge lsw">LSW</span>' : '<span class="badge human">HUMAN</span>';
  $('f-powers').value = (current.powers||[]).join(', ');
  $('powershint').textContent = current.isLSW ? 'origins 2–8 carry powers' : 'baseline human — powers stay empty (the LSW rule)';
  $('f-notes').textContent = (current.meta?.notes||[]).length ? '⚑ contract fixes: '+current.meta.notes.join(' · ') : '';
  const strip = $('artstrip'); strip.innerHTML='';
  for(const d of DIRS){
    const src = current.art?.tokens?.[d];
    strip.insertAdjacentHTML('beforeend',
      `<figure class="artcell" style="margin:0"><img src="${src||''}" alt="${d}"><figcaption>${d}${d==='W'?' · LEFT':d==='E'?' · RIGHT':''}</figcaption></figure>`);
  }
  $('artsource').textContent = 'source: ' + (current.art?.source||'—') +
    (current.art?.source?.startsWith('mock') ? '  (stand-in sprites until PixelLab key is live)' : '');
  renderChips();
  renderStats();
  if(tuner.anim && current.tuning.animations[tuner.anim]) openTuner(tuner.anim); else closeTuner();
}

function renderChips(){
  const tn = $('tuning'); tn.innerHTML='';
  tn.insertAdjacentHTML('beforeend', `<span class="tchip" style="cursor:default">default <b>${current.tuning.fps} fps</b></span>`);
  for(const [a,cfg] of Object.entries(current.tuning.animations)){
    const bits=[`${cfg.fps??current.tuning.fps}fps`];
    if(cfg.emitter&&cfg.emitter.type!=='none') bits.push(cfg.emitter.type+(cfg.emitter.color?` <i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${cfg.emitter.color}"></i>`:''));
    if(cfg.releaseFrame!==undefined) bits.push('rel:'+cfg.releaseFrame);
    if(cfg.sound) bits.push('♪');
    const el=document.createElement('span'); el.className='tchip'+(tuner.anim===a?' on':'');
    el.innerHTML=`<b>${a}</b> ${bits.join(' · ')}`;
    el.addEventListener('click',()=>openTuner(a));
    tn.appendChild(el);
  }
}

function harvest(){
  current.name=$('f-name').value; current.realName=$('f-realName').value;
  current.origin=Number($('f-origin').value); current.role=$('f-role').value;
  current.faction=$('f-faction').value; current.backstory=$('f-backstory').value;
  current.powers=$('f-powers').value.split(',').map(s=>s.trim()).filter(Boolean);
}

async function forge(prompt){
  const btn=$('forge'); btn.disabled=true; status('forging… (llm → art → tuning)');
  try{
    const { record } = await api('/api/forge', { prompt, provider: $('provider').value||undefined });
    current = record; renderCard();
    status(`forged "${record.name}" — ${record.isLSW?'LSW':'human'} ${record.role} · art:${record.meta.artMode} · llm:${record.meta.provider}`);
  }catch(e){ status('forge failed: '+e.message, true); }
  btn.disabled=false;
}

$('forge').addEventListener('click', ()=>{ const p=$('prompt').value.trim(); if(p) forge(p); else status('write a concept first',true); });
$('reroll').addEventListener('click', ()=>{ if(current?.meta?.prompt) forge(current.meta.prompt); });
$('discard').addEventListener('click', ()=>{ current=null; $('card').classList.remove('show'); status('discarded'); });
$('bulktoggle').addEventListener('click', ()=>{ const b=$('bulkbox'); b.style.display=b.style.display==='none'?'block':'none'; });
$('forgebulk').addEventListener('click', async ()=>{
  const prompts=$('bulkprompts').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!prompts.length) return;
  const btn=$('forgebulk'); btn.disabled=true; $('bulkout').textContent=`forging ${prompts.length}…`;
  try{
    const { records, errors } = await api('/api/bulk',{ prompts, provider:$('provider').value||undefined });
    for(const r of records) await api('/api/characters', { record:r });   // bulk auto-saves
    $('bulkout').textContent=`✓ forged & saved ${records.length}` + (errors.length?` · ${errors.length} failed`:'');
    refreshGallery();
  }catch(e){ $('bulkout').textContent='bulk failed: '+e.message; }
  btn.disabled=false;
});
$('save').addEventListener('click', async ()=>{
  if(!current) return; harvest();
  try{ const r=await api('/api/characters',{record:current});
    $('saveinfo').textContent=`saved ✓ (${r.count} in roster)`; refreshGallery();
  }catch(e){ $('saveinfo').textContent='save failed: '+e.message; }
});
$('f-origin').addEventListener('change', ()=>{ if(!current) return; harvest();
  current.isLSW = current.origin>=2 && current.origin<=8; renderCard(); });

async function refreshGallery(){
  const { characters } = await api('/api/characters');
  $('galcount').textContent = characters.length ? `· ${characters.length}` : '· empty — forge someone';
  const g=$('gal'); g.innerHTML='';
  for(const c of characters){
    const el=document.createElement('div'); el.className='gitem';
    el.innerHTML=`<button class="del" data-id="${c.id}">✕</button>
      <img src="${c.art?.portrait||''}" alt=""><div class="nm">${c.name}</div>
      <div class="rl">${c.isLSW?'LSW':'HUMAN'} · ${c.role}</div>`;
    el.addEventListener('click', e=>{
      if(e.target.classList.contains('del')) return;
      current = JSON.parse(JSON.stringify(c)); renderCard(); status(`loaded "${c.name}" for editing`);
      window.scrollTo({top:0,behavior:'smooth'});
    });
    el.querySelector('.del').addEventListener('click', async ()=>{
      await api('/api/characters/delete',{id:c.id}); refreshGallery();
    });
    g.appendChild(el);
  }
}

/* ================= THE TUNER =================
 * Refine any animation live: fps, loop, release frame, muzzle point, emitter
 * (projectile / thin beam / big beam / melee) and sound. Everything writes
 * straight into current.tuning — Save to roster persists it, and the learning
 * brain (P4) reads these records to learn the owner's taste. */
const tuner = { anim:null, timer:null, frame:0, playing:false };
let SOUNDS = {};   // { category: [{id,file}] } from /api/sounds

// mock stand-ins have real frame clips we can preview against; live art will
// bring its own clips. Attack-ish anims use the clip, the rest pulse the token.
const MOCK_CLIPS = { surge:{key:'surge_blast_south',frames:6}, merc:{key:'merc_fire_south',frames:9} };
const CLIP_ANIMS = ['ranged','cast','throw','melee'];
function clipFor(anim){
  const m=(current?.art?.source||'').match(/^mock:(\w+)/);
  return (m && MOCK_CLIPS[m[1]] && CLIP_ANIMS.includes(anim)) ? MOCK_CLIPS[m[1]] : null;
}
const cfgOf = ()=> current?.tuning?.animations?.[tuner.anim];
function frameCount(){ const c=clipFor(tuner.anim); return c?c.frames:6; }
function resolveRelease(rel,n){ return rel==='last'?n-1 : rel==='last-1'?Math.max(0,n-2) : Math.min(Number(rel)||0,n-1); }
function soundFile(id){ for(const list of Object.values(SOUNDS)){ const s=list.find(x=>x.id===id); if(s) return '/game/assets/sounds/'+s.file; } return null; }
function playSnd(id){ const f=soundFile(id); if(f){ try{ const a=new Audio(f); a.volume=.4; a.play().catch(()=>{}); }catch(e){} } }

function openTuner(anim){
  tuner.anim=anim; stopPlay();
  const cfg=cfgOf(); if(!cfg) return;
  $('tuner').style.display='block';
  $('tun-name').textContent=anim;
  $('t-deffps').value=current.tuning.fps;
  $('t-fps').value=cfg.fps??current.tuning.fps; $('t-fps-v').textContent=(cfg.fps??current.tuning.fps)+' fps';
  $('t-loop').checked=!!cfg.loop;
  const n=frameCount(), rel=$('t-release');
  rel.innerHTML=[...Array(n).keys()].map(i=>`<option value="${i}">frame ${i}</option>`).join('')+
    `<option value="last">last</option><option value="last-1">last-1</option>`;
  rel.value=String(cfg.releaseFrame??'last');
  const mz=cfg.muzzle||{x:.5,y:.4};
  $('t-mx').value=mz.x; $('t-mx-v').textContent=Number(mz.x).toFixed(2);
  $('t-my').value=mz.y; $('t-my-v').textContent=Number(mz.y).toFixed(2);
  const e=cfg.emitter||{type:'none'};
  $('t-etype').value=e.type||'none';
  $('t-color').value=/^#[0-9a-f]{6}$/i.test(e.color||'')?e.color:'#ffd24a';
  $('t-count').value=e.count||1; $('t-speed').value=e.speed||320;
  $('t-width').value=e.width||0.6; $('t-width-v').textContent=(e.width||0.6).toFixed(2);
  const ss=$('t-sound');
  ss.innerHTML='<option value="">— none —</option>'+Object.entries(SOUNDS).map(([cat,list])=>
    `<optgroup label="${cat}">${list.map(s=>`<option value="${s.id}">${s.id}</option>`).join('')}</optgroup>`).join('');
  ss.value=cfg.sound||'';
  syncEmitterRows(); setFrameImg(0); placeMuzzle(); renderChips();
  $('t-frameinfo')&&($('t-frameinfo').textContent='');
}
function closeTuner(){ tuner.anim=null; stopPlay(); $('tuner').style.display='none'; }
function syncEmitterRows(){
  const t=$('t-etype').value;
  $('t-projrow').style.display = t==='projectile'?'flex':'none';
  $('t-widthrow').style.display = t==='beam_big'?'flex':'none';
}
function harvestTuner(){
  const cfg=cfgOf(); if(!cfg) return;
  current.tuning.fps=Math.max(1,Math.min(24,Number($('t-deffps').value)||6));
  cfg.fps=Number($('t-fps').value); cfg.loop=$('t-loop').checked||undefined;
  const rv=$('t-release').value; cfg.releaseFrame=(rv==='last'||rv==='last-1')?rv:Number(rv);
  cfg.muzzle={x:Number($('t-mx').value),y:Number($('t-my').value)};
  const t=$('t-etype').value;
  if(t==='none') cfg.emitter={type:'none'};
  else{
    cfg.emitter={type:t,color:$('t-color').value};
    if(t==='projectile'){ cfg.emitter.count=Number($('t-count').value)||1; cfg.emitter.speed=Number($('t-speed').value)||320; }
    if(t==='beam_big'){ cfg.emitter.width=Number($('t-width').value); cfg.emitter.area=true; }
    if(t==='beam_thin') cfg.emitter.pierce=true;
  }
  cfg.sound=$('t-sound').value||undefined;
  renderChips();
}

// ---------- live preview ----------
function setFrameImg(i){
  const img=$('tframe'), c=clipFor(tuner.anim);
  img.src = c ? `/game/asset-lab/anim/${c.key}/${i}.png` : (current?.art?.tokens?.S||'');
  if(!c) img.style.transform=`scale(${1+((i%2)?0.03:0)})`;      // token pulse marks the beat
  $('tframeinfo').textContent=`frame ${i}/${frameCount()-1}`;
}
function muzzlePx(){
  const img=$('tframe'), st=$('tstage');
  const ir=img.getBoundingClientRect(), sr=st.getBoundingClientRect();
  const mx=Number($('t-mx').value), my=Number($('t-my').value);
  return { x: ir.left-sr.left+ir.width*mx, y: ir.top-sr.top+ir.height*my };
}
function targetPx(){
  const st=$('tstage'), t=st.querySelector('.ttarget');
  const tr=t.getBoundingClientRect(), sr=st.getBoundingClientRect();
  return { x: tr.left-sr.left+tr.width/2, y: tr.top-sr.top+tr.height/2 };
}
function placeMuzzle(){ const m=muzzlePx(), el=$('tmuzzle'); el.style.left=m.x+'px'; el.style.top=m.y+'px'; }
function fireEmitter(){
  const cfg=cfgOf(), e=cfg.emitter||{type:'none'}, st=$('tstage');
  if(cfg.sound) playSnd(cfg.sound);
  if(e.type==='none') return;
  const s=muzzlePx(), t=targetPx();
  if(e.type==='melee'){ $('tframe').animate([{transform:'translateX(0)'},{transform:'translateX(14px)'},{transform:'translateX(0)'}],{duration:240}); return; }
  if(e.type==='projectile'){
    const n=e.count||1, dx=t.x-s.x, dy=t.y-s.y, L=Math.hypot(dx,dy);
    for(let i=0;i<n;i++) setTimeout(()=>{
      const p=document.createElement('div'); p.className='tproj'; p.style.color=e.color;
      const side=(i%2?1:-1)*(n>1?5:0), ox=-dy/L*side, oy=dx/L*side;
      p.style.left=(s.x+ox-5)+'px'; p.style.top=(s.y+oy-5)+'px'; st.appendChild(p);
      const t0=performance.now(), dur=Math.max(140, L/(e.speed||320)*1000);
      (function stepFn(now){ const k=Math.min(1,(now-t0)/dur);
        p.style.left=(s.x+ox+dx*k-5)+'px'; p.style.top=(s.y+oy+dy*k-5)+'px';
        if(k<1) requestAnimationFrame(stepFn); else p.remove(); })(t0);
    }, i*120);
    return;
  }
  // beams: thin = 3px flicker line, big = thick gradient bar
  const L=Math.hypot(t.x-s.x,t.y-s.y), ang=Math.atan2(t.y-s.y,t.x-s.x);
  const h = e.type==='beam_big' ? Math.round((e.width||0.6)*34) : 3;
  const b=document.createElement('div');
  b.style.cssText=`position:absolute;z-index:5;pointer-events:none;height:${h}px;width:${L}px;`+
    `left:${s.x}px;top:${s.y-h/2}px;transform-origin:0 50%;transform:rotate(${ang}rad);border-radius:${h}px;`+
    `background:linear-gradient(90deg,${e.color},#fff 14%,${e.color} 55%,transparent);box-shadow:0 0 ${h*3}px ${Math.ceil(h/2)}px ${e.color}`;
  st.appendChild(b);
  let f=0; const iv=setInterval(()=>{ b.style.opacity=(f++%2)?1:.6; },55);
  setTimeout(()=>{ clearInterval(iv); b.style.transition='opacity .15s'; b.style.opacity=0; setTimeout(()=>b.remove(),160); }, e.type==='beam_big'?430:250);
}
function stopPlay(){ if(tuner.timer){ clearInterval(tuner.timer); tuner.timer=null; } tuner.playing=false; const bp=$('tplay'); if(bp) bp.textContent='▶ PLAY'; }
function startPlay(){
  const cfg=cfgOf(); if(!cfg) return;
  stopPlay(); tuner.playing=true; $('tplay').textContent='⏸ STOP';
  const n=frameCount(), fps=Number($('t-fps').value)||6, rel=resolveRelease($('t-release').value,n);
  tuner.frame=0;
  tuner.timer=setInterval(()=>{
    setFrameImg(tuner.frame); placeMuzzle();
    if(tuner.frame===rel) fireEmitter();
    tuner.frame++;
    if(tuner.frame>=n){ if($('t-loop').checked) tuner.frame=0; else stopPlay(); }
  },1000/fps);
}
$('tplay').addEventListener('click',()=>tuner.playing?stopPlay():startPlay());
$('tstage').addEventListener('click',e=>{                     // click the stage = place the muzzle
  const img=$('tframe'), ir=img.getBoundingClientRect();
  const mx=Math.max(0,Math.min(1,(e.clientX-ir.left)/ir.width));
  const my=Math.max(0,Math.min(1,(e.clientY-ir.top)/ir.height));
  $('t-mx').value=mx.toFixed(2); $('t-my').value=my.toFixed(2);
  $('t-mx-v').textContent=mx.toFixed(2); $('t-my-v').textContent=my.toFixed(2);
  harvestTuner(); placeMuzzle();
});
for(const id of ['t-deffps','t-fps','t-loop','t-release','t-mx','t-my','t-etype','t-color','t-count','t-speed','t-width','t-sound'])
  $(id).addEventListener('input',()=>{
    $('t-fps-v').textContent=$('t-fps').value+' fps';
    $('t-mx-v').textContent=Number($('t-mx').value).toFixed(2);
    $('t-my-v').textContent=Number($('t-my').value).toFixed(2);
    $('t-width-v').textContent=Number($('t-width').value).toFixed(2);
    syncEmitterRows(); harvestTuner(); placeMuzzle();
    if(id==='t-fps' && tuner.playing) startPlay();            // retime the running loop
  });
$('t-sndplay').addEventListener('click',()=>{ const v=$('t-sound').value; if(v) playSnd(v); });

async function loadSounds(){ try{ SOUNDS=(await api('/api/sounds')).sounds||{}; }catch(e){ SOUNDS={}; } }
loadSounds();

window.__forge = { get current(){return current}, forge, api, openTuner, harvestTuner, startPlay, stopPlay,
  get tuner(){return tuner}, get sounds(){return SOUNDS} };   // QA hooks
boot();
