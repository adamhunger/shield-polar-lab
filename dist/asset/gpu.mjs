// WebGPU port of skin.mjs: same local-position pearlescent colour, plus GPU grid lines.
const WGSL=`struct U { matrix: mat4x4f, eye: vec3f, showNormals: u32, junction: vec3f };
@group(0) @binding(0) var<uniform> u: U;
struct Out { @invariant @builtin(position) p: vec4f, @location(0) local: vec3f };
@vertex fn vs(@location(0) position: vec3f) -> Out { var o: Out; o.local=position; o.p=u.matrix*vec4f(position,1.0); return o; }
fn hash(p: vec3f) -> f32 { return fract(sin(dot(p,vec3f(127.1,311.7,74.7)))*43758.5453); }
fn noise(p: vec3f) -> f32 { let i=floor(p); var f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(hash(i),hash(i+vec3f(1,0,0)),f.x),mix(hash(i+vec3f(0,1,0)),hash(i+vec3f(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3f(0,0,1)),hash(i+vec3f(1,0,1)),f.x),mix(hash(i+vec3f(0,1,1)),hash(i+vec3f(1,1,1)),f.x),f.y),f.z); }
@fragment fn fs(i: Out, @builtin(front_facing) front: bool) -> @location(0) vec4f {
 let n=normalize(i.local);let m=noise(n*3.5+vec3f(7.3,2.1,9.7));let fine=noise(n*10.3);
 if(u.showNormals!=0u){return vec4f(n*.5+.5,1.0);}
 let shadingNormal=select(-n,n,front);
 let facing=clamp(dot(shadingNormal,normalize(u.eye)),0.0,1.0);let pearl=pow(1.0-facing,2.5);
 let glow=exp(-24.0*(1.0-dot(n,normalize(u.junction))));
 let blue=vec3f(.27,.43,.48);let violet=vec3f(.38,.39,.49);
 var skin=mix(blue,violet,smoothstep(.3,.75,m)*.48);
 skin+=(m-.5)*.045+(fine-.5)*.012;
 skin+=pearl*vec3f(.09,.14,.15)+glow*vec3f(.08,.17,.18);
 let light=.82+.18*max(0.0,dot(shadingNormal,normalize(vec3f(-.3,-.4,1.0))));
 let a=.55+.12*pearl+.06*glow;
 return vec4f(skin*light*a,a);
}
// Grid colour #2f91b780, premultiplied for the canvas.
@fragment fn fsLine() -> @location(0) vec4f { return vec4f(vec3f(47,145,183)/255.0*.5,.5); }`;
export async function createGPUSkinRenderer(overlay){
 if(!navigator.gpu)return null;
 const adapter=await navigator.gpu.requestAdapter();if(!adapter)return null;
 const device=await adapter.requestDevice(),format=navigator.gpu.getPreferredCanvasFormat(),samples=4;
 device.pushErrorScope('validation');
 const module=device.createShaderModule({code:WGSL});
 const bgl=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}}]});
 const layout=device.createPipelineLayout({bindGroupLayouts:[bgl]});
 const base={layout,vertex:{module,entryPoint:'vs',buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:'float32x3'}]}]},multisample:{count:samples},primitive:{topology:'triangle-list',cullMode:'none'}};
 // Depth prepass selects the nearest layer. One translucent layer avoids seam overdraw.
 const prepass=device.createRenderPipeline({...base,fragment:{module,entryPoint:'fs',targets:[{format,writeMask:0}]},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
 const surface=device.createRenderPipeline({...base,fragment:{module,entryPoint:'fs',targets:[{format}]},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'equal'}});
 const grid=device.createRenderPipeline({...base,primitive:{topology:'line-list'},fragment:{module,entryPoint:'fsLine',targets:[{format}]},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'always'}});
 const error=await device.popErrorScope();if(error){device.destroy();throw Error(error.message);}
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
 const wrap=document.createElement('div');wrap.style.cssText='position:relative';overlay.before(wrap);wrap.append(canvas,overlay);overlay.style.position='relative';overlay.style.display='block';
 const context=canvas.getContext('webgpu');context.configure({device,format,alphaMode:'premultiplied'});
 const uniform=device.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),data=new ArrayBuffer(96),floats=new Float32Array(data),flags=new Uint32Array(data);
 const bind=device.createBindGroup({layout:bgl,entries:[{binding:0,resource:{buffer:uniform}}]});
 let vertices,indices,lines,oldIndices,msaa,depth;
 const buffer=(old,bytes,usage)=>{if(old&&old.size>=bytes)return old;old?.destroy();return device.createBuffer({size:Math.max(4,Math.ceil(bytes/4)*4),usage:usage|GPUBufferUsage.COPY_DST});};
 return {kind:'WebGPU',gridLines:true,lost:device.lost,setVisible(visible){canvas.hidden=!visible;},draw(mesh,camera,w,h,normalView=false,wire=false){
  if(canvas.width!==w||canvas.height!==h||!msaa){canvas.width=w;canvas.height=h;msaa?.destroy();depth?.destroy();
   msaa=device.createTexture({size:[w,h],format,sampleCount:samples,usage:GPUTextureUsage.RENDER_ATTACHMENT});
   depth=device.createTexture({size:[w,h],format:'depth24plus',sampleCount:samples,usage:GPUTextureUsage.RENDER_ATTACHMENT});}
  vertices=buffer(vertices,mesh.positions.byteLength,GPUBufferUsage.VERTEX);device.queue.writeBuffer(vertices,0,mesh.positions);
  if(oldIndices!==mesh.indices){const t=mesh.indices,l=new Uint32Array(t.length*2);
   // Each triangle contributes its three edges; shared edges overlap without blending.
   for(let i=0,j=0;i<t.length;i+=3){l[j++]=t[i];l[j++]=t[i+1];l[j++]=t[i+1];l[j++]=t[i+2];l[j++]=t[i+2];l[j++]=t[i];}
   indices=buffer(indices,t.byteLength,GPUBufferUsage.INDEX);device.queue.writeBuffer(indices,0,t);
   lines=buffer(lines,l.byteLength,GPUBufferUsage.INDEX);device.queue.writeBuffer(lines,0,l);lines.count=l.length;oldIndices=t;}
  floats.set(camera.matrix,0);floats.set(camera.eye,16);flags[19]=normalView?1:0;floats.set(mesh.N,20);device.queue.writeBuffer(uniform,0,data);
  const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({
   colorAttachments:[{view:msaa.createView(),resolveTarget:context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:'clear',storeOp:'discard'}],
   depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'discard'}});
  pass.setBindGroup(0,bind);pass.setVertexBuffer(0,vertices);
  if(wire){pass.setPipeline(grid);pass.setIndexBuffer(lines,'uint32');pass.drawIndexed(lines.count);}
  else{pass.setIndexBuffer(indices,'uint32');pass.setPipeline(prepass);pass.drawIndexed(mesh.indices.length);pass.setPipeline(surface);pass.drawIndexed(mesh.indices.length);}
  pass.end();device.queue.submit([encoder.finish()]);
 }};
}
