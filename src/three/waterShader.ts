// src/three/waterShader.ts
// Realistic GLSL Rippling River Shader (ริ้วคลื่นแนวนอนสมจริง + เงาตลิ่งสีทอง + เงากระทงสะท้อนแตกเป็นคลื่น 60 FPS)

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
    // ขยับยอดคลื่นเบาๆ บนผิวน้ำให้สัมพันธ์กับกระทงที่ลอย
    float waveLift = sin(worldPos.x * 0.8 + uTime * 1.1) * cos(worldPos.z * 2.4 - uTime * 1.6) * 0.018;
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

  // คำนวณคลื่นริ้วแนวนอนหลายความถี่ (Anisotropic Horizontal River Ripples แบบภาพตัวอย่าง)
  vec4 getWaterWave(vec2 p, float t) {
    float dx = 0.0;
    float dz = 0.0;
    float ridge = 0.0;

    // Layer 1: ลอนคลื่นแนวนอนหลักไหลช้าๆ ไปทางขวา
    float a1 = p.z * 3.8 + p.x * 0.45 - t * 1.15;
    float c1 = cos(a1);
    dx += c1 * 0.055;
    dz += c1 * 0.26;
    ridge += 0.5 + 0.5 * sin(a1);

    // Layer 2: ระลอกคลื่นขวางความถี่กลาง
    float a2 = p.z * 8.6 - p.x * 0.90 + t * 1.55;
    float c2 = cos(a2);
    dx += c2 * -0.068;
    dz += c2 * 0.30;
    ridge += 0.5 + 0.5 * sin(a2);

    // Layer 3: ริ้วน้ำละเอียดรับแสงทอง
    float a3 = p.z * 16.5 + p.x * 2.10 - t * 2.25;
    float c3 = cos(a3);
    dx += c3 * 0.075;
    dz += c3 * 0.28;
    ridge += 0.5 + 0.5 * sin(a3);

    // Layer 4: คลื่นกระเพื่อมระดับไมโคร
    float a4 = p.z * 29.0 - p.x * 3.80 + t * 2.85;
    float c4 = cos(a4);
    dx += c4 * -0.055;
    dz += c4 * 0.22;

    vec3 n = normalize(vec3(-dx, 1.0, -dz));
    return vec4(n, ridge / 3.0);
  }

  void main() {
    vec4 wave = getWaterWave(vWorldPos.xz, uTime);
    vec3 normal = wave.xyz;
    float ridge = wave.w;
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    // Fresnel (ยิ่งมองมุมเฉียง ยิ่งเห็นเงาสะท้อนริ้วคลื่นชัดเจน)
    float ndotv = max(dot(viewDir, normal), 0.0);
    float fresnel = clamp(0.14 + 0.86 * pow(1.0 - ndotv, 2.3), 0.0, 1.0);

    // พื้นผิวน้ำโทนชาโคล-น้ำตาลอุ่นพร้อมริ้วแสงอ่อนบนสันคลื่น (เห็นความเป็นน้ำชัดเจนทั่วทั้งผืนน้ำ)
    float crestLight = smoothstep(-0.18, 0.32, normal.z);
    vec3 waterColor = mix(uDeepColor, uShallowColor, crestLight * 0.82 + ridge * 0.28);
    waterColor = mix(waterColor, uRippleHighlight, pow(crestLight, 2.0) * (0.28 + 0.42 * fresnel));

    // แสงสะท้อนสีเหลืองทองจากตลิ่ง / ตึกฟักทอง / พื้นหลัง
    if (uIsPreview < 0.5) {
      float distShore = max(0.0, vWorldPos.z - uShoreZ);
      float shoreMask = exp(-distShore * 0.24);
      // แนวแสงทองสว่างกลางฉาก (ตึกฟักทอง) + เส้นแสงจากวัดและโคมไฟริมตลิ่งสองฝั่ง
      float pumpkinGlow = exp(-abs(vWorldPos.x) * 0.16) * 1.15;
      float flankLamps = 0.55 + 0.45 * cos(vWorldPos.x * 0.72);
      float rippleSlice = 0.35 + 0.65 * smoothstep(-0.08, 0.24, normal.z);
      float shoreShimmer = shoreMask * (0.48 + pumpkinGlow * 0.65 + flankLamps * 0.38) * rippleSlice;
      waterColor += uShoreGold * shoreShimmer * 0.52;

      // แสงจันทร์สีทองอ่อนตกกระทบทอดเป็นเส้นแนวขวา
      float moonLane = exp(-pow((vWorldPos.x - 8.2) * 0.18, 2.0)) * smoothstep(2.0, -14.0, vWorldPos.z);
      vec3 halfVec = normalize(uMoonDir + viewDir);
      float moonSpec = pow(max(dot(normal, halfVec), 0.0), 36.0);
      float moonWide = pow(max(dot(normal, halfVec), 0.0), 9.0) * 0.22;
      waterColor += uMoonColor * (moonSpec * 0.55 + moonWide * moonLane * 0.9);
    } else {
      // โหมดหน้าตกแต่งกระทง: แสงสะท้อนริ้วสีทองอุ่นพริ้วไหวรอบกระทง (แบบภาพตัวอย่างที่ 2)
      float backGlow = smoothstep(2.2, -3.6, vWorldPos.z);
      float streakWave = 0.45 + 0.55 * sin(vWorldPos.x * 1.75 + 0.6) * cos(vWorldPos.z * 0.8);
      float rippleSlice = smoothstep(-0.06, 0.24, normal.z);
      waterColor += uShoreGold * backGlow * streakWave * rippleSlice * 0.26;
    }

    vec3 finalColor = waterColor;

    // เงากระทง 3 มิติสะท้อนในน้ำแตกตามริ้วคลื่นแนวนอน (Planar Reflection)
    if (uHasReflection > 0.5 && abs(vReflCoord.w) > 0.001) {
      vec2 projUv = vReflCoord.xy / vReflCoord.w;
      float damp = 1.0 / (1.0 + abs(vReflCoord.w) * 0.028);
      vec2 distort = vec2(normal.z * uDistortionX + normal.x * 0.035, normal.z * uDistortionZ) * damp;
      vec2 distortedUv = clamp(projUv + distort, vec2(0.002), vec2(0.998));
      vec4 reflSample = texture2D(uReflectionMap, distortedUv);

      // ผสมเงาสะท้อนกลับหัวของกระทงให้ชัดเจนเหมือนน้ำจริง (ภาพตัวอย่างที่ 1)
      float reflWeight = reflSample.a * clamp(0.62 + fresnel * 0.28, 0.0, 0.88);
      finalColor = mix(finalColor, reflSample.rgb * 0.90, reflWeight);
    }

    float alpha = 1.0;
    if (uIsCircularPond > 0.5) {
      float radial = length(vWorldPos.xz);
      alpha = 1.0 - smoothstep(uPondRadius * 0.72, uPondRadius, radial);
      if (alpha <= 0.01) discard;
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
    : new THREE.PlaneGeometry(width, depth, 48, 36);
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
      uDeepColor: { value: new THREE.Color('#181411') },
      uShallowColor: { value: new THREE.Color('#2b231c') },
      uRippleHighlight: { value: new THREE.Color('#6e573e') },
      uShoreGold: { value: new THREE.Color('#fbbf24') },
      uMoonColor: { value: new THREE.Color('#fef3c7') },
      uDistortionX: { value: isPreview ? 0.016 : 0.024 },
      uDistortionZ: { value: isPreview ? 0.008 : 0.012 },
      uShoreZ: { value: shoreZ },
      uHasReflection: { value: hasReflection ? 1.0 : 0.0 },
      uIsCircularPond: { value: isCircularPond ? 1.0 : 0.0 },
      uPondRadius: { value: pondRadius },
      uIsPreview: { value: isPreview ? 1.0 : 0.0 }
    },
    vertexShader: WATER_VERTEX_SHADER,
    fragmentShader: WATER_FRAGMENT_SHADER,
    transparent: isCircularPond
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
