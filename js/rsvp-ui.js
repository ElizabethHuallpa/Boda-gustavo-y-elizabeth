/* ===================== RSVP · FORMULARIO (solo interfaz) =====================
   Versión tolerante: si quitas del HTML algún campo opcional (restricciones alimentarias, número de
   asistentes, avisos de pases, lista de sugerencias…) el formulario SIGUE funcionando.
   Solo son imprescindibles: el formulario, el nombre y la asistencia (y un botón de enviar).
   Si algo inesperado falla, se muestra un mensaje y el detalle queda en la consola (F12). */
(function(){
  const form=document.getElementById('rsvpForm')||document.querySelector('form'); if(!form){console.error('[RSVP] No encontré el formulario');return}
  const g=id=>document.getElementById(id), f=n=>form.elements[n]||null;
  const STUB={value:'',hidden:false,textContent:'',innerHTML:'',disabled:false,className:'',style:{},
    addEventListener(){},appendChild(){},setAttribute(){},removeAttribute(){},focus(){},querySelector(){return null}};
  const opt=n=>n||STUB;
  const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const CFG=(typeof RSVP_CONFIG!=='undefined')?RSVP_CONFIG:{guests:[], guestsUrl:'data/invitados.json', unlistedPasses:1, seatsCap:10};
  const GUESTS=Array.isArray(CFG.guests)?CFG.guests:[];
  const MIN_SUGGEST=3;

  function normalizeGuest(raw){
    if(!raw) return null;
    if(typeof raw==='string'){
      const n=raw.trim();
      return n ? {n, p:1} : null;
    }
    const n=(raw.n || raw.nombre || raw.name || '').trim();
    const p=Number(raw.p || raw.asistentes || raw.seats || 1);
    if(!n) return null;
    return {n, p:Number.isFinite(p)&&p>0 ? p : 1};
  }

  function mergeGuestList(items){
    const list=Array.isArray(items)?items.map(normalizeGuest).filter(Boolean):[];
    if(!list.length) return;
    GUESTS.splice(0, GUESTS.length, ...list);
    if(CFG) CFG.guests=GUESTS;
  }

  async function loadGuests(){
    if(Array.isArray(CFG.guests)&&CFG.guests.length){
      mergeGuestList(CFG.guests);
      return;
    }
    const url=CFG.guestsUrl || 'data/invitados.json';
    if(!url) return;
    try{
      const res=await fetch(url,{cache:'no-store'});
      if(!res.ok) throw new Error('No pude cargar '+url);
      const payload=await res.json();
      const list=(Array.isArray(payload)?payload:Array.isArray(payload?.guests)?payload.guests:[]);
      mergeGuestList(list);
      if(!GUESTS.length) console.warn('[RSVP] Lista de invitados vacía o sin datos en '+url);
    }catch(err){
      console.warn('[RSVP] No cargué la lista de invitados desde '+url+'.', err);
    }
  }

  const name=g('rsvpName')||f('nombre');
  if(!name){console.error('[RSVP] No encontré el campo del nombre (id="rsvpName" o name="nombre")');return}
  name.setAttribute('autocomplete','off');
  const seatsEl=g('rsvpSeats')||f('asistentes'), hasSeats=!!seatsEl;
  const btn=g('rsvpSubmit')||form.querySelector('[type=submit],button:not([type])')||STUB;
  let statusEl=g('rsvpStatus');
  if(!statusEl){statusEl=document.createElement('div');statusEl.id='rsvpStatus';statusEl.className='status';statusEl.setAttribute('role','status');statusEl.hidden=true;form.appendChild(statusEl)}
  const el={name,sug:opt(g('rsvpSuggest')),auth:opt(g('authInfo')),authN:opt(g('authN')),authNote:opt(g('authNote')),
            seatsBox:opt(g('seatsBox')),seats:opt(seatsEl),diet:opt(g('rsvpDiet')||f('restricciones')),msg:opt(g('rsvpMsg')||f('mensaje')),
            hp:f('website'),btn,status:statusEl,guestNamesBox:opt(g('guestNamesBox')),guestNamesList:opt(g('guestNamesList'))};
  const btnLabel=btn.textContent||'Enviar respuesta';
  let guest=null,authorized=Math.min(CFG.unlistedPasses||1,CFG.seatsCap||10),sending=false,guestNameInputs=[];

  const plural=(n,s,p)=>n+' '+(n===1?s:p);
  const val=n=>String((n&&n.value)||'').trim();
  const rankGuest=(candidate, query)=>{
    const q=nz(query), n=nz(candidate);
    if(!q) return 999;
    if(n===q) return 0;
    if(n.startsWith(q)) return 1;
    const tokens=q.split(' ').filter(Boolean);
    let score=10;
    for(const token of tokens){
      if(n.startsWith(token)) score=Math.min(score,2);
      else if(n.includes(token)) score=Math.min(score,5);
      else return 999;
    }
    return score;
  };
  const matches=v=>{
    const q=nz(v);
    if(q.length < MIN_SUGGEST) return [];
    const terms=q.split(' ').filter(Boolean);
    if(!terms.length) return [];
    return GUESTS.filter(x=>terms.every(w=>nz(x.n).includes(w)))
      .sort((a,b)=>rankGuest(a.n,q)-rankGuest(b.n,q))
      .slice(0,8);
  };
  const exact=v=>GUESTS.find(x=>nz(x.n)===nz(v))||null;
  const att=()=>{const a=f('asistencia');return a?String(a.value||''):''};
  const isYes=a=>{const t=nz(a);return /asist/.test(t)&&!/^no/.test(t)};

  function setErr(key,msg){
    const p=g('err-'+key);if(p)p.textContent=msg||'';
    if(key==='guestNames'){
      guestNameInputs.forEach(input=>{msg?input.setAttribute('aria-invalid','true'):input.removeAttribute('aria-invalid')});
      return;
    }
    const t={name:el.name,seats:seatsEl}[key];if(t){msg?t.setAttribute('aria-invalid','true'):t.removeAttribute('aria-invalid')}
  }
  function clearErrs(){['name','att','seats','guestNames'].forEach(k=>setErr(k,''))}

  function buildSeats(){
    if(!hasSeats||seatsEl.tagName!=='SELECT')return;
    const keep=parseInt(seatsEl.value,10);seatsEl.innerHTML='';
    for(let i=1;i<=authorized;i++){const o=document.createElement('option');o.value=i;o.textContent=i===1?'1 persona':i+' personas';seatsEl.appendChild(o)}
    seatsEl.value=(keep&&keep<=authorized)?keep:authorized;
    renderGuestNames();
  }

  function refreshAuth(){
    const v=el.name.value.trim();guest=exact(v);
    authorized=Math.min(guest?guest.p:(CFG.unlistedPasses||1),CFG.seatsCap||10);
    const show=v.length>=MIN_SUGGEST;el.auth.hidden=!show;
    el.authN.textContent=authorized;
    el.authNote.textContent=show&&!guest&&GUESTS.length?'(tu nombre no aparece en la lista)':'';
    buildSeats();
  }

  function refreshSeatsBox(){
    el.seatsBox.hidden=!isYes(att());
    renderGuestNames();
  }

  function renderGuestNames(){
    if(!hasSeats || !el.guestNamesBox || !el.guestNamesList) return;
    const attending=isYes(att());
    if(!attending){
      el.guestNamesBox.hidden=true;
      el.guestNamesList.innerHTML='';
      guestNameInputs=[];
      setErr('guestNames','');
      return;
    }
    const total = Math.max(1, parseInt(seatsEl.value,10) || 1);
    const required = Math.max(0, total - 1);
    el.guestNamesBox.hidden = required === 0;
    if(required===0){
      el.guestNamesList.innerHTML='';
      guestNameInputs=[];
      setErr('guestNames','');
      return;
    }
    const values = guestNameInputs.map(input => input.value.trim());
    el.guestNamesList.innerHTML='';
    guestNameInputs=[];

    for(let i=0;i<required;i++){
      const wrap=document.createElement('div');
      const label=document.createElement('label');
      label.setAttribute('for','guestName_'+i);
      label.textContent = required===1 ? 'Nombre del acompañante' : 'Nombre del acompañante '+(i+1);
      const input=document.createElement('input');
      input.type='text';
      input.id='guestName_'+i;
      input.name='acompanantes';
      input.maxLength=120;
      input.placeholder = required===1 ? 'Ej. Ana Torres' : 'Ej. Ana Torres';
      input.autocomplete='off';
      input.value = values[i] || '';
      input.addEventListener('input',()=>setErr('guestNames',''));
      wrap.appendChild(label);
      wrap.appendChild(input);
      el.guestNamesList.appendChild(wrap);
      guestNameInputs.push(input);
    }
  }

  function showSuggest(){
    if(el.sug===STUB)return;
    const v=el.name.value.trim();
    if(v.length < MIN_SUGGEST){el.sug.innerHTML='';el.sug.hidden=true;return;}
    const list=matches(v);
    el.sug.innerHTML='';
    list.forEach(x=>{const li=document.createElement('li');li.textContent=x.n;li.tabIndex=0;li.setAttribute('role','option');
      const pick=()=>{el.name.value=x.n;el.sug.hidden=true;setErr('name','');refreshAuth();};
      li.addEventListener('mousedown',e=>{e.preventDefault();pick()});li.addEventListener('keydown',e=>{if(e.key==='Enter')pick()});el.sug.appendChild(li)});
    el.sug.hidden=!list.length||!!exact(v);
    el.name.setAttribute('aria-expanded', String(!el.sug.hidden));
  }
  el.name.addEventListener('input',()=>{setErr('name','');showSuggest();refreshAuth()});
  el.name.addEventListener('blur',()=>setTimeout(()=>{el.sug.hidden=true;el.name.setAttribute('aria-expanded','false')},150));
  form.querySelectorAll('[name=asistencia]').forEach(r=>r.addEventListener('change',()=>{setErr('att','');refreshSeatsBox()}));
  if(hasSeats)seatsEl.addEventListener('change',()=>{setErr('seats','');renderGuestNames();});

  function validate(){
    const errs={},nm=el.name.value.trim().replace(/\s+/g,' ');
    if(nm.length<5||nm.split(' ').length<2)errs.name='Escribe tu nombre completo (nombre y apellido).';
    else if(!guest&&GUESTS.length&&matches(nm).length)errs.name='Elige tu nombre en la lista que aparece para asignar tus asistentes autorizados.';
    const a=att();if(!a)errs.att='Indica si podrás asistir.';
    let seats=0;
    if(isYes(a)){
      if(hasSeats){seats=parseInt(seatsEl.value,10);
        if(!seats||seats<1)errs.seats='Indica cuántas personas asistirán.';
        else if(seats>authorized)errs.seats='Solo puedes registrar hasta '+plural(authorized,'asistente','asistentes')+'.';}
      else seats=1;
      const required = Math.max(0, seats - 1);
      const companionNames = guestNameInputs.map(input => String(input.value || '').trim()).filter(Boolean);
      if(required>0 && companionNames.length < required){
        errs.guestNames = 'Escribe el nombre de '+(required===1 ? '1 acompañante' : required+' acompañantes')+' según tus pases asignados.';
      }
      if(required>0 && companionNames.length > required){
        errs.guestNames = 'Solo puedes registrar '+required+' '+(required===1 ? 'acompañante' : 'acompañantes')+' según tus pases asignados.';
      }
      if(required>0){
        const invalid = companionNames.some(name => name.split(/\s+/).filter(Boolean).length < 2);
        if(invalid) errs.guestNames = 'Escribe el nombre completo de cada acompañante.';
      }
    }
    return {errs,name:nm,a,seats};
  }

  function status(kind,parts){
    el.status.className='status '+kind;el.status.innerHTML='';
    parts.forEach(t=>{if(typeof t==='string'){const p=document.createElement('p');p.textContent=t;el.status.appendChild(p)}else el.status.appendChild(t)});
    el.status.hidden=false;
  }
  function summaryText(p){
    return ['Confirmación · Boda Elizabeth y Gustavo','Nombre: '+p.nombre,'Asistencia: '+p.asistencia,
      'Asistentes: '+p.asistentes+' (autorizados: '+p.autorizados+')','Acompañantes: '+(Array.isArray(p.acompanantes)&&p.acompanantes.length ? p.acompanantes.join(', ') : 'ninguno'),
      'Restricciones alimentarias: '+(p.restricciones||'ninguna'),'Mensaje: '+(p.mensaje||'—')].join('\n');
  }
  function copyBlock(p){
    const wrap=document.createElement('div'),ta=document.createElement('textarea'),b=document.createElement('button');
    ta.readOnly=true;ta.rows=6;ta.value=summaryText(p);b.type='button';b.className='btn alt';b.textContent='Copiar mi respuesta';
    b.onclick=async()=>{try{await navigator.clipboard.writeText(ta.value);b.textContent='¡Copiada!'}catch(e){ta.focus();ta.select();b.textContent='Selecciónala y cópiala'}};
    wrap.append(ta,b);return wrap;
  }
  function again(){
    const b=document.createElement('button');b.type='button';b.className='btn alt';b.textContent='Registrar otra respuesta';
    b.onclick=()=>{form.reset();form.removeAttribute('data-state');el.status.hidden=true;guest=null;refreshAuth();refreshSeatsBox();el.name.focus()};return b;
  }
  function busy(on){sending=on;btn.disabled=on;btn.textContent=on?'Enviando…':btnLabel}

  async function send(){
    if(el.hp&&el.hp.value)return;
    clearErrs();el.status.hidden=true;
    const v=validate(),keys=Object.keys(v.errs);
    if(keys.length){keys.forEach(k=>setErr(k,v.errs[k]));
      status('warn',['Revisa los campos marcados antes de enviar.']);
      const first={name:el.name,att:form.querySelector('[name=asistencia]'),seats:seatsEl,guestNames:guestNameInputs[0]}[keys[0]];first&&first.focus&&first.focus();return}
    const yes=isYes(v.a);
    const acomp = guestNameInputs.map(input => String(input.value || '').trim()).filter(Boolean);
    const p={nombre:v.name,asistencia:yes?'Asistiré':'No podré asistir',asistentes:yes?v.seats:0,autorizados:authorized,enListado:!!guest,
      acompanantes:acomp,restricciones:val(el.diet),mensaje:val(el.msg),enviado:new Date().toISOString()};
    busy(true);status('info',['Enviando tu respuesta…']);
    const first=v.name.split(' ')[0];
    try{
      const r=await RSVP_STORAGE.submit(p);
      const sum=p.asistentes>0?('Asistirán '+plural(p.asistentes,'persona','personas')+'.'):'Lamentamos que no puedas acompañarnos.';
      form.setAttribute('data-state','done');
      status('ok',[r.status==='stored'?'¡Gracias, '+first+'! Tu respuesta quedó registrada. '+sum:'¡Gracias, '+first+'! Enviamos tu respuesta a los novios. '+sum,again()]);
    }catch(err){
      if(err.code==='NOT_CONFIGURED')
        status('warn',['Todavía no podemos recibir respuestas desde esta página, por eso tu respuesta NO se ha guardado. Por favor, avísales directamente a los novios.',copyBlock(p)]);
      else if(err.code==='REJECTED')
        status('bad',['No se registró tu respuesta: '+(err.message&&err.message!=='REJECTED'?err.message:'el servidor no la aceptó')+'. Revisa los datos e inténtalo de nuevo.']);
      else
        status('bad',['No se pudo guardar tu respuesta (revisa tu conexión). No se ha registrado nada; inténtalo de nuevo.']);
    }finally{busy(false)}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending)return;
    try{await send()}
    catch(err){console.error('[RSVP] Error inesperado:',err);busy(false);
      status('bad',['Ocurrió un error inesperado ('+((err&&err.message)||err)+'). No se guardó nada; inténtalo de nuevo.'])}
  });

  loadGuests().finally(()=>{ refreshAuth(); refreshSeatsBox(); });
})();
