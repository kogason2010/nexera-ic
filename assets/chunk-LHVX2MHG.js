import{A as ze,B as Ge,C as Ie,D as be,E as De,n as H,o as j,p as xe,q as we,r as He,s as Oe,v as i,w as Be,x as _e,z as Le}from"./chunk-66DKLHT2.js";import{d as ae,e as Ce,f as N,g as ie}from"./chunk-656KD425.js";import{A as Ye,F as Z,H as qe,I as Ze,J as $e,K as X,M as Ke,N as Qe,O as me,P as M,Q as Je,R as et,S as tt,a as ke,b as Ue,c as ee,d as I,e as Ne,h as D,i as le,k as y,l as We,o as k,p as je,q as E,r as F,s as Se,u as C,v as Xe,x as ue,y as te}from"./chunk-BYJ243GT.js";import{c as w,e as q,f as O,g as Ve,i as G}from"./chunk-VHUA7NEF.js";function ot(){return M((r,s)=>{let l=G.progress,t=1-Math.exp(-s*6);i.p+=(l-i.p)*t,Math.abs(l-i.p)<1e-5&&(i.p=l);let e=i.p;i.sim=Le(e),i.inject=ze(e),i.reveal=Ge(e),i.fade=Ie(e),i.signal=Oe(i.sim),i.time=r.clock.elapsedTime},-10),null}var oe=w(q(),1);function rt({reducedMotion:r}){let{camera:s,size:l}=me(),t=(0,oe.useMemo)(()=>({pos:[0,0,0],target:[0,0,0]}),[]),e=(0,oe.useMemo)(()=>new y,[]),m=(0,oe.useMemo)(()=>new y,[]),n=(0,oe.useMemo)(()=>new y(-9,.3,0),[]),o=(0,oe.useMemo)(()=>new le,[]);return M((a,c)=>{let h=l.width/l.height;if(r?(e.fromArray(be.pos),m.fromArray(be.target)):(De(i.p,t),e.fromArray(t.pos),m.fromArray(t.target)),h<1.25){let f=e.clone().sub(m),d=D.clamp(1.25/h,1,2.3);e.copy(m).add(f.multiplyScalar(d)),i.p<.2&&!r&&(m.x+=1.3,e.x+=1.3)}let x=r?0:1;o.x+=(G.pointerX*x-o.x)*(1-Math.exp(-c*3)),o.y+=(G.pointerY*x-o.y)*(1-Math.exp(-c*3)),e.x+=o.x*.45,e.y+=o.y*.3,s.position.lerp(e,1-Math.exp(-c*5)),n.lerp(m,1-Math.exp(-c*5)),s.lookAt(n)}),null}var L=w(q(),1);var at=`
  uniform float uTime;
  uniform float uSim;
  uniform float uInject;
  uniform float uReveal;
  uniform float uFade;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uInlet;
  uniform float uOutlet;
  uniform float uDetector;
  uniform float uRadius;
  uniform float uSigma0;
  uniform float uDisp;
  uniform float uMotion;
  uniform vec3 uCloud;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform float uK[7];
  uniform vec3 uColors[7];
  uniform float uSuppressor;

  attribute float aPop;
  attribute vec4 aSeed;   // x: N(0,1) axial, y: angle, z: radial (0..1), w: stagger (0..1)
  attribute vec3 aCloud;  // gaussian offset inside the injected sample plug

  varying vec3 vColor;
  varying float vAlpha;
  varying float vFlash;

  float kOf(float p) { return uK[int(p + 0.5)]; }
  vec3 colorOf(float p) { return uColors[int(p + 0.5)]; }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  void main() {
    float k = kOf(aPop);
    float retained = k / (1.0 + k);

    // --- 1. The mixed sample: a slowly turning plug of all analytes together.
    vec3 c = aCloud;
    c.xz = rot(uTime * 0.12 * uMotion + aSeed.w * 0.4) * c.xz;
    c.xy = rot(sin(uTime * 0.07 + aSeed.x) * 0.25 * uMotion) * c.xy;
    vec3 cloudPos = uCloud + c * 0.95;

    // --- 2. Inside the column.
    float tLocal = max(uSim, 0.0);
    float v = 1.0 / (1.0 + k);
    float dist = v * tLocal;
    float sigma = uSigma0 + uDisp * sqrt(dist);
    float x = uInlet + dist + aSeed.x * sigma;

    // radial position; retained analytes linger near the packed wall
    float wobble = 0.5 + 0.5 * sin(uTime * (0.9 + aSeed.w) + aSeed.y * 13.0);
    float r = aSeed.z * uRadius * 0.86;
    r = mix(r, uRadius * 0.9, retained * wobble * 0.55);
    // narrow connecting capillary between column outlet and flow cell
    r *= mix(1.0, 0.28, smoothstep(uOutlet - 0.05, uOutlet + 0.25, x));
    float ang = aSeed.y + uTime * 0.25 * uMotion * (1.0 - retained);
    vec3 colPos = vec3(x, cos(ang) * r, sin(ang) * r);
    // Brownian shimmer
    colPos += 0.012 * vec3(sin(uTime * 3.1 + aSeed.y * 9.0), sin(uTime * 2.7 + aSeed.x * 7.0), cos(uTime * 2.3 + aSeed.w * 11.0)) * uMotion;


    // --- 3. Injection: plug \u2192 column, staggered per particle along an arc.
    float fi = smoothstep(0.0, 1.0, clamp(uInject * 1.7 - aSeed.w * 0.7, 0.0, 1.0));
    vec3 pos = mix(cloudPos, colPos, fi);
    pos.y += sin(fi * 3.14159) * 0.35 * (1.0 - aSeed.z * 0.5);

    // --- 4. Pointer: a gentle displacement field around the cursor ray.
    vec3 dp = pos - uPointer;
    float d2 = dot(dp, dp);
    pos += normalize(dp + 1e-4) * exp(-d2 * 2.2) * 0.22 * uPointerStrength;

    // --- Appearance
    vec3 mixed = vec3(0.78, 0.86, 0.95);
    vColor = mix(mixed, colorOf(aPop), uReveal);

    float passed = smoothstep(uDetector + 0.25, uDetector + 1.9, pos.x);
    vFlash = (exp(-pow((pos.x - uDetector) / 0.16, 2.0)) + 0.35 * exp(-pow((pos.x - uSuppressor) / 0.2, 2.0))) * fi;
    vAlpha = (1.0 - passed) * uFade * (0.55 + 0.45 * aSeed.z);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + 0.8 * fract(aSeed.w * 17.0)) * (1.0 + vFlash * 1.4);
    gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);
    // soft depth attenuation
    vAlpha *= smoothstep(26.0, 6.0, -mv.z) * 0.85 + 0.15;
  }
`,it=`
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFlash;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    core = pow(core, 1.8);
    vec3 col = vColor * (0.9 + vFlash * 2.2) + vec3(1.0) * vFlash * 0.35;
    gl_FragColor = vec4(col, core * vAlpha);
  }
`,nt=`
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uOpacity;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (9.0 + aSeed * 10.0) * uPixelRatio / -mv.z;
    vA = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 0.6 + aSeed * 40.0))) * uOpacity;
  }
`,st=`
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vec3(0.55, 0.63, 0.74), a * vA * 0.32);
  }
`,lt=`
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.1 + aSeed * 30.0) * 0.25;
    p.x += cos(uTime * 0.08 + aSeed * 20.0) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (14.0 + aSeed * 22.0) * uPixelRatio / -mv.z;
    vA = 0.12 + aSeed * 0.18;
  }
`,ut=`
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.62, 0.72, 0.86, smoothstep(0.5, 0.0, d) * vA);
  }
`,mt=`
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uInlet;
  uniform float uOutlet;
  uniform float uSuppressor;
  uniform float uRadius;
  uniform float uVis;
  attribute vec4 aSeed;
  varying float vA;
  void main() {
    float L = uSuppressor + 0.8 - (uInlet - 0.6);
    float x = (uInlet - 0.6) + mod(aSeed.x * L + uTime * 0.55, L);
    float r = sqrt(aSeed.y) * uRadius * 0.9;
    r *= mix(1.0, 0.28, smoothstep(uOutlet - 0.05, uOutlet + 0.25, x));
    float a = aSeed.z * 6.2831 + uTime * 0.3;
    vec3 p = vec3(x, cos(a) * r, sin(a) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (10.0 + aSeed.w * 8.0) * uPixelRatio / -mv.z;
    float gone = smoothstep(uSuppressor - 0.3, uSuppressor + 0.25, x);
    vA = (1.0 - gone) * uVis * (0.35 + 0.65 * aSeed.w);
  }
`,ct=`
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(1.0, 0.86, 0.66, smoothstep(0.5, 0.1, d) * vA * 0.5);
  }
`;var pt=w(O(),1),ce=new y(-7.6,.35,0);function ft({count:r,reducedMotion:s}){let{gl:l,camera:t,size:e}=me(),m=(0,L.useRef)(null),n=(0,L.useMemo)(()=>{let f=N(7),d=new Float32Array(r),g=new Float32Array(r*4),v=new Float32Array(r*3),R=new Float32Array(r*3);for(let T=0;T<r;T++)d[T]=T%j.length,g[T*4]=Math.max(-3,Math.min(3,ie(f))),g[T*4+1]=f()*Math.PI*2,g[T*4+2]=Math.sqrt(f()),g[T*4+3]=f(),v[T*3]=ie(f)*.55,v[T*3+1]=ie(f)*.42,v[T*3+2]=ie(f)*.55;let A=new F;return A.setAttribute("position",new E(R,3)),A.setAttribute("aPop",new E(d,1)),A.setAttribute("aSeed",new E(g,4)),A.setAttribute("aCloud",new E(v,3)),A.boundingSphere=new We(new y(0,0,0),30),A},[r]),o=(0,L.useMemo)(()=>new C({vertexShader:at,fragmentShader:it,transparent:!0,depthWrite:!1,blending:I,uniforms:{uTime:{value:0},uSim:{value:0},uInject:{value:0},uReveal:{value:0},uFade:{value:1},uPixelRatio:{value:1},uSize:{value:26},uInlet:{value:H.inlet},uOutlet:{value:H.outlet},uDetector:{value:H.detector},uSuppressor:{value:H.suppressor},uRadius:{value:H.radius},uSigma0:{value:H.sigma0},uDisp:{value:H.dispersion},uMotion:{value:1},uCloud:{value:ce.clone()},uPointer:{value:new y(99,99,99)},uPointerStrength:{value:0},uK:{value:j.map(f=>f.k)},uColors:{value:j.map(f=>new k(f.color))}}}),[]);(0,L.useEffect)(()=>()=>{n.dispose()},[n]),(0,L.useEffect)(()=>()=>o.dispose(),[o]);let a=(0,L.useMemo)(()=>new Qe,[]),c=(0,L.useMemo)(()=>new Xe(new y(0,0,1),0),[]),h=(0,L.useMemo)(()=>new y,[]),x=(0,L.useMemo)(()=>new le,[]);return M((f,d)=>{let g=o.uniforms;g.uTime.value=i.time,g.uSim.value=i.sim,g.uInject.value=i.inject,g.uReveal.value=i.reveal,g.uFade.value=i.fade,g.uPixelRatio.value=l.getPixelRatio(),g.uMotion.value=s?.15:1,g.uSize.value=e.width<700?34:26,x.set(G.pointerX,G.pointerY),a.setFromCamera(x,t),a.ray.intersectPlane(c,h)&&g.uPointer.value.lerp(h,1-Math.exp(-d*8));let v=s?0:1;g.uPointerStrength.value+=(v-g.uPointerStrength.value)*(1-Math.exp(-d*3))}),(0,pt.jsx)("points",{ref:m,geometry:n,material:o,frustumCulled:!1})}var P=w(q(),1);var fe=`
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPosW;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,pe=`
  uniform vec3 uTint;
  uniform vec3 uLightPos;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPosW;
  varying vec2 vUv;
  void main() {
    vec3 n = normalize(vNormalW);
    if (!gl_FrontFacing) n = -n;
    float fres = pow(1.0 - abs(dot(n, vViewDir)), 2.6);
    vec3 l = normalize(uLightPos - vPosW);
    vec3 h = normalize(l + vViewDir);
    float spec = pow(max(dot(n, h), 0.0), 60.0);
    // fine axial machining lines on the glass
    float lines = 0.5 + 0.5 * sin(vPosW.x * 60.0);
    vec3 col = uTint * (0.25 + fres * 1.4) + vec3(1.0) * spec * 0.45;
    float a = (0.035 + fres * 0.55 + spec * 0.22 + lines * 0.01) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`,Ae=`
  uniform float uT;
  uniform float uHeadX;
  uniform float uScale;
  uniform float uBase;
  uniform float uHeight;
  attribute float aT;
  attribute float aS;      // signal value at aT
  attribute float aFill;   // 1 = curve vertex, 0 = baseline vertex (fill only)
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFillV;
  void main() {
    float x = uHeadX - (uT - aT) * uScale;
    float y = uBase + aS * uHeight * aFill;
    vColor = aColor;
    vFillV = aFill;
    // invisible until the detector has produced this sample
    vAlpha = step(aT, uT) * smoothstep(0.0, 1.2, uT - aT + 1.2);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, 0.0, 1.0);
  }
