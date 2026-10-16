"""M1.11: process user-generated sheets (local /workspace/src2/*_src.jpg, never committed)."""
import numpy as np, json
from PIL import Image
src=open('/workspace/game/tools/make_sprites_gen.py').read(); exec(src[:src.index('meta={}')])   # shared pipeline helpers
S2='/workspace/src2/'
def loadj(f): return np.asarray(Image.open(S2+f).convert('RGB')).astype(float)
def bands(a,n,thr=34,gap=6):
    m=(a.max(2)>thr).sum(1)>2; ys=np.where(m)[0]; br=np.where(np.diff(ys)>gap)[0]
    st=[ys[0]]+[ys[i+1] for i in br]; en=[ys[i] for i in br]+[ys[-1]]
    b=[(s,e) for s,e in zip(st,en) if e-s>40]; assert len(b)==n,(n,b); return b
def cutcols(sub,n,win=None):
    p=(sub.max(2)>34).sum(0).astype(float); L=sub.shape[1]; xs=np.where(p>0)[0]; x0,x1=xs[0],xs[-1]; step=(x1-x0)/n; win=win or int(step*0.3)
    c=[max(0,x0-4)]
    for k in range(1,n):
        e=int(x0+step*k); c.append(e-win+int(np.argmin(p[e-win:e+win])))
    return c+[min(L,x1+5)]
def row_frames(a,y0,y1,n,mode='comp'):
    sub=a[max(0,y0-6):y1+6]
    if mode=='comp':
        try:
            lab,g=detect(sub,n,1,dil=6); return [extract(sub,lab,ids) for ids in g[0]]
        except (AssertionError,IndexError) as e: print("  comp merge -> cuts")
    return assign_row(sub,n)
    c=cutcols(sub,n); out=[]
    for i in range(n):
        cs=sub[:,c[i]:c[i+1]]; lab,g=detect(cs,1,1,dil=6)
        # keep every component in the cell (effects, projectiles) not just the biggest
        ids=list(range(int(lab.max()))); out.append(extract(cs,lab,ids))
    return out
def cuts(proj,n,L,win):
    c=[0]
    for k in range(1,n):
        e=int(L*k/n); c.append(e-win+int(np.argmin(proj[e-win:e+win])))
    return c+[L]
def assign_row(sub,n,minpx=30,maxd=70):
    """split a row into n frames: main body per column cell, then each effect/projectile blob goes to the
    body it most plausibly belongs to (effects trail to the RIGHT of their owner since sprites face right)"""
    m=sub.max(2)>34; c=cutcols(sub,n); dm=nd.binary_dilation(m,iterations=3)
    for x in c[1:-1]: dm[:,x-1:x+1]=False   # sever blobs that cross a frame seam; pieces are re-assigned below
    lab,k=nd.label(dm); sl=nd.find_objects(lab); sz=nd.sum(m,lab,range(1,k+1)); bodies=[]
    for i in range(n):
        cnt=np.bincount((lab[:,c[i]:c[i+1]]*m[:,c[i]:c[i+1]]).ravel(),minlength=k+1); cnt[0]=0
        for j in bodies: cnt[j+1]=0
        bodies.append(int(cnt.argmax())-1)
    if len(set(bodies))<n: raise RuntimeError('frames touch even after dilation 3')
    groups=[[b] for b in bodies]
    for j in range(k):
        if j in bodies or sz[j]<minpx: continue
        cx0,cx1=sl[j][1].start,sl[j][1].stop; best=None;bd=1e9
        for i,b in enumerate(bodies):
            bx0,bx1=sl[b][1].start,sl[b][1].stop
            d=(cx0-bx1)*0.4 if cx0>=bx1 else (bx0-cx1)*1.6 if cx1<=bx0 else 0
            if d<bd: bd=d;best=i
        seam=[i for i,x in enumerate(c[1:-1]) if abs(cx0-(x+1))<=1]   # piece of a blob severed at seam i -> belongs to the left frame
        if seam: groups[seam[0]].append(j); continue
        if sz[j]<80 and bd>8: continue                                 # stray sparkle / speck
        if bd<maxd: groups[best].append(j)
    return [extract(sub,lab,g) for g in groups]
