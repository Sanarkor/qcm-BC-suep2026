/* Mode Lecture des révisions synthétiques et détaillées. Web Speech API (speechSynthesis), sans service externe. */
(function(){
var D=document,KEY="qcmbc:lecture",STORE_VER=3;
var RATES=["1.00","1.25","1.50","1.75","2.00"],DEF_RATE="1.25";
/* Sigles à ne pas épeler (liste volontairement vide : tous les sigles sont lus lettre par lettre).
   Pour laisser un sigle tel quel, l'ajouter ici, par ex. "UNESCO". */
var SIGLES_TEL_QUEL=[];
var ANDROID=/Android/i.test(navigator.userAgent||"");
function $(s,r){return (r||D).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function getSynth(){return window.__QCMBC_SYNTH||window.speechSynthesis;}
function getUtt(){return window.__QCMBC_UTTERANCE||window.SpeechSynthesisUtterance;}
function hasSynth(){
  try{var s=getSynth(),U=getUtt();return !!s&&typeof s.speak==="function"&&typeof U==="function";}
  catch(e){return false;}
}
function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||"{}")||{};return o&&typeof o==="object"?o:{};}catch(e){return {};}}
function save(p){var o=load(),k;for(k in p)if(Object.prototype.hasOwnProperty.call(p,k))o[k]=p[k];o.v=STORE_VER;try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
function migrate(){
  var o=load();
  if(o.v===STORE_VER)return o;
  o.rate=DEF_RATE;
  delete o.voice;
  o.v=STORE_VER;
  try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}
  return o;
}
function svg(d){return '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+d+"</svg>";}
var ICO={
  play:svg('<polygon points="6 4 20 12 6 20" fill="currentColor" stroke="none"/>'),
  pause:svg('<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>'),
  stop:svg('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>'),
  prev:svg('<polygon points="19 6 9 12 19 18" fill="currentColor" stroke="none"/><rect x="5" y="6" width="2.5" height="12" rx="1" fill="currentColor" stroke="none"/>'),
  next:svg('<polygon points="5 6 15 12 5 18" fill="currentColor" stroke="none"/><rect x="16.5" y="6" width="2.5" height="12" rx="1" fill="currentColor" stroke="none"/>')
};

function isSigles(det){
  var n=det.querySelector("summary .n"),s=(det.querySelector("summary")&&det.querySelector("summary").textContent)||"";
  if(n&&/sigles|a\s*[–-]\s*z/i.test(n.textContent))return true;
  return /glossaire des sigles|sigles et acronymes/i.test(s);
}
function isFormulaire(det){
  var s=(det.querySelector("summary")&&det.querySelector("summary").textContent)||"";
  return /formulaire|cerfa/i.test(s);
}
function isEligible(det){return det&&!isSigles(det)&&!isFormulaire(det)&&(!!det.querySelector("summary .n")||!!det.querySelector(".c"));}
function isNumbered(det){
  if(!isEligible(det))return false;
  var n=det.querySelector("summary .n");
  if(n&&/^\d+$/.test(n.textContent.trim()))return true;
  var s=(det.querySelector("summary")&&det.querySelector("summary").textContent)||"";
  return /^\s*\d+/.test(s);
}
function titleOf(det){
  var sum=det.querySelector("summary");if(!sum)return "Fiche";
  var c=sum.cloneNode(true);
  $$(".lec-mini",c).forEach(function(b){b.remove();});
  return c.textContent.replace(/\s+/g," ").trim();
}
function keepSigle(tok){
  var u=String(tok||"").toUpperCase(),i;
  for(i=0;i<SIGLES_TEL_QUEL.length;i++){if(String(SIGLES_TEL_QUEL[i]).toUpperCase()===u)return true;}
  return false;
}
function notASigle(tok){
  return /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|JANVIER|FEVRIER|FÉVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AOUT|AOÛT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DECEMBRE|DÉCEMBRE|EDITION|ÉDITION|PAGE|PAGES|CHAPITRE|TITRE|ARTICLE|ANNEXE)$/.test(tok);
}
function spellSigles(s){
  return String(s).replace(/\b([A-Z]{2,10}(?:\d[A-Z0-9]{0,3})?|[A-Z]{1,4}\d[A-Z0-9]{0,3})\b/g,function(m){
    if(keepSigle(m)||notASigle(m))return m;
    return m.split("").join(" ");
  });
}
function speakable(raw){
  var s=String(raw||"").replace(/\s+/g," ").trim();
  if(!s)return "";
  s=s.replace(/art\.\s*/gi,"article ");
  s=s.replace(/n[°ºo]\s*/gi,"numéro ");
  s=s.replace(/§\s*/g,"paragraphe ");
  s=s.replace(/\b1er\b/gi,"premier");
  s=s.replace(/\b1re\b/gi,"première");
  s=s.replace(/\b(\d+)\s*h\s*(\d{1,2})\s*[–−-]\s*(\d+)\s*h\s*(\d{1,2})/gi,"$1 heures $2 à $3 heures $4");
  s=s.replace(/\b(\d+)\s*h\s*[–−-]\s*(\d+)\s*h\b/gi,"$1 heures à $2 heures");
  s=s.replace(/\b(\d+)\s*h\s*(\d{2})\b/gi,"$1 heures $2");
  s=s.replace(/\b(\d+)\s*h\b/gi,"$1 heures");
  s=s.replace(/\b(\d+)\s*min(?:utes?)?\b/gi,"$1 minutes");
  s=s.replace(/\b(\d+)\s*j\b/gi,"$1 jours");
  s=s.replace(/(\d+)\s*%/g,"$1 pour cent");
  s=s.replace(/\bL\.\s*/g,"L ");
  s=s.replace(/\s*→\s*/g," à ");
  s=s.replace(/\s*[–−]\s*/g," à ");
  s=s.replace(/\s*\/\s*/g," ");
  s=s.replace(/\s{2,}/g," ").trim();
  s=spellSigles(s);
  return s;
}
function textOf(el){
  if(!el)return "";
  if(el.tagName==="TR"){
    return $$("th,td",el).map(function(c){return c.textContent.replace(/\s+/g," ").trim();}).filter(Boolean).join(" : ");
  }
  var c=el.cloneNode(true);
  $$(".lec-mini,.lec-page,#lec-bar",c).forEach(function(b){b.remove();});
  return (c.textContent||"").replace(/\s+/g," ").trim();
}
function skipEl(el){
  return !el||el.closest("#lec-bar,.nav,.toc,.tools,.pn,.src,.lec-page,.lec-mini,#top,#mkbadge,#flt,.voix,#prOv,form");
}
/* Morceaux courts (≤ MAXC caractères) : les textes longs échouent souvent sur Android. */
var MAXC=190;
function splitText(sp){
  if(sp.length<=MAXC)return [sp];
  var out=[],buf="";
  function pieces(t){
    if(t.length<=MAXC)return [t];
    var a=t.replace(/([,;:)])\s+/g,"$1\n").split("\n"),r=[],b="",i,w;
    for(i=0;i<a.length;i++){
      if(a[i].length>MAXC){
        if(b){r.push(b);b="";}
        w=a[i].split(" ");var c="",j;
        for(j=0;j<w.length;j++){if(c&&(c.length+w[j].length+1)>MAXC){r.push(c);c=w[j];}else c=c?c+" "+w[j]:w[j];}
        if(c)r.push(c);
      }else if(b&&(b.length+a[i].length+1)>MAXC){r.push(b);b=a[i];}
      else b=b?b+" "+a[i]:a[i];
    }
    if(b)r.push(b);
    return r;
  }
  sp.replace(/([.!?…])\s+/g,"$1\n").split("\n").forEach(function(sent){
    pieces(sent).forEach(function(pc){
      if(buf&&(buf.length+pc.length+1)>MAXC){out.push(buf);buf=pc;}
      else buf=buf?buf+" "+pc:pc;
    });
  });
  if(buf)out.push(buf);
  return out;
}
function collect(det){
  var root=det.querySelector(".c")||det,out=[],seen={};
  var title=titleOf(det);
  if(title)out.push({el:det.querySelector("summary")||det,speak:speakable(title),label:title});
  $$("h2, h3, h4, p, li, tr",root).forEach(function(el){
    if(skipEl(el))return;
    if(el.tagName==="LI"&&el.querySelector("li,table"))return;
    if(el.matches&&el.matches("p.note")&&/OCR|reconnaissance de caractères/i.test(el.textContent))return;
    var t=textOf(el);if(!t||t.length<2)return;
    if(seen[t]&&el.tagName!=="TR"&&!/^H[23]$/.test(el.tagName))return;seen[t]=1;
    var sp=speakable(t);if(!sp)return;
    splitText(sp).forEach(function(part){out.push({el:el,speak:part,label:title});});
  });
  return out;
}
function allChunks(){
  var list=[];
  $$("details").filter(isEligible).forEach(function(d){list=list.concat(collect(d));});
  return list;
}

