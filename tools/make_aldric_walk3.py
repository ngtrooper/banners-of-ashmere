"""Aldric walk v3 (aldric_walk8b_src.jpg, local only): frames stabilised on the head/upper-torso centre, feet on a common line."""
import numpy as np, json, sys
from PIL import Image
src=open('/workspace/game/tools/make_sprites_gen2.py').read(); exec(src[:src.index('meta={}; HERO=140')]); HERO=140
def head_cx(f):
    A=f['a']>0.5; ys,xs=np.where(A); h=f['h']
    sel=ys<h*0.13                      # head + neck only: shield, sword and legs never reach here
    return int(np.median(xs[sel]))
exec(open('/workspace/game/tools/_aldric_seams.py').read())
for f in src_frames: f['cx']=head_cx(f)
a=loadj('aldric_walk8b_src.jpg'); (y0,y1),=bands(a,1); walk=row_frames(a,y0,y1,8)
info=[]
for i,f in enumerate(walk):
    A=f['a']>0.5; ys,xs=np.where(A); low=ys>f['h']*0.85
    f['cx']=head_cx(f); info.append(dict(i=i,h=int(f["h"]),spread=int(xs[low].max()-xs[low].min()),bbox_cx=int((xs.min()+xs.max())/2)-f['cx']))
print(json.dumps(info))
order=[int(x) for x in sys.argv[1].split(',')] if len(sys.argv)>1 else list(range(8))
walk=[walk[i] for i in order]
k=HERO/UP/src_frames[0]['h']*np.median([src_frames[0]['h']])/np.median([src_frames[0]['h']])
kw=HERO/UP/np.median([f['h'] for f in walk])
fr=[native(f,HERO/UP/src_frames[0]['h']) for f in src_frames]+[native(f,kw) for f in walk]
meta=build('aldric_v6.png',fr); json.dump(meta,open('/workspace/aldric_v6_meta.json','w')); print(meta)
