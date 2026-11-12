/* Mode Lecture des révisions synthétiques et détaillées. Web Speech API (speechSynthesis), sans service externe. */
(function(){
var D=document,KEY="qcmbc:lecture",STORE_VER=4;
var RATES=["1.00","1.25","1.50","1.75","2.00"],DEF_RATE="1.00";
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
  /* v4 : vitesse remise une fois à 1.00 (nouveau défaut) ; la voix choisie est gardée. */
  o.rate=DEF_RATE;
  if(!o.v||o.v<3)delete o.voice;
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
  back:svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
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
function titleOf(det,noNum){
  var sum=det.querySelector("summary");if(!sum)return "Fiche";
  var c=sum.cloneNode(true);
  $$(".lec-mini"+(noNum?",.n":""),c).forEach(function(b){b.remove();});
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
/*MOTS-DEBUT*/
/* Généré par tools/gen_lecture_mots.py : mots en majuscules lus comme des mots, et sigles toujours épelés. */
var CAPS_WORDS={"ABROGE":"abrogé","ABROGES":"abrogés","ACADEMIE":"académie","ACCES":"accès","ACCUSE":"accusé","ACQUISITION":"acquisition","ACTEURS":"acteurs","ACTION":"action","AGE":"âge","ALSETEX":"alsetex","ANCIEN":"ancien","ANNUEL":"annuel","AOUT":"août","APPLICATION":"application","APPORT":"apport","APPRECIATION":"appréciation","APPREHENDER":"appréhender","APRES":"après","ARME":"arme","ARRIVEE":"arrivée","ART":"art","ARTICLE":"article","ARTICLES":"articles","ASPECTS":"aspects","ASSAUT":"assaut","ASSOCIATION":"association","ATTENTION":"attention","AU":"au","AUCUNE":"aucune","AUTORISEES":"autorisées","AUTRES":"autres","AUX":"aux","AVANT":"avant","AVEC":"avec","AVRIL":"avril","AXON":"axon","BALISTIQUES":"balistiques","BARBE":"barbe","BATONS":"bâtons","BIEN":"bien","BILAN":"bilan","BONNEAU":"Bonneau","CABINET":"cabinet","CADRE":"cadre","CAS":"cas","CATEGORIE":"catégorie","CE":"ce","CETTE":"cette","CHARGE":"charge","CHEFFE":"cheffe","CHEVEUX":"cheveux","CIRCULAIRE":"circulaire","CLERMONT":"Clermont","CLES":"clés","CODE":"code","COMMANDEMENT":"commandement","COMPETENCES":"compétences","COMPLEMENTS":"complements","CONCERNES":"concernés","CONCLUSION":"conclusion","CONDITIONS":"conditions","CONDOR":"condor","CONDUIT":"conduit","CONGES":"congés","CONTINUE":"continue","CORPULENCE":"corpulence","CORRESPONDANCE":"correspondance","COUGAR":"cougar","COURONNE":"couronne","COURS":"cours","CREDIT":"crédit","CREL":"crel","CYCLIQUES":"cycliques","DAME":"dame","DANGER":"danger","DANS":"dans","DE":"de","DECRET":"décret","DELAI":"délai","DELEGATION":"délégation","DELIT":"délit","DEMANDEUR":"demandeur","DEMARCHE":"démarche","DEPART":"départ","DEPLOIEMENT":"déploiement","DEROGATIONS":"dérogations","DEROGATOIRE":"dérogatoire","DERRIERE":"derrière","DES":"des","DESENCERCLEMENT":"désencerclement","DESTABILISER":"déstabiliser","DESTINEE":"destinée","DETECTER":"détecter","DEUX":"deux","DEVANT":"devant","DIFFERENTS":"différents","DIFFICULTE":"difficulté","DIRECTEUR":"directeur","DIRECTION":"direction","DISPOSITIF":"dispositif","DISPOSITION":"disposition","DISTANCE":"distance","DOCUMENTATION":"documentation","DOMICILE":"domicile","DOMMAGES":"dommages","DONC":"donc","DOTATION":"dotation","DU":"du","DUREE":"durée","EDITION":"edition","EFFET":"effet","ELECTRIQUES":"électriques","ELEMENTS":"éléments","ELLE":"elle","EMPLOI":"emploi","EMPLOYEE":"employée","EN":"en","ENREGISTREMENT":"enregistrement","ENTRAINANT":"entraînant","ENTRE":"entre","ENVIRONNEMENT":"environnement","ENVISAGEABLE":"envisageable","EST":"est","ET":"et","ETRE":"être","EVENEMENT":"événement","EVIDENCE":"evidence","EXCEPTIONNELLE":"exceptionnelle","EXISTANT":"existant","EXPEDITEURVOIES":"expéditeurvoies","EXPLOSION":"explosion","FERRAND":"Ferrand","FICHOT":"Fichot","FIGER":"figer","FONCTION":"fonction","FORCE":"force","FORMATION":"formation","FUITE":"fuite","FUSIL":"fusil","GENERAL":"général","GENERALE":"générale","GENERALITES":"généralités","GENERANT":"générant","GENERAUX":"généraux","GESTION":"gestion","GESTUELLE":"gestuelle","GLOCK":"glock","GRANDE":"grande","GRENADE":"grenade","GRENADES":"grenades","GROUPE":"groupe","HABILITATION":"habilitation","HABILLEMENT":"habillement","HEBDOMADAIRES":"hebdomadaires","HEURES":"heures","IMPULSIONS":"impulsions","INFO":"info","INFORMATION":"information","INFORME":"informe","INITIATIVE":"initiative","INSPECTION":"inspection","INSTRUCTION":"instruction","INTENSE":"intense","INTERMEDIAIRE":"intermédiaire","INTERPELLATION":"interpellation","INTERPELLER":"interpeller","INTERVENTION":"intervention","JAMAIS":"jamais","JOINTES":"jointes","JONCTION":"jonction","JUIL":"juil","JUIN":"juin","LA":"la","LANCER":"lancer","LANCEUR":"lanceur","LAUGIER":"laugier","LE":"le","LES":"les","LIAISON":"liaison","LITE":"lite","LORS":"lors","LOUIS":"louis","MA":"ma","MAIN":"main","MAINS":"mains","MAINTIEN":"maintien","MALLETTE":"mallette","MANQUES":"manqués","MARCHE":"marché","MARQUE":"marque","MARS":"mars","MESURES":"mesures","MILKOR":"Milkor","MINIMISANT":"minimisant","MININT":"minint","MINISTERE":"ministère","MINISTERIELLE":"ministérielle","MINISTRE":"ministre","MISE":"mise","MISSION":"mission","MISSIONS":"missions","MITRAILLEUR":"mitrailleur","MODELE":"modèle","MODELES":"modèles","MOINDRE":"moindre","MOMENT":"moment","MOUSTACHE":"moustache","MUNITIONS":"munitions","NATIONALE":"nationale","NE":"ne","NECESSITE":"nécessité","NEUTRALISER":"neutraliser","NOTA":"nota","NOTRE":"notre","NOUVEAU":"nouveau","NOUVELLES":"nouvelles","NUIT":"nuit","NUNEZ":"nuñez","OBJET":"objet","OBSERVATION":"observation","OBTEMPERER":"obtempérer","OPERATIONNELLES":"opérationnelles","OPERATIONS":"opérations","ORDRE":"ordre","ORGANISME":"organisme","OU":"ou","OUI":"oui","OUTRE":"outre","PAR":"par","PARTIE":"partie","PAS":"pas","PAUSE":"pause","PEDAGOGIQUE":"pédagogique","PERIODE":"période","PERMET":"permet","PERQUISITION":"perquisition","PERSONNEL":"personnel","PERSONNELS":"personnels","PIECES":"pièces","PILOTAGE":"pilotage","PISTOLET":"pistolet","POINT":"point","POINTS":"points","POLE":"pôle","POLICE":"police","POLICIER":"policier","POLICIERS":"policiers","POSITIONNER":"positionner","POUR":"pour","POURRA":"pourra","PRATIQUES":"pratiques","PRECAUTIONS":"précautions","PREFECTURE":"préfecture","PRENOM":"prénom","PRESENTATION":"présentation","PREVU":"prévu","PRINCIPES":"principes","PRISE":"prise","PROFESSIONNELLE":"professionnelle","PROFESSIONNELLES":"professionnelles","PROJECTION":"projection","PROTECTION":"protection","PUBLIC":"public","PUBLIQUE":"publique","QUE":"que","REACTIVITE":"réactivité","REALISE":"réalisé","RECEPTION":"réception","RECYCLAGE":"recyclage","REFERENCE":"référence","REFERENCES":"références","REFUS":"refus","REGIME":"régime","REGIMES":"régimes","REGLES":"règles","RELATIF":"relatif","REPOS":"repos","REPRESENTE":"représenté","REQUISITION":"réquisition","RESERVEE":"réservée","RESIDUELS":"résiduels","RESPECT":"respect","RESTITUTION":"restitution","RETABLISSEMENT":"rétablissement","RIVOLIER":"rivolier","ROULE":"roulé","SA":"sa","SANS":"sans","SAUER":"sauer","SAVOIR":"savoir","SE":"se","SECURITE":"sécurité","SELON":"selon","SENAT":"sénat","SEPTEMBRE":"septembre","SERA":"sera","SERVICES":"services","SEULEMENT":"seulement","SEXE":"sexe","SI":"si","SILHOUETTE":"silhouette","SIMILAIRE":"similaire","SIMULTANEMENT":"simultanément","SITUATION":"situation","SOMMAIRE":"sommaire","SON":"son","SONORE":"sonore","SOUS":"sous","STRICT":"strict","SUIVANTES":"suivantes","SUJET":"sujet","SUPPLEMENTAIRES":"supplémentaires","SUR":"sur","SYNDICAL":"syndical","SYNTHESE":"synthèse","TAILLE":"taille","TASER":"taser","TECHNIQUES":"techniques","TELEGRAMME":"télégramme","TELEGRAMMES":"télégrammes","TELEGRAPHIQUEPARTIE":"télégraphiquepartie","TELEPHONER":"telephoner","TEMPS":"temps","TESTS":"tests","TEXTE":"texte","TEXTES":"textes","TIERS":"tiers","TITRE":"titre","TOUT":"tout","TOUTE":"toute","TRAITANT":"traitant","TRAJECTOIRE":"trajectoire","TRANSITOIRE":"transitoire","TRAVAIL":"travail","TRIENNAL":"triennal","TROUBLE":"trouble","TYPE":"type","TYPES":"types","UN":"un","UNE":"une","UNTERIEUR":"untérieur","USAGE":"usage","UTILISE":"utilisé","VEAUX":"veaux","VEHICULE":"véhicule","VEHICULES":"véhicules","VIGUEUR":"vigueur","VIOLENT":"violent","VISAGE":"visage","VOIX":"voix","VOS":"vos"};
var SIGLES_SET=["AFI","AHEF","ALD","AME","AMP","APJ","APJA","APORTT","ARES","ARTC","ARTT","ASA","BAC","BBS","BOND","BOT","BRI","BRIPP","CA","CAI","CAP","CCD","CCFP","CEA","CET","CF","CFP","CFS","CGCT","CHEOPS","CHSCT","CIC","CIMM","CIPN","CITIS","CLD","CLM","CME","CMO","CNIL","CNOEIL","CNOSF","COIS","COP","CORAT","CORG","COS","CPE","CPOM","CPP","CRS","CSA","CSI","CSO","CSP","CSU","CTM","DAPN","DBD","DCCRS","DCRFPN","DDPNDIPN","DFPN","DGGN","DGPN","DGSI","DIS","DIVA","DMJ","DMP","DN","DOE","DOI","DOPC","DRCPN","DRHFS","DRPP","DSO","DSPAP","DZPN","EEI","EGM","EMSM","ENSP","EPI","EXC","FER","FHP","FI","FIPN","FPASP","FPE","FSPN","FSUA","FTSI","GAIL","GEM","GESTT","GIGN","GIPN","GLI","GM2L","GMD","GOVU","GRE","HS","IGPN","ILL","ISST","ITT","IVP","JF","JNT","JS","LBD","MAD","MCI","MCO","MDU","MIL","MO","MRO","NG","ODL","OMEGA","OPJ","OS","PA","PACS","PAE","PAM","PATS","PEC","PERS","PGSA","PIE","PLI","PM","PMA","PP","PPI","PRIO","PRM","PRP","RAFP","RAID","RAM","RC","RCB","RCSS","RETEX","RGEPN","RGS","RL","ROP","RPS","RTT","SAILMI","SARISE","SDF","SDLP","SDRF","SDRT","SDSS","SGAMI","SICOP","SNMO","SOPS","SOR","SP1","SP2","SP3","SPD","SSPO","SZRF","TC","TDI","TDM","TI","TP","TSBD","TSI","TSUA","UCFM","UCL","UFM","USPE","VF","VU","ZCC"];
/*MOTS-FIN*/
var CAPS_W=null,SIG_S=null,PAGE_W={};
function deacc(t){try{return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}catch(e){return t;}}
function capsTables(){
  if(CAPS_W)return;
  CAPS_W=(typeof CAPS_WORDS==="object"&&CAPS_WORDS)||{};
  SIG_S={};(typeof SIGLES_SET==="object"&&SIGLES_SET||[]).forEach(function(x){SIG_S[x]=1;});
  /* Complément : mots (≥ 4 lettres) écrits en minuscules ailleurs dans la page. */
  PAGE_W={};
  try{
    var words=((D.body&&D.body.textContent)||"").match(/[A-Za-zÀ-ÖØ-öø-ÿ]{4,}/g)||[],k,w;
    for(k=0;k<words.length;k++){w=words[k];if(/[a-zß-öø-ÿ]/.test(w)){var key=deacc(w).toUpperCase();if(!PAGE_W[key])PAGE_W[key]=w.toLowerCase();}}
  }catch(e){}
}
/* Mot en majuscules : lu comme un mot s'il est connu (BILAN, ATTENTION, REPOS…) ; sinon épelé (sigle). */
function spellSigles(s){
  capsTables();
  return String(s).replace(/(^|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])([A-ZÀ-ÖØ-Þ]{2,}(?:\d[A-Z0-9]{0,3})?|[A-Z]{1,4}\d[A-Z0-9]{0,3})(?=$|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])/g,function(all,pre,m){
    if(keepSigle(m)||notASigle(m))return pre+m;
    var u=deacc(m);
    if(!SIG_S[u]&&!SIG_S[m]){
      if(Object.prototype.hasOwnProperty.call(CAPS_W,u))return pre+CAPS_W[u];
      if(u.length>=4&&Object.prototype.hasOwnProperty.call(PAGE_W,u))return pre+PAGE_W[u];
      if(u!==m&&!/\d/.test(m))return pre+m.toLowerCase();
    }
    return pre+m.split("").join(" ");
  });
}
/* Texte espacé lettre par lettre (« B I L A N 2 0 2 0 ») : recollé en « BILAN 2020 ». */
function unspace(s){
  return s.replace(/(^|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])((?:[A-ZÀ-ÖØ-Þ0-9] ){3,}[A-ZÀ-ÖØ-Þ0-9])(?=$|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])/g,function(all,pre,m){
    if(!/[A-ZÀ-ÖØ-Þ]/.test(m))return all;
    return pre+m.replace(/ /g,"").replace(/([A-ZÀ-ÖØ-Þ])(?=\d)|(\d)(?=[A-ZÀ-ÖØ-Þ])/g,"$1$2 ");
  });
}
/* Chiffres romains (I à XLIX) lus comme des nombres, seulement dans des contextes sûrs. */
var UNITS=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
var TENS={2:"vingt",3:"trente",4:"quarante"};
var ROM="(?:XL|X{0,3})(?:IX|IV|V?I{0,3})";
function romanVal(r){
  if(!r||!new RegExp("^"+ROM+"$").test(r))return 0;
  var m={I:1,V:5,X:10,L:50},n=0,i,a,b;
  for(i=0;i<r.length;i++){a=m[r[i]];b=m[r[i+1]]||0;n+=a<b?-a:a;}
  return n;
}
function cardFr(n){
  if(n<20)return UNITS[n];
  var t=Math.floor(n/10),u=n%10;
  return TENS[t]+(u===0?"":u===1?" et un":"-"+UNITS[u]);
}
function ordFr(n,fem){
  if(n===1)return fem?"première":"premier";
  var w=cardFr(n);
  if(/un$/.test(w))return w+"ième";
  if(/cinq$/.test(w))return w+"uième";
  if(/neuf$/.test(w))return w.replace(/f$/,"vième");
  if(/e$/.test(w))return w.slice(0,-1)+"ième";
  return w+"ième";
}
var ROM_KW=["titre","chapitre","partie","livre","section","sous-section","tome","annexe","article","fiche","volume","acte","phase","niveau","degré","catégorie","annexes","titres","chapitres","parties","livres"].map(function(w){return "["+w.charAt(0)+w.charAt(0).toUpperCase()+"]"+w.slice(1)+"|"+w.toUpperCase();}).join("|");
var ROM_KINGS="Louis|Henri|Charles|François|Napoléon|Philippe|Jean|Paul|Pie|Léon|Benoît|Jean-Paul|Edouard|Édouard|Elisabeth|Élisabeth|Guillaume";
function romans(s){
  /* « Ier », « Ire » (Louis Ier, Ire République) */
  s=s.replace(/\bIer\b/g,"premier").replace(/\bIre\b/g,"première");
  /* Ordinaux : XXe, XIXe, IIIème, Ve… */
  s=s.replace(new RegExp("\\b("+ROM+")(e|ème|eme)\\b","g"),function(m,r){var n=romanVal(r);return n?ordFr(n):m;});
  /* Début de titre / d'élément : « I - », « II. », « III) », « IV – » (pas « V : », souvent une variable) */
  s=s.replace(new RegExp("^("+ROM+")\\s*[-–—.)]\\s*(?=\\S)"),function(m,r){
    var n=romanVal(r);if(!n)return m;var w=cardFr(n);return w.charAt(0).toUpperCase()+w.slice(1)+". ";
  });
  /* Après un mot-clé : Titre II, chapitre IV, partie III, Livre I… */
  s=s.replace(new RegExp("\\b("+ROM_KW+")\\s+("+ROM+")\\b(?![-'’]?[A-Za-zÀ-ÿ])","g"),function(m,k,r){
    var n=romanVal(r);return n?k+" "+cardFr(n):m;
  });
  /* Souverains : Louis XIV → Louis quatorze */
  s=s.replace(new RegExp("\\b("+ROM_KINGS+")\\s+("+ROM+")\\b","g"),function(m,k,r){
    var n=romanVal(r);return n?k+" "+cardFr(n):m;
  });
  return s;
}
/* « 1° », « 2° »… (énumérations juridiques) → premièrement, deuxièmement ; « 20 °C », « 3,5° », angles → degrés. */
function degrees(s){
  s=s.replace(/(\d+,\d+)\s?°/g,"$1 degrés").replace(/(\d+)\s?°\s?([CF])\b/g,"$1 degrés");
  return s.replace(/(^|[^\d,])(\d{1,2})\s?°/g,function(m,pre,n,off,str){
    var after=str.slice(off+m.length,off+m.length+30);
    if(/cm|écart|angle/i.test(after))return pre+n+" degrés";
    var k=parseInt(n,10);if(!k)return m;
    /* Catégorie d'arme (A2 4°, B 6°) : « quatrième », pas « quatrièmement ». */
    if(/\b[A-D]\s?\d?\s*\(?\s*$/.test(str.slice(Math.max(0,off-8),off)+pre))return pre+ordFr(k);
    return pre+ordFr(k,true)+"ment";
  });
}
function speakable(raw){
  var s=String(raw||"").replace(/\s+/g," ").trim();
  if(!s)return "";
  s=unspace(s);
  s=degrees(s);
  s=s.replace(/art\.\s*/gi,"article ");
  s=romans(s);
  /* « n° 12 », « no 12 » → numéro (sans toucher « normales », « nous »…) */
  s=s.replace(/\bn\s?[°º]\s*/gi,"numéro ");
  s=s.replace(/\bno\.?\s*(?=\d)/gi,"numéro ");
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
  var title=titleOf(det,true);
  /* La pastille numérotée (.n) n'est pas lue : seulement le titre. */
  var stitle=titleOf(det,true);
  if(stitle)out.push({el:det.querySelector("summary")||det,speak:speakable(stitle),label:title});
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

function clearHL(){
  $$(".lec-cur").forEach(function(e){e.classList.remove("lec-cur");});
  if(st.hlEl){try{st.hlEl.classList.remove("lec-cur");}catch(e){}st.hlEl=null;}
}
function elVisibleDoc(el){
  /* L'élément est-il dans le document actuellement affiché (page de lecture ou page ouverte par-dessus) ? */
  if(!el||!el.isConnected)return false;
  var doc=el.ownerDocument;
  if(doc===D)return !nav.shown;
  return nav.shown&&nav.frame&&nav.frame.contentDocument===doc;
}
function highlight(el){
  clearHL();
  if(!el||!el.classList||!el.isConnected)return;
  el.classList.add("lec-cur");st.hlEl=el;
  if(el===st.lastEl)return;
  if(!elVisibleDoc(el))return;
  st.lastEl=el;
  var w=el.ownerDocument.defaultView||window;
  var r=el.getBoundingClientRect(),vh=w.innerHeight,bar=ui.bar,bh=bar&&!bar.hidden?bar.offsetHeight+16:16;
  if(r.top<80||r.bottom>vh-bh-20){
    try{el.scrollIntoView({block:"center",behavior:"smooth"});}catch(e){el.scrollIntoView(true);}
  }
}
function updateBtns(){
  var on=st.mode!=="idle";
  $$(".lec-mini,.lec-page").forEach(function(b){
    var src=b.getAttribute("data-lec");
    var active=on&&((src&&src.indexOf("opti")===0&&st.src===src)||(src==="page"&&st.src==="page")||(st.det&&st.det.getAttribute("data-lec-id")===src)||(src&&src.indexOf("h-")===0&&st.src===src));
    b.setAttribute("aria-pressed",active?"true":"false");
  });
  updateBack();
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
  u.rate=Math.min(2,Math.max(0.5,parseFloat(st.rate)||1));
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
function startList(list,src,det,label,from,fromUser,url){
  if(!list||!list.length)return;
  if(GUEST){try{GUEST.startList(list,src,det,label,from,fromUser,location.href);}catch(e){}return;}
  st.docUrl=url||location.href;
  markIdx(list);
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
  startList(collect(det),det.getAttribute("data-lec-id")||"",det,titleOf(det,true),0,true);
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
  var label=(det?titleOf(det,true):textOf(el))||"Lecture";
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
    '<button type="button" id="lec-back" class="lec-back" aria-label="Revenir au passage lu" title="Revenir au passage lu">'+ICO.back+'</button>'+
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
  $("#lec-stop",bar).addEventListener("click",userStop);
  ui.back=$("#lec-back",bar);
  ui.back.addEventListener("click",backToPassage);
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

/* Smartphone (écran < 1024 px + tactile) : pas de mode Lecture du tout. Évalué au chargement. */
/* ===== Navigation sans couper la lecture (PC) =====
   Pendant une lecture, les liens internes s'ouvrent dans un cadre plein écran par-dessus la page lue :
   la page de lecture (et sa voix) reste vivante, la page ouverte a ses propres scripts intacts. */
var GUEST=null;
try{if(window.parent&&window.parent!==window&&window.frameElement&&window.frameElement.id==="lec-frame"&&window.parent.qcmbcLectureHost)GUEST=window.parent.qcmbcLectureHost;}catch(e){GUEST=null;}
var nav={frame:null,shown:false,hostUrl:location.href,hostTitle:D.title,pending:null};
function samePage(a,b){try{var x=new URL(a,location.href),y=new URL(b,location.href);return x.origin===y.origin&&x.pathname.replace(/index\.html$/,"")===y.pathname.replace(/index\.html$/,"")&&x.search===y.search;}catch(e){return false;}}
function markIdx(list){
  var docs=[],maps=[];
  list.forEach(function(ch){
    var el=ch.el;if(!el||!el.ownerDocument)return;
    var doc=el.ownerDocument,k=docs.indexOf(doc);
    if(k<0){docs.push(doc);maps.push($$("summary,h2,h3,h4,p,li,tr",doc));k=docs.length-1;}
    ch.idx=maps[k].indexOf(el);
  });
}
function ensureFrame(){
  if(nav.frame)return nav.frame;
  var f=D.createElement("iframe");
  f.id="lec-frame";f.title="Page du site";f.setAttribute("hidden","");
  f.addEventListener("load",onFrameLoad);
  D.body.appendChild(f);
  nav.frame=f;
  return f;
}
function frameHref(){try{return nav.frame&&nav.frame.contentWindow.location.href;}catch(e){return "";}}
function showFrame(on){
  nav.shown=!!on;
  if(nav.frame){if(on)nav.frame.removeAttribute("hidden");else nav.frame.setAttribute("hidden","");}
  D.documentElement.classList.toggle("lec-framed",!!on);
  if(!on){D.title=nav.hostTitle;}
  else{try{D.title=nav.frame.contentDocument.title||D.title;}catch(e){}}
  updateBack();
}
function updateBack(){
  if(!ui.back)return;
  var cur=st.list[st.i],far=!!(cur&&cur.el&&!elVisibleDoc(cur.el));
  ui.back.hidden=!(nav.shown||far);
}
function openInFrame(url,push){
  if(samePage(url,nav.hostUrl)){
    if(nav.shown){showFrame(false);history.pushState({lecHost:1},"",url);}
    var h=new URL(url,location.href).hash;if(h){var t=D.getElementById(decodeURIComponent(h.slice(1)));if(t)t.scrollIntoView();}
    return;
  }
  var f=ensureFrame();
  dbg("nav",url);
  if(samePage(frameHref(),url)&&frameHref()){showFrame(true);if(push!==false)history.pushState({lecFrame:url},"",url);return;}
  f.src=url;
  showFrame(true);
  if(push!==false)history.pushState({lecFrame:url},"",url);
}
function onFrameLoad(){
  var f=nav.frame,href=frameHref(),doc;
  if(!href||href==="about:blank")return;
  try{doc=f.contentDocument;}catch(e){return;}
  if(samePage(href,nav.hostUrl)){
    /* Retour sur la page lue : on la réaffiche, sans recharger. */
    f.src="about:blank";showFrame(false);
    history.replaceState({lecHost:1},"",href);
    return;
  }
  if(nav.shown){
    D.title=doc.title||D.title;
    history.replaceState({lecFrame:href},"",href);
  }
  try{
    var stl=doc.createElement("style");stl.textContent="body{padding-bottom:140px!important}";doc.head.appendChild(stl);
    /* Liens qui sortiraient du cadre (target=_top/_parent) : on les garde dans le cadre. */
    doc.addEventListener("click",function(e){
      var a=e.target&&e.target.closest&&e.target.closest("a[href]");
      if(a&&/^_(top|parent)$/i.test(a.getAttribute("target")||""))a.setAttribute("target","_self");
    },true);
  }catch(e){}
  if(nav.pending!=null){
    var idx=nav.pending;nav.pending=null;
    var els=$$("summary,h2,h3,h4,p,li,tr",doc),el=els[idx];
    if(el){var d=el.closest("details");if(d)d.open=true;try{el.scrollIntoView({block:"center"});}catch(e){}}
  }
  /* Rebrancher les passages lus si la page de lecture a été rechargée dans le cadre. */
  if(st.docUrl&&samePage(href,st.docUrl)&&st.list.length){
    var all=$$("summary,h2,h3,h4,p,li,tr",doc);
    st.list.forEach(function(ch){if(ch.el&&!ch.el.isConnected&&ch.idx>=0&&all[ch.idx])ch.el=all[ch.idx];});
    if(st.mode!=="idle"){st.lastEl=null;highlight(st.list[st.i]&&st.list[st.i].el);}
  }
  updateBack();
}
function backToPassage(){
  var cur=st.list[st.i];
  if(!cur){if(nav.shown){showFrame(false);history.pushState({lecHost:1},"",nav.hostUrl);}return;}
  var el=cur.el;
  if(el&&el.ownerDocument===D){
    if(nav.shown){showFrame(false);history.pushState({lecHost:1},"",nav.hostUrl);}
  }else if(el&&el.isConnected&&nav.frame&&el.ownerDocument===nav.frame.contentDocument){
    if(!nav.shown){showFrame(true);history.pushState({lecFrame:frameHref()},"",frameHref());}
  }else if(st.docUrl){
    nav.pending=cur.idx;
    openInFrame(st.docUrl);
    return;
  }
  st.lastEl=null;
  if(el&&el.isConnected){var d=el.closest&&el.closest("details");if(d)d.open=true;highlight(el);try{el.scrollIntoView({block:"center",behavior:"smooth"});}catch(e){}}
  updateBack();
}
function onLinkClick(e){
  if(st.mode==="idle"||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  var a=e.target&&e.target.closest&&e.target.closest("a[href]");
  if(!a||a.hasAttribute("download"))return;
  var tg=(a.getAttribute("target")||"").toLowerCase();
  if(tg&&tg!=="_self")return;
  var raw=a.getAttribute("href")||"";
  if(!raw||raw.charAt(0)==="#"||/^(javascript|mailto|tel):/i.test(raw))return;
  var u;try{u=new URL(a.href,location.href);}catch(x){return;}
  if(u.origin!==location.origin)return;
  if(!/(\/|\.html?)$/i.test(u.pathname))return;
  if(samePage(u.href,location.href)&&u.hash)return;
  e.preventDefault();
  openInFrame(u.href);
}
function onPop(e){
  var s=e.state||{};
  if(s.lecFrame){
    if(st.mode==="idle"&&!nav.frame){location.reload();return;}
    var f=ensureFrame();
    if(!samePage(frameHref(),s.lecFrame))f.src=s.lecFrame;
    showFrame(true);
  }else{
    if(nav.shown)showFrame(false);
  }
}
function userStop(){
  /* Arrêt volontaire alors qu'une autre page est affichée : on y reste, en vraie page. */
  var u=nav.shown?frameHref():"";
  stop();
  if(u&&u!=="about:blank")location.href=u;
}
function initGuest(){
  booted=true;
  D.documentElement.classList.add("lec-ok","lec-guest");
  injectButtons();
  injectHelp();
  loadOpti();
  D.addEventListener("keydown",function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var el=e.target,tg=(el&&el.tagName)||"";
    if(tg==="TEXTAREA"||tg==="SELECT"||(el&&el.isContentEditable)||(tg==="INPUT"&&el.type!=="checkbox"))return;
    var help=$("#dk-helpov");if(help&&help.classList.contains("dk-vis"))return;
    if(e.key==="l"||e.key==="L"){e.preventDefault();try{GUEST.toggle();}catch(x){}}
  });
}
/* ===== Lecture optimisée (révisions synthétiques) : scripts rédigés dans lecture_opti/<page>.json ===== */
var OPTI=null;
var ICO_OPTI=svg('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>');
function optiUrl(){
  var me=D.querySelector('script[src*="lecture.js"]'),src=me?me.getAttribute("src"):"lecture.js";
  var base=src.replace(/lecture\.js.*$/,""),ver=(src.match(/[?&]v=([^&]+)/)||[])[1]||"";
  var name=(location.pathname.split("/").pop()||"").replace(/\.html?$/,"");
  return base+"lecture_opti/"+name+".json"+(ver?"?v="+ver:"");
}
function loadOpti(){
  if(/\/detaillees\//.test(location.pathname)||!window.fetch)return;
  fetch(optiUrl(),{cache:"no-cache"}).then(function(r){return r.ok?r.json():null;}).then(function(d){
    if(!d||!d.sections)return;
    OPTI=d;injectOpti();
  }).catch(function(){});
}
function optiDet(n){
  var ds=$$("details"),k,b;
  for(k=0;k<ds.length;k++){b=ds[k].querySelector("summary .n");if(b&&b.textContent.trim()===String(n))return ds[k];}
  return null;
}
function optiEl(det,a){
  if(!det)return null;
  var sum=det.querySelector("summary");
  if(a==="s"||a==="r")return sum;
  var m=/^([tn]?)(\d+)$/.exec(a);if(!m)return sum;
  var k=parseInt(m[2],10),list=m[1]==="t"?$$("table",det):m[1]==="n"?$$("p.note",det):$$(".c li",det);
  return list[k]||sum;
}
function optiSection(sec){
  var det=optiDet(sec.n),label=det?titleOf(det,true):("Fiche "+sec.n),out=[];
  sec.items.forEach(function(it){
    var el=optiEl(det,it.a),sp=speakable(it.t);if(!sp)return;
    splitText(sp).forEach(function(part){out.push({el:el,speak:part,label:label});});
  });
  return out;
}
function startOpti(n){
  if(!OPTI)return;
  var list=[],h1=$("h1");
  if(n==null){
    if(OPTI.intro)splitText(speakable(OPTI.intro)).forEach(function(p){list.push({el:h1,speak:p,label:"Lecture optimisée"});});
    OPTI.sections.forEach(function(sec){list=list.concat(optiSection(sec));});
    startList(list,"opti",null,"Lecture optimisée",0,true);
  }else{
    OPTI.sections.forEach(function(sec){if(String(sec.n)===String(n))list=optiSection(sec);});
    var det=optiDet(n);if(det)det.open=true;
    startList(list,"opti-"+n,det,det?titleOf(det,true):"Lecture optimisée",0,true);
  }
}
function injectOpti(){
  if(!OPTI||D.querySelector(".lec-opti"))return;
  var pb=D.querySelector(".lec-page");
  if(pb){
    var b=D.createElement("button");
    b.type="button";b.className="lec-page lec-opti";b.setAttribute("data-lec","opti");
    b.setAttribute("aria-label","Lecture optimisée de la page");b.title="Lecture optimisée : le cours expliqué à l’oral, sans les tableaux lus ligne par ligne";
    b.innerHTML=ICO_OPTI+" Lecture optimisée";
    b.addEventListener("click",function(e){e.preventDefault();startOpti(null);});
    pb.insertAdjacentElement("afterend",b);
  }
  OPTI.sections.forEach(function(sec){
    var det=optiDet(sec.n),sum=det&&det.querySelector("summary");if(!sum||sum.querySelector(".lec-opti"))return;
    var m=D.createElement("button");
    m.type="button";m.className="lec-mini lec-opti";m.setAttribute("data-lec","opti-"+sec.n);
    m.setAttribute("aria-label","Lecture optimisée de cette fiche");m.title="Lecture optimisée de cette fiche";
    m.innerHTML=ICO_OPTI;
    m.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();startOpti(sec.n);});
    var first=sum.querySelector(".lec-mini");
    if(first)first.insertAdjacentElement("afterend",m);else sum.appendChild(m);
  });
  updateBtns();
}
function isPhone(){
  try{
    var small=window.matchMedia&&window.matchMedia("(max-width:1023px)").matches;
    var touch=(window.matchMedia&&window.matchMedia("(pointer:coarse)").matches)||("ontouchstart" in window)||(navigator.maxTouchPoints||0)>0;
    return !!(small&&touch);
  }catch(e){return false;}
}
function init(){
  if(booted)return;
  if(GUEST){initGuest();return;}
  if(!hasSynth())return;
  if(isPhone()){booted=true;D.documentElement.classList.add("lec-off");return;}
  booted=true;
  synth=getSynth();
  D.documentElement.classList.add("lec-ok");
  var stored=migrate();
  st.rate=(stored.rate&&RATES.indexOf(String(stored.rate))>=0)?String(stored.rate):DEF_RATE;
  injectButtons();
  buildBar();
  loadOpti();
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
  window.qcmbcLectureHost={
    startList:function(list,src,det,label,from,fromUser,url){startList(list,src,det,label,from,fromUser,url);},
    toggle:function(){toggle();},
    stop:function(){stop();}
  };
  D.addEventListener("click",onLinkClick);
  window.addEventListener("popstate",onPop);
  window.qcmbcLectureText={speakable:speakable,romans:romans};
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
