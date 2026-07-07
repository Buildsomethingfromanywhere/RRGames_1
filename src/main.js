import * as THREE from 'three';
import './styles.css';
/* =========================================================
   ROBO RUMBLE ULTIMATE — transforming mega-bot battle
   ========================================================= */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.physicallyCorrectLights = true;
 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1a);
scene.fog = new THREE.Fog(0x0a0f1a, 60, 160);
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 400);
 
/* ---------------- LIGHTING ---------------- */
scene.add(new THREE.HemisphereLight(0x8fb8ff, 0x1a1410, 0.55));
const sun = new THREE.DirectionalLight(0xfff2dd, 1.35);
sun.position.set(18, 34, 14); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left=-45; sun.shadow.camera.right=45;
sun.shadow.camera.top=45; sun.shadow.camera.bottom=-45;
sun.shadow.camera.far=120; sun.shadow.bias=-0.0004;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x37d5ff, 0.45); rim.position.set(-20, 12, -18); scene.add(rim);
const g1 = new THREE.PointLight(0xff7733, 0.9, 45); g1.position.set(-16, 5, -16); scene.add(g1);
const g2 = new THREE.PointLight(0x37d5ff, 0.9, 45); g2.position.set(16, 5, 16); scene.add(g2);
const arenaSpots=[];
[[0x37d5ff,-22,18,-18],[0xffd23f,22,18,-18],[0xff5a4e,-22,18,18],[0x5dff8a,22,18,18]].forEach(s=>{
  const spot=new THREE.SpotLight(s[0], 2.4, 85, Math.PI/7, 0.55, 1.2);
  spot.position.set(s[1],s[2],s[3]); spot.target.position.set(0,1.5,0);
  spot.castShadow=true; spot.shadow.mapSize.set(1024,1024);
  scene.add(spot, spot.target); arenaSpots.push(spot);
});

let studioEnvMap=null;
function buildStudioEnvironment(){
  const envScene=new THREE.Scene();
  const dome=new THREE.Mesh(new THREE.SphereGeometry(60,32,16),
    new THREE.MeshBasicMaterial({side:THREE.BackSide, color:0x0d1624}));
  envScene.add(dome);
  [
    [0x37d5ff,-12,9,-16,5.5],
    [0xffd23f,14,12,10,4.5],
    [0xff5a4e,-18,5,12,3.5],
    [0xffffff,0,18,0,2.2]
  ].forEach(l=>{
    const p=new THREE.PointLight(l[0],l[4],55); p.position.set(l[1],l[2],l[3]); envScene.add(p);
  });
  const pmrem=new THREE.PMREMGenerator(renderer);
  studioEnvMap=pmrem.fromScene(envScene,0.04).texture;
  scene.environment=studioEnvMap;
  pmrem.dispose();
}
buildStudioEnvironment();
 
/* ---------------- TEXTURES ---------------- */
function makeNoiseTexture(size=256, contrast=1, repeat=4){
  const cv=document.createElement('canvas'); cv.width=cv.height=size;
  const g=cv.getContext('2d');
  const img=g.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4;
    const grain=(Math.random()*255*contrast)|0;
    const stripe=(Math.sin((x+y)*0.08)+1)*18;
    const v=Math.max(0,Math.min(255,grain*0.72+stripe));
    img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
  }
  g.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat,repeat);
  t.anisotropy=renderer.capabilities.getMaxAnisotropy();
  return t;
}
const sharedRoughnessMap=makeNoiseTexture(256,0.85,5);
const sharedBumpMap=makeNoiseTexture(256,0.65,8);

function makeMetalTexture(base='#7d8794', scratches=90, rust=false){
  const cv=document.createElement('canvas'); cv.width=cv.height=256;
  const g=cv.getContext('2d');
  g.fillStyle=base; g.fillRect(0,0,256,256);
  for(let i=0;i<scratches;i++){
    const y=Math.random()*256, a=0.03+Math.random()*0.09;
    g.strokeStyle=`rgba(${Math.random()>0.5?255:0},${Math.random()>0.5?255:20},${Math.random()>0.5?255:30},${a})`;
    g.lineWidth=Math.random()*1.6;
    g.beginPath(); g.moveTo(0,y); g.lineTo(256, y+(Math.random()*8-4)); g.stroke();
  }
  g.strokeStyle='rgba(0,0,0,0.28)'; g.lineWidth=2;
  for(let i=0;i<3;i++){ const p=40+Math.random()*180; g.beginPath(); g.moveTo(p,0); g.lineTo(p,256); g.stroke(); }
  for(let i=0;i<2;i++){ const p=40+Math.random()*180; g.beginPath(); g.moveTo(0,p); g.lineTo(256,p); g.stroke(); }
  g.fillStyle='rgba(0,0,0,0.35)';
  for(let i=0;i<22;i++){ g.beginPath(); g.arc(Math.random()*256, Math.random()*256, 2.2, 0, 7); g.fill(); }
  g.fillStyle='rgba(255,255,255,0.25)';
  for(let i=0;i<22;i++){ g.beginPath(); g.arc(Math.random()*256, Math.random()*256, 1.1, 0, 7); g.fill(); }
  if(rust){ for(let i=0;i<40;i++){ g.fillStyle=`rgba(140,70,30,${0.05+Math.random()*0.12})`;
      g.beginPath(); g.arc(Math.random()*256,Math.random()*256, 4+Math.random()*14,0,7); g.fill(); } }
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=renderer.capabilities.getMaxAnisotropy(); return t;
}
function makeFloorTexture(){
  const cv=document.createElement('canvas'); cv.width=cv.height=512;
  const g=cv.getContext('2d');
  g.fillStyle='#3c4450'; g.fillRect(0,0,512,512);
  const step=128;
  for(let x=0;x<512;x+=step)for(let y=0;y<512;y+=step){
    const shade=44+Math.floor(Math.random()*14);
    g.fillStyle=`rgb(${shade+16},${shade+22},${shade+30})`;
    g.fillRect(x+3,y+3,step-6,step-6);
    g.fillStyle='rgba(255,255,255,0.06)';
    for(let i=0;i<40;i++){ g.beginPath(); g.arc(x+8+Math.random()*(step-16), y+8+Math.random()*(step-16), 2,0,7); g.fill(); }
    g.fillStyle='rgba(0,0,0,0.5)';
    [[x+12,y+12],[x+step-12,y+12],[x+12,y+step-12],[x+step-12,y+step-12]].forEach(p=>{ g.beginPath(); g.arc(p[0],p[1],4,0,7); g.fill(); });
  }
  g.strokeStyle='rgba(0,0,0,0.55)'; g.lineWidth=4;
  for(let x=0;x<=512;x+=step){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,512); g.stroke(); g.beginPath(); g.moveTo(0,x); g.lineTo(512,x); g.stroke(); }
  g.save(); g.translate(256,256); g.rotate(Math.PI/4);
  for(let i=-6;i<6;i++){ g.fillStyle= i%2? '#e0b13a':'#20242c'; g.globalAlpha=0.16; g.fillRect(i*24,-260,24,520); }
  g.restore();
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(8,8);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
 
