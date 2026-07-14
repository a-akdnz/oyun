import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  ANIMAL_DEFS,
  BUILDING_DEFS,
  CELL,
  GRID_COLS,
  GRID_ROWS,
  SAVE_KEY,
  WATER_UNLOCK_LEVEL,
  MAX_BUILDING_LEVEL,
  XP_FOR_LEVEL,
  buildingCost,
  upgradeCost,
  gridToWorld,
} from "./game/data.js";
import {
  animateTourist,
  createAnimalMesh,
  createBuildingMesh,
  createPlacementGhost,
  createSky,
  createTerrain,
  createTouristMesh,
} from "./game/models.js";

const canvas = document.getElementById("c");
const ui = {
  coins: document.getElementById("coins"),
  level: document.getElementById("level"),
  xpFill: document.getElementById("xpFill"),
  touristCount: document.getElementById("touristCount"),
  incomeRate: document.getElementById("incomeRate"),
  inspect: document.getElementById("inspect"),
  inspectTitle: document.getElementById("inspectTitle"),
  inspectDesc: document.getElementById("inspectDesc"),
  inspectLevel: document.getElementById("inspectLevel"),
  inspectEffect: document.getElementById("inspectEffect"),
  habitatSlots: document.getElementById("habitatSlots"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  closeInspect: document.getElementById("closeInspect"),
  shop: document.getElementById("shop"),
  shopTitle: document.getElementById("shopTitle"),
  shopBody: document.getElementById("shopBody"),
  closeShop: document.getElementById("closeShop"),
  welcome: document.getElementById("welcome"),
  startBtn: document.getElementById("startBtn"),
  toast: document.getElementById("toast"),
};

const state = {
  started: false,
  coins: 200,
  xp: 0,
  level: 1,
  buildings: [],
  animals: [],
  tourists: [],
  selectedId: null,
  placeMode: null,
  tab: "build",
  incomeAccum: 0,
  incomeDisplay: 0,
  incomeWindow: 0,
  spawnTimer: 1.2,
  time: 0,
};

let nextId = 1;
const uid = () => `id_${nextId++}`;
let toastTimer = 0;

// --- Three.js setup ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec8e3);
scene.fog = new THREE.Fog(0x9ad0e8, 28, 55);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
camera.position.set(14, 12, 14);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.46;
controls.minDistance = 8;
controls.maxDistance = 28;
controls.target.set(0, 0.5, 0);
controls.update();

const { hemi, sun, fill } = createSky();
scene.add(hemi, sun, fill);

const terrain = createTerrain(GRID_COLS, GRID_ROWS, CELL);
scene.add(terrain);

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const ghost = createPlacementGhost();
scene.add(ghost);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

const buildingMeshes = new Map();
const animalMeshes = new Map();
const touristMeshes = new Map();

function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.add("hidden"), 2200);
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function countBuildings(type) {
  return state.buildings.filter((b) => b.type === type).length;
}

function getHq() {
  return state.buildings.find((b) => b.type === "hq");
}

function hqEffects() {
  const hq = getHq();
  return BUILDING_DEFS.hq.effects(hq ? hq.level : 1);
}

function totalAppeal() {
  let appeal = 10;
  for (const b of state.buildings) {
    const fx = BUILDING_DEFS[b.type].effects(b.level);
    appeal += fx.appeal || 0;
  }
  for (const a of state.animals) {
    const def = ANIMAL_DEFS.find((d) => d.id === a.defId);
    if (def) appeal += def.appeal;
  }
  return appeal;
}

function ticketPay() {
  let pay = 3;
  for (const b of state.buildings.filter((x) => x.type === "ticket")) {
    pay += BUILDING_DEFS.ticket.effects(b.level).ticketPay;
  }
  return pay;
}

function spawnBonus() {
  let bonus = 0;
  for (const b of state.buildings.filter((x) => x.type === "ticket")) {
    bonus += BUILDING_DEFS.ticket.effects(b.level).spawnBonus;
  }
  return bonus;
}

function habitatCapacity(building) {
  return BUILDING_DEFS[building.type].effects(building.level).slots || 0;
}

function animalsInBuilding(buildingId) {
  return state.animals.filter((a) => a.buildingId === buildingId);
}

