const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthFill = document.getElementById("healthFill");
const energyFill = document.getElementById("energyFill");
const questText = document.getElementById("questText");
const statsText = document.getElementById("statsText");
const messagePanel = document.getElementById("messagePanel");
const messageTitle = document.getElementById("messageTitle");
const messageBody = document.getElementById("messageBody");
const startOverlay = document.getElementById("startOverlay");
const startButton = document.getElementById("startButton");
const endOverlay = document.getElementById("endOverlay");
const endTitle = document.getElementById("endTitle");
const endText = document.getElementById("endText");
const restartButton = document.getElementById("restartButton");
const stickBase = document.getElementById("stickBase");
const stickKnob = document.getElementById("stickKnob");
const attackButton = document.getElementById("attackButton");
const dashButton = document.getElementById("dashButton");
const specialButton = document.getElementById("specialButton");

const world = { width: 5200, height: 4200 };
const keys = new Set();
const input = { x: 0, y: 0, pointerId: null };
const camera = { x: 0, y: 0 };
const effects = [];

const player = {
  x: 360,
  y: 420,
  radius: 22,
  speed: 245,
  hp: 100,
  maxHp: 100,
  energy: 24,
  maxEnergy: 100,
  shards: 0,
  xp: 0,
  attackTimer: 0,
  dashTimer: 0,
  invulnTimer: 0,
  facing: 0,
  bladeSpin: 0,
};

const npcs = [
  {
    name: "Yumi (NPC)",
    x: 820,
    y: 650,
    color: "#ffd166",
    text: "You're really inside the game, aren't you? The Blade Drones will hunt you down. Collect 24 Sync Cores to power the Exit Gate near the Dark Fortress.",
  },
  {
    name: "Master Hoshi (NPC)",
    x: 540,
    y: 360,
    color: "#bde0fe",
    text: "While you're trapped in this body, use its quick strikes, dash through rotating blades, and charge your Sync Watch for a special blast.",
  },
];

const enemies = [
  enemy("Blade Drone", 610, 520, 48, 92, "#8ecae6"),
  enemy("Saw Scout", 1040, 410, 34, 138, "#bde0fe"),
  enemy("Armored Rotor Bot", 1240, 840, 82, 62, "#adb5bd"),
  enemy("Shadow Mech Samurai", 1620, 760, 96, 98, "#9d4edd"),
  enemy("Giant War Drone", 1880, 1160, 140, 48, "#495057"),
  enemy("Saw Scout", 700, 1120, 34, 138, "#bde0fe"),
  enemy("Blade Drone", 1480, 1340, 48, 92, "#8ecae6"),
  enemy("Patrol Drone", 2320, 1780, 58, 108, "#90e0ef"),
  enemy("Twin Rotor Hunter", 2860, 1320, 72, 118, "#ced4da"),
  enemy("Fortress Slicer", 3480, 2380, 96, 92, "#6c757d"),
  enemy("Blade Drone", 4100, 2840, 54, 104, "#8ecae6"),
  enemy("Giant War Drone", 4550, 3480, 150, 52, "#343a40"),
  enemy("Glitch Overlord", 4700, 3650, 480, 60, "#ff36ab"),
];

const shards = Array.from({ length: 24 }, (_, i) => ({
  x: 300 + (i * 367) % 4550,
  y: 270 + (i * 521) % 3520,
  taken: false,
  bob: Math.random() * 10,
}));

const blockers = [
  { x: 200, y: 220, w: 320, h: 80, type: "bamboo" },
  { x: 930, y: 530, w: 380, h: 210, type: "village" },
  { x: 1450, y: 220, w: 360, h: 150, type: "temple" },
  { x: 1720, y: 1060, w: 440, h: 280, type: "fortress" },
  { x: 420, y: 1320, w: 420, h: 110, type: "river" },
  { x: 2450, y: 650, w: 520, h: 190, type: "bamboo" },
  { x: 3060, y: 1090, w: 560, h: 280, type: "village" },
  { x: 3740, y: 1720, w: 520, h: 240, type: "temple" },
  { x: 4080, y: 2780, w: 720, h: 520, type: "fortress" },
  { x: 2320, y: 3010, w: 760, h: 130, type: "river" },
  { x: 620, y: 2600, w: 680, h: 170, type: "bamboo" },
];

