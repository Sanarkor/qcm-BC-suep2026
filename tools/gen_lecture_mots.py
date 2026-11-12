# Regénère la liste CAPS_WORDS / SIGLES_SET de lecture.js : python3 tools/gen_lecture_mots.py --write
import re,json,glob,html,unicodedata,collections
def deacc(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn')
import os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
# Dictionnaire : liste de mots français (npm an-array-of-french-words), un mot par ligne
DICT_PATH=os.environ.get('FR_WORDS','/tmp/fr_words.txt')
# sigles
sig=set()
d=json.loads(open(root+'sigles.js').read().split('=',1)[1].rstrip().rstrip(';'))
for q in d['q']:
    for m in re.finditer(r'sigle\s+«?\s*([A-Z0-9][A-Za-z0-9.\-&/]+)',q['s']): sig.add(m.group(1).strip('.'))
    for m in re.finditer(r'(?:^|\n|\s)([A-Z][A-Z0-9]{1,9})\s*(?:\([^)]*\))?\s*=',q.get('e','')): sig.add(m.group(1))
for m in re.finditer(r'"s":\s*"([^"]+)"',open(root+'sigles_complements.js').read()): sig.add(m.group(1))
for f in glob.glob(root+'*.html')+glob.glob(root+'detaillees/*.html'):
    t=open(f).read()
    for m in re.finditer(r'<li><b>([A-Z][A-Za-z0-9\-]{1,10})</b>\s*:',t): sig.add(m.group(1))
for f in ['sigles_liste.html']:
    t=open(root+f).read()
    for m in re.finditer(r'>([A-Z][A-Z0-9\-]{1,10})<',t): sig.add(m.group(1))
sigU={deacc(s).upper().replace('-','') for s in sig}
# corpus
pages=[f for f in glob.glob(root+'*.html')+glob.glob(root+'detaillees/*.html')]
lower=collections.Counter(); caps=collections.Counter(); capsrc={}
L='A-Za-zÀ-ÖØ-öø-ÿ'
for f in pages:
    t=open(f).read()
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S)
    t=html.unescape(re.sub('<[^>]+>',' ',t))
    t=re.sub(r'(?<![%s0-9])((?:[%s0-9] ){3,}[%s0-9])(?![%s0-9])'%(L,L,L,L),lambda m:re.sub(r'([A-ZÀ-Ý])(?=\d)|(\d)(?=[A-ZÀ-Ý])',lambda k:(k.group(1) or k.group(2))+' ',m.group(1).replace(' ','')),t)
    for w in re.findall(r'[%s]+'%L,t):
        if re.search(r'[a-zà-ÿ]',w): lower[w.lower()]+=1
    if 'lecture.js' in open(f).read():
        for m in re.finditer(r'(?<![%s0-9])([A-ZÀ-ÖØ-Þ]{2,})(?![%s0-9])'%(L,L),t): caps[m.group(1)]+=1
lowD=collections.defaultdict(collections.Counter)
for w,c in lower.items(): lowD[deacc(w)][w]+=c
DICT={deacc(w.lower()) for w in open(DICT_PATH).read().split('\n') if w}
SHORT=set('le la les de du des un une et ou en au aux par pour sur sa son ses ce ces qui que ne pas est il elle ils on se si y a à dans avec sans sous mais ni nos vos mon ma mes ton tes leur leurs plus moins tout tous toute toutes non oui car cas lui eux nous vous je tu fin art via vers chez entre selon dont ou été être fait date page note'.split())
words={};spell=[];dictonly=[];acc=[]
for tok,c in caps.most_common():
    u=deacc(tok)
    if u in sigU or tok in sig: spell.append(tok);continue
    lw=u.lower()
    if lw in SHORT: words[u]=lw
    elif len(u)>=4 and lw in lowD: words[u]=lowD[lw].most_common(1)[0][0]
    elif len(u)>=4 and lw in DICT: words[u]=lw; dictonly.append(u)
    elif u!=tok and len(u)>=3: words[u]=tok.lower(); acc.append(tok)
    else: spell.append(tok)
FORCE_SPELL={'ARES','PERS'}
FORCE_WORD={'DOMICILE':'domicile','CLERMONT':'Clermont','FERRAND':'Ferrand','BONNEAU':'Bonneau','FICHOT':'Fichot','MILKOR':'Milkor'}
for k in FORCE_SPELL: words.pop(k,None)
words.update(FORCE_WORD)
spell=[t for t in spell if deacc(t) not in FORCE_WORD]+sorted(FORCE_SPELL)
sigOut=sorted((sigU-set(FORCE_WORD))|FORCE_SPELL)
import sys
if '--write' in sys.argv:
    p=root+'lecture.js';js=open(p).read()
    a=js.index('/*MOTS-DEBUT*/');b=js.index('/*MOTS-FIN*/')
    block='/*MOTS-DEBUT*/\n/* Généré par tools/gen_lecture_mots.py : mots en majuscules lus comme des mots, et sigles toujours épelés. */\nvar CAPS_WORDS='+json.dumps(dict(sorted(words.items())),ensure_ascii=False,separators=(',',':'))+';\nvar SIGLES_SET='+json.dumps(sigOut,ensure_ascii=False,separators=(',',':'))+';\n'
    open(p,'w').write(js[:a]+block+js[b:])
json.dump({'words':words,'spell':spell,'sig':sigOut},open('/tmp/caps.json','w'),ensure_ascii=False,indent=0)
print(len(sigU),'sigles;',len(caps),'caps tokens;',len(words),'words;',len(spell),'spelled')
print('WORDS:',' '.join(sorted(words)))
print('SPELL:',' '.join(sorted(set(spell))))
for s in ['APORTT','DOE','RGEPN','CI','MDC','CA','PA','RC','BAC','DIV']: print(s, s in sigU)

print('DICT-ONLY:',' '.join(sorted(dictonly)));print('ACCENT:',' '.join(acc))
