import {point,junction,RAD} from '../geometry.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class ShieldController {
  constructor({radius=1,segments=32,rings=16}={}) {
    if(!Number.isFinite(radius)||radius<=0||!Number.isInteger(segments)||segments<4||segments>128||!Number.isInteger(rings)||rings<2||rings>128)throw Error('Invalid radius or tessellation');
    Object.assign(this,{radius,segments,rings,theta:50,phi:0,influence:1,separation:30});
    this.count=1+rings*(segments+1);
    this.positions=new Float32Array(12*this.count*3);this.normals=new Float32Array(this.positions.length);
    this.parameters=new Float32Array(this.positions.length);const indices=[];
    for(let k=0;k<12;k++){
      const base=k*this.count;this.parameters.set([0,0,k],base*3);
      for(let j=1;j<=rings;j++)for(let i=0;i<=segments;i++)this.parameters.set([-1+2*i/segments,j/rings,k],3*(base+1+(j-1)*(segments+1)+i));
      for(let i=0;i<segments;i++)indices.push(base,base+1+i,base+2+i);
      for(let j=1;j<rings;j++)for(let i=0;i<segments;i++){const a=base+1+(j-1)*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
    }
    this.indices=new Uint32Array(indices);this.update();
  }
  setParameters({theta=this.theta,phi=this.phi,influence=this.influence,separation=this.separation}={}){
    if(![theta,phi,influence,separation].every(Number.isFinite))throw Error('Parameters must be finite');
    Object.assign(this,{theta:clamp(theta,0,50),phi:((phi%360)+360)%360,influence:clamp(influence,.25,4),separation:clamp(separation,5,30)});return this.update();
  }
  // Local Z-up direction from the dome centre, not an incoming velocity vector.
  setDirection(direction){
    if(!direction||direction.length!==3||!Array.from(direction).every(Number.isFinite))throw Error('Expected finite XYZ direction');
    const [x,y,z]=direction,l=Math.hypot(x,y,z);if(l<1e-12)throw Error('Direction must be nonzero');
    return this.setParameters({theta:Math.acos(clamp(z/l,-1,1))/RAD,phi:Math.hypot(x,y)>1e-12?Math.atan2(y,x)/RAD:this.phi});
  }
  update(){
    const n=junction(this.theta,this.phi);this.N=n.map(x=>x*this.radius);
    for(let i=0;i<this.positions.length;i+=3){const [u,v,k]=this.parameters.subarray(i,i+3),p=point(n,u,v,k,this.influence,this.separation);for(let c=0;c<3;c++){this.positions[i+c]=p[c]*this.radius;this.normals[i+c]=p[c];}}
    return this;
  }
  get settings(){return {radius:this.radius,segments:this.segments,rings:this.rings,theta:this.theta,phi:this.phi,influence:this.influence,separation:this.separation};}
  get sector(){return {index:Math.floor((this.phi+15)%360/30),localDegrees:((this.phi+15)%30)-15};}
}
