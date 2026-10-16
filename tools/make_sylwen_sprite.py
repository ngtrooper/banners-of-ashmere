# Builds public/sprites/sylwen.png (+portrait) from /workspace/sylwen_src.jpg (not committed).
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy import ndimage  # pip install scipy
SRC='/workspace/sylwen_src.jpg'; OUT='/workspace/game/public/sprites/'
src=Image.open(SRC).convert('RGB'); A=np.asarray(src).astype(float)
r,g,b=A[...,0],A[...,1],A[...,2]
bord=(g>70)&(g>b+20)&(r>40)&(abs(r-g)<45)
cp=bord[150:530].sum(0); xs=[i for i in range(A.shape[1]) if cp[i]>200]
# group border columns -> box edges
grp=[];
for x in xs:
    if grp and x-grp[-1][-1]<=2: grp[-1].append(x)
    else: grp.append([x])
edges=[(gg[0],gg[-1]) for gg in grp]
rp=bord.sum(1); ys=[i for i in range(A.shape[0]) if rp[i]>600]; top,bot=ys[0],ys[-1]
boxes=[(edges[i][1],edges[i+1][0]) for i in range(0,len(edges),2)]
print('boxes',boxes,top,bot)
IN=14
frames=[]
for fi,(l,rr) in enumerate(boxes):
    sub=A[top+IN:bot-IN,l+IN:rr-IN]; R,G,B=sub[...,0],sub[...,1],sub[...,2]; lum=sub.max(2)
    glow=(G>110)&(G>R+45)&(G>B+45)
    cand=(lum<32)
    lab,n=ndimage.label(cand)
    edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    sizes=ndimage.sum(np.ones_like(lum),lab,range(1,n+1)); means=ndimage.mean(lum,lab,range(1,n+1))
    # background = dark regions touching the box edge, plus enclosed dark pockets (inside the bow etc.)
    keep=np.zeros(n+1,bool)
    for i in range(1,n+1):
        if i in edge or (sizes[i-1]>900 and means[i-1]<22): keep[i]=True
    bg=keep[lab]
    soft=np.clip((lum-27)/(60-27),0,1)
    alpha=np.where(bg,soft,1.0)
    # feather the cut edge slightly
    a_img=Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)); alpha=np.minimum(np.asarray(a_img)/255.0, np.where(bg,soft,1.0)+0.25)
    alpha=np.clip(alpha,0,1)
    rgb=np.where(alpha[...,None]>0.01, np.clip(sub/np.maximum(alpha[...,None],0.35),0,255), 0)
    if fi==4:  # frame 4's glowing arrow tip pokes into box 5: drop small blobs touching the left edge
        lab2,n2=ndimage.label(alpha>0.05); sz=ndimage.sum(np.ones_like(alpha),lab2,range(1,n2+1))
        for i in set(np.unique(lab2[:,:3]))-{0}:
            if sz[i-1]<0.05*sz.max(): alpha[lab2==i]=0
    im=Image.fromarray(np.dstack([rgb,alpha*255]).astype(np.uint8),'RGBA')
    bb=im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox(); im=im.crop(bb)
    O=np.asarray(im)[...,3]>160; yy,xx=np.where(O); feet=yy.max(); H_=O.shape[0]
    c=int(np.median(xx[(yy>H_*0.35)&(yy<H_*0.6)]))
    frames.append((im,feet,c)); print(im.size,feet,c)
left=max(c for _,_,c in frames); right=max(im.width-c for im,_,c in frames)
up=max(f for _,f,_ in frames); down=max(im.height-f for im,f,_ in frames)
cw,ch=left+right,up+down
DISPLAY_H=88; SS=2  # export at 2x display size; game shows at 0.5 scale with LINEAR filtering
k=DISPLAY_H*SS/ch; sw,sh=round(cw*k),round(ch*k)
sheet=Image.new('RGBA',(sw*len(frames),sh))
for i,(im,f,c) in enumerate(frames):
    cell=Image.new('RGBA',(cw,ch)); cell.alpha_composite(im,(left-c,up-f))
    sheet.alpha_composite(cell.resize((sw,sh),Image.LANCZOS),(i*sw,0))
sheet.save(OUT+'sylwen_v2.png'); print('cell',sw,sh,'origin',round(left/cw,3),round(up/ch,3))
f1,_,c1=frames[0]; side=int(f1.height*0.52); hx=c1
por=Image.new('RGBA',(side,side)); por.alpha_composite(f1.crop((hx-side//2,0,hx+side//2,side)))
por.resize((128,128),Image.LANCZOS).save(OUT+'sylwen-portrait_v2.png')
chk=Image.new('RGBA',sheet.size,(255,0,255,255)); chk.alpha_composite(sheet); chk.save('/workspace/sylwen_check.png')