/* ---------------- ARENA ---------------- */
const ARENA = 34;
const obstacles = [];
const spectatorCrowd = [];
const holoPanels = [];
const stadiumCrowd = [];
const stadiumScreens = [];
const broadcastDrones = [];
const arenaCranes = [];
const weatherFX = {rain:null, lightning:[]};
(function buildArena(){
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2+10, ARENA*2+10),
    new THREE.MeshPhysicalMaterial({map:makeFloorTexture(), roughnessMap:sharedRoughnessMap, bumpMap:sharedBumpMap, bumpScale:0.035, metalness:0.72, roughness:0.42, clearcoat:0.24, envMap:studioEnvMap, envMapIntensity:0.85}));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  const gloss = new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2-2, ARENA*2-2),
    new THREE.MeshBasicMaterial({color:0x7fb8ff, transparent:true, opacity:0.035, blending:THREE.AdditiveBlending, depthWrite:false}));
  gloss.rotation.x=-Math.PI/2; gloss.position.y=0.045; scene.add(gloss);
 
  const ring = new THREE.Mesh(new THREE.RingGeometry(ARENA-0.4, ARENA, 72),
    new THREE.MeshBasicMaterial({color:0xffd23f, transparent:true, opacity:0.65, side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.y=0.02; scene.add(ring);
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    const lane=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,ARENA*1.85),
      new THREE.MeshBasicMaterial({color:i%3?0x244b63:0x37d5ff, transparent:true, opacity:i%3?0.22:0.38}));
    lane.position.set(0,0.055,0); lane.rotation.y=a; scene.add(lane);
  }
 
  const wallTex = makeMetalTexture('#4a545f', 120, true); wallTex.repeat.set(6,1);
  const wallMat = new THREE.MeshPhysicalMaterial({map:wallTex, roughnessMap:sharedRoughnessMap, bumpMap:sharedBumpMap, bumpScale:0.025, metalness:0.82, roughness:0.34, clearcoat:0.18, envMap:studioEnvMap, envMapIntensity:0.8});
  const wallH=6;
  [[0,-ARENA-1,0],[0,ARENA+1,Math.PI],[-ARENA-1,0,Math.PI/2],[ARENA+1,0,-Math.PI/2]].forEach(w=>{
    const wall=new THREE.Mesh(new THREE.BoxGeometry(ARENA*2+2, wallH, 2), wallMat);
    wall.position.set(w[0], wallH/2, w[1]); wall.rotation.y=w[2];
    wall.castShadow=true; wall.receiveShadow=true; scene.add(wall);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(ARENA*2+2.05, 0.7, 2.05),
      new THREE.MeshStandardMaterial({color:0xffd23f, emissive:0x554400, metalness:0.4, roughness:0.5}));
    stripe.position.set(w[0], wallH-0.8, w[1]); stripe.rotation.y=w[2]; scene.add(stripe);
  });

  const trussMat=new THREE.MeshPhysicalMaterial({color:0x344355, metalness:0.9, roughness:0.22, envMap:studioEnvMap, envMapIntensity:1.1});
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const truss=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.32,22), trussMat);
    truss.position.set(Math.cos(a)*39,12,Math.sin(a)*39);
    truss.rotation.y=-a+Math.PI/2;
    truss.castShadow=true; scene.add(truss);
  }
  const panelTexts=['TITAN 07','MEGA ROBOT','POWER CORE','ARENA LIVE'];
  for(let i=0;i<8;i++){
    const cv=document.createElement('canvas'); cv.width=512; cv.height=160;
    const cx=cv.getContext('2d');
    cx.fillStyle='rgba(5,12,22,0.82)'; cx.fillRect(0,0,512,160);
    cx.strokeStyle=i%2?'#37d5ff':'#ffd23f'; cx.lineWidth=6; cx.strokeRect(8,8,496,144);
    cx.font='900 48px Segoe UI, Arial'; cx.textAlign='center'; cx.textBaseline='middle';
    cx.fillStyle=i%2?'#bff3ff':'#ffb13b'; cx.fillText(panelTexts[i%panelTexts.length],256,80);
    const tex=new THREE.CanvasTexture(cv);
    const mat=new THREE.MeshBasicMaterial({map:tex, transparent:true, opacity:0.82, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
    const p=new THREE.Mesh(new THREE.PlaneGeometry(8,2.5), mat);
    const a=i/8*Math.PI*2;
    p.position.set(Math.cos(a)*42,8.8,Math.sin(a)*42);
    p.lookAt(0,6,0);
    scene.add(p); holoPanels.push({mesh:p,phase:i});
  }

  const standMat=new THREE.MeshPhysicalMaterial({color:0x273341, metalness:0.7, roughness:0.42, bumpMap:sharedBumpMap, bumpScale:0.01, envMap:studioEnvMap, envMapIntensity:0.55});
  const railMat=new THREE.MeshPhysicalMaterial({color:0x9aa4ad, metalness:0.95, roughness:0.2, clearcoat:0.35, envMap:studioEnvMap, envMapIntensity:1.05});
  const shirtColors=[0x2e86de,0xe84393,0xf1c40f,0x1abc9c,0xecf0f1,0xff6b81,0x95a5a6,0x27ae60];
  function buildSpectator(x,z,side,row,col){
    const g=new THREE.Group();
    const shirt=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.18,0.42,8),
      new THREE.MeshStandardMaterial({color:shirtColors[(row*7+col*3)%shirtColors.length], roughness:0.85}));
    shirt.position.y=0.48; g.add(shirt);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.15,10,8),
      new THREE.MeshStandardMaterial({color:0xc18f66, roughness:0.82}));
    head.position.y=0.83; g.add(head);
    const armMat=new THREE.MeshStandardMaterial({color:0xb98562, roughness:0.82});
    [-1,1].forEach(s=>{
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.34,6), armMat);
      arm.position.set(0.17*s,0.58,0); arm.rotation.z=0.75*s; g.add(arm);
    });
    g.position.set(x,1.1+row*0.45,z);
    g.scale.setScalar(0.85+Math.random()*0.35);
    g.rotation.y=side;
    scene.add(g);
    spectatorCrowd.push({g,baseY:g.position.y,phase:Math.random()*Math.PI*2});
  }
  [
    {x:0,z:-ARENA-8,rot:0,w:54,d:'x'},
    {x:0,z:ARENA+8,rot:Math.PI,w:54,d:'x'},
    {x:-ARENA-8,z:0,rot:Math.PI/2,w:54,d:'z'},
    {x:ARENA+8,z:0,rot:-Math.PI/2,w:54,d:'z'}
  ].forEach(s=>{
    for(let r=0;r<4;r++){
      const deck=new THREE.Mesh(new THREE.BoxGeometry(s.d==='x'?s.w:5,0.45,s.d==='x'?5:s.w), standMat);
      deck.position.set(s.x,0.65+r*0.45,s.z);
      if(s.d==='x') deck.position.z+=Math.sign(s.z)*r*2.2; else deck.position.x+=Math.sign(s.x)*r*2.2;
      deck.castShadow=true; deck.receiveShadow=true; scene.add(deck);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(s.d==='x'?s.w:0.22,0.18,s.d==='x'?0.22:s.w), railMat);
      rail.position.copy(deck.position);
      rail.position.y+=0.45;
      if(s.d==='x') rail.position.z-=Math.sign(s.z)*2.15; else rail.position.x-=Math.sign(s.x)*2.15;
      scene.add(rail);
      for(let c=0;c<16;c++){
        const off=-s.w/2+3+c*(s.w-6)/15;
        const x=s.d==='x'?off:deck.position.x;
        const z=s.d==='x'?deck.position.z:off;
        buildSpectator(x,z,s.rot,r,c);
      }
    }
  });

  const glassMat=new THREE.MeshPhysicalMaterial({
    color:0x9bdcff, transparent:true, opacity:0.22, roughness:0.03, metalness:0,
    clearcoat:1, clearcoatRoughness:0.02, envMap:studioEnvMap, envMapIntensity:1.4,
    side:THREE.DoubleSide
  });
  const concreteMat=new THREE.MeshPhysicalMaterial({color:0x1d2734, metalness:0.25, roughness:0.72, bumpMap:sharedBumpMap, bumpScale:0.018});
  const seatMat=new THREE.MeshPhysicalMaterial({color:0x111923, metalness:0.55, roughness:0.48, envMap:studioEnvMap, envMapIntensity:0.5});
  function addSafetyGlass(x,z,d,rot){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(d,4.2,0.16), glassMat);
    panel.position.set(x,5.7,z); panel.rotation.y=rot;
    panel.castShadow=false; scene.add(panel);
    const railTop=new THREE.Mesh(new THREE.BoxGeometry(d,0.16,0.28), railMat);
    railTop.position.set(x,7.9,z); railTop.rotation.y=rot; scene.add(railTop);
    const railBot=new THREE.Mesh(new THREE.BoxGeometry(d,0.16,0.28), railMat);
    railBot.position.set(x,3.55,z); railBot.rotation.y=rot; scene.add(railBot);
  }
  addSafetyGlass(0,-ARENA-3.1,ARENA*2+6,0);
  addSafetyGlass(0,ARENA+3.1,ARENA*2+6,0);
  addSafetyGlass(-ARENA-3.1,0,ARENA*2+6,Math.PI/2);
  addSafetyGlass(ARENA+3.1,0,ARENA*2+6,Math.PI/2);

  function addUpperBowl(side){
    const isX=side.axis==='x';
    for(let r=0;r<7;r++){
      const deck=new THREE.Mesh(new THREE.BoxGeometry(isX?72:6.5,0.58,isX?6.5:72), concreteMat);
      deck.position.set(isX?0:side.sign*(ARENA+13+r*3.05), 4.2+r*0.82, isX?side.sign*(ARENA+13+r*3.05):0);
      deck.castShadow=true; deck.receiveShadow=true; scene.add(deck);
      const seats=new THREE.Mesh(new THREE.BoxGeometry(isX?70:5.8,0.12,isX?5.2:70), seatMat);
      seats.position.copy(deck.position); seats.position.y+=0.38; scene.add(seats);
      const led=new THREE.Mesh(new THREE.BoxGeometry(isX?70:0.18,0.16,isX?0.18:70),
        new THREE.MeshBasicMaterial({color:r%2?0x37d5ff:0xffd23f, transparent:true, opacity:0.45}));
      led.position.copy(deck.position); led.position.y+=0.72;
      if(isX) led.position.z-=side.sign*3.35; else led.position.x-=side.sign*3.35;
      scene.add(led);
    }
  }
  [{axis:'x',sign:-1},{axis:'x',sign:1},{axis:'z',sign:-1},{axis:'z',sign:1}].forEach(addUpperBowl);

  function addCrowdField(axis, sign){
    const count=520;
    const pos=new Float32Array(count*3);
    const col=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const lane=-33+Math.random()*66;
      const depth=ARENA+10+Math.random()*21;
      const y=4.9+Math.random()*6.2;
      if(axis==='x'){ pos[i*3]=lane; pos[i*3+2]=sign*depth; }
      else { pos[i*3]=sign*depth; pos[i*3+2]=lane; }
      pos[i*3+1]=y;
      const c=shirtColors[(i+Math.floor(Math.random()*shirtColors.length))%shirtColors.length];
      const color=new THREE.Color(c);
      col[i*3]=color.r; col[i*3+1]=color.g; col[i*3+2]=color.b;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color', new THREE.BufferAttribute(col,3));
    const pts=new THREE.Points(geo, new THREE.PointsMaterial({size:0.19, vertexColors:true, transparent:true, opacity:0.9}));
    scene.add(pts);
    stadiumCrowd.push({points:pts, base:pos.slice(), phase:Math.random()*Math.PI*2});
  }
  addCrowdField('x',-1); addCrowdField('x',1); addCrowdField('z',-1); addCrowdField('z',1);

  function screenCanvas(title, sub){
    const cv=document.createElement('canvas'); cv.width=1024; cv.height=512;
    const cx=cv.getContext('2d');
    cx.fillStyle='#020812'; cx.fillRect(0,0,1024,512);
    const grad=cx.createLinearGradient(0,0,1024,512);
    grad.addColorStop(0,'rgba(55,213,255,.35)'); grad.addColorStop(1,'rgba(255,210,63,.24)');
    cx.fillStyle=grad; cx.fillRect(0,0,1024,512);
    cx.strokeStyle='#d8f7ff'; cx.lineWidth=12; cx.strokeRect(22,22,980,468);
    cx.font='900 92px Segoe UI, Arial'; cx.textAlign='center'; cx.textBaseline='middle';
    cx.fillStyle='#ffffff'; cx.fillText(title,512,214);
    cx.font='800 42px Segoe UI, Arial'; cx.fillStyle='#ffd23f'; cx.fillText(sub,512,320);
    return new THREE.CanvasTexture(cv);
  }
  [
    [0,-ARENA-19,0,'TITAN 07','LIVE IMPACT FEED'],
    [0,ARENA+19,Math.PI,'TITAN 07','COLOSSUS BATTLE'],
    [-ARENA-19,0,Math.PI/2,'CROWD VIEW','MEGA ROBOT ARENA'],
    [ARENA+19,0,-Math.PI/2,'POWER CORE','TRANSFORM WARNING']
  ].forEach((s,i)=>{
    const frame=new THREE.Mesh(new THREE.BoxGeometry(16.5,8.5,0.5), trussMat);
    frame.position.set(s[0],13.8,s[1]); frame.rotation.y=s[2]; scene.add(frame);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(15.2,7.2),
      new THREE.MeshBasicMaterial({map:screenCanvas(s[3],s[4]), transparent:true, opacity:0.94, side:THREE.DoubleSide}));
    screen.position.set(s[0],13.8,s[1]-Math.cos(s[2])*0.36);
    screen.rotation.y=s[2];
    scene.add(screen); stadiumScreens.push({mesh:screen, phase:i});
  });

  [
    [0,-ARENA-1.95,0],[0,ARENA+1.95,Math.PI],[-ARENA-1.95,0,Math.PI/2],[ARENA+1.95,0,-Math.PI/2]
  ].forEach((g,i)=>{
    const gate=new THREE.Mesh(new THREE.BoxGeometry(10,5.4,0.5), wallMat);
    gate.position.set(g[0],2.7,g[1]); gate.rotation.y=g[2]; gate.castShadow=true; scene.add(gate);
    const glow=new THREE.Mesh(new THREE.BoxGeometry(8.8,3.8,0.08), new THREE.MeshBasicMaterial({color:i%2?0xff5a4e:0x37d5ff, transparent:true, opacity:0.22}));
    glow.position.set(g[0],2.7,g[1]); glow.rotation.y=g[2]; scene.add(glow);
  });
 
  const pylonMat=new THREE.MeshStandardMaterial({map:makeMetalTexture('#5a6570',80), metalness:0.85, roughness:0.4});
  [[-ARENA+3,-ARENA+3],[ARENA-3,-ARENA+3],[-ARENA+3,ARENA-3],[ARENA-3,ARENA-3]].forEach((p,i)=>{
    const py=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.8,9,10), pylonMat);
    py.position.set(p[0],4.5,p[1]); py.castShadow=true; scene.add(py);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.7,12,12), new THREE.MeshBasicMaterial({color:i%2?0x37d5ff:0xff7733}));
    lamp.position.set(p[0],9.2,p[1]); scene.add(lamp);
  });
 
  const crateMat=new THREE.MeshStandardMaterial({map:makeMetalTexture('#7a6a45',60,true), metalness:0.6, roughness:0.55});
  const pillarMat=new THREE.MeshStandardMaterial({map:makeMetalTexture('#606d7a',100), metalness:0.8, roughness:0.45});
  [[-10,-8],[11,7],[-12,10],[9,-12],[0,15],[0,-16],[16,-2],[-17,-1]].forEach((s,i)=>{
    if(i%2===0){
      const size=2.2+Math.random()*1.2;
      const crate=new THREE.Mesh(new THREE.BoxGeometry(size,size,size), crateMat);
      crate.position.set(s[0],size/2,s[1]); crate.rotation.y=Math.random();
      crate.castShadow=true; crate.receiveShadow=true; scene.add(crate);
      obstacles.push({x:s[0],z:s[1],r:size*0.85});
    }else{
      const pil=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.4,7,12), pillarMat);
      pil.position.set(s[0],3.5,s[1]); pil.castShadow=true; pil.receiveShadow=true; scene.add(pil);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.18,0.4,12), new THREE.MeshBasicMaterial({color:0x37d5ff}));
      band.position.set(s[0],5.4,s[1]); scene.add(band);
      obstacles.push({x:s[0],z:s[1],r:1.7});
    }
  });

  const explosiveMat=new THREE.MeshStandardMaterial({color:0xff6b1a, emissive:0x552000, metalness:0.75, roughness:0.28});
  [[-22,13],[22,-13],[-23,-14],[23,14]].forEach(p=>{
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.65,1.6,14), explosiveMat);
    barrel.position.set(p[0],0.8,p[1]); barrel.castShadow=true; barrel.receiveShadow=true; scene.add(barrel);
    const band=new THREE.Mesh(new THREE.TorusGeometry(0.58,0.04,8,20), new THREE.MeshBasicMaterial({color:0xffd23f}));
    band.position.set(p[0],1.25,p[1]); band.rotation.x=Math.PI/2; scene.add(band);
    obstacles.push({x:p[0],z:p[1],r:1.0, explosive:true, mesh:barrel});
  });

  function makeDrone(i){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.22,0.48), new THREE.MeshStandardMaterial({color:0x151d28, metalness:0.8, roughness:0.26}));
    g.add(body);
    const cam=new THREE.Mesh(new THREE.SphereGeometry(0.16,12,8), new THREE.MeshBasicMaterial({color:i%2?0xff5a4e:0x37d5ff}));
    cam.position.z=0.34; g.add(cam);
    [-1,1].forEach(s=>[-1,1].forEach(z=>{
      const arm=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.04,0.04), railMat);
      arm.position.set(0.42*s,0,0.28*z); arm.rotation.y=0.35*s*z; g.add(arm);
      const rotor=new THREE.Mesh(new THREE.TorusGeometry(0.18,0.018,6,18), new THREE.MeshBasicMaterial({color:0xbfd7e8, transparent:true, opacity:0.7}));
      rotor.position.set(0.7*s,0,0.42*z); rotor.rotation.x=Math.PI/2; g.add(rotor);
    }));
    scene.add(g); broadcastDrones.push({g,phase:i*Math.PI*0.45,r:22+i*2.5,h:9+Math.random()*4});
  }
  for(let i=0;i<8;i++) makeDrone(i);

  [-1,1].forEach(s=>{
    const crane=new THREE.Group();
    const mast=new THREE.Mesh(new THREE.BoxGeometry(0.8,15,0.8), trussMat); mast.position.y=7.5; crane.add(mast);
    const boom=new THREE.Mesh(new THREE.BoxGeometry(18,0.5,0.5), trussMat); boom.position.set(6*s,14.5,0); crane.add(boom);
    const hook=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,5,8), railMat); hook.position.set(13*s,11.8,0); crane.add(hook);
    const claw=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.08,8,16), new THREE.MeshBasicMaterial({color:0xffd23f})); claw.position.set(13*s,9.1,0); crane.add(claw);
    crane.position.set(0,0,s*(ARENA+30)); crane.rotation.y=s<0?0:Math.PI;
    scene.add(crane); arenaCranes.push({g:crane,phase:s});
  });

  const rainCount=1200;
  const rainPos=new Float32Array(rainCount*3);
  for(let i=0;i<rainCount;i++){
    rainPos[i*3]=(Math.random()-0.5)*110;
    rainPos[i*3+1]=Math.random()*35+5;
    rainPos[i*3+2]=(Math.random()-0.5)*110;
  }
  const rainGeo=new THREE.BufferGeometry(); rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
  weatherFX.rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0x9bdcff,size:0.045,transparent:true,opacity:0.45}));
  scene.add(weatherFX.rain);
  for(let i=0;i<4;i++){
    const bolt=new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,30,0),new THREE.Vector3(0,18,0),new THREE.Vector3(0,8,0)]),
      new THREE.LineBasicMaterial({color:0xd9fbff,transparent:true,opacity:0})
    );
    scene.add(bolt); weatherFX.lightning.push({bolt,phase:i});
  }
 
  const farMat=new THREE.MeshStandardMaterial({color:0x141c28, metalness:0.4, roughness:0.9});
  for(let i=0;i<26;i++){
    const a=(i/26)*Math.PI*2, r=70+Math.random()*22;
    const b=new THREE.Mesh(new THREE.BoxGeometry(6+Math.random()*10, 10+Math.random()*26, 6+Math.random()*10), farMat);
    b.position.set(Math.cos(a)*r, b.geometry.parameters.height/2, Math.sin(a)*r);
    scene.add(b);
  }
  const starGeo=new THREE.BufferGeometry();
  const starPos=new Float32Array(400*3);
  for(let i=0;i<400;i++){ const a=Math.random()*Math.PI*2, e=Math.random()*Math.PI*0.45, r=180;
    starPos[i*3]=Math.cos(a)*Math.cos(e)*r; starPos[i*3+1]=Math.sin(e)*r+10; starPos[i*3+2]=Math.sin(a)*Math.cos(e)*r; }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xaaccff, size:0.7})));
})();

const arenaThemes={steel:new THREE.Group(), lava:new THREE.Group(), sky:new THREE.Group()};
(function buildArenaThemes(){
  const lavaMat=new THREE.MeshBasicMaterial({color:0xff4d1f, transparent:true, opacity:0.72});
  for(let i=0;i<7;i++){
    const pool=new THREE.Mesh(new THREE.CircleGeometry(2.2+Math.random()*2.2,24), lavaMat.clone());
    const a=i/7*Math.PI*2, r=22+Math.random()*7;
    pool.position.set(Math.cos(a)*r,0.035,Math.sin(a)*r);
    pool.rotation.x=-Math.PI/2;
    arenaThemes.lava.add(pool);
    const glow=new THREE.PointLight(0xff5a1f,1.2,14);
    glow.position.set(pool.position.x,1.5,pool.position.z);
    arenaThemes.lava.add(glow);
  }
  const skyMat=new THREE.MeshBasicMaterial({color:0x6fd8ff, transparent:true, opacity:0.28});
  for(let i=0;i<10;i++){
    const pad=new THREE.Mesh(new THREE.RingGeometry(1.8,2.2,24), skyMat);
    const a=i/10*Math.PI*2, r=38+Math.random()*12;
    pad.position.set(Math.cos(a)*r,2+Math.random()*5,Math.sin(a)*r);
    pad.rotation.x=-Math.PI/2;
    arenaThemes.sky.add(pad);
  }
  Object.values(arenaThemes).forEach(g=>{g.visible=false; scene.add(g);});
})();
function applyArenaTheme(name){
  Object.entries(arenaThemes).forEach(([k,g])=>g.visible=k===name);
  scene.background.set(name==='lava'?0x17090a:name==='sky'?0x071827:0x0a0f1a);
  scene.fog.color.set(scene.background);
  g1.color.set(name==='lava'?0xff3b1f:0xff7733);
  g2.color.set(name==='sky'?0x8eeaff:0x37d5ff);
}

const atmosphere=new THREE.Group();
(function buildAtmosphere(){
  const count=900;
  const pos=new Float32Array(count*3);
  const col=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2, r=12+Math.random()*58;
    pos[i*3]=Math.cos(a)*r;
    pos[i*3+1]=0.4+Math.random()*18;
    pos[i*3+2]=Math.sin(a)*r;
    const warm=Math.random();
    col[i*3]=0.35+warm*0.45;
    col[i*3+1]=0.55+warm*0.28;
    col[i*3+2]=0.8;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  const mat=new THREE.PointsMaterial({size:0.08, vertexColors:true, transparent:true, opacity:0.38, depthWrite:false, blending:THREE.AdditiveBlending});
  atmosphere.add(new THREE.Points(geo,mat));
  for(let i=0;i<10;i++){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.75,30,14,1,true),
      new THREE.MeshBasicMaterial({color:i%2?0x37d5ff:0xffd23f, transparent:true, opacity:0.045, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending}));
    const a=i/10*Math.PI*2;
    beam.position.set(Math.cos(a)*24,12,Math.sin(a)*24);
    beam.rotation.x=0.35*Math.sin(a);
    beam.rotation.z=0.35*Math.cos(a);
    atmosphere.add(beam);
  }
  scene.add(atmosphere);
})();
 
/* ---------------- MEGA ROBOT BUILDER ---------------- */
const ARMOR_COLORS=['#c0392b','#2e86de','#27ae60','#f39c12','#8e44ad','#95a5a6','#2c3e50','#e84393','#070a0f','#151a21'];
const ACCENT_COLORS=['#f1c40f','#ecf0f1','#e67e22','#1abc9c','#ff6b81','#576574','#111111','#7bed9f','#2b3440','#b96b24'];
const GLOW_COLORS=['#37d5ff','#ffd23f','#ff4d4d','#5dff8a','#c56cf0','#ff9f43','#ffb13b'];
const HEADS=['visor','cyclops','samurai','hawk','guardian'];
const SHOULDERS=['heavy','spike','round','missile'];
const BACKS=['jets','wings','pods'];
const LEGS=['biped','raptor','hover'];
const GUNS=['rifle','cannon','gatling'];
const BLADES=['sword','axe','dual'];
const FRAMES=['standard','bulky','slim'];
 