function findFreeHabitat(type) {
  const habitatType = type === "water" ? "aquarium" : "landHabitat";
  for (const h of state.buildings.filter((b) => b.type === habitatType)) {
    if (animalsInBuilding(h.id).length < habitatCapacity(h)) return h;
  }
  return null;
}

function canUnlockWater() {
  return state.level >= WATER_UNLOCK_LEVEL;
}

function updateHud() {
  ui.coins.textContent = Math.floor(state.coins).toLocaleString("tr-TR");
  ui.level.textContent = String(state.level);
  const need = XP_FOR_LEVEL(state.level);
  ui.xpFill.style.width = `${Math.min(100, (state.xp / need) * 100)}%`;
  ui.touristCount.textContent = String(state.tourists.length);
  ui.incomeRate.textContent = Math.max(0, Math.floor(state.incomeDisplay)).toLocaleString("tr-TR");
}

function addXp(amount) {
  const bonus = 1 + (hqEffects().xpBonus || 0);
  state.xp += Math.max(1, Math.floor(amount * bonus));
  while (state.xp >= XP_FOR_LEVEL(state.level)) {
    state.xp -= XP_FOR_LEVEL(state.level);
    state.level += 1;
    toast(`Seviye ${state.level}!`);
    if (state.level === WATER_UNLOCK_LEVEL) toast("Su canlıları ve Akvaryum açıldı!");
  }
  updateHud();
}

function addCoins(amount) {
  state.coins += amount;
  state.incomeAccum += amount;
  updateHud();
}

function spendCoins(amount) {
  if (state.coins < amount) return false;
  state.coins -= amount;
  updateHud();
  return true;
}

function occupied(gx, gy, ignoreId = null) {
  return state.buildings.some((b) => b.gx === gx && b.gy === gy && b.id !== ignoreId);
}

function syncBuildingMesh(building) {
  const old = buildingMeshes.get(building.id);
  if (old) {
    worldRoot.remove(old);
    old.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
  const mesh = createBuildingMesh(building.type, building.level);
  const { x, z } = gridToWorld(building.gx, building.gy);
  mesh.position.set(x, 0, z);
  mesh.userData.buildingId = building.id;
  worldRoot.add(mesh);
  buildingMeshes.set(building.id, mesh);
  updateSelectionRing();
}

function removeBuildingMesh(id) {
  const mesh = buildingMeshes.get(id);
  if (!mesh) return;
  worldRoot.remove(mesh);
  buildingMeshes.delete(id);
}

function syncAnimalMesh(animal) {
  let mesh = animalMeshes.get(animal.id);
  if (!mesh) {
    mesh = createAnimalMesh(animal.defId);
    animalMeshes.set(animal.id, mesh);
    worldRoot.add(mesh);
  }
  const building = state.buildings.find((b) => b.id === animal.buildingId);
  if (!building) return;
  const { x, z } = gridToWorld(building.gx, building.gy);
  const siblings = animalsInBuilding(building.id);
  const idx = siblings.findIndex((a) => a.id === animal.id);
  const ang = (idx / Math.max(1, siblings.length)) * Math.PI * 2;
  const radius = 0.35 + (idx % 3) * 0.15;
  mesh.position.set(x + Math.cos(ang) * radius, 0, z + Math.sin(ang) * radius);
  mesh.rotation.y = ang + Math.PI;
  mesh.userData.bobPhase = animal.bob ?? Math.random() * 10;
  const def = ANIMAL_DEFS.find((d) => d.id === animal.defId);
  mesh.userData.isWater = def?.type === "water";
}

function removeAnimalMesh(id) {
  const mesh = animalMeshes.get(id);
  if (!mesh) return;
  worldRoot.remove(mesh);
  animalMeshes.delete(id);
}

function rebuildWorld() {
  for (const id of [...buildingMeshes.keys()]) removeBuildingMesh(id);
  for (const id of [...animalMeshes.keys()]) removeAnimalMesh(id);
  for (const id of [...touristMeshes.keys()]) {
    const m = touristMeshes.get(id);
    worldRoot.remove(m);
    touristMeshes.delete(id);
  }
  state.buildings.forEach(syncBuildingMesh);
  state.animals.forEach(syncAnimalMesh);
}

function updateSelectionRing() {
  for (const [id, mesh] of buildingMeshes) {
    const selected = id === state.selectedId;
    let ring = mesh.getObjectByName("selectRing");
    if (selected && !ring) {
      ring = new THREE.Mesh(
        new THREE.RingGeometry(1.05, 1.2, 32),
        new THREE.MeshBasicMaterial({ color: 0xfff3c4, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      ring.name = "selectRing";
      mesh.add(ring);
    } else if (!selected && ring) {
      mesh.remove(ring);
    }
  }
}

function createBuilding(type, gx, gy) {
  return { id: uid(), type, gx, gy, level: 1 };
}

function newGame() {
  state.coins = 200;
  state.xp = 0;
  state.level = 1;
  state.animals = [];
  state.tourists = [];
  state.selectedId = null;
  state.placeMode = null;
  state.buildings = [
    createBuilding("hq", 3, 2),
    createBuilding("ticket", 2, 4),
    createBuilding("landHabitat", 5, 2),
  ];
  const habitat = state.buildings.find((b) => b.type === "landHabitat");
  state.animals.push({ id: uid(), defId: "rabbit", buildingId: habitat.id, bob: 0 });
  rebuildWorld();
  save();
}

function save() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      coins: state.coins,
      xp: state.xp,
      level: state.level,
      buildings: state.buildings,
      animals: state.animals.map(({ id, defId, buildingId }) => ({ id, defId, buildingId })),
      nextId,
    })
  );
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    state.coins = data.coins ?? 200;
    state.xp = data.xp ?? 0;
    state.level = data.level ?? 1;
    state.buildings = data.buildings || [];
    state.animals = (data.animals || []).map((a) => ({ ...a, bob: Math.random() * 10 }));
    if (typeof data.nextId === "number") nextId = data.nextId;
    return state.buildings.length > 0;
  } catch {
    return false;
  }
}

