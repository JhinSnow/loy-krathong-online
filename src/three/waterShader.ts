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

  // Domain-warped multi-octave turquoise river wavelets plus preview concentric rings
  vec4 getWaterWave(vec2 p, float t) {
    vec2 wp = uIsPreview > 0.5 ? p * 2.15 : p * 1.22;

    float dx = 0.0;
    float dz = 0.0;
    float signedWave = 0.0;

    float warp1 = sin(wp.x * 0.85 + t * 0.55) * 0.75;
    float warp2 = cos(wp.z * 1.60 - t * 0.70) * 0.65;

    // Layer 1: Primary curved swells
    float a1 = wp.z * 3.4 + wp.x * 0.65 + warp1 - t * 1.35;
    float c1 = cos(a1);
    dx += c1 * 0.14;
    dz += c1 * 0.34;
    signedWave += sin(a1) * 0.42;

    // Layer 2: Interlocking angled wavelets
    float a2 = wp.z * 7.8 - wp.x * 1.35 + warp2 + t * 1.80;
    float c2 = cos(a2);
    dx += c2 * -0.16;
    dz += c2 * 0.38;
    signedWave += sin(a2) * 0.36;

    // Layer 3: Crisp medium-fine sunlit ripples
    float a3 = wp.z * 14.8 + wp.x * 2.50 - warp1 * 0.6 - t * 2.45;
    float c3 = cos(a3);
    dx += c3 * 0.17;
    dz += c3 * 0.35;
    signedWave += sin(a3) * 0.28;

    // Layer 4: High-frequency micro surface shimmer (river mode only)
    if (uIsPreview < 0.5) {
      float a4 = wp.z * 28.0 - wp.x * 4.20 + t * 3.05;
      float c4 = cos(a4);
      dx += c4 * -0.11;
      dz += c4 * 0.26;
      signedWave += sin(a4) * 0.16;
    } else {
      // Concentric water ripple rings radiating outward from krathong base
      float r = length(p);
      float ringEnv = smoothstep(0.42, 0.85, r) * exp(-max(r - 0.72, 0.0) * 0.65);
      float ringPhase = r * 14.5 - t * 3.5;
      float ringSin = sin(ringPhase) * ringEnv;
      float ringCos = cos(ringPhase) * ringEnv;
      vec2 radDir = p / max(r, 0.001);
      dx += radDir.x * ringCos * 0.32;
      dz += radDir.y * ringCos * 0.32;
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

    // Fresnel term increases reflection readability at grazing angles
    float ndotv = max(dot(viewDir, normal), 0.0);
    float fresnel = clamp(0.16 + 0.84 * pow(1.0 - ndotv, 2.2), 0.0, 1.0);

    // Four-stage dimensional turquoise shading from deep troughs to crisp crest ribbons
    float slopeLight = smoothstep(-0.32, 0.36, normal.z);
    float bodyMix = clamp(waveH * 0.62 + slopeLight * 0.48 - 0.10, 0.0, 1.0);
    vec3 waterColor = mix(uDeepColor, uShallowColor, smoothstep(0.08, 0.82, bodyMix));

    // Luminous aqua-turquoise wave slopes
    float slopeCrest = smoothstep(0.46, 0.86, waveH * 0.58 + slopeLight * 0.52);
    waterColor = mix(waterColor, uRippleHighlight, slopeCrest * (0.54 + 0.38 * fresnel));

    // Crisp icy-aqua wavelet ribbon lines on wave peaks and concentric ring crests
    float ribbonLine = pow(smoothstep(0.64, 0.94, waveH * 0.64 + slopeLight * 0.44), 2.1);
    waterColor = mix(waterColor, uCrestFoam, ribbonLine * 0.56);

    float distShore = max(0.0, vWorldPos.z - uShoreZ);

    // Warm golden light reflections on water surface
    if (uIsPreview < 0.5) {
      float shoreMask = exp(-distShore * 0.22);
      float pumpkinGlow = exp(-abs(vWorldPos.x) * 0.16) * 1.15;
      float flankLamps = 0.55 + 0.45 * cos(vWorldPos.x * 0.72);
      float rippleSlice = 0.35 + 0.65 * smoothstep(-0.08, 0.24, normal.z);
      float shoreShimmer = shoreMask * (0.48 + pumpkinGlow * 0.65 + flankLamps * 0.38) * rippleSlice;
      waterColor += uShoreGold * shoreShimmer * 0.38;

      // Soft warm moon specular shimmer along right side
      float moonLane = exp(-pow((vWorldPos.x - 8.2) * 0.18, 2.0)) * smoothstep(2.0, -14.0, vWorldPos.z);
      vec3 halfVec = normalize(uMoonDir + viewDir);
      float moonSpec = pow(max(dot(normal, halfVec), 0.0), 34.0);
      float moonWide = pow(max(dot(normal, halfVec), 0.0), 9.0) * 0.24;
      waterColor += uMoonColor * (moonSpec * 0.58 + moonWide * moonLane * 0.92);
    } else {
      // Customizer preview mode: vertical golden reflection streaks dancing across turquoise ripples
      float backGlow = smoothstep(3.4, -4.2, vWorldPos.z);
      float col1 = exp(-pow((vWorldPos.x + 1.45) * 1.9, 2.0));
      float col2 = exp(-pow((vWorldPos.x - 1.35) * 2.1, 2.0));
      float colMid = 0.35 + 0.65 * (0.5 + 0.5 * sin(vWorldPos.x * 1.65 + 0.4));
      float rippleSlice = 0.32 + 0.68 * smoothstep(-0.08, 0.24, normal.z);
      float streakIntensity = backGlow * (col1 * 0.72 + col2 * 0.65 + colMid * 0.24) * rippleSlice;
      waterColor += uShoreGold * streakIntensity * 0.36;
    }

    vec3 finalColor = waterColor;

    // Inverted 3D krathong planar reflection broken horizontally by water ripples
    if (uHasReflection > 0.5 && abs(vReflCoord.w) > 0.001) {
      vec2 projUv = vReflCoord.xy / vReflCoord.w;
      float damp = 1.0 / (1.0 + abs(vReflCoord.w) * 0.028);
      vec2 distort = vec2(normal.z * uDistortionX + normal.x * 0.025, normal.z * uDistortionZ) * damp;
      vec2 distortedUv = clamp(projUv + distort, vec2(0.002), vec2(0.998));
      vec4 reflSample = texture2D(uReflectionMap, distortedUv);

      float reflWeight = reflSample.a * clamp(0.68 + fresnel * 0.25, 0.0, 0.90);
      finalColor = mix(finalColor, reflSample.rgb * 0.95, reflWeight);
    }

    float alpha = 1.0;
    if (uIsCircularPond > 0.5) {
      float radial = length(vWorldPos.xz);
      alpha = 1.0 - smoothstep(uPondRadius * 0.72, uPondRadius, radial);
      if (alpha <= 0.01) discard;
    } else if (uIsPreview < 0.5) {
      // Softly feather top horizon edge into skyline without a hard line
      alpha = smoothstep(0.0, 1.15, distShore);
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
    ? new THREE.CircleGeometry(pondRadius, 40)
    : new THREE.PlaneGeometry(width, depth, isPreview ? 24 : 56, isPreview ? 24 : 40);
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
      uDeepColor: { value: new THREE.Color('#063844') },
      uShallowColor: { value: new THREE.Color('#0e8fa3') },
      uRippleHighlight: { value: new THREE.Color('#5ef0fa') },
      uCrestFoam: { value: new THREE.Color('#ccfaff') },
      uShoreGold: { value: new THREE.Color('#fbbf24') },
      uMoonColor: { value: new THREE.Color('#fef3c7') },
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