function buildRobot(cfg){
  const root=new THREE.Group();
  const armorMat=new THREE.MeshPhysicalMaterial({map:makeMetalTexture(cfg.armor,120), roughnessMap:sharedRoughnessMap, bumpMap:sharedBumpMap, bumpScale:0.018, metalness:0.92, roughness:0.24, clearcoat:0.45, clearcoatRoughness:0.18, envMap:studioEnvMap, envMapIntensity:1.25});
  const accentMat=new THREE.MeshPhysicalMaterial({map:makeMetalTexture(cfg.accent,80), roughnessMap:sharedRoughnessMap, bumpMap:sharedBumpMap, bumpScale:0.014, metalness:0.95, roughness:0.2, clearcoat:0.55, clearcoatRoughness:0.14, envMap:studioEnvMap, envMapIntensity:1.45});
  const darkMat=new THREE.MeshPhysicalMaterial({color:0x171c24, roughnessMap:sharedRoughnessMap, bumpMap:sharedBumpMap, bumpScale:0.01, metalness:0.82, roughness:0.38, clearcoat:0.25, envMap:studioEnvMap, envMapIntensity:0.9});
  const glowMat=new THREE.MeshStandardMaterial({color:cfg.glow, emissive:new THREE.Color(cfg.glow), emissiveIntensity:2.4, metalness:0.15, roughness:0.25});
  const chromeMat=new THREE.MeshPhysicalMaterial({color:0xe7edf3, roughnessMap:sharedRoughnessMap, metalness:1.0, roughness:0.12, clearcoat:0.8, clearcoatRoughness:0.06, envMap:studioEnvMap, envMapIntensity:1.7});
  const pistonMat=new THREE.MeshPhysicalMaterial({color:0x9ca8b4, metalness:1.0, roughness:0.18, clearcoat:0.4, envMap:studioEnvMap, envMapIntensity:1.35});
  const blackGlassMat=new THREE.MeshPhysicalMaterial({color:0x071018, metalness:0.35, roughness:0.08, transmission:0.15, transparent:true, opacity:0.88, clearcoat:1, envMap:studioEnvMap, envMapIntensity:1.6});
 
  function M(geo, mat, x,y,z, parent){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z);
    m.castShadow=true; m.receiveShadow=true; (parent||root).add(m); return m; }
  function plate(parent,x,y,z,sx,sy,sz,mat=chromeMat){
    const p=M(new THREE.BoxGeometry(sx,sy,sz), mat, x,y,z, parent);
    return p;
  }
  function edgeGlow(parent,x,y,z,sx,sy,sz){
    return M(new THREE.BoxGeometry(sx,sy,sz), glowMat, x,y,z, parent);
  }
  function wheel(parent,x,y,z,r=0.22,w=0.12){
    const tire=M(new THREE.CylinderGeometry(r,r,w,18), darkMat, x,y,z, parent);
    tire.rotation.z=Math.PI/2;
    const rim=M(new THREE.CylinderGeometry(r*0.58,r*0.58,w+0.02,14), chromeMat, x,y,z, parent);
    rim.rotation.z=Math.PI/2;
    M(new THREE.CylinderGeometry(r*0.18,r*0.18,w+0.04,10), glowMat, x,y,z, parent).rotation.z=Math.PI/2;
    return tire;
  }
  function armorFin(parent,x,y,z,sx,sy,sz,side=1){
    const fin=plate(parent,x,y,z,sx,sy,sz,accentMat);
    fin.rotation.z=0.18*side;
    fin.rotation.y=-0.12*side;
    return fin;
  }
  function makeLabelTexture(title, sub='07'){
    const cv=document.createElement('canvas'); cv.width=256; cv.height=128;
    const g=cv.getContext('2d');
    g.fillStyle='rgba(5,8,12,0.02)'; g.fillRect(0,0,256,128);
    g.font='900 34px Segoe UI, Arial'; g.textAlign='center'; g.fillStyle='rgba(235,244,250,0.86)';
    g.fillText(title,128,48);
    g.font='900 52px Segoe UI, Arial'; g.fillStyle='rgba(255,255,255,0.92)';
    g.fillText(sub,128,100);
    const t=new THREE.CanvasTexture(cv); t.anisotropy=renderer.capabilities.getMaxAnisotropy(); return t;
  }
  function decal(parent,title,sub,x,y,z,w=0.46,h=0.24,rotY=0){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
      new THREE.MeshBasicMaterial({map:makeLabelTexture(title,sub), transparent:true, opacity:0.86, depthWrite:false}));
    m.position.set(x,y,z); m.rotation.y=rotY; parent.add(m); return m;
  }
  function armorShard(parent,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,mat=armorMat){
    const p=plate(parent,x,y,z,sx,sy,sz,mat);
    p.rotation.set(rx,ry,rz);
    return p;
  }
  function piston(parent, x1,y1,z1, x2,y2,z2){
    const a=new THREE.Vector3(x1,y1,z1), b=new THREE.Vector3(x2,y2,z2);
    const len=a.distanceTo(b);
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,len,6), pistonMat);
    cyl.position.copy(a).lerp(b,0.5);
    cyl.lookAt(b); cyl.rotateX(Math.PI/2);
    cyl.castShadow=true; parent.add(cyl); return cyl;
  }
 
  // frame scale factors
  const fw = cfg.frame==='bulky'?1.34 : cfg.frame==='slim'?0.94 : 1.12;
  const fh = cfg.frame==='bulky'?1.14 : cfg.frame==='slim'?1.18 : 1.12;
  const titanScale = cfg.frame==='bulky'?1.36 : cfg.frame==='slim'?1.2 : 1.28;
  root.scale.setScalar(titanScale);
 
  /* --- torso (with vents, tubes, pistons) --- */
  const torso=new THREE.Group(); torso.position.y=2.15*fh; root.add(torso);
  M(new THREE.BoxGeometry(1.7*fw,1.5,1.0), armorMat, 0,0,0, torso);
  M(new THREE.BoxGeometry(1.9*fw,0.45,1.12), accentMat, 0,0.62,0, torso);
  M(new THREE.BoxGeometry(1.3*fw,0.5,1.06), darkMat, 0,-0.85,0, torso);
  M(new THREE.BoxGeometry(2.18*fw,0.28,1.22), armorMat, 0,0.86,0, torso);
  M(new THREE.BoxGeometry(1.96*fw,0.18,1.3), chromeMat, 0,-1.12,0.03, torso);
  plate(torso,0,0.02,0.59,1.15*fw,1.05,0.08,blackGlassMat);
  plate(torso,0,0.32,0.72,0.72*fw,0.26,0.08,blackGlassMat);
  plate(torso,-0.47*fw,0.2,0.66,0.32,0.78,0.08,armorMat).rotation.z=0.12;
  plate(torso,0.47*fw,0.2,0.66,0.32,0.78,0.08,armorMat).rotation.z=-0.12;
  decal(torso,'TITAN','07',0.48*fw,0.45,0.735,0.54,0.28,0);
  decal(torso,'UNIT','01',-0.5*fw,0.4,0.735,0.4,0.2,0);
  [
    [-0.78,0.62,0.72,0.38,0.16,0.09,0,0,0.13],
    [-0.18,0.68,0.74,0.44,0.13,0.08,0,0,-0.05],
    [0.78,0.09,0.74,0.36,0.18,0.08,0,0,-0.12],
    [-0.82,-0.18,0.72,0.28,0.22,0.08,0,0,0.08],
    [0.82,-0.3,0.72,0.32,0.24,0.08,0,0,-0.1],
    [0.0,-0.58,0.72,0.46,0.18,0.08,0,0,0.04]
  ].forEach(p=>armorShard(torso,p[0]*fw,p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],Math.random()>0.45?armorMat:darkMat));
  M(new THREE.BoxGeometry(0.55,0.55,0.16), glowMat, 0,0.18,0.53, torso);
  const coreRing=M(new THREE.CylinderGeometry(0.44,0.44,0.1,16), chromeMat, 0,0.18,0.5, torso); coreRing.rotation.x=Math.PI/2;
  const coreGlass=M(new THREE.SphereGeometry(0.26,18,12), glowMat, 0,0.18,0.66, torso); coreGlass.scale.z=0.32;
  M(new THREE.BoxGeometry(0.2,1.2,0.14), accentMat, -0.6*fw,0,0.52, torso);
  M(new THREE.BoxGeometry(0.2,1.2,0.14), accentMat, 0.6*fw,0,0.52, torso);
  for(let i=0;i<5;i++){
    const x=(-0.72+i*0.36)*fw;
    plate(torso,x,0.92,0.02,0.08,0.22,1.16,chromeMat);
    edgeGlow(torso,x,-0.96,0.56,0.16,0.06,0.08);
  }
  // chest vents
  for(let i=0;i<3;i++){
    M(new THREE.BoxGeometry(0.34,0.05,0.06), darkMat, -0.45*fw, -0.25-i*0.14, 0.54, torso);
    M(new THREE.BoxGeometry(0.34,0.05,0.06), darkMat, 0.45*fw, -0.25-i*0.14, 0.54, torso);
  }
  // glowing power tubes on sides
  const tubeL=M(new THREE.CylinderGeometry(0.05,0.05,1.1,8), glowMat, -0.9*fw,0,0.1, torso);
  const tubeR=M(new THREE.CylinderGeometry(0.05,0.05,1.1,8), glowMat, 0.9*fw,0,0.1, torso);
  [-1,1].forEach(s=>{
    const reactor=M(new THREE.CylinderGeometry(0.22,0.22,0.12,18), glowMat, 0.82*fw*s,-0.42,0.58, torso);
    reactor.rotation.x=Math.PI/2;
    const ring=M(new THREE.TorusGeometry(0.24,0.035,8,24), chromeMat, 0.82*fw*s,-0.42,0.6, torso);
    ring.rotation.x=Math.PI/2;
    armorFin(torso,1.08*fw*s,0.12,-0.08,0.16,1.18,0.48,s);
    wheel(torso,1.08*fw*s,-0.86,-0.48,0.24,0.14);
    wheel(torso,0.82*fw*s,0.74,-0.52,0.19,0.12);
    for(let i=0;i<4;i++){
      armorShard(torso,(0.93+i*0.08)*fw*s,0.45-i*0.28,0.69,0.12,0.22,0.07,0,0,0.12*s, i%2?darkMat:armorMat);
    }
  });
  // waist pistons
  piston(torso, -0.4,-0.7,0.3, -0.55,-1.15,0.25);
  piston(torso, 0.4,-0.7,0.3, 0.55,-1.15,0.25);
 
  /* --- BACK UNIT --- */
  const backG=new THREE.Group(); backG.position.set(0,0.1,-0.72); torso.add(backG);
  const jets=[];
  M(new THREE.BoxGeometry(1.2*fw,1.0,0.5), darkMat, 0,0,0, backG);
  M(new THREE.BoxGeometry(1.7*fw,1.25,0.28), armorMat, 0,0.05,-0.28, backG);
  [-1,1].forEach(s=>{
    const door=plate(backG,0.74*fw*s,0.2,-0.42,0.36,1.25,0.1,accentMat);
    door.rotation.y=0.3*s;
    edgeGlow(backG,0.73*fw*s,0.18,-0.49,0.05,1.0,0.05);
  });
  function jetCone(x,y,z,rx,parent,scale=1){
    const j=M(new THREE.ConeGeometry(0.13*scale,0.5*scale,8),
      new THREE.MeshBasicMaterial({color:cfg.glow, transparent:true, opacity:0.85}), x,y,z, parent);
    j.rotation.x=rx; jets.push(j); return j;
  }
  const wingParts=[];
  if(cfg.back==='jets'){
    const t1=M(new THREE.CylinderGeometry(0.16,0.24,0.5,10), chromeMat, -0.35,-0.45,-0.15, backG); t1.rotation.x=Math.PI/2.4;
    const t2=M(new THREE.CylinderGeometry(0.16,0.24,0.5,10), chromeMat, 0.35,-0.45,-0.15, backG); t2.rotation.x=Math.PI/2.4;
    const t3=M(new THREE.CylinderGeometry(0.13,0.2,0.48,10), chromeMat, -0.76,-0.25,-0.2, backG); t3.rotation.x=Math.PI/2.4;
    const t4=M(new THREE.CylinderGeometry(0.13,0.2,0.48,10), chromeMat, 0.76,-0.25,-0.2, backG); t4.rotation.x=Math.PI/2.4;
    jetCone(-0.35,-0.72,-0.3, Math.PI/1.55, backG); jetCone(0.35,-0.72,-0.3, Math.PI/1.55, backG);
    jetCone(-0.76,-0.5,-0.34, Math.PI/1.55, backG,0.78); jetCone(0.76,-0.5,-0.34, Math.PI/1.55, backG,0.78);
  } else if(cfg.back==='wings'){
    [-1,1].forEach(s=>{
      const wing=new THREE.Group(); wing.position.set(0.5*s,0.3,-0.1); backG.add(wing);
      const w1=M(new THREE.BoxGeometry(1.5,0.12,0.5), accentMat, 0.8*s,0.25,0, wing); w1.rotation.z=0.35*s;
      const w2=M(new THREE.BoxGeometry(1.0,0.08,0.34), armorMat, 0.7*s,-0.05,0.05, wing); w2.rotation.z=0.2*s;
      M(new THREE.BoxGeometry(1.4,0.05,0.1), glowMat, 0.8*s,0.32,0.2, wing).rotation.z=0.35*s;
      jetCone(1.5*s,0.55,-0.15, Math.PI/1.5, wing, 1.1);
      wingParts.push(wing);
    });
  } else { // cannon pods
    [-1,1].forEach(s=>{
      const pod=M(new THREE.CylinderGeometry(0.2,0.22,1.1,10), armorMat, 0.55*s,0.35,-0.1, backG);
      pod.rotation.x=Math.PI/2.6;
      M(new THREE.CylinderGeometry(0.14,0.14,0.15,10), glowMat, 0.55*s,0.82,-0.38, backG).rotation.x=Math.PI/2.6;
    });
    jetCone(-0.3,-0.6,-0.25, Math.PI/1.55, backG); jetCone(0.3,-0.6,-0.25, Math.PI/1.55, backG);
  }
 
  /* --- HEAD --- */
  const head=new THREE.Group(); head.position.y=1.05; torso.add(head);
  M(new THREE.CylinderGeometry(0.22,0.28,0.25,10), darkMat, 0,-0.02,0, head);
  if(cfg.head==='visor'){
    M(new THREE.BoxGeometry(0.78,0.62,0.72), armorMat, 0,0.4,0, head);
    M(new THREE.BoxGeometry(0.6,0.16,0.1), glowMat, 0,0.44,0.38, head);
    M(new THREE.BoxGeometry(0.84,0.14,0.78), accentMat, 0,0.72,0, head);
    M(new THREE.CylinderGeometry(0.03,0.03,0.5,6), chromeMat, 0.32,0.9,0, head);
  } else if(cfg.head==='cyclops'){
    const skull=M(new THREE.SphereGeometry(0.46,18,14), armorMat, 0,0.42,0, head);
    skull.scale.set(1.08,0.92,0.95);
    M(new THREE.BoxGeometry(0.72,0.18,0.12), glowMat, 0,0.48,0.39, head);
    M(new THREE.SphereGeometry(0.1,12,10), glowMat, -0.2,0.49,0.43, head);
    M(new THREE.SphereGeometry(0.1,12,10), glowMat, 0.2,0.49,0.43, head);
    const brow=M(new THREE.TorusGeometry(0.45,0.055,8,20,Math.PI), accentMat, 0,0.45,0, head); brow.rotation.x=-0.35;
    armorShard(head,-0.34,0.62,0.23,0.18,0.12,0.18,0.2,0.12,0.28,chromeMat);
    armorShard(head,0.34,0.62,0.23,0.18,0.12,0.18,0.2,-0.12,-0.28,chromeMat);
    armorShard(head,0,0.79,-0.02,0.42,0.12,0.42,0.12,0,0,armorMat);
  } else if(cfg.head==='samurai'){
    M(new THREE.BoxGeometry(0.7,0.6,0.66), armorMat, 0,0.4,0, head);
    M(new THREE.BoxGeometry(0.56,0.1,0.08), glowMat, 0,0.46,0.36, head);
    M(new THREE.BoxGeometry(0.5,0.1,0.08), glowMat, 0,0.3,0.36, head);
    const crest=M(new THREE.BoxGeometry(0.1,0.5,0.5), accentMat, 0,0.85,-0.05, head); crest.rotation.x=-0.25;
    const hL=M(new THREE.ConeGeometry(0.06,0.42,6), chromeMat, -0.34,0.72,0.1, head); hL.rotation.z=0.5;
    const hR=M(new THREE.ConeGeometry(0.06,0.42,6), chromeMat, 0.34,0.72,0.1, head); hR.rotation.z=-0.5;
  } else if(cfg.head==='hawk'){
    M(new THREE.BoxGeometry(0.62,0.55,0.8), armorMat, 0,0.4,0.05, head);
    const beak=M(new THREE.ConeGeometry(0.16,0.5,4), accentMat, 0,0.32,0.5, head); beak.rotation.x=Math.PI/2;
    M(new THREE.SphereGeometry(0.07,8,8), glowMat, -0.2,0.5,0.34, head);
    M(new THREE.SphereGeometry(0.07,8,8), glowMat, 0.2,0.5,0.34, head);
    const fin=M(new THREE.BoxGeometry(0.06,0.4,0.6), accentMat, 0,0.75,-0.15, head); fin.rotation.x=0.3;
  } else { // guardian
    M(new THREE.CylinderGeometry(0.34,0.4,0.65,8), armorMat, 0,0.4,0, head);
    M(new THREE.TorusGeometry(0.36,0.05,8,18), glowMat, 0,0.55,0, head).rotation.x=Math.PI/2;
    M(new THREE.BoxGeometry(0.5,0.12,0.12), glowMat, 0,0.38,0.32, head);
    M(new THREE.CylinderGeometry(0.42,0.42,0.14,8), accentMat, 0,0.76,0, head);
    [-1,1].forEach(s=>{ M(new THREE.BoxGeometry(0.08,0.3,0.08), chromeMat, 0.3*s,0.92,0, head); });
  }
  [-1,1].forEach(s=>{
    const ear=M(new THREE.BoxGeometry(0.2,0.42,0.26), chromeMat, 0.52*s,0.42,0.02, head);
    ear.rotation.z=-0.12*s;
    M(new THREE.CylinderGeometry(0.12,0.16,0.12,12), darkMat,0.62*s,0.42,0.02,head).rotation.z=Math.PI/2;
    const antenna=M(new THREE.CylinderGeometry(0.018,0.028,0.62,6), chromeMat, 0.32*s,0.98,-0.12, head);
    antenna.rotation.z=-0.36*s;
    M(new THREE.SphereGeometry(0.055,8,8), glowMat, 0.43*s,1.26,-0.12, head);
  });
  plate(head,0,0.05,-0.38,0.5,0.18,0.12,darkMat);
 
  /* --- SHOULDERS --- */
  const missilePods=[];
  function shoulderPad(side){
    const g=new THREE.Group(); g.position.set(1.06*fw*side, 0.55, 0); torso.add(g);
    if(cfg.shoulder==='heavy'){
      M(new THREE.BoxGeometry(0.82,0.58,1.08), accentMat, 0,0.1,0, g);
      M(new THREE.BoxGeometry(0.92,0.2,1.14), armorMat, 0,0.42,0, g);
      M(new THREE.BoxGeometry(0.68,0.06,0.96), glowMat, 0,0.26,0, g);
      plate(g,0.13*side,0.5,0.0,0.22,0.16,0.98,chromeMat);
      armorFin(g,0.32*side,0.08,-0.02,0.22,0.72,1.08,side);
    } else if(cfg.shoulder==='spike'){
      M(new THREE.BoxGeometry(0.55,0.4,0.8), accentMat, 0,0.08,0, g);
      const sp=M(new THREE.ConeGeometry(0.14,0.5,8), chromeMat, 0.1*side,0.45,0, g); sp.rotation.z=-0.4*side;
      const sp2=M(new THREE.ConeGeometry(0.09,0.34,8), chromeMat, 0.02*side,0.4,0.25, g); sp2.rotation.z=-0.3*side;
      const blade=M(new THREE.ConeGeometry(0.12,0.85,4), accentMat, 0.38*side,0.42,-0.08, g); blade.rotation.z=-0.95*side;
    } else if(cfg.shoulder==='round'){
      M(new THREE.SphereGeometry(0.42,14,12), accentMat, 0,0.1,0, g);
      M(new THREE.TorusGeometry(0.42,0.04,8,20), glowMat, 0,0.1,0, g).rotation.x=Math.PI/2;
      M(new THREE.TorusGeometry(0.5,0.045,8,24), chromeMat, 0,0.1,0, g).rotation.y=Math.PI/2;
    } else { // missile pods
      const pod=M(new THREE.BoxGeometry(0.88,0.62,0.92), accentMat, 0,0.15,0, g);
      M(new THREE.BoxGeometry(1.02,0.28,0.98), armorMat, 0,0.52,0, g);
      for(let r=0;r<2;r++)for(let cIdx=0;cIdx<2;cIdx++){
        const tube=M(new THREE.CylinderGeometry(0.09,0.09,0.2,8), darkMat, -0.14+cIdx*0.28, 0.15+ (r?0.14:-0.1), 0.35, g);
        tube.rotation.x=Math.PI/2;
        M(new THREE.CircleGeometry(0.06,8), glowMat, -0.14+cIdx*0.28, 0.15+(r?0.14:-0.1), 0.46, g);
      }
      missilePods.push(g);
    }
    const joint=M(new THREE.SphereGeometry(0.22,14,10), chromeMat, -0.22*side,-0.22,0, g);
    joint.scale.set(1,0.78,1);
    plate(g,0.46*side,-0.02,-0.1,0.22,0.44,0.72,darkMat);
    return g;
  }
  shoulderPad(-1); shoulderPad(1);
 
  /* --- ARMS --- */
  function arm(side){
    const g=new THREE.Group(); g.position.set(1.06*fw*side, 0.45, 0); torso.add(g);
    M(new THREE.CylinderGeometry(0.17,0.15,0.8,10), armorMat, 0,-0.45,0, g);
    plate(g,0.13*side,-0.42,0.18,0.16,0.62,0.08,chromeMat);
    edgeGlow(g,-0.12*side,-0.42,0.2,0.05,0.5,0.08);
    for(let i=0;i<3;i++){
      armorShard(g,0.02*side,-0.18-i*0.2,0.24,0.26,0.12,0.08,0,0,0.08*side, i%2?darkMat:armorMat);
    }
    piston(g, 0.1*side,-0.15,0.12, 0.12*side,-0.7,0.1);
    M(new THREE.SphereGeometry(0.18,10,10), darkMat, 0,-0.88,0, g);
    const fore=new THREE.Group(); fore.position.set(0,-0.9,0); g.add(fore);
    M(new THREE.CylinderGeometry(0.15,0.19,0.75,10), accentMat, 0,-0.4,0, fore);
    M(new THREE.BoxGeometry(0.24,0.3,0.06), glowMat, 0,-0.35,0.16, fore); // forearm light
    plate(fore,0,-0.35,-0.18,0.32,0.5,0.08,armorMat);
    plate(fore,0.15*side,-0.58,0.04,0.08,0.26,0.32,chromeMat);
    M(new THREE.BoxGeometry(0.48,0.62,0.46), darkMat, 0,-0.62,0, fore);
    armorShard(fore,0,-0.52,0.28,0.44,0.28,0.08,0,0,0.08*side,armorMat);
    armorShard(fore,0,-0.84,0.24,0.36,0.22,0.08,0,0,-0.1*side,chromeMat);
    decal(fore,'','07',0,-0.58,0.335,0.28,0.18,0);
    const fist=M(new THREE.BoxGeometry(0.38,0.34,0.38), darkMat, 0,-1.02,0.02, fore);
    [-1,1].forEach(f=>plate(fore,0.09*f,-1.05,0.24,0.08,0.22,0.1,chromeMat));
    return {root:g, fore};
  }
  const armR=arm(1), armL=arm(-1);
 
  /* --- BLASTER --- */
  const gun=new THREE.Group(); armR.fore.add(gun); gun.position.set(0,-0.75,0.15);
  const gatBarrels=[];
  if(cfg.gun==='rifle'){
    M(new THREE.BoxGeometry(0.34,0.42,1.35), darkMat, 0,0,0.42, gun);
    plate(gun,0,0.18,0.2,0.32,0.08,0.72,armorMat);
    plate(gun,0,-0.16,0.26,0.42,0.12,0.95,accentMat);
    const barrel=M(new THREE.CylinderGeometry(0.07,0.07,0.7,10), chromeMat, 0,0.04,0.95, gun); barrel.rotation.x=Math.PI/2;
    const barrel2=M(new THREE.CylinderGeometry(0.045,0.045,0.86,10), chromeMat, -0.12,0.02,0.92, gun); barrel2.rotation.x=Math.PI/2;
    const barrel3=M(new THREE.CylinderGeometry(0.045,0.045,0.86,10), chromeMat, 0.12,0.02,0.92, gun); barrel3.rotation.x=Math.PI/2;
    M(new THREE.BoxGeometry(0.1,0.16,0.3), accentMat, 0,0.24,0.1, gun);
    M(new THREE.CylinderGeometry(0.1,0.1,0.16,10), glowMat, 0,0.04,1.3, gun).rotation.x=Math.PI/2;
  } else if(cfg.gun==='cannon'){
    const can=M(new THREE.CylinderGeometry(0.34,0.42,1.25,16), armorMat, 0,0,0.42, gun); can.rotation.x=Math.PI/2;
    const mouth=M(new THREE.CylinderGeometry(0.28,0.34,0.24,16), glowMat, 0,0,1.08, gun); mouth.rotation.x=Math.PI/2;
    M(new THREE.TorusGeometry(0.3,0.04,8,16), accentMat, 0,0,0.15, gun);
    M(new THREE.TorusGeometry(0.21,0.025,8,18), chromeMat, 0,0,0.62, gun).rotation.x=Math.PI/2;
  } else { // gatling
    const hub=M(new THREE.CylinderGeometry(0.26,0.26,0.62,12), darkMat, 0,0,0.3, gun); hub.rotation.x=Math.PI/2;
    const spinG=new THREE.Group(); spinG.position.set(0,0,0.65); gun.add(spinG);
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      const b=M(new THREE.CylinderGeometry(0.06,0.06,0.95,8), chromeMat, Math.cos(a)*0.16, Math.sin(a)*0.16, 0, spinG);
      b.rotation.x=Math.PI/2;
    }
    M(new THREE.TorusGeometry(0.18,0.025,8,18), armorMat, 0,0,0.35, gun).rotation.x=Math.PI/2;
    M(new THREE.TorusGeometry(0.15,0.03,6,14), glowMat, 0,0,1.0, gun);
    gatBarrels.push(spinG);
  }
  const muzzle=new THREE.Object3D(); muzzle.position.set(0,0.04,1.65); gun.add(muzzle);
  const muzzleFlash=new THREE.PointLight(new THREE.Color(cfg.glow), 0, 8); muzzle.add(muzzleFlash);
 
  /* --- MELEE WEAPON --- */
  const sword=new THREE.Group(); armL.fore.add(sword); sword.position.set(0,-0.85,0.1);
  const bladeMat=new THREE.MeshStandardMaterial({color:cfg.glow, emissive:new THREE.Color(cfg.glow), emissiveIntensity:2.2, transparent:true, opacity:0.92});
  if(cfg.blade==='sword'){
    M(new THREE.CylinderGeometry(0.06,0.07,0.35,8), darkMat, 0,-0.05,0, sword);
    M(new THREE.BoxGeometry(0.3,0.08,0.12), chromeMat, 0,0.14,0, sword);
    M(new THREE.BoxGeometry(0.16,2.0,0.06), bladeMat, 0,1.2,0, sword);
    M(new THREE.BoxGeometry(0.05,2.0,0.025), new THREE.MeshBasicMaterial({color:0xffffff}), 0,1.2,0.04, sword);
  } else if(cfg.blade==='axe'){
    M(new THREE.CylinderGeometry(0.06,0.06,1.1,8), darkMat, 0,0.35,0, sword);
    const axeHead=M(new THREE.CylinderGeometry(0.5,0.5,0.06,3), bladeMat, 0.28,0.95,0, sword);
    axeHead.rotation.x=Math.PI/2; axeHead.rotation.z=-0.4;
    M(new THREE.SphereGeometry(0.09,8,8), chromeMat, 0,0.95,0, sword);
  } else { // dual daggers
    [-0.12,0.12].forEach((off,i)=>{
      M(new THREE.CylinderGeometry(0.04,0.05,0.24,6), darkMat, off,-0.02,0, sword);
      const b=M(new THREE.BoxGeometry(0.07,0.85,0.04), bladeMat, off,0.5,0, sword);
      b.rotation.z=(i?-1:1)*0.12;
    });
  }
  const swordLight=new THREE.PointLight(new THREE.Color(cfg.glow), 0.55, 5); swordLight.position.y=1; sword.add(swordLight);
 
  /* --- LEGS --- */
  let legL=null, legR=null, hoverRing=null;
  if(cfg.legs==='hover'){
    const hov=new THREE.Group(); hov.position.y=1.15; root.add(hov);
    M(new THREE.CylinderGeometry(0.45,0.6,0.6,12), armorMat, 0,0,0, hov);
    hoverRing=M(new THREE.TorusGeometry(0.75,0.1,10,24), accentMat, 0,-0.25,0, hov);
    hoverRing.rotation.x=Math.PI/2;
    M(new THREE.TorusGeometry(0.75,0.04,8,24), glowMat, 0,-0.36,0, hov).rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      const fin=plate(hov,Math.cos(a)*0.62,-0.08,Math.sin(a)*0.62,0.12,0.08,0.38,chromeMat);
      fin.rotation.y=-a;
    }
    const hoverGlow=M(new THREE.CylinderGeometry(0.5,0.75,0.35,14),
      new THREE.MeshBasicMaterial({color:cfg.glow, transparent:true, opacity:0.35}), 0,-0.55,0, hov);
    jets.push(hoverGlow);
  } else {
    function leg(side){
      const g=new THREE.Group(); g.position.set(0.42*fw*side, 1.35, 0); root.add(g);
      if(cfg.legs==='raptor'){
        const thigh=M(new THREE.CylinderGeometry(0.2,0.16,0.7,10), armorMat, 0,-0.3,0.08, g);
        thigh.rotation.x=-0.5;
        plate(g,0.12*side,-0.32,0.27,0.12,0.52,0.08,chromeMat).rotation.x=-0.45;
        M(new THREE.SphereGeometry(0.17,10,10), darkMat, 0,-0.62,0.22, g);
        const shin=new THREE.Group(); shin.position.set(0,-0.64,0.22); g.add(shin);
        const sh=M(new THREE.CylinderGeometry(0.13,0.17,0.7,10), accentMat, 0,-0.3,-0.14, shin);
        sh.rotation.x=0.55;
        piston(shin, 0,-0.05,0.05, 0,-0.5,-0.25);
        const foot=M(new THREE.BoxGeometry(0.34,0.16,0.66), darkMat, 0,-0.66,0.05, shin);
        plate(shin,0,-0.56,0.08,0.42,0.08,0.38,armorMat);
        edgeGlow(shin,0,-0.62,0.38,0.22,0.04,0.08);
        plate(shin,0,-0.72,0.12,0.66,0.1,0.82,darkMat);
        wheel(shin,0.27*side,-0.67,-0.2,0.16,0.1);
        M(new THREE.ConeGeometry(0.07,0.24,6), chromeMat, -0.1,-0.66,0.42, shin).rotation.x=Math.PI/2;
        M(new THREE.ConeGeometry(0.07,0.24,6), chromeMat, 0.1,-0.66,0.42, shin).rotation.x=Math.PI/2;
        return {root:g, shin};
      }
      M(new THREE.CylinderGeometry(0.2,0.17,0.75,10), armorMat, 0,-0.35,0, g);
      plate(g,0.13*side,-0.34,0.18,0.14,0.52,0.08,chromeMat);
      armorShard(g,0,-0.2,0.28,0.34,0.28,0.08,0,0,0.12*side,armorMat);
      piston(g, 0.12*side,-0.1,0.1, 0.14*side,-0.6,0.08);
      M(new THREE.SphereGeometry(0.19,10,10), darkMat, 0,-0.72,0, g);
      const shin=new THREE.Group(); shin.position.y=-0.74; g.add(shin);
      M(new THREE.CylinderGeometry(0.16,0.2,0.72,10), accentMat, 0,-0.32,0, shin);
      plate(shin,0,-0.28,0.2,0.28,0.42,0.08,armorMat);
      plate(shin,0,-0.3,-0.18,0.18,0.38,0.08,chromeMat);
      M(new THREE.BoxGeometry(0.58,0.34,0.82), darkMat, 0,-0.62,0.12, shin);
      armorShard(shin,0,-0.56,0.56,0.48,0.3,0.08,0,0,0.1*side,armorMat);
      decal(shin,'','07',0,-0.55,0.63,0.26,0.16,0);
      M(new THREE.BoxGeometry(0.46,0.1,0.2), glowMat, 0,-0.66,0.46, shin);
      M(new THREE.BoxGeometry(0.78,0.12,0.38), chromeMat, 0,-0.75,0.32, shin);
      M(new THREE.BoxGeometry(0.64,0.16,0.82), darkMat, 0,-0.78,0.02, shin);
      wheel(shin,0.28*side,-0.66,-0.28,0.18,0.1);
      return {root:g, shin};
    }
    legL=leg(-1); legR=leg(1);
  }
 
  /* --- BALL MODE SHELL (hidden until transform) --- */
  const ball=new THREE.Group(); ball.visible=false; scene.add(ball);
  const shellMat=new THREE.MeshStandardMaterial({map:makeMetalTexture(cfg.armor,80), metalness:0.9, roughness:0.3});
  const shell=new THREE.Mesh(new THREE.SphereGeometry(1.1,18,14), shellMat);
  shell.castShadow=true; ball.add(shell);
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.12,0.08,10,26), new THREE.MeshStandardMaterial({map:makeMetalTexture(cfg.accent,50), metalness:0.9, roughness:0.3}));
  ball.add(band);
  const bandGlow=new THREE.Mesh(new THREE.TorusGeometry(1.12,0.035,8,26), new THREE.MeshBasicMaterial({color:cfg.glow}));
  bandGlow.rotation.y=Math.PI/2; ball.add(bandGlow);
  // panel studs
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const stud=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.16,0.1,8), darkMat);
    stud.position.set(Math.cos(a)*1.06, Math.sin(a)*1.06, 0);
    stud.lookAt(0,0,0); stud.rotateX(Math.PI/2);
    ball.add(stud);
  }
  const ballLight=new THREE.PointLight(new THREE.Color(cfg.glow), 0.8, 7); ball.add(ballLight);
 
  root.traverse(o=>{ if(o.isMesh)o.castShadow=true; });
  root.userData.visualScale=titanScale;
  ball.scale.setScalar(titanScale);
 
  return {
    root, torso, head, armR, armL, gun, muzzle, muzzleFlash, sword, jets, gatBarrels, wingParts, hoverRing,
    legL, legR, ball, glowColor:new THREE.Color(cfg.glow), cfg, isHover:cfg.legs==='hover',
    speedMult: cfg.frame==='slim'?1.18 : cfg.frame==='bulky'?0.88 : 1,
    armorMult: cfg.frame==='bulky'?0.8 : cfg.frame==='slim'?1.15 : 1
  };
}
 
