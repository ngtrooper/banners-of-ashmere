# 16-bit pass: hard alpha, 32-colour palettes, 1px dark outline, x2 nearest.
# Heroes are derived from the v2 sheets (themselves built from Franklin's source art);
# walk cycles are synthesised from the idle frame (split-leg shift + bob).
# Goblins are drawn procedurally here. Output: public/sprites/*_v3.png / goblin_*_v1.png
from PIL import Image, ImageDraw
import numpy as np, json, math
SP='/workspace/game/public/sprites/'
OUTL=(18,12,26,255)

def hard(im, th=128):
    a=np.array(im); a[...,3]=np.where(a[...,3]>=th,255,0); return Image.fromarray(a,'RGBA')
def strip_outline(im):
    a=np.array(im); m=(np.abs(a[...,0].astype(int)-15)<8)&(np.abs(a[...,1].astype(int)-10)<8)&(np.abs(a[...,2].astype(int)-23)<8)
    a[m,3]=0; return Image.fromarray(a,'RGBA')
def outline(im):
    a=np.array(im); o=a[...,3]>0; d=o.copy()
    d[1:]|=o[:-1]; d[:-1]|=o[1:]; d[:,1:]|=o[:,:-1]; d[:,:-1]|=o[:,1:]
    ring=d&~o; a[ring]=OUTL; return Image.fromarray(a,'RGBA')
