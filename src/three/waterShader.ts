// src/three/waterShader.ts
// Realistic GLSL Rippling Water Shader (Pure-ASCII GLSL for 100% WebGL/ANGLE compatibility)

import * as THREE from 'three';

export interface WaterSystem {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  reflectionTarget: THREE.WebGLRenderTarget;
  reflectionCamera: THREE.PerspectiveCamera;
  textureMatrix: THREE.Matrix4;
  setShoreZ: (z: number) => void;
  update: (elapsedSec: number) => void;
  renderReflection: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, mainCamera: THREE.PerspectiveCamera) => void;
  dispose: () => void;
}

const BIAS_MATRIX = new THREE.Matrix4().set(
  0.5, 0.0, 0.0, 0.5,
  0.0, 0.5, 0.0, 0.5,
  0.0, 0.0, 0.5, 0.5,
  0.0, 0.0, 0.0, 1.0
);

const REFLECTION_CLIP_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.03);
const EMPTY_CLIP_PLANES: THREE.Plane[] = [];

const WATER_VERTEX_SHADER = /* glsl */ `
  uniform mat4 uTextureMatrix;
  uniform float uTime;
  varying vec4 vReflCoord;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    // Gentle two-layer vertical surface ripple matching floating krathongs
    float waveLift =
      sin(worldPos.x * 0.95 + uTime * 1.35) * cos(worldPos.z * 2.6 - uTime * 1.85) * 0.022 +
      sin(worldPos.z * 5.2 + worldPos.x * 1.4 - uTime * 2.2) * 0.010;
    worldPos.y += waveLift;

    vWorldPos = worldPos.xyz;
    vReflCoord = uTextureMatrix * worldPos;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const WATER_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uReflectionMap;
  uniform float uTime;
  uniform vec3 uMoonDir;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uRippleHighlight;
  uniform vec3 uCrestFoam;
  uniform vec3 uShoreGold;
  uniform vec3 uMoonColor;
  uniform float uDistortionX;
  uniform float uDistortionZ;
  uniform float uShoreZ;
  uniform float uHasReflection;
  uniform float uIsCircularPond;
  uniform float uPondRadius;
  uniform float uIsPreview;

  varying vec4 vReflCoord;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  // Glossy horizontal liquid ripple bands with domain-warped organic pinching (fast GPU ALU math)
  vec4 getWaterWave(vec2 p, float t) {
    vec2 wp = uIsPreview > 0.5 ? vec2(p.x * 2.15, p.y * 2.65) : vec2(p.x * 1.15, p.y * 1.45);

    float dx = 0.0;
    float dz = 0.0;
    float signedWave = 0.0;

    float warp1 = sin(wp.x * 0.85 + wp.y * 1.35 - t * 0.65) * 0.95;
    float warp2 = cos(wp.y * 1.75 - wp.x * 0.95 - t * 0.75) * 0.85;

    // Layer 1: Primary glossy horizontal liquid ridges with rounded pinching lobes
    float a1 = wp.y * 4.2 + wp.x * 0.55 + warp1 - t * 1.45;
    float pinch1 = 0.70 + 0.30 * cos(wp.x * 0.95 - wp.y * 1.25 + t * 0.55);
    float c1 = cos(a1) * pinch1;
    dx += c1 * 0.16;
    dz += c1 * 0.48;
    signedWave += sin(a1) * pinch1 * 0.44;

    // Layer 2: Interlocking counter-angled liquid ribbons forming oval ripple pockets
    float a2 = wp.y * 8.8 - wp.x * 1.20 + warp2 + t * 1.90;
    float pinch2 = 0.66 + 0.34 * sin(wp.x * 1.50 + wp.y * 1.90 + t * 0.80);
    float c2 = cos(a2) * pinch2;
    dx += c2 * -0.20;
    dz += c2 * 0.50;
    signedWave += sin(a2) * pinch2 * 0.38;

    // Layer 3: Crisp medium-fine horizontal sunlit ripples
    float a3 = wp.y * 16.0 + wp.x * 2.10 - warp1 * 0.65 - t * 2.50;
    float c3 = cos(a3);
    dx += c3 * 0.18;
    dz += c3 * 0.42;
    signedWave += sin(a3) * 0.28;

    // Layer 4: Fine glassy ripples plus concentric krathong rings in preview mode
    if (uIsPreview < 0.5) {
      float a4 = wp.y * 28.5 - wp.x * 3.40 + warp2 * 0.5 + t * 3.15;
      float c4 = cos(a4);
      dx += c4 * -0.12;
      dz += c4 * 0.30;
      signedWave += sin(a4) * 0.18;
    } else {
      float a4 = wp.y * 23.0 - wp.x * 2.60 + warp2 * 0.4 + t * 2.85;
      float c4 = cos(a4);
      dx += c4 * -0.10;
      dz += c4 * 0.24;
      signedWave += sin(a4) * 0.16;

      // Concentric water ripple rings radiating outward from krathong base
      float r = length(p);
      float ringEnv = smoothstep(0.42, 0.85, r) / (1.0 + max(r - 0.72, 0.0) * 0.85);
      float ringPhase = r * 14.5 - t * 3.5;
      float ringSin = sin(ringPhase) * ringEnv;
      float ringCos = cos(ringPhase) * ringEnv;
      vec2 radDir = p / max(r, 0.001);
      dx += radDir.x * ringCos * 0.34;
      dz += radDir.y * ringCos * 0.34;
      signedWave += ringSin * 0.36;
    }

    vec3 n = normalize(vec3(-dx, 1.0, -dz));
    return vec4(n, clamp(0.5 + 0.5 * signedWave, 0.0, 1.0));
  }

  void main() {
    vec4 wave = getWaterWave(vWorldPos.xz, uTime);
    vec3 normal = wave.xyz;
    float waveH = wave.w;
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    // Fast quadratic Fresnel approximation (zero pow/log2/exp2 overhead)
    float invV = 1.0 - max(dot(viewDir, normal), 0.0);
    float fresnel = clamp(0.16 + 0.84 * (invV * invV), 0.0, 1.0);

    // Glossy liquid wave slope parameter (-1 = back trough, 0 = contour edge, +1 = sky-facing ridge)
    float rawSlope = normal.z * 1.95 + (waveH - 0.5) * 0.85;

    // 1. Crisp transition from rich teal trough (#08586b) to bright turquoise body (#16bdd9)
    float skyFace = smoothstep(-0.12, 0.20, rawSlope);
    vec3 waterColor = mix(uDeepColor, uShallowColor, skyFace);

    // 2. Subsurface crystal caustic shimmer
    float caustic = 0.5 + 0.5 * sin(vWorldPos.x * 2.4 + vWorldPos.z * 3.3 - uTime * 1.65);
    waterColor = mix(waterColor, uRippleHighlight, caustic * 0.18);

    // 3. Luminous cyan-aqua upper wave face (#67f5ff)
    float crestFace = smoothstep(0.06, 0.44, rawSlope);
    waterColor = mix(waterColor, uRippleHighlight, clamp(crestFace * 0.78 + skyFace * 0.14, 0.0, 0.90));

    // 4. Gleaming icy-white aqua ribbon core (#f0fdff) inside each glossy horizontal ripple ridge
    float glossCore = smoothstep(0.30, 0.66, rawSlope);
    float clTmp = smoothstep(0.60, 0.92, waveH * 0.58 + clamp(normal.z + 0.35, 0.0, 1.0) * 0.42);
    float crestLine = clTmp * clTmp;
    waterColor = mix(waterColor, uCrestFoam, clamp(glossCore * 0.64 + crestLine * 0.34, 0.0, 0.88));

    // 5. Crisp dark-teal liquid contour rim at the wave inflection boundary (fast smoothstep, zero exp/pow)
    float contourEdge = 1.0 - smoothstep(0.0, 0.15, abs(rawSlope + 0.08));
    waterColor = mix(waterColor, uDeepColor * 0.74, contourEdge * 0.40);

    // Gentle sky-aqua Fresnel sheen
    vec3 col = mix(waterColor, mix(uShallowColor, uRippleHighlight, 0.58), fresnel * 0.32);

    float distShore = max(0.0, vWorldPos.z - uShoreZ);

    // 6. Warm golden-amber reflection ribbons nested inside wave troughs (reference photo look)
    float troughPocket = (1.0 - smoothstep(-0.02, 0.16, rawSlope)) * smoothstep(-0.62, -0.10, rawSlope);
    float csTmp = smoothstep(0.24, 0.56, rawSlope);
    float crestSparkle = csTmp * csTmp;

    if (uIsPreview < 0.5) {
      float shoreMask = 0.28 + 0.72 / (1.0 + distShore * 0.15);
      float pumpkinGlow = 0.85 / (1.0 + abs(vWorldPos.x) * 0.15);
      float flankLamps = 0.50 + 0.50 * cos(vWorldPos.x * 0.78 + normal.x * 3.5);
      float goldWavePattern = 0.45 + 0.55 * sin(vWorldPos.x * 1.15 + vWorldPos.z * 2.4 + normal.x * 6.0 - uTime * 1.1);

      float goldTroughBand = troughPocket * shoreMask * (0.45 + pumpkinGlow * 0.55 + flankLamps * 0.35) * (0.55 + 0.45 * goldWavePattern);
      vec3 warmAmberGold = mix(vec3(0.88, 0.56, 0.12), uShoreGold, smoothstep(-0.42, -0.12, rawSlope));
      col = mix(col, warmAmberGold, clamp(goldTroughBand * 0.78, 0.0, 0.76));
      col += uShoreGold * crestSparkle * shoreMask * 0.22;

      // Clean white-gold moon specular sparkle along right water lane (pure multiplication powers)
      float moonDx = (vWorldPos.x - 8.2) * 0.18;
      float moonLane = (1.0 / (1.0 + moonDx * moonDx * 1.35)) * (1.0 - smoothstep(-14.0, 2.0, vWorldPos.z));
      vec3 halfVec = normalize(uMoonDir + viewDir);
      float nh = max(dot(normal, halfVec), 0.0);
      float nh2 = nh * nh;
      float nh4 = nh2 * nh2;
      float nh8 = nh4 * nh4;
      float nh16 = nh8 * nh8;
      float moonSpec = nh16 * nh16 * nh4;
      float moonWide = nh8 * nh2 * 0.20;
      col += uMoonColor * (moonSpec * 0.62 + moonWide * moonLane * 0.85);
    } else {
      // Customizer preview mode: glossy turquoise ripples with warm golden trough ribbons
      float backGlow = 0.35 + 0.65 * (1.0 - smoothstep(-4.5, 3.8, vWorldPos.z));
      float streak1 = 0.5 + 0.5 * sin(vWorldPos.x * 1.45 + uTime * 1.3 + normal.x * 7.0);
      float streak2 = 0.5 + 0.5 * cos(vWorldPos.x * 2.60 - uTime * 1.1 + normal.z * 8.5);
      float goldTroughBand = troughPocket * backGlow * (0.38 + 0.62 * streak1 * streak2);
      vec3 warmAmberGold = mix(vec3(0.88, 0.56, 0.12), uShoreGold, smoothstep(-0.42, -0.12, rawSlope));
      col = mix(col, warmAmberGold, clamp(goldTroughBand * 0.72, 0.0, 0.70));
      col += uShoreGold * crestSparkle * backGlow * 0.20;

      float distCenter = length(vWorldPos.xz);
      float centerGlow = (1.0 / (1.0 + distCenter * 0.38)) * (0.68 + 0.32 * sin(distCenter * 12.0 - uTime * 3.0));
      col += mix(uRippleHighlight, uCrestFoam, 0.45) * centerGlow * 0.24;
    }

    vec3 finalColor = col;

    // Inverted 3D krathong planar reflection seen cleanly through crystal water
    if (uHasReflection > 0.5 && abs(vReflCoord.w) > 0.001) {
      vec2 projUv = vReflCoord.xy / vReflCoord.w;
      float damp = 1.0 / (1.0 + abs(vReflCoord.w) * 0.028);
      vec2 distort = vec2(normal.z * uDistortionX + normal.x * 0.025, normal.z * uDistortionZ) * damp;
      vec2 distortedUv = clamp(projUv + distort, vec2(0.002), vec2(0.998));
      vec4 reflSample = texture2D(uReflectionMap, distortedUv);

      float reflWeight = reflSample.a * clamp(0.62 + fresnel * 0.26, 0.0, 0.88);
      finalColor = mix(finalColor, reflSample.rgb * 1.04 + waterColor * 0.14, reflWeight);
    }

    // Subtle crisp sparkle on sharpest peaks (fast multiplication power)
    float ps = clamp(normal.z * 0.5 + waveH * 0.5, 0.0, 1.0);
    float ps2 = ps * ps;
    float ps4 = ps2 * ps2;
    float peakSparkle = ps4 * ps4 * ps2;
    finalColor += uCrestFoam * peakSparkle * 0.12;

    float alpha = 1.0;
    if (uIsCircularPond > 0.5) {
      float radial = length(vWorldPos.xz);
      alpha = 1.0 - smoothstep(uPondRadius * 0.72, uPondRadius, radial);
      if (alpha <= 0.01) discard;
    } else if (uIsPreview < 0.5) {
      // Gently blend top horizon into skyline while keeping water luminous
      float horizon = 1.0 - smoothstep(0.0, 4.5, distShore);
      finalColor = mix(finalColor, uDeepColor * 0.96 + uShallowColor * 0.14, horizon * 0.28);
      alpha = smoothstep(0.0, 1.15, distShore);
    } else {
      float edgeDist = length(vWorldPos.xz);
      float vignette = smoothstep(4.2, 8.2, edgeDist);
      finalColor = mix(finalColor, uDeepColor * 0.94, vignette * 0.20);
    }

    gl_FragColor = vec4(finalColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createRealisticRiverWater(options: {
  width: number;
  depth: number;
  shoreZ?: number;
  reflectionWidth?: number;
  reflectionHeight?: number;
  reflectionSize?: number;
  isCircularPond?: boolean;
  pondRadius?: number;
  hasReflection?: boolean;
  isPreview?: boolean;
}): WaterSystem {
  const {
    width,
    depth,
    shoreZ = -10,
    reflectionSize = 512,
    reflectionWidth = reflectionSize,
    reflectionHeight = Math.round(reflectionSize * 0.5),
    isCircularPond = false,
    pondRadius = 2.6,
    hasReflection = true,
    isPreview = false
  } = options;

  const geometry = isCircularPond
    ? new THREE.CircleGeometry(pondRadius, 32)
    : new THREE.PlaneGeometry(width, depth, isPreview ? 18 : 32, isPreview ? 18 : 24);
  geometry.rotateX(-Math.PI / 2);

  const reflectionTarget = new THREE.WebGLRenderTarget(reflectionWidth, reflectionHeight, {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.UnsignedByteType,
    depthBuffer: true
  });

  const textureMatrix = new THREE.Matrix4();
  const reflectionCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uReflectionMap: { value: reflectionTarget.texture },
      uTextureMatrix: { value: textureMatrix },
      uTime: { value: 0 },
      uMoonDir: { value: new THREE.Vector3(0.42, 0.26, -0.87).normalize() },
      uDeepColor: { value: new THREE.Color('#08586b') },
      uShallowColor: { value: new THREE.Color('#16bdd9') },
      uRippleHighlight: { value: new THREE.Color('#67f5ff') },
      uCrestFoam: { value: new THREE.Color('#f0fdff') },
      uShoreGold: { value: new THREE.Color('#fde68a') },
      uMoonColor: { value: new THREE.Color('#ffffff') },
      uDistortionX: { value: isPreview ? 0.025 : 0.034 },
      uDistortionZ: { value: isPreview ? 0.014 : 0.018 },
      uShoreZ: { value: shoreZ },
      uHasReflection: { value: hasReflection ? 1.0 : 0.0 },
      uIsCircularPond: { value: isCircularPond ? 1.0 : 0.0 },
      uPondRadius: { value: pondRadius },
      uIsPreview: { value: isPreview ? 1.0 : 0.0 }
    },
    vertexShader: WATER_VERTEX_SHADER,
    fragmentShader: WATER_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0;

  const dirVec = new THREE.Vector3();
  const lookVec = new THREE.Vector3();
  const prevClearColor = new THREE.Color();

  const setShoreZ = (z: number) => {
    material.uniforms.uShoreZ.value = z;
  };

  const update = (elapsedSec: number) => {
    material.uniforms.uTime.value = elapsedSec;
  };

  const renderReflection = (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    mainCamera: THREE.PerspectiveCamera
  ) => {
    if (!hasReflection) return;

    reflectionCamera.fov = mainCamera.fov;
    reflectionCamera.aspect = mainCamera.aspect;
    reflectionCamera.near = mainCamera.near;
    reflectionCamera.far = mainCamera.far;
    reflectionCamera.updateProjectionMatrix();

    mainCamera.getWorldDirection(dirVec);
    reflectionCamera.position.set(
      mainCamera.position.x,
      -mainCamera.position.y,
      mainCamera.position.z
    );
    lookVec.set(
      reflectionCamera.position.x + dirVec.x,
      reflectionCamera.position.y - dirVec.y,
      reflectionCamera.position.z + dirVec.z
    );
    reflectionCamera.up.set(0, 1, 0);
    reflectionCamera.lookAt(lookVec);
    reflectionCamera.updateMatrixWorld();

    textureMatrix.copy(BIAS_MATRIX);
    textureMatrix.multiply(reflectionCamera.projectionMatrix);
    textureMatrix.multiply(reflectionCamera.matrixWorldInverse);

    const prevTarget = renderer.getRenderTarget();
    const prevClip = renderer.clippingPlanes;
    renderer.getClearColor(prevClearColor);
    const prevClearAlpha = renderer.getClearAlpha();

    mesh.visible = false;
    renderer.clippingPlanes = [REFLECTION_CLIP_PLANE];
    renderer.setRenderTarget(reflectionTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, reflectionCamera);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevClearColor, prevClearAlpha);
    renderer.clippingPlanes = prevClip && prevClip.length > 0 ? prevClip : EMPTY_CLIP_PLANES;
    mesh.visible = true;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
    reflectionTarget.dispose();
  };

  return {
    mesh,
    material,
    reflectionTarget,
    reflectionCamera,
    textureMatrix,
    setShoreZ,
    update,
    renderReflection,
    dispose
  };
}