/* ---------------- PROJECTILES / FX ---------------- */
const bullets=[], sparks=[], rings=[], scraps=[], missiles=[];
const boltGeo=new THREE.SphereGeometry(0.14,8,8);
const scrapGeos=[new THREE.BoxGeometry(0.2,0.2,0.2), new THREE.CylinderGeometry(0.06,0.06,0.25,6), new THREE.TetrahedronGeometry(0.16)];
let shake=0;
 
function fireBolt(owner, from, dir, color, dmg=7, scale=1){
  const m=new THREE.Mesh(boltGeo, new THREE.MeshBasicMaterial({color}));
  m.position.copy(from); m.scale.set(scale,scale,2.6*scale);
  m.lookAt(from.clone().add(dir));
  m.add(new THREE.PointLight(color, 1.2, 6));
  scene.add(m);
  bullets.push({mesh:m, vel:dir.clone().multiplyScalar(38), owner, life:2.2, dmg});
}
function fireMissile(owner, from, target, color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.4,8), new THREE.MeshStandardMaterial({color:0xcfd6dd, metalness:0.9, roughness:0.3}));
  body.rotation.x=Math.PI/2; g.add(body);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.16,8), new THREE.MeshBasicMaterial({color}));
  tip.rotation.x=Math.PI/2; tip.position.z=0.28; g.add(tip);
  g.position.copy(from); scene.add(g);
  missiles.push({mesh:g, target, owner, life:3, speed:14, vel:new THREE.Vector3(0,5,0)});
}
function burstSparks(pos, color, count=16, speed=7, up=4){
  for(let i=0;i<count;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.07), new THREE.MeshBasicMaterial({color: Math.random()>0.4?color:0xffcc66}));
    m.position.copy(pos);
    scene.add(m);
    sparks.push({mesh:m, vel:new THREE.Vector3((Math.random()-0.5)*speed, Math.random()*up, (Math.random()-0.5)*speed), life:0.5+Math.random()*0.5, gravity:14});
  }
}
function explosion(pos, color, big=false){
  burstSparks(pos, color, big?46:22, big?13:9, big?9:6);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(big?0.9:0.5,14,12),
    new THREE.MeshBasicMaterial({color:0xffaa44, transparent:true, opacity:0.95}));
  ball.position.copy(pos); scene.add(ball);
  rings.push({mesh:ball, life:big?0.55:0.35, grow:big?9:6, type:'ball'});
  const rg=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.07,8,26),
    new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.9}));
  rg.position.copy(pos); rg.rotation.x=Math.PI/2; scene.add(rg);
  rings.push({mesh:rg, life:0.5, grow:big?16:9, type:'ring'});
  const flash=new THREE.PointLight(0xffbb66, big?6:3, big?26:14);
  flash.position.copy(pos); scene.add(flash);
  rings.push({mesh:flash, life:0.25, grow:0, type:'light'});
  shake += big? 0.5 : 0.18;
}
function scrapBurst(pos, colA, colB, n=14){
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(scrapGeos[i%3], new THREE.MeshStandardMaterial({color: Math.random()>0.5?colA:colB, metalness:0.9, roughness:0.35}));
    m.position.copy(pos); m.castShadow=true; scene.add(m);
    scraps.push({mesh:m, vel:new THREE.Vector3((Math.random()-0.5)*10, 4+Math.random()*7, (Math.random()-0.5)*10),
      rot:new THREE.Vector3(Math.random()*8,Math.random()*8,Math.random()*8), life:2.5});
  }
}
 
