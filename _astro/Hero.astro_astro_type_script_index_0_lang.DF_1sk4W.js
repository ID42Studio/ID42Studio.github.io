function e(e){let t=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,n=window.matchMedia(`(pointer: fine)`).matches,r=new URLSearchParams(window.location.search).has(`gl`),i=(()=>{let t=e.getContext(`webgl`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`low-power`})??e.getContext(`experimental-webgl`);if(!t)return null;let n=t.getExtension(`WEBGL_debug_renderer_info`),i=n?String(t.getParameter(n.UNMASKED_RENDERER_WEBGL)??``):``;if(!r&&/swiftshader|llvmpipe|software|basic render/i.test(i))return null;let a=(e,n)=>{let r=t.createShader(e);if(!r)throw Error(`shader`);if(t.shaderSource(r,n),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS))throw Error(t.getShaderInfoLog(r)??`compile`);return r};try{let e=t.createProgram();if(!e||(t.attachShader(e,a(t.VERTEX_SHADER,`
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`)),t.attachShader(e,a(t.FRAGMENT_SHADER,`
precision mediump float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  float t = uTime * 0.045;
  vec2 p = uv * 1.35;
  p.y += uScroll * 0.35;

  // Domain warp: the field folds into itself instead of scrolling.
  vec2 warp = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  float field = fbm(p + warp * 0.9 + vec2(t * 0.6, 0.0));

  float band = smoothstep(0.16, 0.94, field);
  float ridge = smoothstep(0.58, 1.0, field);

  vec3 ink = vec3(0.02, 0.02, 0.038);
  vec3 blue = vec3(0.16, 0.26, 0.95);
  vec3 violet = vec3(0.55, 0.32, 1.0);
  vec3 cyan = vec3(0.25, 0.95, 1.0);

  vec3 color = mix(ink, blue, band);
  color = mix(color, violet, ridge * 0.9);
  color += cyan * pow(ridge, 3.0) * 0.9;

  // Pointer light, soft and local.
  vec2 pointer = uPointer * vec2(1.6, 1.0);
  float d = length(uv - pointer);
  color += cyan * exp(-d * 3.0) * 0.25;

  // Keep the left half darker so the headline keeps its contrast.
  float sideMask = mix(0.34, 1.0, smoothstep(-0.85, 0.55, uv.x));
  color *= sideMask;

  // Vignette + bottom fade into the page background.
  color *= 1.0 - 0.45 * smoothstep(0.15, 1.3, length(uv * vec2(0.82, 1.0)));
  color *= 1.45;
  color *= smoothstep(-1.0, -0.15, -uv.y + 0.62);

  gl_FragColor = vec4(color, 1.0);
}
`)),t.linkProgram(e),!t.getProgramParameter(e,t.LINK_STATUS)))return null;t.useProgram(e);let n=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,n),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);let r=t.getAttribLocation(e,`aPos`);return t.enableVertexAttribArray(r),t.vertexAttribPointer(r,2,t.FLOAT,!1,0,0),{gl:t,program:e,buffer:n,uniforms:{res:t.getUniformLocation(e,`uRes`),time:t.getUniformLocation(e,`uTime`),pointer:t.getUniformLocation(e,`uPointer`),scroll:t.getUniformLocation(e,`uScroll`)}}}catch{return null}})();if(!i)e.remove();else{let{gl:a,uniforms:o}=i,s={width:0,height:0,pointerX:0,pointerY:0,targetX:0,targetY:0,scroll:0,time:0,visible:!0,frame:0},c=()=>{let n=Math.min(window.devicePixelRatio||1,1.5),r=Math.max(1,e.clientWidth),i=Math.max(1,e.clientHeight),c=window.matchMedia(`(pointer: coarse)`).matches?.42:.55,u=Math.min(c,Math.sqrt(46e4/(r*i*n*n)));s.width=Math.max(1,Math.round(r*n*u)),s.height=Math.max(1,Math.round(i*n*u)),e.width=s.width,e.height=s.height,a.viewport(0,0,s.width,s.height),a.uniform2f(o.res,s.width,s.height),t&&l(0)},l=e=>{a.uniform1f(o.time,e),a.uniform2f(o.pointer,s.pointerX,s.pointerY),a.uniform1f(o.scroll,s.scroll),a.drawArrays(a.TRIANGLES,0,3)},u=t=>{s.frame=requestAnimationFrame(u),s.time=t/1e3,s.pointerX+=(s.targetX-s.pointerX)*.06,s.pointerY+=(s.targetY-s.pointerY)*.06;let n=e.getBoundingClientRect(),r=n.height>0?Math.min(1,Math.max(0,-n.top/n.height)):0;s.scroll=r,l(s.time)},d=()=>{s.frame===0&&!t&&(s.frame=requestAnimationFrame(u))},f=()=>{s.frame!==0&&(cancelAnimationFrame(s.frame),s.frame=0)};c();let p=performance.now();if(l(0),!r&&performance.now()-p>45){e.remove();return}if(n&&window.addEventListener(`pointermove`,t=>{let n=e.getBoundingClientRect();if(n.height===0)return;let r=(t.clientX-n.left)/n.width-.5,i=.5-(t.clientY-n.top)/n.height;s.targetX=r*2,s.targetY=i*2},{passive:!0}),t)window.addEventListener(`resize`,c,{passive:!0});else{new IntersectionObserver(e=>{s.visible=e[0]?.isIntersecting??!0,s.visible&&document.visibilityState===`visible`?d():f()},{threshold:0}).observe(e),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&s.visible?d():f()});let t=0;window.addEventListener(`resize`,()=>{window.clearTimeout(t),t=window.setTimeout(c,150)},{passive:!0}),d()}e.dataset.glReady=`true`}}var t=document.querySelector(`[data-gl]`);if(t){let n=()=>e(t),r=()=>{let e=window.requestIdleCallback;typeof e==`function`?e(n,{timeout:1200}):window.setTimeout(n,120)};document.readyState===`complete`?r():window.addEventListener(`load`,r,{once:!0})}