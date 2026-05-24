import * as THREE from "three";
import "./style.css";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const WORLD_WIDTH = 13;
const WORLD_DEPTH = 7.4;
const PLAYER_SPEED = 4.1;
const SPRAY_RANGE = 4.7;
const SPRAY_LIFETIME = 0.22;
const ROUND_SECONDS = 45;

const gameEl = document.querySelector("#game");
const hudEl = document.createElement("div");
const scoreEl = document.createElement("div");
const goalEl = document.createElement("div");
const timerEl = document.createElement("div");
const messageEl = document.createElement("div");
const restartEl = document.createElement("button");

hudEl.className = "hud";
scoreEl.className = "hud__item";
goalEl.className = "hud__item hud__goal";
timerEl.className = "hud__item";
messageEl.className = "message";
restartEl.className = "restart-button";
restartEl.textContent = "Restart";
restartEl.hidden = true;

hudEl.append(scoreEl, goalEl, timerEl);
gameEl.append(hudEl, messageEl, restartEl);
fitGameToViewport();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202936);

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
let npcs = [];
let sprays = [];
let score = 0;
let timeLeft = ROUND_SECONDS;
let gameOver = false;

createLights();
createWorld();
startRound();
animate();

restartEl.addEventListener("click", startRound);
window.addEventListener("resize", fitGameToViewport);
window.visualViewport?.addEventListener("resize", fitGameToViewport);
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());

  if (event.code === "Space") {
    event.preventDefault();
    sprayWater();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
renderer.domElement.addEventListener("pointermove", aimAtPointer);
renderer.domElement.addEventListener("pointerdown", (event) => {
  aimAtPointer(event);
  sprayWater();
});

function createLights() {
  const ambient = new THREE.HemisphereLight(0xf8efe0, 0x43505c, 2.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 2.9);
  sun.position.set(-4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);
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

  addBox(base, [0, -0.12, 0], [16, 0.22, 10], 0x263240);
  addBox(base, [-6.4, 0, 0], [1.7, 0.18, WORLD_DEPTH], 0x315f43);
  addBox(base, [6.4, 0, 0], [1.7, 0.18, WORLD_DEPTH], 0x2b543c);
  addBox(base, [0, 0.03, 0], [WORLD_WIDTH, 0.16, WORLD_DEPTH], 0xdabf82);
  addPaving(base);
  addMediterraneanFacades(base);
  addGothicSideAlleys(base);
  addBoqueria(base);
  addTerraces(base);
  addFlowerStands(base);
  addStreetProps(base);
  addBenches(base);
  addAmbientCrowd(base);
  addPolicePatrols(base);
  addPigeons(base);

  for (let z = -2.65; z <= 3.05; z += 1.16) {
    addTree(base, -5.72, z + 0.12);
    addTree(base, 5.75, z - 0.28);
  }

  addPalmTree(base, -4.92, -3.05);
  addPalmTree(base, 4.98, 2.92);

  addBox(base, [0, 0.08, -4.03], [16, 0.24, 0.55], 0xb85845);
  addBox(base, [0, 0.21, -3.83], [16, 0.05, 0.12], 0xd1754f);
  addBox(base, [0, 0.08, 4.03], [16, 0.24, 0.55], 0xb85845);
  addBox(base, [0, 0.21, 3.83], [16, 0.05, 0.12], 0xd1754f);
}

function addMediterraneanFacades(parent) {
  const facades = [
    { x: -4.8, z: -4.52, w: 1.4, h: 1.35, color: 0xd99b6d, sign: "TAPAS" },
    { x: -3.3, z: -4.52, w: 1.25, h: 1.6, color: 0xf0c789, sign: "CAFÈ" },
    { x: -1.95, z: -4.52, w: 1.25, h: 1.28, color: 0xc76f55, sign: "HOSTAL" },
    { x: 0.2, z: -4.52, w: 1.9, h: 1.7, color: 0xe3b37a, sign: "RAMBLA" },
    { x: 2.35, z: -4.52, w: 1.45, h: 1.42, color: 0xd88a63, sign: "GELAT" },
    { x: 4.05, z: -4.52, w: 1.55, h: 1.65, color: 0xf1cc8f, sign: "SANGRIA" },
    { x: -4.2, z: 4.52, w: 1.75, h: 1.55, color: 0xe7bf83, sign: "BAR" },
    { x: -1.95, z: 4.52, w: 1.65, h: 1.38, color: 0xc96d57, sign: "FLORS" },
    { x: 0.4, z: 4.52, w: 1.75, h: 1.72, color: 0xf0d19b, sign: "PENSIÓ" },
    { x: 2.65, z: 4.52, w: 1.55, h: 1.45, color: 0xdf9c6e, sign: "TAPES" },
    { x: 4.55, z: 4.52, w: 1.3, h: 1.35, color: 0xd0a16f, sign: "SOL" },
  ];

  facades.forEach((facade) => {
    addFacade(parent, facade);
  });
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
    [-6.08, -2.85],
    [-6.08, 1.95],
    [6.08, -1.35],
    [6.08, 2.5],
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
    color: 0xb08f59,
    roughness: 0.9,
    metalness: 0,
  });

  for (let x = -5.8; x <= 5.8; x += 1.2) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, WORLD_DEPTH), lineMaterial);
    line.position.set(x, 0.14, 0);
    parent.add(line);
  }

  for (let z = -3.1; z <= 3.15; z += 0.82) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(WORLD_WIDTH, 0.025, 0.025), lineMaterial);
    line.position.set(0, 0.145, z);
    parent.add(line);
  }

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const tile = addBox(
        parent,
        [-5.4 + col * 1.2, 0.12, -2.85 + row * 0.82],
        [1.16, 0.02, 0.78],
        (row + col) % 2 === 0 ? 0xe6ce91 : 0xd8bd7c,
      );
      tile.receiveShadow = true;
    }
  }
}