/* ---------------- STATE / UI ---------------- */
const UI={};
['garage','hud','endScreen','pHp','eHp','pName','eName','announce','reticle','dmgFlash',
 'cfGun','cfSword','cfDash','cfBall','cfKick','cfMeteor','cfTornado','cfShield','cfGrapple',
 'slotGun','slotSword','slotDash','slotBall','slotKick','slotMeteor','slotTornado','slotShield','slotGrapple','roundTag','endTitle','endSub',
 'comboText','timerText','energyText','ultimateText','armorText','heatText','miniP','miniE',
 'shop','botMarket','shopPowers','garagePowers']
 .forEach(id=>UI[id]=document.getElementById(id));
 
let mode='shop';
const keys={};
const mouse={x:innerWidth/2, y:innerHeight/2, down:false};
const touchMove={x:0, z:0, active:false, fire:false, using:false};
const raycaster=new THREE.Raycaster();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0), 0);
const aimPoint=new THREE.Vector3();
const tmpV=new THREE.Vector3(), tmpV2=new THREE.Vector3();
 
const playerCfg={armor:'#070a0f', accent:'#b96b24', glow:'#ffb13b',
  head:'cyclops', shoulder:'missile', back:'pods', legs:'biped', gun:'cannon', blade:'axe', frame:'bulky', arena:'steel', name:'TITAN 07'};
let player=null, enemy=null, P=null, E=null;
const ENEMY_NAMES=['SCRAPJAW','RUSTFANG','BOLTBRUTE','GEARSNAP','MAGNADOOM','WRECK-9','PISTONPETE','CRUSHBYTE','TURBOTITAN','VOLTVIPER'];
const ROBOT_MARKET=[
  {id:'heavy', name:'TITAN-CLASS HEAVY 07', price:'28,400 CREDITS', tag:'Black gunmetal arena titan: amber visor, layered armor, hydraulic fists, missile shoulders, slow but devastating.',
    cfg:{armor:'#070a0f',accent:'#b96b24',glow:'#ffb13b',frame:'bulky',head:'cyclops',shoulder:'missile',back:'pods',legs:'biped',gun:'cannon',blade:'axe',arena:'steel',name:'TITAN 07'},
    stats:{armor:10,speed:3,fire:9,melee:10,special:8}},
  {id:'samurai', name:'SAMURAI RONIN', price:'21,900 CREDITS', tag:'Elegant carbon-armored duelist with red visor, energy katana, precision counters, and fast footwork.',
    cfg:{armor:'#111111',accent:'#c0392b',glow:'#ff4d4d',frame:'slim',head:'samurai',shoulder:'spike',back:'wings',legs:'biped',gun:'rifle',blade:'sword',arena:'steel',name:'RONIN-7'},
    stats:{armor:6,speed:10,fire:6,melee:10,special:9}},
  {id:'ninja', name:'CYBER NINJA', price:'23,600 CREDITS', tag:'Slim nano-carbon robot with neon blue highlights, dual plasma blades, teleport dash, and stealth style.',
    cfg:{armor:'#111111',accent:'#1abc9c',glow:'#37d5ff',frame:'slim',head:'visor',shoulder:'round',back:'jets',legs:'raptor',gun:'gatling',blade:'dual',arena:'sky',name:'CYBER NINJA'},
    stats:{armor:5,speed:10,fire:8,melee:9,special:10}},
  {id:'brawler', name:'INDUSTRIAL BRAWLER', price:'19,300 CREDITS', tag:'Construction-machine bruiser with hydraulic arms, chains, pile-driver impacts, and heavy grapples.',
    cfg:{armor:'#f39c12',accent:'#576574',glow:'#ffd23f',frame:'bulky',head:'hawk',shoulder:'heavy',back:'pods',legs:'biped',gun:'cannon',blade:'axe',arena:'lava',name:'PILEDRIVER'},
    stats:{armor:9,speed:4,fire:7,melee:10,special:7}},
  {id:'assault', name:'MILITARY ASSAULT', price:'25,100 CREDITS', tag:'Railguns, machine guns, missile pods, drone targeting, deployable shield, and tactical pressure.',
    cfg:{armor:'#27ae60',accent:'#111111',glow:'#5dff8a',frame:'standard',head:'visor',shoulder:'missile',back:'pods',legs:'biped',gun:'gatling',blade:'sword',arena:'steel',name:'ASSAULT-X'},
    stats:{armor:8,speed:7,fire:10,melee:7,special:8}},
  {id:'alien', name:'ALIEN GRAVITY', price:'31,800 CREDITS', tag:'Anti-gravity alien-tech robot with floating parts, purple plasma, morphing limbs, and exotic attacks.',
    cfg:{armor:'#8e44ad',accent:'#ecf0f1',glow:'#c56cf0',frame:'standard',head:'guardian',shoulder:'round',back:'wings',legs:'hover',gun:'cannon',blade:'dual',arena:'sky',name:'GRAVITON'},
    stats:{armor:7,speed:8,fire:9,melee:8,special:10}},
  {id:'ai', name:'EXPERIMENTAL AI', price:'40,000 CREDITS', tag:'White ceramic shell, neural circuits, adaptive armor, energy wings, and shape-shifting weapons.',
    cfg:{armor:'#ecf0f1',accent:'#37d5ff',glow:'#37d5ff',frame:'standard',head:'guardian',shoulder:'heavy',back:'wings',legs:'hover',gun:'rifle',blade:'sword',arena:'sky',name:'AI OMEGA'},
    stats:{armor:8,speed:9,fire:9,melee:9,special:10}},
  {id:'prime', name:'COLOSSUS PRIME', price:'18,400 CREDITS', tag:'Heroic transforming titan with truck-like chest armor, wings, and arena commander stats.',
    cfg:{armor:'#2e86de',accent:'#f1c40f',glow:'#37d5ff',frame:'standard',head:'guardian',shoulder:'heavy',back:'wings',legs:'biped',gun:'rifle',blade:'sword',arena:'steel',name:'PRIME AEGIS'},
    stats:{armor:9,speed:7,fire:8,melee:9,special:10}},
  {id:'tyrant', name:'DREAD OVERLORD', price:'24,900 CREDITS', tag:'Massive dark war machine with cannon arms, missile shoulders, and boss-level armor.',
    cfg:{armor:'#2c3e50',accent:'#e67e22',glow:'#ff4d4d',frame:'bulky',head:'cyclops',shoulder:'missile',back:'pods',legs:'biped',gun:'cannon',blade:'axe',arena:'lava',name:'DREAD MAGNUS'},
    stats:{armor:10,speed:5,fire:10,melee:9,special:8}},
  {id:'service', name:'NEON HOVER TITAN', price:'15,200 CREDITS', tag:'Sleek futuristic sports-mech with hover drive, glass panels, and high mobility.',
    cfg:{armor:'#ecf0f1',accent:'#576574',glow:'#5dff8a',frame:'slim',head:'visor',shoulder:'round',back:'jets',legs:'hover',gun:'rifle',blade:'dual',arena:'sky',name:'ATLAS-X'},
    stats:{armor:5,speed:10,fire:7,melee:6,special:8}},
  {id:'raptor', name:'RAPTOR VOLT COLOSSUS', price:'19,700 CREDITS', tag:'Reverse-jointed hunter titan with wheel joints, claws, and rocket-kick burst power.',
    cfg:{armor:'#27ae60',accent:'#111111',glow:'#ffd23f',frame:'slim',head:'hawk',shoulder:'spike',back:'jets',legs:'raptor',gun:'gatling',blade:'dual',arena:'sky',name:'RAPTOR VOLT'},
    stats:{armor:6,speed:10,fire:8,melee:8,special:10}},
  {id:'simple', name:'IRON SPARK HEAVY', price:'11,100 CREDITS', tag:'Readable starter titan with big boots, steady rifle, and reliable transforming attacks.',
    cfg:{armor:'#95a5a6',accent:'#1abc9c',glow:'#37d5ff',frame:'standard',head:'visor',shoulder:'round',back:'jets',legs:'biped',gun:'rifle',blade:'sword',arena:'steel',name:'IRON SPARK'},
    stats:{armor:6,speed:7,fire:6,melee:6,special:7}}
];
let selectedMarket=ROBOT_MARKET[0];
 
const GUN_CD_BASE={rifle:0.28, cannon:0.55, gatling:0.11};
const GUN_DMG={rifle:7, cannon:13, gatling:3.2};
const SWORD_CD=1.0, DASH_CD=1.6, BALL_CD=6, KICK_CD=5, MET_CD=9, TORNADO_CD=7, SHIELD_CD=8, GRAPPLE_CD=5.5;
let roundNo=1, playerWins=0, enemyWins=0, matchOver=false;
 
function fighterState(bot, isPlayer){
  return {bot, hp:100, isPlayer,
    pos:bot.root.position, yaw:0, vel:new THREE.Vector3(), y:0, vy:0,
    gunCd:0, swordCd:0, dashCd:0, ballCd:0, kickCd:0, metCd:0, tornadoCd:0, shieldCd:0, grappleCd:0,
    dashT:0, swingT:0, hitT:0, walkPh:0, recoil:0,
    shieldT:0, tornadoHitT:0,
    special:null, spT:0, spDir:new THREE.Vector3(), spTarget:new THREE.Vector3(), spHit:false,
    ai:{state:'chase', t:0, strafeDir:1}, dead:false};
}
 
/* ---------------- GARAGE ---------------- */
let previewBot=null, previewSpin=0.4, dragging=false, lastX=0;
const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(2.6,3,0.5,28),
  new THREE.MeshStandardMaterial({color:0x2b3644, metalness:0.8, roughness:0.35}));
pedestal.position.set(0,0.25,0); pedestal.receiveShadow=true; pedestal.castShadow=true;
const pedRing=new THREE.Mesh(new THREE.TorusGeometry(2.62,0.06,8,40), new THREE.MeshBasicMaterial({color:0x37d5ff}));
pedRing.rotation.x=Math.PI/2; pedRing.position.y=0.52;
scene.add(pedestal, pedRing);
 
function disposeBot(bot){ if(!bot)return; scene.remove(bot.root); scene.remove(bot.ball); }
function rebuildPreview(){
  disposeBot(previewBot);
  previewBot=buildRobot(playerCfg);
  previewBot.root.position.set(0,0.5,0);
  scene.add(previewBot.root);
  pedRing.material.color.set(playerCfg.glow);
}
function fillSwatches(rowId, colors, key, defIdx){
  const row=document.getElementById(rowId);
  colors.forEach((c,i)=>{
    const b=document.createElement('div'); b.className='sw'+(i===defIdx?' sel':''); b.style.background=c;
    b.onclick=()=>{ row.querySelectorAll('.sw').forEach(s=>s.classList.remove('sel')); b.classList.add('sel');
      playerCfg[key]=c; renderPowers(UI.shopPowers, playerCfg); renderPowers(UI.garagePowers, playerCfg); rebuildPreview(); };
    row.appendChild(b);
  });
}
fillSwatches('armorRow', ARMOR_COLORS, 'armor', 1);
fillSwatches('accentRow', ACCENT_COLORS, 'accent', 0);
fillSwatches('glowRow', GLOW_COLORS, 'glow', 0);
[['frameRow','frame'],['headRow','head'],['shRow','shoulder'],['backRow','back'],['legRow','legs'],['gunRow','gun'],['bladeRow','blade'],['arenaRow','arena']]
.forEach(([id,key])=>{
  document.getElementById(id).querySelectorAll('.opt').forEach(b=>{
    b.onclick=()=>{ document.getElementById(id).querySelectorAll('.opt').forEach(o=>o.classList.remove('sel'));
      b.classList.add('sel'); playerCfg[key]=b.dataset.v; renderPowers(UI.shopPowers, playerCfg); renderPowers(UI.garagePowers, playerCfg);
      if(key==='arena') applyArenaTheme(playerCfg.arena);
      rebuildPreview(); };
  });
});
function syncSwatch(rowId, colors, val){
  document.getElementById(rowId).querySelectorAll('.sw').forEach((s,i)=>s.classList.toggle('sel', colors[i]===val));
}
function syncOpt(rowId, val){
  document.getElementById(rowId).querySelectorAll('.opt').forEach(o=>o.classList.toggle('sel', o.dataset.v===val));
}
function powerRows(cfg){
  const gunLabel={rifle:'Pulse Rifle',cannon:'Arm Cannon',gatling:'Spinning Gatling'}[cfg.gun]||cfg.gun;
  const bladeLabel={sword:'Energy Sword',axe:'Plasma Axe',dual:'Twin Daggers'}[cfg.blade]||cfg.blade;
  const mobility={biped:'Ground Stride',raptor:'Raptor Leap',hover:'Hover Drift'}[cfg.legs]||cfg.legs;
  const back={jets:'Twin Rocket Jets',wings:'Power Wings',pods:'Back Cannon Pods'}[cfg.back]||cfg.back;
  const shoulder=cfg.shoulder==='missile'?'Homing Missile Pods':cfg.shoulder.toUpperCase();
  return [
    ['Frame', cfg.frame==='bulky'?'Colossus boss armor':cfg.frame==='slim'?'Fast sports-titan frame':'Hero titan chassis'],
    ['Primary', gunLabel],
    ['Melee', bladeLabel],
    ['Mobility', `${mobility} + ${back}`],
    ['Transform', 'Q armored vehicle-ball charge'],
    ['Air Strike', 'E Rocket Kick / R Meteor Slam'],
    ['Advanced', 'T Tornado / G Shield / C Grapple'],
    ['Arena', {steel:'Steel Dome',lava:'Lava Pit',sky:'Sky Platform'}[cfg.arena]||'Steel Dome'],
    ['Shoulders', shoulder]
  ];
}
function renderPowers(target, cfg){
  if(!target) return;
  target.innerHTML=powerRows(cfg).map(([k,v])=>`<div class="powerItem"><b>${k}</b><span>${v}</span></div>`).join('');
}
function applyCfg(next){
  Object.assign(playerCfg, next);
  document.getElementById('botName').value=playerCfg.name||'OMEGACLANK';
  syncSwatch('armorRow',ARMOR_COLORS,playerCfg.armor); syncSwatch('accentRow',ACCENT_COLORS,playerCfg.accent); syncSwatch('glowRow',GLOW_COLORS,playerCfg.glow);
  syncOpt('frameRow',playerCfg.frame); syncOpt('headRow',playerCfg.head); syncOpt('shRow',playerCfg.shoulder);
  syncOpt('backRow',playerCfg.back); syncOpt('legRow',playerCfg.legs); syncOpt('gunRow',playerCfg.gun); syncOpt('bladeRow',playerCfg.blade);
  syncOpt('arenaRow',playerCfg.arena||'steel');
  applyArenaTheme(playerCfg.arena||'steel');
  renderPowers(UI.shopPowers, playerCfg);
  renderPowers(UI.garagePowers, playerCfg);
  rebuildPreview();
}
function renderMarket(){
  UI.botMarket.innerHTML='';
  ROBOT_MARKET.forEach(bot=>{
    const card=document.createElement('div');
    card.className='botCard'+(bot===selectedMarket?' sel':'');
    card.innerHTML=`<h3 class="titleFont">${bot.name}</h3><p>${bot.price} - ${bot.tag}</p>
      <div class="statGrid">
        <div class="stat"><span>ARMOR</span><b>${bot.stats.armor}</b></div>
        <div class="stat"><span>SPEED</span><b>${bot.stats.speed}</b></div>
        <div class="stat"><span>FIRE</span><b>${bot.stats.fire}</b></div>
        <div class="stat"><span>SPECIAL</span><b>${bot.stats.special}</b></div>
      </div>`;
    card.onclick=()=>{
      selectedMarket=bot;
      renderMarket();
      applyCfg(bot.cfg);
    };
    UI.botMarket.appendChild(card);
  });
}
const pick=a=>a[Math.floor(Math.random()*a.length)];
function randomizeBot(){
  playerCfg.armor=pick(ARMOR_COLORS); playerCfg.accent=pick(ACCENT_COLORS); playerCfg.glow=pick(GLOW_COLORS);
  playerCfg.head=pick(HEADS); playerCfg.shoulder=pick(SHOULDERS); playerCfg.back=pick(BACKS);
  playerCfg.legs=pick(LEGS); playerCfg.gun=pick(GUNS); playerCfg.blade=pick(BLADES); playerCfg.frame=pick(FRAMES);
  playerCfg.arena=pick(['steel','lava','sky']);
  playerCfg.name='MEGABOT-'+Math.floor(100+Math.random()*900);
  syncSwatch('armorRow',ARMOR_COLORS,playerCfg.armor); syncSwatch('accentRow',ACCENT_COLORS,playerCfg.accent); syncSwatch('glowRow',GLOW_COLORS,playerCfg.glow);
  syncOpt('frameRow',playerCfg.frame); syncOpt('headRow',playerCfg.head); syncOpt('shRow',playerCfg.shoulder);
  syncOpt('backRow',playerCfg.back); syncOpt('legRow',playerCfg.legs); syncOpt('gunRow',playerCfg.gun); syncOpt('bladeRow',playerCfg.blade);
  syncOpt('arenaRow',playerCfg.arena); applyArenaTheme(playerCfg.arena);
  document.getElementById('botName').value=playerCfg.name;
  renderPowers(UI.shopPowers, playerCfg);
  renderPowers(UI.garagePowers, playerCfg);
  rebuildPreview();
}
document.getElementById('randomBtn').onclick=randomizeBot;
document.getElementById('fullRandomBtn').onclick=randomizeBot;
document.getElementById('buyBtn').onclick=()=>{
  applyCfg(selectedMarket.cfg);
  UI.shop.classList.add('hidden');
  UI.garage.classList.remove('hidden');
  mode='garage';
};
document.getElementById('configureBtn').onclick=document.getElementById('buyBtn').onclick;
document.getElementById('shopBackBtn').onclick=()=>{
  UI.garage.classList.add('hidden');
  UI.shop.classList.remove('hidden');
  mode='shop';
};
renderMarket();
applyCfg(selectedMarket.cfg);
 
