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

// Graded topology retains the exact original boundary and seams in every pose.
for(const theta of [0,25,50])for(const phi of [0,15,359.99])for(const separation of [5,30])for(const influence of [.25,4]){
 const options={segments:24,rings:12},a=new ShieldController({...options,meshMode:'adaptive'}).setParameters({theta,phi,separation,influence}),u=new ShieldController(options).setParameters({theta,phi,separation,influence});
 assert(a.indices.length<u.indices.length);
 const original=a.positions,old=a.positions.slice();
 for(let k=0;k<12;k++){
  for(let i=0;i<=24;i++)for(let c=0;c<3;c++)near(a.positions[3*((k+1)*a.count-25+i)+c],u.positions[3*((k+1)*u.count-25+i)+c]);
  let start=k*a.count+1,next=((k+1)%12)*a.count+1;
  for(const m of a.rowSegments){for(let c=0;c<3;c++)near(a.positions[3*(start+m)+c],a.positions[3*next+c]);start+=m+1;next+=m+1;}
 }
 for(let i=0;i<a.positions.length;i+=3){near(Math.hypot(...a.positions.subarray(i,i+3)),1);assert(a.positions[i+2]>=-1e-6);}
 for(let i=0;i<a.indices.length;i+=3){
  const p=Array.from(a.positions.subarray(a.indices[i]*3,a.indices[i]*3+3)),q=Array.from(a.positions.subarray(a.indices[i+1]*3,a.indices[i+1]*3+3)),r=Array.from(a.positions.subarray(a.indices[i+2]*3,a.indices[i+2]*3+3)),b=q.map((x,j)=>x-p[j]),c=r.map((x,j)=>x-p[j]);
  assert((b[1]*c[2]-b[2]*c[1])*p[0]+(b[2]*c[0]-b[0]*c[2])*p[1]+(b[0]*c[1]-b[1]*c[0])*p[2]>0);
 }
 a.setParameters({phi:phi+30});assert.equal(original,a.positions);
 for(let k=0;k<12;k++)for(let v=0;v<a.count;v++){const i=3*(k*a.count+v),j=3*(((k+1)%12)*a.count+v);near(a.positions[j],Math.cos(Math.PI/6)*old[i]-.5*old[i+1]);near(a.positions[j+1],.5*old[i]+Math.cos(Math.PI/6)*old[i+1]);near(a.positions[j+2],old[i+2]);}
}
console.log('Adaptive topology: boundary, seams, winding, sphere and rotational equivalence verified.');

const {fitTolerance,measureError}=await import('../dist/asset/error.mjs');
const settings={theta:50,phi:0,separation:30,influence:1};
const loose=fitTolerance(settings,8),tight=fitTolerance(settings,2),unmet=fitTolerance(settings,.000001);
assert(loose.met&&tight.met);assert(loose.mesh.indices.length<tight.mesh.indices.length);
assert(loose.error.max<=8&&tight.error.max<=2);assert(!unmet.met);
assert.equal(tight.mesh.theta,50);assert.equal(tight.mesh.separation,30);
assert.deepEqual(measureError(tight.mesh),tight.error);
assert.throws(()=>fitTolerance(settings,0));
console.log('Tolerance selection, measured errors and unmet-target reporting verified.');
