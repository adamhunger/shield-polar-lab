// glTF 2.0 snapshot with explicit procedural vertex coordinates and controller recipe.
export function exportGLB(shield){
 const chunks=[],views=[],accessors=[];let offset=0;
 function accessor(array,type,componentType,target,bounds=false){
  const bytes=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);chunks.push({offset,bytes});
  const view=views.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target})-1;offset+=(bytes.length+3)&~3;
  const width={SCALAR:1,VEC3:3}[type],a={bufferView:view,componentType,count:array.length/width,type};
  if(bounds){a.min=Array(width).fill(Infinity);a.max=Array(width).fill(-Infinity);for(let i=0;i<array.length;i++){const c=i%width;a.min[c]=Math.min(a.min[c],array[i]);a.max[c]=Math.max(a.max[c],array[i]);}}
  return accessors.push(a)-1;
 }
 const position=accessor(shield.positions,'VEC3',5126,34962,true),normal=accessor(shield.normals,'VEC3',5126,34962),param=accessor(shield.parameters,'VEC3',5126,34962),index=accessor(shield.indices,'SCALAR',5125,34963);
 const nodes=[{name:'Shield (Z-up local)',rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2],children:[1,2,...Array.from({length:12},(_,i)=>i+3)],extras:{shield:{version:1,...shield.settings,parameterAttribute:'_SHIELD_UVK',controller:'controller.mjs',coordinateSystem:'local Z-up; root converts to glTF Y-up'}}},{name:'Petal surface',mesh:0},{name:'N',translation:shield.N}];
 for(let k=0;k<12;k++){const a=(k*30-15)*Math.PI/180;nodes.push({name:`Ground station ${k+1}`,translation:[shield.radius*Math.cos(a),shield.radius*Math.sin(a),0]});}
 const doc={asset:{version:'2.0',generator:'Shield Polar Lab'},scene:0,scenes:[{nodes:[0]}],nodes,meshes:[{name:'Twelve procedural petals',primitives:[{attributes:{POSITION:position,NORMAL:normal,_SHIELD_UVK:param},indices:index,material:0}]}],materials:[{name:'Shield blue',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[.12,.58,.85,1],metallicFactor:0,roughnessFactor:.5}}],buffers:[{byteLength:offset}],bufferViews:views,accessors};
 const json=new TextEncoder().encode(JSON.stringify(doc)),jl=(json.length+3)&~3,buffer=new ArrayBuffer(12+8+jl+8+offset),dv=new DataView(buffer),bytes=new Uint8Array(buffer);
 dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,buffer.byteLength,true);dv.setUint32(12,jl,true);dv.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+jl);bytes.set(json,20);dv.setUint32(20+jl,offset,true);dv.setUint32(24+jl,0x004e4942,true);for(const chunk of chunks)bytes.set(chunk.bytes,28+jl+chunk.offset);return buffer;
}