function placeBuilding(type, gx, gy) {
  const def = BUILDING_DEFS[type];
  if (!def) return;
  if (def.unlockLevel && state.level < def.unlockLevel) {
    toast(`Seviye ${def.unlockLevel} gerekli`);
    return;
  }
  if (gx < 0 || gy < 0 || gx >= GRID_COLS || gy >= GRID_ROWS) return;
  if (occupied(gx, gy)) {
    toast("Bu kutu dolu");
    return;
  }
  const owned = countBuildings(type);
  if (owned >= def.max) {
    toast("Bu binadan yeterince var");
    return;
  }
  if (state.buildings.length >= hqEffects().maxBuildings) {
    toast("Bina limiti dolu — Merkezi yükselt");
    return;
  }
  const cost = buildingCost(def, owned);
  if (!spendCoins(cost)) {
    toast("Yetersiz para");
    return;
  }
  const b = createBuilding(type, gx, gy);
  state.buildings.push(b);
  syncBuildingMesh(b);
  state.placeMode = null;
  ghost.visible = false;
  state.selectedId = b.id;
  addXp(8);
  toast(`${def.name} inşa edildi`);
  showInspect(b);
  save();
}

function upgradeSelected() {
  const b = state.buildings.find((x) => x.id === state.selectedId);
  if (!b) return;
  if (b.level >= MAX_BUILDING_LEVEL) {
    toast("Maksimum seviye");
    return;
  }
  const cost = upgradeCost(b);
  if (!spendCoins(cost)) {
    toast("Yetersiz para");
    return;
  }
  b.level += 1;
  syncBuildingMesh(b);
  addXp(12 + b.level * 3);
  toast(`${BUILDING_DEFS[b.type].name} seviye ${b.level}`);
  showInspect(b);
  save();
}

function buyAnimal(defId) {
  const def = ANIMAL_DEFS.find((a) => a.id === defId);
  if (!def) return;
  if (state.level < def.unlockLevel) {
    toast(`Seviye ${def.unlockLevel} gerekli`);
    return;
  }
  if (def.type === "water" && !canUnlockWater()) {
    toast(`Su canlıları Seviye ${WATER_UNLOCK_LEVEL}'te açılır`);
    return;
  }
  const habitat = findFreeHabitat(def.type);
  if (!habitat) {
    toast(def.type === "water" ? "Boş akvaryum yok" : "Boş kara habitatı yok");
    return;
  }
  if (!spendCoins(def.cost)) {
    toast("Yetersiz para");
    return;
  }
  const animal = { id: uid(), defId: def.id, buildingId: habitat.id, bob: Math.random() * 10 };
  state.animals.push(animal);
  syncAnimalMesh(animal);
  addXp(10 + Math.floor(def.appeal / 4));
  toast(`${def.name} bahçene katıldı!`);
  save();
  renderShop();
}