var st={mode:"idle",list:[],i:-1,tok:0,voice:null,rate:DEF_RATE,voices:[],timer:null,wd:null,utterance:null,retried:0,voicesReady:false,sys:false,lastEl:null,canceledAt:0};
var ui={bar:null,tit:null,play:null,rate:null,voice:null,msg:null,err:null};
var synth=null,booted=false;
var SYS="__sys";
/* Références gardées : sinon Chrome peut ramasser l'énoncé et ne jamais appeler onend. */
var KEEP=window.__qcmbcUtts||(window.__qcmbcUtts=[]);
function keepRef(u){KEEP.push(u);if(KEEP.length>40)KEEP.splice(0,KEEP.length-40);}
var DEBUG=/[?&]lecturedebug=1(?:&|$|#)/.test((location.search||"")+(location.hash||"")),LOG=[];
function vid(v){return v?(v.voiceURI||v.name||""):"";}
function dbg(type,info){
  var t=new Date(),p=function(n,k){return ("00"+n).slice(-k);};
  LOG.push(p(t.getMinutes(),2)+":"+p(t.getSeconds(),2)+"."+p(t.getMilliseconds(),3)+" "+type+(info?" "+info:""));
  if(LOG.length>40)LOG.shift();
  if(DEBUG)renderDbg();
}
function renderDbg(){
  if(!D.body)return;
  var p=$("#lec-dbg");
  if(!p){p=D.createElement("pre");p.id="lec-dbg";p.title="Toucher pour réduire/agrandir";p.addEventListener("click",function(){p.classList.toggle("lec-dbg-min");});D.body.appendChild(p);}
  var all=allVoices();
  p.textContent="LECTURE DEBUG · "+(navigator.userAgent||"")+"\nvoix: "+all.length+" (fr: "+st.voices.length+") · choisie: "+
    (st.sys||!st.voice?"voix système fr-FR":(st.voice.name+" ["+st.voice.lang+"] local="+st.voice.localService))+
    " · mode="+st.mode+" #"+st.i+"/"+st.list.length+"\n"+LOG.slice().reverse().join("\n");
}
window.qcmbcLectureLog=LOG;

function scoreVoice(v){
  var n=(v.name||"")+" "+(v.voiceURI||""),lang=(v.lang||"").toLowerCase();
  if(!/^fr([-_]|$)/.test(lang)&&!/french|fran[cç]ais/i.test(n))return -1;
  var frFR=/fr-fr/.test(lang)||/french\s*\(?france\)/i.test(n);
  var s=0;
  if(frFR)s+=20;
  else if(/fr-ca/.test(lang))s+=8;
  else s+=10;
  /* 1. Google français (nom contenant « Google » et fr-FR) */
  if(/google/i.test(n)&&frFR)s+=400;
  else if(/google/i.test(n))s+=60;
  /* 2. Microsoft Julie */
  if(/julie/i.test(n))s+=200;
  if(/microsoft/i.test(n)&&/julie/i.test(n))s+=20;
  /* 3. Natural / Online fr-FR, puis les autres fr-FR / fr-* */
  if(/natural|online|neural|premium|enhanced|superieure|supérieure/i.test(n))s+=frFR?80:30;
  if(/am[eé]lie/i.test(n))s+=22;
  if(/\bthomas\b/i.test(n))s+=18;
  if(/microsoft/i.test(n))s+=12;
  if(/audrey|denise|henri|hortense|claire/i.test(n))s+=10;
  if(v.localService===true)s+=8;
  if(/compact|eloquence|espeak|pico/i.test(n))s-=25;
  return s;
}
function allVoices(){try{return synth.getVoices()||[];}catch(e){return [];}}
function preferredVoices(){
  return allVoices().filter(function(v){return scoreVoice(v)>=0;}).sort(function(a,b){return scoreVoice(b)-scoreVoice(a);});
}
function localFrench(){
  var list=preferredVoices().filter(function(v){return v.localService!==false;});
  return list[0]||null;
}
function pickVoice(list,wanted){
  if(!list||!list.length)return null;
  if(wanted){
    var i,v;
    for(i=0;i<list.length;i++){v=list[i];if(v.voiceURI===wanted||v.name===wanted)return v;}
  }
  return list[0];
}
function showNoFrMsg(on){
  if(!ui.msg)return;
  ui.msg.hidden=!on;
  ui.msg.classList.toggle("lec-msg-on",!!on);
}
function fillVoices(){
  if(!synth)return;
  st.voices=preferredVoices();
  var stored=load(),sel=ui.voice,v,i,opt,got=allVoices();
  if(got.length)st.voicesReady=true;
  st.sys=stored.sys===true||stored.voice===SYS;
  st.voice=pickVoice(st.voices,stored.voice&&stored.voice!==SYS?stored.voice:"");
  if(sel){
    sel.innerHTML="";
    if(!st.voices.length){
      opt=D.createElement("option");opt.value="";opt.textContent=got.length?"Voix du navigateur":"Voix (chargement…)";sel.appendChild(opt);
    }else{
      for(i=0;i<st.voices.length;i++){
        v=st.voices[i];opt=D.createElement("option");
        opt.value=v.voiceURI||v.name;
        opt.textContent=v.name+(v.lang?" ("+v.lang+")":"");
        if(!st.sys&&st.voice&&(st.voice.voiceURI||st.voice.name)===opt.value)opt.selected=true;
        sel.appendChild(opt);
      }
      opt=D.createElement("option");opt.value=SYS;opt.textContent="Voix de l’appareil (système)";
      if(st.sys)opt.selected=true;
      sel.appendChild(opt);
    }
  }
  if(DEBUG)renderDbg();
  if(st.voicesReady)showNoFrMsg(!st.voices.length);
}

function clearHL(){$$(".lec-cur").forEach(function(e){e.classList.remove("lec-cur");});}
function highlight(el){
  clearHL();
  if(!el||!el.classList)return;
  el.classList.add("lec-cur");
  if(el===st.lastEl)return;
  st.lastEl=el;
  var r=el.getBoundingClientRect(),vh=window.innerHeight,bar=ui.bar,bh=bar&&!bar.hidden?bar.offsetHeight+16:16;
  if(r.top<80||r.bottom>vh-bh-20){
    try{el.scrollIntoView({block:"center",behavior:"smooth"});}catch(e){el.scrollIntoView(true);}
  }
}
function updateBtns(){
  var on=st.mode!=="idle";
  $$(".lec-mini,.lec-page").forEach(function(b){
    var src=b.getAttribute("data-lec");
    var active=on&&((src==="page"&&st.src==="page")||(st.det&&st.det.getAttribute("data-lec-id")===src)||(src&&src.indexOf("h-")===0&&st.src===src));
    b.setAttribute("aria-pressed",active?"true":"false");
  });
  if(!ui.play)return;
  ui.play.innerHTML=st.mode==="playing"?ICO.pause:ICO.play;
  ui.play.setAttribute("aria-label",st.mode==="playing"?"Pause":"Lecture");
  ui.play.title=st.mode==="playing"?"Pause":"Lecture";
  if(ui.tit){
    var cur=st.list[st.i],lab=cur&&cur.label?cur.label:(st.label||"Lecture");
    ui.tit.textContent=lab+(st.list.length?( " · "+(st.i+1)+"/"+st.list.length):"");
  }
}
function showBar(on){
  if(!ui.bar)return;
  ui.bar.hidden=!on;
  D.body.classList.toggle("lec-on",!!on);
  updateBtns();
}
function clearTimers(){
  if(st.timer){clearTimeout(st.timer);st.timer=null;}
  if(st.wd){clearTimeout(st.wd);st.wd=null;}
}
function showErr(on,reason){
  if(!ui.err)return;
  if(on){
    ui.err.textContent="La voix ne répond pas sur cet appareil. Monte le volume (son média), essaie une autre voix dans la liste, "+
      "ou vérifie Paramètres → Synthèse vocale → moteur Google avec le français téléchargé. Puis appuie sur ▶."+(DEBUG&&reason?" ["+reason+"]":"");
  }
  ui.err.hidden=!on;
  ui.err.classList.toggle("lec-msg-on",!!on);
}
function isBusy(){try{return !!(synth.speaking||synth.pending);}catch(e){return false;}}
function cancelSpeak(){
  st.tok++;
  clearTimers();
  st.utterance=null;
  /* On n'annule que si quelque chose parle : cancel() juste avant speak() fait perdre l'énoncé sur Chrome Android. */
  if(synth&&isBusy()){try{synth.cancel();st.canceledAt=Date.now();dbg("cancel");}catch(e){}}
}
function stop(){
  var was=st.mode!=="idle";
  cancelSpeak();
  st.mode="idle";st.list=[];st.i=-1;st.det=null;st.src="";st.label="";st.retried=0;st.lastEl=null;
  clearHL();
  showErr(false);
  showBar(false);
  updateBtns();
  if(was)dbg("stop");
}
function armWatchdog(text,my,i){
  if(st.wd){clearTimeout(st.wd);st.wd=null;}
  var cps=10*(parseFloat(st.rate)||1);
  var ms=Math.min(90000,Math.max(4000,((text||"").length/cps)*1000+3000));
  /* Uniquement après un vrai démarrage : rattrape un onend jamais reçu (bug Chrome). */
  st.wd=setTimeout(function(){
    if(st.tok!==my||st.mode!=="playing")return;
    if(isBusy()){armWatchdog(text,my,i);return;}
    dbg("watchdog","#"+i+" fin non signalée");
    speakAt(i+1,false);
  },ms);
}
function currentVoice(){
  if(st.sys||!st.voice)return null;
  /* Toujours reprendre l'objet voix dans la liste actuelle (une liste périmée fait échouer speak). */
  var id=vid(st.voice),all=allVoices(),k;
  for(k=0;k<all.length;k++)if(vid(all[k])===id)return all[k];
  return null;
}
function fail(reason,withVoice,my,i){
  if(st.tok!==my)return;
  clearTimers();
  dbg("échec","#"+i+" "+reason+(withVoice?" (avec voix choisie)":" (voix système)"));
  if(st.retried<1){
    st.retried++;
    if(withVoice){
      /* Repli mémorisé : voix système fr-FR. */
      st.sys=true;st.pendingSys=true;
      if(ui.voice)ui.voice.value=SYS;
      dbg("repli","voix système fr-FR");
    }
    if(isBusy()){try{synth.cancel();st.canceledAt=Date.now();}catch(e){}}
    st.timer=setTimeout(function(){if(st.tok===my)speakAt(i,false);},350);
    return;
  }
  /* Deuxième échec : on s'arrête sur ce passage, sans enchaîner. */
  st.tok++;
  if(isBusy()){try{synth.cancel();}catch(e){}}
  st.mode="paused";st.retried=0;
  if(st.pendingSys){
    /* Le repli n'a pas marché non plus : on garde la voix choisie par Damien. */
    st.pendingSys=false;st.sys=load().sys===true;
    if(ui.voice&&!st.sys&&st.voice)ui.voice.value=vid(st.voice);
  }
  showErr(true,reason);
  dbg("arrêt","en pause après 2 échecs, pas d'enchaînement");
  showBar(true);updateBtns();
}
function speakAt(i,fromUser){
  if(!synth)return;
  if(i<0||i>=st.list.length){stop();return;}
  var ch=st.list[i],my=++st.tok;
  clearTimers();
  if(fromUser){st.retried=0;showErr(false);}
  st.i=i;st.mode="playing";
  if(ch.el&&ch.el.closest){var d=ch.el.closest("details");if(d&&!d.open)d.open=true;}
  showBar(true);
  updateBtns();
  var U=getUtt(),u=new U(ch.speak);
  u.lang="fr-FR";
  u.rate=Math.min(2,Math.max(0.5,parseFloat(st.rate)||1.25));
  var v=currentVoice(),withVoice=!!v,started=false,done=false,t0=0;
  if(v)u.voice=v;
  st.utterance=u;keepRef(u);
  function live(){return st.tok===my&&!done;}
  function onStarted(how){
    if(!live()||started)return;
    started=true;
    clearTimers();
    if(st.pendingSys){st.pendingSys=false;save({sys:true});dbg("repli mémorisé","voix système");}
    st.retried=0;
    showErr(false);
    dbg(how,"#"+i+" après "+(Date.now()-t0)+"ms");
    highlight(ch.el);
    updateBtns();
    armWatchdog(ch.speak,my,i);
  }
  u.onstart=function(){onStarted("start");};
  u.onboundary=function(){if(!started)onStarted("boundary");};
  u.onend=function(){
    var el=Date.now()-t0;
    dbg("end","#"+i+" "+el+"ms"+(started?"":" SANS start")+(st.tok!==my?" (ancien)":""));
    if(!live())return;
    if(!started&&el<700){done=true;fail("fin immédiate sans démarrage",withVoice,my,i);return;}
    done=true;clearTimers();
    speakAt(i+1,false);
  };
  u.onerror=function(ev){
    var err=(ev&&ev.error)||"inconnue";
    dbg("error","#"+i+" "+err+(st.tok!==my?" (ancien)":""));
    if(!live())return;
    done=true;
    fail("erreur "+err,withVoice,my,i);
  };
  function launch(){
    if(st.tok!==my)return;
    t0=Date.now();
    dbg("speak","#"+i+" "+(v?v.name:"voix système fr-FR")+" x"+u.rate.toFixed(2)+" "+ch.speak.length+"c"+(fromUser?" (geste)":""));
    try{synth.speak(u);}catch(e){done=true;fail("exception "+(e&&e.message),withVoice,my,i);return;}
    try{if(synth.paused)synth.resume();}catch(e){}
    /* Pas de démarrage en 6 s : échec (sauf si le moteur parle quand même sans signaler start). */
    st.wd=setTimeout(function(){
      if(!live()||started)return;
      if(isBusy()&&synth.speaking){onStarted("speaking");return;}
      done=true;fail("aucun démarrage après 6 s",withVoice,my,i);
    },6000);
  }
  /* Premier speak du geste : synchrone. Après un cancel() récent, petit délai pour ne pas perdre l'énoncé. */
  var recent=Date.now()-st.canceledAt<200;
  if(isBusy()){try{synth.cancel();st.canceledAt=Date.now();}catch(e){}recent=true;}
  if(recent)st.timer=setTimeout(launch,200);
  else launch();
}
function startList(list,src,det,label,from,fromUser){
  if(!list||!list.length)return;
  cancelSpeak();
  st.list=list;st.src=src;st.det=det||null;st.label=label||"";st.retried=0;
  speakAt(from==null?0:from,!!fromUser);
}
function startPage(){
  var list=allChunks(),label=(($("h1")&&$("h1").textContent)||"Révisions").replace(/\s+/g," ").trim();
  $$("details").filter(isEligible).forEach(function(d){d.open=true;});
  startList(list,"page",null,label,0,true);
}
function startDet(det){
  if(!det||!isEligible(det))return;
  det.open=true;
  startList(collect(det),det.getAttribute("data-lec-id")||"",det,titleOf(det),0,true);
}
function startFromEl(el){
  if(!el){startPage();return;}
  var det=el.closest&&el.closest("details");
  if(det)det.open=true;
  var list=allChunks(),i,e,pos;
  for(i=0;i<list.length;i++){
    e=list[i].el;if(!e)continue;
    if(e===el||(el.contains&&el.contains(e)))break;
    try{pos=el.compareDocumentPosition(e);}catch(ex){pos=0;}
    if(pos&Node.DOCUMENT_POSITION_FOLLOWING)break;
  }
  if(i>=list.length)i=0;
  var label=(det?titleOf(det):textOf(el))||"Lecture";
  var src=el.getAttribute&&el.getAttribute("data-lec-id")||(det&&det.getAttribute("data-lec-id"))||"page";
  startList(list,src,det||null,label,i,true);
}
function toggle(){
  if(st.mode==="playing"){
    /* pause()/resume() sont peu fiables sur Android : on annule et on reprendra le passage courant. */
    cancelSpeak();
    st.mode="paused";
    updateBtns();
    showBar(true);
    return;
  }
  if(st.mode==="paused"){
    speakAt(st.i>=0?st.i:0,true);
    return;
  }
  startPage();
}

function buildBar(){
  var bar=D.createElement("div");bar.id="lec-bar";bar.hidden=true;bar.setAttribute("role","region");bar.setAttribute("aria-label","Lecture audio");
  bar.innerHTML='<div class="lec-tit" id="lec-tit">Lecture</div><div class="lec-row"><div class="lec-ctrls">'+
    '<button type="button" id="lec-prev" aria-label="Passage précédent" title="Passage précédent">'+ICO.prev+'</button>'+
    '<button type="button" id="lec-play" aria-label="Lecture" title="Lecture">'+ICO.play+'</button>'+
    '<button type="button" id="lec-next" aria-label="Passage suivant" title="Passage suivant">'+ICO.next+'</button>'+
    '<button type="button" id="lec-stop" aria-label="Arrêter" title="Arrêter">'+ICO.stop+'</button>'+
    '</div><div class="lec-opts">'+
    '<select class="lec-rate" id="lec-rate" aria-label="Vitesse de lecture"></select>'+
    '<select class="lec-voice" id="lec-voice" aria-label="Voix"></select>'+
    '</div></div>'+
    '<div class="lec-msg lec-err" id="lec-err" role="alert" hidden></div>'+
    '<div class="lec-msg" id="lec-msg" hidden>Aucune voix française n’est installée. Sur Android : Paramètres → Synthèse vocale → Google, puis télécharge le français.</div>';
  D.body.appendChild(bar);
  ui.bar=bar;ui.tit=$("#lec-tit",bar);ui.play=$("#lec-play",bar);ui.rate=$("#lec-rate",bar);ui.voice=$("#lec-voice",bar);ui.msg=$("#lec-msg",bar);ui.err=$("#lec-err",bar);
  RATES.forEach(function(r){var o=D.createElement("option");o.value=r;o.textContent=r;if(r===st.rate)o.selected=true;ui.rate.appendChild(o);});
  ui.rate.value=st.rate;
  ui.rate.addEventListener("change",function(){st.rate=RATES.indexOf(ui.rate.value)>=0?ui.rate.value:DEF_RATE;save({rate:st.rate});if(st.mode==="playing")speakAt(st.i,true);});
  ui.voice.addEventListener("change",function(){
    var val=ui.voice.value||"";
    st.sys=val===SYS;
    if(!st.sys)st.voice=pickVoice(st.voices,val);
    save({voice:val,sys:st.sys});
    dbg("voix",st.sys?"système":vid(st.voice));
    if(st.mode==="playing")speakAt(st.i,true);
  });
  $("#lec-play",bar).addEventListener("click",toggle);
  $("#lec-stop",bar).addEventListener("click",stop);
  $("#lec-prev",bar).addEventListener("click",function(){if(!st.list.length)return;speakAt(Math.max(0,st.i-1),true);});
  $("#lec-next",bar).addEventListener("click",function(){if(!st.list.length)return;speakAt(Math.min(st.list.length-1,st.i+1),true);});
}

function injectButtons(){
  var h1=$("body>h1")||$("h1");
  if(h1&&!D.querySelector(".lec-page")){
    var b=D.createElement("button");
    b.type="button";b.className="lec-page";b.setAttribute("data-lec","page");
    b.setAttribute("aria-label","Lire la page");b.title="Lire cette fiche (raccourci L sur ordinateur)";
    b.innerHTML=ICO.play+" Lecture";
    b.addEventListener("click",function(e){e.preventDefault();startPage();});
    var after=h1,nxt=h1.nextElementSibling;
    if(nxt&&nxt.classList&&nxt.classList.contains("sub")){after=nxt;nxt=after.nextElementSibling;}
    if(nxt&&nxt.classList&&nxt.classList.contains("note"))after=nxt;
    after.insertAdjacentElement("afterend",b);
  }
  var n=0;
  $$("details").forEach(function(det){
    if(!isEligible(det))return;
    if(det.querySelector("summary .lec-mini"))return;
    n++;
    var id="d"+n;
    det.setAttribute("data-lec-id",id);
    var sum=det.querySelector("summary");if(!sum)return;
    var b=D.createElement("button");
    b.type="button";b.className="lec-mini";b.setAttribute("data-lec",id);
    b.setAttribute("aria-label","Lire cette section");b.title="Lire cette section";
    b.innerHTML=ICO.play;
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();startDet(det);});
    sum.appendChild(b);
  });
  /* Fiche longue : un bouton sur chaque titre h2/h3, lecture à partir de ce titre. */
  var heads=$$(".c h2, .c h3");
  if(heads.length>=2||$$("details").filter(isEligible).length>=2){
    heads.forEach(function(h,i){
      if(h.querySelector(".lec-mini"))return;
      var hid="h-"+(i+1);
      h.setAttribute("data-lec-id",hid);
      var b=D.createElement("button");
      b.type="button";b.className="lec-mini";b.setAttribute("data-lec",hid);
      b.setAttribute("aria-label","Lire depuis ce titre");b.title="Lire depuis ce titre";
      b.innerHTML=ICO.play;
      b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();startFromEl(h);});
      h.appendChild(b);
    });
  }
}
function injectHelp(){
  var ov=$("#dk-helpov");if(!ov||ov.querySelector(".dk-lec"))return;
  var table=ov.querySelector("table");if(!table)return;
  var tr=D.createElement("tr");tr.className="dk-lec";tr.innerHTML="<td><kbd>L</kbd></td><td>lecture / pause</td>";
  var rows=table.querySelectorAll("tr"),i,placed=false;
  for(i=0;i<rows.length;i++){
    if(rows[i].textContent.indexOf("afficher")>=0&&rows[i].textContent.indexOf("cette aide")>=0){
      rows[i].parentNode.insertBefore(tr,rows[i]);placed=true;break;
    }
  }
  if(!placed)(table.tBodies[0]||table).appendChild(tr);
}
function watchVoices(){
  fillVoices();
  if(synth.addEventListener)synth.addEventListener("voiceschanged",fillVoices);
  else synth.onvoiceschanged=fillVoices;
  var tries=0,t=setInterval(function(){
    tries++;
    fillVoices();
    if(st.voicesReady||tries>=15){
      clearInterval(t);
      st.voicesReady=true;
      fillVoices();
    }
  },400);
}