const scenery = Array.from({ length: 90 }, (_, i) => ({
  x: 180 + (i * 571) % 4860,
  y: 180 + (i * 337) % 3820,
  h: 60 + (i % 5) * 22,
  r: 12 + (i % 4) * 5,
  type: i % 7 === 0 ? "rock" : "tree",
}));

// "Glitch Zone" - corrupted area surrounding the Glitch Overlord boss
const glitchZone = { x: 4250, y: 3200, w: 900, h: 850 };

const glitchCubes = Array.from({ length: 22 }, (_, i) => ({
  x: glitchZone.x + (i * 173) % glitchZone.w,
  y: glitchZone.y + (i * 241) % glitchZone.h,
  size: 16 + (i % 4) * 9,
  h: 40 + (i % 5) * 30,
  bob: Math.random() * 10,
  hue: i % 3,
}));

// Exit Gate - appears once all Sync Cores are collected and all drones are destroyed
const portal = { x: 1900, y: 980, active: false, t: 0 };

let lastTime = performance.now();
let running = false;
let gameWon = false;
let messageTimer = 5;

function enemy(name, x, y, hp, speed, color) {
  return {
    name,
    x,
    y,
    hp,
    maxHp: hp,
    speed,
    color,
    radius: name === "Glitch Overlord" ? 64 : name === "Giant War Drone" ? 35 : 24,
    hitTimer: 0,
    attackCooldown: 0,
    chargeTimer: 0,
    chargeCooldown: 1.5,
    chargeAngle: 0,
    dead: false,
  };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function showMessage(title, body, seconds = 3) {
  messageTitle.textContent = title;
  messageBody.textContent = body;
  messagePanel.classList.remove("hidden");
  messageTimer = seconds;
}

function update(dt) {
  if (!running) return;

  messageTimer -= dt;
  if (messageTimer <= 0) messagePanel.classList.add("hidden");

  const keyboardX = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const keyboardY = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
  let moveX = input.x || keyboardX;
  let moveY = input.y || keyboardY;
  const len = Math.hypot(moveX, moveY) || 1;
  moveX /= len;
  moveY /= len;

  if (moveX || moveY) player.facing = Math.atan2(moveY, moveX);

  let speed = player.speed * (player.dashTimer > 0 ? 2.8 : 1);
  player.dashTimer = Math.max(0, player.dashTimer - dt);
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.energy = Math.min(player.maxEnergy, player.energy + dt * 4);
  player.bladeSpin += dt * 9;

  moveEntity(player, moveX * speed * dt, moveY * speed * dt);

  for (const shard of shards) {
    shard.bob += dt * 5;
    if (!shard.taken && dist(player, shard) < 42) {
      shard.taken = true;
      player.shards++;
      player.energy = Math.min(player.maxEnergy, player.energy + 12);
      showMessage("Sync Core", "Core collected. The Sync Watch is charging.", 1.8);
    }
  }

  for (const npc of npcs) {
    if (dist(player, npc) < 64) {
      showMessage(npc.name, npc.text, 2.4);
    }
  }

  updateEnemies(dt);
  updateEffects(dt);
  updatePortal(dt);
  updateHud();
}

function updatePortal(dt) {
  if (!portal.active) {
    if (player.shards >= 24 && enemies.every((e) => e.dead)) {
      portal.active = true;
      showMessage("Exit Gate Online", "All Sync Cores collected and every drone destroyed. The Exit Gate has opened by the Dark Fortress!", 4.5);
    }
    return;
  }

  portal.t += dt;
  if (!gameWon && dist(player, portal) < 70) {
    triggerEnding();
  }
}

function triggerEnding() {
  gameWon = true;
  running = false;
  endOverlay.classList.remove("hidden");
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    e.hitTimer = Math.max(0, e.hitTimer - dt);
    e.attackCooldown = Math.max(0, e.attackCooldown - dt);
    const d = dist(player, e);

    if (e.name === "Glitch Overlord") {
      e.chargeTimer = Math.max(0, e.chargeTimer - dt);
      e.chargeCooldown = Math.max(0, e.chargeCooldown - dt);

      if (e.chargeTimer > 0) {
        moveEntity(e, Math.cos(e.chargeAngle) * 640 * dt, Math.sin(e.chargeAngle) * 640 * dt);
      } else if (d < 700 && e.chargeCooldown <= 0) {
        e.chargeAngle = Math.atan2(player.y - e.y, player.x - e.x);
        e.chargeTimer = 0.55;
        e.chargeCooldown = 3.4;
        effects.push(burst(e.x, e.y, "#ff36ab", 1.8));
        showMessage("Glitch Overlord", "Warning: corrupted charge attack incoming!", 1.4);
      } else if (d < 600) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        if (d > player.radius + e.radius + 8) {
          moveEntity(e, Math.cos(angle) * e.speed * dt, Math.sin(angle) * e.speed * dt);
        }
      }

      if (d < player.radius + e.radius + 6 && e.attackCooldown <= 0 && player.invulnTimer <= 0) {
        player.hp = Math.max(0, player.hp - (e.chargeTimer > 0 ? 32 : 22));
        player.invulnTimer = 0.75;
        e.attackCooldown = 1.1;
        effects.push(hitText(player.x, player.y - 44, "-HP", "#ff36ab"));
        showMessage(e.name, "The Glitch Overlord's corrupted code tears at you!", 1.3);
      }
      continue;
    }

    if (d < 450) {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      if (d > player.radius + e.radius + 8) {
        moveEntity(e, Math.cos(angle) * e.speed * dt, Math.sin(angle) * e.speed * dt);
      } else if (e.attackCooldown <= 0 && player.invulnTimer <= 0) {
        player.hp = Math.max(0, player.hp - (e.name === "Giant War Drone" ? 18 : 9));
        player.invulnTimer = 0.75;
        e.attackCooldown = 1.15;
        effects.push(hitText(player.x, player.y - 44, "-HP", "#ff6b6b"));
        showMessage(e.name, "Rotating blade hit. Dash away or counterattack.", 1.3);
      }
    }
  }

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    player.x = 360;
    player.y = 420;
    player.energy = 30;
    showMessage("Respawned", "The game gives your character another life.", 3);
  }
}

