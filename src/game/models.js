import * as THREE from "three";

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.05,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    flatShading: true,
  });
}

function addShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function box(w, h, d, color, y = 0) {
  const m = addShadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)));
  m.position.y = y + h / 2;
  return m;
}

function sphere(r, color, y = 0, sx = 1, sy = 1, sz = 1) {
  const m = addShadow(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(color)));
  m.scale.set(sx, sy, sz);
  m.position.y = y;
  return m;
}

function cyl(rTop, rBot, h, color, y = 0) {
  const m = addShadow(
    new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 10), mat(color))
  );
  m.position.y = y + h / 2;
  return m;
}

/** Low-poly stylized animal factory */
export function createAnimalMesh(defId) {
  const root = new THREE.Group();
  root.name = `animal_${defId}`;

  const makers = {
    rabbit: () => {
      root.add(sphere(0.22, 0xe8d5c4, 0.28, 1, 0.9, 1.15));
      root.add(sphere(0.14, 0xe8d5c4, 0.48, 1, 1, 1));
      const earL = box(0.06, 0.28, 0.04, 0xf2e6da, 0.55);
      earL.position.x = -0.08;
      const earR = earL.clone();
      earR.position.x = 0.08;
      root.add(earL, earR);
    },
    chicken: () => {
      root.add(sphere(0.2, 0xf2d08b, 0.28, 1, 0.95, 1.1));
      root.add(sphere(0.12, 0xf2d08b, 0.48));
      const comb = box(0.06, 0.1, 0.04, 0xc45c48, 0.55);
      root.add(comb);
      const beak = box(0.08, 0.04, 0.08, 0xe8a03a, 0.45);
      beak.position.z = 0.12;
      root.add(beak);
    },
    goat: () => {
      root.add(box(0.28, 0.22, 0.42, 0xd9c4a5, 0.22));
      root.add(sphere(0.14, 0xd9c4a5, 0.48, 1, 1, 1.1));
      const hornL = cyl(0.02, 0.035, 0.16, 0xbca48a, 0.55);
      hornL.position.set(-0.08, 0, -0.02);
      hornL.rotation.z = 0.35;
      const hornR = hornL.clone();
      hornR.position.x = 0.08;
      hornR.rotation.z = -0.35;
      root.add(hornL, hornR);
    },
    fox: () => {
      root.add(box(0.24, 0.18, 0.4, 0xd9783a, 0.2));
      root.add(sphere(0.13, 0xd9783a, 0.42, 1.1, 0.9, 1.2));
      const tail = sphere(0.1, 0xe8d5c4, 0.28, 0.7, 0.7, 1.4);
      tail.position.z = -0.28;
      root.add(tail);
      const earL = box(0.06, 0.12, 0.04, 0xd9783a, 0.5);
      earL.position.set(-0.08, 0, -0.02);
      const earR = earL.clone();
      earR.position.x = 0.08;
      root.add(earL, earR);
    },
    deer: () => {
      root.add(box(0.26, 0.24, 0.46, 0xb8875a, 0.28));
      root.add(sphere(0.13, 0xb8875a, 0.55));
      const antler = (x) => {
        const a = cyl(0.015, 0.025, 0.22, 0x9a7550, 0.62);
        a.position.x = x;
        a.rotation.z = x > 0 ? -0.25 : 0.25;
        return a;
      };
      root.add(antler(-0.07), antler(0.07));
      for (const legX of [-0.1, 0.1]) {
        for (const legZ of [-0.14, 0.14]) {
          const leg = cyl(0.03, 0.035, 0.28, 0x9a7550, 0);
          leg.position.set(legX, 0, legZ);
          root.add(leg);
        }
      }
    },
    wolf: () => {
      root.add(box(0.28, 0.2, 0.48, 0x8a93a0, 0.24));
      root.add(sphere(0.14, 0x8a93a0, 0.44, 1.15, 0.9, 1.25));
      const snout = box(0.1, 0.08, 0.14, 0xa0a8b4, 0.4);
      snout.position.z = 0.2;
      root.add(snout);
      const tail = sphere(0.08, 0x8a93a0, 0.3, 0.7, 0.7, 1.5);
      tail.position.z = -0.3;
      root.add(tail);
    },
    lion: () => {
      root.add(box(0.34, 0.24, 0.52, 0xe0a64a, 0.26));
      root.add(sphere(0.2, 0xc8892e, 0.5, 1.25, 1.15, 1.15)); // mane
      root.add(sphere(0.14, 0xe0a64a, 0.5));
      const snout = box(0.1, 0.08, 0.12, 0xe8c07a, 0.45);
      snout.position.z = 0.18;
      root.add(snout);
    },
    elephant: () => {
      root.add(box(0.42, 0.34, 0.58, 0x9aa3ad, 0.34));
      root.add(sphere(0.2, 0x9aa3ad, 0.62));
      const earL = box(0.04, 0.28, 0.22, 0x8b949e, 0.55);
      earL.position.x = -0.28;
      const earR = earL.clone();
      earR.position.x = 0.28;
      root.add(earL, earR);
      const trunk = cyl(0.05, 0.07, 0.36, 0x9aa3ad, 0.2);
      trunk.position.set(0, 0, 0.28);
      trunk.rotation.x = 0.45;
      root.add(trunk);
      for (const legX of [-0.14, 0.14]) {
        for (const legZ of [-0.16, 0.16]) {
          const leg = cyl(0.07, 0.08, 0.34, 0x8b949e, 0);
          leg.position.set(legX, 0, legZ);
          root.add(leg);
        }
      }
    },
    fish: () => {
      root.add(sphere(0.16, 0x4db6c8, 0.35, 1.5, 0.8, 0.7));
      const fin = box(0.04, 0.14, 0.1, 0x3a9bb0, 0.4);
      fin.position.z = -0.18;
      root.add(fin);
      const top = box(0.03, 0.1, 0.08, 0x3a9bb0, 0.48);
      root.add(top);
    },
    turtle: () => {
      root.add(sphere(0.22, 0x5f8f4e, 0.28, 1.2, 0.55, 1.1));
      root.add(sphere(0.1, 0x8fbc6e, 0.28, 1, 0.8, 1));
      const head = sphere(0.08, 0x8fbc6e, 0.28);
      head.position.z = 0.22;
      root.add(head);
    },
    seal: () => {
      root.add(sphere(0.2, 0x7d8793, 0.22, 1.1, 0.75, 1.6));
      root.add(sphere(0.12, 0x7d8793, 0.28));
      const head = root.children[1];
      head.position.z = 0.22;
    },
    dolphin: () => {
      root.add(sphere(0.18, 0x6aa7c2, 0.35, 1.7, 0.75, 0.85));
      const fin = box(0.04, 0.16, 0.1, 0x5a93ad, 0.48);
      root.add(fin);
      const nose = sphere(0.07, 0x6aa7c2, 0.32, 1.4, 0.7, 0.7);
      nose.position.z = 0.26;
      root.add(nose);
    },
    shark: () => {
      root.add(sphere(0.2, 0x6b7c8c, 0.35, 1.9, 0.7, 0.8));
      const fin = box(0.04, 0.2, 0.12, 0x5a6a78, 0.5);
      root.add(fin);
      const tail = box(0.04, 0.18, 0.12, 0x5a6a78, 0.38);
      tail.position.z = -0.28;
      root.add(tail);
    },
    whale: () => {
      root.add(sphere(0.28, 0x3f6f8f, 0.4, 2.1, 0.85, 0.95));
      const fin = box(0.05, 0.18, 0.14, 0x355f7a, 0.55);
      root.add(fin);
      const tail = box(0.06, 0.08, 0.28, 0x355f7a, 0.38);
      tail.position.z = -0.42;
      root.add(tail);
    },
  };

  (makers[defId] || makers.rabbit)();
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return root;
}

