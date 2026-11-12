/* Mode Lecture des révisions synthétiques. Web Speech API (speechSynthesis), sans service externe. */
(function(){
if(typeof window.speechSynthesis==="undefined")return;
var D=document,synth=window.speechSynthesis,KEY="qcmbc:lecture";
var RATES=["1.00","1.25","1.50","1.75","2.00"],DEF_RATE="1.00";
function $(s,r){return (r||D).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||"{}")||{};return o&&typeof o==="object"?o:{};}catch(e){return {};}}
function save(p){var o=load(),k;for(k in p)if(Object.prototype.hasOwnProperty.call(p,k))o[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
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
function isNumbered(det){
  if(isSigles(det))return false;
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
  return s;
}
function textOf(el){
  if(!el)return "";
  if(el.tagName==="TR"){
    return $$("th,td",el).map(function(c){return c.textContent.replace(/\s+/g," ").trim();}).filter(Boolean).join(" : ");
  }
  return (el.textContent||"").replace(/\s+/g," ").trim();
}
function collect(det){
  var root=det.querySelector(".c")||det,out=[],seen={};
  var title=titleOf(det);
  if(title)out.push({el:det.querySelector("summary")||det,speak:speakable(title),label:title});
  $$("p, li, tr",root).forEach(function(el){
    if(el.closest("#lec-bar,.nav,.lec-page,.lec-mini"))return;
    if(el.tagName==="LI"&&el.querySelector("li,table"))return;
    var t=textOf(el);if(!t||t.length<2)return;
    if(seen[t]&&el.tagName!=="TR")return;seen[t]=1;
    var sp=speakable(t);if(!sp)return;
    /* Coupe les très longs blocs (limite Chrome) en phrases. */
    if(sp.length>240){
      var parts=sp.replace(/([.!?…;:])\s+/g,"$1\n").split("\n"),buf="",i;
      for(i=0;i<parts.length;i++){
        if(buf&&(buf.length+parts[i].length)>220){out.push({el:el,speak:buf,label:title});buf=parts[i];}
        else buf=buf?(buf+" "+parts[i]):parts[i];
      }
      if(buf)out.push({el:el,speak:buf,label:title});
    }else out.push({el:el,speak:sp,label:title});
  });
  return out;
}

var st={mode:"idle",list:[],i:-1,tok:0,voice:null,rate:DEF_RATE,voices:[],timer:null};
var ui={bar:null,tit:null,play:null,rate:null,voice:null};

function curVoiceName(){return st.voice?(st.voice.name||st.voice.voiceURI):"";}
function scoreVoice(v){
  var n=(v.name||"")+" "+(v.voiceURI||""),lang=(v.lang||"").toLowerCase();
  if(!/^fr([-_]|$)/.test(lang)&&!/french|fran[cç]ais/i.test(n))return -1;
  var s=0;
  if(/fr-fr/.test(lang))s+=20;else if(/fr-ca/.test(lang))s+=8;else s+=10;
  if(/natural|online|neural|premium|enhanced|superieure|supérieure/i.test(n))s+=50;
  if(/google/i.test(n))s+=40;
  if(/am[eé]lie/i.test(n))s+=35;
  if(/\bthomas\b/i.test(n))s+=30;
  if(/microsoft/i.test(n))s+=15;
  if(/audrey|denise|henri|hortense|claire/i.test(n))s+=12;
  if(v.localService===false)s+=10;
  if(/compact|eloquence|espeak|pico/i.test(n))s-=25;
  return s;
}
function preferredVoices(){
  var all=[];
  try{all=synth.getVoices()||[];}catch(e){all=[];}
  return all.filter(function(v){return scoreVoice(v)>=0;}).sort(function(a,b){return scoreVoice(b)-scoreVoice(a);});
}
function pickVoice(list,wanted){
  if(!list.length)return null;
  if(wanted){
    var i,v;
    for(i=0;i<list.length;i++){v=list[i];if(v.voiceURI===wanted||v.name===wanted)return v;}
  }
  return list[0];
}
function fillVoices(){
  st.voices=preferredVoices();
  var stored=load(),sel=ui.voice,v,i,opt;
  st.voice=pickVoice(st.voices,stored.voice);
  if(!sel)return;
  sel.innerHTML="";
  if(!st.voices.length){
    opt=D.createElement("option");opt.value="";opt.textContent="Voix du navigateur";sel.appendChild(opt);return;
  }
  for(i=0;i<st.voices.length;i++){
    v=st.voices[i];opt=D.createElement("option");
    opt.value=v.voiceURI||v.name;
    opt.textContent=v.name+(v.lang?" ("+v.lang+")":"");
    if(st.voice&&(st.voice.voiceURI||st.voice.name)===opt.value)opt.selected=true;
    sel.appendChild(opt);
  }
}

function clearHL(){$$(".lec-cur").forEach(function(e){e.classList.remove("lec-cur");});}
function highlight(el){
  clearHL();
  if(!el||!el.classList)return;
  el.classList.add("lec-cur");
  var r=el.getBoundingClientRect(),vh=window.innerHeight,bar=ui.bar,bh=bar&&!bar.hidden?bar.offsetHeight+16:16;
  if(r.top<80||r.bottom>vh-bh-20){
    try{el.scrollIntoView({block:"center",behavior:"smooth"});}catch(e){el.scrollIntoView(true);}
  }
}
function updateBtns(){
  var on=st.mode!=="idle";
  $$(".lec-mini,.lec-page").forEach(function(b){
    var src=b.getAttribute("data-lec");
    var active=on&&((src==="page"&&st.src==="page")||(st.det&&st.det.getAttribute("data-lec-id")===src));
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
function cancelSpeak(){
  st.tok++;
  if(st.timer){clearTimeout(st.timer);st.timer=null;}
  try{synth.cancel();}catch(e){}
}
function stop(){
  cancelSpeak();
  st.mode="idle";st.list=[];st.i=-1;st.det=null;st.src="";st.label="";
  clearHL();
  showBar(false);
  updateBtns();
}
function speakAt(i){
  if(i<0||i>=st.list.length){stop();return;}
  st.i=i;st.mode="playing";
  var ch=st.list[i],my=++st.tok;
  if(ch.el&&ch.el.closest){var d=ch.el.closest("details");if(d)d.open=true;}
  highlight(ch.el);
  updateBtns();
  showBar(true);
  var u=new SpeechSynthesisUtterance(ch.speak);
  u.lang="fr-FR";
  u.rate=Math.min(2,Math.max(0.5,parseFloat(st.rate)||1));
  if(st.voice)u.voice=st.voice;
  u.onend=function(){if(st.tok!==my)return;speakAt(i+1);};
  u.onerror=function(){if(st.tok!==my)return;st.timer=setTimeout(function(){if(st.tok===my)speakAt(i+1);},80);};
  try{synth.cancel();}catch(e){}
  st.timer=setTimeout(function(){
    if(st.tok!==my)return;
    try{synth.speak(u);}catch(e){speakAt(i+1);}
  },60);
}
function startList(list,src,det,label,from){
  if(!list||!list.length)return;
  cancelSpeak();
  st.list=list;st.src=src;st.det=det||null;st.label=label||"";
  speakAt(from==null?0:from);
}
function startPage(){
  var list=[],dets=$$("details").filter(isNumbered),label=(($("h1")&&$("h1").textContent)||"Révisions").replace(/\s+/g," ").trim();
  dets.forEach(function(d){d.open=true;list=list.concat(collect(d));});
  startList(list,"page",null,label,0);
}
function startDet(det){
  if(!det)return;
  det.open=true;
  startList(collect(det),det.getAttribute("data-lec-id")||"",det,titleOf(det),0);
}
function toggle(){
  if(st.mode==="playing"){
    try{synth.pause();}catch(e){}
    /* Certains navigateurs ignorent pause() : on s'arrête sur le chunk courant. */
    st.mode="paused";
    if(!synth.paused&&!synth.speaking){/* rien */}
    updateBtns();
    return;
  }
  if(st.mode==="paused"){
    try{synth.resume();}catch(e){}
    if(synth.speaking||synth.paused){st.mode="playing";updateBtns();return;}
    speakAt(st.i>=0?st.i:0);
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
    '</div></div>';
  D.body.appendChild(bar);
  ui.bar=bar;ui.tit=$("#lec-tit",bar);ui.play=$("#lec-play",bar);ui.rate=$("#lec-rate",bar);ui.voice=$("#lec-voice",bar);
  RATES.forEach(function(r){var o=D.createElement("option");o.value=r;o.textContent=r;if(r===st.rate)o.selected=true;ui.rate.appendChild(o);});
  ui.rate.value=st.rate;
  ui.rate.addEventListener("change",function(){st.rate=RATES.indexOf(ui.rate.value)>=0?ui.rate.value:DEF_RATE;save({rate:st.rate});if(st.mode==="playing")speakAt(st.i);});
  ui.voice.addEventListener("change",function(){
    st.voice=pickVoice(st.voices,ui.voice.value);
    save({voice:ui.voice.value||""});
    if(st.mode==="playing")speakAt(st.i);
  });
  $("#lec-play",bar).addEventListener("click",toggle);
  $("#lec-stop",bar).addEventListener("click",stop);
  $("#lec-prev",bar).addEventListener("click",function(){if(!st.list.length)return;speakAt(Math.max(0,st.i-1));});
  $("#lec-next",bar).addEventListener("click",function(){if(!st.list.length)return;speakAt(Math.min(st.list.length-1,st.i+1));});
}

function injectButtons(){
  var h1=$("body>h1")||$("h1");
  if(h1){
    var b=D.createElement("button");
    b.type="button";b.className="lec-page";b.setAttribute("data-lec","page");
    b.setAttribute("aria-label","Lire la page");b.title="Lire toutes les fiches de cette page (raccourci L sur ordinateur)";
    b.innerHTML=ICO.play+" Lecture";
    b.addEventListener("click",function(e){e.preventDefault();startPage();});
    var sub=h1.nextElementSibling;
    if(sub&&sub.classList&&sub.classList.contains("sub"))sub.insertAdjacentElement("afterend",b);
    else h1.insertAdjacentElement("afterend",b);
  }
  var n=0;
  $$("details").forEach(function(det){
    if(!isNumbered(det))return;
    n++;
    var id="d"+n;
    det.setAttribute("data-lec-id",id);
    var sum=det.querySelector("summary");if(!sum)return;
    var b=D.createElement("button");
    b.type="button";b.className="lec-mini";b.setAttribute("data-lec",id);
    b.setAttribute("aria-label","Lire cette fiche");b.title="Lire cette fiche";
    b.innerHTML=ICO.play;
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();startDet(det);});
    sum.appendChild(b);
  });
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

function init(){
  D.documentElement.classList.add("lec-ok");
  var stored=load();
  st.rate=(stored.rate&&RATES.indexOf(String(stored.rate))>=0)?String(stored.rate):DEF_RATE;
  injectButtons();
  buildBar();
  fillVoices();
  if(typeof synth.addEventListener==="function")synth.addEventListener("voiceschanged",fillVoices);
  else synth.onvoiceschanged=fillVoices;
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
}
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",init);else init();
})();
