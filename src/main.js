import * as THREE from "three";
import "./style.css";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const WORLD_WIDTH = 13;
const WORLD_DEPTH = 24;
const WORLD_MIN_Z = -11.2;
const WORLD_MAX_Z = 11.2;
const PLAY_MIN_X = -3.35;
const PLAY_MAX_X = 3.35;
const CAMERA_MIN_Z = -6.8;
const CAMERA_MAX_Z = 6.8;
const PLAYER_SPEED = 4.1;
const SPRAY_RANGE = 4.7;
const SPRAY_LIFETIME = 0.22;
const ROUND_SECONDS = 30;
const ROUND_TARGET_COUNT = 10;
const MAX_WATER = 12;
const CARTRIDGE_REFILL = 4;
const SHOT_COOLDOWN = 0.3;
const FOUNTAIN_RANGE = 1.05;
const FOUNTAIN_REFILL_SECONDS = 1.25;
const CARTRIDGE_RANGE = 0.62;
const NPC_REACTION_SECONDS = 1.8;
const NPC_FLEE_SPEED = 3.2;
const LOCAL_PENALTY_SECONDS = 5;
const STANDARD_PERSON_SCALE = 0.82;
const LOCATION_ID = "la-rambla";
const LOCATION_NAME = "La Rambla";
const LOCAL_PLAYER_KEY = "guiriland_player_name";
const LOCAL_LEADERBOARD_KEY = `guiriland_scores_${LOCATION_ID}`;
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const LEADERBOARD_TABLE = import.meta.env.VITE_LEADERBOARD_TABLE ?? "guiriland_scores";
const NPC_PREVIEW_MODE = new URLSearchParams(window.location.search).has("npcPreview");
const NPC_PREVIEW_FOCUS = new URLSearchParams(window.location.search).get("focus");

const TARGET_SPAWN_POINTS = [
  [-2.1, 8.25],
  [-0.35, 7.15],
  [1.85, 5.85],
  [-1.7, 4.35],
  [1.45, 2.7],
  [-2.0, 1.05],
  [2.05, -0.65],
  [-1.35, -2.45],
  [1.8, -4.25],
  [-2.0, -6.05],
  [0.45, -7.75],
  [2.0, -9.15],
];

const LOCAL_SPAWN_POINTS = [
  [2.6, 7.2],
  [-2.55, 4.25],
  [2.55, 1.2],
  [-2.7, -2.1],
  [2.6, -5.05],
  [-2.65, -8.0],
];

const POLICE_SPAWN_POINTS = [
  [-2.85, 8.85],
  [2.85, -6.75],
];

const PIGEON_SPAWN_POINTS = [
  [-1.9, -8.1],
  [-1.55, -7.88],
  [2.55, -4.95],
  [2.9, -4.76],
  [0.65, -1.85],
  [-0.85, 2.8],
  [1.65, 5.15],
  [1.25, 5.42],
  [-2.25, 8.4],
];

const PIGEON_STARTLE_RANGE = 0.95;

const STAG_CREW_STYLES = [
  { shirt: 0xd64f98, text: "MARK'S\nLAST\nSTAND" },
  { shirt: 0x2f8fe8, text: "BCN\nLEGENDS\nTOUR" },
  { shirt: 0x32b36f, text: "SANGRIA\nCOMMANDO" },
  { shirt: 0xff7a3d, text: "LAST\nNIGHT\nHEROES" },
];

const gameEl = document.querySelector("#game");
const hudEl = document.createElement("div");
const scoreEl = document.createElement("div");
const goalEl = document.createElement("div");
const timerEl = document.createElement("div");
const waterEl = document.createElement("div");
const targetPanelEl = document.createElement("div");
const targetTitleEl = document.createElement("div");
const targetRows = {
  stagCrew: document.createElement("div"),
  gamba: document.createElement("div"),
  slogan: document.createElement("div"),
};
const refillEl = document.createElement("div");
const refillTextEl = document.createElement("div");
const refillBarEl = document.createElement("div");
const refillFillEl = document.createElement("div");
const hintEl = document.createElement("div");
const messageEl = document.createElement("div");
const restartEl = document.createElement("button");
const startScreenEl = document.createElement("div");
const startTitleEl = document.createElement("h1");
const startIntroEl = document.createElement("p");
const playerNameInput = document.createElement("input");
const locationButtonEl = document.createElement("button");
const startLeaderboardEl = document.createElement("div");
const endScreenEl = document.createElement("div");
const endTitleEl = document.createElement("h2");
const endStatsEl = document.createElement("div");
const endStatusEl = document.createElement("div");
const endLeaderboardEl = document.createElement("div");
const playAgainEl = document.createElement("button");

hudEl.className = "hud";
scoreEl.className = "hud__item";
goalEl.className = "hud__item hud__goal";
timerEl.className = "hud__item hud__timer";
waterEl.className = "hud__item hud__water";
targetPanelEl.className = "target-panel";
targetTitleEl.className = "target-panel__title";
targetTitleEl.textContent = "Targets";
Object.values(targetRows).forEach((row) => {
  row.className = "target-panel__row";
});
refillEl.className = "refill-meter";
refillTextEl.className = "refill-meter__text";
refillBarEl.className = "refill-meter__bar";
refillFillEl.className = "refill-meter__fill";
hintEl.className = "hint";
messageEl.className = "message";
restartEl.className = "restart-button";
startScreenEl.className = "start-screen";
startTitleEl.className = "start-screen__title";
startIntroEl.className = "start-screen__intro";
playerNameInput.className = "start-screen__input";
locationButtonEl.className = "location-card";
startLeaderboardEl.className = "leaderboard";
endScreenEl.className = "end-screen";
endTitleEl.className = "end-screen__title";
endStatsEl.className = "end-screen__stats";
endStatusEl.className = "end-screen__status";
endLeaderboardEl.className = "leaderboard";
playAgainEl.className = "play-again-button";
restartEl.textContent = "Restart";
restartEl.hidden = true;
refillTextEl.textContent = "Hold E to refill";
refillEl.hidden = true;
targetPanelEl.hidden = true;
startTitleEl.textContent = "Guiriland";
startIntroEl.textContent = "Enter your name, pick a location, and climb the leaderboard.";
playerNameInput.name = "player-name";
playerNameInput.placeholder = "Your name";
playerNameInput.maxLength = 16;
playerNameInput.autocomplete = "nickname";
playerNameInput.value = localStorage.getItem(LOCAL_PLAYER_KEY) ?? "";
locationButtonEl.textContent = LOCATION_NAME;
playAgainEl.textContent = "Play Again";
endScreenEl.hidden = true;

startScreenEl.append(startTitleEl, startIntroEl, playerNameInput, locationButtonEl, startLeaderboardEl);
endScreenEl.append(endTitleEl, endStatsEl, endStatusEl, endLeaderboardEl, playAgainEl);
targetPanelEl.append(targetTitleEl, targetRows.stagCrew, targetRows.gamba, targetRows.slogan);
refillBarEl.append(refillFillEl);
refillEl.append(refillTextEl, refillBarEl);
hudEl.append(scoreEl, goalEl, timerEl, waterEl);
gameEl.append(hudEl, targetPanelEl, hintEl, refillEl, messageEl, restartEl, startScreenEl, endScreenEl);
fitGameToViewport();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x25303a);

const camera = new THREE.OrthographicCamera(-7.7, 7.7, 5.05, -5.05, 0.1, 100);
camera.position.set(0, 10.5, 7.2);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
gameEl.prepend(renderer.domElement);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointer = new THREE.Vector2();
const keys = new Set();

let dynamicGroup;
let player;
let waterPistol;
let lastAim = new THREE.Vector3(0, 0, -1);
let cameraFocus = new THREE.Vector3(0, 0, 0);
let npcs = [];
let sprays = [];
let fountains = [];
let cartridges = [];
let previewFigures = [];
let pigeons = [];
let score = 0;
let timeLeft = ROUND_SECONDS;
let gameOver = false;
let waterAmmo = MAX_WATER;
let shotCooldownLeft = 0;
let refillProgress = 0;
let hintTimer = 0;
let endingSoon = false;
let winDelay = 0;
let locals = [];
let roundGoalText = "";
let roundTargetCounts = {};
let soakedTargetCounts = {};
let localsHit = 0;
let roundSubmitted = false;
let currentPlayerName = "";

createLights();
createWorld();
if (NPC_PREVIEW_MODE) {
  startNpcPreview();
} else {
  showStartScreen();
}
animate();