/** Low-poly tourist / visitor */
export function createTouristMesh(hue = 30) {
  const root = new THREE.Group();
  root.name = "tourist";

  const shirt = new THREE.Color().setHSL(((hue % 360) / 360), 0.55, 0.5);
  const pants = new THREE.Color().setHSL((((hue + 40) % 360) / 360), 0.25, 0.35);

  const body = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.28, 4, 8), mat(shirt)));
  body.position.y = 0.55;
  root.add(body);

  const head = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(0xf0d2b0)));
  head.position.y = 0.92;
  root.add(head);

  const hair = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), mat(0x3b2a1e)));
  hair.position.y = 0.98;
  hair.scale.set(1, 0.7, 1);
  root.add(hair);

  const legL = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 3, 6), mat(pants)));
  legL.position.set(-0.07, 0.22, 0);
  const legR = legL.clone();
  legR.position.x = 0.07;
  root.add(legL, legR);

  const armL = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.18, 3, 6), mat(shirt)));
  armL.position.set(-0.2, 0.6, 0);
  const armR = armL.clone();
  armR.position.x = 0.2;
  root.add(armL, armR);

  root.userData.legL = legL;
  root.userData.legR = legR;
  root.userData.armL = armL;
  root.userData.armR = armR;
  return root;
}

