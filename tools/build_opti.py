# Convertit les scripts rédigés (tools/opti_src/*.txt) en lecture_opti/*.json pour la « Lecture optimisée ».
# Format source : "= intro de page", "# <numéro de fiche>", puis lignes "@<ancre> texte".
# Ancres : s = titre de la fiche, r = récapitulatif, <k> = k-ième point (li) de la fiche, t<k> = k-ième tableau, n<k> = k-ième note.
import os,re,json,glob
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root,'lecture_opti'),exist_ok=True)
for src in sorted(glob.glob(os.path.join(root,'tools','opti_src','*.txt'))):
    name=os.path.basename(src)[:-4]
    data={'v':1,'page':name+'.html','intro':'','sections':[]}
    cur=None
    for ln,line in enumerate(open(src,encoding='utf-8'),1):
        line=line.rstrip('\n')
        if not line.strip():continue
        if line.startswith('= '):data['intro']=line[2:].strip();continue
        if line.startswith('# '):cur={'n':line[2:].strip(),'items':[]};data['sections'].append(cur);continue
        m=re.match(r'@(s|r|\d+|t\d+|n\d+)\s+(.+)$',line)
        if not m or cur is None:raise SystemExit('%s:%d ligne invalide: %s'%(src,ln,line))
        t=m.group(2).strip()
        if re.search(r'[/–→≤≥]',t):print('attention %s:%d caractère à éviter: %s'%(name,ln,t[:60]))
        cur['items'].append({'a':m.group(1),'t':t})
    out=os.path.join(root,'lecture_opti',name+'.json')
    json.dump(data,open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=0)
    print(name,len(data['sections']),'fiches',sum(len(s['items']) for s in data['sections']),'passages')