restartEl.addEventListener("click", startRound);
locationButtonEl.addEventListener("click", startRoundFromMenu);
playAgainEl.addEventListener("click", startRoundFromMenu);
playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startRoundFromMenu();
  }
});
window.addEventListener("resize", fitGameToViewport);
window.visualViewport?.addEventListener("resize", fitGameToViewport);
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());

  if (!NPC_PREVIEW_MODE && event.code === "Space") {
    event.preventDefault();
    sprayWater();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
renderer.domElement.addEventListener("pointermove", (event) => {
  if (!NPC_PREVIEW_MODE) {
    aimAtPointer(event);
  }
});
renderer.domElement.addEventListener("pointerdown", (event) => {
  if (NPC_PREVIEW_MODE) return;

  aimAtPointer(event);
  sprayWater();
});

function createLights() {
  const ambient = new THREE.HemisphereLight(0xfff4df, 0x46535e, 2.25);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffefd0, 3.65);
  sun.position.set(-5, 9, 5.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -11;
  sun.shadow.camera.right = 11;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  scene.add(sun);

  const streetFill = new THREE.DirectionalLight(0x8fa7bd, 0.55);
  streetFill.position.set(5, 4, -6);
  scene.add(streetFill);
}

function fitGameToViewport() {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  let width = Math.min(GAME_WIDTH, viewportWidth, viewportHeight * 1.5);
  let height = width / 1.5;

  if (height > viewportHeight) {
    height = viewportHeight;
    width = height * 1.5;
  }

  gameEl.style.width = `${Math.floor(width)}px`;
  gameEl.style.height = `${Math.floor(height)}px`;
}

function createWorld() {
  const base = new THREE.Group();
  scene.add(base);

  addBox(base, [0, -0.12, 0], [16, 0.22, WORLD_DEPTH + 2], 0x263240);
  addBox(base, [-5.45, 0, 0], [2.05, 0.18, WORLD_DEPTH], 0x315f43);
  addBox(base, [5.45, 0, 0], [2.05, 0.18, WORLD_DEPTH], 0x2b543c);
  addBox(base, [0, 0.03, 0], [7.65, 0.16, WORLD_DEPTH], 0xc7b8a4);
  addBox(base, [-3.95, 0.12, 0], [0.14, 0.08, WORLD_DEPTH], 0x9b6a57);
  addBox(base, [3.95, 0.12, 0], [0.14, 0.08, WORLD_DEPTH], 0x9b6a57);
  addPaving(base);
  addMediterraneanFacades(base);
  addGothicSideAlleys(base);
  addBoqueria(base);
  addTerraces(base);
  addFlowerStands(base);
  addRamblaKiosks(base);
  addStreetProps(base);
  addBenches(base);

  for (let z = WORLD_MIN_Z + 0.9; z <= WORLD_MAX_Z - 0.8; z += 1.22) {
    addTree(base, -4.42, z + 0.12);
    addTree(base, 4.42, z - 0.28);
  }

  addPalmTree(base, -4.88, -8.4);
  addPalmTree(base, 4.92, -3.6);
  addPalmTree(base, -4.88, 3.7);
  addPalmTree(base, 4.92, 8.3);
}

function addMediterraneanFacades(parent) {
  const facades = [
    { side: -1, z: -9.6, d: 1.75, h: 1.5, color: 0xd99b6d, sign: "TAPAS" },
    { side: -1, z: -7.55, d: 1.55, h: 1.75, color: 0xf0c789, sign: "CAFÈ" },
    { side: -1, z: -5.55, d: 1.35, h: 1.45, color: 0xc76f55, sign: "HOSTAL" },
    { side: -1, z: -1.45, d: 1.9, h: 1.75, color: 0xe3b37a, sign: "BOQUERIA" },
    { side: -1, z: 1.2, d: 1.55, h: 1.45, color: 0xd88a63, sign: "GELAT" },
    { side: -1, z: 3.25, d: 1.7, h: 1.65, color: 0xf1cc8f, sign: "SANGRIA" },
    { side: -1, z: 5.65, d: 1.55, h: 1.55, color: 0xe7bf83, sign: "BAR" },
    { side: -1, z: 8.15, d: 1.85, h: 1.7, color: 0xc96d57, sign: "FLORS" },
    { side: 1, z: -9.0, d: 1.85, h: 1.55, color: 0xf0d19b, sign: "PENSIÓ" },
    { side: 1, z: -6.5, d: 1.55, h: 1.48, color: 0xdf9c6e, sign: "TAPES" },
    { side: 1, z: -4.2, d: 1.35, h: 1.36, color: 0xd0a16f, sign: "SOL" },
    { side: 1, z: -1.8, d: 1.65, h: 1.62, color: 0xe6b980, sign: "RAMBLA" },
    { side: 1, z: 0.8, d: 1.75, h: 1.42, color: 0xd88a63, sign: "PAELLA" },
    { side: 1, z: 3.4, d: 1.55, h: 1.68, color: 0xf0c789, sign: "CAFÈ" },
    { side: 1, z: 5.9, d: 1.85, h: 1.55, color: 0xc76f55, sign: "TAPAS" },
    { side: 1, z: 8.5, d: 1.55, h: 1.4, color: 0xe7bf83, sign: "BAR" },
  ];

  facades.forEach((facade) => {
    addSideFacade(parent, facade);
  });
}

function addSideFacade(parent, { side, z, d, h, color, sign }) {
  const x = side * 6.75;
  const face = addBox(parent, [x, h / 2, z], [0.5, h, d], color);
  face.castShadow = false;

  const trimColor = darken(color, 0.78);
  addBox(parent, [x, h + 0.08, z], [0.58, 0.16, d + 0.12], trimColor);

  const windowCount = Math.max(2, Math.floor(d / 0.45));
  for (let i = 0; i < windowCount; i += 1) {
    const wz = z - d / 2 + 0.28 + i * ((d - 0.56) / Math.max(windowCount - 1, 1));
    addBox(parent, [x - side * 0.28, h * 0.64, wz], [0.06, 0.34, 0.2], 0x2f4858);
    addBox(parent, [x - side * 0.3, h * 0.39, wz], [0.08, 0.08, 0.28], 0x4b2f2a);
  }

  const label = makeLabel(sign, "#fff3d6", "#4f321f", 192, 64);
  label.position.set(x - side * 0.36, 0.48, z);
  label.scale.set(0.006, 0.006, 0.006);
  parent.add(label);
}

function addFacade(parent, { x, z, w, h, color, sign }) {
  const depth = 0.26;
  const face = addBox(parent, [x, h / 2, z], [w, h, depth], color);
  face.castShadow = false;

  const trimColor = darken(color, 0.78);
  addBox(parent, [x, h + 0.08, z], [w + 0.12, 0.16, depth + 0.05], trimColor);

  const windowCount = Math.max(2, Math.floor(w / 0.42));
  for (let i = 0; i < windowCount; i += 1) {
    const wx = x - w / 2 + 0.27 + i * ((w - 0.54) / Math.max(windowCount - 1, 1));
    addBox(parent, [wx, h * 0.62, z + Math.sign(z) * -0.15], [0.2, 0.36, 0.06], 0x2f4858);
    addBox(parent, [wx, h * 0.38, z + Math.sign(z) * -0.15], [0.26, 0.08, 0.08], 0x4b2f2a);
  }

  const label = makeLabel(sign, "#fff3d6", "#4f321f", 192, 64);
  label.position.set(x, 0.42, z - Math.sign(z) * 0.17);
  label.scale.set(0.006, 0.006, 0.006);
  parent.add(label);
}

function addGothicSideAlleys(parent) {
  const alleys = [
    [-6.08, -6.1],
    [-6.08, 4.65],
    [6.08, -7.5],
    [6.08, 2.2],
    [6.08, 8.9],
  ];

  alleys.forEach(([x, z]) => {
    addBox(parent, [x, 0.08, z], [1.35, 0.05, 0.62], 0x27313b);
    addBox(parent, [x, 0.55, z - 0.27], [1.25, 0.9, 0.12], 0x44515a);
    addBox(parent, [x, 0.55, z + 0.27], [1.25, 0.9, 0.12], 0x35434e);
    addBox(parent, [x, 1.05, z], [1.15, 0.18, 0.62], 0x2c3842);
  });
}

function addPaving(parent) {
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0x95897c,
    roughness: 0.9,
    metalness: 0,
  });

  for (let x = -3.25; x <= 3.25; x += 0.92) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, WORLD_DEPTH), lineMaterial);
    line.position.set(x, 0.14, 0);
    parent.add(line);
  }

  for (let z = WORLD_MIN_Z + 0.35; z <= WORLD_MAX_Z; z += 0.82) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(7.65, 0.025, 0.025), lineMaterial);
    line.position.set(0, 0.145, z);
    parent.add(line);
  }

  const rows = Math.floor(WORLD_DEPTH / 0.82);
  const tileColors = [0xd2c8b8, 0xc2b6a6, 0xb8ad9f, 0xd8cdbb];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const colorIndex = (row * 3 + col * 5 + (row % 3)) % tileColors.length;
      const tile = addBox(
        parent,
        [-3.28 + col * 0.94, 0.12, WORLD_MIN_Z + 0.4 + row * 0.82],
        [0.9, 0.02, 0.78],
        tileColors[colorIndex],
      );
      tile.receiveShadow = true;
    }
  }
}

function addBoqueria(parent) {
  addBox(parent, [-6.45, 0.42, -1.55], [1.05, 0.84, 3.1], 0x742a28);
  addBox(parent, [-5.92, 1.12, -1.55], [0.16, 0.18, 3.25], 0xa94638);
  addBox(parent, [-5.82, 1.18, -2.72], [0.12, 0.42, 1.1], 0x254a3a);

  const sign = makeLabel("BOQUERIA", "#f7e8bd", "#254a3a", 256, 72);
  sign.position.set(-5.48, 1.58, -2.72);
  sign.scale.set(0.012, 0.012, 0.012);
  parent.add(sign);

  for (let i = 0; i < 6; i += 1) {
    const color = i % 2 === 0 ? 0xd6342f : 0xf7e8bd;
    addBox(parent, [-5.72, 0.86, -2.2 + i * 0.25], [0.1, 0.16, 0.22], color);
  }

  addBox(parent, [-5.7, 0.34, -0.6], [0.45, 0.22, 1.05], 0x3c2220);
  addFruit(parent, -5.45, 0.56, -0.92, 0xf49b39);
  addFruit(parent, -5.45, 0.58, -0.58, 0xf5b14c);
  addFruit(parent, -5.45, 0.58, -0.25, 0xa3c85a);
}

function addTerraces(parent) {
  const terraces = [
    { x: -5.18, z: -8.8, color: 0xffd166 },
    { x: -5.05, z: -4.7, color: 0xf4a261 },
    { x: -5.12, z: 5.2, color: 0xf7d488 },
    { x: 5.12, z: -6.7, color: 0xffc857 },
    { x: 5.02, z: -0.3, color: 0xf7d488 },
    { x: 5.12, z: 6.8, color: 0xffd166 },
  ];

  terraces.forEach((terrace) => {
    addTerraceSet(parent, terrace.x, terrace.z, terrace.color);
  });
}

function addTerraceSet(parent, x, z, umbrellaColor) {
  addCylinder(parent, [x, 0.32, z], 0.34, 0.34, 0.08, 0x7a4e31);
  addCylinder(parent, [x, 0.18, z], 0.035, 0.045, 0.32, 0x4f321f);
  addCylinder(parent, [x, 0.72, z], 0.05, 0.05, 0.9, 0x6b4a2f);
  addCone(parent, [x, 1.25, z], 0.78, 0.34, umbrellaColor);

  const chairOffsets = [
    [-0.56, -0.1],
    [0.56, 0.1],
    [-0.1, 0.56],
  ];
  chairOffsets.forEach(([ox, oz]) => {
    addBox(parent, [x + ox, 0.24, z + oz], [0.24, 0.28, 0.24], 0x2f4858);
    addBox(parent, [x + ox, 0.47, z + oz + 0.05], [0.24, 0.3, 0.06], 0x365f75);
  });

  addSangriaGlass(parent, x - 0.12, z + 0.06);
  addSangriaGlass(parent, x + 0.13, z - 0.08);
}

function addSangriaGlass(parent, x, z) {
  addCylinder(parent, [x, 0.45, z], 0.045, 0.035, 0.22, 0xe76f51);
  addCylinder(parent, [x, 0.59, z], 0.05, 0.05, 0.025, 0xf7f0d0);
}

function addFlowerStands(parent) {
  [
    [-5.06, -6.0],
    [-5.0, 2.1],
    [5.08, -3.5],
    [5.1, 4.3],
  ].forEach(([x, z]) => {
    addBox(parent, [x, 0.25, z], [0.78, 0.34, 0.48], 0x23282c);
    addBox(parent, [x, 0.52, z], [0.86, 0.1, 0.54], 0x15191d);
    addBox(parent, [x, 0.88, z], [1.04, 0.12, 0.72], 0x181c20);
    addBox(parent, [x, 0.78, z], [0.08, 0.5, 0.08], 0x101316);
    addBox(parent, [x, 0.63, z - 0.24], [0.58, 0.05, 0.04], 0xffd166);

    const flowerColors = [0xe63946, 0xffafcc, 0xffd166, 0x8ecae6, 0xb7e4c7];
    flowerColors.forEach((color, index) => {
      const fx = x - 0.26 + index * 0.13;
      addCylinder(parent, [fx, 0.72, z], 0.045, 0.025, 0.18, 0x2f7a48);
      addFruit(parent, fx, 0.85, z + (index % 2 === 0 ? 0.12 : -0.08), color);
    });
  });
}

function addRamblaKiosks(parent) {
  [
    [2.95, 5.95],
    [-2.95, -4.45],
  ].forEach(([x, z]) => {
    addBox(parent, [x, 0.42, z], [0.82, 0.78, 0.62], 0x202429);
    addBox(parent, [x, 0.9, z], [1.05, 0.2, 0.82], 0x111418);
    addBox(parent, [x, 1.05, z], [0.8, 0.12, 0.58], 0x2c3035);
    addBox(parent, [x, 0.58, z - 0.34], [0.64, 0.1, 0.04], 0xffd166);

    const posterColors = [0xf7f0d0, 0xe76f51, 0x8ecae6, 0xffd166, 0x7057a3, 0xb7e4c7];
    posterColors.forEach((color, index) => {
      const px = x - 0.27 + (index % 3) * 0.27;
      const py = 0.42 + Math.floor(index / 3) * 0.2;
      addBox(parent, [px, py, z - 0.34], [0.18, 0.14, 0.035], color);
    });
  });
}

function addStreetProps(parent) {
  [
    [2.65, -9.0],
    [-2.45, -5.15],
    [2.55, -0.9],
    [-2.65, 3.3],
    [2.35, 7.35],
  ].forEach(([x, z]) => {
    addBox(parent, [x, 0.28, z], [0.42, 0.56, 0.36], 0x1d2934);
    addBox(parent, [x, 0.6, z - 0.17], [0.34, 0.08, 0.04], 0x6cbf84);
  });

  [
    [-3.55, -7.5],
    [3.55, -2.5],
    [-3.5, 6.05],
  ].forEach(([x, z]) => {
    addBox(parent, [x, 0.32, z], [0.38, 0.64, 0.38], 0x36454f);
    addBox(parent, [x, 0.68, z - 0.19], [0.3, 0.1, 0.04], 0x96d2e0);
  });
}

function addBenches(parent) {
  [
    [-2.65, -9.7, Math.PI / 2],
    [2.65, -7.2, -Math.PI / 2],
    [-2.65, -2.85, Math.PI / 2],
    [2.65, 0.7, -Math.PI / 2],
    [-2.65, 4.55, Math.PI / 2],
    [2.65, 8.2, -Math.PI / 2],
  ].forEach(([x, z, rotation]) => {
    const bench = new THREE.Group();
    addBox(bench, [0, 0.28, 0], [0.86, 0.12, 0.24], 0x7a4e31);
    addBox(bench, [0, 0.47, 0.12], [0.86, 0.28, 0.09], 0x8a5a3b);
    addBox(bench, [-0.32, 0.13, 0], [0.08, 0.24, 0.08], 0x4f321f);
    addBox(bench, [0.32, 0.13, 0], [0.08, 0.24, 0.08], 0x4f321f);
    bench.position.set(x, 0, z);
    bench.rotation.y = rotation;
    parent.add(bench);
  });
}

