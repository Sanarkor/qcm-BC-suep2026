/* Lecteur de la fiche express : MP3 Vivienne, PC et smartphone. */
(function(){
var D=document, KEY="qcmbc:ficheExpressRate", VER="20261116g";
var RATES=["0.75","1","1.25","1.5"];
var MAN="lecture_audio/fiche_express/manifest.json?v="+VER;
var st={themes:[],courses:[],item:null,queue:[],qi:-1,origin:null,all:false,mode:"idle",rate:"1"};
var ui={};
var audio=null,pre=null;

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
    if(st.qi+1<st.queue.length){playQueueAt(st.qi+1,false);return;}
    ui.msg.textContent="Lecture indisponible pour cet extrait.";
    ui.msg.hidden=false;
    st.mode="idle";updBtns();
  });
  return audio;
}
function sameSrc(el,file){
  if(!el||!el.src||!file)return false;
  try{return el.src.indexOf(file)>=0;}catch(e){return false;}
}
function preloadNext(){
  var nx=st.queue[st.qi+1];
  if(!nx||!nx.file)return;
  try{
    if(!pre){pre=new Audio();pre.preload="auto";pre.setAttribute("playsinline","true");}
    if(!sameSrc(pre,nx.file)){pre.src=srcOf(nx.file);try{pre.load();}catch(e2){}}
  }catch(e){}
}
function mediaMeta(){
  if(!("mediaSession" in navigator))return;
  try{
    navigator.mediaSession.metadata=new MediaMetadata({
      title:labelOf(st.item)||"Fiche express",
      artist:"QCM SUEP B/C",
      album:"Fiche express"
    });
    navigator.mediaSession.playbackState=st.mode==="playing"?"playing":(st.mode==="paused"?"paused":"none");
  }catch(e){}
}
function mediaInit(){
  if(!("mediaSession" in navigator))return;
  try{
    navigator.mediaSession.setActionHandler("play",function(){if(st.mode==="paused")resume();else if(st.item)playItem(st.item,true);});
    navigator.mediaSession.setActionHandler("pause",function(){pause();});
    navigator.mediaSession.setActionHandler("stop",function(){stop();});
    navigator.mediaSession.setActionHandler("nexttrack",function(){if(st.qi+1<st.queue.length)playQueueAt(st.qi+1,false);});
    navigator.mediaSession.setActionHandler("previoustrack",function(){if(st.qi>0)playQueueAt(st.qi-1,false);});
  }catch(e){}
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
  var num=item.type==="course"?("Cours "+(item.n<10?"0":"")+item.n): (item.short||item.title||"Thème");
  return (st.all?"Tout · ":"")+num;
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
    if(item.theme){
      var tb=$('.fx-tbtn[data-id="'+item.theme+'"]');
      if(tb)tb.setAttribute("aria-pressed","true");
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
function playItem(item,resume){
  if(!item||!item.file){stop();return;}
  st.item=item;st.mode="playing";
  if(ui.msg){ui.msg.hidden=true;ui.msg.textContent="";}
  var a=getAudio();
  if(!resume||!a.src||a.ended){a.src=srcOf(item.file);}
  applyRate();
  highlight(item);
  updBtns();
  try{a.setAttribute("playsinline","true");}catch(e){}
  var pr=a.play();
  if(pr&&pr.catch)pr.catch(function(err){
    if(err&&err.name==="NotAllowedError"){st.mode="paused";updBtns();mediaMeta();}
  });
  preloadNext();
  mediaMeta();
}
function asCourse(c){
  return {type:"course",id:c.id,n:c.n,title:c.title,file:c.file,duration:c.duration,theme:c.theme};
}
function coursesFrom(n){
  return st.courses.filter(function(c){return c.n>=n;}).slice().sort(function(a,b){return a.n-b.n;}).map(asCourse);
}
function firstCourseOfTheme(tid){
  var list=st.courses.filter(function(c){return c.theme===tid;}).slice().sort(function(a,b){return a.n-b.n;});
  return list.length?list[0]:null;
}
function playQueue(queue,origin,all){
  if(!queue||!queue.length){stop();return;}
  st.queue=queue;st.qi=0;st.origin=origin||null;st.all=!!all;
  playQueueAt(0,false);
}
function playQueueAt(i,resume){
  if(i<0||i>=st.queue.length){stop();return;}
  st.qi=i;
  playItem(st.queue[i],!!resume);
}
function pause(){
  if(st.mode!=="playing")return;
  try{getAudio().pause();}catch(e){}
  st.mode="paused";updBtns();mediaMeta();
}
function resume(){
  if(st.mode!=="paused")return;
  var a=getAudio();
  if(a.src&&a.currentTime>0&&!a.ended){
    st.mode="playing";applyRate();
    var pr=a.play();
    if(pr&&pr.catch)pr.catch(function(){st.mode="paused";mediaMeta();});
    updBtns();mediaMeta();
  }else if(st.queue.length&&st.qi>=0)playQueueAt(st.qi,false);
  else if(st.item)playItem(st.item,false);
}
function toggle(){
  if(st.mode==="playing")pause();
  else if(st.mode==="paused")resume();
  else if(st.queue.length&&st.qi>=0)playQueueAt(st.qi,false);
  else if(st.item)playItem(st.item,false);
}
function stop(){
  st.mode="idle";st.all=false;st.item=null;st.queue=[];st.qi=-1;st.origin=null;
  if(audio){try{audio.pause();audio.removeAttribute("src");audio.load();}catch(e){}}
  if(pre){try{pre.pause();pre.removeAttribute("src");}catch(e){}}
  highlight(null);updBtns();mediaMeta();
}
function onEnded(){
  if(st.mode!=="playing")return;
  if(st.qi+1<st.queue.length){playQueueAt(st.qi+1,false);return;}
  stop();
}
function playTheme(t){
  if(st.origin&&st.origin.type==="theme"&&st.origin.id===t.id&&st.mode!=="idle"){
    if(st.mode==="playing"){pause();return;}
    if(st.mode==="paused"){resume();return;}
  }
  var first=firstCourseOfTheme(t.id);
  if(!first){stop();return;}
  playQueue(coursesFrom(first.n),{type:"theme",id:t.id},false);
}
function playCourse(c){
  if(st.item&&st.item.type==="course"&&st.item.n===c.n&&st.queue.length){
    if(st.mode==="playing"){pause();return;}
    if(st.mode==="paused"){resume();return;}
  }
  playQueue(coursesFrom(c.n),{type:"course",n:c.n},false);
}
function playAll(){
  if(st.all&&st.mode==="playing"){pause();return;}
  if(st.all&&st.mode==="paused"){resume();return;}
  if(!st.courses.length)return;
  var first=st.courses.slice().sort(function(a,b){return a.n-b.n;})[0];
  playQueue(coursesFrom(first.n),{type:"all"},true);
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
    b.addEventListener("click",function(){playTheme(t);});
    ui.themes.appendChild(b);
    var sec=$("#"+t.id),h=sec&&sec.querySelector("h2");
    addPlayBtn(h,"fx-hplay","Lire ce thème et la suite","Lire le thème et la suite : "+t.title,function(){playTheme(t);});
  });
}
function buildCourses(){
  st.courses.forEach(function(c){
    var art=$("#"+c.id);
    var h=art&&art.querySelector("h3");
    addPlayBtn(h,"fx-cplay","Lire cette fiche et la suite","Lire le cours "+c.n+" et la suite : "+c.title,function(){playCourse(c);},h.querySelector(".n"));
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
  /* Ne pas arrêter ni mettre en pause sur pagehide / visibilitychange / blur :
     la file MP3 (et le préchargement du fichier suivant) doit continuer hors focus,
     y compris après Alt+Tab, un changement d'onglet ou l'écran du téléphone. */
  mediaInit();
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
    st.courses=(d.courses||[]).slice().sort(function(a,b){return a.n-b.n;});
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
