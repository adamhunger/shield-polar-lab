// Local-position procedural colour: no UV atlas, texture tiles or petal IDs.
export function createSkinRenderer(overlay){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
 const wrap=document.createElement('div');wrap.style.cssText='position:relative';overlay.before(wrap);wrap.append(canvas,overlay);overlay.style.position='relative';overlay.style.display='block';
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(!gl){canvas.remove();return null;}
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`#version 300 es
 in vec3 position;uniform mat4 matrix;out vec3 local;
 void main(){local=position;gl_Position=matrix*vec4(position,1.);}`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;in vec3 local;out vec4 color;uniform vec3 eye;uniform vec3 junction;uniform bool showNormals;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){
 vec3 n=normalize(local);float m=noise(n*3.5+vec3(7.3,2.1,9.7));float fine=noise(n*10.3);
 if(showNormals){color=vec4(n*.5+.5,1.);return;}
 vec3 shadingNormal=gl_FrontFacing?n:-n;
 float facing=clamp(dot(shadingNormal,normalize(eye)),0.,1.);float pearl=pow(1.-facing,2.5);
 float glow=exp(-24.*(1.-dot(n,normalize(junction))));
 vec3 blue=vec3(.27,.43,.48),violet=vec3(.38,.39,.49);
 vec3 skin=mix(blue,violet,smoothstep(.3,.75,m)*.48);
 skin+=(m-.5)*.045+(fine-.5)*.012;
 skin+=pearl*vec3(.09,.14,.15)+glow*vec3(.08,.17,.18);
 float light=.82+.18*max(0.,dot(shadingNormal,normalize(vec3(-.3,-.4,1.))));
 color=vec4(skin*light,.55+.12*pearl+.06*glow);
 }`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const vertices=gl.createBuffer(),indices=gl.createBuffer(),location=gl.getAttribLocation(program,'position');
 const matrix=gl.getUniformLocation(program,'matrix'),eye=gl.getUniformLocation(program,'eye'),junction=gl.getUniformLocation(program,'junction');
 const showNormals=gl.getUniformLocation(program,'showNormals');
 let oldPositions,oldIndices;
 return {setVisible(visible){canvas.hidden=!visible;},draw(mesh,camera,w,h,normalView=false){
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
  if(oldPositions!==mesh.positions){gl.bufferData(gl.ARRAY_BUFFER,mesh.positions,gl.DYNAMIC_DRAW);oldPositions=mesh.positions;}else gl.bufferSubData(gl.ARRAY_BUFFER,0,mesh.positions);
  gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);if(oldIndices!==mesh.indices){gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);oldIndices=mesh.indices;}
  gl.uniform1i(showNormals,normalView?1:0);gl.uniformMatrix4fv(matrix,false,camera.matrix);gl.uniform3fv(eye,camera.eye);gl.uniform3fv(junction,mesh.N);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.BLEND);
  // Depth prepass selects the nearest layer. One translucent layer avoids seam overdraw.
  gl.colorMask(false,false,false,false);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_INT,0);
  gl.colorMask(true,true,true,true);gl.depthFunc(gl.EQUAL);gl.depthMask(false);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_INT,0);gl.depthMask(true);
 }};
}