function addTree(parent, x, z) {
  addBox(parent, [x, 0.38, z], [0.18, 0.76, 0.18], 0x815430);

  const crownMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f8e55,
    roughness: 0.9,
    flatShading: true,
  });
  const crownGeometry = new THREE.DodecahedronGeometry(0.48, 0);
  const offsets = [
    [0, 0.95, 0],
    [-0.26, 0.78, 0.18],
    [0.28, 0.76, 0.12],
    [0.04, 1.16, -0.2],
  ];

  offsets.forEach(([ox, oy, oz], index) => {
    const crown = new THREE.Mesh(crownGeometry, crownMaterial.clone());
    crown.material.color.offsetHSL(index * 0.015, 0, index * -0.04);
    crown.position.set(x + ox, oy, z + oz);
    crown.scale.setScalar(index === 3 ? 0.78 : 1);
    crown.castShadow = true;
    crown.receiveShadow = true;
    parent.add(crown);
  });
}

function addPalmTree(parent, x, z) {
  const trunk = addCylinder(parent, [x, 0.7, z], 0.09, 0.13, 1.4, 0x9b6a3c);
  trunk.rotation.z = 0.12;

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f8f5b,
    roughness: 0.86,
    flatShading: true,
  });

  for (let i = 0; i < 7; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.05, 4), leafMaterial.clone());
    leaf.position.set(x, 1.45, z);
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.castShadow = true;
    parent.add(leaf);
  }
}

function showStartScreen() {
  gameOver = true;
  currentPlayerName = sanitizePlayerName(playerNameInput.value);
  startScreenEl.hidden = false;
  endScreenEl.hidden = true;
  targetPanelEl.hidden = true;
  messageEl.textContent = "";
  hintEl.textContent = "";
  restartEl.hidden = true;
  gameEl.dataset.mode = "menu";
  scoreEl.textContent = "Guiriland";
  goalEl.textContent = "Choose a location";
  timerEl.textContent = "";
  waterEl.textContent = "";
  renderLeaderboard(startLeaderboardEl);
}

function startRoundFromMenu() {
  currentPlayerName = sanitizePlayerName(playerNameInput.value);
  playerNameInput.value = currentPlayerName;
  localStorage.setItem(LOCAL_PLAYER_KEY, currentPlayerName);
  startRound();
}

function startRound() {
  if (dynamicGroup) {
    scene.remove(dynamicGroup);
  }

  startScreenEl.hidden = true;
  endScreenEl.hidden = true;
  dynamicGroup = new THREE.Group();
  scene.add(dynamicGroup);

  score = 0;
  timeLeft = ROUND_SECONDS;
  gameOver = false;
  sprays = [];
  npcs = [];
  locals = [];
  fountains = [];
  cartridges = [];
  previewFigures = [];
  pigeons = [];
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  lastAim = new THREE.Vector3(0, 0, -1);
  waterAmmo = MAX_WATER;
  shotCooldownLeft = 0;
  refillProgress = 0;
  hintTimer = 0;
  endingSoon = false;
  winDelay = 0;
  localsHit = 0;
  roundSubmitted = false;
  roundTargetCounts = {};
  soakedTargetCounts = { gamba: 0, stagCrew: 0, slogan: 0 };
  roundGoalText = "";

  player = createPlayerCharacter();
  player.position.set(0, 0.02, WORLD_MAX_Z - 1.45);
  dynamicGroup.add(player);
  cameraFocus.set(0, 0, player.position.z);
  updateCamera(1);

  waterPistol = createWaterPistol();
  dynamicGroup.add(waterPistol);

  addFountainStations();
  addWaterCartridges();

  const targetTypes = createRoundTargetTypes();
  roundTargetCounts = countTargetTypes(targetTypes);
  roundGoalText = formatRoundGoal(roundTargetCounts);
  addRoundGuiris(targetTypes);
  addRoundLocals();
  addRoundPigeons();

  messageEl.textContent = "";
  hintEl.textContent = "";
  refillEl.hidden = true;
  refillFillEl.style.width = "0%";
  targetPanelEl.hidden = false;
  restartEl.hidden = true;
  gameEl.dataset.mode = "gameplay";
  updateHud();
}

function createRoundTargetTypes() {
  const counts = {
    gamba: 2,
    stagCrew: 3,
    slogan: 2,
  };
  const remaining = ROUND_TARGET_COUNT - Object.values(counts).reduce((total, count) => total + count, 0);
  const possibleTypes = ["gamba", "slogan"];

  for (let i = 0; i < remaining; i += 1) {
    counts[possibleTypes[Math.floor(Math.random() * possibleTypes.length)]] += 1;
  }

  return shuffleCopy(
    Object.entries(counts).flatMap(([type, count]) => Array.from({ length: count }, () => type)),
  );
}

function countTargetTypes(targetTypes) {
  return targetTypes.reduce(
    (counts, type) => {
      counts[type] += 1;
      return counts;
    },
    { gamba: 0, stagCrew: 0, slogan: 0 },
  );
}

function formatRoundGoal(counts) {
  return `${ROUND_TARGET_COUNT} guiris: ${counts.stagCrew} Stag / ${counts.gamba} Gambas / ${counts.slogan} I♥`;
}

function addRoundGuiris(targetTypes) {
  const spawnPoints = shuffleCopy(TARGET_SPAWN_POINTS);
  let stagCrewVariant = Math.floor(Math.random() * STAG_CREW_STYLES.length);

  targetTypes.forEach((type, index) => {
    const [baseX, baseZ] = spawnPoints[index % spawnPoints.length];
    const npc = createPlayableGuiri(type, stagCrewVariant);
    if (type === "stagCrew") {
      stagCrewVariant += 1;
    }
    const jitterX = randomBetween(-0.22, 0.22);
    const jitterZ = randomBetween(-0.24, 0.24);
    npc.group.position.set(baseX + jitterX, 0.02, baseZ + jitterZ);
    npc.velocity.copy(randomWalkVelocity(type === "stagCrew" ? 0.28 : 0.36));
    dynamicGroup.add(npc.group);
    npcs.push(npc);
  });
}

function addRoundPigeons() {
  PIGEON_SPAWN_POINTS.forEach(([x, z], index) => {
    const pigeon = createPigeon();
    pigeon.group.position.set(x, 0.03, z);
    pigeon.group.rotation.y = index * 0.85;
    dynamicGroup.add(pigeon.group);
    pigeons.push(pigeon);
  });
}

function addRoundLocals() {
  shuffleCopy(LOCAL_SPAWN_POINTS).forEach(([x, z], index) => {
    const local = createPlayableLocal(index);
    local.group.position.set(x, 0.02, z);
    local.velocity.copy(randomWalkVelocity(0.42));
    dynamicGroup.add(local.group);
    locals.push(local);
  });

  shuffleCopy(POLICE_SPAWN_POINTS).forEach(([x, z], index) => {
    const police = createPlayablePolice(index);
    police.group.position.set(x, 0.02, z);
    police.velocity.copy(randomWalkVelocity(0.34));
    dynamicGroup.add(police.group);
    locals.push(police);
  });
}

