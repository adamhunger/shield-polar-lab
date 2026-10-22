import {ShieldController} from './controller.mjs';
import {exportGLB} from './glb.mjs';
import {camera,junction} from '../geometry.mjs';
const $=id=>document.getElementById(id);let shield=new ShieldController({segments:24,rings:12});const canvas=$('view'),ctx=canvas.getContext('2d');let frameSamples=[],fpsText='Measuring…';document.addEventListener('visibilitychange',()=>{frameSamples=[];last=0;});let yaw=25,pitch=30,paused=false,elapsed=0,last=0,drag;
for(const key of ['theta','phi','separation','influence'])$(key).oninput=()=>{if(key==='theta'||key==='phi')$('mode').value='manual';shield.setParameters({[key]:Number($(key).value)});};
$('meshToggle').onclick=()=>{frameSamples=[];fpsText='Measuring…';last=0;const meshMode=shield.meshMode==='uniform'?'adaptive':'uniform';shield=new ShieldController({...shield.settings,meshMode}).setParameters(shield.settings);$('meshToggle').textContent=meshMode==='uniform'?'Use Adaptive mesh':'Use Uniform mesh';$('meshToggle').setAttribute('aria-pressed',meshMode==='adaptive');};
$('rotate').onclick=()=>{$('mode').value='manual';shield.setParameters({phi:shield.phi+30});};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume motion':'Pause motion';};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([exportGLB(shield)],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download='shield.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(drag){yaw-=(e.clientX-drag[0])*.4;pitch=Math.max(5,Math.min(85,pitch+(e.clientY-drag[1])*.4));drag=[e.clientX,e.clientY];}};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
function frame(time){if(last&&!document.hidden){frameSamples.push(time-last);if(frameSamples.length>60)frameSamples.shift();const mean=frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length;fpsText=frameSamples.length>=10?((1000/mean).toFixed(1)+' FPS · '+mean.toFixed(1)+' ms/frame'):'Measuring…';}const dt=last?Math.min((time-last)/1000,.1):0;last=time;if(!paused)elapsed+=dt;const start=performance.now();
 if(!paused&&$('mode').value!=='manual'){const wedge=$('mode').value==='wedge';shield.setDirection(junction(30+20*Math.sin(elapsed*.4)**2,wedge?15*Math.sin(elapsed*.5):elapsed*14));}
 const ms=performance.now()-start;
 for(const key of ['theta','phi','separation','influence']){$(key).value=shield[key];$(key+'Out').textContent=shield[key].toFixed(2)+(key==='influence'?'×':'°');}
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);const cam=camera(yaw,pitch,w/h,1),project=p=>cam.project(p,w,h),p=shield.positions;
 ctx.strokeStyle='#2f91b780';ctx.lineWidth=.6*dpr;
 for(let i=0;i<shield.indices.length;i+=3){ctx.beginPath();for(let j=0;j<3;j++){const n=shield.indices[i+j]*3,q=project(p.subarray(n,n+3));j?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);}ctx.closePath();ctx.stroke();}
 function dot(point,text,color){const q=project(point);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],4*dpr,0,Math.PI*2);ctx.fill();ctx.font=`${12*dpr}px system-ui`;ctx.fillText(text,q[0]+7*dpr,q[1]-7*dpr);}
 for(let k=0;k<12;k++){const a=(k*30-15)*Math.PI/180;dot([Math.cos(a),Math.sin(a),0],String(k+1),'#f0cd83');}dot(shield.N,'N','#ff985b');
 $('stats').textContent=`${fpsText} · estimate over last ${frameSamples.length} frames\n${shield.meshMode.toUpperCase()} · ${(100*(1-shield.indices.length/3/6624)).toFixed(1)}% fewer triangles\n${shield.positions.length/3} vertices · ${shield.indices.length/3} triangles · reusable buffers\nSector ${shield.sector.index+1} · local azimuth ${shield.sector.localDegrees.toFixed(2)}° · CPU geometry ${ms.toFixed(2)} ms\nCanvas diagnostic renderer · local Z-up · GLB root converts to Y-up`;
 requestAnimationFrame(frame);
}requestAnimationFrame(frame);
// Integration entry point: pass a direction from your game's targeting calculation.
window.shieldAsset={get controller(){return shield;},setDirection(direction){$('mode').value='manual';shield.setDirection(direction);},exportGLB:()=>exportGLB(shield)};