function moveEntity(entity, dx, dy) {
  const oldX = entity.x;
  const oldY = entity.y;
  entity.x = clamp(entity.x + dx, entity.radius, world.width - entity.radius);
  entity.y = clamp(entity.y + dy, entity.radius, world.height - entity.radius);

  for (const b of blockers) {
    if (circleRect(entity.x, entity.y, entity.radius, b)) {
      entity.x = oldX;
      entity.y = oldY;
      break;
    }
  }
}

function attack() {
  if (!running || player.attackTimer > 0) return;
  player.attackTimer = 0.34;
  const range = 90;
  let landed = false;
  effects.push(slashEffect(player.x, player.y, player.facing, "#fef3c7"));

  for (const e of enemies) {
    if (e.dead) continue;
    const angle = Math.atan2(e.y - player.y, e.x - player.x);
    const arc = Math.abs(angleDiff(angle, player.facing));
    if (dist(player, e) < range + e.radius && arc < 1.25) {
      e.hp -= 22;
      e.hitTimer = 0.2;
      landed = true;
      const push = Math.atan2(e.y - player.y, e.x - player.x);
      moveEntity(e, Math.cos(push) * 30, Math.sin(push) * 30);
      effects.push(hitText(e.x, e.y - 38, "CLANG", "#ffe66d"));
      if (e.hp <= 0) {
        e.dead = true;
        player.xp += e.maxHp;
        player.energy = Math.min(player.maxEnergy, player.energy + 18);
        effects.push(burst(e.x, e.y, "#8ecae6"));
      }
    }
  }

  if (landed) showMessage("Samurai Combo", "Clean hit. Chain attacks to charge the Sync Watch.", 1);
}

function dash() {
  if (!running || player.dashTimer > 0) return;
  player.dashTimer = 0.16;
  player.invulnTimer = 0.28;
  effects.push(burst(player.x, player.y, "#90f1ef"));
}

