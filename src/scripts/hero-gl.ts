/**
 * Hero signal field — a hand-written WebGL fragment shader.
 *
 * No libraries: one fullscreen triangle, one domain-warped fbm pass, rendered
 * at a reduced resolution because the output is a soft light field. The loop is
 * paused when the canvas leaves the viewport, when the tab is hidden, and it
 * renders a single static frame under `prefers-reduced-motion`.
 *
 * If WebGL is unavailable the canvas is removed and the CSS aurora underneath
 * remains as the fallback.
 */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
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
`;

type Program = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  buffer: WebGLBuffer;
};

/**
 * Boot is scheduled after load on an idle slot: shader compilation and the
 * first frame are the only main-thread work this file does, and they should not
 * compete with the initial render.
 */
function boot(canvas: HTMLCanvasElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  // `?gl=force` renders the field even on software GL (visual inspection only).
  const forcedGl = new URLSearchParams(window.location.search).has("gl");

  const setup = (): Program | null => {
    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      }) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) return null;

    // Software rasterisers (SwiftShader, llvmpipe, headless CI, some VMs) burn
    // hundreds of milliseconds per frame on this shader. They get the CSS
    // aurora instead — the page is designed to be complete without WebGL.
    // `?gl=force` bypasses the check for visual inspection.
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? "")
      : "";

    if (!forcedGl && /swiftshader|llvmpipe|software|basic render/i.test(renderer)) {
      return null;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? "compile");
      }
      return shader;
    };

    try {
      const program = gl.createProgram();
      if (!program) return null;

      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );

      const aPos = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      return {
        gl,
        program,
        buffer,
        uniforms: {
          res: gl.getUniformLocation(program, "uRes"),
          time: gl.getUniformLocation(program, "uTime"),
          pointer: gl.getUniformLocation(program, "uPointer"),
          scroll: gl.getUniformLocation(program, "uScroll"),
        },
      };
    } catch {
      return null;
    }
  };

  const context = setup();

  if (!context) {
    canvas.remove();
  } else {
    const { gl, uniforms } = context;

    const state = {
      width: 0,
      height: 0,
      pointerX: 0,
      pointerY: 0,
      targetX: 0,
      targetY: 0,
      scroll: 0,
      time: 0,
      visible: true,
      frame: 0,
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cssW = Math.max(1, canvas.clientWidth);
      const cssH = Math.max(1, canvas.clientHeight);
      // The field is low-frequency, so it renders well below device resolution.
      // A fixed fragment budget keeps the first frame cheap on software GL and
      // low-end phones without changing what the eye sees.
      const budget = 460_000;
      const ceiling = window.matchMedia("(pointer: coarse)").matches ? 0.42 : 0.55;
      const scale = Math.min(ceiling, Math.sqrt(budget / (cssW * cssH * dpr * dpr)));

      state.width = Math.max(1, Math.round(cssW * dpr * scale));
      state.height = Math.max(1, Math.round(cssH * dpr * scale));
      canvas.width = state.width;
      canvas.height = state.height;
      gl.viewport(0, 0, state.width, state.height);
      gl.uniform2f(uniforms.res, state.width, state.height);
      if (reducedMotion) render(0);
    };

    const render = (elapsed: number) => {
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform2f(uniforms.pointer, state.pointerX, state.pointerY);
      gl.uniform1f(uniforms.scroll, state.scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      state.frame = requestAnimationFrame(loop);
      state.time = now / 1000;

      // Ease the pointer so the light trails instead of snapping.
      state.pointerX += (state.targetX - state.pointerX) * 0.06;
      state.pointerY += (state.targetY - state.pointerY) * 0.06;

      const rect = canvas.getBoundingClientRect();
      const progress =
        rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
      state.scroll = progress;

      render(state.time);
    };

    const start = () => {
      if (state.frame === 0 && !reducedMotion) {
        state.frame = requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      if (state.frame !== 0) {
        cancelAnimationFrame(state.frame);
        state.frame = 0;
      }
    };

    resize();

    // First-frame budget: if drawing one frame costs more than a couple of
    // frames' worth of time, the device cannot afford the field. Drop back to
    // the CSS aurora instead of shipping a janky background.
    const frameCost = performance.now();
    render(0);
    if (!forcedGl && performance.now() - frameCost > 45) {
      canvas.remove();
      return;
    }

    if (finePointer) {
      window.addEventListener(
        "pointermove",
        (event) => {
          const rect = canvas.getBoundingClientRect();
          if (rect.height === 0) return;
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = 0.5 - (event.clientY - rect.top) / rect.height;
          state.targetX = x * 2;
          state.targetY = y * 2;
        },
        { passive: true },
      );
    }

    if (!reducedMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0]?.isIntersecting ?? true;
          if (state.visible && document.visibilityState === "visible") start();
          else stop();
        },
        { threshold: 0 },
      );
      observer.observe(canvas);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && state.visible) start();
        else stop();
      });

      let resizeTimer = 0;
      window.addEventListener(
        "resize",
        () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(resize, 150);
        },
        { passive: true },
      );

      start();
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    canvas.dataset.glReady = "true";
  }
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

const heroCanvas = document.querySelector<HTMLCanvasElement>("[data-gl]");

if (heroCanvas) {
  const start = () => boot(heroCanvas);

  const schedule = () => {
    const idle = (window as IdleWindow).requestIdleCallback;
    if (typeof idle === "function") {
      idle(start, { timeout: 1200 });
    } else {
      window.setTimeout(start, 120);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

export {};