function randomWalkVelocity(maxSpeed) {
  const angle = Math.random() * Math.PI * 2;
  const speed = randomBetween(maxSpeed * 0.45, maxSpeed);
  return new THREE.Vector3(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
}

function addFountainStations() {
  [
    [-3.04, 7.35],
    [3.04, 1.2],
    [-3.04, -6.15],
  ].forEach(([x, z]) => {
    const fountain = createFountain();
    fountain.position.set(x, 0.02, z);
    dynamicGroup.add(fountain);
    fountains.push({ group: fountain });
  });
}

function addWaterCartridges() {
  [
    [2.46, 8.1],
    [-2.48, 4.0],
    [2.45, -1.95],
    [-2.5, -8.45],
  ].forEach(([x, z], index) => {
    const cartridge = createWaterCartridge();
    cartridge.position.set(x, 0.02, z);
    dynamicGroup.add(cartridge);
    cartridges.push({ group: cartridge, collected: false, bobOffset: index * 1.4 });
  });
}

function startNpcPreview() {
  if (dynamicGroup) {
    scene.remove(dynamicGroup);
  }

  dynamicGroup = new THREE.Group();
  scene.add(dynamicGroup);
  npcs = [];
  locals = [];
  sprays = [];
  fountains = [];
  cartridges = [];
  previewFigures = [];
  pigeons = [];
  roundTargetCounts = {};
  soakedTargetCounts = {};
  roundGoalText = "";
  gameOver = true;
  targetPanelEl.hidden = true;

  const focusedPreview =
    NPC_PREVIEW_FOCUS === "reference-tourists" || NPC_PREVIEW_FOCUS === "gamba-football-locals";
  scoreEl.textContent = "NPC Design";
  goalEl.textContent = focusedPreview ? "Tourist archetypes (Guiris)" : "10 Guiri archetypes";
  timerEl.textContent = "Preview";
  waterEl.textContent = "Readable silhouettes";
  waterEl.style.background = "rgba(255, 243, 214, 0.82)";
  hintEl.textContent = "";
  messageEl.textContent = "";
  refillEl.hidden = true;
  restartEl.hidden = true;

  gameEl.dataset.mode = "npc-preview";
  gameEl.dataset.previewCount = focusedPreview ? "3" : "10";
  gameEl.dataset.previewFocus = NPC_PREVIEW_FOCUS ?? "";

  addBox(dynamicGroup, [0, 0.06, 0], [9.0, 0.06, focusedPreview ? 3.4 : 5.7], 0xc8bba8, 0.55);

  const archetypes = focusedPreview
    ? [
        { type: "gamba", label: "GUIRI GAMBA" },
        { type: "stagCrew", label: "STAG CREW" },
        { type: "slogan", label: "I ♥ MILFS" },
      ]
    : [
        { type: "gamba", label: "GAMBA" },
        { type: "stagCrew", label: "STAG CREW" },
        { type: "slogan", label: "SLOGAN" },
        { type: "americanCouple", label: "US COUPLE" },
        { type: "influencerDuo", label: "INFLUENCERS" },
        { type: "cruiseFamily", label: "CRUISE" },
        { type: "footballLads", label: "FOOTBALL" },
        { type: "unicornSquad", label: "UNICORNS" },
        { type: "retiredCouple", label: "RETIRED" },
        { type: "locals", label: "LOCALS" },
      ];
  const xs = focusedPreview ? [-2.8, 0, 2.85] : [-3.8, -1.9, 0, 1.9, 3.8];

  archetypes.forEach((archetype, index) => {
    const x = xs[index % xs.length];
    const z = focusedPreview ? 0 : index < xs.length ? 1.65 : -1.75;
    addBox(
      dynamicGroup,
      [x, 0.12, z],
      [focusedPreview ? (archetype.type === "stagCrew" ? 2.6 : 2.05) : 1.52, 0.05, focusedPreview ? 1.58 : 1.22],
      focusedPreview ? 0x282a2c : index % 2 === 0 ? 0xd8cebd : 0xc7bcae,
      focusedPreview ? 0.96 : 0.82,
    );

    const figure = createGuiriArchetype(archetype.type);
    figure.position.set(x, 0.16, z);
    const baseRotation = focusedPreview ? Math.PI : 0.2;
    figure.rotation.y = baseRotation;
    if (focusedPreview) {
      figure.scale.setScalar(1.35);
    }
    dynamicGroup.add(figure);
    previewFigures.push({ group: figure, type: archetype.type, phase: index * 0.62, baseRotation });

    const label = makeLabel(archetype.label, focusedPreview ? "#f5f1e8" : "#10202b", focusedPreview ? "#282a2c" : "#fff3d6", focusedPreview ? 360 : 220, 72);
    label.position.set(0, focusedPreview ? 0.02 : 1.8, focusedPreview ? -0.94 : 0.52);
    label.scale.set(focusedPreview ? 1.2 : 1.15, focusedPreview ? 0.24 : 0.38, 1);
    figure.add(label);
  });

  cameraFocus.set(0, 0, 0);
  camera.zoom = focusedPreview ? 1.22 : 1;
  camera.updateProjectionMatrix();
  camera.position.set(0, focusedPreview ? 6.8 : 10.8, focusedPreview ? 5.6 : 5.8);
  camera.lookAt(0, focusedPreview ? 0.55 : 0, 0);
}

function createGuiriArchetype(type, variant = 0) {
  if (type === "gamba") return createGuiriGamba();
  if (type === "stagCrew") return createStagCrew(variant);
  if (type === "slogan") return createSloganTourist();
  if (type === "americanCouple") return createAmericanCouple();
  if (type === "influencerDuo") return createInfluencerDuo();
  if (type === "cruiseFamily") return createCruiseFamily();
  if (type === "footballLads") return createFootballLads();
  if (type === "unicornSquad") return createUnicornSquad();
  if (type === "retiredCouple") return createRetiredCouple();
  return createLocalResidents();
}

function createGuiriGamba() {
  const group = new THREE.Group();
  group.userData.skin = 0xff5f4f;
  const person = addPreviewPerson(group, {
    blocky: true,
    shirt: 0xf7f4e9,
    shorts: 0x276aa8,
    skin: 0xff5f4f,
    hair: 0xd49a35,
    scale: STANDARD_PERSON_SCALE,
  });
  addReferenceSunglasses(person, 0xd85c48, 0.19);
  addAngryMouth(person);
  addSandals(person);
  addBottle(person, -0.4);
  return group;
}

function createStagCrew(variant = 0) {
  const group = new THREE.Group();
  const members = [];
  const style = STAG_CREW_STYLES[variant % STAG_CREW_STYLES.length];
  group.userData.skin = 0xd88964;
  [
    [-0.46, 0.08, 0x5a5f64],
    [0.0, -0.14, 0x4a315f],
    [0.46, 0.08, 0x706653],
  ].forEach(([x, z, shorts], index) => {
    const person = addPreviewPerson(group, {
      blocky: true,
      shirt: style.shirt,
      shorts,
      skin: 0xd88964,
      hair: 0x2a2522,
      scale: STANDARD_PERSON_SCALE,
    }, x, z, index * 0.28 - 0.2);
    addReferenceSunglasses(person, index === 2 ? 0x148aa3 : 0x111418, 0.18);
    addAngryMouth(person);
    addStagShirtText(person, style.text, style.shirt);
    addWatch(person);
    addChunkyShoes(person, index === 1 ? 0x1f2226 : 0x6b4a2f);
    if (index === 0) {
      addPartyBottle(person);
    }
    members.push(person);
  });
  group.userData.members = members;
  return group;
}

function createSloganTourist() {
  const group = new THREE.Group();
  group.userData.skin = 0xd9855f;
  const person = addPreviewPerson(group, {
    blocky: true,
    shirt: 0xf7f4e9,
    shorts: 0x6f6558,
    skin: 0xd9855f,
    hair: 0x3b2a22,
    scale: STANDARD_PERSON_SCALE,
  });
  addCap(person, 0x66765d);
  addReferenceSunglasses(person, 0x111418, 0.17);
  addAngryMouth(person);
  addIHeartShirt(person);
  addWatch(person);
  addSandals(person);
  return group;
}

function createAmericanCouple() {
  const group = new THREE.Group();
  const man = addPreviewPerson(group, {
    shirt: 0x8ecae6,
    shorts: 0x9b7653,
    skin: 0xffd6a5,
    hair: 0x6b4a2f,
    scale: 0.7,
  }, -0.24, 0.04, -0.1);
  addCap(man, 0xd62828);
  addCamera(man);
  addSandals(man);

  const woman = addPreviewPerson(group, {
    shirt: 0xf7d488,
    shorts: 0x4d5f75,
    skin: 0xffd6a5,
    hair: 0x8a5a3b,
    scale: 0.68,
  }, 0.32, -0.08, 0.18);
  addWideHat(woman, 0xf7f0d0);
  addSunglasses(woman, 0.17);
  addPhone(woman);
  addToteBag(woman, 0x72ddf7);
  return group;
}

function createInfluencerDuo() {
  const group = new THREE.Group();
  const left = addPreviewPerson(group, {
    shirt: 0xffffff,
    shorts: 0xf7f4e9,
    skin: 0xffd6a5,
    hair: 0xd49a35,
    scale: 0.68,
  }, -0.24, 0.02, -0.22);
  addWideHat(left, 0xffffff);
  addRingLight(left);

  const right = addPreviewPerson(group, {
    shirt: 0xf7f4e9,
    shorts: 0xffffff,
    skin: 0xffd6a5,
    hair: 0x5a3a25,
    scale: 0.68,
  }, 0.28, -0.04, 0.26);
  addWideHat(right, 0xfff3d6);
  addPhone(right);
  addSunglasses(right, 0.18);
  addSlogan(right, "LIVE", 0xffffff);
  return group;
}

function createCruiseFamily() {
  const group = new THREE.Group();
  [
    [-0.38, 0.12, 0xffd166],
    [0.0, -0.16, 0x8ecae6],
    [0.38, 0.12, 0xffafcc],
  ].forEach(([x, z, shirt], index) => {
    const person = addPreviewPerson(group, {
      shirt,
      shorts: 0x4d5f75,
      skin: 0xffd6a5,
      hair: index === 1 ? 0x1d2934 : 0x8a5a3b,
      scale: index === 1 ? 0.68 : 0.58,
    }, x, z, index * 0.15);
    addBackpack(person, 0x7057a3);
    addMap(person);
    addWristband(person, 0x36c4ee);
  });
  return group;
}

function createFootballLads() {
  const group = new THREE.Group();
  [
    [-0.38, 0.12, 0xd62828, "9"],
    [0.0, -0.15, 0x2e5a95, "10"],
    [0.38, 0.12, 0xffffff, "7"],
  ].forEach(([x, z, shirt, number], index) => {
    const person = addPreviewPerson(group, {
      blocky: true,
      shirt,
      shorts: 0x263240,
      skin: 0xffd6a5,
      hair: 0x6b4a2f,
      scale: 0.72,
    }, x, z, -0.16 + index * 0.2);
    addBelly(person, darken(shirt, 0.92));
    addJerseyStripe(person, index === 2 ? 0xd62828 : 0xffffff);
    addJerseyNumber(person, number, index === 2 ? 0x263240 : 0xffffff, shirt);
    addFlipFlops(person);
    addPlasticCup(person, 0.36);
  });
  return group;
}

function createUnicornSquad() {
  const group = new THREE.Group();
  [
    [-0.36, 0.12, 0xff4dff],
    [0.0, -0.15, 0x72ddf7],
    [0.36, 0.12, 0xb8f35a],
  ].forEach(([x, z, shirt], index) => {
    const person = addPreviewPerson(group, {
      shirt,
      shorts: index === 1 ? 0xffd166 : 0x7057a3,
      skin: 0xffd6a5,
      hair: index === 0 ? 0x36c4ee : 0xff77cc,
      scale: 0.62,
    }, x, z, index * 0.35);
    addUnicornHorn(person, index);
    addSunglasses(person, 0.16);
    addSparkles(person);
  });
  return group;
}

function createRetiredCouple() {
  const group = new THREE.Group();
  const left = addPreviewPerson(group, {
    shirt: 0xd7c6a3,
    shorts: 0xb9a782,
    skin: 0xffd6a5,
    hair: 0xd9d9d9,
    scale: 0.68,
  }, -0.24, 0.02, -0.08);
  addBucketHat(left, 0xf2e3bf);
  addMap(left);
  addTinyBackpack(left);

  const right = addPreviewPerson(group, {
    shirt: 0xcbb78f,
    shorts: 0x8f846d,
    skin: 0xffd6a5,
    hair: 0xf2e3bf,
    scale: 0.66,
  }, 0.28, -0.08, 0.18);
  addWideHat(right, 0xe8d8b8);
  addSandals(right);
  addTinyBackpack(right);
  return group;
}

function createLocalResidents() {
  const group = new THREE.Group();
  group.userData.skin = 0xffd6a5;
  const first = addPreviewPerson(group, {
    blocky: true,
    shirt: 0x2f3437,
    shorts: 0x2f3437,
    skin: 0xffd6a5,
    hair: 0x5a3a25,
    scale: STANDARD_PERSON_SCALE,
  }, -0.42, 0.06, -0.2);
  addSquareShirt(first, 0x2f3437);
  addWalkingShoes(first);
  addToteBag(first, 0x9a7f57);

  const second = addPreviewPerson(group, {
    blocky: true,
    shirt: 0x3f7fa0,
    shorts: 0x4d4a44,
    skin: 0xffd6a5,
    hair: 0x5a3a25,
    scale: STANDARD_PERSON_SCALE,
  }, 0.04, -0.08, 0.05);
  addSquareShirt(second, 0x3f7fa0);
  addWalkingShoes(second);
  addCrossbodyStrap(second, 0x7a4e31);

  const elder = addPreviewPerson(group, {
    blocky: true,
    shirt: 0xd8d0c0,
    shorts: 0x39515c,
    skin: 0xffd6a5,
    hair: 0xe7e0d2,
    scale: STANDARD_PERSON_SCALE,
  }, 0.45, 0.1, 0.25);
  addSquareShirt(elder, 0xd8d0c0);
  addShortGreyHair(elder);
  addSmallShoulderBag(elder, 0x5c6f7b);
  return group;
}

function createTourist(type) {
  const styles = {
    sangria: { shirt: 0xffd166, shorts: 0x486073, hair: 0x8a5a3b, skin: 0xffd6a5 },
    stag: { shirt: 0x39a96b, shorts: 0x2d3e50, hair: 0x6b4a2f, skin: 0xffd6a5 },
    sandals: { shirt: 0x72ddf7, shorts: 0x3e4c59, hair: 0x5a3a25, skin: 0xffd6a5 },
    sunburn: { shirt: 0xff6b6b, shorts: 0x465166, hair: 0x7a4e31, skin: 0xff6f5e },
    selfie: { shirt: 0xf2b5d4, shorts: 0x34495e, hair: 0x6f4e37, skin: 0xffd6a5 },
    backpack: { shirt: 0xff9f1c, shorts: 0x34495e, hair: 0x7a4e31, skin: 0xffd6a5 },
  };
  const style = styles[type];
  const group = createPerson(style);
  group.userData.skin = style.skin;

  if (type === "sangria") {
    addBox(group, [0.36, 0.72, 0.02], [0.18, 0.52, 0.18], 0xf28e2b, 0.78);
    addCylinder(group, [0.36, 1.02, 0.02], 0.1, 0.1, 0.08, 0xf7f0d0);
  }

  if (type === "stag") {
    const label = makeLabel("STAG", "#ffffff", "#39a96b", 128, 64);
    label.position.set(0, 0.75, -0.28);
    label.rotation.x = -0.28;
    label.scale.set(0.42, 0.2, 1);
    group.add(label);
  }

  if (type === "sandals") {
    addCylinder(group, [-0.14, 0.08, -0.12], 0.09, 0.11, 0.05, 0xffffff);
    addCylinder(group, [0.14, 0.08, -0.12], 0.09, 0.11, 0.05, 0xffffff);
  }

  if (type === "selfie") {
    const stick = addCylinder(group, [0.5, 1.0, -0.32], 0.015, 0.015, 0.9, 0x2b2d42);
    stick.rotation.z = -0.72;
    stick.rotation.x = 0.4;
    addBox(group, [0.78, 1.28, -0.54], [0.26, 0.14, 0.04], 0x121826);
  }

  if (type === "backpack") {
    addBox(group, [-0.25, 0.7, 0.25], [0.22, 0.55, 0.26], 0x7057a3);
  }

  return {
    group,
    type,
    velocity: new THREE.Vector3(),
    wet: false,
    reactionTime: 0,
    fleeDirection: new THREE.Vector3(),
  };
}

function createPlayerCharacter() {
  const group = new THREE.Group();
  group.userData.skin = 0xffd4a3;

  const person = addPreviewPerson(group, {
    blocky: true,
    shirt: 0xf7f4e9,
    shorts: 0x2e5a95,
    skin: 0xffd4a3,
    hair: 0x1e5eae,
    scale: STANDARD_PERSON_SCALE,
  });
  addSquareShirt(person, 0xf7f4e9);
  addWalkingShoes(person);
  addBox(person, [0.38, 0.76, -0.31], [0.13, 0.22, 0.04], 0x28c7e8);

  return group;
}

function createPlayableGuiri(type, variant = 0) {
  const group = createGuiriArchetype(type, variant);
  group.userData.skin = group.userData.skin ?? 0xffd6a5;
  const hitsNeeded = type === "stagCrew" ? 3 : 1;

  return {
    group,
    type,
    hits: 0,
    hitsNeeded,
    velocity: new THREE.Vector3(),
    wet: false,
    reactionTime: 0,
    fleeDirection: new THREE.Vector3(),
    hitRadius: type === "stagCrew" ? 1.45 : 1.05,
    facingOffset: Math.PI,
  };
}

function createPlayableLocal(variant) {
  const group = createLocalResidentWalker(variant);

  return {
    group,
    type: "local",
    velocity: new THREE.Vector3(),
    wet: false,
    reactionTime: 0,
    fleeDirection: new THREE.Vector3(),
    hitRadius: 0.78,
    facingOffset: Math.PI,
  };
}

function createPlayablePolice(variant) {
  const group = createPoliceWalker(variant);

  return {
    group,
    type: "police",
    velocity: new THREE.Vector3(),
    wet: false,
    reactionTime: 0,
    fleeDirection: new THREE.Vector3(),
    hitRadius: 0.82,
    facingOffset: Math.PI,
  };
}

function createLocalResidentWalker(variant) {
  const styles = [
    { shirt: 0x2f3437, shorts: 0x2f3437, hair: 0x5a3a25, prop: "tote" },
    { shirt: 0x3f7fa0, shorts: 0x4d4a44, hair: 0x5a3a25, prop: "strap" },
    { shirt: 0xd8d0c0, shorts: 0x39515c, hair: 0xe7e0d2, prop: "bag" },
    { shirt: 0x6a7068, shorts: 0x2f3437, hair: 0x2a2522, prop: "plain" },
  ];
  const style = styles[variant % styles.length];
  const group = new THREE.Group();
  group.userData.skin = 0xffd6a5;

  const person = addPreviewPerson(group, {
    blocky: true,
    shirt: style.shirt,
    shorts: style.shorts,
    skin: 0xffd6a5,
    hair: style.hair,
    scale: STANDARD_PERSON_SCALE,
  });
  addSquareShirt(person, style.shirt);
  addWalkingShoes(person);

  if (style.prop === "tote") {
    addToteBag(person, 0x9a7f57);
  } else if (style.prop === "strap") {
    addCrossbodyStrap(person, 0x7a4e31);
  } else if (style.prop === "bag") {
    addShortGreyHair(person);
    addSmallShoulderBag(person, 0x5c6f7b);
  }

  return group;
}

function createPoliceWalker(variant) {
  const group = new THREE.Group();
  group.userData.skin = 0xffd6a5;

  const officer = addPreviewPerson(group, {
    blocky: true,
    shirt: 0x234b6d,
    shorts: 0x1c2e42,
    skin: 0xffd6a5,
    hair: 0x1c2e42,
    scale: STANDARD_PERSON_SCALE,
  });
  addSquareShirt(officer, 0x234b6d);
  addCap(officer, variant % 2 === 0 ? 0x1c2e42 : 0x2b5c86);
  addBox(officer, [0.22, 0.78, -0.31], [0.1, 0.16, 0.035], 0xf1c40f);
  addWalkingShoes(officer);

  return group;
}

function createPerson(options) {
  const group = new THREE.Group();
  const scale = options.scale ?? 0.92;
  group.scale.setScalar(scale);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);

  addCylinder(group, [-0.13, 0.25, 0], 0.065, 0.085, 0.48, options.shorts);
  addCylinder(group, [0.13, 0.25, 0], 0.065, 0.085, 0.48, options.shorts);
  addBox(group, [-0.13, 0.055, -0.08], [0.16, 0.06, 0.26], darken(options.shorts, 0.78));
  addBox(group, [0.13, 0.055, -0.08], [0.16, 0.06, 0.26], darken(options.shorts, 0.78));

  const torso = addCylinder(group, [0, 0.66, 0], 0.24, 0.34, 0.66, options.shirt);
  torso.rotation.z = -0.06;

  addBox(group, [0, 0.96, 0], [0.56, 0.1, 0.22], darken(options.shirt, 0.92));
  const sideShade = addCylinder(group, [0.1, 0.66, 0.03], 0.18, 0.24, 0.64, darken(options.shirt, 0.82));
  sideShade.scale.x = 0.5;

  const leftArm = addCylinder(group, [-0.35, 0.68, 0], 0.045, 0.055, 0.52, options.skin);
  leftArm.rotation.z = -0.18;

  const rightArm = addCylinder(group, [0.36, 0.68, 0], 0.045, 0.055, 0.52, options.skin);
  rightArm.rotation.z = 0.18;
  addFruit(group, -0.39, 0.42, -0.02, options.skin);
  addFruit(group, 0.4, 0.42, -0.02, options.skin);
  addCylinder(group, [0, 1.01, -0.02], 0.07, 0.08, 0.12, options.skin);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 10, 8),
    new THREE.MeshStandardMaterial({ color: options.skin, roughness: 0.8, flatShading: true }),
  );
  head.position.set(0, 1.16, -0.02);
  head.scale.set(0.92, 1.08, 0.9);
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.16, 5),
    new THREE.MeshStandardMaterial({ color: options.hair, roughness: 0.9, flatShading: true }),
  );
  hair.position.set(0, 1.33, -0.02);
  hair.rotation.y = Math.PI / 5;
  hair.castShadow = true;
  group.add(hair);

  return group;
}