function showInspect(building) {
  const def = BUILDING_DEFS[building.type];
  ui.inspect.classList.remove("hidden");
  ui.inspectTitle.textContent = `${def.icon} ${def.name}`;
  ui.inspectDesc.textContent = def.desc;
  ui.inspectLevel.textContent = `${building.level} / ${MAX_BUILDING_LEVEL}`;
  ui.inspectEffect.textContent = def.effectText(building.level);

  if (def.habitat) {
    ui.habitatSlots.classList.remove("hidden");
    const housed = animalsInBuilding(building.id);
    const slots = habitatCapacity(building);
    ui.habitatSlots.innerHTML = "";
    for (let i = 0; i < slots; i += 1) {
      const a = housed[i];
      const row = document.createElement("div");
      row.className = `slot${a ? "" : " empty"}`;
      if (a) {
        const ad = ANIMAL_DEFS.find((d) => d.id === a.defId);
        row.innerHTML = `<span>${ad.icon} ${ad.name}</span><span>${ad.rarity}</span>`;
      } else {
        row.innerHTML = `<span>Boş yuva</span><span>—</span>`;
      }
      ui.habitatSlots.appendChild(row);
    }
  } else {
    ui.habitatSlots.classList.add("hidden");
    ui.habitatSlots.innerHTML = "";
  }

  if (building.level >= MAX_BUILDING_LEVEL) {
    ui.upgradeBtn.disabled = true;
    ui.upgradeBtn.textContent = "Maksimum seviye";
  } else {
    const cost = upgradeCost(building);
    ui.upgradeBtn.disabled = state.coins < cost;
    ui.upgradeBtn.textContent = `Yükselt (${cost.toLocaleString("tr-TR")} 🪙)`;
  }
  updateSelectionRing();
}

function hideInspect() {
  ui.inspect.classList.add("hidden");
  state.selectedId = null;
  updateSelectionRing();
}

function openShop(tab) {
  state.tab = tab || state.tab;
  document.querySelectorAll(".dock-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab);
  });
  ui.shop.classList.add("open");
  renderShop();
}

function closeShop() {
  ui.shop.classList.remove("open");
}

