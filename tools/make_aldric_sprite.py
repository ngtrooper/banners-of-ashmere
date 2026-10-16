from PIL import Image, ImageFilter
import numpy as np, os
src=Image.open('/workspace/aldric_src.jpg').convert('RGB'); a=np.asarray(src).astype(float)
H,Wd,_=a.shape; lum=a.max(axis=2)
mask=lum>40; xs=np.where(mask.sum(0)>2)[0]; x0,x1=xs[0],xs[-1]; step=(x1-x0)/6
def seam(c,w):
    lo,hi=c-w,c+w; cost=lum[:,lo:hi].copy()**2
    M=cost.copy(); B=np.zeros_like(M,dtype=int)
    for y in range(1,H):
        prev=M[y-1]; l=np.r_[np.inf,prev[:-1]]; r=np.r_[prev[1:],np.inf]
        st=np.vstack([l,prev,r]); i=st.argmin(0); M[y]+=st.min(0); B[y]=i-1
    x=int(M[-1].argmin()); path=[0]*H
    for y in range(H-1,-1,-1): path[y]=x+lo; x+=B[y,x]; x=max(0,min(hi-lo-1,x))
    return np.array(path)
guess=[int(x0+k*step) for k in range(1,6)]; guess[4]=1102; ws=[int(step*0.4)]*4+[22]
seams=[np.full(H,x0-2)]+[seam(g,w) for g,w in zip(guess,ws)]+[np.full(H,x1+2)]
# alpha: soft threshold on brightness; keep glow
def alpha_of(rgb):
    l=rgb.max(axis=2); return np.clip((l-17)/(32-17),0,1)
frames=[]
for k in range(6):
    L,R=seams[k],seams[k+1]; lo,hi=L.min(),R.max()
    sub=a[:,lo:hi]; al=alpha_of(sub)
    xx=np.arange(lo,hi)[None,:]; inside=(xx>=L[:,None])&(xx<R[:,None]); al=al*inside
    rgba=np.dstack([sub,al*255]).astype(np.uint8); im=Image.fromarray(rgba,'RGBA')
    bb=im.getchannel('A').point(lambda v:255 if v>60 else 0).getbbox(); im=im.crop(bb)
    # body centre: use columns of non-glow (less saturated-gold) pixels? use median x of opaque low-y half region
    A=np.asarray(im)[:,:,3]>120; ys,xs_=np.where(A)
    feet=ys.max(); body=xs_[ys>feet*0.25]
    frames.append((im,feet,int(np.median(xs_[(ys>A.shape[0]*0.2)&(ys<A.shape[0]*0.6)]))))
    print(k,im.size,bb)
# common cell: align feet baseline & body centre
left=max(c for _,_,c in frames); right=max(im.width-c for im,_,c in frames)
up=max(f for _,f,_ in frames); down=max(im.height-f for im,f,_ in frames)
cw,ch=left+right,up+down; print('cell',cw,ch)
sheet=Image.new('RGBA',(cw*6,ch))
for i,(im,f,c) in enumerate(frames): sheet.alpha_composite(im,(i*cw+left-c,up-f))
os.makedirs('/workspace/game/public/sprites',exist_ok=True)
# v2: shrink each cell to (approximately) native pixel resolution with a box filter,
# harden alpha, add a 1px dark outline + soft light rim, then upscale x2 nearest.
NATIVE_H=88; UP=2
nh=NATIVE_H; nw=round(cw*NATIVE_H/ch)+4  # +4 = room for outline
def to_native(cell):
    a=np.asarray(cell).astype(float)/255; al=a[...,3:4]
    prem=Image.fromarray((np.dstack([a[...,:3]*al,al])*255).astype(np.uint8),'RGBA')
    small=np.asarray(prem.resize((nw-4,nh),Image.BOX)).astype(float)/255
    al=small[...,3]; rgb=small[...,:3]/np.maximum(al[...,None],1e-3)
    lum=rgb.max(2); glow=(rgb[...,0]>0.6)&(rgb[...,0]>rgb[...,2]+0.2)
    A=np.where(al>0.55,1.0,np.where(glow&(al>0.2),np.clip(al*1.6,0,1),0.0))
    # darken-fringe cleanup: semi-dark edge pixels get lifted toward their neighbours' colour
    out=np.zeros((nh,nw,4)); out[:,2:-2,:3]=np.clip(rgb,0,1); out[:,2:-2,3]=A
    solid=out[...,3]>=0.99
    m=Image.fromarray((solid*255).astype(np.uint8))
    d1=np.asarray(m.filter(ImageFilter.MaxFilter(3)))>0
    d2=np.asarray(m.filter(ImageFilter.MaxFilter(5)))>0
    ring1=d1&~(out[...,3]>0.2); ring2=d2&~d1&~(out[...,3]>0.2)
    out[ring1]=[0.06,0.04,0.09,1.0]           # dark outline
    out[ring2]=[0.96,0.90,0.70,0.45]          # light rim
    im=Image.fromarray((out*255).astype(np.uint8),'RGBA')
    return im.resize((nw*UP,nh*UP),Image.NEAREST)
cells=[to_native(sheet.crop((i*cw,0,(i+1)*cw,ch))) for i in range(6)]
sw,sh=cells[0].size
small=Image.new('RGBA',(sw*6,sh))
for i,c in enumerate(cells): small.alpha_composite(c,(i*sw,0))
small.save('/workspace/game/public/sprites/aldric_v2.png')
print('frame',sw,sh,'originX',round((left*NATIVE_H/ch+2)/nw,3),'originY',round(up/ch,3))
# portrait: native-res head crop of frame 1 upscaled x4 nearest
c0=cells[0]; fx=int(sw*((left*NATIVE_H/ch+2)/nw)); side=int(sh*0.36)
por=c0.crop((fx-side//2+int(side*0.28),int(sh*0.12),fx+side//2+int(side*0.28),int(sh*0.12)+side)).resize((128,128),Image.NEAREST)
por.save('/workspace/game/public/sprites/aldric-portrait_v3.png')
chk=Image.new('RGBA',small.size,(60,90,50,255)); chk.alpha_composite(small); chk.save('/workspace/aldric_check.png')