function addBoqueria(parent) {
  addBox(parent, [-6.65, 0.42, -1.3], [1.3, 0.84, 2.7], 0x742a28);
  addBox(parent, [-6.0, 1.12, -1.3], [0.18, 0.18, 2.9], 0xa94638);
  addBox(parent, [-5.95, 1.18, -2.45], [0.12, 0.42, 1.1], 0x254a3a);

  const sign = makeLabel("BOQUERIA", "#f7e8bd", "#254a3a", 256, 72);
  sign.position.set(-5.55, 1.58, -2.78);
  sign.scale.set(0.012, 0.012, 0.012);
  parent.add(sign);

  for (let i = 0; i < 6; i += 1) {
    const color = i % 2 === 0 ? 0xd6342f : 0xf7e8bd;
    addBox(parent, [-5.82, 0.86, -1.92 + i * 0.22], [0.1, 0.16, 0.2], color);
  }

  addBox(parent, [-5.9, 0.34, -0.6], [0.45, 0.22, 1.05], 0x3c2220);
  addFruit(parent, -5.65, 0.56, -0.92, 0xf49b39);
  addFruit(parent, -5.65, 0.58, -0.58, 0xf5b14c);
  addFruit(parent, -5.65, 0.58, -0.25, 0xa3c85a);
}

function addTerraces(parent) {
  const terraces = [
    { x: -4.35, z: -2.15, color: 0xffd166 },
    { x: -4.15, z: 1.55, color: 0xf4a261 },
    { x: 4.55, z: -2.15, color: 0xf7d488 },
    { x: 4.25, z: 1.85, color: 0xffc857 },
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
    [-5.05, 0.72],
    [5.12, -0.68],
  ].forEach(([x, z]) => {
    addBox(parent, [x, 0.25, z], [0.72, 0.34, 0.42], 0x5b3327);
    addBox(parent, [x, 0.5, z], [0.78, 0.12, 0.48], 0x7a4e31);

    const flowerColors = [0xe63946, 0xffafcc, 0xffd166, 0x8ecae6, 0xb7e4c7];
    flowerColors.forEach((color, index) => {
      const fx = x - 0.26 + index * 0.13;
      addCylinder(parent, [fx, 0.72, z], 0.045, 0.025, 0.18, 0x2f7a48);
      addFruit(parent, fx, 0.85, z + (index % 2 === 0 ? 0.12 : -0.08), color);
    });
  });
}

function addStreetProps(parent) {
  addBox(parent, [4.0, 0.34, -2.45], [1.1, 0.16, 0.38], 0x7a4e31);
  addBox(parent, [3.55, 0.15, -2.32], [0.11, 0.38, 0.11], 0x4f321f);
  addBox(parent, [4.45, 0.15, -2.32], [0.11, 0.38, 0.11], 0x4f321f);

  addBox(parent, [-2.6, 0.28, 0.2], [0.42, 0.56, 0.36], 0x1d2934);
  addBox(parent, [-2.6, 0.6, 0.03], [0.34, 0.08, 0.04], 0x6cbf84);

  addBox(parent, [6.0, 0.32, 0.5], [0.38, 0.64, 0.38], 0x36454f);
  addBox(parent, [6.0, 0.68, 0.31], [0.3, 0.1, 0.04], 0x96d2e0);
}

