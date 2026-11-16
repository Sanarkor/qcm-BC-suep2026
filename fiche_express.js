/* Lecteur de la fiche express : MP3 Vivienne, PC et smartphone. */
(function(){
var D=document, KEY="qcmbc:ficheExpressRate";
var RATES=["0.75","1","1.25","1.5"];
var MAN="lecture_audio/fiche_express/manifest.json?v=20261116b";
var st={themes:[],i:-1,all:false,mode:"idle",rate:"1"};
var ui={};
var audio=null;

function $(s,r){return (r||D).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function fmt(t){
  t=Math.max(0,Math.floor(t||0));
  var h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;
  var mm=(h?String(m).padStart(2,"0"):String(m)),ss=String(s).padStart(2,"0");
  return h?h+":"+mm+":"+ss:mm+":"+ss;
}
function loadRate(){
  try{var r=String((JSON.parse(localStorage.getItem(KEY)||"{}")||{}).rate||"");}catch(e){var r="";}
  return RATES.indexOf(r)>=0?r:"1";
}
function saveRate(){try{localStorage.setItem(KEY,JSON.stringify({rate:st.rate}));}catch(e){}}
function getAudio(){
  if(audio)return audio;
  audio=new Audio();audio.preload="auto";
  audio.addEventListener("ended",onEnded);
  audio.addEventListener("timeupdate",updTime);
  audio.addEventListener("loadedmetadata",updTime);
  audio.addEventListener("error",function(){
    if(st.mode!=="playing")return;
    ui.msg.textContent="Lecture indisponible pour ce thème.";
    ui.msg.hidden=false;
    st.mode="idle";updBtns();
  });
  return audio;
}
function applyRate(){
  var a=getAudio(),r=parseFloat(st.rate)||1;
  try{a.defaultPlaybackRate=a.playbackRate=r;}catch(e){}
}
function updTime(){
  if(!ui.time)return;
  var a=audio,dur=0,cur=0;
  if(a&&isFinite(a.duration))dur=a.duration;
  if(a)cur=a.currentTime||0;
  if(st.i>=0&&st.themes[st.i]&&!(dur>0))dur=st.themes[st.i].duration||0;
  ui.time.textContent=fmt(cur)+" / "+fmt(dur);
}
function labelOf(i){
  var t=st.themes[i];
  return t?(t.short||t.title):"Fiche express";
}
function highlight(i){
  $$("section.fx-reading, h2.fx-reading").forEach(function(el){el.classList.remove("fx-reading");});
  $$(".fx-tbtn[aria-pressed='true']").forEach(function(b){b.setAttribute("aria-pressed","false");});
  if(i<0)return;
  var t=st.themes[i];if(!t)return;
  var sec=$("#"+t.id);
  if(sec){
    sec.classList.add("fx-reading");
    var h=sec.querySelector("h2");if(h)h.classList.add("fx-reading");
    try{sec.scrollIntoView({block:"start",behavior:"smooth"});}catch(e){}
  }
  var b=$('.fx-tbtn[data-i="'+i+'"]');
  if(b)b.setAttribute("aria-pressed","true");
}
function updBtns(){
  var playing=st.mode==="playing";
  var idle=st.mode==="idle";
  if(ui.toggle){
    ui.toggle.setAttribute("aria-label",playing?"Pause":"Lecture");
    ui.toggle.textContent=playing?"❚❚":"▶";
    ui.toggle.disabled=idle&&st.i<0;
  }
  if(ui.stop)ui.stop.disabled=idle;
  if(ui.all){
    ui.all.setAttribute("aria-pressed",st.all&&!idle?"true":"false");
    ui.all.textContent=st.all&&playing?"Tout en cours":"Tout lire";
  }
  if(ui.now){
    ui.now.textContent=st.i>=0?((st.all?"Tout · ":"")+labelOf(st.i)):"Lecture Vivienne";
  }
  D.body.classList.toggle("fx-on",!idle);
  updTime();
}
function playAt(i,fromAll,resume){
  if(i<0||i>=st.themes.length){stop();return;}
  var t=st.themes[i];
  st.i=i;st.all=!!fromAll;st.mode="playing";
  ui.msg.hidden=true;ui.msg.textContent="";
  var a=getAudio();
  if(!resume||!a.src||a.ended){
    a.src=t.file+(t.file.indexOf("?")>=0?"":"?v=20261116b");
  }
  applyRate();
  highlight(i);
  updBtns();
  var pr=a.play();
  if(pr&&pr.catch)pr.catch(function(err){
    if(err&&err.name==="NotAllowedError"){st.mode="paused";updBtns();}
  });
  var nx=st.themes[i+1];
  if(nx){try{fetch(nx.file+(nx.file.indexOf("?")>=0?"":"?v=20261116b")).catch(function(){});}catch(e){}}
}
function pause(){
  if(st.mode!=="playing")return;
  try{getAudio().pause();}catch(e){}
  st.mode="paused";updBtns();
}
function resume(){
  if(st.mode!=="paused")return;
  var a=getAudio();
  if(a.src&&a.currentTime>0&&!a.ended){
    st.mode="playing";applyRate();
    var pr=a.play();
    if(pr&&pr.catch)pr.catch(function(){st.mode="paused";});
    updBtns();
  }else playAt(st.i,st.all,false);
}
function toggle(){
  if(st.mode==="playing")pause();
  else if(st.mode==="paused")resume();
  else if(st.i>=0)playAt(st.i,st.all,false);
}
function stop(){
  st.mode="idle";st.all=false;st.i=-1;
  if(audio){try{audio.pause();audio.removeAttribute("src");audio.load();}catch(e){}}
  highlight(-1);updBtns();
}
function onEnded(){
  if(st.mode!=="playing")return;
  if(st.all&&st.i+1<st.themes.length)playAt(st.i+1,true,false);
  else stop();
}
function playAll(){
  if(st.all&&st.mode==="playing"){pause();return;}
  if(st.all&&st.mode==="paused"){resume();return;}
  playAt(0,true,false);
}
function buildThemes(){
  if(!ui.themes)return;
  ui.themes.innerHTML="";
  st.themes.forEach(function(t,i){
    var b=D.createElement("button");
    b.type="button";b.className="fx-tbtn";b.setAttribute("data-i",String(i));
    b.setAttribute("aria-pressed","false");
    b.setAttribute("aria-label","Lire : "+(t.short||t.title));
    b.innerHTML='<span class="fx-tn">'+(t.n||i+1)+'</span><span class="fx-tl">'+(t.short||t.title)+'</span>';
    b.addEventListener("click",function(){
      if(st.i===i&&st.mode==="playing"&&!st.all)pause();
      else if(st.i===i&&st.mode==="paused"&&!st.all)resume();
      else playAt(i,false,false);
    });
    ui.themes.appendChild(b);
    var sec=$("#"+t.id),h=sec&&sec.querySelector("h2");
    if(h&&!h.querySelector(".fx-hplay")){
      var p=D.createElement("button");
      p.type="button";p.className="fx-hplay";p.title="Lire ce thème";
      p.setAttribute("aria-label","Lire le thème : "+t.title);
      p.textContent="▶";
      p.addEventListener("click",function(e){e.preventDefault();playAt(i,false,false);});
      h.appendChild(p);
    }
  });
}
function setupToc(){
  var toc=$("#fx-toc")||$("nav.toc");
  var tog=$("#fx-toc-tog");
  var body=$("#fx-toc-body");
  if(!toc||!tog||!body)return;
  function setOpen(o){
    toc.classList.toggle("open",o);
    tog.setAttribute("aria-expanded",o?"true":"false");
  }
  tog.addEventListener("click",function(){setOpen(!toc.classList.contains("open"));});
  body.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[href^='#']");
    if(!a)return;
    if(window.matchMedia&&window.matchMedia("(max-width:1023px)").matches)setOpen(false);
  });
}
function buildBar(){
  var bar=$("#fx-player");if(!bar)return;
  bar.hidden=false;
  ui.bar=bar;
  ui.all=$("#fx-all",bar);
  ui.toggle=$("#fx-toggle",bar);
  ui.stop=$("#fx-stop",bar);
  ui.now=$("#fx-now",bar);
  ui.time=$("#fx-time",bar);
  ui.rate=$("#fx-rate",bar);
  ui.themes=$("#fx-themes",bar);
  ui.msg=$("#fx-msg",bar);
  st.rate=loadRate();
  if(ui.rate){
    if(!ui.rate.options.length){
      [{"v":"0.75","l":"×0,75"},{"v":"1","l":"×1,00"},{"v":"1.25","l":"×1,25"},{"v":"1.5","l":"×1,50"}].forEach(function(o){
        var el=D.createElement("option");el.value=o.v;el.textContent=o.l;ui.rate.appendChild(el);
      });
    }
    ui.rate.value=st.rate;
    ui.rate.addEventListener("change",function(){
      st.rate=RATES.indexOf(ui.rate.value)>=0?ui.rate.value:"1";
      saveRate();applyRate();
    });
  }
  if(ui.all)ui.all.addEventListener("click",playAll);
  if(ui.toggle)ui.toggle.addEventListener("click",toggle);
  if(ui.stop)ui.stop.addEventListener("click",stop);
  D.addEventListener("keydown",function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var el=e.target,tg=(el&&el.tagName)||"";
    if(tg==="TEXTAREA"||tg==="SELECT"||(el&&el.isContentEditable)||(tg==="INPUT"&&el.type!=="checkbox"))return;
    if(e.key==="Escape"&&st.mode!=="idle"){e.preventDefault();stop();}
  });
  window.addEventListener("pagehide",stop);
  window.addEventListener("beforeunload",stop);
  updBtns();
}
function init(){
  setupToc();
  buildBar();
  fetch(MAN,{cache:"no-cache"}).then(function(r){return r.ok?r.json():null;}).then(function(d){
    if(!d||!d.themes||!d.themes.length){
      if(ui.msg){ui.msg.textContent="Manifeste audio introuvable.";ui.msg.hidden=false;}
      return;
    }
    st.themes=d.themes;
    buildThemes();
    updBtns();
  }).catch(function(){
    if(ui.msg){ui.msg.textContent="Impossible de charger la lecture.";ui.msg.hidden=false;}
  });
}
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",init);
else init();
})();
