"""M1.11: portraits for Kael/Isolde, summon altar + burst, region parallax layers (from local /workspace/src2/*_src.jpg)."""
import numpy as np, json
from PIL import Image
from scipy import ndimage as nd
S2='/workspace/src2/'; OUT='/workspace/game/public/'; M=json.load(open('/workspace/sprite_meta3.json'))
# portraits: head crop of idle frame 0
for key,side,dx,name in [('kael',60,0,'kael-portrait_v1.png'),('isolde',60,-4,'isolde-portrait_v1.png'),('aldric',56,2,'aldric-portrait_v6.png'),('sylwen',66,4,'sylwen-portrait_v5.png')]:
    v=M[key]; s=Image.open(OUT+'sprites/'+v['url'].split('/')[-1]); c=s.crop((0,0,v['fw'],v['fh']))
    A=np.asarray(c)[...,3]>0; ys,xs=np.where(A); top=ys.min(); hx=int(np.median(xs[ys<top+side*0.6]))+dx
    c.crop((hx-side//2,top-4,hx+side//2,top-4+side)).resize((128,128),Image.NEAREST).save(OUT+'sprites/'+name)
# summon burst: 8 frames, black bg kept (composited with screen blending), common centre, native/2 then x2 nearest
b=np.asarray(Image.open(S2+'burst_src.jpg').convert('RGB')).astype(float); m=b.max(2)>40
xs=np.where(m.sum(0)>0)[0]; x0,x1=xs[0],xs[-1]; p=m.sum(0).astype(float)
cuts=[x0-10]
for k in range(1,8):
    e=int(x0+(x1-x0)*k/8); w=40; cuts.append(e-w+int(np.argmin(p[e-w:e+w])))
cuts.append(x1+10); _y,_x=np.where(m); cy=int(np.median(_y[_x<cuts[2]]))  # ring centre line from early frames
fw=max(cuts[i+1]-cuts[i] for i in range(8)); fh=300; frames=[]
for i in range(8):
    cell=Image.new('RGB',(fw,fh)); seg=Image.fromarray(b[:,cuts[i]:cuts[i+1]].astype(np.uint8))
    # vertical: ring centre at 75% of cell height so pillars rise above the circle
    cell.paste(seg,((fw-seg.width)//2,int(fh*0.78)-cy)); frames.append(cell)
sheet=Image.new('RGB',(fw*8,fh))
for i,f in enumerate(frames): sheet.paste(f,(i*fw,0))
sheet=sheet.resize((sheet.width//2,sheet.height//2),Image.BOX).resize((sheet.width//2*2,sheet.height//2*2),Image.NEAREST)
sheet.save(OUT+'ui/summon-burst_v1.webp',quality=88); print('burst',fw,fh,'cy',cy)
a=Image.open(S2+'altar_src.jpg').convert('RGB'); a.resize((640,360),Image.BOX).resize((1280,720),Image.NEAREST).save(OUT+'ui/summon-altar_v1.webp',quality=86)
# backgrounds: 3 horizontal bands (far / near / ground). Mirror-tiled so the right edge meets its own reflection.
BANDS={'greenvale':(0.50,0.80),'dunmoor':(0.52,0.78),'cinderfell':(0.55,0.82),'frostspire':(0.56,0.80)}
H=440; GTOP=296  # battlefield: ground strip occupies y 296..440
bgmeta={}
for nm,(f1,f2) in BANDS.items():
    im=Image.open(S2+f'bg_{nm}_src.jpg').convert('RGB'); w,h=im.size
    mir=Image.new('RGB',(w*2,h)); mir.paste(im,(0,0)); mir.paste(im.transpose(Image.FLIP_LEFT_RIGHT),(w,0))
    sc=0.62  # far/near scale: 720 -> 446
    far=mir.crop((0,0,w*2,int(h*f1)+2)); near=mir.crop((0,int(h*f1),w*2,int(h*f2)+2))
    gs=(H-GTOP)/(h*(1-f2)); ground=mir.crop((0,int(h*f2),w*2,h))
    def px(img,s,nmx):
        tw,th=round(img.width*s/2)*2,round(img.height*s/2)*2
        out=img.resize((tw//2,th//2),Image.BOX).resize((tw,th),Image.NEAREST); out.save(OUT+f'bg/{nm}-{nmx}_v1.webp',quality=86); return out.size
    sf=px(far,sc,'far'); sn=px(near,sc,'near'); sg=px(ground,gs,'ground')
    # place near so its bottom tucks under the ground strip; far so its bottom tucks under near
    ny=GTOP+8-sn[1]; fy=ny+6-sf[1]
    bgmeta[nm]=dict(far=dict(y=fy,w=sf[0],h=sf[1]),near=dict(y=ny,w=sn[0],h=sn[1]),ground=dict(y=GTOP,w=sg[0],h=sg[1]))
json.dump(bgmeta,open('/workspace/bg_meta.json','w'),indent=1); print(json.dumps(bgmeta))
