/* ===================== RSVP · FORMULARIO (solo interfaz) ===================== */
/*(function(){
  const form=document.getElementById('rsvpForm'); if(!form)return;
  const g=id=>document.getElementById(id);
  const nz=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const GUESTS=RSVP_CONFIG.guests||[], CAP=RSVP_CONFIG.seatsCap||10;
  const el={name:g('rsvpName'),sug:g('rsvpSuggest'),hint:g('hint-name'),auth:g('authInfo'),authN:g('authN'),authNote:g('authNote'),
            seatsBox:g('seatsBox'),seats:g('rsvpSeats'),diet:g('rsvpDiet'),msg:g('rsvpMsg'),btn:g('rsvpSubmit'),status:g('rsvpStatus'),hp:form.elements['website']};
  let guest=null,authorized=Math.min(RSVP_CONFIG.unlistedPasses||1,CAP),sending=false;

  const plural=(n,s,p)=>n+' '+(n===1?s:p);
  const matches=v=>{const t=nz(v).split(' ').filter(Boolean);return t.length?GUESTS.filter(x=>t.every(w=>nz(x.n).includes(w))):[]};
  const exact=v=>GUESTS.find(x=>nz(x.n)===nz(v))||null;
  const att=()=>form.elements['asistencia'].value;

  function setErr(key,msg){const p=g('err-'+key);if(p)p.textContent=msg||'';
    const f={name:el.name,seats:el.seats}[key];if(f){msg?f.setAttribute('aria-invalid','true'):f.removeAttribute('aria-invalid')}}
  function clearErrs(){['name','att','seats'].forEach(k=>setErr(k,''))}

  function buildSeats(){
    const keep=parseInt(el.seats.value,10);el.seats.innerHTML='';
    for(let i=1;i<=authorized;i++){const o=document.createElement('option');o.value=i;o.textContent=i===1?'1 persona':i+' personas';el.seats.appendChild(o)}
    el.seats.value=(keep&&keep<=authorized)?keep:authorized;
  }
  function refreshAuth(){
    const v=el.name.value.trim();guest=exact(v);
    authorized=Math.min(guest?guest.p:(RSVP_CONFIG.unlistedPasses||1),CAP);
    const show=v.length>=2;el.auth.hidden=!show;
    el.authN.textContent=authorized;
    el.authNote.textContent=show&&!guest?'(tu nombre no aparece en la lista)':'';
    buildSeats();
  }
  function refreshSeatsBox(){el.seatsBox.hidden=att()!=='asistire'}

  function showSuggest(){
    const v=el.name.value.trim(),list=v.length>=2?matches(v).slice(0,6):[];
    el.sug.innerHTML='';
    list.forEach(x=>{const li=document.createElement('li');li.textContent=x.n;li.tabIndex=0;li.setAttribute('role','option');
      const pick=()=>{el.name.value=x.n;el.sug.hidden=true;setErr('name','');refreshAuth()};
      li.addEventListener('mousedown',e=>{e.preventDefault();pick()});li.addEventListener('keydown',e=>{if(e.key==='Enter')pick()});el.sug.appendChild(li)});
    el.sug.hidden=!list.length||!!exact(v);
  }
  el.name.addEventListener('input',()=>{setErr('name','');showSuggest();refreshAuth()});
  el.name.addEventListener('blur',()=>setTimeout(()=>{el.sug.hidden=true},150));
  form.querySelectorAll('input[name=asistencia]').forEach(r=>r.addEventListener('change',()=>{setErr('att','');refreshSeatsBox()}));
  el.seats.addEventListener('change',()=>setErr('seats',''));

  function validate(){
    const errs={},name=el.name.value.trim().replace(/\s+/g,' ');
    if(name.length<5||name.split(' ').length<2)errs.name='Escribe tu nombre completo (nombre y apellido).';
    else if(!guest&&GUESTS.length&&matches(name).length)errs.name='Elige tu nombre en la lista que aparece para asignar tus asistentes autorizados.';
    const a=att();if(!a)errs.att='Indica si podrás asistir.';
    let seats=0;
    if(a==='asistire'){seats=parseInt(el.seats.value,10);
      if(!seats||seats<1)errs.seats='Indica cuántas personas asistirán.';
      else if(seats>authorized)errs.seats='Solo puedes registrar hasta '+plural(authorized,'asistente','asistentes')+'.';}
    return {errs,name,a,seats};
  }

  function status(kind,parts){
    el.status.className='status '+kind;el.status.innerHTML='';
    parts.forEach(t=>{if(typeof t==='string'){const p=document.createElement('p');p.textContent=t;el.status.appendChild(p)}else el.status.appendChild(t)});
    el.status.hidden=false;
  }
  function summaryText(p){
    return ['Confirmación · Boda Elizabeth y Gustavo','Nombre: '+p.nombre,'Asistencia: '+p.asistencia,
      'Asistentes: '+p.asistentes+' (autorizados: '+p.autorizados+')','Restricciones alimentarias: '+(p.restricciones||'ninguna'),'Mensaje: '+(p.mensaje||'—')].join('\n');
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

  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending)return;
    if(el.hp&&el.hp.value)return;                       // trampa para bots
    clearErrs();el.status.hidden=true;
    const v=validate(),keys=Object.keys(v.errs);
    if(keys.length){keys.forEach(k=>setErr(k,v.errs[k]));
      status('warn',['Revisa los campos marcados antes de enviar.']);
      const first={name:el.name,att:form.querySelector('input[name=asistencia]'),seats:el.seats}[keys[0]];first&&first.focus();return}
    const p={nombre:v.name,asistencia:v.a==='asistire'?'Asistiré':'No podré asistir',asistentes:v.a==='asistire'?v.seats:0,
      autorizados:authorized,enListado:!!guest,restricciones:el.diet.value.trim(),mensaje:el.msg.value.trim(),enviado:new Date().toISOString()};
    sending=true;el.btn.disabled=true;el.btn.textContent='Enviando…';status('info',['Enviando tu respuesta…']);
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
        status('bad',['No pudimos guardar tu respuesta (revisa tu conexión). No se ha registrado nada; inténtalo de nuevo.']);
    }finally{sending=false;el.btn.disabled=false;el.btn.textContent='Enviar respuesta'}
  });
  refreshAuth();refreshSeatsBox();
})();*/

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
  const CFG=(typeof RSVP_CONFIG!=='undefined')?RSVP_CONFIG:{guests:[]};
  const GUESTS=CFG.guests||[], CAP=CFG.seatsCap||10;

  const name=g('rsvpName')||f('nombre');
  if(!name){console.error('[RSVP] No encontré el campo del nombre (id="rsvpName" o name="nombre")');return}
  const seatsEl=g('rsvpSeats')||f('asistentes'), hasSeats=!!seatsEl;
  const btn=g('rsvpSubmit')||form.querySelector('[type=submit],button:not([type])')||STUB;
  let statusEl=g('rsvpStatus');
  if(!statusEl){statusEl=document.createElement('div');statusEl.id='rsvpStatus';statusEl.className='status';statusEl.setAttribute('role','status');statusEl.hidden=true;form.appendChild(statusEl)}
  const el={name,sug:opt(g('rsvpSuggest')),auth:opt(g('authInfo')),authN:opt(g('authN')),authNote:opt(g('authNote')),
            seatsBox:opt(g('seatsBox')),seats:opt(seatsEl),diet:opt(g('rsvpDiet')||f('restricciones')),msg:opt(g('rsvpMsg')||f('mensaje')),
            hp:f('website'),btn,status:statusEl};
  const btnLabel=btn.textContent||'Enviar respuesta';
  let guest=null,authorized=Math.min(CFG.unlistedPasses||1,CAP),sending=false;

  const plural=(n,s,p)=>n+' '+(n===1?s:p);
  const val=n=>String((n&&n.value)||'').trim();
  const matches=v=>{const t=nz(v).split(' ').filter(Boolean);return t.length?GUESTS.filter(x=>t.every(w=>nz(x.n).includes(w))):[]};
  const exact=v=>GUESTS.find(x=>nz(x.n)===nz(v))||null;
  const att=()=>{const a=f('asistencia');return a?String(a.value||''):''};
  const isYes=a=>{const t=nz(a);return /asist/.test(t)&&!/^no/.test(t)};   // "Asistiré", "Sí, asistiré"…

  function setErr(key,msg){const p=g('err-'+key);if(p)p.textContent=msg||'';
    const t={name:el.name,seats:seatsEl}[key];if(t){msg?t.setAttribute('aria-invalid','true'):t.removeAttribute('aria-invalid')}}
  function clearErrs(){['name','att','seats'].forEach(k=>setErr(k,''))}

  function buildSeats(){
    if(!hasSeats||seatsEl.tagName!=='SELECT')return;
    const keep=parseInt(seatsEl.value,10);seatsEl.innerHTML='';
    for(let i=1;i<=authorized;i++){const o=document.createElement('option');o.value=i;o.textContent=i===1?'1 persona':i+' personas';seatsEl.appendChild(o)}
    seatsEl.value=(keep&&keep<=authorized)?keep:authorized;
  }
  function refreshAuth(){
    const v=el.name.value.trim();guest=exact(v);
    authorized=Math.min(guest?guest.p:(CFG.unlistedPasses||1),CAP);
    const show=v.length>=2;el.auth.hidden=!show;
    el.authN.textContent=authorized;
    el.authNote.textContent=show&&!guest&&GUESTS.length?'(tu nombre no aparece en la lista)':'';
    buildSeats();
  }
  function refreshSeatsBox(){el.seatsBox.hidden=!isYes(att())}

  function showSuggest(){
    if(el.sug===STUB)return;
    const v=el.name.value.trim(),list=v.length>=2?matches(v).slice(0,6):[];
    el.sug.innerHTML='';
    list.forEach(x=>{const li=document.createElement('li');li.textContent=x.n;li.tabIndex=0;li.setAttribute('role','option');
      const pick=()=>{el.name.value=x.n;el.sug.hidden=true;setErr('name','');refreshAuth()};
      li.addEventListener('mousedown',e=>{e.preventDefault();pick()});li.addEventListener('keydown',e=>{if(e.key==='Enter')pick()});el.sug.appendChild(li)});
    el.sug.hidden=!list.length||!!exact(v);
  }
  el.name.addEventListener('input',()=>{setErr('name','');showSuggest();refreshAuth()});
  el.name.addEventListener('blur',()=>setTimeout(()=>{el.sug.hidden=true},150));
  form.querySelectorAll('[name=asistencia]').forEach(r=>r.addEventListener('change',()=>{setErr('att','');refreshSeatsBox()}));
  if(hasSeats)seatsEl.addEventListener('change',()=>setErr('seats',''));

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
      else seats=1;                                   // sin campo de asistentes: se registra 1 (la persona)
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
      'Asistentes: '+p.asistentes+' (autorizados: '+p.autorizados+')','Restricciones alimentarias: '+(p.restricciones||'ninguna'),'Mensaje: '+(p.mensaje||'—')].join('\n');
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
    if(el.hp&&el.hp.value)return;                     // trampa para bots
    clearErrs();el.status.hidden=true;
    const v=validate(),keys=Object.keys(v.errs);
    if(keys.length){keys.forEach(k=>setErr(k,v.errs[k]));
      status('warn',['Revisa los campos marcados antes de enviar.']);
      const first={name:el.name,att:form.querySelector('[name=asistencia]'),seats:seatsEl}[keys[0]];first&&first.focus&&first.focus();return}
    const yes=isYes(v.a);
    const p={nombre:v.name,asistencia:yes?'Asistiré':'No podré asistir',asistentes:yes?v.seats:0,autorizados:authorized,enListado:!!guest,
      restricciones:val(el.diet),mensaje:val(el.msg),enviado:new Date().toISOString()};
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
        status('bad',['No pudimos guardar tu respuesta (revisa tu conexión). No se ha registrado nada; inténtalo de nuevo.']);
    }finally{busy(false)}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending)return;
    try{await send()}
    catch(err){console.error('[RSVP] Error inesperado:',err);busy(false);
      status('bad',['Ocurrió un error inesperado ('+((err&&err.message)||err)+'). No se guardó nada; inténtalo de nuevo.'])}
  });
  refreshAuth();refreshSeatsBox();
})();
