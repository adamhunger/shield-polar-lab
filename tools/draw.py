from pathlib import Path
OUTPUT = Path(__file__).resolve().parents[1] / 'images'
OUTPUT.mkdir(exist_ok=True)
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=np.pi
u=np.linspace(-1,1,181); v=np.linspace(0,1,121)
U,V=np.meshgrid(u,v); T=V*(p/6+p/3*U**2); F=p/12*U
X=np.sin(T)*np.cos(F); Y=np.sin(T)*np.sin(F); Z=np.cos(T)
fig=plt.figure(figsize=(12,7),facecolor='#f7fafc')
ax=fig.add_subplot(121,projection='3d'); ax.set_facecolor('#f7fafc')
t,f=np.meshgrid(np.linspace(0,p/2,19),np.linspace(-p,p,49))
ax.plot_wireframe(np.sin(t)*np.cos(f),np.sin(t)*np.sin(f),np.cos(t),color='#a0b4c6',alpha=.22,lw=.5)
ax.plot_surface(X,Y,Z,color='#37a9ed',alpha=.9,linewidth=0,shade=False)
th=p/6+p/3*u*u; ph=p/12*u
bx=np.sin(th)*np.cos(ph); by=np.sin(th)*np.sin(ph); bz=np.cos(th)
ax.plot(bx,by,bz,color='#006bb8',lw=3)
for angle in [-p/12,p/12]:
 tt=np.linspace(0,p/2,200); ax.plot(np.sin(tt)*np.cos(angle),np.sin(tt)*np.sin(angle),np.cos(tt),color='#006bb8',lw=2)
pts=[(0,0,1,'N'),(np.cos(p/12),-np.sin(p/12),0,'A'),(np.cos(p/12),np.sin(p/12),0,'B'),(.5,0,np.sqrt(3)/2,'M')]
for x,y,z,s in pts:
 ax.scatter(x,y,z,color='#122f49',s=20); ax.text(x,y,z+.045,s,fontsize=12,weight='bold')
ax.view_init(elev=18,azim=28); ax.set_box_aspect((2,2,1)); ax.set_xlim(-1,1); ax.set_ylim(-1,1); ax.set_zlim(0,1.12); ax.set_axis_off(); ax.set_title('Petal on the hemisphere',fontsize=16,pad=12)
a=fig.add_subplot(122); a.set_facecolor('#f7fafc')
# Orthographic view looking inward along the middle meridian's horizontal direction.
tt=np.linspace(0,p/2,200)
a.fill(np.r_[np.sin(tt)*np.sin(-p/12),by,(np.sin(tt)*np.sin(p/12))[::-1]],np.r_[np.cos(tt),bz,np.cos(tt)[::-1]],color='#a4ddfb')
a.plot(by,bz,color='#006bb8',lw=3,label='Curved boundary A–M–B')
for angle in [-p/12,p/12]:
 tt=np.linspace(0,p/2,200); a.plot(np.sin(tt)*np.sin(angle),np.cos(tt),color='#006bb8',lw=2)
for x,y,z,s in pts:
 a.scatter(y,z,color='#122f49',s=28,zorder=5); a.annotate(s,(y,z),xytext=(8,5),textcoords='offset points',fontsize=12,weight='bold')
a.axhline(0,color='#a0b4c6',lw=1); a.plot([0,0],[1,np.sqrt(3)/2],ls=':',color='#48748c')
a.text(.04,.92,'30° from pole',fontsize=10,color='#31566d'); a.text(0,.28,'Cutout',ha='center',color='#617788',fontsize=13)
a.set_aspect('equal'); a.set_xlim(-.34,.38); a.set_ylim(-.06,1.08); a.set_xlabel('Horizontal position / R'); a.set_ylabel('Height / R'); a.spines[['top','right']].set_visible(False); a.set_title('Front view of the same petal',fontsize=16,pad=12)
fig.suptitle('One spherical shield petal • 12 divisions around the equator',fontsize=19,y=.98)
fig.text(.5,.035,'N: north pole    A, B: adjacent equatorial points (30° apart)    M: boundary midpoint at polar angle 30°',ha='center',fontsize=11,color='#31566d')
fig.subplots_adjust(top=.88,bottom=.13,wspace=.12)
fig.savefig(str(OUTPUT / 'shield_petal.png'),dpi=180)
