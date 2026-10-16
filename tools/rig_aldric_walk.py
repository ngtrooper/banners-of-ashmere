"""Aldric 24-frame walk by cutout rigging his idle frame (aldric_v6 frame 0) at native pixel scale.
Parts: cape (back, lagging sway), back leg, upper body + tabard, front leg, sword (front, small counter-sway).
Legs swing about hidden hip pivots with nearest-neighbour rotation; the swinging leg lifts (knee bend);
the body is ground-locked to the lowest foot, so the up/down bob comes from the leg geometry."""
import numpy as np, json, math, sys
from PIL import Image, ImageFilter
from scipy import ndimage as nd
SP='/workspace/game/public/sprites/'; v=json.load(open('/workspace/aldric_v6_meta.json'))
sheet=Image.open(SP+'aldric_v6.png').convert('RGBA'); fw,fh=v['fw']//2,v['fh']//2
base=np.asarray(sheet.crop((0,0,v['fw'],v['fh'])).resize((fw,fh),Image.NEAREST)).copy()
H,W=base.shape[:2]; yy,xx=np.mgrid[0:H,0:W]; A=base[...,3]>0; r,g,b=[base[...,i].astype(int) for i in range(3)]
OUTLINE=np.array([18,12,26,255],np.uint8)
def seg_dist(p,q):
    p=np.array(p,float);q=np.array(q,float);d=q-p;t=np.clip(((xx-p[0])*d[0]+(yy-p[1])*d[1])/(d@d),0,1)
    return np.hypot(xx-(p[0]+t*d[0]),yy-(p[1]+t*d[1]))
blue=(b>r+6)&(b>=g-4)
cape=A&(xx<36)&(yy>50)&(blue|(r+g+b<120))   # cape + its dark folds left of the back leg
cape=A&nd.binary_closing(cape,iterations=2)&(xx<36)
sword=A&(seg_dist((44,58),(75,86))<=2.6)
tabard=A&(xx>=43)&(xx<=56)&(yy<78)&(yy>=56)
backleg=A&(xx<47)&(yy>=62)&~cape&~sword&~tabard
frontleg=A&(xx>=50)&(yy>=66)&~sword&~tabard
upper=A&~cape&~sword&~backleg&~frontleg
def layer(mask,fill_hull=False):
    img=np.zeros_like(base); img[mask]=base[mask]
    if fill_hull:   # patch pixels hidden behind the sword: fill holes inside the leg silhouette with nearest leg colour
        filled=nd.binary_fill_holes(nd.binary_closing(mask|(sword&nd.binary_dilation(mask,iterations=3)),iterations=2))
        hole=filled&~mask
        if hole.any():
            idx=nd.distance_transform_edt(~mask,return_distances=False,return_indices=True)
            img[hole]=base[idx[0][hole],idx[1][hole]]; img[hole,3]=255
    return Image.fromarray(img,'RGBA')
L={'cape':layer(cape),'back':layer(backleg,True),'upper':layer(upper),'front':layer(frontleg,True),'sword':layer(sword)}
for k,im in L.items(): im.resize((W*4,H*4),Image.NEAREST).save(f'/tmp/rig/part_{k}.png')
PIV={'back':(41,50),'front':(56,52)}
def foot_bottom(im):
    a=np.asarray(im)[...,3]>0; ys,xs=np.where(a); return ys.max() if len(ys) else 0
def leg_pose(name,p):
    """p = this leg's phase; 0 = heel contact (leg fully forward)."""
    ang=float(sys.argv[1]) if len(sys.argv)>1 else 24
    ang=ang*math.cos(2*math.pi*p)                       # +: foot forward (counter-clockwise)
    swing=math.sin(2*math.pi*p)<0                      # second half: leg travelling forward through the air
    lift=6*max(0,-math.sin(2*math.pi*p))**1.5 if swing else 0
    im=L[name].rotate(ang,Image.NEAREST,center=PIV[name])
    # knee bend: lower shin tucks back a little while lifted
    if lift>0.3:
        a=np.asarray(im).copy(); cut=int(PIV[name][1]+27); low=a[cut:].copy(); a[cut:]=0
        dx=-int(round(lift*0.5)); low=np.roll(low,dx,axis=1); a[cut-int(round(lift*0.6)):cut-int(round(lift*0.6))+low.shape[0]]=np.where(low[...,3:4]>0,low,a[cut-int(round(lift*0.6)):cut-int(round(lift*0.6))+low.shape[0]])
        im=Image.fromarray(a,'RGBA')
    return im,int(round(lift))
GROUND=foot_bottom(L['back'])
def outline(im):
    a=np.asarray(im).copy(); s=a[...,3]>0
    d=nd.binary_dilation(s,structure=np.array([[0,1,0],[1,1,1],[0,1,0]]))
    a[d&~s]=OUTLINE; return Image.fromarray(a,'RGBA')
def frame(i,n=24):
    p=i/n
    fl,lf=leg_pose('front',p); bl,lb=leg_pose('back',(p+0.5)%1)
    # ground lock: the planted (non-lifted) leg's lowest pixel sits on GROUND
    planted=[foot_bottom(im) for im,l in ((fl,lf),(bl,lb)) if l<=0] or [foot_bottom(fl),foot_bottom(bl)]
    dy=GROUND-max(planted)
    cape_sway=1.4*math.sin(2*math.pi*(2*p)-1.2)       # cape lags the step rhythm
    sw=int(round(-0.8*math.cos(2*math.pi*p)))         # sword/arm counter-swing (1 px)
    out=Image.new('RGBA',(W,H))
    ca=np.asarray(L['cape']).copy(); c2=np.zeros_like(ca)
    for y in range(H):
        s=int(round(cape_sway*max(0,(y-50))/30)); c2[y]=np.roll(ca[y],s,axis=0)
    def put(im,dx=0,ddy=0): out.alpha_composite(im,(dx,dy+ddy)) if dy+ddy>=0 else out.alpha_composite(im.crop((0,-(dy+ddy),W,H)),(dx,0))
    put(Image.fromarray(c2,'RGBA')); put(bl); put(L['upper']); put(fl); put(L['sword'],sw)
    return outline(out),dy
frames=[];dys=[]
for i in range(24): f,dy=frame(i); frames.append(f); dys.append(dy)
print('body dy per frame',dys)
# stride: front foot toe x over the stance half-cycle
xs=[]
for i in range(24):
    a=np.asarray(leg_pose('front',i/24)[0])[...,3]>0; ys,x_=np.where(a); xs.append(int(x_[ys>=ys.max()-2].max()))
print('front toe x',xs)
json.dump(dict(dys=[int(d) for d in dys],toe=xs),open('/tmp/rig/info.json','w'))
for i,f in enumerate(frames): f.save(f'/tmp/rig/f{i:02d}.png')