canvas.addEventListener('mousedown', e=>{ if(mode==='garage'||mode==='shop'){dragging=true; lastX=e.clientX;} });
window.addEventListener('mousemove', e=>{
  mouse.x=e.clientX; mouse.y=e.clientY;
  if((mode==='garage'||mode==='shop')&&dragging){ previewSpin+=(e.clientX-lastX)*0.012; lastX=e.clientX; }
});
window.addEventListener('mouseup', ()=>dragging=false);
canvas.addEventListener('touchstart', e=>{ if(mode==='garage'||mode==='shop'){dragging=true; lastX=e.touches[0].clientX;} }, {passive:true});
canvas.addEventListener('touchmove', e=>{
  const t=e.touches[0]; mouse.x=t.clientX; mouse.y=t.clientY;
  if((mode==='garage'||mode==='shop')&&dragging){ previewSpin+=(t.clientX-lastX)*0.012; lastX=t.clientX; }
}, {passive:true});
window.addEventListener('touchend', ()=>dragging=false);
 
/* ---------------- BATTLE START ---------------- */
function randomEnemyCfg(){
  return {armor:pick(ARMOR_COLORS), accent:pick(ACCENT_COLORS), glow:pick(GLOW_COLORS),
    head:pick(HEADS), shoulder:pick(SHOULDERS), back:pick(BACKS), legs:pick(LEGS),
    gun:pick(GUNS), blade:pick(BLADES), frame:pick(FRAMES)};
}
function clearFx(){
  bullets.forEach(b=>scene.remove(b.mesh)); bullets.length=0;
  sparks.forEach(s=>scene.remove(s.mesh)); sparks.length=0;
  scraps.forEach(s=>scene.remove(s.mesh)); scraps.length=0;
  rings.forEach(r=>scene.remove(r.mesh)); rings.length=0;
  missiles.forEach(m=>scene.remove(m.mesh)); missiles.length=0;
}
function updateRoundTag(){
  UI.roundTag.textContent=`ROUND ${roundNo} · ${playerWins}-${enemyWins}`;
}
function setupRound(){
  disposeBot(player); disposeBot(enemy);
  clearFx();
  applyArenaTheme(playerCfg.arena||'steel');
 
  player=buildRobot(playerCfg);
  player.root.position.set(-10,0,8); scene.add(player.root);
  enemy=buildRobot(randomEnemyCfg());
  enemy.root.position.set(10,0,-8); scene.add(enemy.root);
 
  P=fighterState(player,true); E=fighterState(enemy,false);
  P.yaw=Math.atan2(E.pos.x-P.pos.x, E.pos.z-P.pos.z); E.yaw=P.yaw+Math.PI;
 
  UI.pName.textContent=playerCfg.name;
  UI.eName.textContent=pick(ENEMY_NAMES);
  UI.pHp.style.width='100%'; UI.eHp.style.width='100%';
  UI.pHp.classList.remove('low'); UI.eHp.classList.remove('low');
  updateRoundTag();
}
function startBattle(){
  disposeBot(previewBot); previewBot=null;
  scene.remove(pedestal, pedRing);
  playerCfg.name=(document.getElementById('botName').value||'OMEGACLANK').toUpperCase();
  roundNo=1; playerWins=0; enemyWins=0; matchOver=false;
  setupRound();
 
  UI.shop.classList.add('hidden'); UI.garage.classList.add('hidden'); UI.endScreen.classList.add('hidden'); UI.hud.classList.remove('hidden');
  mode='battle';
  announce('ROUND 1!', true);
}
document.getElementById('fightBtn').onclick=startBattle;
document.getElementById('rematchBtn').onclick=startBattle;
document.getElementById('garageBtn').onclick=()=>{
  UI.endScreen.classList.add('hidden'); UI.hud.classList.add('hidden'); UI.shop.classList.add('hidden'); UI.garage.classList.remove('hidden');
  disposeBot(player); disposeBot(enemy); player=enemy=null; clearFx();
  scene.add(pedestal, pedRing);
  rebuildPreview();
  mode='garage';
};
let lastAnnounce=0;
function announce(txt, force=false){
  const now=performance.now();
  if(!force && now-lastAnnounce<900) return;
  lastAnnounce=now;
  UI.announce.textContent=txt;
  UI.announce.classList.remove('pop'); void UI.announce.offsetWidth;
  UI.announce.classList.add('pop');
}
 
/* ---------------- INPUT ---------------- */
window.addEventListener('keydown', e=>{
  keys[e.code]=true;
  if(mode==='battle' && !P.dead){
    if(e.code==='KeyF') tryMelee(P);
    if(e.code==='ShiftLeft'||e.code==='ShiftRight') tryDash(P);
    if(e.code==='KeyQ') tryBall(P);
    if(e.code==='KeyE') tryKick(P);
    if(e.code==='KeyR') tryMeteor(P);
    if(e.code==='KeyT') tryTornado(P);
    if(e.code==='KeyG') tryShield(P);
    if(e.code==='KeyC') tryGrapple(P);
  }
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='ArrowRight') e.preventDefault();
});
window.addEventListener('keyup', e=>keys[e.code]=false);
canvas.addEventListener('mousedown', ()=>{ if(mode==='battle') mouse.down=true; });
window.addEventListener('mouseup', ()=>mouse.down=false);
canvas.addEventListener('contextmenu', e=>{ e.preventDefault(); if(mode==='battle'&&!P.dead) tryMelee(P); });

const movePad=document.getElementById('movePad');
const moveKnob=document.getElementById('moveKnob');
function resetTouchMove(){
  touchMove.x=0; touchMove.z=0; touchMove.active=false;
  if(moveKnob) moveKnob.style.transform='translate(0px,0px)';
}
if(movePad && moveKnob){
  const updatePad=e=>{
    const r=movePad.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    const max=r.width*0.34;
    let dx=e.clientX-cx, dy=e.clientY-cy;
    const len=Math.hypot(dx,dy);
    if(len>max){ dx=dx/len*max; dy=dy/len*max; }
    touchMove.x=dx/max;
    touchMove.z=dy/max;
    touchMove.active=true;
    touchMove.using=true;
    moveKnob.style.transform=`translate(${dx}px,${dy}px)`;
  };
  movePad.addEventListener('pointerdown', e=>{
    if(mode!=='battle') return;
    movePad.setPointerCapture(e.pointerId);
    updatePad(e);
    e.preventDefault();
  });
  movePad.addEventListener('pointermove', e=>{
    if(!touchMove.active) return;
    updatePad(e);
    e.preventDefault();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>movePad.addEventListener(type, resetTouchMove));
}
document.querySelectorAll('.touchBtn').forEach(btn=>{
  const action=btn.dataset.action;
  const run=()=>{
    if(mode!=='battle'||!P||P.dead) return;
    touchMove.using=true;
    if(action==='fire'){ touchMove.fire=true; tryFire(P); }
    else if(action==='melee') tryMelee(P);
    else if(action==='dash') tryDash(P);
    else if(action==='ball') tryBall(P);
    else if(action==='kick') tryKick(P);
    else if(action==='meteor') tryMeteor(P);
    else if(action==='tornado') tryTornado(P);
    else if(action==='shield') tryShield(P);
    else if(action==='grapple') tryGrapple(P);
  };
  btn.addEventListener('pointerdown', e=>{
    btn.classList.add('active');
    run();
    e.preventDefault();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>btn.addEventListener(type, ()=>{
    btn.classList.remove('active');
    if(action==='fire') touchMove.fire=false;
  }));
});
 
/* ---------------- COMBAT ---------------- */
function aimDirFor(F){
  if(F.isPlayer) return tmpV2.copy(aimPoint).setY(1.9+F.y).sub(tmpV).normalize();
  const other=F.isPlayer?E:P;
  const d=tmpV2.copy(other.pos).setY(1.9+other.y).sub(tmpV).normalize();
  d.x+=(Math.random()-0.5)*0.12; d.z+=(Math.random()-0.5)*0.12;
  return d.normalize();
}
function tryFire(F){
  if(F.gunCd>0||F.dead||F.special) return;
  const type=F.bot.cfg.gun;
  F.gunCd = F.isPlayer? GUN_CD_BASE[type] : GUN_CD_BASE[type]*2.2+Math.random()*0.3;
  F.bot.muzzle.getWorldPosition(tmpV);
  const dir=aimDirFor(F);
  if(type==='gatling'){ dir.x+=(Math.random()-0.5)*0.08; dir.z+=(Math.random()-0.5)*0.08; dir.normalize(); }
  fireBolt(F, tmpV.clone(), dir, F.bot.glowColor.getHex(), GUN_DMG[type], type==='cannon'?1.5:type==='gatling'?0.7:1);
  F.bot.muzzleFlash.intensity=3;
  F.recoil = type==='cannon'?0.2:0.12;
  burstSparks(tmpV, F.bot.glowColor.getHex(), 3, 3, 2);
  // missile shoulders: occasionally launch homing missiles
  if(F.bot.cfg.shoulder==='missile' && Math.random()<(F.isPlayer?0.14:0.1)){
    const other=F.isPlayer?E:P;
    tmpV.y+=1.2;
    fireMissile(F, tmpV.clone().add(new THREE.Vector3((Math.random()-0.5),0.5,(Math.random()-0.5))), other, F.bot.glowColor.getHex());
  }
}
function tryMelee(F){
  if(F.swordCd>0||F.dead||F.swingT>0||F.special) return;
  F.swordCd=SWORD_CD; F.swingT=0.38; F._slashHit=false;
}
function tryDash(F){
  if(F.dashCd>0||F.dead||F.special) return;
  F.dashCd=DASH_CD; F.dashT=0.22;
  burstSparks(F.pos.clone().setY(0.3), 0xffffff, 10, 5, 2);
}
/* --- SPECIAL: WRECKING BALL --- */
function tryBall(F){
  if(F.ballCd>0||F.dead||F.special) return;
  F.ballCd=BALL_CD; F.special='ballWind'; F.spT=0.28; F.spHit=false;
  announce(F.isPlayer?'WRECKING BALL!':'', F.isPlayer);
}
/* --- SPECIAL: ROCKET KICK --- */
function tryKick(F){
  if(F.kickCd>0||F.dead||F.special) return;
  F.kickCd=KICK_CD; F.special='kickWind'; F.spT=0.18; F.spHit=false;
  announce(F.isPlayer?'ROCKET KICK!':'', F.isPlayer);
}
/* --- SPECIAL: METEOR SLAM --- */
function tryMeteor(F){
  if(F.metCd>0||F.dead||F.special) return;
  F.metCd=MET_CD; F.special='metRise'; F.spT=0.7; F.spHit=false;
  const other=F.isPlayer?E:P;
  F.spTarget.copy(F.isPlayer? aimPoint : other.pos);
  announce(F.isPlayer?'METEOR SLAM!':'', F.isPlayer);
}
function tryTornado(F){
  if(F.tornadoCd>0||F.dead||F.special) return;
  F.tornadoCd=TORNADO_CD; F.special='tornado'; F.spT=1.2; F.tornadoHitT=0;
  announce(F.isPlayer?'TORNADO BLADE!':'', F.isPlayer);
}
function tryShield(F){
  if(F.shieldCd>0||F.dead) return;
  F.shieldCd=SHIELD_CD; F.shieldT=2.2;
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1.65,24,16),
    new THREE.MeshBasicMaterial({color:F.bot.glowColor.getHex(), transparent:true, opacity:0.22, wireframe:true}));
  shield.position.copy(F.pos).setY(1.9);
  scene.add(shield);
  rings.push({mesh:shield, life:2.2, grow:0, type:'shield', owner:F});
  burstSparks(F.pos.clone().setY(1.2), F.bot.glowColor.getHex(), 18, 5, 5);
  announce(F.isPlayer?'SHIELD UP!':'', F.isPlayer);
}
function tryGrapple(F){
  if(F.grappleCd>0||F.dead||F.special) return;
  F.grappleCd=GRAPPLE_CD;
  const other=F.isPlayer?E:P;
  const target=F.isPlayer? aimPoint.clone() : other.pos.clone();
  const dir=target.sub(F.pos).setY(0).normalize();
  if(dir.lengthSq()<0.1) dir.set(Math.sin(F.yaw),0,Math.cos(F.yaw));
  F.yaw=Math.atan2(dir.x,dir.z);
  const start=F.pos.clone().setY(1.9), end=start.clone().addScaledVector(dir,18);
  const hookGeo=new THREE.BufferGeometry().setFromPoints([start,end]);
  const hook=new THREE.Line(hookGeo, new THREE.LineBasicMaterial({color:F.bot.glowColor.getHex(), transparent:true, opacity:0.95}));
  scene.add(hook);
  rings.push({mesh:hook, life:0.22, grow:0, type:'line'});
  const toOther=tmpV.copy(other.pos).sub(F.pos).setY(0);
  const dist=toOther.length();
  const alignment=dist>0 ? toOther.normalize().dot(dir) : 0;
  if(!other.dead && dist<18 && alignment>0.76){
    damage(other, 7, other.pos.clone().setY(1.5));
    const pull=F.pos.clone().sub(other.pos).setY(0).normalize();
    other.vel.add(pull.multiplyScalar(18));
    burstSparks(other.pos.clone().setY(1.5), F.bot.glowColor.getHex(), 16, 6, 4);
    announce(F.isPlayer?'HOOKED!':'YANK!');
  } else {
    burstSparks(end, F.bot.glowColor.getHex(), 7, 3, 2);
  }
}
function exitSpecial(F){
  F.special=null; F.spT=0;
  F.bot.ball.visible=false;
  F.bot.root.visible=!F.dead;
  F.bot.root.rotation.x=0; F.bot.root.rotation.z=0;
}
function damage(F, amt, hitPos){
  if(F.dead) return;
  if(F.shieldT>0){
    amt*=0.35;
    burstSparks(hitPos, F.bot.glowColor.getHex(), 12, 7, 5);
    announce(F.isPlayer?'BLOCKED!':'SHIELD!');
  }
  amt*=F.bot.armorMult;
  F.hp-=amt; F.hitT=0.25;
  burstSparks(hitPos, 0xffdd88, 10, 6, 4);
  scrapBurst(hitPos, 0x888888, new THREE.Color(F.bot.cfg.armor).getHex(), 3);
  if(F.isPlayer){ UI.dmgFlash.style.opacity=1; setTimeout(()=>UI.dmgFlash.style.opacity=0, 120); shake+=0.15; }
  updateHpBars();
  if(F.hp<=0){ F.hp=0; destroyBot(F); }
}
function updateHpBars(){
  UI.pHp.style.width=Math.max(0,P.hp)+'%';
  UI.eHp.style.width=Math.max(0,E.hp)+'%';
  UI.pHp.classList.toggle('low', P.hp<35);
  UI.eHp.classList.toggle('low', E.hp<35);
}
function destroyBot(F){
  exitSpecial(F);
  F.dead=true;
  if(matchOver) return;
  const p=F.pos.clone().setY(2);
  explosion(p, F.bot.glowColor.getHex(), true);
  scrapBurst(p, new THREE.Color(F.bot.cfg.armor).getHex(), 0x999999, 22);
  setTimeout(()=>explosion(F.pos.clone().setY(1.2), 0xffaa33, false), 180);
  setTimeout(()=>{
    if(F.isPlayer) enemyWins++; else playerWins++;
    updateRoundTag();
    if(playerWins>=2||enemyWins>=2){
      matchOver=true;
      mode='over';
      UI.endTitle.textContent = playerWins>=2? 'VICTORY!' : 'DEFEATED!';
      UI.endTitle.className='titleFont '+(playerWins>=2?'win':'lose');
      UI.endSub.textContent = playerWins>=2?
        `Best-of-3 won ${playerWins}-${enemyWins}. Enemy bot popped into spare parts. You are the arena champion!` :
        `Best-of-3 lost ${playerWins}-${enemyWins}. Rebuild the bot, pick a new arena, and strike back.`;
      UI.endScreen.classList.remove('hidden');
    } else {
      roundNo++;
      announce(`ROUND ${roundNo}!`, true);
      setupRound();
      mode='battle';
    }
  }, 1400);
}
function meleeHitCheck(F, dmg, reach, arc){
  const other=F.isPlayer?E:P;
  if(other.dead) return false;
  const dist=F.pos.distanceTo(other.pos);
  const toOther=Math.atan2(other.pos.x-F.pos.x, other.pos.z-F.pos.z);
  let dy=toOther-F.yaw; while(dy>Math.PI)dy-=Math.PI*2; while(dy<-Math.PI)dy+=Math.PI*2;
  if(dist<reach && Math.abs(dy)<arc){
    damage(other, dmg, other.pos.clone().setY(2));
    explosion(other.pos.clone().setY(1.8), F.bot.glowColor.getHex(), false);
    other.vel.add(new THREE.Vector3(Math.sin(F.yaw),0,Math.cos(F.yaw)).multiplyScalar(10));
    return true;
  }
  return false;
}
 