def quantize(frames,n=32):
    w,h=frames[0].size; strip=Image.new('RGBA',(w*len(frames),h))
    for i,f in enumerate(frames): strip.paste(f,(i*w,0))
    a=np.array(strip); rgb=Image.fromarray(a[...,:3]); q=np.array(rgb.quantize(colors=n,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB'))
    a[...,:3]=q; s=Image.fromarray(a,'RGBA'); return [s.crop((i*w,0,(i+1)*w,h)) for i in range(len(frames))]
def pad(im,p=2):
    o=Image.new('RGBA',(im.width+2*p,im.height+p)); o.paste(im,(p,p)); return o
def walk_from(idle, cx, feet, body_h, n=4, amp=3):
    a=np.array(idle); top=int(feet-body_h*0.30)
    out=[]
    for k,(fr,bk,bob) in enumerate([(amp,-amp,0),(0,0,-1),(-amp,amp,0),(0,0,-1)][:n]):
        b=np.zeros_like(a)
        up=a[:top]; b[max(0,bob):top+bob if bob<0 else top]=up[-bob if bob<0 else 0:] if bob<0 else up
        legs=a[top:]
        for half,dx in ((slice(cx,None),fr),(slice(0,cx),bk)):
            part=np.zeros_like(legs); part[:,half]=legs[:,half]
            part=np.roll(part,dx,axis=1)
            m=part[...,3]>0; tgt=b[top:]; tgt[m]=part[m]
        out.append(Image.fromarray(b,'RGBA'))
    return out
def up2(im): return im.resize((im.width*2,im.height*2),Image.NEAREST)
def save_sheet(name,frames):
    w,h=frames[0].size; s=Image.new('RGBA',(w*len(frames),h))
    for i,f in enumerate(frames): s.alpha_composite(f,(i*w,0))
    s.save(SP+name); return w,h
meta={}
# ---------- Aldric ----------
v2=Image.open(SP+'aldric_v2.png'); cw,ch=178,176
nat=[hard(strip_outline(v2.crop((i*cw,0,(i+1)*cw,ch)).resize((cw//2,ch//2),Image.NEAREST))) for i in range(6)]
nat=quantize(nat,32)
cx=int(0.439*cw/2); feet=int(0.987*ch/2)
walk=walk_from(nat[0],cx,feet,70,4,3)
frames=[up2(outline(f)) for f in nat+walk]
w,h=save_sheet('aldric_v3.png',frames); meta['aldric']=dict(fw=w,fh=h,frames=len(frames),ox=0.439,oy=0.987)
# ---------- Sylwen (repixelised from her painted sheet) ----------
v2=Image.open(SP+'sylwen_v2.png'); cw,ch=118,176; NH=70; NW=round(cw*NH/ch)
def box_down(im):
    a=np.asarray(im).astype(float)/255; al=a[...,3:4]
    prem=Image.fromarray((np.dstack([a[...,:3]*al,al])*255).astype(np.uint8),'RGBA').resize((NW,NH),Image.BOX)
    s=np.asarray(prem).astype(float)/255; al=s[...,3]; rgb=s[...,:3]/np.maximum(al[...,None],1e-3)
    # punch up contrast a little for a crisper 16-bit read
    rgb=np.clip((rgb-0.5)*1.12+0.5+0.02,0,1)
    return hard(Image.fromarray((np.dstack([rgb,al])*255).astype(np.uint8),'RGBA'),120)
nat=[pad(box_down(v2.crop((i*cw,0,(i+1)*cw,ch)))) for i in range(5)]
nat=quantize(nat,32)
cxs=int(0.399*NW)+2; feet=NH+1
walk=walk_from(nat[0],cxs,feet,NH,4,2)
frames=[up2(outline(f)) for f in nat+walk]
w,h=save_sheet('sylwen_v3.png',frames); meta['sylwen']=dict(fw=w,fh=h,frames=len(frames),ox=round((cxs)/(NW+4),3),oy=round((feet)/(NH+2),3))
# ---------- Goblins (procedural 16-bit) ----------
SK,SKD,SKL=(104,164,60),(58,108,42),(156,206,96); EYE=(255,224,64); DK=(30,20,34)
MET,METD,WOOD,WOODD=(168,172,184),(96,100,116),(136,90,48),(84,54,30)
KIND={
 'brute': dict(s=1.55,tunic=(120,70,40),tunicD=(80,44,26)),
 'sneak': dict(s=1.15,tunic=(72,64,92),tunicD=(44,38,60)),
 'slinger': dict(s=1.2,tunic=(150,110,60),tunicD=(100,72,38)),
 'hexer': dict(s=1.2,tunic=(110,52,140),tunicD=(70,30,94)),
 'mender': dict(s=1.2,tunic=(214,206,180),tunicD=(150,140,118)),
}
def goblin(kind,phase=0,bob=0,arm='rest'):
    k=KIND[kind]; s=k['s']; W=int(44*s)+6; H=int(46*s)+4
    im=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(im)
    S=lambda v:int(round(v*s)); fx=H-3; cx=W//2-S(2)
    crouch=S(3) if kind=='sneak' else 0
    hip=fx-S(11)+bob; sh=hip-S(11)+crouch; hy=sh-S(9)
    # legs
    for side,ph in ((-1,-phase),(1,phase)):
        x=cx+side*S(3)+int(ph*S(3))
        d.rectangle([x-S(2),hip,x+S(1),fx-1],fill=SKD if side<0 else SK); d.rectangle([x-S(2),fx-S(2),x+S(3),fx],fill=WOODD)
    # torso / robe
    if kind in('hexer','mender'):
        d.polygon([(cx-S(6),sh),(cx+S(6),sh),(cx+S(8),fx-S(3)),(cx-S(8),fx-S(3))],fill=k['tunic']); d.line([(cx,sh+1),(cx,fx-S(4))],fill=k['tunicD'])
    else:
        d.rectangle([cx-S(6),sh,cx+S(6),hip+S(1)],fill=k['tunic']); d.rectangle([cx-S(6),hip-S(1),cx+S(6),hip+S(1)],fill=WOODD)
    if kind=='brute': d.rectangle([cx-S(7),sh,cx+S(2),sh+S(3)],fill=MET); d.rectangle([cx-S(7),sh+S(3),cx+S(2),sh+S(4)],fill=METD)
    if kind=='mender': d.rectangle([cx-1,sh+S(3),cx+1,sh+S(10)],fill=(200,40,40)); d.rectangle([cx-S(3),sh+S(5),cx+S(3),sh+S(7)],fill=(200,40,40))
    # back arm
    d.rectangle([cx-S(8),sh+S(1),cx-S(6),sh+S(8)],fill=SKD)
    # head (big, goblin)
    d.ellipse([cx-S(7),hy-S(8),cx+S(8),hy+S(5)],fill=SK); d.ellipse([cx-S(5),hy-S(7),cx+S(3),hy-S(3)],fill=SKL)
    d.polygon([(cx-S(7),hy-S(3)),(cx-S(14),hy-S(7)),(cx-S(7),hy)],fill=SK)   # back ear
    d.polygon([(cx+S(7),hy-S(3)),(cx+S(15),hy-S(8)),(cx+S(7),hy)],fill=SK)   # front ear
    d.rectangle([cx+S(2),hy-S(2),cx+S(4),hy-S(1)],fill=EYE); d.point((cx+S(4),hy-S(2)),fill=DK)
    d.polygon([(cx+S(7),hy-S(1)),(cx+S(11),hy+S(1)),(cx+S(7),hy+S(2))],fill=SKD)  # nose
    d.line([(cx+S(1),hy+S(3)),(cx+S(6),hy+S(3))],fill=DK); d.point((cx+S(3),hy+S(4)),fill=(240,240,220))
    # headgear
    if kind=='brute': d.chord([cx-S(7),hy-S(10),cx+S(8),hy+S(1)],180,360,fill=MET); d.rectangle([cx-S(7),hy-S(5),cx+S(8),hy-S(4)],fill=METD); d.polygon([(cx,hy-S(10)),(cx+S(2),hy-S(15)),(cx+S(3),hy-S(9))],fill=(230,230,230))
    if kind=='sneak': d.chord([cx-S(8),hy-S(10),cx+S(8),hy+S(3)],150,390,fill=k['tunic']); d.rectangle([cx+S(1),hy-S(1),cx+S(7),hy],fill=k['tunicD'])
    if kind=='slinger': d.chord([cx-S(6),hy-S(10),cx+S(7),hy-S(2)],180,360,fill=k['tunicD'])
    if kind=='hexer': d.polygon([(cx-S(8),hy-S(4)),(cx+S(8),hy-S(4)),(cx-S(4),hy-S(18))],fill=k['tunic']); d.rectangle([cx-S(8),hy-S(5),cx+S(8),hy-S(3)],fill=k['tunicD'])
    if kind=='mender': d.chord([cx-S(8),hy-S(10),cx+S(8),hy+S(1)],180,360,fill=k['tunic']); d.rectangle([cx-S(1),hy-S(10),cx+S(1),hy-S(6)],fill=(200,40,40))
    # front arm + weapon by pose
    shx,shy=cx+S(4),sh+S(2)
    ang={'rest':60,'windup':-120,'strike':20,'recover':80}[arm]; L=S(8)
    hx=shx+int(L*math.cos(math.radians(ang))); hyy=shy+int(L*math.sin(math.radians(ang)))
    d.line([(shx,shy),(hx,hyy)],fill=SK,width=max(2,S(3)))
    wa=math.radians(ang-70 if arm!='windup' else ang-30)
    def stick(len_,col,w=2,colD=None):
        ex,ey=hx+int(len_*math.cos(wa)),hyy+int(len_*math.sin(wa)); d.line([(hx,hyy),(ex,ey)],fill=col,width=w); return ex,ey
    if kind=='brute': ex,ey=stick(S(14),WOOD,S(3)); d.ellipse([ex-S(4),ey-S(4),ex+S(4),ey+S(4)],fill=WOODD); d.point((ex,ey-S(3)),fill=MET); d.point((ex+S(3),ey),fill=MET)
    if kind=='sneak': stick(S(9),MET,2); d.point((hx,hyy),fill=WOODD)
    if kind=='slinger':
        if arm=='strike': d.line([(hx,hyy),(hx+S(6),hyy-S(2))],fill=WOODD); d.ellipse([hx+S(14),hyy-S(4),hx+S(17),hyy-S(1)],fill=METD)
        else: ex,ey=stick(S(7),WOODD,1); d.ellipse([ex-S(2),ey-S(2),ex+S(1),ey+S(1)],fill=METD)
    if kind=='hexer': ex,ey=stick(S(16),WOODD,2); d.ellipse([ex-S(3),ey-S(3),ex+S(3),ey+S(3)],fill=(190,90,255)); d.point((ex-1,ey-1),fill=(240,200,255))
    if kind=='mender': ex,ey=stick(S(15),(230,220,190),2); d.rectangle([ex-S(2),ey-S(2),ex+S(2),ey+S(2)],fill=(90,220,120))
    d.ellipse([hx-S(2),hyy-S(2),hx+S(1),hyy+S(1)],fill=SK)
    if arm=='strike' and kind in('hexer',): d.ellipse([ex+S(4),ey-S(2),ex+S(8),ey+S(2)],fill=(190,90,255))
    if arm=='strike' and kind=='mender': d.ellipse([ex+S(3),ey-S(2),ex+S(7),ey+S(2)],fill=(120,240,150))
    return im
for kind in KIND:
    fr=[goblin(kind,p,b,'rest') for p,b in ((1,0),(0,-1),(-1,0),(0,-1))]+[goblin(kind,0,0,a) for a in ('windup','strike','recover')]
    fr=[up2(outline(f)) for f in fr]
    w,h=save_sheet(f'goblin_{kind}_v1.png',fr); meta['goblin_'+kind]=dict(fw=w,fh=h,frames=len(fr),ox=0.45,oy=(h-4)/h)
json.dump(meta,open('/workspace/sprite_meta.json','w'),indent=1); print(json.dumps(meta))
# portraits (head crops of frame 0, x2 nearest -> 128)
def portrait(sheet,fw,fh,side,name):
    # auto head crop: find the topmost opaque rows of frame 0 and centre a square on them
    f=Image.open(SP+sheet).crop((0,0,fw,fh)); A=np.array(f)[...,3]>0; ys,xs=np.where(A); top=ys.min()
    hx=int(np.median(xs[ys<top+side*0.35])); x0=max(0,hx-side//2-6); y0=max(0,top-6)
    f.crop((x0,y0,x0+side,y0+side)).resize((128,128),Image.NEAREST).save(SP+name)
portrait('aldric_v3.png',178,176,60,'aldric-portrait_v4.png')
portrait('sylwen_v3.png',meta['sylwen']['fw'],meta['sylwen']['fh'],int(meta['sylwen']['fh']*0.5),'sylwen-portrait_v3.png')