function special() {
  if (!running || player.energy < 100) return;
  player.energy = 0;
  effects.push(slashEffect(player.x, player.y, player.facing, "#56cfe1", 1.8));
  effects.push(burst(player.x + Math.cos(player.facing) * 80, player.y + Math.sin(player.facing) * 80, "#72efdd", 1.4));

  for (const e of enemies) {
    if (e.dead) continue;
    if (dist(player, e) < 210) {
      e.hp -= 58;
      e.hitTimer = 0.35;
      effects.push(hitText(e.x, e.y - 48, "SPIRIT", "#72efdd"));
      if (e.hp <= 0) {
        e.dead = true;
        player.xp += e.maxHp;
      }
    }
  }
  showMessage("Sync Watch Burst", "Special attack unleashed from the Sync Watch.", 1.6);
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life -= dt;
    effects[i].age += dt;
    if (effects[i].life <= 0) effects.splice(i, 1);
  }
}

function updateHud() {
  healthFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
  energyFill.style.width = `${(player.energy / player.maxEnergy) * 100}%`;
  statsText.textContent = `Sync Cores ${player.shards} / 24 | XP ${player.xp}`;
  const aliveEnemies = enemies.filter((e) => !e.dead).length;
  if (portal.active) {
    questText.textContent = "Quest: Reach the Exit Gate near the Dark Fortress!";
  } else if (player.shards >= 24 && aliveEnemies <= 0) {
    questText.textContent = "Quest: The Exit Gate is opening...";
  } else if (player.shards >= 24) {
    questText.textContent = `Quest: Defeat remaining drones, including the Glitch Overlord. ${aliveEnemies} left.`;
  } else {
    questText.textContent = `Quest: Collect Sync Cores (${player.shards}/24) and clear the drones.`;
  }
}


function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function slashEffect(x, y, angle, color, scale = 1) {
  return { type: "slash", x, y, angle, color, scale, life: 0.18, maxLife: 0.18, age: 0 };
}

function hitText(x, y, text, color) {
  return { type: "text", x, y, text, color, life: 0.55, maxLife: 0.55, age: 0 };
}

function burst(x, y, color, scale = 1) {
  return { type: "burst", x, y, color, scale, life: 0.42, maxLife: 0.42, age: 0 };
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function circleRect(cx, cy, radius, rect) {
  const x = clamp(cx, rect.x, rect.x + rect.w);
  const y = clamp(cy, rect.y, rect.y + rect.h);
  return Math.hypot(cx - x, cy - y) < radius;
}

function getView() {
  const yaw = player.facing || 0.45;
  return {
    x: player.x - Math.cos(yaw) * 440,
    z: player.y - Math.sin(yaw) * 440,
    y: 250,
    yaw,
    fov: Math.min(innerWidth, innerHeight) * 0.68,
  };
}

function project3d(x, y, z, view = getView()) {
  const dx = x - view.x;
  const dz = z - view.z;
  const dy = y - view.y;
  const rightX = -Math.sin(view.yaw);
  const rightZ = Math.cos(view.yaw);
  const forwardX = Math.cos(view.yaw);
  const forwardZ = Math.sin(view.yaw);
  const camX = dx * rightX + dz * rightZ;
  const camZ = dx * forwardX + dz * forwardZ;
  if (camZ < 40) return null;
  const scale = view.fov / camZ;
  return {
    x: innerWidth / 2 + camX * scale,
    y: innerHeight * 0.72 - dy * scale,
    scale,
    depth: camZ,
  };
}

function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  drawSky3d();
  drawWorld();
  drawEntities();
  drawEffects();
  requestAnimationFrame(loop);
}

function drawSky3d() {
  const sky = ctx.createLinearGradient(0, 0, 0, innerHeight);
  sky.addColorStop(0, "#80c7ff");
  sky.addColorStop(0.48, "#d9f3ff");
  sky.addColorStop(0.49, "#62a35b");
  sky.addColorStop(1, "#224d34");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.arc(innerWidth - 110, 90, 38, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 7; i++) {
    const x = 70 + i * 180;
    drawMountain(x, innerHeight * 0.48, 140 + (i % 3) * 30, "#6f8f75");
  }
}

