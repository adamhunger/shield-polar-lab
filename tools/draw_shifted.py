from pathlib import Path
OUTPUT = Path(__file__).resolve().parents[1] / 'images'
OUTPUT.mkdir(exist_ok=True)
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=np.pi; rad=p/180; n=np.array([np.sin(50*rad),0,np.cos(50*rad)])
def point(u,v,k):
 u,v=np.broadcast_arrays(u,v); phi=k*p/6+u*p/12
 q=np.stack([np.cos(phi),np.sin(phi),np.zeros_like(phi)],axis=-1)
 d=np.arccos(np.clip(q@n,-1,1)); tang=(q-n*np.cos(d)[...,None])/np.sin(d)[...,None]
 b=30*rad+(d-30*rad)*u*u; t=v*b
 return n*np.cos(t)[...,None]+tang*np.sin(t)[...,None]
u=np.linspace(-1,1,121); v=np.linspace(0,1,81); U,V=np.meshgrid(u,v)
fig=plt.figure(figsize=(16,7.5),facecolor='#f7fafc'); gs=fig.add_gridspec(1,3,width_ratios=[1.25,1.1,.8])
ax=fig.add_subplot(gs[0],projection='3d',computed_zorder=False); a=fig.add_subplot(gs[1]); side=fig.add_subplot(gs[2])
for aa in [ax,a,side]: aa.set_facecolor('#f7fafc')
f,t=np.meshgrid(np.linspace(0,2*p,73),np.linspace(0,p/2,13))
ax.plot_wireframe(np.sin(t)*np.cos(f),np.sin(t)*np.sin(f),np.cos(t),color='#b2bfcb',alpha=.2,lw=.45,zorder=0)
for k in list(range(1,12))+[0]:
 P=point(U,V,k); b=point(u,1,k); left=point(-1,v,k); right=point(1,v,k)
 assert np.max(np.abs(np.linalg.norm(P,axis=-1)-1))<1e-12
 for s in [-1,1]:
  anchor=point(s,1,k); phi=k*p/6+s*p/12
  assert np.linalg.norm(anchor-[np.cos(phi),np.sin(phi),0])<1e-12
 color='#168fdd' if k==0 else ('#afd9ef' if k%2 else '#83c4e8'); edge='#00548b' if k==0 else '#4788af'
 ax.plot_surface(*np.moveaxis(P,-1,0),color=color,alpha=.85 if k==0 else .3,linewidth=0,shade=False,zorder=2 if k==0 else 1)
 for line in [b,left,right]: ax.plot(*line.T,color=edge,lw=1.7 if k==0 else .9,alpha=1 if k==0 else .65,zorder=4)
 poly=np.concatenate([left,b,right[::-1]])
 a.fill(poly[:,1],-poly[:,0],color=color,alpha=.85)
 for line in [b,left,right]: a.plot(line[:,1],-line[:,0],color=edge,lw=1.7 if k==0 else .8)
 a.text(1.1*np.sin(k*p/6),-1.1*np.cos(k*p/6),str(k+1),ha='center',va='center',fontsize=9,color='#54809b')
f=np.linspace(0,2*p,300); a.plot(np.sin(f),np.cos(f),ls=':',color='#9dabb5')
anchors=np.arange(12)*p/6-p/12
ax.scatter(np.cos(anchors),np.sin(anchors),np.zeros(12),s=10,color='#36586d',zorder=8)
a.scatter(np.sin(anchors),-np.cos(anchors),s=13,color='#36586d',zorder=8)
m=point(0,1,0); assert abs(np.arccos(n@m)/rad-30)<1e-10; assert abs(np.arcsin(m[2])/rad-10)<1e-10
pts=[(n,'N'),(point(-1,1,0),'A'),(point(1,1,0),'B'),(m,'M')]
for xyz,s in pts:
 x,y,z=xyz; ax.scatter(x,y,z,color='#102e43',s=24,depthshade=False,zorder=10); ax.text(x,y,z+.045,s,fontsize=13,weight='bold',zorder=11,bbox=dict(facecolor='white',alpha=.8,edgecolor='none',pad=1))
 a.scatter(y,-x,color='#102e43',s=24,zorder=10)
 offset={'A':(-20,-16),'B':(8,-16),'M':(9,0),'N':(9,8)}[s]
 a.annotate(s,(y,-x),xytext=offset,textcoords='offset points',fontsize=13,weight='bold',zorder=11,bbox=dict(facecolor='white',alpha=.8,edgecolor='none',pad=1))
a.scatter(0,0,color='#999999',marker='+',s=40); a.text(.04,.025,'Old N',fontsize=10,color='#777777'); a.annotate('',xy=(0,-n[0]),xytext=(0,0),arrowprops=dict(arrowstyle='->',color='#df8a36',lw=1.5,ls='--'))
ax.view_init(elev=27,azim=18); ax.set_box_aspect((2,2,1)); ax.set_xlim(-1.03,1.03); ax.set_ylim(-1.03,1.03); ax.set_zlim(0,1.1); ax.set_axis_off(); ax.set_proj_type('ortho'); ax.set_title('Deformed petals on the fixed sphere',fontsize=14)
a.set_aspect('equal'); a.set_xlim(-1.2,1.2); a.set_ylim(-1.2,1.2); a.axis('off'); a.set_title('Top view • anchors remain fixed',fontsize=14)
th=np.linspace(0,p/2,200); side.plot(np.sin(th),np.cos(th),color='#9aafbe',lw=2)
for lo,hi,col in [(0,50,'#df8a36'),(50,80,'#006bb8'),(80,90,'#47a58d')]:
 th=np.linspace(lo,hi,100)*rad; side.plot(np.sin(th),np.cos(th),color=col,lw=4)
for xyz,s in [(np.array([0,0,1]),'Old N'),(n,'N'),(m,'M'),(np.array([1,0,0]),'Equator')]:
 x,y,z=xyz; side.scatter(x,z,color='#102e43',s=24,zorder=5); side.annotate(s,(x,z),xytext=(8,6),textcoords='offset points',fontsize=12,weight='bold')
side.plot([0,1],[0,0],color='#9aafbe',lw=1); side.plot([0,0],[0,1],color='#9aafbe',lw=1)
side.text(.05,.69,'N moves 50°',color='#b36a20',fontsize=12)
side.text(.06,.43,'N–M stays 30°',color='#006bb8',fontsize=12)
side.text(.12,.15,'M is 10° above\nthe equator',color='#27856d',fontsize=11)
side.set_aspect('equal'); side.set_xlim(-.05,1.39); side.set_ylim(-.05,1.15); side.axis('off'); side.set_title('Motion along the central meridian',fontsize=13)
fig.suptitle('Shifted shield • N moves toward M; all twelve anchors stay fixed',fontsize=20,y=.94)
fig.text(.5,.115,'N is now the moving junction, not the geographic north pole. The sphere itself does not rotate.',ha='center',fontsize=12,color='#244e69')
fig.text(.5,.065,'Deformation rule: each arch midpoint stays 30° from N; side edges follow great-circle arcs to their original anchors.',ha='center',fontsize=11,color='#466d85')
fig.subplots_adjust(top=.83,bottom=.19,left=.02,right=.97,wspace=.12)
fig.savefig(str(OUTPUT / 'shield_shifted_petals.png'),dpi=180)
print('Verified: unit sphere, 12 fixed equatorial anchors, N–M = 30°, M elevation = 10°.')
