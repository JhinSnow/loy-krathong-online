// src/three/skyline3D.ts
// ฉากพื้นหลังเทศกาลลอยกระทง 3 มิติ (ตึกฟักทอง ม.อ. 3D, วัด/เจดีย์/พระปรางค์ 3D, ทิวต้นตาล, ทิวเขาคอหงส์, พระจันทร์, โคมลอย และพลุ 3D)

import * as THREE from 'three';

export interface Skyline3DSystem {
  root: THREE.Group;
  update: (elapsedSec: number, dt: number) => void;
  spawnFirework: (x?: number, y?: number, z?: number) => void;
  dispose: () => void;
}

interface FloatingLantern3D {
  mesh: THREE.Group;
  speedY: number;
  driftX: number;
  phase: number;
}

interface FireworkParticle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
}

function makeBuildingMat(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.22,
    ...params
  });
}

function createSkyGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#020617');
    grad.addColorStop(0.48, '#0b132b');
    grad.addColorStop(0.82, '#171d42');
    grad.addColorStop(0.95, '#2b2548');
    grad.addColorStop(1.0, '#141a33');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHaloSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.32, 'rgba(253, 224, 71, 0.35)');
    grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.08)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildPumpkinLandmark3D(): THREE.Group {
  const group = new THREE.Group();

  const matBaseNavy = makeBuildingMat({ color: 0x1c2541, roughness: 0.65, metalness: 0.1 });
  const matBronze = makeBuildingMat({ color: 0xb45309, metalness: 0.35, roughness: 0.4 });
  const matGoldMid = makeBuildingMat({ color: 0xf59e0b, metalness: 0.3, roughness: 0.35 });
  const matGoldPeak = makeBuildingMat({
    color: 0xfde68a,
    emissive: 0xd97706,
    emissiveIntensity: 0.25,
    metalness: 0.35,
    roughness: 0.3
  });
  const matArchRim = makeBuildingMat({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.42,
    roughness: 0.28
  });
  const matWindowGlow = makeBuildingMat({
    color: 0x1b2342,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.28,
    roughness: 0.7
  });

  // ฐานแท่นบันได 3 ชั้นของตึกฟักทอง
  const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.36, 4.4), matBaseNavy);
  plinth1.position.y = 0.18;
  group.add(plinth1);

  const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.28, 3.9), matBronze);
  plinth2.position.y = 0.50;
  group.add(plinth2);

  // ผนังซุ้มโค้งชั้นล่างและช่องแสงอุ่น
  const lowerHall = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.35, 3.0), matWindowGlow);
  lowerHall.position.y = 1.30;
  group.add(lowerHall);

  // เสาและซุ้มโค้ง 7 ช่องด้านหน้า (จุดเด่นตึกฟักทอง คณะวิทยาศาสตร์ ม.อ.)
  for (let i = -3; i <= 3; i++) {
    const bayX = i * 1.62;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.4, 0.45), matBronze);
    pillar.position.set(bayX - 0.81, 1.30, 1.62);
    group.add(pillar);

    const archFrame = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.085, 8, 16, Math.PI), matArchRim);
    archFrame.position.set(bayX, 1.28, 1.66);
    group.add(archFrame);

    const warmBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    warmBulb.position.set(bayX, 1.68, 1.56);
    group.add(warmBulb);
  }
  const lastPillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.4, 0.45), matBronze);
  lastPillar.position.set(3 * 1.62 + 0.81, 1.30, 1.62);
  group.add(lastPillar);

  // หลังคาโดมกลีบฟักทอง 7 กลีบใหญ่เรียงโค้งมีมิติ 3 มิติ
  const lobeSpecs = [
    { x: -4.95, y: 1.75, rx: 1.45, ry: 1.45, rz: 1.75, mat: matBronze },
    { x: -3.35, y: 1.85, rx: 1.55, ry: 1.95, rz: 1.95, mat: matGoldMid },
    { x: -1.72, y: 1.92, rx: 1.62, ry: 2.38, rz: 2.15, mat: matGoldMid },
    { x: 0.0, y: 1.96, rx: 1.72, ry: 2.62, rz: 2.30, mat: matGoldPeak },
    { x: 1.72, y: 1.92, rx: 1.62, ry: 2.38, rz: 2.15, mat: matGoldMid },
    { x: 3.35, y: 1.85, rx: 1.55, ry: 1.95, rz: 1.95, mat: matGoldMid },
    { x: 4.95, y: 1.75, rx: 1.45, ry: 1.45, rz: 1.75, mat: matBronze }
  ];

  const halfSphereGeo = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
  lobeSpecs.forEach((spec) => {
    const lobe = new THREE.Mesh(halfSphereGeo, spec.mat);
    lobe.scale.set(spec.rx, spec.ry, spec.rz);
    lobe.position.set(spec.x, spec.y, 0.0);
    group.add(lobe);

    // เส้นสันกลีบเรืองแสงทอง
    const ribArc = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.025, 6, 20, Math.PI),
      matArchRim
    );
    ribArc.scale.set(spec.rz * 1.01, spec.ry * 1.01, 1);
    ribArc.rotation.y = Math.PI / 2;
    ribArc.position.set(spec.x, spec.y, 0.0);
    group.add(ribArc);
  });

  // ไฟแขวนล้านนาประดับหน้าชายคาตึกฟักทอง
  const matLantern = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  for (let i = -4; i <= 4; i++) {
    const lx = i * 1.32;
    const ly = 1.92 + (4 - Math.abs(i)) * 0.08;
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), matLantern);
    lantern.position.set(lx, ly - 0.16, 1.88);
    group.add(lantern);
  }

  return group;
}

