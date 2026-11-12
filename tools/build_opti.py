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
json.dump({'v':1,'pages':pages},open(os.path.join(root,'lecture_opti','index.json'),'w',encoding='utf-8'),ensure_ascii=False)
print(len(pages),'pages dans index.json')