function renderShop() {
  const body = ui.shopBody;
  body.innerHTML = "";

  if (state.tab === "build") {
    ui.shopTitle.textContent = "İnşa Et";
    Object.values(BUILDING_DEFS).forEach((def) => {
      if (def.id === "hq") return;
      const owned = countBuildings(def.id);
      const locked = def.unlockLevel && state.level < def.unlockLevel;
      const cost = buildingCost(def, owned);
      const atMax = owned >= def.max;
      const card = document.createElement("div");
      card.className = `shop-card${locked ? " locked" : ""}`;
      card.innerHTML = `
        <div class="shop-icon">${def.icon}</div>
        <div class="shop-info">
          <h3>${def.name}</h3>
          <p>${def.desc}</p>
          <span class="badge ${def.habitat || "land"}">${owned}/${def.max}</span>
          ${locked ? `<span class="badge lock">Sv ${def.unlockLevel}</span>` : ""}
        </div>
        <button class="buy-btn" type="button"></button>
      `;
      const btn = card.querySelector(".buy-btn");
      if (locked) {
        btn.textContent = `Sv ${def.unlockLevel}`;
        btn.disabled = true;
      } else if (atMax) {
        btn.textContent = "Dolu";
        btn.disabled = true;
      } else {
        btn.textContent = `${cost} 🪙`;
        btn.disabled = state.coins < cost;
        btn.addEventListener("click", () => {
          state.placeMode = def.id;
          closeShop();
          hideInspect();
          toast(`${def.name} için boş bir kutu seç`);
        });
      }
      body.appendChild(card);
    });
    return;
  }

  if (state.tab === "animals") {
    ui.shopTitle.textContent = "Hayvan Mağazası";
    ANIMAL_DEFS.forEach((def) => {
      const lockedLevel = state.level < def.unlockLevel;
      const lockedWater = def.type === "water" && !canUnlockWater();
      const locked = lockedLevel || lockedWater;
      const owned = state.animals.filter((a) => a.defId === def.id).length;
      const card = document.createElement("div");
      card.className = `shop-card${locked ? " locked" : ""}`;
      card.innerHTML = `
        <div class="shop-icon">${def.icon}</div>
        <div class="shop-info">
          <h3>${def.name}</h3>
          <p>${def.rarity} · çekicilik +${def.appeal} · sahip: ${owned}</p>
          <span class="badge ${def.type}">${def.type === "water" ? "Su" : "Kara"}</span>
          ${locked ? `<span class="badge lock">Sv ${def.unlockLevel}</span>` : ""}
        </div>
        <button class="buy-btn" type="button"></button>
      `;
      const btn = card.querySelector(".buy-btn");
      if (locked) {
        btn.textContent = lockedWater && !lockedLevel ? `Sv ${WATER_UNLOCK_LEVEL}` : `Sv ${def.unlockLevel}`;
        btn.disabled = true;
      } else {
        btn.textContent = `${def.cost} 🪙`;
        btn.disabled = state.coins < def.cost;
        btn.addEventListener("click", () => buyAnimal(def.id));
      }
      body.appendChild(card);
    });
    return;
  }

  ui.shopTitle.textContent = "Bahçe Özeti";
  const appeal = totalAppeal();
  const waterOpen = canUnlockWater();
  const landCount = state.animals.filter((a) => ANIMAL_DEFS.find((d) => d.id === a.defId)?.type === "land").length;
  const waterCount = state.animals.filter((a) => ANIMAL_DEFS.find((d) => d.id === a.defId)?.type === "water").length;

  const summary = document.createElement("div");
  summary.className = "shop-card";
  summary.innerHTML = `
    <div class="shop-icon">📊</div>
    <div class="shop-info">
      <h3>Çekicilik ${appeal}</h3>
      <p>Binalar: ${state.buildings.length}/${hqEffects().maxBuildings} · Kara: ${landCount} · Su: ${waterCount}</p>
      <span class="badge ${waterOpen ? "water" : "lock"}">${
        waterOpen ? "Su alanı açık" : `Su alanı Sv ${WATER_UNLOCK_LEVEL}`
      }</span>
    </div>
    <button class="buy-btn" type="button">Kaydet</button>
  `;
  summary.querySelector(".buy-btn").addEventListener("click", () => {
    save();
    toast("Bahçe kaydedildi");
  });
  body.appendChild(summary);

  const reset = document.createElement("div");
  reset.className = "shop-card";
  reset.innerHTML = `
    <div class="shop-icon">♻️</div>
    <div class="shop-info">
      <h3>Yeni bahçe</h3>
      <p>İlerlemeyi sıfırlayıp baştan başla.</p>
    </div>
    <button class="buy-btn" type="button">Sıfırla</button>
  `;
  reset.querySelector(".buy-btn").addEventListener("click", () => {
    if (confirm("Bahçeyi sıfırlamak istediğine emin misin?")) {
      localStorage.removeItem(SAVE_KEY);
      newGame();
      hideInspect();
      closeShop();
      updateHud();
      toast("Yeni bahçe kuruldu");
    }
  });
  body.appendChild(reset);
}