function buildChedi3D(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeBuildingMat({ color: 0xf59e0b, metalness: 0.4, roughness: 0.32 });
  const matBronze = makeBuildingMat({ color: 0xb45309, metalness: 0.3, roughness: 0.45 });
  const matTip = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  const baseBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.4), matBronze);
  baseBox.position.y = 0.55;
  g.add(baseBox);

  const profile = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(1.05, 0),
    new THREE.Vector2(1.05, 0.45),
    new THREE.Vector2(0.88, 0.8),
    new THREE.Vector2(0.92, 1.35),
    new THREE.Vector2(0.68, 2.1),
    new THREE.Vector2(0.32, 2.35),
    new THREE.Vector2(0.35, 2.65),
    new THREE.Vector2(0.12, 3.6),
    new THREE.Vector2(0.02, 4.75)
  ];
  const spire = new THREE.Mesh(new THREE.LatheGeometry(profile, 22), matGold);
  spire.position.y = 1.1;
  g.add(spire);

  const tipOrb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), matTip);
  tipOrb.position.y = 5.9;
  g.add(tipOrb);

  g.scale.setScalar(scale);
  return g;
}

function buildPrang3D(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeBuildingMat({ color: 0xd97706, metalness: 0.35, roughness: 0.38 });
  const matHighlight = makeBuildingMat({ color: 0xfde68a, emissive: 0xb45309, emissiveIntensity: 0.2 });

  const ped = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 2.0), matGold);
  ped.position.y = 0.6;
  g.add(ped);

  for (let i = 0; i < 6; i++) {
    const w = 1.45 - i * 0.2;
    const h = 0.52;
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.55, h, 8), i % 2 === 0 ? matGold : matHighlight);
    tier.position.y = 1.45 + i * 0.46;
    g.add(tier);
  }
  const topNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 8), matHighlight);
  topNeedle.position.y = 4.4;
  g.add(topNeedle);

  g.scale.setScalar(scale);
  return g;
}

function buildThaiHall3D(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const matWall = makeBuildingMat({ color: 0x78350f, roughness: 0.55 });
  const matRoof = makeBuildingMat({ color: 0xf59e0b, metalness: 0.32, roughness: 0.35 });
  const matTrim = makeBuildingMat({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.22 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.2), matWall);
  body.position.y = 0.6;
  g.add(body);

  // หลังคาซ้อน 2 ชั้น
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(2.45, 1.25, 4), matRoof);
  roof1.rotation.y = Math.PI / 4;
  roof1.scale.set(1.15, 1, 0.85);
  roof1.position.y = 1.78;
  g.add(roof1);

  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.65, 1.05, 4), matTrim);
  roof2.rotation.y = Math.PI / 4;
  roof2.scale.set(1.1, 1, 0.85);
  roof2.position.y = 2.42;
  g.add(roof2);

  // หน้าต่างแสงสีทองด้านหน้า
  for (const wx of [-0.9, 0, 0.9]) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.55),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    win.position.set(wx, 0.68, 1.12);
    g.add(win);
  }

  g.scale.setScalar(scale);
  return g;
}

