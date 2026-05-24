import Phaser from "phaser";
import "./style.css";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const PLAYER_SPEED = 230;
const SPRAY_RANGE = 320;
const SPRAY_LIFETIME = 160;
const ROUND_SECONDS = 45;

class RamblaScene extends Phaser.Scene {
  constructor() {
    super("RamblaScene");
  }

  create() {
    this.score = 0;
    this.timeLeft = ROUND_SECONDS;
    this.gameOver = false;
    this.lastAim = new Phaser.Math.Vector2(1, 0);

    this.createWorld();
    this.createPlayer();
    this.createNpcs();
    this.createHud();
    this.createInput();

    this.roundTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.tickTimer,
      callbackScope: this,
    });
  }

  update() {
    if (this.gameOver) {
      return;
    }

    this.movePlayer();
    this.aimAtPointer();
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#263240");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x263240, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(0x52616b, 1);
    graphics.fillRect(0, 42, GAME_WIDTH, GAME_HEIGHT - 84);

    this.fillFacet(graphics, [
      [122, 42],
      [818, 42],
      [884, GAME_HEIGHT - 42],
      [56, GAME_HEIGHT - 42],
    ], 0xc69a5a);

    this.fillFacet(graphics, [
      [134, 42],
      [804, 42],
      [864, GAME_HEIGHT - 62],
      [82, GAME_HEIGHT - 62],
    ], 0xe6c988);

    this.drawPaving(graphics);

    this.fillFacet(graphics, [
      [0, 42],
      [132, 42],
      [82, GAME_HEIGHT - 62],
      [0, GAME_HEIGHT - 42],
    ], 0x2d6a44);
    this.fillFacet(graphics, [
      [804, 42],
      [960, 42],
      [960, GAME_HEIGHT - 42],
      [864, GAME_HEIGHT - 62],
    ], 0x285d3d);

    this.drawBoqueriaMarket(graphics);
    this.drawStreetDetails(graphics);

    for (let y = 78; y < GAME_HEIGHT - 72; y += 95) {
      this.drawTree(116 - y * 0.06, y);
      this.drawTree(828 + y * 0.08, y + 36);
    }

    graphics.fillStyle(0xb85845, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, 42);
    graphics.fillStyle(0xd1754f, 1);
    graphics.fillRect(0, 32, GAME_WIDTH, 10);
    graphics.fillStyle(0xb85845, 1);
    graphics.fillRect(0, GAME_HEIGHT - 42, GAME_WIDTH, 42);
    graphics.fillStyle(0xd1754f, 1);
    graphics.fillRect(0, GAME_HEIGHT - 42, GAME_WIDTH, 10);
  }

  createPlayer() {
    this.player = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.addPlayerVisual(this.player);
    this.player.setSize(34, 50);

    this.physics.add.existing(this.player);
    this.player.body.setSize(34, 50);
    this.player.body.setOffset(-17, -25);
    this.player.body.setCollideWorldBounds(true);

    this.waterPistol = this.add.container(this.player.x, this.player.y);
    this.waterPistol.add([
      this.add.polygon(14, 0, [0, -5, 27, -4, 34, 0, 27, 5, 0, 4], 0x28c7e8),
      this.add.polygon(17, 4, [0, 0, 12, 0, 8, 17, 1, 15], 0x0f6a7d),
      this.add.polygon(33, 0, [0, -3, 10, -2, 12, 1, 0, 3], 0xd9f7ff),
    ]);
  }

  createNpcs() {
    this.npcs = this.physics.add.group();

    const npcPositions = [
      { x: 175, y: 150, type: "sangria" },
      { x: 290, y: 500, type: "stag" },
      { x: 430, y: 180, type: "sandals" },
      { x: 615, y: 475, type: "sunburn" },
      { x: 760, y: 215, type: "selfie" },
      { x: 820, y: 520, type: "backpack" },
    ];

    this.npcGoal = npcPositions.length;

    npcPositions.forEach((position, index) => {
      const npc = this.add.container(position.x, position.y);
      this.addTouristVisual(npc, position.type, index);
      npc.setSize(34, 52);

      this.physics.add.existing(npc);
      npc.body.setSize(34, 52);
      npc.body.setOffset(-17, -26);
      npc.body.setCollideWorldBounds(true);
      npc.body.setVelocity(
        Phaser.Math.Between(-45, 45),
        Phaser.Math.Between(-45, 45),
      );
      npc.body.setBounce(1, 1);
      npc.isWet = false;
      npc.kind = position.type;

      this.npcs.add(npc);
    });
  }

  createHud() {
    this.scoreText = this.add.text(20, 18, "Score: 0", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#10202b",
      fontStyle: "bold",
    });

    this.timerText = this.add.text(GAME_WIDTH - 20, 18, `Time: ${this.timeLeft}`, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#10202b",
      fontStyle: "bold",
    });
    this.timerText.setOrigin(1, 0);

    this.goalText = this.add.text(GAME_WIDTH / 2, 18, "Spray all tourists", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#10202b",
      fontStyle: "bold",
    });
    this.goalText.setOrigin(0.5, 0);

    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 45, "", {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#10202b",
      fontStyle: "bold",
      align: "center",
    });
    this.messageText.setOrigin(0.5);

    this.restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18, "", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#10202b",
      fontStyle: "bold",
      backgroundColor: "#ffffff",
      padding: { x: 16, y: 10 },
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setInteractive({ useHandCursor: true });
    this.restartText.on("pointerdown", () => this.scene.restart());
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    this.input.keyboard.on("keydown-SPACE", () => this.sprayWater());
    this.input.on("pointerdown", (pointer) => {
      this.aimAtPosition(pointer.worldX, pointer.worldY);
      this.sprayWater();
    });
  }

  movePlayer() {
    const body = this.player.body;
    const direction = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      direction.x -= 1;
    }
    if (this.cursors.right.isDown || this.keys.D.isDown) {
      direction.x += 1;
    }
    if (this.cursors.up.isDown || this.keys.W.isDown) {
      direction.y -= 1;
    }
    if (this.cursors.down.isDown || this.keys.S.isDown) {
      direction.y += 1;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.lastAim.copy(direction);
    }

    body.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
    this.updateAimIndicator();
  }

  aimAtPointer() {
    const pointer = this.input.activePointer;

    if (!pointer.active) {
      return;
    }

    this.aimAtPosition(pointer.worldX, pointer.worldY);
  }

  aimAtPosition(x, y) {
    const aim = new Phaser.Math.Vector2(
      x - this.player.x,
      y - this.player.y,
    );

    if (aim.lengthSq() > 16) {
      this.lastAim.copy(aim.normalize());
      this.updateAimIndicator();
    }
  }

  updateAimIndicator() {
    this.waterPistol.setPosition(
      this.player.x + this.lastAim.x * 14,
      this.player.y + this.lastAim.y * 14,
    );
    this.waterPistol.setRotation(this.lastAim.angle());
  }

  sprayWater() {
    if (this.gameOver) {
      return;
    }

    const startX = this.player.x + this.lastAim.x * 28;
    const startY = this.player.y + this.lastAim.y * 28;
    const endX = startX + this.lastAim.x * SPRAY_RANGE;
    const endY = startY + this.lastAim.y * SPRAY_RANGE;
    const sprayLine = new Phaser.Geom.Line(startX, startY, endX, endY);
    const spray = this.add.graphics();

    spray.lineStyle(14, 0x87dfff, 0.22);
    spray.lineBetween(startX, startY, endX, endY);
    spray.lineStyle(7, 0x45b6fe, 0.62);
    spray.lineBetween(startX, startY, endX, endY);

    for (let i = 0; i < 5; i += 1) {
      const t = 0.2 + i * 0.14;
      spray.fillStyle(0xd7f8ff, 0.65);
      spray.fillCircle(
        Phaser.Math.Linear(startX, endX, t),
        Phaser.Math.Linear(startY, endY, t),
        Phaser.Math.Between(2, 5),
      );
    }

    this.tweens.add({
      targets: spray,
      alpha: 0,
      duration: SPRAY_LIFETIME,
      onComplete: () => spray.destroy(),
    });

    for (const npc of this.npcs.getChildren()) {
      const npcBounds = new Phaser.Geom.Rectangle(
        npc.body.x,
        npc.body.y,
        npc.body.width,
        npc.body.height,
      );

      if (!npc.isWet && Phaser.Geom.Intersects.LineToRectangle(sprayLine, npcBounds)) {
        this.hitNpc(npc);
        break;
      }
    }
  }

  hitNpc(npc) {
    if (npc.isWet) {
      return;
    }

    npc.isWet = true;
    npc.body.stop();

    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);

    this.tweens.add({
      targets: npc,
      alpha: 0,
      scale: 0.75,
      duration: 220,
      onComplete: () => npc.destroy(),
    });

    if (this.score >= this.npcGoal) {
      this.endRound(true);
    }
  }

  tickTimer() {
    if (this.gameOver) {
      return;
    }

    this.timeLeft -= 1;
    this.timerText.setText(`Time: ${this.timeLeft}`);

    if (this.timeLeft <= 0) {
      this.endRound(false);
    }
  }

  endRound(playerWon) {
    this.gameOver = true;
    this.roundTimer.remove();
    this.player.body.stop();
    this.npcs.children.each((npc) => npc.body?.stop());

    this.messageText.setText(playerWon ? "You win!" : "Time is up");
    this.restartText.setText("Restart");
  }

  fillFacet(graphics, points, color, alpha = 1) {
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i += 1) {
      graphics.lineTo(points[i][0], points[i][1]);
    }

    graphics.closePath();
    graphics.fillPath();
  }

  drawPaving(graphics) {
    const topY = 42;
    const bottomY = GAME_HEIGHT - 62;
    const leftTop = 134;
    const rightTop = 804;
    const leftBottom = 82;
    const rightBottom = 864;
    const rows = 8;
    const columns = 9;

    for (let row = 0; row < rows; row += 1) {
      const y1 = Phaser.Math.Linear(topY, bottomY, row / rows);
      const y2 = Phaser.Math.Linear(topY, bottomY, (row + 1) / rows);
      const left1 = Phaser.Math.Linear(leftTop, leftBottom, row / rows);
      const left2 = Phaser.Math.Linear(leftTop, leftBottom, (row + 1) / rows);
      const right1 = Phaser.Math.Linear(rightTop, rightBottom, row / rows);
      const right2 = Phaser.Math.Linear(rightTop, rightBottom, (row + 1) / rows);

      for (let column = 0; column < columns; column += 1) {
        const x1 = Phaser.Math.Linear(left1, right1, column / columns);
        const x2 = Phaser.Math.Linear(left1, right1, (column + 1) / columns);
        const x3 = Phaser.Math.Linear(left2, right2, (column + 1) / columns);
        const x4 = Phaser.Math.Linear(left2, right2, column / columns);
        const shade = (row + column) % 2 === 0 ? 0xe9cf91 : 0xddc282;

        this.fillFacet(graphics, [[x1, y1], [x2, y1], [x3, y2], [x4, y2]], shade);
      }
    }

    graphics.lineStyle(2, 0xb39158, 0.7);
    for (let row = 0; row <= rows; row += 1) {
      const t = row / rows;
      graphics.lineBetween(
        Phaser.Math.Linear(leftTop, leftBottom, t),
        Phaser.Math.Linear(topY, bottomY, t),
        Phaser.Math.Linear(rightTop, rightBottom, t),
        Phaser.Math.Linear(topY, bottomY, t),
      );
    }

    for (let column = 0; column <= columns; column += 1) {
      const t = column / columns;
      graphics.lineBetween(
        Phaser.Math.Linear(leftTop, rightTop, t),
        topY,
        Phaser.Math.Linear(leftBottom, rightBottom, t),
        bottomY,
      );
    }
  }

  addPlayerVisual(container) {
    container.add([
      this.add.ellipse(4, 28, 46, 16, 0x000000, 0.2),
      this.add.polygon(-8, 21, [-6, -4, 3, -6, 8, 15, -2, 17], 0x203c69),
      this.add.polygon(9, 21, [-3, -6, 7, -4, 3, 17, -7, 15], 0x2e5a95),
      this.add.polygon(0, 3, [-17, -17, 15, -20, 20, 13, 3, 25, -17, 15], 0xf7f4e9),
      this.add.polygon(10, 2, [0, -18, 10, -13, 8, 13, -5, 22], 0xe8dfcd),
      this.add.polygon(-19, 6, [-3, -13, 5, -11, 6, 14, -4, 17], 0xffc58e),
      this.add.polygon(20, 5, [-5, -12, 4, -10, 3, 14, -7, 16], 0xffc58e),
      this.add.ellipse(0, -18, 26, 29, 0xffd4a3),
      this.add.polygon(-2, -30, [-13, 0, -2, -11, 14, -5, 13, 3, -8, 5], 0x1e5eae),
      this.add.polygon(8, -23, [-2, -2, 11, -1, 7, 6, -4, 5], 0x163c7d),
    ]);
  }

  drawBoqueriaMarket(graphics) {
    this.fillFacet(graphics, [[0, 126], [124, 112], [146, 360], [0, 386]], 0x742a28);
    this.fillFacet(graphics, [[0, 112], [134, 96], [124, 112], [0, 126]], 0xa94638);
    this.fillFacet(graphics, [[0, 386], [146, 360], [136, 382], [0, 410]], 0x51211f);

    this.fillFacet(graphics, [[16, 136], [116, 128], [122, 161], [16, 169]], 0x254a3a);

    this.add.text(27, 138, "BOQUERIA", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f7e8bd",
      fontStyle: "bold",
    });

    const stripeColors = [0xd6342f, 0xf7e8bd];
    for (let i = 0; i < 7; i += 1) {
      const x = i * 22;
      this.fillFacet(graphics, [
        [x, 182],
        [x + 24, 179],
        [x + 23, 218],
        [x - 1, 222],
      ], stripeColors[i % 2]);
    }

    this.fillFacet(graphics, [[26, 230], [112, 222], [105, 334], [24, 350]], 0x3c2220);
    this.fillFacet(graphics, [[35, 245], [103, 238], [98, 282], [32, 293]], 0x5b3327);
    graphics.fillStyle(0xf49b39, 1);
    graphics.fillCircle(45, 261, 10);
    graphics.fillCircle(70, 270, 11);
    graphics.fillCircle(95, 257, 9);
    graphics.fillStyle(0xa3c85a, 1);
    graphics.fillCircle(58, 282, 7);
    graphics.fillCircle(84, 286, 8);
  }

  drawStreetDetails(graphics) {
    this.fillFacet(graphics, [[690, 100], [772, 103], [760, 123], [682, 120]], 0x7a4e31);
    this.fillFacet(graphics, [[700, 120], [708, 120], [705, 145], [697, 145]], 0x4f321f);
    this.fillFacet(graphics, [[756, 123], [765, 123], [766, 147], [757, 147]], 0x4f321f);

    this.fillFacet(graphics, [[266, 286], [304, 287], [300, 330], [260, 328]], 0x1d2934);
    this.fillFacet(graphics, [[271, 292], [299, 292], [298, 304], [270, 304]], 0x6cbf84);
    this.fillFacet(graphics, [[260, 328], [300, 330], [292, 342], [252, 339]], 0x111827);

    this.fillFacet(graphics, [[870, 320], [908, 318], [904, 363], [866, 366]], 0x36454f);
    this.fillFacet(graphics, [[875, 326], [903, 325], [902, 338], [874, 339]], 0x96d2e0);
    this.fillFacet(graphics, [[866, 366], [904, 363], [896, 376], [858, 378]], 0x202a32);
  }

  drawTree(x, y) {
    this.add.ellipse(x + 7, y + 27, 62, 22, 0x000000, 0.18);
    this.add.polygon(x, y + 22, [-6, -4, 6, -5, 9, 27, -8, 29], 0x815430);
    this.add.polygon(x - 8, y, [-24, 6, -4, -18, 18, -10, 14, 13, -10, 21], 0x3f8e55);
    this.add.polygon(x + 13, y + 3, [-18, 0, 2, -21, 23, -6, 18, 18, -8, 19], 0x2f7248);
    this.add.polygon(x + 1, y - 11, [-16, 4, 0, -19, 20, 0, 8, 20, -18, 16], 0x4c9b5e);
    this.add.polygon(x - 2, y + 8, [-28, 1, -2, -14, 26, 0, 17, 24, -19, 24], 0x347b4a);
  }

  addTouristVisual(npc, type, index) {
    const shirtColors = {
      sangria: 0xffd166,
      stag: 0x39a96b,
      sandals: 0x72ddf7,
      sunburn: 0xff6b6b,
      selfie: 0xf2b5d4,
      backpack: 0xff9f1c,
    };
    const skinColor = type === "sunburn" ? 0xff6f5e : 0xffd6a5;
    const shirtColor = shirtColors[type] ?? (index % 2 === 0 ? 0xffd166 : 0xff7f50);

    npc.add([
      this.add.ellipse(3, 29, 42, 14, 0x000000, 0.18),
      this.add.polygon(-7, 24, [-6, -5, 3, -6, 7, 14, -3, 16], 0x3c4650),
      this.add.polygon(8, 24, [-4, -6, 5, -5, 3, 16, -7, 14], 0x4d5964),
      this.add.polygon(0, 8, [-16, -15, 13, -17, 18, 11, 1, 23, -15, 14], shirtColor),
      this.add.polygon(9, 7, [0, -14, 9, -10, 8, 10, -4, 19], Phaser.Display.Color.ValueToColor(shirtColor).darken(18).color),
      this.add.ellipse(0, -16, 23, 25, skinColor),
      this.add.polygon(-2, -28, [-11, 1, -1, -8, 13, -3, 12, 4, -7, 5], 0x8a5a3b),
    ]);

    if (type === "sangria") {
      npc.add([
        this.add.polygon(20, 10, [-7, -13, 7, -12, 8, 14, -5, 18], 0xf28e2b, 0.82),
        this.add.ellipse(21, -5, 11, 7, 0xf7f0d0, 0.9),
        this.add.circle(17, 2, 3, 0xd6342f),
      ]);
    }

    if (type === "stag") {
      npc.add(this.add.polygon(0, -35, [-8, 0, 0, -14, 8, 0], 0xffd166));
      npc.add(this.add.text(-13, 2, "STAG", {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#ffffff",
        fontStyle: "bold",
      }));
    }

    if (type === "sandals") {
      npc.add([
        this.add.ellipse(-6, 34, 12, 6, 0xffffff),
        this.add.ellipse(8, 34, 12, 6, 0xffffff),
        this.add.ellipse(-6, 39, 13, 5, 0x8b5a2b),
        this.add.ellipse(8, 39, 13, 5, 0x8b5a2b),
      ]);
    }

    if (type === "sunburn") {
      npc.add([
        this.add.polygon(-14, 3, [-3, -10, 5, -9, 6, 13, -4, 15], 0xff6f5e),
        this.add.polygon(15, 3, [-5, -9, 3, -10, 4, 15, -6, 13], 0xff6f5e),
      ]);
    }

    if (type === "selfie") {
      const stick = this.add.line(0, 0, 10, -18, 32, -40, 0x2b2d42, 1);
      stick.setLineWidth(3);
      npc.add([
        stick,
        this.add.polygon(34, -42, [-7, -5, 7, -4, 6, 5, -7, 4], 0x121826),
      ]);
    }

    if (type === "backpack") {
      npc.add([
        this.add.polygon(-16, 7, [-7, -15, 5, -12, 7, 14, -8, 17], 0x7057a3),
        this.add.polygon(-20, -3, [-4, -9, 4, -7, 5, 9, -5, 10], 0x4a3a73),
      ]);
    }

    npc.add(this.add.polygon(14, -8, [-6, -4, 6, -3, 7, 4, -6, 4], 0x2b2d42));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#6ec6d9",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: RamblaScene,
};

new Phaser.Game(config);