function spawnTourist() {
  const cap = hqEffects().touristCap;
  if (state.tourists.length >= cap) return;

  const edge = Math.floor(Math.random() * 4);
  const span = Math.max(GRID_COLS, GRID_ROWS) * CELL * 0.55;
  let x;
  let z;
  if (edge === 0) {
    x = (Math.random() - 0.5) * span * 2;
    z = -span;
  } else if (edge === 1) {
    x = span;
    z = (Math.random() - 0.5) * span * 2;
  } else if (edge === 2) {
    x = (Math.random() - 0.5) * span * 2;
    z = span;
  } else {
    x = -span;
    z = (Math.random() - 0.5) * span * 2;
  }

  const target = state.buildings[Math.floor(Math.random() * state.buildings.length)];
  const tw = gridToWorld(target.gx, target.gy);

  const tourist = {
    id: uid(),
    x,
    z,
    tx: tw.x + (Math.random() - 0.5) * 0.8,
    tz: tw.z + (Math.random() - 0.5) * 0.8,
    speed: 1.4 + Math.random() * 0.9,
    life: 20 + Math.random() * 18,
    paidTicket: false,
    nextSpend: 2 + Math.random() * 3,
    hue: Math.floor(Math.random() * 360),
  };
  state.tourists.push(tourist);

  const mesh = createTouristMesh(tourist.hue);
  mesh.position.set(x, 0, z);
  worldRoot.add(mesh);
  touristMeshes.set(tourist.id, mesh);
}

function updateTourists(dt) {
  const services = state.buildings.filter((b) => ["snack", "gift", "ticket"].includes(b.type));

  for (const t of state.tourists) {
    const dx = t.tx - t.x;
    const dz = t.tz - t.z;
    const dist = Math.hypot(dx, dz) || 1;
    const moving = dist > 0.15;
    if (moving) {
      t.x += (dx / dist) * t.speed * dt;
      t.z += (dz / dist) * t.speed * dt;
    } else if (!t.paidTicket) {
      addCoins(ticketPay());
      addXp(1);
      t.paidTicket = true;
      t.nextSpend = 1.5 + Math.random() * 2;
    } else if (state.buildings.length) {
      const target = state.buildings[Math.floor(Math.random() * state.buildings.length)];
      const tw = gridToWorld(target.gx, target.gy);
      t.tx = tw.x + (Math.random() - 0.5) * 1.0;
      t.tz = tw.z + (Math.random() - 0.5) * 1.0;
    }

    t.nextSpend -= dt;
    if (t.nextSpend <= 0 && t.paidTicket && services.length) {
      const shop = services[Math.floor(Math.random() * services.length)];
      const fx = BUILDING_DEFS[shop.type].effects(shop.level);
      if (Math.random() < (fx.spendChance || 0.2)) {
        addCoins(fx.spend || 2);
        if (fx.xpOnSpend) addXp(fx.xpOnSpend);
      }
      t.nextSpend = 2.5 + Math.random() * 3.5;
    }

    t.life -= dt;

    const mesh = touristMeshes.get(t.id);
    if (mesh) {
      mesh.position.x = t.x;
      mesh.position.z = t.z;
      mesh.rotation.y = Math.atan2(dx, dz);
      animateTourist(mesh, state.time + t.hue * 0.01, moving);
    }
  }

  state.tourists = state.tourists.filter((t) => {
    if (t.life > 0) return true;
    const mesh = touristMeshes.get(t.id);
    if (mesh) {
      worldRoot.remove(mesh);
      touristMeshes.delete(t.id);
    }
    return false;
  });
}

function updateAnimals(dt) {
  for (const a of state.animals) {
    a.bob = (a.bob || 0) + dt;
    const mesh = animalMeshes.get(a.id);
    if (!mesh) continue;
    const baseY = mesh.userData.isWater ? 0.35 : 0;
    mesh.position.y = baseY + Math.sin(a.bob * 2.2) * (mesh.userData.isWater ? 0.08 : 0.04);
    if (mesh.userData.isWater) {
      mesh.rotation.y += dt * 0.6;
    } else {
      mesh.rotation.y += Math.sin(a.bob) * dt * 0.15;
    }
  }
}

function update(dt) {
  state.time += dt;
  state.incomeWindow = state.incomeWindow * Math.pow(0.35, dt) + state.incomeAccum;
  state.incomeDisplay = state.incomeWindow / Math.max(dt, 0.016);
  state.incomeAccum = 0;

  const appeal = totalAppeal();
  const spawnRate = Math.max(0.5, 3.0 - appeal * 0.015 - spawnBonus());
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnTourist();
    state.spawnTimer = spawnRate * (0.75 + Math.random() * 0.5);
  }

  updateTourists(dt);
  updateAnimals(dt);

  if (state.selectedId && Math.floor(state.time * 2) !== Math.floor((state.time - dt) * 2)) {
    const b = state.buildings.find((x) => x.id === state.selectedId);
    if (b) showInspect(b);
  }

  ui.touristCount.textContent = String(state.tourists.length);
  ui.incomeRate.textContent = Math.max(0, Math.floor(state.incomeDisplay)).toLocaleString("tr-TR");
}