function buildPalmTree3D(scale = 1, tilt = 0.12): THREE.Group {
  const g = new THREE.Group();
  const matTrunk = makeBuildingMat({ color: 0x0f172a, roughness: 0.75 });
  const matFrond = makeBuildingMat({ color: 0x13203d, emissive: 0x78350f, emissiveIntensity: 0.18, roughness: 0.6, side: THREE.DoubleSide });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(tilt * 0.4, 1.4, 0),
    new THREE.Vector3(tilt, 2.8, 0.1)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.085, 6, false), matTrunk));

  const crownPos = new THREE.Vector3(tilt, 2.8, 0.1);
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI * 2) / 8;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.25, 4), matFrond);
    frond.scale.set(0.35, 1, 0.9);
    frond.position.set(
      crownPos.x + Math.cos(ang) * 0.48,
      crownPos.y - 0.08,
      crownPos.z + Math.sin(ang) * 0.48
    );
    frond.rotation.order = 'YXZ';
    frond.rotation.y = -ang + Math.PI / 2;
    frond.rotation.x = 1.15;
    g.add(frond);
  }

  g.scale.setScalar(scale);
  return g;
}

function buildMountainRangeMesh(color: number, ridgeY: number, seedOffset: number): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-48, 0);
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = -48 + t * 96;
    const h =
      ridgeY *
      (0.45 +
        0.3 * Math.sin(x * 0.13 + seedOffset) +
        0.18 * Math.cos(x * 0.27 - seedOffset) +
        0.12 * Math.sin(x * 0.5 + seedOffset * 2));
    shape.lineTo(x, Math.max(0.8, h));
  }
  shape.lineTo(48, 0);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
  const mat = makeBuildingMat({ color, roughness: 0.92, metalness: 0.02 });
  return new THREE.Mesh(geo, mat);
}

/**
 * สร้างฉากพื้นหลัง 3 มิติเต็มรูปแบบสำหรับหน้าแม่น้ำ
 */