function addBenches(parent) {
  [
    [-2.4, -3.0, 0],
    [1.25, -3.0, 0],
    [-0.95, 3.02, Math.PI],
    [3.1, 3.02, Math.PI],
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

function addAmbientCrowd(parent) {
  const people = [
    [-5.15, -2.3, 0xffd166, 0x486073],
    [-4.85, 2.35, 0x8ecae6, 0x34495e],
    [-3.85, -3.08, 0xf2b5d4, 0x34495e],
    [3.82, 2.95, 0xffafcc, 0x465166],
    [4.95, -2.75, 0xa7c957, 0x3e4c59],
    [5.2, 1.7, 0xf4a261, 0x3e4c59],
  ];

  people.forEach(([x, z, shirt, shorts], index) => {
    const person = createPerson({
      shirt,
      shorts,
      skin: index === 4 ? 0xff6f5e : 0xffd6a5,
      hair: index % 2 === 0 ? 0x6b4a2f : 0x8a5a3b,
      scale: 0.66,
    });
    person.position.set(x, 0.02, z);
    person.rotation.y = index % 2 === 0 ? -0.4 : 0.7;
    parent.add(person);
  });
}

function addPolicePatrols(parent) {
  [
    [-4.15, -3.22, 0.2],
    [4.68, 3.05, -0.5],
  ].forEach(([x, z, rotation]) => {
    const officer = createPerson({
      shirt: 0x234b6d,
      shorts: 0x1c2e42,
      skin: 0xffd6a5,
      hair: 0x1c2e42,
      scale: 0.68,
    });
    officer.position.set(x, 0.02, z);
    officer.rotation.y = rotation;
    addBox(officer, [0, 1.36, -0.02], [0.34, 0.08, 0.22], 0x1c2e42);
    addBox(officer, [0.28, 0.78, 0], [0.09, 0.3, 0.06], 0xf1c40f);
    parent.add(officer);
  });
}

function addPigeons(parent) {
  [
    [-1.9, 1.15],
    [-1.55, 1.34],
    [2.95, -0.95],
    [3.25, -0.76],
    [0.65, -2.85],
  ].forEach(([x, z], index) => {
    const pigeon = new THREE.Group();
    addCylinder(pigeon, [0, 0.11, 0], 0.06, 0.09, 0.18, 0x87919a);
    addFruit(pigeon, 0.08, 0.18, -0.03, 0x5f6972);
    addCone(pigeon, [0.16, 0.18, -0.04], 0.035, 0.08, 0xd99b6d);
    addBox(pigeon, [-0.08, 0.1, 0.05], [0.14, 0.025, 0.08], 0x5f6972);
    pigeon.position.set(x, 0.03, z);
    pigeon.rotation.y = index * 0.85;
    parent.add(pigeon);
  });
}

function startRound() {
  if (dynamicGroup) {
    scene.remove(dynamicGroup);
  }

  dynamicGroup = new THREE.Group();
  scene.add(dynamicGroup);

  score = 0;
  timeLeft = ROUND_SECONDS;
  gameOver = false;
  sprays = [];
  npcs = [];
  lastAim = new THREE.Vector3(0, 0, -1);

  player = createPerson({
    shirt: 0xf7f4e9,
    shorts: 0x2e5a95,
    skin: 0xffd4a3,
    hair: 0x1e5eae,
    scale: 1.05,
  });
  player.position.set(0, 0.02, 0);
  dynamicGroup.add(player);

  waterPistol = createWaterPistol();
  dynamicGroup.add(waterPistol);

  [
    { x: -4.55, z: -2.45, type: "sangria" },
    { x: -3.25, z: 2.55, type: "stag" },
    { x: -1.35, z: -2.25, type: "sandals" },
    { x: 2.05, z: 2.45, type: "sunburn" },
    { x: 3.35, z: -2.2, type: "selfie" },
    { x: 3.05, z: 0.65, type: "backpack" },
  ].forEach((npcData) => {
    const npc = createTourist(npcData.type);
    npc.group.position.set(npcData.x, 0.02, npcData.z);
    npc.velocity.set(Math.random() * 0.7 - 0.35, 0, Math.random() * 0.7 - 0.35);
    dynamicGroup.add(npc.group);
    npcs.push(npc);
  });

  messageEl.textContent = "";
  restartEl.hidden = true;
  updateHud();
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
  const group = createPerson(styles[type]);

  if (type === "sangria") {
    addBox(group, [0.36, 0.72, 0.02], [0.18, 0.52, 0.18], 0xf28e2b, 0.78);
    addCylinder(group, [0.36, 1.02, 0.02], 0.1, 0.1, 0.08, 0xf7f0d0);
  }

  if (type === "stag") {
    const label = makeLabel("STAG", "#ffffff", "#39a96b", 128, 64);
    label.position.set(0, 0.75, -0.28);
    label.rotation.x = -0.28;
    label.scale.set(0.006, 0.006, 0.006);
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
  };
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

  addCylinder(group, [-0.13, 0.22, 0], 0.07, 0.09, 0.42, options.shorts);
  addCylinder(group, [0.13, 0.22, 0], 0.07, 0.09, 0.42, options.shorts);

  const torso = addCylinder(group, [0, 0.66, 0], 0.24, 0.34, 0.66, options.shirt);
  torso.rotation.z = -0.06;

  const sideShade = addCylinder(group, [0.1, 0.66, 0.03], 0.18, 0.24, 0.64, darken(options.shirt, 0.82));
  sideShade.scale.x = 0.5;

  const leftArm = addCylinder(group, [-0.35, 0.68, 0], 0.045, 0.055, 0.52, options.skin);
  leftArm.rotation.z = -0.18;

  const rightArm = addCylinder(group, [0.36, 0.68, 0], 0.045, 0.055, 0.52, options.skin);
  rightArm.rotation.z = 0.18;

  const head = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.23, 0),
    new THREE.MeshStandardMaterial({ color: options.skin, roughness: 0.8, flatShading: true }),
  );
  head.position.set(0, 1.16, -0.02);
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

function createWaterPistol() {
  const group = new THREE.Group();
  addBox(group, [0.3, 0.78, 0], [0.55, 0.12, 0.13], 0x28c7e8);
  addBox(group, [0.07, 0.58, 0], [0.13, 0.34, 0.13], 0x0f6a7d);
  addBox(group, [0.62, 0.79, 0], [0.17, 0.06, 0.07], 0xd9f7ff);
  return group;
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
    player.position.x = THREE.MathUtils.clamp(player.position.x, -5.5, 5.5);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -3.1, 3.1);
  }

  player.rotation.y = Math.atan2(lastAim.x, lastAim.z);
  waterPistol.position.copy(player.position);
  waterPistol.position.addScaledVector(lastAim, 0.34);
  waterPistol.rotation.y = Math.atan2(lastAim.x, lastAim.z) - Math.PI / 2;
}

