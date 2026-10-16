import numpy as np, json
from PIL import Image
src=open('/workspace/game/tools/make_sprites_gen2.py').read(); exec(src[:src.index('meta={}; HERO=140')]); HERO=140
def head_cx(f):
    A=f['a']>0.5; ys,xs=np.where(A); return int(np.median(xs[ys<f['h']*0.13]))
a=loadj('aldric_walk24_src.jpg'); bs=bands(a,3); fr=[]
for y0,y1 in bs: fr+=row_frames(a,y0,y1,8)
res=[]
for i,f in enumerate(fr):
    A=f['a']>0.5; ys,xs=np.where(A); hc=head_cx(f); fb=ys.max(); low=ys>=fb-f['h']*0.05
    lx=xs[low]-hc; res.append((i,int(f['h']),int(lx.min()),int(lx.max()),int(lx.max()-lx.min())))
for r in res: print(r)
# build candidate A frames at game scale (head-centred, common feet line) for the comparison GIF
for f in fr: f['cx']=head_cx(f)
kw=HERO/UP/np.median([f['h'] for f in fr]); meta=build('_tmp_walk24A.png',[native(f,kw) for f in fr]); json.dump(meta,open('/tmp/rig/A.json','w'))
