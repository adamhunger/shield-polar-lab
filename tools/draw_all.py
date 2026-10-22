from pathlib import Path
OUTPUT = Path(__file__).resolve().parents[1] / 'images'
OUTPUT.mkdir(exist_ok=True)
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=np.pi
fig=plt.figure(figsize=(14,8),facecolor='#f7fafc')
ax=fig.add_subplot(121,projection='3d',computed_zorder=False); ax.set_facecolor('#f7fafc')
a=fig.add_subplot(122); a.set_facecolor('#f7fafc')
u=np.linspace(-1,1,101); v=np.linspace(0,1,61); U,V=np.meshgrid(u,v); T=V*(p/6+p/3*U**2)
th=p/6+p/3*u*u; tt=np.linspace(0,p/2,150)
# faint hemisphere reference
f,t=np.meshgrid(np.linspace(0,2*p,73),np.linspace(0,p/2,13))
ax.plot_wireframe(np.sin(t)*np.cos(f),np.sin(t)*np.sin(f),np.cos(t),color='#b2bfcb',alpha=.17,lw=.4,zorder=0)
for k in list(range(1,12))+[0]:
 ph=p/12*u+k*p/6; F=p/12*U+k*p/6
 X=np.sin(T)*np.cos(F); Y=np.sin(T)*np.sin(F); Z=np.cos(T)
 color='#168fdd' if k==0 else ('#afd9ef' if k%2 else '#83c4e8')
 edge='#00548b' if k==0 else '#4788af'; alpha=.85 if k==0 else .32
 ax.plot_surface(X,Y,Z,color=color,alpha=alpha,linewidth=0,shade=False,zorder=2 if k==0 else 1)
 bx=np.sin(th)*np.cos(ph); by=np.sin(th)*np.sin(ph); bz=np.cos(th)
 ax.plot(bx,by,bz,color=edge,lw=2 if k==0 else 1,alpha=1 if k==0 else .65,zorder=4)
 # top view oriented original petal toward bottom
 left=k*p/6-p/12; right=k*p/6+p/12
 xx=np.r_[np.sin(tt)*np.cos(left),bx,(np.sin(tt)*np.cos(right))[::-1]]
 yy=np.r_[np.sin(tt)*np.sin(left),by,(np.sin(tt)*np.sin(right))[::-1]]
 a.fill(yy,-xx,color=color,alpha=.85,linewidth=0)
 a.plot(by,-bx,color=edge,lw=2 if k==0 else 1)
 for angle in [left,right]:
  ax.plot(np.sin(tt)*np.cos(angle),np.sin(tt)*np.sin(angle),np.cos(tt),color=edge,lw=1.5 if k==0 else .8,alpha=.9,zorder=4)
  a.plot([0,np.sin(angle)],[0,-np.cos(angle)],color=edge,lw=1 if k==0 else .65)
 a.text(1.08*np.sin(k*p/6),-1.08*np.cos(k*p/6),str(k+1),ha='center',va='center',fontsize=10,color='#54809b')
f=np.linspace(0,2*p,300); a.plot(np.sin(f),np.cos(f),ls=':',color='#9dabb5',lw=1)
pts=[(0,0,1,'N'),(np.cos(p/12),-np.sin(p/12),0,'A'),(np.cos(p/12),np.sin(p/12),0,'B'),(.5,0,np.sqrt(3)/2,'M')]
for x,y,z,s in pts:
 ax.scatter(x,y,z,color='#102e43',s=25,depthshade=False,zorder=10)
 ax.text(x,y,z+.05,s,fontsize=14,weight='bold',zorder=11,bbox=dict(facecolor='white',alpha=.8,edgecolor='none',pad=1))
 a.scatter(y,-x,color='#102e43',s=25,zorder=10)
 offset=(-18,-15) if s=='A' else (8,-15) if s=='B' else (8,7)
 a.annotate(s,(y,-x),xytext=offset,textcoords='offset points',fontsize=14,weight='bold',zorder=11,bbox=dict(facecolor='white',alpha=.8,edgecolor='none',pad=1))
ax.view_init(elev=24,azim=10); ax.set_box_aspect((2,2,1)); ax.set_xlim(-1.05,1.05); ax.set_ylim(-1.05,1.05); ax.set_zlim(0,1.1); ax.set_axis_off(); ax.set_proj_type('ortho'); ax.set_title('Oblique view',fontsize=17)
a.set_aspect('equal'); a.set_xlim(-1.19,1.19); a.set_ylim(-1.19,1.19); a.axis('off'); a.set_title('Top view • all 12 petals',fontsize=17)
fig.suptitle('The complete spherical shield • twelve repeated petals',fontsize=21,y=.95)
fig.text(.5,.10,'Original petal highlighted in blue. All twelve share the north pole N.',ha='center',fontsize=13,color='#244e69')
fig.text(.5,.055,'A, B: original equatorial endpoints    M: original arch midpoint, 30° from N    Numbers: petals 1–12',ha='center',fontsize=12,color='#466d85')
fig.subplots_adjust(top=.84,bottom=.16,left=.02,right=.98,wspace=.05)
fig.savefig(str(OUTPUT / 'shield_twelve_petals.png'),dpi=180)