function addPreviewPerson(parent, options, x = 0, z = 0, rotation = 0) {
  const person = options.blocky ? createBlockPerson(options) : createPerson(options);
  person.position.set(x, 0, z);
  person.rotation.y = rotation;
  parent.add(person);
  return person;
}

function createBlockPerson(options) {
  const group = new THREE.Group();
  const scale = options.scale ?? 0.92;
  group.scale.setScalar(scale);
  group.userData.skin = options.skin;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);

  addBox(group, [-0.15, 0.28, 0], [0.16, 0.48, 0.16], options.shorts);
  addBox(group, [0.15, 0.28, 0], [0.16, 0.48, 0.16], options.shorts);
  addBox(group, [-0.15, 0.07, -0.08], [0.25, 0.11, 0.34], darken(options.shorts, 0.65));
  addBox(group, [0.15, 0.07, -0.08], [0.25, 0.11, 0.34], darken(options.shorts, 0.65));
  addBox(group, [0, 0.52, 0], [0.54, 0.15, 0.25], options.shorts);

  addBox(group, [0, 0.82, 0], [0.62, 0.62, 0.34], options.shirt);
  addBox(group, [0, 0.82, -0.2], [0.56, 0.55, 0.045], lighten(options.shirt, 1.06));
  addBox(group, [0, 1.14, 0], [0.66, 0.12, 0.34], darken(options.shirt, 0.84));

  addBox(group, [-0.48, 0.82, -0.02], [0.14, 0.52, 0.16], options.skin);
  addBox(group, [0.48, 0.82, -0.02], [0.14, 0.52, 0.16], options.skin);
  addBox(group, [-0.48, 0.5, -0.04], [0.17, 0.16, 0.19], options.skin);
  addBox(group, [0.48, 0.5, -0.04], [0.17, 0.16, 0.19], options.skin);

  addBox(group, [0, 1.16, -0.02], [0.18, 0.13, 0.18], options.skin);
  addBox(group, [0, 1.42, -0.02], [0.46, 0.46, 0.4], options.skin);
  addBox(group, [0, 1.68, -0.05], [0.48, 0.17, 0.42], options.hair);
  addBox(group, [-0.24, 1.48, -0.03], [0.08, 0.28, 0.38], darken(options.hair, 0.82));
  addBox(group, [0.24, 1.48, -0.03], [0.08, 0.28, 0.38], darken(options.hair, 0.82));

  return group;
}

function addSlogan(person, text, background) {
  const label = makeLabel(text, "#10202b", `#${background.toString(16).padStart(6, "0")}`, 180, 72);
  label.position.set(0, 0.8, -0.28);
  label.scale.set(0.44, 0.18, 1);
  person.add(label);
}

function addReferenceSunglasses(person, color, width = 0.17) {
  addBox(person, [-0.09, 1.44, -0.24], [width, 0.07, 0.04], color);
  addBox(person, [0.09, 1.44, -0.24], [width, 0.07, 0.04], color);
  addBox(person, [0, 1.44, -0.255], [0.05, 0.025, 0.03], color);
}

function addAngryMouth(person) {
  addBox(person, [0, 1.3, -0.235], [0.18, 0.035, 0.03], 0x5b2a22);
}

function addStagShirtText(person, text = "MARK'S\nLAST\nSTAND", background = 0xd64f98) {
  const label = makeLabel(text, "#ffffff", `#${background.toString(16).padStart(6, "0")}`, 180, 180);
  label.position.set(0, 0.82, -0.34);
  label.scale.set(0.42, 0.42, 1);
  person.add(label);
}

function addIHeartShirt(person) {
  const top = makeLabel("I", "#111418", "#f7f4e9", 96, 96);
  top.position.set(-0.13, 0.93, -0.34);
  top.scale.set(0.18, 0.18, 1);
  person.add(top);

  const heart = makeLabel("♥", "#d62828", "#f7f4e9", 96, 96);
  heart.position.set(0.06, 0.93, -0.345);
  heart.scale.set(0.2, 0.2, 1);
  person.add(heart);

  const word = makeLabel("MILFS", "#111418", "#f7f4e9", 180, 80);
  word.position.set(0, 0.72, -0.34);
  word.scale.set(0.42, 0.2, 1);
  person.add(word);
}

function addWatch(person) {
  addBox(person, [0.5, 0.64, -0.04], [0.17, 0.055, 0.18], 0x111418);
}

function addChunkyShoes(person, color) {
  addBox(person, [-0.15, 0.055, -0.12], [0.26, 0.12, 0.36], color);
  addBox(person, [0.15, 0.055, -0.12], [0.26, 0.12, 0.36], color);
}

function addPartyBottle(person) {
  addCylinder(person, [-0.5, 0.67, -0.08], 0.05, 0.06, 0.3, 0x5b3a24);
  addCylinder(person, [-0.5, 0.89, -0.08], 0.026, 0.032, 0.13, 0xf28e2b);
  addFruit(person, -0.5, 1.0, -0.08, 0xff77cc);
}

function addTankTopDetails(person) {
  addBox(person, [-0.13, 0.95, -0.28], [0.09, 0.24, 0.04], 0xffffff);
  addBox(person, [0.13, 0.95, -0.28], [0.09, 0.24, 0.04], 0xffffff);
  addBox(person, [0, 0.72, -0.3], [0.36, 0.34, 0.045], 0xffffff);
}

function addSunburnChest(person) {
  addBox(person, [0, 0.68, -0.335], [0.22, 0.18, 0.035], 0xff6b5f, 0.8);
  addBox(person, [-0.36, 0.7, -0.04], [0.055, 0.34, 0.075], 0xff4238);
  addBox(person, [0.37, 0.7, -0.04], [0.055, 0.34, 0.075], 0xff4238);
}

function addOneLiterSangria(person) {
  addCylinder(person, [0.46, 0.76, -0.08], 0.11, 0.09, 0.42, 0xe76f51);
  addCylinder(person, [0.46, 1.0, -0.08], 0.115, 0.115, 0.05, 0xf7f0d0);
  addCylinder(person, [0.59, 0.83, -0.08], 0.025, 0.025, 0.22, 0xf7f0d0);
}

function addBottle(person, x) {
  addCylinder(person, [x, 0.62, -0.04], 0.045, 0.055, 0.28, 0x5b3a24);
  addCylinder(person, [x, 0.81, -0.04], 0.025, 0.032, 0.14, 0x2f7a48);
  addBox(person, [x, 0.62, -0.09], [0.08, 0.09, 0.025], 0xf7f0d0);
}

function addJerseyNumber(person, number, color, background) {
  const label = makeLabel(number, `#${color.toString(16).padStart(6, "0")}`, `#${background.toString(16).padStart(6, "0")}`, 96, 96);
  label.position.set(0, 0.79, -0.34);
  label.scale.set(0.28, 0.28, 1);
  person.add(label);
}

function addSquareShirt(person, color) {
  addBox(person, [0, 0.7, -0.3], [0.48, 0.56, 0.06], color);
  addBox(person, [0, 0.98, -0.25], [0.55, 0.12, 0.08], darken(color, 0.88));
}

function addWalkingShoes(person) {
  addBox(person, [-0.13, 0.055, -0.12], [0.18, 0.07, 0.3], 0x121826);
  addBox(person, [0.13, 0.055, -0.12], [0.18, 0.07, 0.3], 0x121826);
}

function addSimpleDress(person, color) {
  addBox(person, [0, 0.68, -0.28], [0.44, 0.58, 0.065], color);
  addCone(person, [0, 0.38, -0.02], 0.32, 0.48, darken(color, 0.9));
}

function addCrossbodyStrap(person, color) {
  const strap = addCylinder(person, [-0.08, 0.78, -0.3], 0.018, 0.018, 0.72, color);
  strap.rotation.z = -0.72;
  addBox(person, [0.31, 0.5, -0.18], [0.16, 0.2, 0.075], color);
}

