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
    $('healthchip').innerHTML = `llm <b>${h.llmProvider}</b> · art <b>${h.art}</b> · ` +
      (bal.mock ? `pixellab <b>mock</b>` : `credits <b>${bal.usd ?? bal.credits ?? '?'}</b>`);
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
  const tn = $('tuning'); tn.innerHTML='';
  tn.insertAdjacentHTML('beforeend', `<span class="tchip">default <b>${current.tuning.fps} fps</b></span>`);
  for(const [a,cfg] of Object.entries(current.tuning.animations)){
    const bits=[`${cfg.fps??current.tuning.fps}fps`];
    if(cfg.emitter&&cfg.emitter.type!=='none') bits.push(cfg.emitter.type+(cfg.emitter.color?` <i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${cfg.emitter.color}"></i>`:''));
    if(cfg.releaseFrame!==undefined) bits.push('rel:'+cfg.releaseFrame);
    if(cfg.sound) bits.push('♪');
    tn.insertAdjacentHTML('beforeend', `<span class="tchip"><b>${a}</b> ${bits.join(' · ')}</span>`);
  }
  renderStats();
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

window.__forge = { get current(){return current}, forge, api };   // QA hooks
boot();