/* ---------------- SPECIAL MOVE UPDATE ---------------- */
function updateSpecial(F, dt){
  if(!F.special) return;
  const bot=F.bot, other=F.isPlayer?E:P;
  F.spT-=dt;

  /* ===== TORNADO BLADE ===== */
  if(F.special==='tornado'){
    const dir=new THREE.Vector3(Math.sin(F.yaw),0,Math.cos(F.yaw));
    F.pos.addScaledVector(dir, 8*dt);
    const lim=ARENA-1.4;
    F.pos.x=Math.max(-lim,Math.min(lim,F.pos.x));
    F.pos.z=Math.max(-lim,Math.min(lim,F.pos.z));
    F.yaw+=dt*14;
    bot.root.rotation.y=F.yaw;
    bot.armL.root.rotation.z=-1.3-Math.sin(F.spT*25)*0.5;
    bot.armR.root.rotation.z=1.3+Math.cos(F.spT*25)*0.5;
    bot.sword.rotation.y+=dt*28;
    if(Math.random()<0.8) burstSparks(F.pos.clone().setY(1.1), F.bot.glowColor.getHex(), 2, 4, 2);
    F.tornadoHitT-=dt;
    if(F.tornadoHitT<=0 && !other.dead && F.pos.distanceTo(other.pos)<3.2){
      F.tornadoHitT=0.22;
      damage(other, 6, other.pos.clone().setY(1.8));
      const away=tmpV.copy(other.pos).sub(F.pos).setY(0).normalize();
      other.vel.add(away.multiplyScalar(7));
      burstSparks(other.pos.clone().setY(1.8), F.bot.glowColor.getHex(), 18, 7, 5);
    }
    if(F.spT<=0){
      bot.armL.root.rotation.z=0; bot.armR.root.rotation.z=0;
      exitSpecial(F);
    }
    return;
  }
 
  /* ===== WRECKING BALL ===== */
  if(F.special==='ballWind'){
    // crouch & spin up
    bot.root.rotation.x = (0.28-F.spT)*2.2;
    bot.root.scale.setScalar(1-(0.28-F.spT)*0.7);
    if(F.spT<=0){
      F.special='ballRoll'; F.spT=1.5;
      bot.root.visible=false; bot.root.scale.setScalar(1); bot.root.rotation.x=0;
      bot.ball.visible=true;
      bot.ball.position.copy(F.pos).setY(1.1);
      const target=F.isPlayer? aimPoint.clone() : other.pos.clone();
      F.spDir.copy(target.sub(F.pos).setY(0)).normalize();
      burstSparks(F.pos.clone().setY(1), F.bot.glowColor.getHex(), 14, 8, 4);
      shake+=0.2;
    }
  } else if(F.special==='ballRoll'){
    const speed=26;
    F.pos.addScaledVector(F.spDir, speed*dt);
    const lim=ARENA-1.4;
    let bounced=false;
    if(F.pos.x<-lim||F.pos.x>lim){ F.spDir.x*=-1; bounced=true; }
    if(F.pos.z<-lim||F.pos.z>lim){ F.spDir.z*=-1; bounced=true; }
    F.pos.x=Math.max(-lim,Math.min(lim,F.pos.x));
    F.pos.z=Math.max(-lim,Math.min(lim,F.pos.z));
    if(bounced){ explosion(F.pos.clone().setY(1), 0xffaa44, false); }
    obstacles.forEach(o=>{
      const dx=F.pos.x-o.x, dz=F.pos.z-o.z, d=Math.hypot(dx,dz), min=o.r+1.1;
      if(d<min&&d>0.001){
        F.pos.x=o.x+dx/d*min; F.pos.z=o.z+dz/d*min;
        const n=new THREE.Vector3(dx/d,0,dz/d);
        F.spDir.reflect(n);
        explosion(F.pos.clone().setY(1), 0xffaa44, false);
      }
    });
    bot.ball.position.copy(F.pos).setY(1.1);
    // roll rotation around axis perpendicular to motion
    const axis=tmpV.set(F.spDir.z,0,-F.spDir.x);
    bot.ball.rotateOnWorldAxis(axis, speed*dt/1.1);
    // ground sparks trail
    if(Math.random()<0.6) burstSparks(F.pos.clone().setY(0.15), F.bot.glowColor.getHex(), 2, 3, 2);
    // hit opponent
    if(!F.spHit && !other.dead && F.pos.distanceTo(other.pos)<2.2){
      F.spHit=true;
      damage(other, 20, other.pos.clone().setY(1.6));
      explosion(other.pos.clone().setY(1.4), F.bot.glowColor.getHex(), true);
      other.vel.add(F.spDir.clone().multiplyScalar(16));
      announce(F.isPlayer?'STRIKE!':'CLANKED!');
      F.spT=Math.min(F.spT,0.25);
    }
    if(F.spT<=0){
      exitSpecial(F);
      bot.root.position.copy(F.pos);
      burstSparks(F.pos.clone().setY(1), 0xffffff, 12, 6, 5);
      F.vel.set(0,0,0);
    }
  }
 
  /* ===== ROCKET KICK ===== */
  else if(F.special==='kickWind'){
    bot.root.position.y=F.y + (0.18-F.spT)*1.2; // hop up
    if(F.spT<=0){
      F.special='kickFly'; F.spT=0.75;
      const target=F.isPlayer? aimPoint.clone() : other.pos.clone();
      F.spDir.copy(target.sub(F.pos).setY(0)).normalize();
      F.yaw=Math.atan2(F.spDir.x,F.spDir.z);
      shake+=0.15;
    }
  } else if(F.special==='kickFly'){
    const speed=24;
    F.pos.addScaledVector(F.spDir, speed*dt);
    F.y = 0.9+Math.sin((0.75-F.spT)/0.75*Math.PI)*0.7;
    const lim=ARENA-1.4;
    F.pos.x=Math.max(-lim,Math.min(lim,F.pos.x));
    F.pos.z=Math.max(-lim,Math.min(lim,F.pos.z));
    // flying pose
    bot.root.rotation.x=0.85;
    if(bot.legR){ bot.legR.root.rotation.x=-1.5; bot.legR.shin.rotation.x=0.1; }
    if(bot.legL){ bot.legL.root.rotation.x=0.6; }
    bot.jets.forEach(j=>j.scale.setScalar(1.8+Math.random()*0.5));
    if(Math.random()<0.7) burstSparks(F.pos.clone().setY(F.y+0.5), F.bot.glowColor.getHex(), 2, 2, 1);
    if(!F.spHit && !other.dead && F.pos.distanceTo(other.pos)<2.4){
      F.spHit=true;
      damage(other, 15, other.pos.clone().setY(2));
      explosion(other.pos.clone().setY(1.8), F.bot.glowColor.getHex(), false);
      other.vel.add(F.spDir.clone().multiplyScalar(18));
      announce(F.isPlayer?'MEGA KICK!':'OOF!');
      F.spT=Math.min(F.spT,0.15);
    }
    if(F.spT<=0){
      F.y=0; exitSpecial(F);
      if(bot.legR){bot.legR.root.rotation.x=0; bot.legR.shin.rotation.x=0;}
      if(bot.legL) bot.legL.root.rotation.x=0;
      burstSparks(F.pos.clone().setY(0.2), 0xffffff, 8, 5, 3);
    }
  }
 
  /* ===== METEOR SLAM ===== */
  else if(F.special==='metRise'){
    F.y += dt*14*(0.7-Math.max(0,F.spT))/0.7 + dt*6;
    F.y=Math.min(F.y, 11);
    bot.jets.forEach(j=>j.scale.setScalar(2.2+Math.random()*0.8));
    if(Math.random()<0.8) burstSparks(F.pos.clone().setY(F.y-0.5), F.bot.glowColor.getHex(), 2, 3, 1);
    if(F.spT<=0){ F.special='metAim'; F.spT=0.45; }
  } else if(F.special==='metAim'){
    // drift over target
    const t=F.isPlayer? aimPoint : (other.dead? F.pos : other.pos);
    F.spTarget.set(
      Math.max(-ARENA+2, Math.min(ARENA-2, t.x)),
      0,
      Math.max(-ARENA+2, Math.min(ARENA-2, t.z)));
    F.pos.x += (F.spTarget.x-F.pos.x)*Math.min(1,dt*6);
    F.pos.z += (F.spTarget.z-F.pos.z)*Math.min(1,dt*6);
    F.y=11;
    bot.jets.forEach(j=>j.scale.setScalar(1.5+Math.random()*0.4));
    if(F.spT<=0){ F.special='metFall'; F.spT=1.2; F.vy=-2; }
  } else if(F.special==='metFall'){
    F.vy-=dt*70;
    F.y+=F.vy*dt;
    bot.root.rotation.x=0.25;
    // curl arms in
    bot.armL.root.rotation.x=-2.4; bot.armR.root.rotation.x=-2.4;
    if(Math.random()<0.9) burstSparks(F.pos.clone().setY(F.y+1), 0xffaa44, 3, 3, 1);
    if(F.y<=0){
      F.y=0; F.vy=0;
      bot.root.rotation.x=0; bot.armL.root.rotation.x=0; bot.armR.root.rotation.x=0;
      // IMPACT
      const impact=F.pos.clone().setY(0.6);
      explosion(impact, F.bot.glowColor.getHex(), true);
      explosion(impact.clone().setY(1.6), 0xffaa33, true);
      scrapBurst(impact, 0x777777, 0x555555, 10);
      shake+=0.7;
      if(!other.dead){
        const d=F.pos.distanceTo(other.pos);
        if(d<7){
          const dmg=Math.round(30*(1-d/7)+8);
          damage(other, dmg, other.pos.clone().setY(1.5));
          const away=tmpV.copy(other.pos).sub(F.pos).setY(0).normalize();
          other.vel.add(away.multiplyScalar(20*(1-d/8)));
          announce(F.isPlayer?'KA-BOOOOM!':'CRUNCH!');
        }
      }
      exitSpecial(F);
    }
  }
}
 
/* ---------------- ENEMY AI ---------------- */
function updateAI(dt){
  if(E.dead||P.dead||E.special) return;
  const ai=E.ai; ai.t-=dt;
  const dist=E.pos.distanceTo(P.pos);
  if(ai.t<=0){
    ai.t=0.8+Math.random()*1.2;
    if(dist>16) ai.state='chase';
    else if(dist<4.5&&Math.random()<0.6) ai.state='slash';
    else ai.state=Math.random()<0.55?'strafe':'chase';
    ai.strafeDir=Math.random()<0.5?-1:1;
    if(Math.random()<0.18&&E.dashCd<=0) tryDash(E);
    // specials
    const roll=Math.random();
    if(E.hp<45 && roll<0.12 && E.shieldCd<=0) tryShield(E);
    else if(roll<0.14 && dist>11 && E.ballCd<=0) tryBall(E);
    else if(roll<0.24 && dist>6 && dist<15 && E.kickCd<=0) tryKick(E);
    else if(roll<0.31 && E.metCd<=0) tryMeteor(E);
    else if(roll<0.39 && dist<5.2 && E.tornadoCd<=0) tryTornado(E);
    else if(roll<0.47 && dist>7 && dist<18 && E.grappleCd<=0) tryGrapple(E);
  }
  const targetYaw=Math.atan2(P.pos.x-E.pos.x, P.pos.z-E.pos.z);
  let dy=targetYaw-E.yaw;
  while(dy>Math.PI)dy-=Math.PI*2; while(dy<-Math.PI)dy+=Math.PI*2;
  E.yaw+=dy*Math.min(1,dt*6);
  const fwd=new THREE.Vector3(Math.sin(E.yaw),0,Math.cos(E.yaw));
  const side=new THREE.Vector3(fwd.z,0,-fwd.x);
  let move=new THREE.Vector3();
  if(ai.state==='chase'&&dist>5) move.add(fwd);
  if(ai.state==='strafe'){ move.add(side.multiplyScalar(ai.strafeDir));
    if(dist>12)move.add(fwd.clone().multiplyScalar(0.5));
    if(dist<6)move.add(fwd.clone().multiplyScalar(-0.6)); }
  if(ai.state==='slash'){ move.add(fwd); if(dist<3.4){ tryMelee(E); ai.state='strafe'; } }
  applyMove(E, move, dt, 6.2*E.bot.speedMult);
  if(dist>4&&Math.abs(dy)<0.5) tryFire(E);
}
 
/* ---------------- MOVEMENT ---------------- */
function applyMove(F, move, dt, speed){
  if(move.lengthSq()>0){ move.normalize(); F.walkPh+=dt*9; }
  else F.walkPh*=0.9;
  const spd=speed*(F.dashT>0?3.4:1);
  F.vel.lerp(move.multiplyScalar(spd), Math.min(1,dt*8));
  F.pos.addScaledVector(F.vel, dt);
  const lim=ARENA-1.4;
  F.pos.x=Math.max(-lim,Math.min(lim,F.pos.x));
  F.pos.z=Math.max(-lim,Math.min(lim,F.pos.z));
  obstacles.forEach(o=>{
    const dx=F.pos.x-o.x, dz=F.pos.z-o.z, d=Math.hypot(dx,dz), min=o.r+0.9;
    if(d<min&&d>0.001){ F.pos.x=o.x+dx/d*min; F.pos.z=o.z+dz/d*min; }
  });
  if(P&&E&&!P.dead&&!E.dead&&P.special!=='ballRoll'&&E.special!=='ballRoll'){
    const dx=P.pos.x-E.pos.x, dz=P.pos.z-E.pos.z, d=Math.hypot(dx,dz);
    if(d<1.8&&d>0.001){ const push=(1.8-d)/2;
      P.pos.x+=dx/d*push;P.pos.z+=dz/d*push;E.pos.x-=dx/d*push;E.pos.z-=dz/d*push; }
  }
}
 
/* ---------------- POSE ---------------- */
function poseBot(F, dt, t){
  const b=F.bot;
  if(F.special==='ballRoll'){ return; } // ball handles itself
  b.root.rotation.y=F.yaw;
  if(F.dead){
    b.root.position.y=Math.min(0, b.root.position.y-dt*0.4);
    b.root.rotation.z+=dt*0.8; b.root.rotation.x+=dt*0.35;
    return;
  }
  const sw=Math.sin(F.walkPh), moving=F.vel.length()>0.6;
  const airborne=F.special==='kickFly'||F.special==='metRise'||F.special==='metAim'||F.special==='metFall';
  let baseY=F.y;
  if(!airborne && !F.special){
    if(b.isHover) baseY = 0.35+Math.sin(t*2.4+(F.isPlayer?0:2))*0.08;
    else baseY = moving? Math.abs(Math.sin(F.walkPh))*0.09 : Math.sin(t*2+(F.isPlayer?0:2))*0.03;
  }
  b.root.position.y=baseY;
 
  if(!airborne){
    if(b.legL){ b.legL.root.rotation.x=moving?sw*0.55:0; b.legL.shin.rotation.x=moving?Math.max(0,-sw)*0.7:0; }
    if(b.legR){ b.legR.root.rotation.x=moving?-sw*0.55:0; b.legR.shin.rotation.x=moving?Math.max(0,sw)*0.7:0; }
    b.torso.rotation.y=moving?sw*0.06:Math.sin(t*1.4)*0.02;
    b.root.rotation.x=0;
  }
  if(b.hoverRing) b.hoverRing.rotation.z+=dt*3;
  if(b.gatBarrels.length && (F.gunCd>0||mouse.down&&F.isPlayer)) b.gatBarrels[0].rotation.z+=dt*20;
  b.wingParts.forEach((w,i)=>{ w.rotation.z=Math.sin(t*2+i)*0.06 + (F.dashT>0?0.25*(i?-1:1):0); });
 
  const jetOn=F.dashT>0||airborne;
  if(!airborne) b.jets.forEach(j=>j.scale.setScalar(jetOn?1.6+Math.random()*0.6:0.55+Math.sin(t*10)*0.1));
 
  F.recoil=Math.max(0,F.recoil-dt*1.2);
  if(!airborne && F.special!=='kickWind'){
    b.armR.root.rotation.x=-Math.PI/2.15 + F.recoil*2 + (moving?sw*0.04:0);
  }
  if(F.swingT>0){
    F.swingT-=dt;
    const k=1-(F.swingT/0.38);
    b.armL.root.rotation.x=-0.4-Math.sin(k*Math.PI)*1.9;
    b.armL.root.rotation.z=0.5-k*1.1;
    b.torso.rotation.y+=Math.sin(k*Math.PI)*0.35;
    if(k>0.4&&k<0.6&&!F._slashHit){
      F._slashHit=true;
      const dmg=F.bot.cfg.blade==='axe'?19 : F.bot.cfg.blade==='dual'?12 : 16;
      const reach=F.bot.cfg.blade==='axe'?3.9:3.6;
      if(meleeHitCheck(F,dmg,reach,1.1)) announce(F.isPlayer?pick2(['CLANK!','SLICE!','KA-CHING!']):'');
      if(F.bot.cfg.blade==='dual' && !F._dualQueued){ F._dualQueued=true;
        setTimeout(()=>{ if(!F.dead&&mode==='battle'){ F.swingT=0.3; F._slashHit=false; F._dualQueued=false; } }, 140); }
    }
  } else if(!airborne && F.special!=='metFall'){
    F._slashHit=false;
    b.armL.root.rotation.x=moving?-sw*0.3-0.15:-0.15+Math.sin(t*1.6)*0.04;
    b.armL.root.rotation.z=0.25;
  }
  if(F.hitT>0){ F.hitT-=dt; b.root.position.y+=Math.sin(F.hitT*40)*0.02; }
  b.muzzleFlash.intensity=Math.max(0,b.muzzleFlash.intensity-dt*18);
}
function pick2(a){return a[Math.floor(Math.random()*a.length)];}
 