function init(){
  if(booted||!hasSynth())return;
  booted=true;
  synth=getSynth();
  D.documentElement.classList.add("lec-ok");
  var stored=migrate();
  st.rate=(stored.rate&&RATES.indexOf(String(stored.rate))>=0)?String(stored.rate):DEF_RATE;
  injectButtons();
  buildBar();
  watchVoices();
  var mq=window.matchMedia&&window.matchMedia("(min-width:1024px)");
  D.addEventListener("keydown",function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var el=e.target,tg=(el&&el.tagName)||"";
    if(tg==="TEXTAREA"||tg==="SELECT"||(el&&el.isContentEditable)||(tg==="INPUT"&&el.type!=="checkbox"))return;
    if(e.key==="Escape"&&st.mode!=="idle"){e.preventDefault();stop();return;}
    if(e.key!=="l"&&e.key!=="L")return;
    if(!mq||!mq.matches)return;
    var help=$("#dk-helpov");if(help&&help.classList.contains("dk-vis"))return;
    e.preventDefault();toggle();
  });
  if(window.MutationObserver)new MutationObserver(injectHelp).observe(D.body,{childList:true,subtree:true});
  injectHelp();
  window.addEventListener("pagehide",stop);
  window.addEventListener("beforeunload",stop);
  document.addEventListener("qcmbc:dictation-start",stop);
  window.qcmbcLectureStop=stop;
  if(DEBUG){dbg("debug actif","synth="+(!!synth)+" android="+ANDROID);}
}
function boot(){
  if(hasSynth()){if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",init);else init();return;}
  var n=0,t=setInterval(function(){
    n++;
    if(hasSynth()){clearInterval(t);if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",init);else init();}
    else if(n>=20)clearInterval(t);
  },250);
}
boot();
})();