export function animateTourist(mesh, t, moving) {
  if (!mesh?.userData?.legL) return;
  const swing = moving ? Math.sin(t * 10) * 0.45 : 0;
  mesh.userData.legL.rotation.x = swing;
  mesh.userData.legR.rotation.x = -swing;
  mesh.userData.armL.rotation.x = -swing * 0.7;
  mesh.userData.armR.rotation.x = swing * 0.7;
  mesh.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.03 : 0;
}

export function createBuildingMesh(type, level = 1) {
  const root = new THREE.Group();
  root.name = `building_${type}`;
  const lvScale = 1 + (level - 1) * 0.08;

  if (type === "hq") {
    const base = box(1.4, 0.35, 1.4, 0xc4a574, 0);
    const body = box(1.1, 0.7 + level * 0.12, 1.1, 0xe8c56a, 0.35);
    const roof = addShadow(new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.45, 4), mat(0xc45c48)));
    roof.position.y = 1.15 + level * 0.12;
    roof.rotation.y = Math.PI / 4;
    const flag = box(0.05, 0.35, 0.02, 0xffffff, 1.4 + level * 0.12);
    flag.position.x = 0.15;
    root.add(base, body, roof, flag);
  } else if (type === "ticket") {
    const booth = box(0.9, 0.7, 0.7, 0xf0c75a, 0);
    const roof = box(1.1, 0.12, 0.9, 0xc45c48, 0.7);
    const counter = box(0.95, 0.12, 0.25, 0x8b6914, 0.45);
    counter.position.z = 0.35;
    root.add(booth, roof, counter);
  } else if (type === "landHabitat") {
    const ground = box(1.7, 0.12, 1.7, 0x4f9a55, 0);
    const fenceMat = mat(0x8b6914);
    for (let i = -0.75; i <= 0.75; i += 0.5) {
      for (const side of [
        [i, 0.75],
        [i, -0.75],
        [0.75, i],
        [-0.75, i],
      ]) {
        const post = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), fenceMat));
        post.position.set(side[0], 0.22, side[1]);
        root.add(post);
      }
    }
    const tree = cyl(0.05, 0.08, 0.5, 0x8b6914, 0.12);
    tree.position.set(-0.45, 0, -0.4);
    const leaves = sphere(0.28, 0x3f8a4e, 0.75);
    leaves.position.set(-0.45, 0, -0.4);
    const rock = sphere(0.18, 0x8a9088, 0.2, 1.2, 0.7, 1);
    rock.position.set(0.4, 0, 0.35);
    root.add(ground, tree, leaves, rock);
  } else if (type === "aquarium") {
    const base = box(1.6, 0.2, 1.6, 0x6b7c70, 0);
    const tank = addShadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.7 + level * 0.08, 1.35),
        mat(0x2a7f9e, { transparent: true, opacity: 0.55, roughness: 0.2 })
      )
    );
    tank.position.y = 0.45 + level * 0.04;
    const water = addShadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.45 + level * 0.06, 1.25),
        mat(0x3aa0c0, { transparent: true, opacity: 0.45 })
      )
    );
    water.position.y = 0.35 + level * 0.03;
    const rim = box(1.45, 0.08, 1.45, 0xd9e2e8, 0.85 + level * 0.08);
    root.add(base, water, tank, rim);
  } else if (type === "snack") {
    const cart = box(1.0, 0.55, 0.7, 0xc45c48, 0);
    const awning = box(1.15, 0.08, 0.85, 0xf0c75a, 0.55);
    const poleL = cyl(0.03, 0.03, 0.55, 0xffffff, 0.55);
    poleL.position.set(-0.4, 0, 0.3);
    const poleR = poleL.clone();
    poleR.position.x = 0.4;
    root.add(cart, awning, poleL, poleR);
  } else if (type === "gift") {
    const shop = box(1.15, 0.75, 1.0, 0x9b6b3b, 0);
    const roof = addShadow(new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.4, 4), mat(0xc45c48)));
    roof.position.y = 1.05;
    roof.rotation.y = Math.PI / 4;
    const door = box(0.28, 0.4, 0.05, 0x6b4423, 0.1);
    door.position.z = 0.52;
    root.add(shop, roof, door);
  } else {
    root.add(box(1, 0.6, 1, 0x888888, 0));
  }

  root.scale.setScalar(lvScale);
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return root;
}

