import {createSkinRenderer} from './skin.mjs';
import {ShieldController} from './controller.mjs';
import {measureError,fitTolerance} from './error.mjs';
import {exportGLB} from './glb.mjs';
import {camera,junction} from '../geometry.mjs';
const $=id=>document.getElementById(id);let shield=new ShieldController({segments:24,rings:12});const canvas=$('view'),ctx=canvas.getContext('2d');let errorMode=false,errorResult=null,errorAt=-Infinity;let frameSamples=[],fpsText='Measuring…';document.addEventListener('visibilitychange',()=>{frameSamples=[];last=0;});let yaw=25,pitch=30,paused=false,elapsed=0,last=0,drag;
for(const key of ['theta','phi','separation','influence'])$(key).oninput=()=>{if(key==='theta'||key==='phi')$('mode').value='manual';shield.setParameters({[key]:Number($(key).value)});};
$('meshToggle').onclick=()=>{errorMode=false;errorResult=null;frameSamples=[];fpsText='Measuring…';last=0;const meshMode=shield.meshMode==='uniform'?'adaptive':'uniform';shield=new ShieldController({...shield.settings,segments:24,rings:12,meshMode}).setParameters(shield.settings);$('meshToggle').textContent=meshMode==='uniform'?'Use Adaptive mesh':'Use Uniform mesh';$('meshToggle').setAttribute('aria-pressed',meshMode==='adaptive');};
function fit(){const r=fitTolerance(shield.settings,Number($('tolerance').value));shield=r.mesh;errorResult=r.error;errorMode=true;errorAt=-Infinity;frameSamples=[];last=0;$('meshToggle').textContent='Restore Uniform mesh';$('meshToggle').setAttribute('aria-pressed','true');}
$('fit').onclick=fit;
$('tolerance').oninput=()=>{$('toleranceOut').textContent=Number($('tolerance').value).toFixed(2)+'% R';};
$('tolerance').onchange=fit;
$('wireframe').onchange=()=>{wire=$('wireframe').checked;normalsButton.disabled=wire||!skin;};
let wire=false,normalView=false;const normalsButton=document.createElement('button');normalsButton.textContent='Show surface normals';normalsButton.setAttribute('aria-pressed','false');$('wireframe').parentElement.after(normalsButton);normalsButton.onclick=()=>{normalView=!normalView;normalsButton.setAttribute('aria-pressed',normalView);normalsButton.textContent=normalView?'Show skin material':'Show surface normals';};
let skin;try{skin=createSkinRenderer(canvas);}catch(e){console.warn('Skin renderer unavailable',e);}if(!skin){normalsButton.disabled=true;normalsButton.textContent='Normal view requires GPU';}
$('rotate').onclick=()=>{$('mode').value='manual';shield.setParameters({phi:shield.phi+30});};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume motion':'Pause motion';};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([exportGLB(shield)],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download='shield.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(drag){yaw-=(e.clientX-drag[0])*.4;pitch=Math.max(5,Math.min(85,pitch+(e.clientY-drag[1])*.4));drag=[e.clientX,e.clientY];}};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
function frame(time){if(last&&!document.hidden){frameSamples.push(time-last);if(frameSamples.length>60)frameSamples.shift();const mean=frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length;fpsText=frameSamples.length>=10?((1000/mean).toFixed(1)+' FPS · '+mean.toFixed(1)+' ms/frame'):'Measuring…';}const dt=last?Math.min((time-last)/1000,.1):0;last=time;if(!paused)elapsed+=dt;const start=performance.now();
 if(!paused&&$('mode').value!=='manual'){const wedge=$('mode').value==='wedge';shield.setDirection(junction(30+20*Math.sin(elapsed*.4)**2,wedge?15*Math.sin(elapsed*.5):elapsed*14));}
 const ms=performance.now()-start;
 if(time-errorAt>750){errorResult=measureError(shield);errorAt=time;}
 $('errorReadout').textContent=errorResult?'Sampled surface: '+errorResult.surface.toFixed(3)+'% R · boundary: '+errorResult.boundary.toFixed(3)+'% R'+(errorMode?(errorResult.max<=Number($('tolerance').value)?' · target met at current pose':' · target exceeded — refit'):''):'';
 for(const key of ['theta','phi','separation','influence']){$(key).value=shield[key];$(key+'Out').textContent=shield[key].toFixed(2)+(key==='influence'?'×':'°');}
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);const cam=camera(yaw,pitch,w/h,1),project=p=>cam.project(p,w,h),p=shield.positions;
 ctx.strokeStyle='#2f91b780';ctx.lineWidth=.6*dpr;
 const faces=[];
 for(let i=0;i<shield.indices.length;i+=3){const points=[];let depth=0;for(let j=0;j<3;j++){const n=shield.indices[i+j]*3,q=project(p.subarray(n,n+3));points.push(q);depth+=q[2];}faces.push({points,depth});}
 faces.sort((a,b)=>b.depth-a.depth);
 ctx.beginPath();for(const face of faces){face.points.forEach((q,j)=>j?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();}if(skin){skin.setVisible(!wire);if(!wire)skin.draw(shield,cam,w,h,normalView);}else if(!wire){ctx.fillStyle='rgba(85,128,145,.55)';ctx.fill();}if(wire)ctx.stroke();

 function dot(point,text,color){const q=project(point);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],4*dpr,0,Math.PI*2);ctx.fill();ctx.font=`${12*dpr}px system-ui`;ctx.fillText(text,q[0]+7*dpr,q[1]-7*dpr);}
 for(let k=0;k<12;k++){const a=(k*30-15)*Math.PI/180;dot([Math.cos(a),Math.sin(a),0],String(k+1),'#f0cd83');}dot(shield.N,'N','#ff985b');
 $('stats').textContent=`${fpsText} · estimate over last ${frameSamples.length} frames\n ${errorMode?'ERROR-CONTROLLED':shield.meshMode.toUpperCase()} · ${(100*(1-shield.indices.length/3/6624)).toFixed(1)}% fewer triangles\n${shield.positions.length/3} vertices · ${shield.indices.length/3} triangles · reusable buffers\nSector ${shield.sector.index+1} · local azimuth ${shield.sector.localDegrees.toFixed(2)}° · CPU geometry ${ms.toFixed(2)} ms\n ${skin?'GPU pearlescent skin':'Plain Canvas fallback'} · local Z-up · GLB root converts to Y-up`;
 requestAnimationFrame(frame);
}requestAnimationFrame(frame);
// Integration entry point: pass a direction from your game's targeting calculation.
window.shieldAsset={get controller(){return shield;},setDirection(direction){$('mode').value='manual';shield.setDirection(direction);},exportGLB:()=>exportGLB(shield)};
