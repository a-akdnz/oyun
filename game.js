(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");
  const highscoreEl = document.getElementById("highscore");
  const livesEl = document.getElementById("lives");
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const startBtn = document.getElementById("startBtn");

  const STORAGE_KEY = "inci-avi-highscore";
  const MAX_LIVES = 3;

  const state = {
    running: false,
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    score: 0,
    lives: MAX_LIVES,
    shake: 0,
    spawnPearl: 0,
    spawnHazard: 0,
    difficulty: 1,
    player: null,
    pearls: [],
    hazards: [],
    bubbles: [],
    particles: [],
    keys: new Set(),
    pointer: null,
  };

  let highscore = Number(localStorage.getItem(STORAGE_KEY) || 0);
  highscoreEl.textContent = String(highscore);

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function createPlayer() {
    return {
      x: state.width * 0.5,
      y: state.height * 0.62,
      vx: 0,
      vy: 0,
      r: Math.max(16, Math.min(22, state.width * 0.028)),
      angle: 0,
      invuln: 0,
      bob: 0,
    };
  }

  function resetGame() {
    state.score = 0;
    state.lives = MAX_LIVES;
    state.time = 0;
    state.shake = 0;
    state.spawnPearl = 0.4;
    state.spawnHazard = 1.2;
    state.difficulty = 1;
    state.pearls = [];
    state.hazards = [];
    state.particles = [];
    state.player = createPlayer();
    seedBubbles();
    updateHud();
  }

  function seedBubbles() {
    state.bubbles = Array.from({ length: 28 }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      r: 1.5 + Math.random() * 4,
      speed: 12 + Math.random() * 28,
      drift: (Math.random() - 0.5) * 10,
      alpha: 0.12 + Math.random() * 0.28,
    }));
  }

  function updateHud() {
    scoreEl.textContent = String(state.score);
    livesEl.innerHTML = "";
    for (let i = 0; i < MAX_LIVES; i += 1) {
      const heart = document.createElement("span");
      heart.className = `heart${i < state.lives ? "" : " lost"}`;
      livesEl.appendChild(heart);
    }
  }

  function spawnPearl() {
    const r = 8 + Math.random() * 5;
    state.pearls.push({
      x: r + Math.random() * (state.width - r * 2),
      y: -r - 10,
      r,
      vy: 35 + Math.random() * 35 + state.difficulty * 8,
      spin: Math.random() * Math.PI * 2,
      glow: 0.6 + Math.random() * 0.4,
    });
  }

  function spawnHazard() {
    const kind = Math.random() < 0.55 ? "jelly" : "rock";
    if (kind === "jelly") {
      const r = 18 + Math.random() * 14;
      state.hazards.push({
        kind,
        x: r + Math.random() * (state.width - r * 2),
        y: -r - 20,
        r,
        vy: 40 + Math.random() * 40 + state.difficulty * 12,
        phase: Math.random() * Math.PI * 2,
        sway: 28 + Math.random() * 40,
      });
    } else {
      const r = 16 + Math.random() * 18;
      state.hazards.push({
        kind,
        x: r + Math.random() * (state.width - r * 2),
        y: -r - 20,
        r,
        vy: 55 + Math.random() * 50 + state.difficulty * 14,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 1.6,
      });
    }
  }

  function burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.35 + Math.random() * 0.45,
        max: 0.8,
        r: 2 + Math.random() * 3.5,
        color,
      });
    }
  }

  function hitPlayer() {
    if (state.player.invuln > 0) return;
    state.lives -= 1;
    state.shake = 12;
    state.player.invuln = 1.35;
    burst(state.player.x, state.player.y, "#e07a5f", 16);
    updateHud();
    if (state.lives <= 0) endGame();
  }

  function endGame() {
    state.running = false;
    if (state.score > highscore) {
      highscore = state.score;
      localStorage.setItem(STORAGE_KEY, String(highscore));
      highscoreEl.textContent = String(highscore);
      titleEl.textContent = "Yeni rekor!";
      subtitleEl.textContent = `${state.score} inci topladın. Daha derine inmeye hazır mısın?`;
    } else {
      titleEl.textContent = "Dalga seni yakaladı";
      subtitleEl.textContent = `Skorun ${state.score}. En yüksek: ${highscore}`;
    }
    startBtn.textContent = "Tekrar Dene";
    overlay.classList.remove("hidden");
    hud.classList.add("hidden");
  }

  function startGame() {
    resetGame();
    state.running = true;
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
  }

  function updatePlayer(dt) {
    const p = state.player;
    const accel = 980;
    const maxSpeed = 320 + state.difficulty * 12;
    let ax = 0;
    let ay = 0;

    if (state.keys.has("ArrowLeft") || state.keys.has("a") || state.keys.has("A")) ax -= 1;
    if (state.keys.has("ArrowRight") || state.keys.has("d") || state.keys.has("D")) ax += 1;
    if (state.keys.has("ArrowUp") || state.keys.has("w") || state.keys.has("W")) ay -= 1;
    if (state.keys.has("ArrowDown") || state.keys.has("s") || state.keys.has("S")) ay += 1;

    if (state.pointer) {
      const dx = state.pointer.x - p.x;
      const dy = state.pointer.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 8) {
        ax += dx / dist;
        ay += dy / dist;
      }
    }

    const len = Math.hypot(ax, ay) || 1;
    if (ax || ay) {
      p.vx += (ax / len) * accel * dt;
      p.vy += (ay / len) * accel * dt;
    }

    p.vx *= Math.pow(0.86, dt * 60);
    p.vy *= Math.pow(0.86, dt * 60);

    const speed = Math.hypot(p.vx, p.vy);
    if (speed > maxSpeed) {
      p.vx = (p.vx / speed) * maxSpeed;
      p.vy = (p.vy / speed) * maxSpeed;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = Math.max(p.r, Math.min(state.width - p.r, p.x));
    p.y = Math.max(p.r + 48, Math.min(state.height - p.r - 12, p.y));
    p.angle = Math.atan2(p.vy, p.vx || 1) * 0.35;
    p.bob += dt * 3.2;
    if (p.invuln > 0) p.invuln -= dt;
  }

  function updateWorld(dt) {
    state.time += dt;
    state.difficulty = 1 + state.time * 0.045;

    state.spawnPearl -= dt;
    state.spawnHazard -= dt;
    if (state.spawnPearl <= 0) {
      spawnPearl();
      state.spawnPearl = Math.max(0.35, 1.1 - state.difficulty * 0.08);
    }
    if (state.spawnHazard <= 0) {
      spawnHazard();
      if (Math.random() < 0.35 + state.difficulty * 0.04) spawnHazard();
      state.spawnHazard = Math.max(0.45, 1.6 - state.difficulty * 0.1);
    }

    for (const pearl of state.pearls) {
      pearl.y += pearl.vy * dt;
      pearl.spin += dt * 2.4;
    }
    state.pearls = state.pearls.filter((p) => p.y - p.r < state.height + 40);

    for (const h of state.hazards) {
      h.y += h.vy * dt;
      if (h.kind === "jelly") {
        h.phase += dt * 2.1;
        h.x += Math.sin(h.phase) * h.sway * dt;
      } else {
        h.rot += h.spin * dt;
      }
    }
    state.hazards = state.hazards.filter((h) => h.y - h.r < state.height + 60);

    for (const b of state.bubbles) {
      b.y -= b.speed * dt;
      b.x += Math.sin(state.time * 1.5 + b.y * 0.02) * b.drift * dt;
      if (b.y < -10) {
        b.y = state.height + 10;
        b.x = Math.random() * state.width;
      }
    }

    for (const part of state.particles) {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vx *= Math.pow(0.92, dt * 60);
      part.vy *= Math.pow(0.92, dt * 60);
      part.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    const p = state.player;
    for (let i = state.pearls.length - 1; i >= 0; i -= 1) {
      const pearl = state.pearls[i];
      if (Math.hypot(pearl.x - p.x, pearl.y - p.y) < pearl.r + p.r * 0.85) {
        state.score += 1;
        burst(pearl.x, pearl.y, "#f4e8c8", 12);
        state.pearls.splice(i, 1);
        updateHud();
      }
    }

    for (const h of state.hazards) {
      const hitR = h.kind === "jelly" ? h.r * 0.72 : h.r * 0.8;
      if (Math.hypot(h.x - p.x, h.y - p.y) < hitR + p.r * 0.8) {
        hitPlayer();
        break;
      }
    }

    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 28);
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, state.height);
    g.addColorStop(0, "#0b6d7c");
    g.addColorStop(0.45, "#0a5463");
    g.addColorStop(1, "#042830");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.width, state.height);

    const light = ctx.createRadialGradient(
      state.width * 0.5,
      -40,
      20,
      state.width * 0.5,
      state.height * 0.35,
      state.height * 0.75
    );
    light.addColorStop(0, "rgba(184, 240, 232, 0.22)");
    light.addColorStop(1, "rgba(184, 240, 232, 0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, state.width, state.height);

    // Soft sand bed
    ctx.fillStyle = "rgba(196, 164, 110, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, state.height);
    for (let x = 0; x <= state.width; x += 24) {
      const y =
        state.height -
        28 -
        Math.sin(x * 0.02 + state.time * 0.4) * 8 -
        Math.sin(x * 0.05) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(state.width, state.height);
    ctx.closePath();
    ctx.fill();

    for (const b of state.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 245, 240, ${b.alpha})`;
      ctx.fill();
    }
  }

  function drawPearl(pearl) {
    const shimmer = 0.55 + Math.sin(pearl.spin) * 0.2;
    ctx.beginPath();
    ctx.arc(pearl.x, pearl.y, pearl.r * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 232, 200, ${0.12 * pearl.glow})`;
    ctx.fill();

    const grad = ctx.createRadialGradient(
      pearl.x - pearl.r * 0.3,
      pearl.y - pearl.r * 0.35,
      1,
      pearl.x,
      pearl.y,
      pearl.r
    );
    grad.addColorStop(0, "#fff8e8");
    grad.addColorStop(0.55, "#f0d9a0");
    grad.addColorStop(1, "#c9a56a");
    ctx.beginPath();
    ctx.arc(pearl.x, pearl.y, pearl.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pearl.x - pearl.r * 0.28, pearl.y - pearl.r * 0.3, pearl.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
    ctx.fill();
  }

  function drawJelly(h) {
    const pulse = 1 + Math.sin(h.phase * 2) * 0.08;
    ctx.save();
    ctx.translate(h.x, h.y);

    ctx.beginPath();
    ctx.ellipse(0, 0, h.r * pulse, h.r * 0.72 * pulse, 0, Math.PI, 0);
    ctx.fillStyle = "rgba(224, 122, 95, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 210, 190, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = -2; i <= 2; i += 1) {
      const ox = i * (h.r * 0.28);
      ctx.beginPath();
      ctx.moveTo(ox, h.r * 0.1);
      ctx.quadraticCurveTo(
        ox + Math.sin(h.phase + i) * 6,
        h.r * 0.55,
        ox + Math.sin(h.phase * 1.4 + i) * 4,
        h.r * 1.05
      );
      ctx.strokeStyle = "rgba(224, 122, 95, 0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRock(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot);
    ctx.beginPath();
    const sides = 6;
    for (let i = 0; i < sides; i += 1) {
      const a = (i / sides) * Math.PI * 2;
      const rr = h.r * (0.78 + ((i % 2) * 0.22));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "#5c6b63";
    ctx.fill();
    ctx.strokeStyle = "rgba(180, 200, 190, 0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    const p = state.player;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
    if (blink) return;

    const bob = Math.sin(p.bob) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(p.angle);

    // Tail
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.2, 0);
    ctx.quadraticCurveTo(-p.r * 1.15, -p.r * 0.55, -p.r * 1.45, 0);
    ctx.quadraticCurveTo(-p.r * 1.15, p.r * 0.55, -p.r * 0.2, 0);
    ctx.fillStyle = "#2aa3a8";
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * 1.05, p.r * 0.72, 0, 0, Math.PI * 2);
    const body = ctx.createLinearGradient(-p.r, 0, p.r, 0);
    body.addColorStop(0, "#1f8f96");
    body.addColorStop(1, "#6fd3c8");
    ctx.fillStyle = body;
    ctx.fill();

    // Belly
    ctx.beginPath();
    ctx.ellipse(p.r * 0.08, p.r * 0.18, p.r * 0.55, p.r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(244, 232, 200, 0.55)";
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(p.r * 0.45, -p.r * 0.12, p.r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.r * 0.5, -p.r * 0.12, p.r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#04222a";
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (const part of state.particles) {
      const a = Math.max(0, part.life / part.max);
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.r * a, 0, Math.PI * 2);
      ctx.fillStyle = part.color;
      ctx.globalAlpha = a;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawPointerHint() {
    if (!state.pointer || !state.running) return;
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(244, 232, 200, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawIdleScene() {
    drawBackground();
    if (!state.player) state.player = createPlayer();
    state.player.bob += 0.03;
    state.player.x = state.width * 0.5;
    state.player.y = state.height * 0.58;
    drawPlayer();
    // decorative pearls
    for (let i = 0; i < 5; i += 1) {
      const t = state.time * 0.4 + i;
      drawPearl({
        x: state.width * (0.2 + i * 0.15),
        y: state.height * 0.35 + Math.sin(t) * 18,
        r: 7 + (i % 3),
        spin: t,
        glow: 1,
        vy: 0,
      });
    }
  }

  function render() {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }

    if (!state.running) {
      // keep ambient motion on menu
      state.time += 1 / 60;
      if (!state.bubbles.length) seedBubbles();
      for (const b of state.bubbles) {
        b.y -= b.speed * (1 / 60);
        if (b.y < -10) {
          b.y = state.height + 10;
          b.x = Math.random() * state.width;
        }
      }
      drawIdleScene();
      ctx.restore();
      return;
    }

    drawBackground();
    for (const pearl of state.pearls) drawPearl(pearl);
    for (const h of state.hazards) {
      if (h.kind === "jelly") drawJelly(h);
      else drawRock(h);
    }
    drawPlayer();
    drawParticles();
    drawPointerHint();
    ctx.restore();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (state.running) {
      updatePlayer(dt);
      updateWorld(dt);
    }
    render();
    requestAnimationFrame(loop);
  }

  function setPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    state.pointer = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  window.addEventListener("resize", () => {
    resize();
    if (!state.running) {
      seedBubbles();
      state.player = createPlayer();
    }
  });

  window.addEventListener("keydown", (e) => {
    state.keys.add(e.key);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (!state.running && (e.key === "Enter" || e.key === " ")) startGame();
  });
  window.addEventListener("keyup", (e) => state.keys.delete(e.key));

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    setPointer(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pointerType === "touch") setPointer(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", () => {
    state.pointer = null;
  });
  canvas.addEventListener("pointercancel", () => {
    state.pointer = null;
  });

  startBtn.addEventListener("click", startGame);

  resize();
  seedBubbles();
  state.player = createPlayer();
  requestAnimationFrame(loop);
})();
