import assert from 'node:assert/strict';
import {RAD,point,junction,dot,norm} from './dist/geometry.mjs';
let count=0;for(const theta of [0,12.5,25,49.9,50])for(const phi of [0,15,45,90,135,180,270,359.9]){const n=junction(theta,phi);for(let k=0;k<12;k++){for(const u of [-1,-.75,0,.25,1])for(const v of [0,.25,.5,1]){const p=point(n,u,v,k);assert(Math.abs(norm(p)-1)<1e-12);assert(p[2]>-1e-12);if(v===0)assert(norm(p.map((x,i)=>x-n[i]))<1e-12);count++;}for(const u of [-1,1]){const p=point(n,u,1,k),f=k*Math.PI/6+u*Math.PI/12;assert(norm(p.map((x,i)=>x-[Math.cos(f),Math.sin(f),0][i]))<1e-12);}const m=point(n,0,1,k);assert(Math.abs(Math.acos(dot(n,m))/RAD-30)<1e-10);assert(Math.asin(m[2])/RAD>=10-1e-10);for(const v of [0,.5,1]){const a=point(n,1,v,k),b=point(n,-1,v,(k+1)%12);assert(norm(a.map((x,i)=>x-b[i]))<1e-12);}}}
const n=junction(50,0),m=point(n,0,1,0);assert(Math.abs(Math.asin(m[2])/RAD-10)<1e-10);console.log(`Passed ${count} surface samples, fixed anchors, shared seams, midpoint distances, and limit pose.`);


// Shared controls preserve sphere, anchors, seams, and equal midpoint distance.
for (const theta of [0,25,50]) for (const phi of [0,90,180]) {
 const n=junction(theta,phi);
 for(const separation of [5,17.5,30]) for(const weight of [.25,1,4]) {
  for(let k=0;k<12;k++) {
   const m=point(n,0,1,k,weight,separation);
   assert(Math.abs(Math.acos(dot(n,m))/RAD-separation)<1e-10);
   assert(Math.asin(m[2])/RAD>=10-1e-10);
   for(const u of [-1,-.7,0,.7,1]) for(const v of [0,.5,1]) {
    const p=point(n,u,v,k,weight,separation);
    assert(Math.abs(norm(p)-1)<1e-12 && p[2]>-1e-12);
    if(Math.abs(u)===1) assert(norm(p.map((x,i)=>x-point(n,u,v,k)[i]))<1e-12);
   }
   for(const v of [0,.5,1]) {
    const a=point(n,1,v,k,weight,separation),b=point(n,-1,v,(k+1)%12,weight,separation);
    assert(norm(a.map((x,i)=>x-b[i]))<1e-12);
   }
   const distances=[.25,1,4].map(w=>Math.acos(dot(n,point(n,.5,1,k,w,separation))));
   assert(distances[0]>distances[1] && distances[1]>distances[2]);
  }
 }
}
console.log('Shared influence and 5–30 degree separation verified for all 12 petals.');