function updateNpcs(delta) {
  npcs.forEach((npc) => {
    if (npc.wet) return;

    npc.group.position.addScaledVector(npc.velocity, delta);

    if (npc.group.position.x < -5.25 || npc.group.position.x > 5.25) {
      npc.velocity.x *= -1;
    }
    if (npc.group.position.z < -3.0 || npc.group.position.z > 3.0) {
      npc.velocity.z *= -1;
    }

    npc.group.position.x = THREE.MathUtils.clamp(npc.group.position.x, -5.35, 5.35);
    npc.group.position.z = THREE.MathUtils.clamp(npc.group.position.z, -3.1, 3.1);

    if (npc.velocity.lengthSq() > 0.01) {
      npc.group.rotation.y = Math.atan2(npc.velocity.x, npc.velocity.z);
    }
  });
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
    if (distance < 0.7) {
      soakNpc(npc);
      break;
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

function soakNpc(npc) {
  npc.wet = true;
  npc.group.visible = false;
  score += 1;
  updateHud();

  if (score >= npcs.length) {
    endRound(true);
  }
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

function updateTimer(delta) {
  if (gameOver) return;

  timeLeft -= delta;
  if (timeLeft <= 0) {
    timeLeft = 0;
    endRound(false);
  }

  updateHud();
}

function endRound(playerWon) {
  gameOver = true;
  messageEl.textContent = playerWon ? "You win!" : "Time is up";
  restartEl.hidden = false;
}

function updateHud() {
  scoreEl.textContent = `Score: ${score}`;
  goalEl.textContent = "Spray all tourists";
  timerEl.textContent = `Time: ${Math.ceil(timeLeft)}`;
  gameEl.dataset.score = String(score);
  gameEl.dataset.timeLeft = String(Math.ceil(timeLeft));
  gameEl.dataset.gameOver = String(gameOver);
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  if (!gameOver) {
    updatePlayer(delta);
    updateNpcs(delta);
    updateSprays(delta);
    updateTimer(delta);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
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
  context.font = `bold ${Math.floor(height * 0.42)}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(material);
}

function darken(color, factor) {
  const c = new THREE.Color(color);
  c.multiplyScalar(factor);
  return c.getHex();
}

window.__guiriland = {
  getState: () => ({
    score,
    timeLeft,
    gameOver,
    npcCount: npcs.length,
    player: player.position.toArray(),
  }),
};
