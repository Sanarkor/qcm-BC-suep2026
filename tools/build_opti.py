# Convertit les scripts rédigés (tools/opti_src/**.txt) en lecture_opti/**.json pour la « Lecture optimisée ».
# Format source : "= intro de page", "# <numéro de partie>", puis lignes "@<ancre> texte".
# Révisions synthétiques : s = titre, r = récapitulatif, <k> = k-ième point (li), t<k> = k-ième tableau, n<k> = k-ième note.
# Fiches détaillées (opti_src/detaillees) : s, r, <k> ou <k>-<m> = k-ième bloc (ou blocs k à m) de la partie (p, li, titres, lignes de tableau).
import os,re,json,glob
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages=[]
for src in sorted(glob.glob(os.path.join(root,'tools','opti_src','*.txt'))+glob.glob(os.path.join(root,'tools','opti_src','detaillees','*.txt'))):
    det='/detaillees/' in src.replace(os.sep,'/')
    name=('detaillees/' if det else '')+os.path.basename(src)[:-4]
    data={'v':1,'page':name+'.html','intro':'','sections':[]}
    cur=None
    for ln,line in enumerate(open(src,encoding='utf-8'),1):
        line=line.rstrip('\n')
        if not line.strip() or line.startswith('//'):continue
        if line.startswith('= '):data['intro']=line[2:].strip();continue
        if line.startswith('# '):cur={'n':line[2:].strip(),'items':[]};data['sections'].append(cur);continue
        m=re.match(r'@(s|r|\d+(?:-\d+)?|t\d+|n\d+)\s+(.+)$',line)
        if not m or cur is None:raise SystemExit('%s:%d ligne invalide: %s'%(src,ln,line))
        a=m.group(1);t=m.group(2).strip()
        if det and re.match(r'\d',a):a='b'+a
        if re.search(r'[/–→≤≥]',t):print('attention %s:%d caractère à éviter: %s'%(name,ln,t[:60]))
        cur['items'].append({'a':a,'t':t})
    out=os.path.join(root,'lecture_opti',name+'.json')
    os.makedirs(os.path.dirname(out),exist_ok=True)
    json.dump(data,open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=0)
    pages.append(name)
    print(name,len(data['sections']),'parties',sum(len(s['items']) for s in data['sections']),'passages')
# Unités de la « Lecture aléatoire » (tableau de bord) : chaque fiche synthétique (partie) et chaque fiche détaillée (entière).
import html as _h
def _txt(x):return re.sub(r'\s+',' ',_h.unescape(re.sub(r'<[^>]+>','',x))).strip()
units=[]
def _sum(hp,n):
    m=re.search(r'<summary[^>]*>\s*<span class="n">'+re.escape(str(n))+r'</span>(.*?)</summary>',hp,re.S)
    return _txt(m.group(1)) if m else 'Partie '+str(n)
for name in pages:
    hp=open(os.path.join(root,name+'.html'),encoding='utf-8').read()
    js=json.load(open(os.path.join(root,'lecture_opti',name+'.json'),encoding='utf-8'))
    m=re.search(r'<h1[^>]*>(.*?)</h1>',hp,re.S);course=_txt(m.group(1)) if m else name
    course=re.sub(r'^Révisions\s*[–-]\s*','',course)
    det=name.startswith('detaillees/')
    # Une unité = une fiche : chaque fiche synthétique ; pour un cours détaillé, chaque partie
    # (les parties de moins de 3 passages sont regroupées avec la suivante, pour ne jamais lire une phrase isolée).
    groups=[];cur=[]
    for sec in js['sections']:
        cur.append(sec)
        if not det or sum(len(x['items']) for x in cur)>=3:groups.append(cur);cur=[]
    if cur:
        if groups:groups[-1]+=cur
        else:groups.append(cur)
    for g in groups:
        t=re.sub(r'^\s*\d+(\.\d+)*\s*[-–.)]\s*','',_sum(hp,g[0]['n']))
        u={'p':name,'n':g[0]['n'],'t':t,'c':course,'k':'d' if det else 's'}
        if len(g)>1:u['ns']=[x['n'] for x in g]
        units.append(u)
json.dump({'v':1,'pages':pages,'units':units},open(os.path.join(root,'lecture_opti','index.json'),'w',encoding='utf-8'),ensure_ascii=False)
print(len(pages),'pages dans index.json')
