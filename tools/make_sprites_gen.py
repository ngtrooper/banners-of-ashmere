"""Process generated sprite sheets (local *_src.jpg, not committed) into game sprite sheets.
Frame detection via dilated connected components, black-bg removal, common foot baseline,
consistent cells, box-downscale to native res, hard alpha, x2 nearest upscale."""
from PIL import Image, ImageFilter
import numpy as np, json, sys
from scipy import ndimage as nd
W='/workspace/'; OUT=W+'game/public/sprites/'; UP=2
def load(f): return np.asarray(Image.open(W+f).convert('RGB')).astype(float)
def alpha(a, lo=24, hi=44): return np.clip((a.max(2)-lo)/(hi-lo),0,1)
def detect(a, n, rows, dil=7, minsz=40):
    m=a.max(2)>34; d=nd.binary_dilation(m,iterations=dil); lab,k=nd.label(d)
    sl=nd.find_objects(lab); sz=nd.sum(m,lab,range(1,k+1))
    order=np.argsort(-sz); big=list(order[:n]); assert sz[order[n-1]]>sz[order[0]]*0.15, ('merged frames?', sorted(sz)[-n-2:])
    groups={b:[b] for b in big}
    for o in order[n:]:
        if sz[o]<minsz: continue
        s=sl[o]; cy=(s[0].start+s[0].stop)/2; cx=(s[1].start+s[1].stop)/2
        def dist(b):
            t=sl[b]; dy=max(t[0].start-cy,0,cy-t[0].stop); dx=max(t[1].start-cx,0,cx-t[1].stop); return dx+dy
        b=min(big,key=dist)
        if dist(b)<40: groups[b].append(o)
    cen=[((sl[b][0].start+sl[b][0].stop)/2,(sl[b][1].start+sl[b][1].stop)/2,b) for b in big]
    cen.sort(); per=n//rows; out=[]
    for r in range(rows):
        row=sorted(cen[r*per:(r+1)*per],key=lambda c:c[1]); out.append([groups[c[2]] for c in row])
    return lab,out
def extract(a,lab,ids):
    keep=np.isin(lab,[i+1 for i in ids]); al=alpha(a)*keep
    ys,xs=np.where(al>0.5); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    sub=a[y0:y1,x0:x1]; A=al[y0:y1,x0:x1]
    body=A>0.5; yy,xx=np.where(body); h=y1-y0
    mid=(yy>h*0.25)&(yy<h*0.75); cx=int(np.median(xx[mid]))
    return dict(rgb=sub,a=A,feet=yy.max(),cx=cx,h=h)
def native(fr,k):
    """downscale a frame by factor k (premultiplied box), hard alpha"""
    rgb,A=fr['rgb'],fr['a']; prem=np.dstack([rgb*A[...,None],A*255]).astype(np.uint8)
    w,h=max(1,round(rgb.shape[1]*k)),max(1,round(rgb.shape[0]*k))
    s=np.asarray(Image.fromarray(prem,'RGBA').resize((w,h),Image.BOX)).astype(float)
    al=s[...,3]/255; col=s[...,:3]/np.maximum(al[...,None],1e-3)
    out=np.dstack([np.clip(col,0,255),np.where(al>0.5,255,0)]).astype(np.uint8)
    return dict(im=Image.fromarray(out,'RGBA'),feet=round(fr['feet']*k),cx=round(fr['cx']*k))
def outline(im):
    a=np.asarray(im).copy(); s=a[...,3]>0
    d=np.asarray(Image.fromarray((s*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))>0
    ring=d&~s; a[ring]=[18,12,26,255]; return Image.fromarray(a,'RGBA')
def build(name,frames,pad=2):
    left=max(f['cx'] for f in frames)+pad; right=max(f['im'].width-f['cx'] for f in frames)+pad
    up=max(f['feet'] for f in frames)+pad; down=max(f['im'].height-f['feet'] for f in frames)+pad
    cw,ch=left+right,up+down; sheet=Image.new('RGBA',(cw*len(frames),ch))
    for i,f in enumerate(frames):
        cell=Image.new('RGBA',(cw,ch)); cell.alpha_composite(f['im'],(left-f['cx'],up-f['feet']))
        sheet.alpha_composite(outline(cell),(i*cw,0))
    sheet=sheet.resize((sheet.width*UP,sheet.height*UP),Image.NEAREST); sheet.save(OUT+name)
    return dict(url='./sprites/'+name,fw=cw*UP,fh=ch*UP,frames=len(frames),ox=round(left/cw,3),oy=round((up+0.5)/ch,3),bodyh=max(f['im'].height for f in frames)*UP)
meta={}
HERO=140
# --- Aldric: original idle+attack (seam split, from old tool) + generated walk
exec(open(W+'game/tools/_aldric_seams.py').read())   # defines src_frames: list of (rgb,alpha,feet,cx)
aw=load('aldric_walk_src.jpg'); lab,g=detect(aw,6,1)
walk=[extract(aw,lab,ids) for ids in g[0]]
idle_h=src_frames[0]['h']; walk_h=np.median([f['h'] for f in walk])
k_src=HERO/UP/idle_h; k_walk=HERO/UP/walk_h
ald=[native(f,k_src) for f in src_frames]+[native(f,k_walk) for f in walk]
meta['aldric']=build('aldric_v4.png',ald)
# --- Sylwen
sy=load('sylwen16_src.jpg'); lab,g=detect(sy,11,1)
# 11 frames, two rows of different counts: split by y
cs=[]
for ids in g[0]:
    f=extract(sy,lab,ids); cs.append((np.mean([nd.find_objects(lab)[i][0].start for i in ids[:1]]),f))
top=[f for y,f in cs if y<340]; bot=[f for y,f in cs if y>=340]
assert len(top)==6 and len(bot)==5,(len(top),len(bot))
k=HERO/UP/bot[0]['h']; syl=[native(f,k) for f in top+bot]
meta['sylwen']=build('sylwen_v4.png',syl)
# --- Goblins
gb=load('goblins_src.jpg'); gm=(gb.max(2)>34).astype(float)
def cuts(proj,n,L,win):
    c=[0]
    for k in range(1,n):
        e=int(L*k/n); c.append(e-win+int(np.argmin(proj[e-win:e+win])))
    return c+[L]
rc=cuts(gm.sum(1),5,gb.shape[0],30); cc=cuts(gm.sum(0),6,gb.shape[1],50); print('grid',rc,cc)
def cell(r,c):
    sub=gb[rc[r]:rc[r+1],cc[c]:cc[c+1]]; lab,g=detect(sub,1,1,dil=5); return extract(sub,lab,g[0][0])
names=['brute','sneak','slinger','hexer','mender']
for r,nm in enumerate(names):
    fr=[cell(r,c) for c in range(6)]
    tgt=HERO*(0.75 if nm=='brute' else 0.62)
    # scale by body height excluding flames: use median of lower-75% mask height ~ total h
    k=tgt/UP/np.median([f['h'] for f in fr]); meta['goblin_'+nm]=build(f'goblin_{nm}_v2.png',[native(f,k) for f in fr])
json.dump(meta,open(W+'sprite_meta2.json','w'),indent=1); print(json.dumps(meta))