export function createTerrain(cols, rows, cell) {
  const group = new THREE.Group();
  const width = cols * cell;
  const depth = rows * cell;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 6, depth + 6, 20, 20),
    mat(0x4fa35c, { roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  // gentle hills
  const pos = ground.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 0.35) * Math.cos(y * 0.3) * 0.15);
  }
  ground.geometry.computeVertexNormals();
  group.add(ground);

  // path ring
  const path = new THREE.Mesh(
    new THREE.RingGeometry(Math.min(width, depth) * 0.15, Math.min(width, depth) * 0.22, 48),
    mat(0xc4a574, { roughness: 1 })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.02;
  path.receiveShadow = true;
  group.add(path);

  // grid pads
  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(cell * 0.92, 0.06, cell * 0.92),
        mat((gx + gy) % 2 === 0 ? 0x62b56f : 0x3f8a4e, { roughness: 0.9 })
      );
      const { x, z } = {
        x: (gx - (cols - 1) / 2) * cell,
        z: (gy - (rows - 1) / 2) * cell,
      };
      pad.position.set(x, 0.03, z);
      pad.receiveShadow = true;
      pad.userData.grid = { gx, gy };
      pad.name = `pad_${gx}_${gy}`;
      group.add(pad);
    }
  }

  // decorative trees around border
  for (let i = 0; i < 18; i += 1) {
    const tree = new THREE.Group();
    const trunk = cyl(0.08, 0.12, 0.7, 0x8b6914, 0);
    const crown = sphere(0.45 + Math.random() * 0.15, 0x2f6b3c, 1.0);
    tree.add(trunk, crown);
    const angle = (i / 18) * Math.PI * 2;
    const radius = Math.max(width, depth) * 0.72;
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    tree.scale.setScalar(0.8 + Math.random() * 0.5);
    group.add(tree);
  }

  return group;
}

export function createSky() {
  const hemi = new THREE.HemisphereLight(0xb1e3ff, 0x6b8f4e, 0.85);
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.35);
  sun.position.set(12, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.bias = -0.0002;

  const fill = new THREE.DirectionalLight(0x9ad0ff, 0.35);
  fill.position.set(-10, 6, -8);

  return { hemi, sun, fill };
}

export function createPlacementGhost(color = 0xe8b84a) {
  const ghost = new THREE.Mesh(
    new THREE.BoxGeometry(CELL_SAFE, 0.12, CELL_SAFE),
    mat(color, { transparent: true, opacity: 0.45 })
  );
  ghost.position.y = 0.1;
  ghost.visible = false;
  return ghost;
}

const CELL_SAFE = 2.2;
