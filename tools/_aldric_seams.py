# split the original Aldric idle/attack sheet (aldric_src.jpg) along low-energy seams
_a=load('aldric_src.jpg'); _H=_a.shape[0]; _lum=_a.max(axis=2)
_m=_lum>40; _xs=np.where(_m.sum(0)>2)[0]; _x0,_x1=_xs[0],_xs[-1]; _step=(_x1-_x0)/6
def _seam(c,w):
    lo,hi=c-w,c+w; M=_lum[:,lo:hi].copy()**2; B=np.zeros_like(M,dtype=int)
    for y in range(1,_H):
        p=M[y-1]; l=np.r_[np.inf,p[:-1]]; r=np.r_[p[1:],np.inf]; st=np.vstack([l,p,r]); i=st.argmin(0); M[y]+=st.min(0); B[y]=i-1
    x=int(M[-1].argmin()); path=[0]*_H
    for y in range(_H-1,-1,-1): path[y]=x+lo; x+=B[y,x]; x=max(0,min(hi-lo-1,x))
    return np.array(path)
_g=[int(_x0+k*_step) for k in range(1,6)]; _g[4]=1102; _ws=[int(_step*0.4)]*4+[22]
_se=[np.full(_H,_x0-2)]+[_seam(c,w) for c,w in zip(_g,_ws)]+[np.full(_H,_x1+2)]
src_frames=[]
for _k in range(6):
    L,R=_se[_k],_se[_k+1]; xx=np.arange(_a.shape[1])[None,:]; inside=(xx>=L[:,None])&(xx<R[:,None])
    _lab=inside.astype(int)
    src_frames.append(extract(_a,_lab,[0]))
