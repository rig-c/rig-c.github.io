import{PixiRenderer,WebGLRenderer,Container,Sprite,Texture,Rectangle,Matrix,Shader,GlProgram}from'./runtime.js';
import{coreAnchorClamp}from'./aperture.js';
const $=id=>document.getElementById(id),host=$('demo'),image=new Image();image.src=new URL('./look.png',import.meta.url);
try{
 const[scene,,payload]=await Promise.all([fetch(new URL('./scene.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Scene unavailable');return r.json()}),image.decode(),fetch(new URL('./scene.bin.gz',import.meta.url)).then(r=>{if(!r.ok)throw Error('Geometry unavailable');return r.arrayBuffer()})]);
 const magic=new Uint8Array(payload);let buffer=payload;if(magic[0]===31&&magic[1]===139){if(typeof DecompressionStream!=='function')throw Error('This preview requires a current browser');buffer=await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()}const signature=new Uint8Array(buffer,0,4);if(signature[0]!==68||signature[1]!==72||signature[2]!==68||signature[3]!==49)throw Error('Invalid geometry payload');
 const read=(spec,T)=>Array.from(new T(buffer,spec[0],spec[1]));
 const parts=scene.parts.map((p,i)=>({...p,base:read(p.base,Float64Array),z:p.depth.values?read(p.depth.values,Float64Array):p.depth.constant,slot:{slot:'m'+i,kind:'mesh',page:'look.png',pma:false,blend:'Normal',tint:[1,1,1,1],sequence:0,vertices:read(p.base,Float64Array),uvs:read(p.uv,Float64Array),triangles:read(p.tri,p.indexWidth===2?Uint16Array:Uint32Array)}}));
 for(const e of scene.eyes)e.core=new Uint8Array(buffer,e.core[0],e.core[1]);
 const renderer=new WebGLRenderer();await renderer.init({width:Math.round(innerWidth*1.5),height:Math.round(innerHeight*1.5),backgroundAlpha:0,antialias:true,resolution:1,preserveDrawingBuffer:true});renderer.canvas.setAttribute('aria-label','Interactive depth-driven head turn');document.body.appendChild(renderer.canvas);
 const stage=new Container(),root=new Container(),masks=new Container();stage.addChild(root,masks);const painter=new PixiRenderer(root,{pageImages:new Map([['look.png',image]])});let width,height,scale,cameraX,cameraY;
 function fit(){width=Math.max(1,Math.round(innerWidth*1.5));height=Math.max(1,Math.round(innerHeight*1.5));renderer.resize(width,height);const b=scene.bounds;scale=Math.min(width*.82/b.width,height*.88/b.height);cameraX=width/2-(b.x+b.width/2)*scale;cameraY=height/2+(b.y+b.height/2)*scale;for(const c of[root,masks]){c.scale.set(scale);c.position.set(cameraX,cameraY)}}fit();
 let gain=1,pivot=55,gaze=.10,counter=.10,x=0,y=0,vx=0,vy=0,tx=0,ty=0;
 // Pixi 8.22.0: retain the meshes and their buffers; a custom shader disables batching.
 const frame={order:parts.map(p=>p.slot)},maskSprites=[];
 painter.render(frame);
 const vertex=`
 in vec2 aPosition;
 in vec2 aUV;
 in float aDepth;
 uniform mat3 uProjectionMatrix;
 uniform mat3 uWorldTransformMatrix;
 uniform mat3 uTransformMatrix;
 uniform vec4 uTurn;
 uniform vec4 uBasis;
 uniform float uCommon;
 uniform vec2 uGaze;
 out vec2 vUV;
 void main(){
  float z=aDepth*uTurn.z;
  float dx=z*uTurn.x,dy=z*uTurn.y;
  vec2 displacement=vec2(uBasis.x*dx+uBasis.y*dy,uBasis.z*dx+uBasis.w*dy)
   +uCommon*uTurn.w*uTurn.xy+uGaze;
  // PixiRenderer stores world y with its sign flipped.
  vec2 position=aPosition+vec2(displacement.x,-displacement.y);
  mat3 mvp=uProjectionMatrix*uWorldTransformMatrix*uTransformMatrix;
  gl_Position=vec4((mvp*vec3(position,1.0)).xy,0.0,1.0);
  vUV=aUV;
 }`;
 const fragment=`
 in vec2 vUV;
 uniform sampler2D uTexture;
 uniform vec4 uColor;
 uniform vec4 uWorldColorAlpha;
 out vec4 finalColor;
 void main(){finalColor=texture(uTexture,vUV)*uColor*uWorldColorAlpha;}`;
 const glProgram=GlProgram.from({vertex,fragment,name:'depth-head-turn',preferredFragmentPrecision:'highp'});
 const turn=new Float32Array(4),basis=new Float32Array([scene.basis.a,scene.basis.b,scene.basis.c,scene.basis.d]);
 parts.forEach((p,i)=>{
  const mesh=root.children[i],depth=new Float32Array(p.base.length/2);
  if(typeof p.z==='number')depth.fill(p.z);else depth.set(p.z);
  mesh.geometry.addAttribute('aDepth',{buffer:depth,format:'float32'});
  mesh.shader=new Shader({glProgram,resources:{uTexture:mesh.texture.source,depthUniforms:{
   uTurn:{value:turn,type:'vec4<f32>'},uBasis:{value:basis,type:'vec4<f32>'},
   uCommon:{value:0,type:'f32'},uGaze:{value:new Float32Array(2),type:'vec2<f32>'}
  }}});
  p.mesh=mesh;p.uniforms=mesh.shader.resources.depthUniforms.uniforms;
  // Alpha-mask filter bounds must follow the displaced iris too. Its depth is constant;
  // update four bounds scalars, without touching any vertex or GPU buffer.
  if(p.iris>=0){if(typeof p.z!=='number')throw Error('Iris requires constant depth');
   let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
   for(let j=0;j<p.base.length;j+=2){minX=Math.min(minX,p.base[j]);maxX=Math.max(maxX,p.base[j]);minY=Math.min(minY,p.base[j+1]);maxY=Math.max(maxY,p.base[j+1])}
   p.irisBounds=[minX,minY,maxX,maxY];
  }
 });
 scene.eyes.forEach((e,i)=>{
  const sprite=new Sprite(new Texture({source:painter.getPageSource('look.png'),frame:new Rectangle(...e.frame)}));
  masks.addChild(sprite);maskSprites[i]=sprite;
  root.children[e.iris].setMask({mask:sprite,channel:'alpha',inverse:false});
 });
 function draw(){const sx=Math.sin(x*15*Math.PI/180),sy=Math.sin(y*12*Math.PI/180),strength=scene.depthGain*gain,T=[pivot*sx,pivot*sy],b=scene.basis;
  turn[0]=sx;turn[1]=sy;turn[2]=strength;turn[3]=pivot;
  const eyeShift=scene.eyes.map(e=>coreAnchorClamp(e.core,e.size[0],e.size[1],e.anchor,[gaze*e.size[0]*x,-gaze*e.size[0]*y]).shift);
  for(const p of parts){const common=p.common===2?-counter:p.common===1?1:0,e=p.iris>=0?scene.eyes[p.iris]:null,shift=e?eyeShift[p.iris]:[0,0],gx=e?e.gazeBasis[0]*shift[0]+e.gazeBasis[1]*shift[1]:0,gy=e?e.gazeBasis[2]*shift[0]+e.gazeBasis[3]*shift[1]:0;
   p.uniforms.uCommon=common;p.uniforms.uGaze[0]=gx;p.uniforms.uGaze[1]=gy;
   if(p.irisBounds){const z=p.z*strength,dx=b.a*(z*sx)+b.b*(z*sy)+common*T[0]+gx,dy=b.c*(z*sx)+b.d*(z*sy)+common*T[1]+gy,q=p.irisBounds;
    p.mesh.geometry.bounds.set(Math.fround(q[0]+dx),Math.fround(-q[3]-dy),Math.fround(q[2]+dx),Math.fround(-q[1]-dy));p.mesh.onViewUpdate();
   }
  }
  scene.eyes.forEach((e,i)=>{const sprite=maskSprites[i],p=parts[e.unit],z=p.z*strength,dx=z*sx,dy=z*sy,m=e.base;sprite.setFromMatrix(new Matrix(m[0],m[1],m[2],m[3],m[4]+T[0]+b.a*dx+b.b*dy,m[5]-(T[1]+b.c*dx+b.d*dy)))});
  renderer.render({container:stage});
 }
 const finite=(v,min,max)=>{if(!Number.isFinite(v))throw Error('Control must be finite');return Math.max(min,Math.min(max,v))};
 for(const[id,min,max,set,format]of[['gain',0,3,v=>gain=v,v=>v.toFixed(2)+'×'],['pivot',0,100,v=>pivot=v,v=>v.toFixed(0)],['gaze',0,.25,v=>gaze=v,v=>(v*100).toFixed(0)+'%'],['counter',0,1,v=>counter=v,v=>(v*100).toFixed(0)+'%']])$(id).addEventListener('input',e=>{const v=finite(Number(e.target.value),min,max);set(v);$(id+'Value').value=format(v);draw()});
 renderer.canvas.addEventListener('pointermove',e=>{const r=renderer.canvas.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)));ty=Math.max(-1,Math.min(1,(r.top+r.height/2-e.clientY)/(r.height/2)))});renderer.canvas.addEventListener('pointerleave',()=>{tx=ty=0});
 $('centre').addEventListener('click',()=>{x=y=vx=vy=tx=ty=0;draw()});addEventListener('resize',()=>{fit();draw()});draw();host.setAttribute('aria-busy','false');$('loading').remove();let last=performance.now();function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;const px=x,py=y,w=20,e=Math.exp(-w*dt),ex=x-tx,ey=y-ty,nx=tx+(ex*(1+w*dt)+vx*dt)*e,ny=ty+(ey*(1+w*dt)+vy*dt)*e;vx=(vx*(1-w*dt)-w*w*dt*ex)*e;vy=(vy*(1-w*dt)-w*w*dt*ey)*e;x=nx;y=ny;if(x!==px||y!==py)draw();requestAnimationFrame(tick)}requestAnimationFrame(tick);
}catch(e){$('loading').textContent='The demo could not load. Please reload the page.';host.setAttribute('aria-busy','false');console.error(e)}