function addShortGreyHair(person) {
  addCylinder(person, [0, 1.31, -0.02], 0.23, 0.2, 0.1, 0xe7e0d2);
  addFruit(person, -0.16, 1.22, -0.08, 0xe7e0d2);
  addFruit(person, 0.16, 1.22, -0.08, 0xe7e0d2);
}

function addSmallShoulderBag(person, color) {
  addBox(person, [0.36, 0.58, 0.02], [0.16, 0.28, 0.08], color);
  const strap = addCylinder(person, [0.17, 0.82, -0.03], 0.018, 0.018, 0.55, darken(color, 0.72));
  strap.rotation.z = 0.68;
}

function addCap(person, color) {
  addCylinder(person, [0, 1.37, -0.02], 0.2, 0.23, 0.1, color);
  addBox(person, [0, 1.34, -0.23], [0.36, 0.04, 0.18], color);
}

function addBucketHat(person, color) {
  addCylinder(person, [0, 1.37, -0.02], 0.23, 0.2, 0.16, color);
  addCylinder(person, [0, 1.29, -0.02], 0.29, 0.29, 0.04, darken(color, 0.86));
}

function addWideHat(person, color) {
  addCylinder(person, [0, 1.35, -0.02], 0.2, 0.22, 0.1, color);
  addCylinder(person, [0, 1.3, -0.02], 0.38, 0.38, 0.035, darken(color, 0.9));
}

function addSunglasses(person, width = 0.13) {
  addBox(person, [-0.08, 1.18, -0.21], [width, 0.055, 0.035], 0x121826);
  addBox(person, [0.08, 1.18, -0.21], [width, 0.055, 0.035], 0x121826);
  addBox(person, [0, 1.18, -0.22], [0.05, 0.025, 0.03], 0x121826);
}

function addSandals(person) {
  addCylinder(person, [-0.14, 0.08, -0.12], 0.09, 0.11, 0.05, 0xf7f4e9);
  addCylinder(person, [0.14, 0.08, -0.12], 0.09, 0.11, 0.05, 0xf7f4e9);
  addBox(person, [-0.14, 0.12, -0.15], [0.12, 0.025, 0.025], 0x4f321f);
  addBox(person, [0.14, 0.12, -0.15], [0.12, 0.025, 0.025], 0x4f321f);
}

function addFlipFlops(person) {
  addCylinder(person, [-0.14, 0.07, -0.13], 0.09, 0.11, 0.035, 0xffd166);
  addCylinder(person, [0.14, 0.07, -0.13], 0.09, 0.11, 0.035, 0xffd166);
}

function addSweatDrops(person) {
  [
    [-0.18, 1.08, -0.18],
    [0.18, 0.98, -0.2],
    [0.26, 0.62, -0.2],
  ].forEach(([x, y, z]) => {
    addFruit(person, x, y, z, 0x8fe8ff);
  });
}

function addPlasticCup(person, x) {
  addCylinder(person, [x, 0.72, -0.02], 0.07, 0.055, 0.2, 0xf7f0d0);
  addCylinder(person, [x, 0.83, -0.02], 0.075, 0.075, 0.035, 0xff9f1c);
}

function addToteBag(person, color) {
  addBox(person, [-0.38, 0.52, 0.02], [0.22, 0.34, 0.08], color);
  addBox(person, [-0.38, 0.75, 0.02], [0.16, 0.04, 0.06], darken(color, 0.75));
}

function addBackpack(person, color) {
  addBox(person, [0, 0.72, 0.29], [0.34, 0.52, 0.18], color);
  addBox(person, [-0.18, 0.78, 0.16], [0.06, 0.38, 0.05], darken(color, 0.72));
  addBox(person, [0.18, 0.78, 0.16], [0.06, 0.38, 0.05], darken(color, 0.72));
}

function addTinyBackpack(person) {
  addBackpack(person, 0x9a8f79);
}

function addCamera(person) {
  addBox(person, [0.36, 0.86, -0.18], [0.26, 0.17, 0.11], 0x121826);
  addCylinder(person, [0.36, 0.86, -0.28], 0.06, 0.08, 0.08, 0x2f4858);
}

function addPhone(person, color = 0x121826) {
  addBox(person, [0.42, 0.86, -0.2], [0.09, 0.18, 0.035], color);
}

function addMap(person) {
  const map = makeLabel("MAP", "#10202b", "#f7f4e9", 120, 80);
  map.position.set(0.35, 0.74, -0.22);
  map.scale.set(0.32, 0.22, 1);
  person.add(map);
}

function addWristband(person, color) {
  addBox(person, [-0.36, 0.56, -0.02], [0.08, 0.045, 0.075], color);
  addBox(person, [0.36, 0.56, -0.02], [0.08, 0.045, 0.075], color);
}

function addRingLight(person) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.018, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xf7f4e9 }),
  );
  ring.position.set(0.55, 1.14, -0.36);
  ring.rotation.x = Math.PI / 2;
  person.add(ring);
  const stick = addCylinder(person, [0.42, 0.92, -0.28], 0.012, 0.012, 0.62, 0x263240);
  stick.rotation.z = -0.55;
}

function addBelly(person, color) {
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82, flatShading: true }),
  );
  belly.position.set(0, 0.62, -0.2);
  belly.scale.set(1.15, 0.78, 0.7);
  belly.castShadow = true;
  person.add(belly);
}

function addJerseyStripe(person, color) {
  addBox(person, [0, 0.73, -0.3], [0.11, 0.48, 0.035], color);
}

function addUnicornHorn(person, index) {
  const horn = addCone(person, [0, 1.5, -0.08], 0.055, 0.24, index % 2 === 0 ? 0xffd166 : 0xff77cc);
  horn.rotation.x = -0.25;
}

function addSparkles(person) {
  [
    [-0.28, 0.98, -0.18, 0xffd166],
    [0.26, 0.82, -0.22, 0x8fe8ff],
    [0.2, 1.18, -0.2, 0xff77cc],
  ].forEach(([x, y, z, color]) => {
    const sparkle = addBox(person, [x, y, z], [0.06, 0.06, 0.06], color);
    sparkle.rotation.z = Math.PI / 4;
  });
}

function createWaterPistol() {
  const group = new THREE.Group();
  addBox(group, [0.3, 0.78, 0], [0.55, 0.12, 0.13], 0x28c7e8);
  addBox(group, [0.07, 0.58, 0], [0.13, 0.34, 0.13], 0x0f6a7d);
  addBox(group, [0.62, 0.79, 0], [0.17, 0.06, 0.07], 0xd9f7ff);
  return group;
}

function createFountain() {
  const group = new THREE.Group();

  addCylinder(group, [0, 0.16, 0], 0.5, 0.58, 0.24, 0xb69770);
  addCylinder(group, [0, 0.36, 0], 0.34, 0.4, 0.16, 0xe0c48d);
  addCylinder(group, [0, 0.48, 0], 0.28, 0.28, 0.08, 0x64c9e8);
  addCylinder(group, [0, 0.72, 0], 0.045, 0.06, 0.48, 0xb69770);
  addCone(group, [0, 1.05, 0], 0.17, 0.28, 0x8fe8ff);

  const waterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.025, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.74 }),
  );
  waterRing.position.y = 0.53;
  waterRing.rotation.x = Math.PI / 2;
  group.add(waterRing);

  const prompt = makeLabel("E", "#10202b", "#d7f8ff", 96, 96);
  prompt.position.set(0, 1.42, 0);
  prompt.scale.set(0.24, 0.24, 1);
  prompt.visible = false;
  group.add(prompt);
  group.userData.prompt = prompt;

  return group;
}

function createWaterCartridge() {
  const group = new THREE.Group();

  addCylinder(group, [0, 0.26, 0], 0.13, 0.15, 0.42, 0x24c6e8);
  addCylinder(group, [0, 0.53, 0], 0.08, 0.1, 0.09, 0xd7f8ff);
  addBox(group, [0, 0.26, -0.135], [0.22, 0.16, 0.035], 0xf7f4e9);
  addBox(group, [0, 0.26, -0.158], [0.12, 0.05, 0.03], 0x2e5a95);

  return group;
}

function createPigeon() {
  const group = new THREE.Group();

  addCylinder(group, [0, 0.11, 0], 0.06, 0.09, 0.18, 0x87919a);
  addFruit(group, 0.08, 0.18, -0.03, 0x5f6972);
  addCone(group, [0.16, 0.18, -0.04], 0.035, 0.08, 0xd99b6d);
  const leftWing = addBox(group, [-0.08, 0.1, 0.05], [0.14, 0.025, 0.08], 0x5f6972);
  const rightWing = addBox(group, [0.01, 0.1, -0.08], [0.14, 0.025, 0.08], 0x707982);
  group.userData.wings = [leftWing, rightWing];

  return {
    group,
    flying: false,
    flyTime: 0,
    direction: new THREE.Vector3(),
    baseY: 0.03,
    idlePhase: Math.random() * Math.PI * 2,
  };
}

function updatePlayer(delta) {
  const movement = new THREE.Vector3();

  if (keys.has("arrowleft") || keys.has("a")) movement.x -= 1;
  if (keys.has("arrowright") || keys.has("d")) movement.x += 1;
  if (keys.has("arrowup") || keys.has("w")) movement.z -= 1;
  if (keys.has("arrowdown") || keys.has("s")) movement.z += 1;

  if (movement.lengthSq() > 0) {
    movement.normalize();
    lastAim.copy(movement);
    player.position.addScaledVector(movement, PLAYER_SPEED * delta);
    player.position.x = THREE.MathUtils.clamp(player.position.x, PLAY_MIN_X, PLAY_MAX_X);
    player.position.z = THREE.MathUtils.clamp(player.position.z, WORLD_MIN_Z + 0.8, WORLD_MAX_Z - 0.8);
  }

  player.rotation.y = Math.atan2(lastAim.x, lastAim.z);
  waterPistol.position.copy(player.position);
  waterPistol.position.addScaledVector(lastAim, 0.34);
  waterPistol.rotation.y = Math.atan2(lastAim.x, lastAim.z) - Math.PI / 2;
}

function updateNpcs(delta) {
  npcs.forEach((npc) => updateMovingNpc(npc, delta));
}

function updateLocals(delta) {
  locals.forEach((local) => updateMovingNpc(local, delta));
}

function updatePigeons(delta) {
  pigeons.forEach((pigeon) => {
    if (!pigeon.group.visible) return;

    if (!pigeon.flying && distance2D(player.position, pigeon.group.position) < PIGEON_STARTLE_RANGE) {
      startlePigeon(pigeon);
    }

    if (pigeon.flying) {
      pigeon.flyTime += delta;
      pigeon.group.position.addScaledVector(pigeon.direction, delta * 2.25);
      pigeon.group.position.y = pigeon.baseY + 0.24 + pigeon.flyTime * 1.35;
      pigeon.group.rotation.y = Math.atan2(pigeon.direction.x, pigeon.direction.z);
      pigeon.group.userData.wings.forEach((wing, index) => {
        wing.rotation.z = Math.sin(pigeon.flyTime * 28 + index * Math.PI) * 0.75;
      });

      if (pigeon.flyTime > 1.45) {
        pigeon.group.visible = false;
      }
      return;
    }

    const idleTime = clock.elapsedTime + pigeon.idlePhase;
    pigeon.group.position.y = pigeon.baseY + Math.sin(idleTime * 3) * 0.012;
    pigeon.group.rotation.y += Math.sin(idleTime * 1.5) * delta * 0.2;
  });
}

function startlePigeon(pigeon) {
  pigeon.flying = true;
  pigeon.flyTime = 0;
  pigeon.direction.copy(pigeon.group.position).sub(player.position);
  pigeon.direction.y = 0;

  if (pigeon.direction.lengthSq() < 0.001) {
    pigeon.direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  }

  pigeon.direction.normalize();
  pigeon.direction.x += randomBetween(-0.35, 0.35);
  pigeon.direction.z += randomBetween(-0.35, 0.35);
  pigeon.direction.normalize();
}

function updateMovingNpc(npc, delta) {
  if (npc.wet) {
    updateNpcReaction(npc, delta);
    return;
  }

  updateNpcHitFeedback(npc, delta);

  const sidePadding = npc.type === "stagCrew" ? 0.58 : 0.15;
  npc.group.position.addScaledVector(npc.velocity, delta);

  if (npc.group.position.x < PLAY_MIN_X + sidePadding || npc.group.position.x > PLAY_MAX_X - sidePadding) {
    npc.velocity.x *= -1;
  }
  if (npc.group.position.z < WORLD_MIN_Z + 1 || npc.group.position.z > WORLD_MAX_Z - 1) {
    npc.velocity.z *= -1;
  }

  npc.group.position.x = THREE.MathUtils.clamp(npc.group.position.x, PLAY_MIN_X + sidePadding, PLAY_MAX_X - sidePadding);
  npc.group.position.z = THREE.MathUtils.clamp(npc.group.position.z, WORLD_MIN_Z + 0.9, WORLD_MAX_Z - 0.9);

  if (npc.velocity.lengthSq() > 0.01) {
    npc.group.rotation.y = (npc.facingOffset ?? 0) + Math.atan2(npc.velocity.x, npc.velocity.z);
  }
}

