import {point,junction,RAD} from '../geometry.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class ShieldController {
  constructor({radius=1,segments=32,rings=16,meshMode="uniform"}={}) {
    if(!Number.isFinite(radius)||radius<=0||!Number.isInteger(segments)||segments<4||segments>128||!Number.isInteger(rings)||rings<2||rings>128)throw Error('Invalid radius or tessellation');
    Object.assign(this,{radius,segments,rings,theta:50,phi:0,influence:1,separation:30});
    if(!['uniform','adaptive'].includes(meshMode))throw Error('Invalid mesh mode');
    this.meshMode=meshMode;
    // Even counts preserve u=0; keep the entire original outer boundary.
    this.rowSegments=Array.from({length:rings},(_,j)=>meshMode==='uniform'||j===rings-1?segments:Math.min(segments,Math.max(2,2*Math.ceil(segments*(j+1)/rings/2))));
    this.count=1+this.rowSegments.reduce((n,m)=>n+m+1,0);
    this.positions=new Float32Array(12*this.count*3);this.normals=new Float32Array(this.positions.length);
    this.parameters=new Float32Array(this.positions.length);const indices=[];
    for(let k=0;k<12;k++){
      const base=k*this.count;this.parameters.set([0,0,k],base*3);
      let offset=base+1,previous=base,prevCount=0;
      for(let j=1;j<=rings;j++){
        const m=this.rowSegments[j-1];
        for(let i=0;i<=m;i++)this.parameters.set([-1+2*i/m,j/rings,k],3*(offset+i));
        if(j===1){for(let i=0;i<m;i++)indices.push(base,offset+i,offset+i+1);}
        else {
          // Zipper triangulation connects rows with different sample counts.
          let a=0,b=0;
          while(a<prevCount||b<m){
            if(a<prevCount&&(b===m||(a+1)/prevCount<=(b+1)/m)){
              indices.push(previous+a,offset+b,previous+a+1);a++;
            }else{indices.push(previous+a,offset+b,offset+b+1);b++;}
          }
        }
        previous=offset;prevCount=m;offset+=m+1;
      }
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
  get settings(){return {meshMode:this.meshMode,radius:this.radius,segments:this.segments,rings:this.rings,theta:this.theta,phi:this.phi,influence:this.influence,separation:this.separation};}
  get sector(){return {index:Math.floor((this.phi+15)%360/30),localDegrees:((this.phi+15)%30)-15};}
}