function drawMountain(x, baseY, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - size, baseY);
  ctx.lineTo(x, baseY - size);
  ctx.lineTo(x + size, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawWorld() {
  const view = getView();
  drawGroundGrid(view);
  drawPath3d(250, 430, 4680, 3500, "#c39155", view);
  drawPath3d(780, 300, 3150, 3650, "#b8814b", view);
  drawPath3d(520, 2580, 4480, 2850, "#d0a05d", view);

  drawGlitchZoneGround(view);

  for (const b of blockers) {
    const color = {
      bamboo: "#0b6e4f",
      village: "#99582a",
      temple: "#e9ecef",
      fortress: "#1b1b24",
      river: "#168aad",
    }[b.type];
    const height = b.type === "river" ? 4 : b.type === "bamboo" ? 90 : b.type === "fortress" ? 130 : 80;
    drawBox3d(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, height, color, view);
  }

  for (const prop of scenery) {
    if (prop.type === "rock") {
      drawBox3d(prop.x, prop.y, prop.r * 2.4, prop.r * 1.8, prop.h * 0.38, "#6c757d", view);
    } else {
      drawTree3d(prop.x, prop.y, prop.r, prop.h, view);
    }
  }

  for (const cube of glitchCubes) drawGlitchCube(cube, view);

  if (portal.active) drawPortal(view);
}

function drawGlitchZoneGround(view) {
  const x1 = glitchZone.x;
  const x2 = glitchZone.x + glitchZone.w;
  const z1 = glitchZone.y;
  const z2 = glitchZone.y + glitchZone.h;
  const p1 = project3d(x1, 1, z1, view);
  const p2 = project3d(x2, 1, z1, view);
  const p3 = project3d(x2, 1, z2, view);
  const p4 = project3d(x1, 1, z2, view);
  if (p1 && p2 && p3 && p4) {
    poly([p1, p2, p3, p4], "rgba(255, 54, 171, 0.16)");
  }
}

function drawGlitchCube(cube, view) {
  cube.bob += 0.02;
  const y = cube.h + Math.sin(cube.bob) * 14;
  const p = project3d(cube.x, y, cube.y, view);
  if (!p) return;
  const size = Math.max(3, cube.size * p.scale);
  const colors = ["#ff36ab", "#a955ff", "#39d2ff"];
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(cube.bob * 0.6);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = colors[cube.hue];
  ctx.shadowColor = colors[cube.hue];
  ctx.shadowBlur = 14;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawPortal(view) {
  const p = project3d(portal.x, 100, portal.y, view);
  if (!p) return;
  const s = Math.max(0.3, p.scale);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  ctx.rotate(portal.t * 1.4);
  const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 110);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.35, "#72efdd");
  grad.addColorStop(0.7, "#56cfe1");
  grad.addColorStop(1, "rgba(86,207,225,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 100, 130, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, 0, 100, 130, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawWorldText("EXIT GATE", portal.x, 200, portal.y, view);
}

function drawGroundGrid(view) {
  for (let x = 0; x <= world.width; x += 180) {
    const a = project3d(x, 0, 0, view);
    const b = project3d(x, 0, world.height, view);
    if (a && b) line2d(a, b, "rgba(255,255,255,0.08)", 1);
  }
  for (let z = 0; z <= world.height; z += 180) {
    const a = project3d(0, 0, z, view);
    const b = project3d(world.width, 0, z, view);
    if (a && b) line2d(a, b, "rgba(255,255,255,0.08)", 1);
  }
}

function drawPath3d(x1, z1, x2, z2, color, view) {
  const steps = 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t + Math.sin(t * Math.PI) * 180;
    const p = project3d(x, 2, z, view);
    if (!p) continue;
    if (!started) {
      ctx.moveTo(p.x, p.y);
      started = true;
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
}

function drawEntities() {
  const view = getView();
  const items = [];
  for (const shard of shards) {
    if (!shard.taken) items.push({ kind: "shard", ref: shard, depth: depthOf(shard.x, shard.y, view) });
  }
  for (const n of npcs) items.push({ kind: "npc", ref: n, depth: depthOf(n.x, n.y, view) });
  for (const e of enemies) {
    if (!e.dead) items.push({ kind: "enemy", ref: e, depth: depthOf(e.x, e.y, view) });
  }
  items.push({ kind: "player", ref: player, depth: depthOf(player.x, player.y, view) });
  items.sort((a, b) => b.depth - a.depth);

  for (const item of items) {
    if (item.kind === "shard") drawShard(item.ref, view);
    if (item.kind === "npc") drawNpc(item.ref, view);
    if (item.kind === "enemy") drawEnemy(item.ref, view);
    if (item.kind === "player") drawPlayer(view);
  }
}

function depthOf(x, z, view) {
  return (x - view.x) * Math.cos(view.yaw) + (z - view.z) * Math.sin(view.yaw);
}

function drawBox3d(cx, cz, w, d, h, color, view) {
  const x1 = cx - w / 2;
  const x2 = cx + w / 2;
  const z1 = cz - d / 2;
  const z2 = cz + d / 2;
  const p = [
    project3d(x1, 0, z1, view), project3d(x2, 0, z1, view),
    project3d(x2, 0, z2, view), project3d(x1, 0, z2, view),
    project3d(x1, h, z1, view), project3d(x2, h, z1, view),
    project3d(x2, h, z2, view), project3d(x1, h, z2, view),
  ];
  if (p.some((point) => !point)) return;
  poly([p[4], p[5], p[6], p[7]], shade(color, 20));
  poly([p[0], p[1], p[5], p[4]], shade(color, -12));
  poly([p[1], p[2], p[6], p[5]], shade(color, -26));
  poly([p[2], p[3], p[7], p[6]], shade(color, -18));
}

function drawTree3d(x, z, radius, height, view) {
  const base = project3d(x, 0, z, view);
  const top = project3d(x, height, z, view);
  if (!base || !top) return;
  const trunkW = Math.max(2, radius * base.scale * 0.5);
  ctx.strokeStyle = "#5c3518";
  ctx.lineWidth = trunkW;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(top.x, top.y + radius * base.scale);
  ctx.stroke();

  const leaf = ctx.createRadialGradient(top.x - 5, top.y - 8, 2, top.x, top.y, radius * base.scale * 3);
  leaf.addColorStop(0, "#b7efc5");
  leaf.addColorStop(0.45, "#2d6a4f");
  leaf.addColorStop(1, "#081c15");
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.ellipse(top.x, top.y, radius * base.scale * 2.4, radius * base.scale * 3.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawShard(s, view) {
  const bob = Math.sin(s.bob) * 8;
  const p = project3d(s.x, 34 + bob, s.y, view);
  if (!p) return;
  const size = Math.max(4, 16 * p.scale);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.PI / 4 + s.bob * 0.2);
  ctx.fillStyle = "#72efdd";
  ctx.shadowColor = "#72efdd";
  ctx.shadowBlur = 18;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawNpc(n, view) {
  drawBillboardShadow(n.x, n.y, 22, view);
  drawCylinderPerson(n.x, n.y, n.color, "#263238", view);
  drawWorldText(n.name, n.x, 88, n.y, view);
}

function drawEnemy(e, view) {
  drawBillboardShadow(e.x, e.y, e.radius + 12, view);
  const p = project3d(e.x, 70, e.y, view);
  if (!p) return;
  const r = Math.max(8, e.radius * p.scale * 1.9);
  const spin = player.bladeSpin;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = "#d9fbff";
  ctx.lineWidth = Math.max(2, 4 * p.scale);
  drawRobotArm2d(-r * 0.78, 0, -r * 1.34, r * 0.1, r * 0.72, spin);
  drawRobotArm2d(r * 0.78, 0, r * 1.34, r * 0.1, r * 0.72, -spin);

  const bodyGradient = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.12, 0, 0, r * 1.25);
  bodyGradient.addColorStop(0, e.hitTimer > 0 ? "#ffffff" : "#f8f9fa");
  bodyGradient.addColorStop(0.42, e.hitTimer > 0 ? "#fff8dc" : e.color);
  bodyGradient.addColorStop(1, "#212529");
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.32, r * 0.24, r * 0.11, -0.3, 0, Math.PI * 2);
  ctx.fill();

  roundedRect(-r * 0.5, -r * 0.18, r, r * 0.3, r * 0.08);
  ctx.fillStyle = "#11151a";
  ctx.fill();

  const lensGlow = ctx.createRadialGradient(0, -r * 0.04, 1, 0, -r * 0.04, r * 0.5);
  lensGlow.addColorStop(0, "#b7ff4a");
  lensGlow.addColorStop(0.45, "#39ff14");
  lensGlow.addColorStop(1, "rgba(57,255,20,0)");
  ctx.fillStyle = lensGlow;
  ctx.beginPath();
  ctx.arc(0, -r * 0.02, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#081c15";
  ctx.beginPath();
  ctx.arc(0, -r * 0.02, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8ffcc";
  ctx.beginPath();
  ctx.arc(r * 0.06, -r * 0.08, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2b2d42";
  ctx.beginPath();
  ctx.moveTo(-r * 0.24, r * 0.58);
  ctx.lineTo(0, r * 0.96);
  ctx.lineTo(r * 0.24, r * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const hp = project3d(e.x, 112, e.y, view);
  if (hp) {
    ctx.fillStyle = "#ef233c";
    ctx.fillRect(hp.x - 24, hp.y, 48 * Math.max(0, e.hp / e.maxHp), 5);
  }
}

function drawPlayer(view) {
  drawBillboardShadow(player.x, player.y, 30, view);
  const p = project3d(player.x, 48, player.y, view);
  if (!p) return;
  const s = Math.max(0.35, p.scale);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.lineTo(-23, 48);
  ctx.moveTo(14, 4);
  ctx.lineTo(23, 48);
  ctx.stroke();
  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-14, 5);
  ctx.lineTo(-22, 47);
  ctx.moveTo(14, 5);
  ctx.lineTo(22, 47);
  ctx.stroke();

  const armor = ctx.createLinearGradient(-24, -48, 24, 8);
  armor.addColorStop(0, player.invulnTimer > 0 ? "#d7f9ff" : "#7cff5b");
  armor.addColorStop(0.48, "#111");
  armor.addColorStop(1, "#39ff14");
  ctx.fillStyle = armor;
  roundedRect(-23, -48, 46, 58, 10);
  ctx.fill();
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#f8f9fa";
  roundedRect(-8, -39, 16, 38, 4);
  ctx.fill();
  ctx.fillStyle = "#39ff14";
  roundedRect(-5, -32, 10, 22, 3);
  ctx.fill();

  ctx.fillStyle = "#f1c27d";
  ctx.beginPath();
  ctx.arc(0, -58, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.arc(-4, -62, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2b1609";
  roundedRect(-14, -74, 28, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.fillRect(-11, -70, 22, 5);

  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-16, -24);
  ctx.lineTo(-38, -4);
  ctx.moveTo(16, -24);
  ctx.lineTo(35, -6);
  ctx.stroke();

  ctx.fillStyle = "#101214";
  ctx.beginPath();
  ctx.arc(-40, -3, 8, 0, Math.PI * 2);
  ctx.fill();

  const watchGlow = ctx.createRadialGradient(-40, -3, 1, -40, -3, 14);
  watchGlow.addColorStop(0, player.energy >= player.maxEnergy ? "#d8ffcc" : "#99f6e4");
  watchGlow.addColorStop(0.48, player.energy >= player.maxEnergy ? "#70e000" : "#1dd3b0");
  watchGlow.addColorStop(1, "rgba(29,211,176,0)");
  ctx.fillStyle = watchGlow;
  ctx.beginPath();
  ctx.arc(-40, -3, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101214";
  ctx.beginPath();
  ctx.arc(37, -5, 6, 0, Math.PI * 2);
  ctx.fill();

  const blade = ctx.createLinearGradient(18, -20, 68, -58);
  blade.addColorStop(0, "#8d99ae");
  blade.addColorStop(0.4, "#ffffff");
  blade.addColorStop(1, "#adb5bd");
  ctx.strokeStyle = blade;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(18, -20);
  ctx.lineTo(68, -58);
  ctx.stroke();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, -17);
  ctx.lineTo(25, -25);
  ctx.stroke();

  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, -65);
  ctx.lineTo(31, -86);
  ctx.stroke();
  ctx.fillStyle = "#39ff14";
  ctx.beginPath();
  ctx.arc(32, -87, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRobotArm2d(x1, y1, x2, y2, bladeRadius, spin) {
  ctx.strokeStyle = "#495057";
  ctx.lineWidth = Math.max(3, bladeRadius * 0.14);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.fillStyle = "#212529";
  ctx.beginPath();
  ctx.arc(x2, y2, bladeRadius * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x2, y2);
  ctx.rotate(spin);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    const blade = ctx.createLinearGradient(0, 0, 0, -bladeRadius);
    blade.addColorStop(0, "#6c757d");
    blade.addColorStop(0.55, "#f8f9fa");
    blade.addColorStop(1, "#adb5bd");
    ctx.strokeStyle = blade;
    ctx.lineWidth = Math.max(3, bladeRadius * 0.13);
    ctx.beginPath();
    ctx.moveTo(0, -bladeRadius * 0.18);
    ctx.lineTo(0, -bladeRadius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCylinderPerson(x, z, headColor, bodyColor, view) {
  const p = project3d(x, 44, z, view);
  if (!p) return;
  const s = Math.max(0.3, p.scale);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-14, -8, 28, 36);
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(0, -19, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEffects() {
  const view = getView();
  for (const e of effects) {
    const alpha = Math.max(0, e.life / e.maxLife);
    const p = project3d(e.x, e.type === "text" ? 90 : 36, e.y, view);
    if (!p) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (e.type === "slash") {
      ctx.translate(p.x, p.y);
      ctx.rotate(e.angle);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = Math.max(3, 12 * p.scale * e.scale);
      ctx.beginPath();
      ctx.arc(0, -5, 95 * p.scale * e.scale, -0.55, 0.55);
      ctx.stroke();
    }
    if (e.type === "text") {
      ctx.fillStyle = e.color;
      ctx.font = `800 ${Math.max(12, 24 * p.scale)}px Arial`;
      ctx.fillText(e.text, p.x, p.y - e.age * 45);
    }
    if (e.type === "burst") {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = Math.max(2, 6 * p.scale);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1 - alpha) * 90 * p.scale * e.scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawRotor2d(x, y, radius, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -radius);
    ctx.stroke();
  }
  ctx.fillStyle = "#212529";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBillboardShadow(x, z, radius, view) {
  const p = project3d(x, 2, z, view);
  if (!p) return;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, radius * p.scale * 2, radius * p.scale * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorldText(text, x, y, z, view) {
  const p = project3d(x, y, z, view);
  if (!p) return;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(p.x - 36, p.y - 18, 72, 22);
  ctx.fillStyle = "#fff8dc";
  ctx.font = "800 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, p.x, p.y - 3);
  ctx.textAlign = "left";
}

function line2d(a, b, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function poly(points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fill();
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amount, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount, 0, 255);
  const b = clamp((n & 255) + amount, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function setStick(clientX, clientY) {
  const rect = stickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const max = rect.width * 0.32;
  const len = Math.hypot(dx, dy);
  const scale = len > max ? max / len : 1;
  const knobX = dx * scale;
  const knobY = dy * scale;
  stickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  input.x = clamp(dx / max, -1, 1);
  input.y = clamp(dy / max, -1, 1);
}

function resetStick() {
  input.pointerId = null;
  input.x = 0;
  input.y = 0;
  stickKnob.style.transform = "translate(0, 0)";
}

stickBase.addEventListener("pointerdown", (event) => {
  input.pointerId = event.pointerId;
  stickBase.setPointerCapture(event.pointerId);
  setStick(event.clientX, event.clientY);
});

stickBase.addEventListener("pointermove", (event) => {
  if (event.pointerId === input.pointerId) setStick(event.clientX, event.clientY);
});

stickBase.addEventListener("pointerup", resetStick);
stickBase.addEventListener("pointercancel", resetStick);

attackButton.addEventListener("pointerdown", attack);
dashButton.addEventListener("pointerdown", dash);
specialButton.addEventListener("pointerdown", special);

addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
  if (event.key === " ") attack();
  if (event.key.toLowerCase() === "shift") dash();
  if (event.key.toLowerCase() === "e") special();
});

addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
addEventListener("resize", resize);

startButton.addEventListener("click", () => {
  running = true;
  startOverlay.classList.add("hidden");
  showMessage("Glitch Detected", "You're trapped in the game! Find 24 Sync Cores and clear the drones to open the Exit Gate.", 3.5);
});

restartButton.addEventListener("click", () => {
  location.reload();
});

resize();
requestAnimationFrame(loop);