`,dt=`
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(mix(vec3(0.9, 0.95, 1.0), vColor, 0.65), vAlpha * uOpacity);
  }
`,vt=`
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFillV;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha * uOpacity * 0.28 * vFillV);
  }
`,Et=`
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,gt=`
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = abs(dot(normalize(vN), normalize(vV)));
    float core = pow(facing, 2.5);
    float flicker = 0.94 + 0.06 * sin(uTime * 40.0 + vUv.y * 30.0);
    float ends = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    gl_FragColor = vec4(uColor * core * uIntensity * flicker * ends, 1.0);
  }
`;var _=w(O(),1),{inlet:K,outlet:ne,detector:ht,radius:de}=H,Me=ne-K,Tt=(K+ne)/2;function Pe(r,s,l){return new C({vertexShader:fe,fragmentShader:pe,transparent:!0,depthWrite:!1,side:l,uniforms:{uTint:{value:new k(r)},uLightPos:{value:new y(0,4,6)},uOpacity:{value:s},uTime:{value:0}}})}function yt({bedCount:r}){let s=(0,P.useMemo)(()=>Pe("#6f8db3",.6,Ue),[]),l=(0,P.useMemo)(()=>Pe("#9fc3ea",1,ke),[]),t=(0,P.useMemo)(()=>Pe("#8fb2d8",.9,ee),[]),e=(0,P.useMemo)(()=>new X({color:"#9aa4b1",metalness:1,roughness:.26,envMapIntensity:1.1}),[]),m=(0,P.useMemo)(()=>new X({color:"#2a3038",metalness:.9,roughness:.38,envMapIntensity:.9}),[]),n=(0,P.useMemo)(()=>{let v=N(21),R=new Float32Array(r*3),A=new Float32Array(r);for(let z=0;z<r;z++){let U=Math.sqrt(v())*de*.95,se=v()*Math.PI*2;R[z*3]=K+v()*Me,R[z*3+1]=Math.cos(se)*U,R[z*3+2]=Math.sin(se)*U,A[z]=v()}let T=new F;T.setAttribute("position",new E(R,3)),T.setAttribute("aSeed",new E(A,1));let Y=new C({vertexShader:nt,fragmentShader:st,transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uPixelRatio:{value:1},uOpacity:{value:1}}});return{g:T,m:Y}},[r]),o=(0,P.useMemo)(()=>new Ye([new y(ce.x+.9,ce.y-.05,0),new y(K-1.15,.22,0),new y(K-.6,0,0)]),[]),a=(0,P.useMemo)(()=>new $e(o,48,.07,16,!1),[o]),c=(0,P.useMemo)(()=>new Z(.1,.1,ht-ne+.3,20,1,!0).rotateZ(Math.PI/2),[]),h=(0,P.useMemo)(()=>new Z(de+.04,de+.04,Me,64,1,!0).rotateZ(Math.PI/2),[]),x=(0,P.useMemo)(()=>new Z(.44,.44,.36,48).rotateZ(Math.PI/2),[]),f=(0,P.useMemo)(()=>new Z(.26,.26,.26,6).rotateZ(Math.PI/2),[]),d=(0,P.useMemo)(()=>new Ze(de+.045,.004,6,64).rotateY(Math.PI/2),[]),g=(0,P.useMemo)(()=>Array.from({length:21},(v,R)=>K+R/20*Me),[]);return(0,P.useEffect)(()=>()=>{[s,l,t,e,m,n.m].forEach(v=>v.dispose()),[n.g,a,c,h,x,f,d].forEach(v=>v.dispose())},[s,l,t,e,m,n,a,c,h,x,f,d]),M(({gl:v})=>{let R=G.pointerX*6,A=3+G.pointerY*2;for(let T of[s,l,t])T.uniforms.uLightPos.value.set(R,A,6),T.uniforms.uTime.value=i.time;n.m.uniforms.uTime.value=i.time,n.m.uniforms.uPixelRatio.value=v.getPixelRatio()}),(0,_.jsxs)("group",{children:[(0,_.jsx)("points",{geometry:n.g,material:n.m,frustumCulled:!1}),(0,_.jsx)("mesh",{geometry:h,material:s,position:[Tt,0,0],renderOrder:1}),(0,_.jsx)("mesh",{geometry:h,material:l,position:[Tt,0,0],renderOrder:3}),g.map((v,R)=>(0,_.jsx)("mesh",{geometry:d,position:[v,0,0],renderOrder:3,children:(0,_.jsx)("meshBasicMaterial",{color:"#9fb7d4",transparent:!0,opacity:R%5===0?.55:.18,depthWrite:!1})},R)),[K-.18,ne+.18].map((v,R)=>(0,_.jsxs)("group",{position:[v,0,0],children:[(0,_.jsx)("mesh",{geometry:x,material:e}),(0,_.jsx)("mesh",{geometry:f,material:m,position:[R===0?-.3:.3,0,0]})]},R)),(0,_.jsx)("mesh",{geometry:a,material:t,renderOrder:2}),(0,_.jsx)("mesh",{geometry:c,material:t,position:[(ne+ht)/2+.15,0,0],renderOrder:2})]})}var b=w(q(),1);var Q=w(q(),1);var J=w(O(),1),B=900,Rt=[0,0,.22,0,.15,.6,0],S={headX:H.detector,scale:11/He,base:1.55,height:1.2};function xt(){let{line:r,fill:s,uniforms:l}=(0,Q.useMemo)(()=>{let n={uT:{value:0},uHeadX:{value:S.headX},uScale:{value:S.scale},uBase:{value:S.base},uHeight:{value:S.height},uOpacity:{value:1}},o=j.map(p=>new k(p.color)),a=new k("#cfe0f2"),c=new Float32Array(B),h=new Float32Array(B),x=new Float32Array(B*3),f=new k;for(let p=0;p<B;p++){let W=p/(B-1)*He,ge=0;f.setRGB(0,0,0);let he=0;j.forEach((ye,Re)=>{let re=ye.area*Ce(W,xe(ye.k),we(ye.k));ge+=re,f.r+=o[Re].r*re,f.g+=o[Re].g*re,f.b+=o[Re].b*re,he+=re}),ge+=.006*Math.sin(p*12.9898)*Math.cos(p*4.1414);let Te=he>.02?f.multiplyScalar(1/he):a;c[p]=W,h[p]=Math.max(0,ge),x.set([Te.r,Te.g,Te.b],p*3)}let d=new F;d.setAttribute("position",new E(new Float32Array(B*3),3)),d.setAttribute("aT",new E(c,1)),d.setAttribute("aS",new E(h,1)),d.setAttribute("aFill",new E(new Float32Array(B).fill(1),1)),d.setAttribute("aColor",new E(x,3));let g=new C({vertexShader:Ae,fragmentShader:dt,transparent:!0,depthWrite:!1,uniforms:n}),v=new te(d,g);v.frustumCulled=!1;let R=new Float32Array(B*2),A=new Float32Array(B*2),T=new Float32Array(B*2),Y=new Float32Array(B*6);for(let p=0;p<B;p++)R[p*2]=R[p*2+1]=c[p],A[p*2]=A[p*2+1]=h[p],T[p*2]=1,T[p*2+1]=0,Y.set(x.subarray(p*3,p*3+3),p*6),Y.set(x.subarray(p*3,p*3+3),p*6+3);let z=[];for(let p=0;p<B-1;p++){let W=p*2;z.push(W,W+1,W+2,W+1,W+3,W+2)}let U=new F;U.setAttribute("position",new E(new Float32Array(B*6),3)),U.setAttribute("aT",new E(R,1)),U.setAttribute("aS",new E(A,1)),U.setAttribute("aFill",new E(T,1)),U.setAttribute("aColor",new E(Y,3)),U.setIndex(z);let se=new C({vertexShader:Ae,fragmentShader:vt,transparent:!0,depthWrite:!1,side:ee,blending:I,uniforms:n}),Fe=new Se(U,se);return Fe.frustumCulled=!1,{line:v,fill:Fe,uniforms:n}},[]),t=(0,Q.useMemo)(()=>{let n=new F().setFromPoints([new y(0,0,0),new y(-1,0,0)]),o=new ue({color:"#7f93ab",transparent:!0,opacity:.35}),a=new te(n,o);return a.frustumCulled=!1,a},[]),e=(0,Q.useMemo)(()=>new Se(new qe(.035,16,16),new je({color:"#e6f3ff",toneMapped:!1})),[]);(0,Q.useEffect)(()=>()=>{r.geometry.dispose(),r.material.dispose(),s.geometry.dispose(),s.material.dispose(),t.geometry.dispose(),t.material.dispose(),e.geometry.dispose(),e.material.dispose()},[r,s,t,e]);let m=(0,Q.useMemo)(()=>new y,[]);return M(({camera:n,size:o})=>{let a=i.sim;l.uT.value=a;let c=ae(.17,.26,i.p);l.uOpacity.value=c;let h=Math.max(.001,a*S.scale);t.position.set(S.headX,S.base,0),t.scale.set(h,1,1),t.material.opacity=.35*c,e.position.set(S.headX,S.base+i.signal*S.height,0),e.visible=c>.01&&i.p<.9,j.forEach((f,d)=>{let g=Be[d];if(!g)return;let v=xe(f.k),R=we(f.k),A=f.area;m.set(S.headX-(a-v)*S.scale,S.base+A*S.height+.16+Rt[d%Rt.length],0),m.project(n);let T=(m.x*.5+.5)*o.width,Y=(-m.y*.5+.5)*o.height,z=ae(v+R*1.5,v+R*3.5,a)*ae(.5,.58,i.p);g.style.opacity=z.toFixed(3),g.style.transform=`translate3d(${T.toFixed(1)}px, ${Y.toFixed(1)}px, 0) translate(-50%, -100%)`});let x=_e.current;if(x){m.set(S.headX-a*S.scale*.5,S.base-.12,0),m.project(n);let f=(m.x*.5+.5)*o.width,d=(-m.y*.5+.5)*o.height;x.style.opacity=ae(.84,.92,i.p).toFixed(3),x.style.transform=`translate3d(${f.toFixed(1)}px, ${d.toFixed(1)}px, 0) translate(-50%, 0)`}}),(0,J.jsxs)("group",{children:[(0,J.jsx)("primitive",{object:s,renderOrder:6}),(0,J.jsx)("primitive",{object:r,renderOrder:7}),(0,J.jsx)("primitive",{object:t}),(0,J.jsx)("primitive",{object:e})]})}var u=w(O(),1),Pt=H.suppressor,Ft=H.detector;function wt(r,s){return new C({vertexShader:fe,fragmentShader:pe,transparent:!0,depthWrite:!1,side:ee,uniforms:{uTint:{value:new k(r)},uLightPos:{value:new y(5,3,5)},uOpacity:{value:s},uTime:{value:0}}})}function Ct(){let r=(0,b.useMemo)(()=>new X({color:"#1a2029",metalness:.8,roughness:.34,envMapIntensity:1}),[]),s=(0,b.useMemo)(()=>new X({color:"#a8b2bf",metalness:1,roughness:.22,envMapIntensity:1.2}),[]),l=(0,b.useMemo)(()=>wt("#9cc6ef",.9),[]),t=(0,b.useMemo)(()=>{let o=[];for(let c=0;c<=9;c++){let h=-.28+c/9*.56;o.push(new y(h,c%2?.17:-.17,.27))}return new F().setFromPoints(o)},[]),e=(0,b.useMemo)(()=>new ue({color:"#9fe0ff",transparent:!0,opacity:.6}),[]),m=(0,b.useMemo)(()=>new te(t,e),[t,e]),n=(0,b.useMemo)(()=>{let o=N(17),a=70,c=new Float32Array(a*3),h=new Float32Array(a);for(let d=0;d<a;d++)c[d*3]=(o()-.5)*.5,c[d*3+1]=o(),c[d*3+2]=(o()-.5)*.3,h[d]=o();let x=new F;x.setAttribute("position",new E(c,3)),x.setAttribute("aSeed",new E(h,1));let f=new C({transparent:!0,depthWrite:!1,blending:I,uniforms:{uTime:{value:0},uPixelRatio:{value:1},uOn:{value:0}},vertexShader:`
        uniform float uTime; uniform float uPixelRatio; uniform float uOn;
        attribute float aSeed; varying float vA;
        void main() {
          vec3 p = position;
          float t = fract(p.y + uTime * (0.25 + aSeed * 0.3));
          float side = aSeed > 0.5 ? 1.0 : -1.0;
          p.y = side * (0.32 + t * 0.55);
          p.x += sin(uTime * 2.0 + aSeed * 30.0) * 0.02;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (6.0 + aSeed * 8.0) * uPixelRatio / -mv.z;
          vA = (1.0 - t) * uOn;
        }`,fragmentShader:`
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float ring = smoothstep(0.5, 0.35, d) - smoothstep(0.3, 0.1, d) * 0.6;
          gl_FragColor = vec4(0.75, 0.9, 1.0, ring * vA * 0.8);
        }`});return{g:x,m:f}},[]);return(0,b.useEffect)(()=>()=>{[r,s,l,n.m,e].forEach(o=>o.dispose()),[t,n.g].forEach(o=>o.dispose())},[r,s,l,n,t,e]),M(({gl:o})=>{let a=D.smoothstep(i.p,.14,.24);n.m.uniforms.uTime.value=i.time,n.m.uniforms.uOn.value=a,n.m.uniforms.uPixelRatio.value=o.getPixelRatio(),l.uniforms.uTime.value=i.time;let c=.55+.25*Math.sin(i.time*2.2);e.opacity=(.25+c*.6)*(.3+.7*a)}),(0,u.jsxs)("group",{position:[Pt,0,0],children:[(0,u.jsx)("mesh",{material:r,position:[0,.36,0],children:(0,u.jsx)("boxGeometry",{args:[.78,.22,.56]})}),(0,u.jsx)("mesh",{material:r,position:[0,-.36,0],children:(0,u.jsx)("boxGeometry",{args:[.78,.22,.56]})}),(0,u.jsx)("mesh",{material:s,position:[-.4,0,0],children:(0,u.jsx)("boxGeometry",{args:[.04,.94,.6]})}),(0,u.jsx)("mesh",{material:s,position:[.4,0,0],children:(0,u.jsx)("boxGeometry",{args:[.04,.94,.6]})}),(0,u.jsx)("mesh",{material:l,renderOrder:4,children:(0,u.jsx)("boxGeometry",{args:[.74,.5,.54]})}),(0,u.jsx)("primitive",{object:m}),[.62,-.62].map(o=>(0,u.jsx)("mesh",{material:s,position:[.22,o,0],children:(0,u.jsx)("cylinderGeometry",{args:[.05,.05,.18,16]})},o)),(0,u.jsx)("points",{geometry:n.g,material:n.m,frustumCulled:!1})]})}function Vt(){let r=(0,b.useMemo)(()=>wt("#a9c8ee",.85),[]),s=(0,b.useMemo)(()=>new X({color:"#c6ced8",metalness:1,roughness:.18,envMapIntensity:1.3}),[]),l=(0,b.useMemo)(()=>new X({color:"#1d232b",metalness:.85,roughness:.32,envMapIntensity:1}),[]),t=(0,b.useMemo)(()=>new C({vertexShader:Et,fragmentShader:gt,transparent:!0,depthWrite:!1,blending:I,uniforms:{uColor:{value:new k("#8fd8ff")},uIntensity:{value:.3},uTime:{value:0}}}),[]),e=(0,b.useMemo)(()=>{let a=new F().setFromPoints([new y(0,.6,0),new y(0,S.base,0)]),c=new Ke({color:"#8fa9c6",dashSize:.05,gapSize:.05,transparent:!0,opacity:.4}),h=new te(a,c);return h.computeLineDistances(),h},[]),m=(0,b.useRef)(null),n=(0,b.useMemo)(()=>[-.16,-.08,0,.08,.16],[]),o=(0,b.useMemo)(()=>new Z(.012,.012,.44,8,1,!0),[]);return(0,b.useEffect)(()=>()=>{[r,s,l,t].forEach(a=>a.dispose()),o.dispose(),e.geometry.dispose(),e.material.dispose()},[r,s,l,t,o,e]),M(()=>{let a=D.smoothstep(i.p,.16,.24),c=i.signal;t.uniforms.uIntensity.value=a*(.25+2.2*c),t.uniforms.uTime.value=i.time,r.uniforms.uTime.value=i.time,m.current&&(m.current.intensity=a*(.6+6*c)),e.material.opacity=.4*D.smoothstep(i.p,.2,.3)}),(0,u.jsxs)("group",{position:[Ft,0,0],children:[(0,u.jsx)("mesh",{material:r,renderOrder:4,children:(0,u.jsx)("boxGeometry",{args:[.56,.56,.56]})}),(0,u.jsx)("mesh",{material:s,position:[0,.24,0],children:(0,u.jsx)("boxGeometry",{args:[.42,.03,.34]})}),(0,u.jsx)("mesh",{material:s,position:[0,-.24,0],children:(0,u.jsx)("boxGeometry",{args:[.42,.03,.34]})}),n.map(a=>(0,u.jsx)("mesh",{geometry:o,material:t,position:[a,0,0],renderOrder:5},a)),(0,u.jsx)("mesh",{material:l,position:[0,-.5,0],children:(0,u.jsx)("boxGeometry",{args:[.7,.18,.62]})}),(0,u.jsx)("mesh",{material:l,position:[0,.5,0],children:(0,u.jsx)("boxGeometry",{args:[.7,.18,.62]})}),(0,u.jsx)("primitive",{object:e}),(0,u.jsx)("pointLight",{ref:m,color:"#8fd8ff",distance:3,decay:2,position:[0,0,.5]})]})}function Ht(){return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(Ct,{}),(0,u.jsx)(Vt,{})]})}var ve=w(q(),1);var St=w(O(),1);function bt({count:r=600}){let{g:s,m:l}=(0,ve.useMemo)(()=>{let t=N(99),e=new Float32Array(r*3),m=new Float32Array(r);for(let a=0;a<r;a++)e[a*3]=(t()-.5)*34,e[a*3+1]=(t()-.5)*14,e[a*3+2]=-t()*18+3,m[a]=t();let n=new F;n.setAttribute("position",new E(e,3)),n.setAttribute("aSeed",new E(m,1));let o=new C({vertexShader:lt,fragmentShader:ut,transparent:!0,depthWrite:!1,blending:I,uniforms:{uTime:{value:0},uPixelRatio:{value:1}}});return{g:n,m:o}},[r]);return(0,ve.useEffect)(()=>()=>{s.dispose(),l.dispose()},[s,l]),M(({gl:t})=>{l.uniforms.uTime.value=i.time,l.uniforms.uPixelRatio.value=t.getPixelRatio()}),(0,St.jsx)("points",{geometry:s,material:l,frustumCulled:!1})}var Ee=w(q(),1);var Mt=w(O(),1);function At({count:r}){let{g:s,m:l}=(0,Ee.useMemo)(()=>{let t=N(3),e=new Float32Array(r*3),m=new Float32Array(r*4);for(let a=0;a<r*4;a++)m[a]=t();let n=new F;n.setAttribute("position",new E(e,3)),n.setAttribute("aSeed",new E(m,4));let o=new C({vertexShader:mt,fragmentShader:ct,transparent:!0,depthWrite:!1,blending:I,uniforms:{uTime:{value:0},uPixelRatio:{value:1},uInlet:{value:H.inlet},uOutlet:{value:H.outlet},uSuppressor:{value:H.suppressor},uRadius:{value:H.radius},uVis:{value:0}}});return{g:n,m:o}},[r]);return(0,Ee.useEffect)(()=>()=>{s.dispose(),l.dispose()},[s,l]),M(({gl:t})=>{let e=i.p,m=D.smoothstep(e,.12,.22)*.55,n=D.smoothstep(e,.42,.47)*(1-D.smoothstep(e,.58,.64));l.uniforms.uVis.value=(m+n*.9)*(1-D.smoothstep(e,.9,1)*.6),l.uniforms.uTime.value=i.time,l.uniforms.uPixelRatio.value=t.getPixelRatio()}),(0,Mt.jsx)("points",{geometry:s,material:l,frustumCulled:!1})}var V=w(O(),1);function Ot({active:r,reducedMotion:s,onReady:l}){let t=Ve();return(0,V.jsxs)(Je,{className:"hero-canvas",frameloop:r?"always":"never",dpr:t.dpr,camera:{fov:38,near:.1,far:80,position:[-9.6,.9,6.6]},gl:{antialias:t.tier!=="low",alpha:!0,powerPreference:"high-performance"},onCreated:({gl:e})=>{e.setClearColor(0,0),e.toneMapping=Ne,e.toneMappingExposure=1.05,requestAnimationFrame(()=>l?.())},"aria-hidden":"true",children:[(0,V.jsx)(ot,{}),(0,V.jsx)(rt,{reducedMotion:s}),(0,V.jsx)(tt,{intensity:.55}),(0,V.jsx)("ambientLight",{intensity:.15}),(0,V.jsx)("directionalLight",{position:[4,6,5],intensity:.9,color:"#dfe9ff"}),(0,V.jsx)("directionalLight",{position:[-6,-2,-4],intensity:.5,color:"#ffcf9e"}),(0,V.jsx)(yt,{bedCount:t.bedParticles}),(0,V.jsx)(Ht,{}),(0,V.jsx)(At,{count:t.tier==="low"?900:2400}),(0,V.jsx)(ft,{count:t.heroParticles,reducedMotion:s}),(0,V.jsx)(xt,{}),(0,V.jsx)(bt,{count:t.tier==="low"?250:600}),(0,V.jsx)(et,{min:t.dpr[0],max:t.dpr[1]})]})}export{Ot as default};