function updateNpcHitFeedback(npc, delta) {
  if (!npc.hitBubble) return;

  npc.hitBubbleAge += delta;
  npc.hitBubble.position.y = 1.78 + Math.sin(npc.hitBubbleAge * 10) * 0.08;
  npc.hitBubble.material.opacity = Math.max(0, 1 - npc.hitBubbleAge / 0.75);

  if (npc.hitBubbleAge >= 0.75) {
    npc.group.remove(npc.hitBubble);
    npc.hitBubble = null;
  }
}

function updateNpcReaction(npc, delta) {
  if (!npc.group.visible) return;

  if (npc.memberScatter) {
    updateStagScatterReaction(npc, delta);
    return;
  }

  npc.reactionTime += delta;
  const progress = THREE.MathUtils.clamp(npc.reactionTime / NPC_REACTION_SECONDS, 0, 1);
  const fleeSpeed = NPC_FLEE_SPEED * (1 - progress * 0.35);
  npc.group.position.addScaledVector(npc.fleeDirection, fleeSpeed * delta);
  npc.group.position.x = THREE.MathUtils.clamp(npc.group.position.x, PLAY_MIN_X + 0.05, PLAY_MAX_X - 0.05);
  npc.group.position.z = THREE.MathUtils.clamp(npc.group.position.z, WORLD_MIN_Z + 0.9, WORLD_MAX_Z - 0.9);
  npc.group.position.y = 0.02 + Math.sin(npc.reactionTime * 20) * 0.05 * (1 - progress);
  npc.group.rotation.y =
    Math.atan2(npc.fleeDirection.x, npc.fleeDirection.z) + Math.sin(npc.reactionTime * 16) * 0.28;

  if (npc.reactionArms) {
    npc.reactionArms.rotation.z = Math.sin(npc.reactionTime * 18) * 0.18;
  }

  if (npc.emote) {
    npc.emote.position.y = 1.65 + Math.sin(npc.reactionTime * 12) * 0.12;
    npc.emote.material.opacity = 1 - progress * 0.55;
  }

  if (npc.splash) {
    npc.splash.children.forEach((drop, index) => {
      drop.position.y += delta * (0.35 + index * 0.04);
      drop.material.opacity = Math.max(0, 0.78 - progress);
      drop.scale.setScalar(1 + progress * 1.2);
    });
  }

  if (npc.reactionTime >= NPC_REACTION_SECONDS) {
    npc.group.visible = false;
  }
}

function updateStagScatterReaction(npc, delta) {
  npc.reactionTime += delta;
  const progress = THREE.MathUtils.clamp(npc.reactionTime / NPC_REACTION_SECONDS, 0, 1);

  npc.memberScatter.forEach(({ member, direction, speed }) => {
    member.position.x += direction.x * speed * delta;
    member.position.z += direction.z * speed * delta;
    member.rotation.y = Math.atan2(direction.x, direction.z) + Math.sin(npc.reactionTime * 14) * 0.16;
  });

  npc.group.position.y = 0.02 + Math.sin(npc.reactionTime * 18) * 0.04 * (1 - progress);

  if (npc.emote) {
    npc.emote.position.y = 1.72 + Math.sin(npc.reactionTime * 12) * 0.12;
    npc.emote.material.opacity = 1 - progress * 0.55;
  }

  if (npc.splash) {
    npc.splash.children.forEach((drop, index) => {
      drop.position.y += delta * (0.35 + index * 0.04);
      drop.material.opacity = Math.max(0, 0.78 - progress);
      drop.scale.setScalar(1 + progress * 1.2);
    });
  }

  if (npc.reactionTime >= NPC_REACTION_SECONDS) {
    npc.group.visible = false;
  }
}

function updateCamera(delta) {
  const targetZ = THREE.MathUtils.clamp(player.position.z, CAMERA_MIN_Z, CAMERA_MAX_Z);
  const followAmount = Math.min(1, delta * 5);
  cameraFocus.z = THREE.MathUtils.lerp(cameraFocus.z, targetZ, followAmount);
  camera.position.set(0, 10.5, cameraFocus.z + 7.2);
  camera.lookAt(0, 0, cameraFocus.z);
}

function aimAtPointer(event) {
  const groundPoint = getPointerGroundPoint(event);
  if (!groundPoint) return;

  const aim = groundPoint.sub(player.position);
  aim.y = 0;

  if (aim.lengthSq() > 0.04) {
    lastAim.copy(aim.normalize());
  }
}

function getPointerGroundPoint(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const point = new THREE.Vector3();
  return raycaster.ray.intersectPlane(groundPlane, point);
}

function sprayWater() {
  if (gameOver) return;
  if (shotCooldownLeft > 0) return;

  if (waterAmmo <= 0) {
    showHint("Empty tank - hold E at a fountain");
    updateHud();
    return;
  }

  shotCooldownLeft = SHOT_COOLDOWN;
  waterAmmo -= 1;
  updateHud();

  const start = player.position.clone().addScaledVector(lastAim, 0.5);
  start.y = 0.72;
  const end = start.clone().addScaledVector(lastAim, SPRAY_RANGE);
  end.y = 0.72;

  const spray = createSpray(start, end);
  sprays.push({ group: spray, age: 0 });
  dynamicGroup.add(spray);

  for (const npc of npcs) {
    if (npc.wet) continue;

    const distance = distanceToSegment2D(npc.group.position, start, end);
    if (distance < (npc.hitRadius ?? 1.15)) {
      soakNpc(npc);
      return;
    }
  }

  for (const local of locals) {
    if (local.wet) continue;

    const distance = distanceToSegment2D(local.group.position, start, end);
    if (distance < (local.hitRadius ?? 0.78)) {
      soakLocal(local);
      return;
    }
  }
}

function createSpray(start, end) {
  const group = new THREE.Group();
  const direction = end.clone().sub(start);
  const length = direction.length();
  const center = start.clone().add(end).multiplyScalar(0.5);

  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.09, length, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x54d8ff,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
  stream.position.copy(center);
  stream.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(stream);

  for (let i = 0; i < 8; i += 1) {
    const t = 0.12 + i * 0.1;
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.035, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xd7f8ff, transparent: true, opacity: 0.82 }),
    );
    drop.position.lerpVectors(start, end, t);
    drop.position.x += (Math.random() - 0.5) * 0.16;
    drop.position.z += (Math.random() - 0.5) * 0.16;
    group.add(drop);
  }

  return group;
}

function updateSprays(delta) {
  sprays = sprays.filter((spray) => {
    spray.age += delta;
    const alpha = Math.max(0, 1 - spray.age / SPRAY_LIFETIME);
    spray.group.children.forEach((child) => {
      child.material.opacity = child.userData.baseOpacity ?? child.material.opacity;
      child.userData.baseOpacity = child.userData.baseOpacity ?? child.material.opacity;
      child.material.opacity = child.userData.baseOpacity * alpha;
    });

    if (spray.age >= SPRAY_LIFETIME) {
      dynamicGroup.remove(spray.group);
      return false;
    }

    return true;
  });
}

function updateWaterResources(delta) {
  shotCooldownLeft = Math.max(0, shotCooldownLeft - delta);

  cartridges.forEach((cartridge) => {
    if (cartridge.collected) return;

    cartridge.group.rotation.y += delta * 2.2;
    cartridge.group.position.y = 0.02 + Math.sin(clock.elapsedTime * 4 + cartridge.bobOffset) * 0.04;

    if (waterAmmo >= MAX_WATER) return;

    if (distance2D(player.position, cartridge.group.position) < CARTRIDGE_RANGE) {
      cartridge.collected = true;
      cartridge.group.visible = false;
      waterAmmo = Math.min(MAX_WATER, waterAmmo + CARTRIDGE_REFILL);
      showHint(`+${CARTRIDGE_REFILL} water`);
      updateHud();
    }
  });

  const fountain = getNearbyFountain();
  fountains.forEach((station) => {
    station.group.userData.prompt.visible = station === fountain && waterAmmo < MAX_WATER;
  });

  if (!fountain || waterAmmo >= MAX_WATER) {
    refillProgress = 0;
    refillEl.hidden = true;
    refillFillEl.style.width = "0%";
    return;
  }

  refillEl.hidden = false;
  const holdingRefill = keys.has("e");
  refillTextEl.textContent = holdingRefill ? "Refilling..." : "Hold E to refill";

  if (holdingRefill) {
    refillProgress = Math.min(1, refillProgress + delta / FOUNTAIN_REFILL_SECONDS);
    fountain.group.rotation.y += delta * 0.9;
  } else {
    refillProgress = Math.max(0, refillProgress - delta * 1.8);
  }

  refillFillEl.style.width = `${Math.round(refillProgress * 100)}%`;

  if (refillProgress >= 1) {
    waterAmmo = MAX_WATER;
    refillProgress = 0;
    refillEl.hidden = true;
    showHint("Water refilled");
    updateHud();
  }
}

function getNearbyFountain() {
  let nearest = null;
  let nearestDistance = Infinity;

  fountains.forEach((station) => {
    const distance = distance2D(player.position, station.group.position);
    if (distance < FOUNTAIN_RANGE && distance < nearestDistance) {
      nearest = station;
      nearestDistance = distance;
    }
  });

  return nearest;
}

function soakNpc(npc) {
  npc.hits = (npc.hits ?? 0) + 1;

  if (npc.hits < (npc.hitsNeeded ?? 1)) {
    showMultiHitFeedback(npc);
    return;
  }

  startNpcReaction(npc);
  soakedTargetCounts[npc.type] = (soakedTargetCounts[npc.type] ?? 0) + 1;
  score += 1;
  updateHud();

  if (score >= npcs.length) {
    endingSoon = true;
    winDelay = 1.05;
  }
}

function soakLocal(local) {
  startNpcReaction(local);
  localsHit += 1;
  timeLeft = Math.max(0, timeLeft - LOCAL_PENALTY_SECONDS);
  showHint(`Local sprayed -${LOCAL_PENALTY_SECONDS}s`);
  updateHud();

  if (timeLeft <= 0) {
    endRound(false);
  }
}

function showMultiHitFeedback(npc) {
  if (npc.hitBubble) {
    npc.group.remove(npc.hitBubble);
  }

  npc.hitBubble = makeLabel(`${npc.hits}/${npc.hitsNeeded}`, "#10202b", "#fff3d6", 160, 72);
  npc.hitBubble.position.set(0, 1.78, -0.1);
  npc.hitBubble.scale.set(0.72, 0.28, 1);
  npc.hitBubbleAge = 0;
  npc.group.add(npc.hitBubble);
  showHint(`Stag Crew ${npc.hits}/${npc.hitsNeeded}`);
}

function startNpcReaction(npc) {
  npc.wet = true;
  npc.reactionTime = 0;
  if (npc.hitBubble) {
    npc.group.remove(npc.hitBubble);
    npc.hitBubble = null;
  }
  npc.fleeDirection.copy(npc.group.position).sub(player.position);
  npc.fleeDirection.y = 0;

  if (npc.fleeDirection.lengthSq() < 0.001) {
    npc.fleeDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  }

  npc.fleeDirection.normalize();
  npc.emote = createReactionBubble(npc.type);
  npc.splash = createSplashCloud();

  if (npc.type === "stagCrew") {
    npc.memberScatter = createStagMemberScatter(npc);
    npc.group.add(npc.emote, npc.splash);
    return;
  }

  npc.reactionArms = createReactionArms(npc.group.userData.skin ?? 0xffd6a5);
  npc.group.add(npc.emote, npc.splash, npc.reactionArms);
}

function createStagMemberScatter(npc) {
  const members = npc.group.userData.members ?? [];
  const directions = [
    new THREE.Vector3(-0.78, 0, 0.64).normalize(),
    new THREE.Vector3(0.08, 0, -1).normalize(),
    new THREE.Vector3(0.82, 0, 0.58).normalize(),
  ];

  return members.map((member, index) => ({
    member,
    direction: directions[index % directions.length],
    speed: 1.2 + index * 0.18,
  }));
}

