// src/three/waterShader.ts
// Realistic GLSL Water Shader (คลื่นริ้วเล็กๆ + Planar Reflection สะท้อนตึกฟักทอง วัด เจดีย์ พระจันทร์ และกระทง 3D)

import * as THREE from 'three';

export interface WaterSystem {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  reflectionTarget: THREE.WebGLRenderTarget;
  reflectionCamera: THREE.PerspectiveCamera;
  textureMatrix: THREE.Matrix4;
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

const REFLECTION_CLIP_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.04);
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
    // ขยับยอดคลื่นเบาๆ บนผิวน้ำให้มีมิติคลื่นจริง
    float waveLift = sin(worldPos.x * 1.15 + uTime * 1.4) * cos(worldPos.z * 0.95 - uTime * 1.1) * 0.025;
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
  uniform vec3 uMoonColor;
  uniform float uDistortionScale;
  uniform float uHasReflection;
  uniform float uIsCircularPond;
  uniform float uPondRadius;

  varying vec4 vReflCoord;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  // คำนวณความชันคลื่นริ้วเล็กๆ แบบหลายชั้น (Multi-Octave Ripple Normal)
  vec3 getWaterNormal(vec2 p, float t) {
    float dx = 0.0;
    float dz = 0.0;

    // Layer 1: คลื่นน้ำไหลเอื่อยไปทางขวา
    float a1 = p.x * 2.2 - t * 1.35 + p.z * 0.7;
    dx += cos(a1) * 0.032;
    dz += cos(a1) * 0.012;

    // Layer 2: ระลอกคลื่นขวางเบาๆ
    float a2 = p.x * -1.4 + p.z * 3.1 + t * 1.7;
    dx += cos(a2) * -0.024;
    dz += cos(a2) * 0.042;

    // Layer 3: คลื่นละเอียดระยิบรับแสงจันทร์และแสงเทียน
    float a3 = p.x * 5.6 + p.z * 4.8 - t * 2.4;
    dx += cos(a3) * 0.022;
    dz += cos(a3) * 0.018;

    // Layer 4: คลื่นกระเพื่อมละเอียดระดับไมโคร
    float a4 = p.x * -8.3 + p.z * 7.2 + t * 2.9;
    dx += cos(a4) * -0.014;
    dz += cos(a4) * 0.014;

    return normalize(vec3(-dx, 1.0, -dz));
  }

  void main() {
    vec3 normal = getWaterNormal(vWorldPos.xz, uTime);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    // ฐานสีน้ำตามระยะใกล้ฝั่ง/ลึก
    float distFactor = clamp(length(vWorldPos.xz) * 0.022, 0.0, 1.0);
    vec3 waterBase = mix(uShallowColor, uDeepColor, distFactor);

    // Fresnel (มองมุมเฉียงยิ่งสะท้อนเงาชัดขึ้น)
    float fresnel = clamp(0.16 + 0.84 * pow(1.0 - max(dot(viewDir, normal), 0.0), 2.8), 0.0, 1.0);

    vec3 reflColor = waterBase * 1.25;
    if (uHasReflection > 0.5 && abs(vReflCoord.w) > 0.001) {
      vec2 projUv = (vReflCoord.xy / vReflCoord.w);
      // ลดความบิดเบือนตามระยะเพื่อไม่ให้เงาตึกด้านหลังแตกพร่าเกินไป
      float damp = 1.0 / (1.0 + abs(vReflCoord.w) * 0.035);
      vec2 distortedUv = clamp(projUv + normal.xz * uDistortionScale * damp, vec2(0.002), vec2(0.998));
      vec4 reflSample = texture2D(uReflectionMap, distortedUv);
      reflColor = mix(waterBase * 1.15, reflSample.rgb, reflSample.a);
    } else {
      // แสงสะท้อนจำลองสำหรับโหมดอ่างน้ำตัวอย่างหน้า Customizer
      float shimmer = sin(vWorldPos.x * 6.0 + uTime * 2.5) * cos(vWorldPos.z * 6.0 - uTime * 2.0);
      reflColor += vec3(0.18, 0.12, 0.03) * max(0.0, shimmer) * (1.0 - distFactor);
    }

    // ผสมสีพื้นน้ำกับภาพสะท้อนจริง (ให้เห็นเงาตึกฟักทอง วัด และแสงเทียนชัดเจนกำลังดี)
    vec3 finalColor = mix(waterBase, reflColor * 0.92, clamp(fresnel * 0.88 + 0.14, 0.0, 0.94));

    // แสงจันทร์ตกกระทบบนสันคลื่น (Specular Moon Path)
    vec3 halfVec = normalize(uMoonDir + viewDir);
    float moonSpec = pow(max(dot(normal, halfVec), 0.0), 110.0);
    float moonSparkle = pow(max(dot(normal, halfVec), 0.0), 22.0) * 0.14;
    finalColor += uMoonColor * (moonSpec * 0.85 + moonSparkle);

    // เพิ่มเงาเรืองสีทองริมตลิ่งไกล
    float shoreGlow = (1.0 - smoothstep(-9.0, 2.5, vWorldPos.z)) * 0.05 * (1.0 - uIsCircularPond);
    finalColor += vec3(0.45, 0.28, 0.08) * shoreGlow;

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
  reflectionSize?: number;
  isCircularPond?: boolean;
  pondRadius?: number;
  hasReflection?: boolean;
}): WaterSystem {
  const {
    width,
    depth,
    reflectionSize = 512,
    isCircularPond = false,
    pondRadius = 2.6,
    hasReflection = true
  } = options;

  const geometry = isCircularPond
    ? new THREE.CircleGeometry(pondRadius, 48)
    : new THREE.PlaneGeometry(width, depth, 64, 48);
  geometry.rotateX(-Math.PI / 2);

  const reflectionTarget = new THREE.WebGLRenderTarget(reflectionSize, reflectionSize, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.UnsignedByteType,
    depthBuffer: true
  });

  const textureMatrix = new THREE.Matrix4();
  const reflectionCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uReflectionMap: { value: reflectionTarget.texture },
      uTextureMatrix: { value: textureMatrix },
      uTime: { value: 0 },
      uMoonDir: { value: new THREE.Vector3(0.42, 0.26, -0.87).normalize() },
      uDeepColor: { value: new THREE.Color('#071026') },
      uShallowColor: { value: new THREE.Color('#132245') },
      uMoonColor: { value: new THREE.Color('#fef08a') },
      uDistortionScale: { value: isCircularPond ? 0.025 : 0.055 },
      uHasReflection: { value: hasReflection ? 1.0 : 0.0 },
      uIsCircularPond: { value: isCircularPond ? 1.0 : 0.0 },
      uPondRadius: { value: pondRadius }
    },
    vertexShader: WATER_VERTEX_SHADER,
    fragmentShader: WATER_FRAGMENT_SHADER,
    transparent: isCircularPond
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0;

  const dirVec = new THREE.Vector3();
  const lookVec = new THREE.Vector3();

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

    mesh.visible = false;
    renderer.clippingPlanes = [REFLECTION_CLIP_PLANE];
    renderer.setRenderTarget(reflectionTarget);
    renderer.clear();
    renderer.render(scene, reflectionCamera);
    renderer.setRenderTarget(prevTarget);
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
    update,
    renderReflection,
    dispose
  };
}
