from PIL import Image
import numpy as np, os
src=Image.open('aldric_src.jpg').convert('RGB'); a=np.asarray(src).astype(float)
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
# scale: target ~ 2.2 heroes height ~ 96px for cell height of the body
S=86/ch
sw,sh=round(cw*S),round(ch*S)
small=Image.new('RGBA',(sw*6,sh))
for i in range(6): small.alpha_composite(sheet.crop((i*cw,0,(i+1)*cw,ch)).resize((sw,sh),Image.NEAREST),(i*sw,0))
small.save('/workspace/game/public/sprites/aldric.png'); print('frame',sw,sh,'feet y',round(up*S))
# portrait: head/torso of frame 1
f1,_,c1=frames[0]; side=int(f1.height*0.5); hx=c1+int(side*0.08); sq=Image.new('RGBA',(side,side)); sq.alpha_composite(f1.crop((hx-side//2,0,hx+side//2,side)),(0,0))
sq.resize((128,128),Image.NEAREST).save('/workspace/game/public/sprites/aldric-portrait.png')
sheet.save('/workspace/sheet_full.png')
bgc=Image.new('RGBA',sheet.size,(255,0,255,255)); bgc.alpha_composite(sheet); bgc.save('/workspace/sheet_check.png')

print('originX',left/cw,'originY',up/ch)