function getGridFromEvent(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const pads = [];
  terrain.traverse((o) => {
    if (o.userData?.grid) pads.push(o);
  });
  const hits = raycaster.intersectObjects(pads, false);
  if (hits.length) return hits[0].object.userData.grid;

  // building click
  const bMeshes = [...buildingMeshes.values()];
  const bHits = raycaster.intersectObjects(bMeshes, true);
  if (bHits.length) {
    let obj = bHits[0].object;
    while (obj && !obj.userData.buildingId) obj = obj.parent;
    if (obj?.userData.buildingId) {
      const b = state.buildings.find((x) => x.id === obj.userData.buildingId);
      if (b) return { gx: b.gx, gy: b.gy, building: b };
    }
  }
  return null;
}

function onPointerDown(e) {
  pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
}

function onPointerUp(e) {
  if (!pointerDown) return;
  const dx = e.clientX - pointerDown.x;
  const dy = e.clientY - pointerDown.y;
  const dt = performance.now() - pointerDown.t;
  pointerDown = null;
  if (Math.hypot(dx, dy) > 8 || dt > 500) return; // treat as orbit drag
  if (!state.started) return;

  const hit = getGridFromEvent(e.clientX, e.clientY);
  if (!hit) {
    if (!state.placeMode) hideInspect();
    return;
  }

  if (state.placeMode) {
    placeBuilding(state.placeMode, hit.gx, hit.gy);
    return;
  }

  const building = hit.building || state.buildings.find((b) => b.gx === hit.gx && b.gy === hit.gy);
  if (building) {
    state.selectedId = building.id;
    showInspect(building);
  } else {
    hideInspect();
  }
}

function onPointerMove(e) {
  if (!state.placeMode || !state.started) {
    ghost.visible = false;
    return;
  }
  const hit = getGridFromEvent(e.clientX, e.clientY);
  if (!hit) {
    ghost.visible = false;
    return;
  }
  const { x, z } = gridToWorld(hit.gx, hit.gy);
  ghost.visible = true;
  ghost.position.set(x, 0.1, z);
  const free = !occupied(hit.gx, hit.gy);
  ghost.material.color.setHex(free ? 0xe8b84a : 0xc45c48);
}

// events
window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointermove", onPointerMove);

ui.upgradeBtn.addEventListener("click", upgradeSelected);
ui.closeInspect.addEventListener("click", hideInspect);
ui.closeShop.addEventListener("click", () => {
  closeShop();
  state.placeMode = null;
  ghost.visible = false;
});

document.querySelectorAll(".dock-btn").forEach((btn) => {
  btn.addEventListener("click", () => openShop(btn.dataset.tab));
});

ui.startBtn.addEventListener("click", () => {
  ui.welcome.classList.add("hidden");
  state.started = true;
  camera.position.set(14, 12, 14);
  controls.target.set(0, 0.5, 0);
  controls.update();
  if (!load()) newGame();
  else rebuildWorld();
  updateHud();
  toast("3D bahçen hazır — turistler geliyor!");
});

setInterval(() => {
  if (state.started) save();
}, 8000);

// preview world
if (!load()) {
  state.buildings = [
    createBuilding("hq", 3, 2),
    createBuilding("ticket", 2, 4),
    createBuilding("landHabitat", 5, 2),
  ];
  const habitat = state.buildings.find((b) => b.type === "landHabitat");
  state.animals.push({ id: uid(), defId: "rabbit", buildingId: habitat.id, bob: 0 });
  state.animals.push({ id: uid(), defId: "chicken", buildingId: habitat.id, bob: 2 });
}
rebuildWorld();
updateHud();
resize();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.started) update(dt);
  else {
    state.time += dt;
    updateAnimals(dt);
    // gentle camera orbit on welcome
    camera.position.x = Math.cos(state.time * 0.15) * 14;
    camera.position.z = Math.sin(state.time * 0.15) * 14;
    camera.lookAt(0, 0.5, 0);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
