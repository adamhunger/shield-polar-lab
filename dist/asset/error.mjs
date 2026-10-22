import {point,junction} from '../geometry.mjs';
import {ShieldController} from './controller.mjs';
// Fixed barycentric samples: three edge midpoints, centroid, and three interior points.
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),sub=(a,b)=>a.map((x,i)=>x-b[i]);
function distanceTriangle(p,a,b,c){
 const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],nn=dot(n,n);
 const d00=dot(ab,ab),d01=dot(ab,ac),d11=dot(ac,ac),d20=dot(ap,ab),d21=dot(ap,ac),den=d00*d11-d01*d01;
 if(den>1e-24){const v=(d11*d20-d01*d21)/den,w=(d00*d21-d01*d20)/den;if(v>=0&&w>=0&&v+w<=1)return Math.abs(dot(ap,n))/Math.sqrt(nn);}
 return Math.min(...[[a,b],[b,c],[c,a]].map(([x,y])=>{const e=sub(y,x),t=Math.max(0,Math.min(1,dot(sub(p,x),e)/Math.max(dot(e,e),1e-30)));return Math.hypot(...p.map((z,i)=>z-x[i]-t*e[i]));}));
}
const samples=[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6]];
export function measureError(mesh){
 const n=junction(mesh.theta,mesh.phi);let surface=0,boundary=0;
 const p=mesh.positions,uv=mesh.parameters;
 for(let i=0;i<mesh.indices.length;i+=3){
  const ids=Array.from(mesh.indices.subarray(i,i+3),x=>3*x);
  for(const weights of samples){
   let u=0,v=0;const linear=[0,0,0];
   for(let j=0;j<3;j++){u+=weights[j]*uv[ids[j]];v+=weights[j]*uv[ids[j]+1];for(let c=0;c<3;c++)linear[c]+=weights[j]*p[ids[j]+c];}
   const exact=point(n,u,v,uv[ids[0]+2],mesh.influence,mesh.separation);
   surface=Math.max(surface,distanceTriangle(exact,...ids.map(id=>Array.from(p.subarray(id,id+3),x=>x/mesh.radius))));
  }
 }
 // All three boundary chains; dense samples on each straight segment.
 for(let k=0;k<12;k++){
  const chains=[[],[],[]];let offset=k*mesh.count+1;
  chains[0].push(k*mesh.count);chains[1].push(k*mesh.count);
  for(const m of mesh.rowSegments){chains[0].push(offset);chains[1].push(offset+m);offset+=m+1;}
  for(let i=0;i<=mesh.segments;i++)chains[2].push((k+1)*mesh.count-mesh.segments-1+i);
  for(let ci=0;ci<3;ci++)for(let j=1;j<chains[ci].length;j++){
   const a=chains[ci][j-1]*3,b=chains[ci][j]*3;
   for(const t of [.25,.5,.75]){
    // Apex's u is immaterial physically, but fix u along the side meridian.
    const u=ci<2?(ci===0?-1:1):(1-t)*uv[a]+t*uv[b],v=(1-t)*uv[a+1]+t*uv[b+1];
    const exact=point(n,u,v,k,mesh.influence,mesh.separation);
    boundary=Math.max(boundary,Math.hypot(...exact.map((x,c)=>x-((1-t)*p[a+c]+t*p[b+c])/mesh.radius)));
   }
  }
 }
 return {surface:surface*100,boundary:boundary*100,max:Math.max(surface,boundary)*100};
}
export const levels=[[4,2],[6,3],[8,4],[12,6],[16,8],[24,12],[32,16],[48,24]];
export function fitTolerance(settings,tolerance){
 if(!Number.isFinite(tolerance)||tolerance<=0)throw Error('Tolerance must be positive');
 let mesh,error;
 for(const [segments,rings] of levels){
  mesh=new ShieldController({...settings,segments,rings,meshMode:'adaptive'}).setParameters(settings);
  error=measureError(mesh);if(error.max<=tolerance)break;
 }
 return {mesh,error,met:error.max<=tolerance};
}
