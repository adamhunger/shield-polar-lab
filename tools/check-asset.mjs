import assert from 'node:assert/strict';
import {ShieldController} from '../dist/asset/controller.mjs';
import {exportGLB} from '../dist/asset/glb.mjs';
const s=new ShieldController({segments:12,rings:6}),buffer=s.positions,indices=s.indices;
const near=(a,b)=>assert(Math.abs(a-b)<2e-6,`${a} != ${b}`);
for(const theta of [0,25,50])for(const phi of [0,14.99,15.01,179,359.99])for(const separation of [5,30])for(const influence of [.25,4]){
 s.setParameters({theta,phi,separation,influence});assert.equal(s.positions,buffer);assert.equal(s.indices,indices);
 for(let i=0;i<buffer.length;i+=3)near(Math.hypot(...buffer.subarray(i,i+3)),1);
 for(let k=0;k<12;k++){const i=3*(k*s.count+1+(s.rings-1)*(s.segments+1)),a=(k*30-15)*Math.PI/180;near(buffer[i],Math.cos(a));near(buffer[i+1],Math.sin(a));near(buffer[i+2],0);}
 const old=buffer.slice();s.setParameters({phi:phi+30});const c=Math.cos(Math.PI/6),t=Math.sin(Math.PI/6);
 for(let k=0;k<12;k++)for(let v=0;v<s.count;v++){const a=3*(k*s.count+v),b=3*(((k+1)%12)*s.count+v);near(buffer[b],c*old[a]-t*old[a+1]);near(buffer[b+1],t*old[a]+c*old[a+1]);near(buffer[b+2],old[a+2]);}
}
assert.throws(()=>s.setDirection([0,0,0]));assert.throws(()=>s.setDirection([NaN,0,1]));s.setDirection([1,0,-1]);near(s.theta,50);
// Topology has no degenerate apex triangles; winding is outward.
for(let i=0;i<indices.length;i+=3){const a=Array.from(buffer.subarray(indices[i]*3,indices[i]*3+3)),b=Array.from(buffer.subarray(indices[i+1]*3,indices[i+1]*3+3)),c=Array.from(buffer.subarray(indices[i+2]*3,indices[i+2]*3+3)),u=b.map((x,j)=>x-a[j]),v=c.map((x,j)=>x-a[j]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert(cross.reduce((r,x,j)=>r+x*a[j],0)>0);}
const glb=exportGLB(s),dv=new DataView(glb);assert.equal(dv.getUint32(0,true),0x46546c67);assert.equal(dv.getUint32(8,true),glb.byteLength);const jl=dv.getUint32(12,true),doc=JSON.parse(new TextDecoder().decode(new Uint8Array(glb,20,jl)));assert.equal(doc.nodes.length,15);assert.equal(doc.accessors[0].count,s.positions.length/3);for(const view of doc.bufferViews){assert.equal(view.byteOffset%4,0);assert(view.byteOffset+view.byteLength<=doc.buffers[0].byteLength);}
console.log('Asset checks pass: fixed stations, stable buffers, 30° equivariance, sphere radius, input limits, outward nondegenerate triangles, GLB structure.');
