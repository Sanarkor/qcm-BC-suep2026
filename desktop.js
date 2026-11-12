/* Interface bureau (écrans ≥ 1024 px). En dessous de 1024 px, ce script ne modifie RIEN : pas de classe, pas de barre latérale, pas de raccourci. */
(function(){
if(!window.matchMedia)return;
var MQ=window.matchMedia("(min-width:1024px)"),H=document.documentElement,D=document;
var me=D.currentScript||D.querySelector('script[src$="desktop.js"]'),BASE=me?me.getAttribute("src").replace(/desktop\.js.*$/,""):"";
var path=location.pathname,file=(path.match(/[^\/]*$/)||[""])[0]||"index.html",inDet=/\/detaillees\//.test(path);
function $(s,r){return (r||D).querySelector(s);}function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
var type=$("#themes")&&$("#exams")?"index":$("#dk-scores")?"scores":(inDet&&$(".toc,details"))?"fiche":$(".cl")?"revdet":/^revisions/.test(file)?"rev":$("#opts")&&$("#val")?"card":($("#timer")&&($(".q")||$("#qs")))?"exam":$(".q[data-a]")?"serie":"autre";
var KEYH="qcmbc:historique";
function ld(k,d){try{var v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v;}catch(e){return d;}}
function jours(){var t=new Date(),a=Date.UTC(t.getFullYear(),t.getMonth(),t.getDate()),b=Date.UTC(2026,10,30);return Math.round((b-a)/864e5);}
function cdTxt(){var j=jours();return j>1?"J-"+j:j===1?"Demain !":j===0?"C’est aujourd’hui !":"Examen passé";}
function errN(){return Object.keys(ld("qcmbc:erreurs",{})||{}).length;}
var side=null,help=null,on=false,booted=false;
function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function active(){if(type==="index")return location.hash==="#themes"?"themes":location.hash==="#exams"?"exams":"home";
if(/^\d\d_/.test(file)&&!inDet)return "themes";if(/^examen_/.test(file))return "exams";if(inDet||file==="revisions_detaillees.html")return "revdet";
if(/^revisions/.test(file))return "rev";if(/^sigles/.test(file))return "sigles";return {"aleatoire.html":"alea","erreurs.html":"err","scores.html":"scores"}[file]||"";}
var NAV=[["home","index.html","⌂","Accueil"],["themes","index.html#themes","☰","QCM par thème"],["alea","aleatoire.html","⤨","Mode aléatoire"],["exams","index.html#exams","⏱","Examens"],
["rev","revisions.html","✎","Révisions synthétiques"],["revdet","revisions_detaillees.html","❐","Révisions détaillées"],["sigles","sigles_accueil.html","Aa","Sigles et acronymes"],["err","erreurs.html","↻","Mes erreurs"],["scores","scores.html","▦","Tableau de bord"]];
function buildSide(){var ic=$('link[rel="apple-touch-icon"]')||$('link[rel="icon"][sizes="192x192"]')||$('link[rel="icon"]'),src=ic?ic.getAttribute("href"):"";
side=el("nav","");side.id="dk-side";side.setAttribute("aria-label","Navigation principale");
var h='<a class="dk-brand" href="'+BASE+'index.html">'+(src?'<img alt="" src="'+src+'">':'')+'<div><div class="dk-t1">QCM SUEP B/C</div><div class="dk-t2">30 novembre 2026</div></div></a>';
h+='<div class="dk-cd" title="Examen le 30 novembre 2026"><div class="dk-cdn">'+cdTxt()+'</div><div class="dk-cdl">Examen le 30 novembre 2026</div></div><div class="dk-links">';
var a=active();NAV.forEach(function(n){var badge=n[0]==="err"?'<em class="dk-n" id="dk-errn">'+errN()+'</em>':"";
h+='<a class="dk-l'+(n[0]===a?' dk-on':'')+'" data-k="'+n[0]+'" href="'+BASE+n[1]+'"'+(n[0]===a?' aria-current="page"':'')+'><i>'+n[2]+'</i><div>'+n[3]+'</div>'+badge+'</a>';
});
h+='</div><button type="button" class="dk-help" id="dk-helpbtn">⌨ Raccourcis clavier <kbd>H</kbd></button>';
side.innerHTML=h;D.body.appendChild(side);
$("#dk-helpbtn").addEventListener("click",function(){toggleHelp();});
if(type==="index")$$(".dk-l",side).forEach(function(l){var k=l.getAttribute("data-k");if(k==="home"||k==="themes"||k==="exams")l.addEventListener("click",function(e){if(typeof window.show==="function"){e.preventDefault();window.show(k);window.scrollTo(0,0);mark();}});});}
function mark(){if(!side)return;var a=active();$$(".dk-l",side).forEach(function(l){var o=l.getAttribute("data-k")===a;l.classList.toggle("dk-on",o);if(o)l.setAttribute("aria-current","page");else l.removeAttribute("aria-current");});}
var SHORT={serie:[["1 – 4 ou A – D","cocher / décocher une réponse"],["Entrée","voir la correction de la question"],["↓ ou →","question suivante"],["↑ ou ←","question précédente"]],
exam:[["1 – 4 ou A – D","cocher / décocher une réponse"],["Entrée, ↓ ou →","question suivante"],["↑ ou ←","question précédente"],["","La correction reste sur le bouton « Corriger le tout »"]],
card:[["1 – 4 ou A – D","cocher / décocher une réponse"],["Entrée","valider, puis question suivante"],["→","question suivante (après validation)"]]};
function toggleHelp(force){if(!help){help=el("div","");help.id="dk-helpov";help.setAttribute("role","dialog");help.setAttribute("aria-label","Raccourcis clavier");
var rows=(SHORT[type]||[]).concat([["H","afficher / masquer cette aide"],["Échap","fermer"]]);
var h='<div class="dk-hbox"><div class="dk-htitle">Raccourcis clavier</div>'+(SHORT[type]?"":'<p class="dk-hnote">Les raccourcis de réponse fonctionnent sur les pages de QCM, d’examen, du mode aléatoire, des sigles et des erreurs.</p>')+'<table>';
rows.forEach(function(r){h+="<tr><td>"+(r[0]?"<kbd>"+r[0]+"</kbd>":"")+"</td><td>"+r[1]+"</td></tr>";});h+='</table><button type="button" id="dk-hclose">Fermer</button></div>';
help.innerHTML=h;D.body.appendChild(help);help.addEventListener("click",function(e){if(e.target===help||e.target.id==="dk-hclose")toggleHelp(false);});}
var vis=help.classList.contains("dk-vis"),show=force==null?!vis:!!force;help.classList.toggle("dk-vis",show);help.hidden=!show;}
/* ---- question courante ---- */
var cur=null;
function qs(){return type==="card"?[]:$$(type==="exam"&&$("#qs")?"#qs .q":".q");}
function setCur(q,scroll){if(cur)cur.classList.remove("dk-cur");cur=q;if(!q)return;q.classList.add("dk-cur");if(scroll)q.scrollIntoView({block:"center",behavior:"smooth"});}
function firstVisible(){var L=qs();for(var i=0;i<L.length;i++){var r=L[i].getBoundingClientRect();if(r.bottom>80)return L[i];}return L[0]||null;}
function move(d){var L=qs();if(!L.length)return;var i=cur?L.indexOf(cur):-1;if(i<0){setCur(firstVisible(),true);return;}i=Math.max(0,Math.min(L.length-1,i+d));setCur(L[i],true);}
function onKey(e){if(!on||e.ctrlKey||e.metaKey||e.altKey)return;var t=e.target,tg=(t&&t.tagName)||"";
if(e.key==="Escape"&&help&&help.classList.contains("dk-vis")){toggleHelp(false);return;}
if(tg==="TEXTAREA"||tg==="SELECT"||(t&&t.isContentEditable)||(tg==="INPUT"&&t.type!=="checkbox"))return;
if(e.key==="h"||e.key==="H"){e.preventDefault();toggleHelp();return;}
if(help&&help.classList.contains("dk-vis"))return;
if(type!=="serie"&&type!=="exam"&&type!=="card")return;
var k=e.key,idx="1234".indexOf(k);if(idx<0&&k.length===1)idx="abcd".indexOf(k.toLowerCase());
if(idx>=0){var box=type==="card"?$("#opts"):(cur||(setCur(firstVisible(),false),cur));if(!box)return;var inp=$$("input[type=checkbox]",box)[idx];
if(inp&&!inp.disabled){e.preventDefault();inp.click();}return;}
if(k==="Enter"){if(tg==="BUTTON"||tg==="A")return;e.preventDefault();
if(type==="card"){var v=$("#val"),n=$("#next");if(v&&!v.disabled&&!$("#card[hidden]"))v.click();else if(n&&!n.disabled)n.click();return;}
if(type==="serie"){if(!cur)setCur(firstVisible(),false);var b=cur&&$("button",cur);if(b){b.click();}return;}
move(1);return;}
if(k==="ArrowDown"||k==="ArrowRight"){if(type==="card"){if(k==="ArrowRight"){var nx=$("#next");if(nx&&!nx.disabled){e.preventDefault();nx.click();}}return;}e.preventDefault();move(1);return;}
if(k==="ArrowUp"||k==="ArrowLeft"){if(type==="card")return;e.preventDefault();move(-1);return;}}
/* ---- historique des notes (enregistré seulement sur PC, dans une clé à part) ---- */
function hist(){var tgt=type==="serie"?$("#score"):type==="exam"?$("#note"):null;if(!tgt)return;var last=tgt.textContent;
try{new MutationObserver(function(){var x=tgt.textContent;if(!x||x===last)return;last=x;var m=x.match(/(\d+)\s*\/\s*(\d+)/);if(!m)return;var s=+m[1],n=+m[2];if(!n)return;
var L=ld(KEYH,[]);if(!Array.isArray(L))L=[];L.push({k:file+location.search,t:(D.title||file).replace(/\s+–\s+Brigadier-chef SUEP 2026$/,"").replace(/\s+·\s+QCM SUEP B\/C$/,""),s:s,n:n,sel:/Sélection/.test(x),d:Date.now()});
if(L.length>600)L=L.slice(-600);try{localStorage.setItem(KEYH,JSON.stringify(L));}catch(e){}}).observe(tgt,{childList:true,characterData:true,subtree:true});}catch(e){}}
/* ---- fiches détaillées : sommaire actif ---- */
var spy=null;
function fiche(){var links=$$(".toc a");if(!links.length||!window.IntersectionObserver)return;var map={};links.forEach(function(a){map[a.getAttribute("href").slice(1)]=a;});
spy=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){links.forEach(function(a){a.classList.remove("dk-act");});var a=map[x.target.id];if(a)a.classList.add("dk-act");}});},{rootMargin:"-10% 0px -75% 0px"});
$$("details[id]").forEach(function(d){spy.observe(d);});}
/* ---- accueil : bandeau de bord ---- */
function hero(){if($("#dk-hero"))return;var a=ld("qcmbc:aleatoire",null),L=ld(KEYH,[]),last=Array.isArray(L)&&L.length?L[L.length-1]:null;
var x=el("div","");x.id="dk-hero";
x.innerHTML='<div class="dk-kpi dk-big"><div class="dk-kv">'+cdTxt()+'</div><div class="dk-kl">avant l’examen du 30 novembre 2026</div></div>'+
'<a class="dk-kpi" href="erreurs.html"><div class="dk-kv">'+errN()+'</div><div class="dk-kl">questions à retravailler</div></a>'+
'<a class="dk-kpi" href="aleatoire.html"><div class="dk-kv">'+(a&&a.n?Math.round(a.ok*100/a.n)+" %":"–")+'</div><div class="dk-kl">réussite en mode aléatoire'+(a&&a.n?" ("+a.ok+"/"+a.n+")":"")+'</div></a>'+
'<a class="dk-kpi" href="scores.html"><div class="dk-kv">'+(last?(Math.round(last.s*200/last.n)/10).toString().replace(".",",")+"/20":"–")+'</div><div class="dk-kl">'+(last?"dernière note : "+last.t.replace(/</g,"&lt;"):"tableau de bord des scores")+'</div></a>';
var h1=$("body>h1");if(h1)h1.parentNode.insertBefore(x,h1.nextSibling);}
function enable(){if(on)return;on=true;H.classList.add("dk","dk-"+type);if(!side)buildSide();else side.hidden=false;var b=$("#dk-errn");if(b)b.textContent=errN();
if(type==="index")hero();var hx=$("#dk-hero");if(hx)hx.hidden=false;
if(!booted){booted=true;D.addEventListener("keydown",onKey);if(type==="serie"||type==="exam"){D.addEventListener("click",function(e){if(!on)return;var q=e.target.closest&&e.target.closest(".q");if(q&&qs().indexOf(q)>=0)setCur(q,false);});D.addEventListener("focusin",function(e){if(!on)return;var q=e.target.closest&&e.target.closest(".q");if(q&&qs().indexOf(q)>=0)setCur(q,false);});}
hist();if(type==="fiche")fiche();if(type==="index")window.addEventListener("hashchange",function(){if(!on)return;var h=location.hash.slice(1);if(typeof window.show==="function")window.show(h==="themes"||h==="exams"?h:"home");mark();});}}
function disable(){if(!on)return;on=false;H.classList.remove("dk","dk-"+type);if(side)side.hidden=true;var hx=$("#dk-hero");if(hx)hx.hidden=true;if(cur){cur.classList.remove("dk-cur");cur=null;}if(help)toggleHelp(false);}
function upd(){if(MQ.matches)enable();else disable();}
upd();if(MQ.addEventListener)MQ.addEventListener("change",upd);else if(MQ.addListener)MQ.addListener(upd);
window.addEventListener("pageshow",function(){if(on){var b=$("#dk-errn");if(b)b.textContent=errN();}});
})();
