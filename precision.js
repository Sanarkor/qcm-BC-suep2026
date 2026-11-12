/* « Rechercher dans mes cours » : recherche locale (sans serveur) dans les cours de Damien. Classement BM25 (Best Matching 25). */
(function(){
var SW="a au aux avec ce ces cet cette dans de des du elle en est et etre eu il ils je la le les leur leurs lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous y c d j l m n s t qu a peut peuvent sont ont fait faire tout tous toute toutes plus moins tres bien sans sous entre ainsi donc car si comme dont lorsque quand alors cela ceci ca celui celle ceux elles leur afin selon apres avant aussi encore deja etc ni non oui pourquoi comment quel quelle quels quelles quoi combien est-ce faut doit doivent cas lors sera seront etait ete avoir avait suis es sommes etes vrai faux reponse reponses question bonne mauvaise".split(" ");
var STOP={};SW.forEach(function(w){STOP[w]=1});
function norm(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function stem(w){if(w.length>4&&/[sx]$/.test(w))w=w.slice(0,-1);if(w.length>5&&/e$/.test(w))w=w.slice(0,-1);return w;}
function toks(s){var m=norm(s).match(/[a-z0-9]+/g)||[],r=[];for(var i=0;i<m.length;i++){var w=m[i];if(w.length<2&&!/\d/.test(w))continue;if(STOP[w])continue;r.push(stem(w));}return r;}
var IDX=null,loading=null;
function load(){if(IDX)return Promise.resolve(IDX);if(loading)return loading;
loading=fetch("cours_index.json",{cache:"force-cache"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(function(j){
var N=j.p.length,df={},tf=[],len=[],tot=0;
for(var i=0;i<N;i++){var t=toks(j.p[i][1]),c={};for(var k=0;k<t.length;k++)c[t[k]]=(c[t[k]]||0)+1;tf.push(c);len.push(t.length);tot+=t.length;for(var w in c)df[w]=(df[w]||0)+1;}
IDX={d:j.d,p:j.p,tf:tf,len:len,df:df,N:N,avg:tot/N};return IDX;}).catch(function(e){loading=null;throw e;});return loading;}
function search(user,ctx){var I=IDX,q={},ut=toks(user),ct=toks(ctx);
ut.forEach(function(w){q[w]=(q[w]||0)+2});ct.forEach(function(w){q[w]=(q[w]||0)+0.5});
var terms=Object.keys(q).filter(function(w){return I.df[w]}),k1=1.4,b=0.75,sc=[];
for(var i=0;i<I.N;i++){var s=0,c=I.tf[i],hitU=0;for(var t=0;t<terms.length;t++){var w=terms[t],f=c[w];if(!f)continue;
var idf=Math.log(1+(I.N-I.df[w]+0.5)/(I.df[w]+0.5));s+=Math.min(q[w],3)*idf*f*(k1+1)/(f+k1*(1-b+b*I.len[i]/I.avg));if(ut.indexOf(w)>=0)hitU++;}
if(s>0)sc.push([i,s*(1+0.3*hitU)]);}
sc.sort(function(a,b){return b[1]-a[1]});var out=[],perDoc={};
for(var n=0;n<sc.length&&out.length<5;n++){var d=I.p[sc[n][0]][0];if((perDoc[d]||0)>=2)continue;perDoc[d]=(perDoc[d]||0)+1;out.push(sc[n]);}
return {res:out,q:q,ut:ut};}
function esc(t){var d=document.createElement("div");d.textContent=t;return d.innerHTML;}
function snippet(text,q,ut){var S=text.split(/(?<=[.;:!?])\s+/),best=0,bs=-1;
function ss(s){var t=toks(s),v=0;t.forEach(function(w){if(q[w])v+=ut.indexOf(w)>=0?2:0.5});return v;}
var vals=S.map(ss);for(var i=0;i<S.length;i++){var v=vals[i]+(vals[i+1]||0)*0.8+(vals[i+2]||0)*0.5;if(v>bs){bs=v;best=i;}}
var st=Math.max(0,best-(best>0&&vals[best-1]>0?1:0)),ex=S.slice(st,st+3).join(" ");if(ex.length>520)ex=ex.slice(0,500).replace(/\s\S*$/,"")+" …";
if(st>0)ex="… "+ex;if(st+3<S.length&&!/…$/.test(ex))ex+=" …";
return esc(ex).replace(/[A-Za-zÀ-ÿ0-9]+/g,function(w){var s=stem(norm(w));if(!STOP[norm(w)]&&q[s]&&(s.length>2||/\d/.test(s)))return "<mark"+(ut.indexOf(s)>=0?"":" class=\"c\"")+">"+w+"</mark>";return w;});}
var css=document.createElement("style");css.textContent="#prBtn{grid-column:1/-1}#prOv{position:fixed;inset:0;z-index:10000;background:rgba(10,20,40,.55);display:none;overscroll-behavior:contain}#prOv.on{display:flex;align-items:flex-start;justify-content:center}#prBox{background:#fff;width:min(780px,100%);max-height:calc(100dvh - 24px);margin:12px;border-radius:0;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,.3)}#prHead{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--p1f3b6f,#1f3b6f);color:#fff;border-radius:0;font-weight:600}#prHead button{margin:0;padding:4px 12px;background:#fff;color:var(--p1f3b6f,#1f3b6f)}#prBody{padding:12px 14px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}#prIn{width:100%;box-sizing:border-box;font-size:16px;padding:9px;border:1px solid #b8c2d6;border-radius:0;min-height:64px;resize:vertical;font-family:inherit}#prRes .it{border:1px solid #d5dbe6;border-radius:0;padding:9px;margin:10px 0;background:#fafbfd;line-height:1.45}#prRes .src{font-size:.82em;color:var(--p1f3b6f,#1f3b6f);font-weight:600;margin-bottom:4px}#prRes mark{background:#ffe680;padding:0 1px;border-radius:0}#prRes mark.c{background:#e4ecfb}#prRes .nfo{font-size:.85em;color:#556}";document.head.appendChild(css);
var ov=document.createElement("div");ov.id="prOv";ov.innerHTML="<div id=\"prBox\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Rechercher dans mes cours\"><div id=\"prHead\"><span>Rechercher dans mes cours</span><button type=\"button\" id=\"prX\">Fermer ✕</button></div><div id=\"prBody\"><p class=\"small\" style=\"margin-top:0\">Tape ta question ou des mots-clés : la recherche se fait dans tes 64 cours.</p><textarea id=\"prIn\" placeholder=\"Ex. : délai de repos après une vacation de nuit ?\"></textarea><button type=\"button\" id=\"prGo\">Chercher dans mes cours</button><div id=\"prRes\"></div></div></div>";
document.body.appendChild(ov);
function $(i){return document.getElementById(i)}
var btn=document.createElement("button");btn.type="button";btn.id="prBtn";btn.className="big";btn.textContent="🔎 Rechercher dans mes cours";
$("home").appendChild(btn);
function ctx(){return "";}
function open(){ov.classList.add("on");document.body.style.overflow="hidden";setTimeout(function(){$("prIn").focus()},50);load().catch(function(){});}
function close(){ov.classList.remove("on");document.body.style.overflow="";}
function go(){var u=$("prIn").value.trim(),R=$("prRes");if(!u){R.innerHTML="<p class=\"nfo\">Tape d’abord ta question.</p>";return;}R.innerHTML="<p class=\"nfo\">Chargement des cours…</p>";
load().then(function(){var r=search(u,ctx());if(!r.res.length){R.innerHTML="<p class=\"nfo\">Aucun passage trouvé. Essaie d’autres mots.</p>";return;}
var h="<p class=\"nfo\">"+r.res.length+" passage(s) trouvé(s)"+". Tes mots sont surlignés.</p>";
r.res.forEach(function(x){var p=IDX.p[x[0]];h+="<div class=\"it\"><div class=\"src\">📘 "+esc(IDX.d[p[0]])+"</div>"+snippet(p[1],r.q,r.ut)+"</div>";});R.innerHTML=h;R.scrollIntoView({block:"nearest"});
}).catch(function(){R.innerHTML="<p class=\"nfo\">Impossible de charger les cours (connexion ?). Réessaie.</p>";});}
btn.addEventListener("click",open);$("prX").addEventListener("click",close);$("prGo").addEventListener("click",go);
ov.addEventListener("click",function(e){if(e.target===ov)close();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&ov.classList.contains("on"))close();});
$("prIn").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();go();}});
window.__prSearch=function(u){return load().then(function(){var r=search(u,ctx());return r.res.map(function(x){return IDX.d[IDX.p[x[0]][0]]})})};
})();