/* ---------------- MAIN LOOP ---------------- */
const clock=new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05, clock.getDelta());
  const t=clock.elapsedTime;
 
  spectatorCrowd.forEach((s,i)=>{
    const wave=(mode==='battle'||mode==='over')?0.08:0.025;
    s.g.position.y=s.baseY+Math.sin(t*3.2+s.phase)*wave;
    s.g.rotation.z=Math.sin(t*2.4+s.phase)*0.025;
    if(i%9===0) s.g.rotation.y+=Math.sin(t+s.phase)*0.0009;
  });
  stadiumCrowd.forEach((c,idx)=>{
    const arr=c.points.geometry.attributes.position.array;
    const amp=(mode==='battle'||mode==='over')?0.09:0.025;
    for(let i=1;i<arr.length;i+=3){
      arr[i]=c.base[i]+Math.sin(t*3.5+c.phase+i*0.017)*amp;
    }
    c.points.geometry.attributes.position.needsUpdate=true;
    c.points.material.opacity=0.78+Math.sin(t*1.2+idx)*0.12;
  });
  holoPanels.forEach(p=>{
    p.mesh.material.opacity=0.62+Math.sin(t*2.4+p.phase)*0.16;
    p.mesh.position.y=8.8+Math.sin(t*1.2+p.phase)*0.18;
  });
  stadiumScreens.forEach(s=>{
    s.mesh.material.opacity=0.84+Math.sin(t*2+s.phase)*0.1;
  });
  broadcastDrones.forEach((d,i)=>{
    const a=t*0.28+d.phase;
    d.g.position.set(Math.cos(a)*d.r, d.h+Math.sin(t*1.7+i)*1.2, Math.sin(a)*d.r);
    d.g.lookAt(0,2,0);
    d.g.children.forEach((c,idx)=>{ if(c.geometry&&c.geometry.type==='TorusGeometry') c.rotation.z+=dt*(18+idx); });
  });
  arenaCranes.forEach(c=>{
    c.g.rotation.y+=Math.sin(t*0.25+c.phase)*dt*0.08;
  });
  if(weatherFX.rain){
    const arr=weatherFX.rain.geometry.attributes.position.array;
    for(let i=1;i<arr.length;i+=3){
      arr[i]-=dt*18;
      if(arr[i]<0.5) arr[i]=36;
    }
    weatherFX.rain.geometry.attributes.position.needsUpdate=true;
    weatherFX.rain.visible=playerCfg.arena==='sky'||playerCfg.arena==='steel';
  }
  weatherFX.lightning.forEach((l,i)=>{
    const on=Math.sin(t*0.9+i*1.7)>0.985;
    l.bolt.material.opacity=on?0.9:Math.max(0,l.bolt.material.opacity-dt*3);
    if(on){
      const x=(Math.random()-0.5)*60,z=(Math.random()-0.5)*60;
      l.bolt.geometry.setFromPoints([
        new THREE.Vector3(x,34,z),
        new THREE.Vector3(x+Math.random()*4-2,23,z+Math.random()*4-2),
        new THREE.Vector3(x+Math.random()*7-3.5,9,z+Math.random()*7-3.5)
      ]);
    }
  });
  atmosphere.rotation.y+=dt*0.015;
  atmosphere.children.forEach((child,i)=>{
    if(child.isMesh) child.material.opacity=0.032+Math.sin(t*0.9+i)*0.018;
  });
  arenaSpots.forEach((s,i)=>{
    s.intensity=2.0+Math.sin(t*1.7+i)*0.55;
    s.target.position.x=Math.sin(t*0.35+i)*5;
    s.target.position.z=Math.cos(t*0.28+i)*5;
  });

  if(mode==='garage'||mode==='shop'){
    if(previewBot){
      if(!dragging) previewSpin+=dt*0.35;
      previewBot.torso.rotation.y=Math.sin(t*0.8)*0.05;
      previewBot.root.position.y=0.5+Math.sin(t*1.5)*0.04;
      previewBot.jets.forEach(j=>j.scale.setScalar(0.6+Math.sin(t*9)*0.15));
      if(previewBot.hoverRing) previewBot.hoverRing.rotation.z+=dt*2;
      previewBot.wingParts.forEach((w,i)=>w.rotation.z=Math.sin(t*1.5+i)*0.08);
    }
    const r=10.2;
    camera.position.set(Math.sin(previewSpin)*r, 5.1+Math.sin(t*0.5)*0.2, Math.cos(previewSpin)*r);
    camera.lookAt(0,3.65,0);
    pedRing.rotation.z+=dt*0.6;
  }
 
  if(mode==='battle'||mode==='over'){
    [P,E].forEach(F=>{
      F.gunCd=Math.max(0,F.gunCd-dt); F.swordCd=Math.max(0,F.swordCd-dt);
      F.dashCd=Math.max(0,F.dashCd-dt); F.dashT=Math.max(0,F.dashT-dt);
      F.ballCd=Math.max(0,F.ballCd-dt); F.kickCd=Math.max(0,F.kickCd-dt); F.metCd=Math.max(0,F.metCd-dt);
      F.tornadoCd=Math.max(0,F.tornadoCd-dt); F.shieldCd=Math.max(0,F.shieldCd-dt); F.grappleCd=Math.max(0,F.grappleCd-dt);
      F.shieldT=Math.max(0,F.shieldT-dt);
    });
 
    raycaster.setFromCamera({x:(mouse.x/innerWidth)*2-1, y:-(mouse.y/innerHeight)*2+1}, camera);
    raycaster.ray.intersectPlane(groundPlane, aimPoint);
    if(aimPoint.length()>500) aimPoint.set(0,0,0);
    if(touchMove.using && E && !E.dead) aimPoint.copy(E.pos);
 
    if(!P.dead && mode==='battle' && !P.special){
      P.yaw=Math.atan2(aimPoint.x-P.pos.x, aimPoint.z-P.pos.z);
      const mv=new THREE.Vector3();
      if(keys['KeyW']||keys['ArrowUp'])mv.z-=1; if(keys['KeyS']||keys['ArrowDown'])mv.z+=1;
      if(keys['KeyA']||keys['ArrowLeft'])mv.x-=1; if(keys['KeyD']||keys['ArrowRight'])mv.x+=1;
      mv.x+=touchMove.x; mv.z+=touchMove.z;
      const camYaw=Math.atan2(camera.position.x-P.pos.x, camera.position.z-P.pos.z);
      const f=new THREE.Vector3(-Math.sin(camYaw),0,-Math.cos(camYaw));
      const s=new THREE.Vector3(-f.z,0,f.x);
      const move=f.clone().multiplyScalar(-mv.z).add(s.multiplyScalar(mv.x));
      applyMove(P, move, dt, 7*P.bot.speedMult);
      if(mouse.down||touchMove.fire) tryFire(P);
    }
    if(mode==='battle'){ updateAI(dt); updateSpecial(P,dt); updateSpecial(E,dt); }
 
    poseBot(P,dt,t); poseBot(E,dt,t);
 
    /* bullets */
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.mesh.position.addScaledVector(b.vel,dt);
      b.life-=dt;
      let hit=false;
      const target=b.owner.isPlayer?E:P;
      if(!target.dead){
        const ty = target.special==='ballRoll'? 1.1 : 2+target.y;
        if(b.mesh.position.distanceTo(tmpV.copy(target.pos).setY(ty))<1.35){
          damage(target, b.dmg, b.mesh.position.clone());
          explosion(b.mesh.position, b.owner.bot.glowColor.getHex(), false);
          if(b.owner.isPlayer) announce(pick2(['ZAP!','BOOM!','DIRECT HIT!','POW!']));
          hit=true;
        }
      }
      if(!hit){
        if(Math.abs(b.mesh.position.x)>ARENA||Math.abs(b.mesh.position.z)>ARENA){ explosion(b.mesh.position,0xffaa44,false); hit=true; }
        else obstacles.some(o=>{
          if(Math.hypot(b.mesh.position.x-o.x,b.mesh.position.z-o.z)<o.r&&b.mesh.position.y<7){
            explosion(b.mesh.position,0xffaa44,!!o.explosive);
            if(o.explosive&&o.mesh){ scene.remove(o.mesh); o.r=0; o.explosive=false; shake+=0.8; }
            hit=true; return true;} return false; });
      }
      if(hit||b.life<=0){ scene.remove(b.mesh); bullets.splice(i,1); }
    }
    /* homing missiles */
    for(let i=missiles.length-1;i>=0;i--){
      const m=missiles[i]; m.life-=dt;
      const target=m.target;
      const goal=tmpV.copy(target.pos).setY(1.8+target.y);
      const want=tmpV2.copy(goal).sub(m.mesh.position).normalize().multiplyScalar(m.speed);
      m.vel.lerp(want, Math.min(1,dt*3.5));
      m.mesh.position.addScaledVector(m.vel,dt);
      m.mesh.lookAt(m.mesh.position.clone().add(m.vel));
      if(Math.random()<0.7) burstSparks(m.mesh.position, 0xff9944, 1, 1, 0.5);
      let done=false;
      if(!target.dead && m.mesh.position.distanceTo(goal)<1.2){
        damage(target, 6, m.mesh.position.clone());
        explosion(m.mesh.position, 0xff8833, false); done=true;
      }
      if(m.mesh.position.y<0.1){ explosion(m.mesh.position,0xff8833,false); done=true; }
      if(done||m.life<=0){ scene.remove(m.mesh); missiles.splice(i,1); }
    }
    /* sparks */
    for(let i=sparks.length-1;i>=0;i--){
      const s=sparks[i];
      s.vel.y-=s.gravity*dt;
      s.mesh.position.addScaledVector(s.vel,dt);
      s.mesh.rotation.x+=dt*9; s.mesh.rotation.y+=dt*7;
      s.life-=dt;
      if(s.mesh.position.y<0.03){ s.mesh.position.y=0.03; s.vel.y*=-0.35; s.vel.x*=0.7; s.vel.z*=0.7; }
      if(s.life<=0){ scene.remove(s.mesh); sparks.splice(i,1); }
    }
    /* scraps */
    for(let i=scraps.length-1;i>=0;i--){
      const s=scraps[i];
      s.vel.y-=16*dt;
      s.mesh.position.addScaledVector(s.vel,dt);
      s.mesh.rotation.x+=s.rot.x*dt; s.mesh.rotation.y+=s.rot.y*dt; s.mesh.rotation.z+=s.rot.z*dt;
      if(s.mesh.position.y<0.12){ s.mesh.position.y=0.12; s.vel.y*=-0.4; s.vel.x*=0.75; s.vel.z*=0.75; s.rot.multiplyScalar(0.6); }
      s.life-=dt;
      if(s.life<=0){ scene.remove(s.mesh); scraps.splice(i,1); }
    }
    /* rings */
    for(let i=rings.length-1;i>=0;i--){
      const r=rings[i]; r.life-=dt;
      if(r.type==='ring'){ r.mesh.scale.addScalar(r.grow*dt); r.mesh.material.opacity=Math.max(0,r.life*1.8); }
      else if(r.type==='ball'){ r.mesh.scale.addScalar(r.grow*dt); r.mesh.material.opacity=Math.max(0,r.life*1.7);
        r.mesh.material.color.offsetHSL(0,-dt*0.5,0); }
      else if(r.type==='shield'){
        r.mesh.position.copy(r.owner.pos).setY(1.9+r.owner.y);
        r.mesh.rotation.y+=dt*2.5;
        r.mesh.material.opacity=Math.max(0,Math.min(0.28,r.life*0.22));
      }
      else if(r.type==='line'){ r.mesh.material.opacity=Math.max(0,r.life*4); }
      else{ r.mesh.intensity=Math.max(0,r.mesh.intensity-dt*24); }
      if(r.life<=0){ scene.remove(r.mesh); rings.splice(i,1); }
    }
 
    /* camera */
    const focus=P.dead?E.pos:P.pos;
    const lookTarget=tmpV.copy(focus).lerp(E.dead?focus:E.pos,0.3).setY(3.25+(P.special?P.y*0.4:0));
    const camYawIdeal=P.dead?t*0.3:Math.atan2(focus.x-lookTarget.x, focus.z-lookTarget.z);
    const behind=tmpV2.set(Math.sin(camYawIdeal),0,Math.cos(camYawIdeal));
    const camH = 9.4 + (P.special&&P.y>2? P.y*0.55:0);
    const desired=focus.clone().addScaledVector(behind,15).setY(camH);
    camera.position.lerp(desired, Math.min(1,dt*4));
    if(shake>0){ shake=Math.max(0,shake-dt*1.4);
      camera.position.x+=(Math.random()-0.5)*shake;
      camera.position.y+=(Math.random()-0.5)*shake*0.6;
      camera.position.z+=(Math.random()-0.5)*shake; }
    camera.lookAt(lookTarget);
 
    UI.reticle.style.left=mouse.x+'px'; UI.reticle.style.top=mouse.y+'px';
    const gcd=GUN_CD_BASE[P.bot.cfg.gun];
    UI.cfGun.style.height=(P.gunCd/gcd*100)+'%'; UI.slotGun.classList.toggle('ready',P.gunCd<=0);
    UI.cfSword.style.height=(P.swordCd/SWORD_CD*100)+'%'; UI.slotSword.classList.toggle('ready',P.swordCd<=0);
    UI.cfDash.style.height=(P.dashCd/DASH_CD*100)+'%'; UI.slotDash.classList.toggle('ready',P.dashCd<=0);
    UI.cfBall.style.height=(P.ballCd/BALL_CD*100)+'%'; UI.slotBall.classList.toggle('ready',P.ballCd<=0);
    UI.cfKick.style.height=(P.kickCd/KICK_CD*100)+'%'; UI.slotKick.classList.toggle('ready',P.kickCd<=0);
    UI.cfMeteor.style.height=(P.metCd/MET_CD*100)+'%'; UI.slotMeteor.classList.toggle('ready',P.metCd<=0);
    UI.cfTornado.style.height=(P.tornadoCd/TORNADO_CD*100)+'%'; UI.slotTornado.classList.toggle('ready',P.tornadoCd<=0);
    UI.cfShield.style.height=(P.shieldCd/SHIELD_CD*100)+'%'; UI.slotShield.classList.toggle('ready',P.shieldCd<=0);
    UI.cfGrapple.style.height=(P.grappleCd/GRAPPLE_CD*100)+'%'; UI.slotGrapple.classList.toggle('ready',P.grappleCd<=0);
    const combo=Math.max(0,Math.min(12,Math.floor((100-E.hp)/9)));
    UI.comboText.textContent=combo+' HIT';
    UI.timerText.textContent=Math.max(0,90-Math.floor((performance.now()/1000)%90));
    UI.energyText.textContent=Math.round((1-Math.min(1,P.gunCd/(GUN_CD_BASE[P.bot.cfg.gun]||1)))*100)+'%';
    UI.ultimateText.textContent=Math.min(100,Math.round((playerWins*35+(100-E.hp)*0.65)))+'%';
    UI.armorText.textContent=P.hp<35?'BREAK':P.shieldT>0?'SHIELD':'OK';
    UI.heatText.textContent=(mouse.down||touchMove.fire)?'HIGH':P.gunCd>0?'MED':'LOW';
    UI.miniP.style.left=(50+P.pos.x/ARENA*42)+'%'; UI.miniP.style.top=(50+P.pos.z/ARENA*42)+'%';
    UI.miniE.style.left=(50+E.pos.x/ARENA*42)+'%'; UI.miniE.style.top=(50+E.pos.z/ARENA*42)+'%';
  }
 
  renderer.render(scene, camera);
}
loop();
 
window.addEventListener('resize', ()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