export function buildFestivalSkyline3D(): Skyline3DSystem {
  const root = new THREE.Group();

  // --- 1. ท้องฟ้ายามค่ำคืน (Sky Backdrop Plane/Cylinder ด้านหลังสุด) ---
  const skyTex = createSkyGradientTexture();
  const skyGeo = new THREE.CylinderGeometry(58, 58, 44, 36, 1, true, Math.PI * 0.55, Math.PI * 0.9);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.set(0, 14, -4);
  root.add(skyDome);

  // --- 2. พระจันทร์วันเพ็ญ + Halo เรืองแสง (มุมขวาบนฉากหลัง) ---
  const moonGroup = new THREE.Group();
  moonGroup.position.set(16.5, 11.2, -34);
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 24, 20),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false })
  );
  moonGroup.add(moonMesh);

  const haloTex = createHaloSpriteTexture();
  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xfde047,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    })
  );
  moonHalo.scale.set(9.5, 9.5, 1);
  moonGroup.add(moonHalo);
  root.add(moonGroup);

  // --- 3. หมู่ดาวระยิบระยับบนท้องฟ้า ---
  const starCount = 180;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 86;
    starPositions[i * 3 + 1] = 4.5 + Math.random() * 19;
    starPositions[i * 3 + 2] = -28 - Math.random() * 22;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xfffbeb,
    size: 0.2,
    transparent: true,
    opacity: 0.85,
    fog: false
  });
  root.add(new THREE.Points(starGeo, starMat));

  // --- 4. ทิวเขาคอหงส์ 3D ซ้อน 2 ชั้น ---
  const mountainFront = buildMountainRangeMesh(0x111a30, 5.4, 0.8);
  mountainFront.position.set(0, 0, -24);
  root.add(mountainFront);

  const mountainBack = buildMountainRangeMesh(0x0b132b, 7.6, 2.3);
  mountainBack.position.set(0, 0, -34);
  root.add(mountainBack);

  // --- 5. แนวกำแพงเขื่อนริมตลิ่ง + เสาไฟสีทอง ---
  const embankment = new THREE.Mesh(
    new THREE.BoxGeometry(68, 0.85, 2.8),
    makeBuildingMat({ color: 0x1c2541, roughness: 0.65 })
  );
  embankment.position.set(0, 0.32, -9.6);
  root.add(embankment);

  const trimLine = new THREE.Mesh(
    new THREE.BoxGeometry(68, 0.08, 2.86),
    makeBuildingMat({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.3 })
  );
  trimLine.position.set(0, 0.72, -9.6);
  root.add(trimLine);

  const postMat = makeBuildingMat({ color: 0xd97706, metalness: 0.4 });
  const orbMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  for (let px = -22; px <= 22; px += 4.4) {
    if (Math.abs(px) < 6.5) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.65, 8), postMat);
    post.position.set(px, 1.05, -8.45);
    root.add(post);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), orbMat);
    orb.position.set(px, 1.42, -8.45);
    root.add(orb);
  }

  // --- 6. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. 3 มิติ (จุดเด่นกึ่งกลางฉาก) ---
  const pumpkinBuilding = buildPumpkinLandmark3D();
  pumpkinBuilding.position.set(0, 0.65, -11.4);
  root.add(pumpkinBuilding);

  // --- 7. สถาปัตยกรรมไทยริมตลิ่งซ้าย-ขวา + เจดีย์ฉากหลัง 3 มิติ ---
  const templesGroup = new THREE.Group();
  templesGroup.position.y = 0.65;

  // เจดีย์คู่ซ้าย-ขวาหน้าตลิ่ง
  const chediL = buildChedi3D(1.0);
  chediL.position.set(-12.6, 0, -11.8);
  templesGroup.add(chediL);

  const chediR = buildChedi3D(1.0);
  chediR.position.set(12.6, 0, -11.8);
  templesGroup.add(chediR);

  // พระปรางค์ซ้าย-ขวา
  const prangL = buildPrang3D(0.95);
  prangL.position.set(-8.6, 0, -11.5);
  templesGroup.add(prangL);

  const prangR = buildPrang3D(0.95);
  prangR.position.set(8.6, 0, -11.5);
  templesGroup.add(prangR);

  // วิหาร / อุโบสถหลังคาซ้อน 3D ริมฝั่ง
  const hallFarL = buildThaiHall3D(1.1);
  hallFarL.position.set(-16.8, 0, -11.6);
  templesGroup.add(hallFarL);

  const hallFarR = buildThaiHall3D(1.1);
  hallFarR.position.set(16.8, 0, -11.6);
  templesGroup.add(hallFarR);

  const salaMidL = buildThaiHall3D(0.78);
  salaMidL.position.set(-10.4, 0, -13.2);
  templesGroup.add(salaMidL);

  const salaMidR = buildThaiHall3D(0.78);
  salaMidR.position.set(10.4, 0, -13.2);
  templesGroup.add(salaMidR);

  // พระมหาเจดีย์ 3 องค์ฉากหลังตึกฟักทอง (โผล่พ้นยอดตึกสวยงาม)
  const backChediCenter = buildChedi3D(1.18);
  backChediCenter.position.set(0, 0, -17.8);
  templesGroup.add(backChediCenter);

  const backChediL = buildChedi3D(0.96);
  backChediL.position.set(-4.2, 0, -17.2);
  templesGroup.add(backChediL);

  const backChediR = buildChedi3D(0.96);
  backChediR.position.set(4.2, 0, -17.2);
  templesGroup.add(backChediR);

  root.add(templesGroup);

  // --- 8. ทิวต้นตาล / มะพร้าว 3D ---
  [
    { x: -7.1, z: -10.8, s: 1.0, tilt: -0.25 },
    { x: -11.1, z: -10.6, s: 0.9, tilt: 0.22 },
    { x: -15.0, z: -10.5, s: 0.85, tilt: -0.18 },
    { x: 7.1, z: -10.8, s: 1.0, tilt: 0.25 },
    { x: 11.1, z: -10.6, s: 0.9, tilt: -0.22 },
    { x: 15.0, z: -10.5, s: 0.85, tilt: 0.18 }
  ].forEach((p) => {
    const palm = buildPalmTree3D(p.s, p.tilt);
    palm.position.set(p.x, 0.65, p.z);
    root.add(palm);
  });

  // --- 9. โคมลอย 3 มิติบนท้องฟ้า ---
  const lanterns: FloatingLantern3D[] = [];
  const lanternBodyMat = new THREE.MeshBasicMaterial({ color: 0xfdba74 });
  const lanternGlowMat = new THREE.MeshBasicMaterial({ color: 0xea580c });

  for (let i = 0; i < 16; i++) {
    const lGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.38, 8), lanternBodyMat);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lanternGlowMat);
    rim.position.y = -0.16;
    lGroup.add(body);
    lGroup.add(rim);

    lGroup.position.set((Math.random() - 0.5) * 32, 2 + Math.random() * 12, -13 - Math.random() * 14);
    root.add(lGroup);
    lanterns.push({
      mesh: lGroup,
      speedY: 0.35 + Math.random() * 0.45,
      driftX: 0.08 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2
    });
  }

  // --- 10. ระบบพลุดอกไม้ไฟ 3 มิติ (Dynamic Particle Buffer) ---
  const MAX_FW_PARTICLES = 360;
  const fwParticles: FireworkParticle3D[] = [];
  const fwPositions = new Float32Array(MAX_FW_PARTICLES * 3);
  const fwColors = new Float32Array(MAX_FW_PARTICLES * 3);
  const fwGeo = new THREE.BufferGeometry();
  const fwPosAttr = new THREE.BufferAttribute(fwPositions, 3);
  const fwColAttr = new THREE.BufferAttribute(fwColors, 3);
  fwPosAttr.setUsage(THREE.DynamicDrawUsage);
  fwColAttr.setUsage(THREE.DynamicDrawUsage);
  fwGeo.setAttribute('position', fwPosAttr);
  fwGeo.setAttribute('color', fwColAttr);
  fwGeo.setDrawRange(0, 0);

  const fwPoints = new THREE.Points(
    fwGeo,
    new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  fwPoints.frustumCulled = false;
  root.add(fwPoints);

  const fwPalettes = [
    [0xfde047, 0xf59e0b, 0xfffbeb],
    [0xfb7185, 0xf43f5e, 0xfde047],
    [0x38bdf8, 0xfde047, 0xe0f2fe],
    [0xc084fc, 0xf472b6, 0xfef08a],
    [0x34d399, 0xfde047, 0xa7f3d0]
  ];

  const spawnFirework = (customX?: number, customY?: number, customZ?: number) => {
    const cx = customX ?? (Math.random() - 0.5) * 18;
    const cy = customY ?? 5.5 + Math.random() * 5.0;
    const cz = customZ ?? -13 - Math.random() * 6;
    const palette = fwPalettes[Math.floor(Math.random() * fwPalettes.length)];
    const colorObj = new THREE.Color();

    const burstCount = 34;
    for (let i = 0; i < burstCount; i++) {
      if (fwParticles.length >= MAX_FW_PARTICLES) fwParticles.shift();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2.2 + Math.random() * 3.2;
      colorObj.setHex(palette[i % palette.length]);

      fwParticles.push({
        x: cx,
        y: cy,
        z: cz,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed * 0.85 + 1.2,
        vz: Math.sin(phi) * Math.sin(theta) * speed * 0.5,
        life: 0,
        maxLife: 1.25 + Math.random() * 0.65,
        r: colorObj.r,
        g: colorObj.g,
        b: colorObj.b
      });
    }
  };

  let autoFwCooldown = 1.8;

  const update = (elapsedSec: number, dt: number) => {
    // 1. ขยับโคมลอย 3D
    for (let i = 0; i < lanterns.length; i++) {
      const l = lanterns[i];
      l.mesh.position.y += l.speedY * dt;
      l.mesh.position.x += Math.sin(elapsedSec * 0.8 + l.phase) * l.driftX * dt;
      if (l.mesh.position.y > 16) {
        l.mesh.position.y = 1.6;
        l.mesh.position.x = (Math.random() - 0.5) * 32;
      }
    }

    // 2. จุดพลุอัตโนมัติเป็นระยะ
    autoFwCooldown -= dt;
    if (autoFwCooldown <= 0) {
      spawnFirework();
      autoFwCooldown = 2.2 + Math.random() * 2.8;
    }

    // 3. อัปเดตอนุภาคพลุ 3D
    const drag = Math.pow(0.96, dt * 60);
    let writeIdx = 0;
    for (let i = 0; i < fwParticles.length; i++) {
      const p = fwParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 2.4 * dt;
      p.vx *= drag;
      p.vz *= drag;

      fwParticles[writeIdx] = p;
      const fade = Math.max(0, 1 - p.life / p.maxLife);
      fwPositions[writeIdx * 3] = p.x;
      fwPositions[writeIdx * 3 + 1] = Math.max(0.4, p.y);
      fwPositions[writeIdx * 3 + 2] = p.z;
      fwColors[writeIdx * 3] = p.r * fade;
      fwColors[writeIdx * 3 + 1] = p.g * fade;
      fwColors[writeIdx * 3 + 2] = p.b * fade;
      writeIdx++;
    }
    fwParticles.length = writeIdx;
    fwPosAttr.needsUpdate = true;
    fwColAttr.needsUpdate = true;
    fwGeo.setDrawRange(0, writeIdx);
  };

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (!m) return;
          const std = m as THREE.MeshStandardMaterial;
          std.map?.dispose();
          m.dispose();
        });
      } else if (obj instanceof THREE.Sprite) {
        obj.material?.map?.dispose();
        obj.material?.dispose();
      }
    });
  };

  return {
    root,
    update,
    spawnFirework,
    dispose
  };
}
