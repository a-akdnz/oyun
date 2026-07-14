(() => {
  "use strict";

  const SAVE_KEY = "vahsi-bahce-save-v1";
  const WATER_UNLOCK_LEVEL = 5;
  const MAX_BUILDING_LEVEL = 5;
  const GRID_COLS = 8;
  const GRID_ROWS = 6;

  const BUILDING_DEFS = {
    hq: {
      id: "hq",
      name: "Bahçe Merkezi",
      icon: "🏛️",
      desc: "Bahçenin kalbi. Yükseltince daha fazla bina ve turist kapasitesi.",
      category: "core",
      max: 1,
      baseCost: 0,
      color: "#d9a12e",
      effects: (lv) => ({
        maxBuildings: 4 + lv * 2,
        touristCap: 4 + lv * 3,
        xpBonus: lv * 0.05,
      }),
      effectText: (lv) => `Bina limiti ${4 + lv * 2}, turist kapasitesi ${4 + lv * 3}`,
    },
    ticket: {
      id: "ticket",
      name: "Bilet Gişesi",
      icon: "🎫",
      desc: "Turist giriş ücretini ve geliş hızını artırır.",
      category: "service",
      max: 2,
      baseCost: 80,
      color: "#e8b84a",
      effects: (lv) => ({
        ticketPay: 4 + lv * 3,
        spawnBonus: 0.08 * lv,
      }),
      effectText: (lv) => `Bilet +${4 + lv * 3} 🪙, turist gelişi +${Math.round(lv * 8)}%`,
    },
    landHabitat: {
      id: "landHabitat",
      name: "Kara Habitatı",
      icon: "🌲",
      desc: "Kara canlıları için yaşam alanı. Yükseltince daha fazla hayvan sığar.",
      category: "habitat",
      habitat: "land",
      max: 6,
      baseCost: 120,
      color: "#3f8a4e",
      effects: (lv) => ({
        slots: 1 + Math.floor((lv - 1) / 1),
        appeal: 8 + lv * 6,
      }),
      effectText: (lv) => `${1 + (lv - 1)} hayvan yuvası, çekicilik +${8 + lv * 6}`,
    },
    aquarium: {
      id: "aquarium",
      name: "Akvaryum",
      icon: "🐋",
      desc: "Su canlıları için. Seviye 5’te açılır.",
      category: "habitat",
      habitat: "water",
      unlockLevel: WATER_UNLOCK_LEVEL,
      max: 4,
      baseCost: 450,
      color: "#2a7f9e",
      effects: (lv) => ({
        slots: 1 + Math.floor((lv - 1) / 1),
        appeal: 14 + lv * 9,
      }),
      effectText: (lv) => `${1 + (lv - 1)} su yuvası, çekicilik +${14 + lv * 9}`,
    },
    snack: {
      id: "snack",
      name: "Atıştırmalık Standı",
      icon: "🍿",
      desc: "Turistler buraya uğrayıp ekstra harcama yapar.",
      category: "service",
      max: 3,
      baseCost: 150,
      color: "#c45c48",
      effects: (lv) => ({
        spend: 3 + lv * 4,
        spendChance: 0.15 + lv * 0.05,
      }),
      effectText: (lv) => `Harcama +${3 + lv * 4} 🪙, uğme şansı %${Math.round((0.15 + lv * 0.05) * 100)}`,
    },
    gift: {
      id: "gift",
      name: "Hediyelik Dükkan",
      icon: "🎁",
      desc: "Turist harcamalarını ve XP kazancını artırır.",
      category: "service",
      max: 2,
      baseCost: 220,
      color: "#9b6b3b",
      effects: (lv) => ({
        spend: 6 + lv * 5,
        spendChance: 0.1 + lv * 0.04,
        xpOnSpend: 1 + lv,
      }),
      effectText: (lv) => `Hediye +${6 + lv * 5} 🪙, XP +${1 + lv}`,
    },
  };

  const ANIMAL_DEFS = [
    { id: "rabbit", name: "Tavşan", icon: "🐰", type: "land", unlockLevel: 1, cost: 60, appeal: 6, rarity: "yaygın" },
    { id: "chicken", name: "Tavuk", icon: "🐔", type: "land", unlockLevel: 1, cost: 50, appeal: 5, rarity: "yaygın" },
    { id: "goat", name: "Keçi", icon: "🐐", type: "land", unlockLevel: 2, cost: 120, appeal: 10, rarity: "yaygın" },
    { id: "fox", name: "Tilki", icon: "🦊", type: "land", unlockLevel: 3, cost: 220, appeal: 16, rarity: "nadir" },
    { id: "deer", name: "Geyik", icon: "🦌", type: "land", unlockLevel: 4, cost: 350, appeal: 22, rarity: "nadir" },
    { id: "wolf", name: "Kurt", icon: "🐺", type: "land", unlockLevel: 6, cost: 520, appeal: 30, rarity: "epik" },
    { id: "lion", name: "Aslan", icon: "🦁", type: "land", unlockLevel: 8, cost: 900, appeal: 48, rarity: "epik" },
    { id: "elephant", name: "Fil", icon: "🐘", type: "land", unlockLevel: 10, cost: 1500, appeal: 70, rarity: "efsane" },
    { id: "fish", name: "Balık", icon: "🐟", type: "water", unlockLevel: 5, cost: 180, appeal: 12, rarity: "yaygın" },
    { id: "turtle", name: "Kaplumbağa", icon: "🐢", type: "water", unlockLevel: 5, cost: 260, appeal: 18, rarity: "yaygın" },
    { id: "seal", name: "Fok", icon: "🦭", type: "water", unlockLevel: 7, cost: 480, appeal: 28, rarity: "nadir" },
    { id: "dolphin", name: "Yunus", icon: "🐬", type: "water", unlockLevel: 9, cost: 850, appeal: 45, rarity: "epik" },
    { id: "shark", name: "Köpekbalığı", icon: "🦈", type: "water", unlockLevel: 11, cost: 1400, appeal: 65, rarity: "efsane" },
    { id: "whale", name: "Balina", icon: "🐳", type: "water", unlockLevel: 13, cost: 2200, appeal: 95, rarity: "efsane" },
  ];

  const XP_FOR_LEVEL = (level) => Math.floor(40 + (level - 1) * 35 + (level - 1) ** 1.6 * 8);

  const el = {
    canvas: document.getElementById("map"),
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

  const ctx = el.canvas.getContext("2d");

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
    cameraShake: 0,
    incomeAccum: 0,
    incomeDisplay: 0,
    spawnTimer: 1.5,
    floatTexts: [],
    particles: [],
    time: 0,
    dpr: 1,
    width: 0,
    height: 0,
    cell: 64,
    originX: 0,
    originY: 0,
    tab: "build",
  };

  let toastTimer = 0;
  let nextId = 1;
  const uid = () => `id_${nextId++}`;

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 2200);
  }

  function buildingCost(def, ownedCount) {
    return Math.floor(def.baseCost * (1 + ownedCount * 0.65));
  }

  function upgradeCost(building) {
    const def = BUILDING_DEFS[building.type];
    return Math.floor(60 * building.level ** 1.7 + def.baseCost * 0.35 * building.level);
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
      const def = BUILDING_DEFS[b.type];
      const fx = def.effects(b.level);
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
    const habitats = state.buildings.filter((b) => b.type === habitatType);
    for (const h of habitats) {
      if (animalsInBuilding(h.id).length < habitatCapacity(h)) return h;
    }
    return null;
  }

  function canUnlockWater() {
    return state.level >= WATER_UNLOCK_LEVEL;
  }

  function addXp(amount) {
    const bonus = 1 + (hqEffects().xpBonus || 0);
    state.xp += Math.max(1, Math.floor(amount * bonus));
    while (state.xp >= XP_FOR_LEVEL(state.level)) {
      state.xp -= XP_FOR_LEVEL(state.level);
      state.level += 1;
      toast(`Seviye ${state.level}! Yeni hayvanlar açılmış olabilir.`);
      if (state.level === WATER_UNLOCK_LEVEL) {
        toast("Su canlıları ve Akvaryum açıldı!");
      }
    }
    updateHud();
  }

  function addCoins(amount, x, y) {
    state.coins += amount;
    state.incomeAccum += amount;
    if (x != null) {
      state.floatTexts.push({
        x,
        y,
        text: `+${amount} 🪙`,
        life: 1,
        vy: -28,
      });
    }
    updateHud();
  }

  function spendCoins(amount) {
    if (state.coins < amount) return false;
    state.coins -= amount;
    updateHud();
    return true;
  }

  function updateHud() {
    el.coins.textContent = Math.floor(state.coins).toLocaleString("tr-TR");
    el.level.textContent = String(state.level);
    const need = XP_FOR_LEVEL(state.level);
    el.xpFill.style.width = `${Math.min(100, (state.xp / need) * 100)}%`;
    el.touristCount.textContent = String(state.tourists.length);
    el.incomeRate.textContent = Math.floor(state.incomeDisplay).toLocaleString("tr-TR");
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = el.canvas.clientWidth;
    state.height = el.canvas.clientHeight;
    el.canvas.width = Math.floor(state.width * state.dpr);
    el.canvas.height = Math.floor(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const pad = 16;
    state.cell = Math.floor(
      Math.min((state.width - pad * 2) / GRID_COLS, (state.height - pad * 2) / GRID_ROWS)
    );
    state.originX = Math.floor((state.width - state.cell * GRID_COLS) / 2);
    state.originY = Math.floor((state.height - state.cell * GRID_ROWS) / 2 + 8);
  }

  function cellCenter(gx, gy) {
    return {
      x: state.originX + gx * state.cell + state.cell / 2,
      y: state.originY + gy * state.cell + state.cell / 2,
    };
  }

  function occupied(gx, gy, ignoreId = null) {
    return state.buildings.some((b) => b.gx === gx && b.gy === gy && b.id !== ignoreId);
  }

  function createBuilding(type, gx, gy) {
    return {
      id: uid(),
      type,
      gx,
      gy,
      level: 1,
      anim: Math.random() * Math.PI * 2,
    };
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
    // starter rabbit
    const habitat = state.buildings.find((b) => b.type === "landHabitat");
    state.animals.push({
      id: uid(),
      defId: "rabbit",
      buildingId: habitat.id,
      bob: Math.random() * 10,
    });
    save();
  }

  function save() {
    const data = {
      coins: state.coins,
      xp: state.xp,
      level: state.level,
      buildings: state.buildings,
      animals: state.animals.map(({ id, defId, buildingId }) => ({ id, defId, buildingId })),
      nextId,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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
    state.placeMode = null;
    state.selectedId = b.id;
    addXp(8);
    toast(`${def.name} inşa edildi`);
    showInspect(b);
    save();
    bumpParticles(cellCenter(gx, gy).x, cellCenter(gx, gy).y, def.color);
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
    addXp(12 + b.level * 3);
    toast(`${BUILDING_DEFS[b.type].name} seviye ${b.level}`);
    showInspect(b);
    save();
    const c = cellCenter(b.gx, b.gy);
    bumpParticles(c.x, c.y, "#e8b84a");
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
    state.animals.push({
      id: uid(),
      defId: def.id,
      buildingId: habitat.id,
      bob: Math.random() * 10,
    });
    addXp(10 + Math.floor(def.appeal / 4));
    toast(`${def.name} bahçene katıldı!`);
    save();
    renderShop();
    const c = cellCenter(habitat.gx, habitat.gy);
    bumpParticles(c.x, c.y, "#7ad39a");
  }

  function bumpParticles(x, y, color) {
    for (let i = 0; i < 14; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5 + Math.random() * 0.4,
        color,
        r: 2 + Math.random() * 3,
      });
    }
  }

  function showInspect(building) {
    const def = BUILDING_DEFS[building.type];
    el.inspect.classList.remove("hidden");
    el.inspectTitle.textContent = `${def.icon} ${def.name}`;
    el.inspectDesc.textContent = def.desc;
    el.inspectLevel.textContent = `${building.level} / ${MAX_BUILDING_LEVEL}`;
    el.inspectEffect.textContent = def.effectText(building.level);

    if (def.habitat) {
      el.habitatSlots.classList.remove("hidden");
      const housed = animalsInBuilding(building.id);
      const slots = habitatCapacity(building);
      el.habitatSlots.innerHTML = "";
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
        el.habitatSlots.appendChild(row);
      }
    } else {
      el.habitatSlots.classList.add("hidden");
      el.habitatSlots.innerHTML = "";
    }

    if (building.level >= MAX_BUILDING_LEVEL) {
      el.upgradeBtn.disabled = true;
      el.upgradeBtn.textContent = "Maksimum seviye";
    } else {
      const cost = upgradeCost(building);
      el.upgradeBtn.disabled = state.coins < cost;
      el.upgradeBtn.textContent = `Yükselt (${cost.toLocaleString("tr-TR")} 🪙)`;
    }
  }

  function hideInspect() {
    el.inspect.classList.add("hidden");
    state.selectedId = null;
  }

  function openShop(tab) {
    state.tab = tab || state.tab;
    document.querySelectorAll(".dock-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === state.tab);
    });
    el.shop.classList.add("open");
    renderShop();
  }

  function closeShop() {
    el.shop.classList.remove("open");
    state.placeMode = null;
  }

  function renderShop() {
    const body = el.shopBody;
    body.innerHTML = "";

    if (state.tab === "build") {
      el.shopTitle.textContent = "İnşa Et";
      Object.values(BUILDING_DEFS).forEach((def) => {
        if (def.id === "hq") return;
        const owned = countBuildings(def.id);
        const locked = def.unlockLevel && state.level < def.unlockLevel;
        const cost = buildingCost(def, owned);
        const atMax = owned >= def.max;
        const card = document.createElement("div");
        card.className = `shop-card${locked ? " locked" : ""}`;
        card.innerHTML = `
          <div class="shop-icon" style="background:${def.color}33">${def.icon}</div>
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
      el.shopTitle.textContent = "Hayvan Mağazası";
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

    // zoo overview
    el.shopTitle.textContent = "Bahçe Özeti";
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
    let x;
    let y;
    if (edge === 0) {
      x = state.originX + Math.random() * GRID_COLS * state.cell;
      y = state.originY - 10;
    } else if (edge === 1) {
      x = state.originX + GRID_COLS * state.cell + 10;
      y = state.originY + Math.random() * GRID_ROWS * state.cell;
    } else if (edge === 2) {
      x = state.originX + Math.random() * GRID_COLS * state.cell;
      y = state.originY + GRID_ROWS * state.cell + 10;
    } else {
      x = state.originX - 10;
      y = state.originY + Math.random() * GRID_ROWS * state.cell;
    }
    const target = state.buildings[Math.floor(Math.random() * state.buildings.length)];
    const c = cellCenter(target.gx, target.gy);
    state.tourists.push({
      id: uid(),
      x,
      y,
      tx: c.x + (Math.random() - 0.5) * state.cell * 0.4,
      ty: c.y + (Math.random() - 0.5) * state.cell * 0.4,
      speed: 28 + Math.random() * 22,
      life: 18 + Math.random() * 16,
      paidTicket: false,
      nextSpend: 2 + Math.random() * 3,
      hue: Math.floor(Math.random() * 360),
    });
  }

  function updateTourists(dt) {
    const services = state.buildings.filter((b) => ["snack", "gift", "ticket"].includes(b.type));
    for (const t of state.tourists) {
      const dx = t.tx - t.x;
      const dy = t.ty - t.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 6) {
        t.x += (dx / dist) * t.speed * dt;
        t.y += (dy / dist) * t.speed * dt;
      } else if (!t.paidTicket) {
        const pay = ticketPay();
        addCoins(pay, t.x, t.y - 12);
        addXp(1);
        t.paidTicket = true;
        t.nextSpend = 1.5 + Math.random() * 2;
      } else {
        // pick new target
        const target = state.buildings[Math.floor(Math.random() * state.buildings.length)];
        const c = cellCenter(target.gx, target.gy);
        t.tx = c.x + (Math.random() - 0.5) * state.cell * 0.5;
        t.ty = c.y + (Math.random() - 0.5) * state.cell * 0.5;
      }

      t.nextSpend -= dt;
      if (t.nextSpend <= 0 && t.paidTicket && services.length) {
        const shop = services[Math.floor(Math.random() * services.length)];
        const fx = BUILDING_DEFS[shop.type].effects(shop.level);
        if (Math.random() < (fx.spendChance || 0.2)) {
          const gain = fx.spend || 2;
          addCoins(gain, t.x, t.y - 10);
          if (fx.xpOnSpend) addXp(fx.xpOnSpend);
        }
        t.nextSpend = 2.5 + Math.random() * 3.5;
      }

      t.life -= dt;
    }
    state.tourists = state.tourists.filter((t) => t.life > 0);
  }

  function update(dt) {
    state.time += dt;
    // Yaklaşık saniyelik gelir (yumuşatılmış)
    state._incomeWindow = (state._incomeWindow || 0) * Math.pow(0.35, dt) + state.incomeAccum;
    state.incomeDisplay = state._incomeWindow / Math.max(dt, 0.016);
    state.incomeAccum = 0;

    const appeal = totalAppeal();
    const spawnRate = Math.max(0.55, 3.2 - appeal * 0.015 - spawnBonus());
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnTourist();
      state.spawnTimer = spawnRate * (0.75 + Math.random() * 0.5);
    }

    updateTourists(dt);

    for (const a of state.animals) a.bob += dt * 2.5;
    for (const b of state.buildings) b.anim += dt;

    for (const f of state.floatTexts) {
      f.y += f.vy * dt;
      f.life -= dt;
    }
    state.floatTexts = state.floatTexts.filter((f) => f.life > 0);

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.9, dt * 60);
      p.vy *= Math.pow(0.9, dt * 60);
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    // refresh upgrade affordability occasionally
    if (state.selectedId && Math.floor(state.time * 2) !== Math.floor((state.time - dt) * 2)) {
      const b = state.buildings.find((x) => x.id === state.selectedId);
      if (b) showInspect(b);
    }

    el.touristCount.textContent = String(state.tourists.length);
    el.incomeRate.textContent = Math.max(0, Math.floor(state.incomeDisplay)).toLocaleString("tr-TR");
  }

  function drawSoftRect(x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, state.height);
    g.addColorStop(0, "#7ec8e3");
    g.addColorStop(0.32, "#a8dbb4");
    g.addColorStop(1, "#3f8a4e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.width, state.height);

    // distant hills
    ctx.fillStyle = "rgba(47, 107, 60, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, state.originY + 40);
    for (let x = 0; x <= state.width; x += 40) {
      ctx.lineTo(x, state.originY + 20 + Math.sin(x * 0.01 + state.time * 0.2) * 10);
    }
    ctx.lineTo(state.width, state.height);
    ctx.lineTo(0, state.height);
    ctx.fill();
  }

  function drawGrid() {
    for (let gy = 0; gy < GRID_ROWS; gy += 1) {
      for (let gx = 0; gx < GRID_COLS; gx += 1) {
        const x = state.originX + gx * state.cell;
        const y = state.originY + gy * state.cell;
        const checker = (gx + gy) % 2 === 0;
        drawSoftRect(
          x + 3,
          y + 3,
          state.cell - 6,
          state.cell - 6,
          10,
          checker ? "rgba(98, 181, 111, 0.55)" : "rgba(63, 138, 78, 0.5)"
        );

        if (state.placeMode && !occupied(gx, gy)) {
          ctx.strokeStyle = "rgba(232, 184, 74, 0.85)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 8, y + 8, state.cell - 16, state.cell - 16);
        }
      }
    }
  }

  function drawBuilding(b) {
    const def = BUILDING_DEFS[b.type];
    const x = state.originX + b.gx * state.cell;
    const y = state.originY + b.gy * state.cell;
    const pad = 8;
    const selected = b.id === state.selectedId;
    const bob = Math.sin(b.anim * 2) * 2;

    if (def.habitat === "water") {
      drawSoftRect(x + pad, y + pad, state.cell - pad * 2, state.cell - pad * 2, 14, "#1d5f78");
      ctx.fillStyle = "rgba(126, 200, 227, 0.35)";
      ctx.beginPath();
      ctx.ellipse(
        x + state.cell / 2,
        y + state.cell / 2 + 4,
        state.cell * 0.28,
        state.cell * 0.16,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else {
      drawSoftRect(x + pad, y + pad, state.cell - pad * 2, state.cell - pad * 2, 14, def.color);
      drawSoftRect(
        x + pad + 4,
        y + pad + 4,
        state.cell - pad * 2 - 8,
        state.cell * 0.28,
        10,
        "rgba(255,255,255,0.18)"
      );
    }

    if (selected) {
      ctx.strokeStyle = "#fff8e7";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 5, y + 5, state.cell - 10, state.cell - 10);
    }

    ctx.font = `${Math.floor(state.cell * 0.38)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.icon, x + state.cell / 2, y + state.cell / 2 + bob - 4);

    ctx.font = `700 ${Math.max(10, Math.floor(state.cell * 0.16))}px Nunito`;
    ctx.fillStyle = "rgba(28,51,36,0.85)";
    drawSoftRect(x + state.cell / 2 - 16, y + state.cell - 22, 32, 14, 7, "rgba(255,248,231,0.9)");
    ctx.fillStyle = "#1c3324";
    ctx.fillText(`Sv${b.level}`, x + state.cell / 2, y + state.cell - 15);

    // animals in habitat
    if (def.habitat) {
      const housed = animalsInBuilding(b.id);
      housed.forEach((a, i) => {
        const ad = ANIMAL_DEFS.find((d) => d.id === a.defId);
        if (!ad) return;
        const ox = ((i % 3) - 1) * state.cell * 0.22;
        const oy = Math.floor(i / 3) * state.cell * 0.18 + Math.sin(a.bob + i) * 3;
        ctx.font = `${Math.floor(state.cell * 0.22)}px serif`;
        ctx.fillText(ad.icon, x + state.cell / 2 + ox, y + state.cell * 0.68 + oy);
      });
    }
  }

  function drawTourists() {
    for (const t of state.tourists) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${t.hue} 55% 55%)`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(t.x, t.y - 9, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#f3e2c8";
      ctx.fill();
    }
  }

  function drawFloats() {
    for (const f of state.floatTexts) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.font = "700 14px Fredoka";
      ctx.fillStyle = "#fff3c4";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawPlaceHint() {
    if (!state.placeMode) return;
    const def = BUILDING_DEFS[state.placeMode];
    ctx.font = "700 15px Nunito";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(28,51,36,0.75)";
    drawSoftRect(state.width / 2 - 140, 12, 280, 34, 17, "rgba(255,248,231,0.92)");
    ctx.fillStyle = "#1c3324";
    ctx.fillText(`${def.icon} ${def.name} yerleştir — boş kutu seç`, state.width / 2, 30);
  }

  function render() {
    drawBackground();
    drawGrid();
    const ordered = [...state.buildings].sort((a, b) => a.gy - b.gy || a.gx - b.gx);
    for (const b of ordered) drawBuilding(b);
    drawTourists();
    drawFloats();
    drawPlaceHint();
  }

  function canvasToCell(clientX, clientY) {
    const rect = el.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gx = Math.floor((x - state.originX) / state.cell);
    const gy = Math.floor((y - state.originY) / state.cell);
    return { gx, gy, x, y };
  }

  function onCanvasClick(clientX, clientY) {
    const { gx, gy } = canvasToCell(clientX, clientY);
    if (gx < 0 || gy < 0 || gx >= GRID_COLS || gy >= GRID_ROWS) {
      if (state.placeMode) return;
      hideInspect();
      return;
    }

    if (state.placeMode) {
      placeBuilding(state.placeMode, gx, gy);
      return;
    }

    const hit = state.buildings.find((b) => b.gx === gx && b.gy === gy);
    if (hit) {
      state.selectedId = hit.id;
      showInspect(hit);
    } else {
      hideInspect();
    }
  }

  // events
  window.addEventListener("resize", resize);

  el.canvas.addEventListener("pointerdown", (e) => {
    onCanvasClick(e.clientX, e.clientY);
  });

  el.upgradeBtn.addEventListener("click", upgradeSelected);
  el.closeInspect.addEventListener("click", hideInspect);
  el.closeShop.addEventListener("click", closeShop);

  document.querySelectorAll(".dock-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openShop(btn.dataset.tab);
    });
  });

  el.startBtn.addEventListener("click", () => {
    el.welcome.classList.add("hidden");
    state.started = true;
    if (!load()) newGame();
    updateHud();
    toast("Bahçen hazır — turistler geliyor!");
  });

  // autosave
  setInterval(() => {
    if (state.started) save();
  }, 8000);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.started) update(dt);
    else state.time += dt;
    render();
    requestAnimationFrame(loop);
  }

  resize();
  // preview map even before start
  if (!load()) {
    state.buildings = [
      createBuilding("hq", 3, 2),
      createBuilding("ticket", 2, 4),
      createBuilding("landHabitat", 5, 2),
    ];
  } else {
    // keep loaded preview
  }
  updateHud();
  requestAnimationFrame(loop);
})();