function createReactionBubble(type) {
  const textByType = {
    sangria: "NOOO!",
    stag: "OI!",
    sandals: "EEK!",
    sunburn: "AAH!",
    selfie: "MY PHONE!",
    backpack: "MAP?!",
    gamba: "NOOO!",
    stagCrew: "SCATTER!",
    slogan: "RUDE!",
    local: "HEY!",
    police: "STOP!",
  };
  const bubble = makeLabel(textByType[type] ?? "HEY!", "#10202b", "#fff3d6", 220, 88);
  bubble.position.set(0, 1.65, -0.08);
  bubble.scale.set(0.88, 0.35, 1);
  return bubble;
}

function createSplashCloud() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xa9f0ff,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });

  for (let i = 0; i < 9; i += 1) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045 + Math.random() * 0.035, 8, 6), material.clone());
    drop.position.set((Math.random() - 0.5) * 0.6, 0.62 + Math.random() * 0.58, (Math.random() - 0.5) * 0.38);
    group.add(drop);
  }

  return group;
}

function createReactionArms(skin) {
  const arms = new THREE.Group();
  const leftArm = addCylinder(arms, [-0.32, 0.98, 0], 0.045, 0.055, 0.48, skin);
  const rightArm = addCylinder(arms, [0.32, 0.98, 0], 0.045, 0.055, 0.48, skin);
  leftArm.rotation.z = 0.95;
  rightArm.rotation.z = -0.95;
  return arms;
}

function distanceToSegment2D(point, start, end) {
  const px = point.x;
  const pz = point.z;
  const ax = start.x;
  const az = start.z;
  const bx = end.x;
  const bz = end.z;
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;
  const t = THREE.MathUtils.clamp(((px - ax) * dx + (pz - az) * dz) / lengthSq, 0, 1);
  const x = ax + dx * t;
  const z = az + dz * t;

  return Math.hypot(px - x, pz - z);
}

function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffleCopy(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function sanitizePlayerName(name) {
  const cleaned = String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 16);
  return cleaned || "Anonymous";
}

async function saveScore(result) {
  saveLocalScore(result);

  if (!hasRemoteLeaderboard()) {
    return { remote: false, message: "Saved on this device" };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        player_name: result.playerName,
        location_id: result.locationId,
        location_name: result.locationName,
        score: result.score,
        guiris: result.guiris,
        seconds_left: result.secondsLeft,
        locals_hit: result.localsHit,
        player_won: result.playerWon,
      }),
    });

    if (!response.ok) {
      throw new Error(`Leaderboard save failed: ${response.status}`);
    }

    return { remote: true, message: "Score saved online" };
  } catch (error) {
    console.warn(error);
    return { remote: false, message: "Online save failed - saved on this device" };
  }
}

function saveLocalScore(result) {
  const scores = getLocalScores();
  scores.push(result);
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(sortScores(scores).slice(0, 25)));
}

async function renderLeaderboard(container) {
  container.innerHTML = `<div class="leaderboard__title">${LOCATION_NAME} leaderboard</div><div class="leaderboard__empty">Loading...</div>`;
  const scores = await loadLeaderboard();

  if (scores.length === 0) {
    container.innerHTML = `<div class="leaderboard__title">${LOCATION_NAME} leaderboard</div><div class="leaderboard__empty">No scores yet</div>`;
    return;
  }

  container.innerHTML = `
    <div class="leaderboard__title">${LOCATION_NAME} leaderboard</div>
    ${scores
      .slice(0, 10)
      .map(
        (entry, index) => `
          <div class="leaderboard__row">
            <span>${index + 1}</span>
            <span>${escapeHtml(entry.playerName)}</span>
            <strong>${entry.score}</strong>
          </div>
        `,
      )
      .join("")}
  `;
}

async function loadLeaderboard() {
  if (!hasRemoteLeaderboard()) {
    return sortScores(getLocalScores());
  }

  try {
    const query = new URLSearchParams({
      select: "player_name,score,guiris,seconds_left,locals_hit,created_at",
      location_id: `eq.${LOCATION_ID}`,
      order: "score.desc,created_at.asc",
      limit: "10",
    });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${LEADERBOARD_TABLE}?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Leaderboard load failed: ${response.status}`);
    }

    const rows = await response.json();
    return rows.map((row) => ({
      playerName: row.player_name,
      score: row.score,
      guiris: row.guiris,
      secondsLeft: row.seconds_left,
      localsHit: row.locals_hit,
      playedAt: row.created_at,
    }));
  } catch (error) {
    console.warn(error);
    return sortScores(getLocalScores());
  }
}

function getLocalScores() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function sortScores(scores) {
  return [...scores].sort((a, b) => b.score - a.score || new Date(a.playedAt) - new Date(b.playedAt));
}

function hasRemoteLeaderboard() {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateTimer(delta) {
  if (gameOver) return;
  if (endingSoon) {
    updateHud();
    return;
  }

  timeLeft -= delta;
  if (timeLeft <= 0) {
    timeLeft = 0;
    endRound(false);
  }

  updateHud();
}

function updateRoundEnding(delta) {
  if (!endingSoon || gameOver) return;

  winDelay -= delta;
  if (winDelay <= 0) {
    endRound(true);
  }
}

function updateHint(delta) {
  if (hintTimer <= 0) return;

  hintTimer -= delta;
  if (hintTimer <= 0) {
    hintEl.textContent = "";
  }
}

function showHint(text) {
  hintEl.textContent = text;
  hintTimer = 1.3;
}

function endRound(playerWon) {
  if (roundSubmitted) return;

  gameOver = true;
  roundSubmitted = true;
  endingSoon = false;
  messageEl.textContent = "";
  restartEl.hidden = true;
  submitAndShowRoundResult(playerWon);
}

async function submitAndShowRoundResult(playerWon) {
  const result = createRoundResult(playerWon);
  endScreenEl.hidden = false;
  endTitleEl.textContent = playerWon ? "You cleared La Rambla" : "Time is up";
  endStatsEl.innerHTML = formatRoundStats(result);
  endStatusEl.textContent = "Saving score...";

  const submitResult = await saveScore(result);
  endStatusEl.textContent = submitResult.remote ? "Score saved online" : submitResult.message;
  await renderLeaderboard(endLeaderboardEl);
}

function createRoundResult(playerWon) {
  const secondsLeft = Math.ceil(timeLeft);
  const finalScore = Math.max(0, score * 100 + secondsLeft * 10 - localsHit * 50);

  return {
    playerName: currentPlayerName || sanitizePlayerName(playerNameInput.value),
    locationId: LOCATION_ID,
    locationName: LOCATION_NAME,
    score: finalScore,
    guiris: score,
    secondsLeft,
    localsHit,
    playerWon,
    playedAt: new Date().toISOString(),
  };
}

function formatRoundStats(result) {
  return `
    <div class="end-screen__score">${result.score}</div>
    <div>Guiris ${result.guiris}/${ROUND_TARGET_COUNT}</div>
    <div>Time bonus ${result.secondsLeft}s</div>
    <div>Local penalty ${result.localsHit}</div>
  `;
}

function updateHud() {
  scoreEl.textContent = `Score: ${score}/${npcs.length || ROUND_TARGET_COUNT}`;
  goalEl.textContent = `Spray ${npcs.length || ROUND_TARGET_COUNT} guiris`;
  timerEl.textContent = `Time: ${Math.ceil(timeLeft)}`;
  waterEl.textContent = `Water: ${waterAmmo}/${MAX_WATER}`;
  const waterPercent = Math.round((waterAmmo / MAX_WATER) * 100);
  waterEl.style.background = `linear-gradient(90deg, rgba(84, 216, 255, 0.82) ${waterPercent}%, rgba(255, 255, 255, 0.18) ${waterPercent}%)`;
  updateTargetPanel();
  gameEl.dataset.score = String(score);
  gameEl.dataset.timeLeft = String(Math.ceil(timeLeft));
  gameEl.dataset.gameOver = String(gameOver);
  gameEl.dataset.waterAmmo = String(waterAmmo);
  gameEl.dataset.refillProgress = String(refillProgress.toFixed(2));
  gameEl.dataset.cartridgesLeft = String(cartridges.filter((cartridge) => !cartridge.collected).length);
  gameEl.dataset.targetCount = String(npcs.length);
  gameEl.dataset.localCount = String(locals.length);
  gameEl.dataset.roundGoal = roundGoalText;
  gameEl.dataset.gambas = String(roundTargetCounts.gamba ?? 0);
  gameEl.dataset.stagCrews = String(roundTargetCounts.stagCrew ?? 0);
  gameEl.dataset.iHeartTourists = String(roundTargetCounts.slogan ?? 0);
  gameEl.dataset.gambasLeft = String(getTargetsLeft("gamba"));
  gameEl.dataset.stagCrewsLeft = String(getTargetsLeft("stagCrew"));
  gameEl.dataset.iHeartTouristsLeft = String(getTargetsLeft("slogan"));
  gameEl.dataset.pigeonCount = String(pigeons.length);
  gameEl.dataset.pigeonsFlying = String(pigeons.filter((pigeon) => pigeon.flying).length);
}

function updateTargetPanel() {
  if (NPC_PREVIEW_MODE) return;

  targetRows.stagCrew.innerHTML = formatTargetRow("ST", "Stag Crew x3", "stagCrew");
  targetRows.gamba.innerHTML = formatTargetRow("GA", "Gambas", "gamba");
  targetRows.slogan.innerHTML = formatTargetRow("I♥", "MILFS", "slogan");
}

function formatTargetRow(icon, label, type) {
  const left = getTargetsLeft(type);
  const total = roundTargetCounts[type] ?? 0;
  const doneClass = left === 0 && total > 0 ? " target-panel__count--done" : "";
  return `
    <span class="target-panel__icon">${icon}</span>
    <span class="target-panel__label">${label}</span>
    <span class="target-panel__count${doneClass}">${left}/${total}</span>
  `;
}

function getTargetsLeft(type) {
  return Math.max(0, (roundTargetCounts[type] ?? 0) - (soakedTargetCounts[type] ?? 0));
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  if (NPC_PREVIEW_MODE) {
    updateNpcPreview(delta);
  } else if (!gameOver) {
    updatePlayer(delta);
    updateNpcs(delta);
    updateLocals(delta);
    updatePigeons(delta);
    updateSprays(delta);
    updateWaterResources(delta);
    updateRoundEnding(delta);
    updateTimer(delta);
  }

  updateHint(delta);
  if (!NPC_PREVIEW_MODE && player) {
    updateCamera(delta);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updateNpcPreview(delta) {
  previewFigures.forEach((figure) => {
    const t = clock.elapsedTime + figure.phase;
    figure.group.position.y = 0.16 + Math.sin(t * 1.6) * 0.025;
    figure.group.rotation.y = figure.baseRotation + Math.sin(t * 0.7) * 0.08;

    if (figure.type === "unicornSquad" || figure.type === "footballLads") {
      figure.group.rotation.y += Math.sin(t * 2.2) * 0.06;
    }

    if (figure.type === "locals") {
      figure.group.position.x += Math.sin(t * 1.1) * delta * 0.04;
    }
  });
}

function addFruit(parent, x, y, z, color) {
  const fruit = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.1, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true }),
  );
  fruit.position.set(x, y, z);
  fruit.castShadow = true;
  parent.add(fruit);
}

function addBox(parent, position, size, color, opacity = 1) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, position, topRadius, bottomRadius, height, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, 6),
    material,
  );
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCone(parent, position, radius, height, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 7), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeLabel(text, color, background, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.fillStyle = color;
  const lines = String(text).split("\n");
  const fontSize = Math.floor(height * (lines.length > 1 ? 0.24 : 0.42));
  context.font = `bold ${fontSize}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lineHeight = fontSize * 1.15;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, startY + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(material);
}

function darken(color, factor) {
  const c = new THREE.Color(color);
  c.multiplyScalar(factor);
  return c.getHex();
}

function lighten(color, factor) {
  const c = new THREE.Color(color);
  c.multiplyScalar(factor);
  return c.getHex();
}

window.__guiriland = {
  getState: () => ({
    mode: NPC_PREVIEW_MODE ? "npc-preview" : "gameplay",
    score,
    timeLeft,
    gameOver,
    npcCount: npcs.length,
    localCount: locals.length,
    pigeonCount: pigeons.length,
    pigeonsFlying: pigeons.filter((pigeon) => pigeon.flying).length,
    roundTargetCounts,
    roundGoalText,
    previewCount: previewFigures.length,
    player: player ? player.position.toArray() : null,
  }),
};
