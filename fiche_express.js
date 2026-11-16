/* Lecteur de la fiche express : MP3 Vivienne, PC et smartphone. */
(function(){
var D=document, KEY="qcmbc:ficheExpressRate", VER="20261116d";
var RATES=["0.75","1","1.25","1.5"];
var MAN="lecture_audio/fiche_express/manifest.json?v="+VER;
var st={themes:[],courses:[],item:null,all:false,mode:"idle",rate:"1"};
var ui={};
var audio=null;

function $(s,r){return (r||D).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function srcOf(file){return file+(file.indexOf("?")>=0?"":"?v="+VER);}
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
    ui.msg.textContent="Lecture indisponible pour cet extrait.";
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
  if(!(dur>0)&&st.item&&st.item.duration)dur=st.item.duration;
  ui.time.textContent=fmt(cur)+" / "+fmt(dur);
}
function labelOf(item){
  if(!item)return "Lecture Vivienne";
  if(item.type==="course")return "Cours "+(item.n<10?"0":"")+item.n;
  return (st.all?"Tout · ":"")+(item.short||item.title||"Thème");
}
function sameItem(a,b){return !!(a&&b&&a.type===b.type&&a.file===b.file);}
function highlight(item){
  $$("section.fx-reading, h2.fx-reading, article.fx-reading").forEach(function(el){el.classList.remove("fx-reading");});
  $$(".fx-tbtn[aria-pressed='true'], .fx-cplay[aria-pressed='true']").forEach(function(b){b.setAttribute("aria-pressed","false");});
  if(!item)return;
  if(item.type==="theme"){
    var sec=$("#"+item.id);
    if(sec){
      sec.classList.add("fx-reading");
      var h=sec.querySelector("h2");if(h)h.classList.add("fx-reading");
      try{sec.scrollIntoView({block:"start",behavior:"smooth"});}catch(e){}
    }
    var tb=$('.fx-tbtn[data-id="'+item.id+'"]');
    if(tb)tb.setAttribute("aria-pressed","true");
  }else if(item.type==="course"){
    var art=$("#"+item.id);
    if(art){
      art.classList.add("fx-reading");
      try{art.scrollIntoView({block:"start",behavior:"smooth"});}catch(e){}
      var cb=art.querySelector(".fx-cplay");
      if(cb)cb.setAttribute("aria-pressed","true");
    }
  }
}
function updBtns(){
  var playing=st.mode==="playing";
  var idle=st.mode==="idle";
  if(ui.toggle){
    ui.toggle.setAttribute("aria-label",playing?"Pause":"Lecture");
    ui.toggle.textContent=playing?"❚❚":"▶";
    ui.toggle.disabled=idle&&!st.item;
  }
  if(ui.stop)ui.stop.disabled=idle;
  if(ui.all){
    ui.all.setAttribute("aria-pressed",st.all&&!idle?"true":"false");
    ui.all.textContent=st.all&&playing?"Tout en cours":"Tout lire";
  }
  if(ui.now)ui.now.textContent=labelOf(st.item);
  D.body.classList.toggle("fx-on",!idle);
  updTime();
}
function playItem(item,fromAll,resume){
  if(!item||!item.file){stop();return;}
  st.item=item;st.all=!!fromAll;st.mode="playing";
  if(ui.msg){ui.msg.hidden=true;ui.msg.textContent="";}
  var a=getAudio();
  if(!resume||!a.src||a.ended){a.src=srcOf(item.file);}
  applyRate();
  highlight(item);
  updBtns();
  var pr=a.play();
  if(pr&&pr.catch)pr.catch(function(err){
    if(err&&err.name==="NotAllowedError"){st.mode="paused";updBtns();}
  });
  if(item.type==="theme"&&fromAll){
    var i=themeIndex(item);
    var nx=i>=0?st.themes[i+1]:null;
    if(nx){try{fetch(srcOf(nx.file)).catch(function(){});}catch(e){}}
  }
}
function themeIndex(item){
  if(!item||item.type!=="theme")return -1;
  for(var i=0;i<st.themes.length;i++){if(st.themes[i].id===item.id)return i;}
  return -1;
}
function asTheme(t){
  return {type:"theme",id:t.id,n:t.n,title:t.title,short:t.short,file:t.file,duration:t.duration};
}
function asCourse(c){
  return {type:"course",id:c.id,n:c.n,title:c.title,file:c.file,duration:c.duration,theme:c.theme};
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
  }else if(st.item)playItem(st.item,st.all,false);
}
function toggle(){
  if(st.mode==="playing")pause();
  else if(st.mode==="paused")resume();
  else if(st.item)playItem(st.item,st.all,false);
}
function stop(){
  st.mode="idle";st.all=false;st.item=null;
  if(audio){try{audio.pause();audio.removeAttribute("src");audio.load();}catch(e){}}
  highlight(null);updBtns();
}
function onEnded(){
  if(st.mode!=="playing")return;
  if(st.all&&st.item&&st.item.type==="theme"){
    var i=themeIndex(st.item);
    if(i>=0&&i+1<st.themes.length){playItem(asTheme(st.themes[i+1]),true,false);return;}
  }
  stop();
}
function playTheme(t,fromAll){
  var item=asTheme(t);
  if(sameItem(st.item,item)&&!fromAll){
    if(st.mode==="playing"&&!st.all){pause();return;}
    if(st.mode==="paused"&&!st.all){resume();return;}
  }
  playItem(item,!!fromAll,false);
}
function playCourse(c){
  var item=asCourse(c);
  if(sameItem(st.item,item)){
    if(st.mode==="playing"){pause();return;}
    if(st.mode==="paused"){resume();return;}
  }
  playItem(item,false,false);
}
function playAll(){
  if(st.all&&st.mode==="playing"){pause();return;}
  if(st.all&&st.mode==="paused"){resume();return;}
  if(st.themes[0])playItem(asTheme(st.themes[0]),true,false);
}
function addPlayBtn(host,cls,title,label,onClick,after){
  if(!host||host.querySelector("."+cls))return;
  var p=D.createElement("button");
  p.type="button";p.className=cls;p.title=title;
  p.setAttribute("aria-label",label);
  p.setAttribute("aria-pressed","false");
  p.textContent="▶";
  p.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();onClick();});
  if(after&&after.parentNode===host)after.insertAdjacentElement("afterend",p);
  else host.appendChild(p);
}
function buildThemes(){
  if(!ui.themes)return;
  ui.themes.innerHTML="";
  st.themes.forEach(function(t,i){
    var b=D.createElement("button");
    b.type="button";b.className="fx-tbtn";b.setAttribute("data-i",String(i));b.setAttribute("data-id",t.id);
    b.setAttribute("aria-pressed","false");
    b.setAttribute("aria-label","Lire : "+(t.short||t.title));
    b.innerHTML='<span class="fx-tn">'+(t.n||i+1)+'</span><span class="fx-tl">'+(t.short||t.title)+'</span>';
    b.addEventListener("click",function(){playTheme(t,false);});
    ui.themes.appendChild(b);
    var sec=$("#"+t.id),h=sec&&sec.querySelector("h2");
    addPlayBtn(h,"fx-hplay","Lire ce thème","Lire le thème : "+t.title,function(){playTheme(t,false);});
  });
}
function buildCourses(){
  st.courses.forEach(function(c){
    var art=$("#"+c.id);
    var h=art&&art.querySelector("h3");
    addPlayBtn(h,"fx-cplay","Lire cette fiche","Lire le cours "+c.n+" : "+c.title,function(){playCourse(c);},h.querySelector(".n"));
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
    st.courses=d.courses||[];
    buildThemes();
    buildCourses();
    updBtns();
  }).catch(function(){
    if(ui.msg){ui.msg.textContent="Impossible de charger la lecture.";ui.msg.hidden=false;}
  });
}
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",init);
else init();
})();