_native=native
def native(fr,k):
    """native() + drop small detached specks near the feet line (neighbour-frame debris); keeps projectiles in mid-air"""
    o=_native(fr,k); a=np.asarray(o['im']).copy(); al=a[...,3]>0; lab,n=nd.label(al)
    if n>1:
        sz=nd.sum(al,lab,range(1,n+1)); main=int(np.argmax(sz))+1; near=nd.binary_dilation(lab==main,iterations=2)
        for j,sl_ in enumerate(nd.find_objects(lab)):
            if j+1==main or sz[j]>=60 or (near&(lab==j+1)).any(): continue
            if sl_[0].stop>a.shape[0]-10: a[lab==j+1]=0
        o['im']=Image.fromarray(a,'RGBA')
    return o
meta={}; HERO=140
def hero_scale(frames): return HERO/UP/np.median([f['h'] for f in frames])
# Aldric: original idle/attack + 8-frame walk
exec(open('/workspace/game/tools/_aldric_seams.py').read())
a=loadj('aldric_walk8_src.jpg'); (y0,y1),=bands(a,1); walk=row_frames(a,y0,y1,8)
ald=[native(f,HERO/UP/src_frames[0]['h']) for f in src_frames]+[native(f,hero_scale(walk)) for f in walk]
meta['aldric']=build('aldric_v5.png',ald)
# Sylwen: v4 frames (from sylwen16_src) + new 8-frame walk; idle/attack bottom row of old sheet
old=load('sylwen16_src.jpg'); lab,g=detect(old,11,1); cs=[]
for ids in g[0]:
    f=extract(old,lab,ids); cs.append((nd.find_objects(lab)[ids[0]][0].start,f))
bot=[f for y,f in cs if y>=340]; k0=HERO/UP/bot[0]['h']
a=loadj('sylwen_walk8_src.jpg'); (y0,y1),=bands(a,1); walk=row_frames(a,y0,y1,8)
meta['sylwen']=build('sylwen_v5.png',[native(f,k0) for f in bot]+[native(f,hero_scale(walk)) for f in walk])
# Kael / Isolde: rows idle, walk, attack
for nm,cnt in [('kael',(5,8,6)),('isolde',(4,8,6))]:
    a=loadj(nm+'_src.jpg'); bs=bands(a,3); rows=[row_frames(a,y0,y1,n,'comp' if r<2 else 'cut') for r,((y0,y1),n) in enumerate(zip(bs,cnt))]
    k=HERO/UP/np.median([f['h'] for f in rows[0]]); fr=[native(f,k) for r in rows for f in r]
    meta[nm]=build(f'{nm}_v1.png',fr)
# Goblin attacks: 5x6 grid, every component in the cell (dust, stones, bolts)
ga=loadj('goblin_attack_src.jpg'); gm=(ga.max(2)>34).astype(float)
rc=cuts(gm.sum(1),5,ga.shape[0],30); cc=cuts(gm.sum(0),6,ga.shape[1],50); print('atk grid',rc,cc)
# scale must match current walk sheets: reuse walk frames from goblins_src for scale + combined sheet
gb=load('goblins_src.jpg'); gw=(gb.max(2)>34).astype(float)
rcw=cuts(gw.sum(1),5,gb.shape[0],30); ccw=cuts(gw.sum(0),6,gb.shape[1],50)
def cellf(img,r0,r1,c0,c1):
    sub=img[r0:r1,c0:c1]; lab,g=detect(sub,1,1,dil=5); return extract(sub,lab,list(range(int(lab.max()))))
def cellmain(img,r0,r1,c0,c1):
    sub=img[r0:r1,c0:c1]; lab,g=detect(sub,1,1,dil=5); return extract(sub,lab,g[0][0])
for r,nm in enumerate(['brute','sneak','slinger','hexer','mender']):
    wk=[cellmain(gb,rcw[r],rcw[r+1],ccw[c],ccw[c+1]) for c in range(6)]
    at=assign_row(ga[rc[r]:rc[r+1]],6)
    tgt=HERO*(0.75 if nm=='brute' else 0.62); k=tgt/UP/np.median([f['h'] for f in wk])
    # attack frames: scale from body height of the main component so effects don't shrink the goblin
    atm=[cellmain(ga,rc[r],rc[r+1],cc[c],cc[c+1]) for c in range(6)]
    ka=tgt/UP/np.median([f['h'] for f in atm]) if nm not in ('brute',) else k*np.median([f['h'] for f in wk])/np.median([f['h'] for f in atm])*1.0
    ka=tgt/UP/np.median([f['h'] for f in atm])
    fa=[]
    for f,fm in zip(at,atm):
        n=native(f,ka); fa.append(n)
    meta['goblin_'+nm]=build(f'goblin_{nm}_v3.png',[native(f,k) for f in wk]+fa)
json.dump(meta,open('/workspace/sprite_meta3.json','w'),indent=1); print(json.dumps(meta))
