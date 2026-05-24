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
    this.cameras.main.setBackgroundColor("#485967");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x485967, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(0x65737a, 1);
    graphics.fillRect(0, 42, GAME_WIDTH, GAME_HEIGHT - 84);

    graphics.fillStyle(0xe4ca8c, 1);
    graphics.beginPath();
    graphics.moveTo(135, 42);
    graphics.lineTo(805, 42);
    graphics.lineTo(865, GAME_HEIGHT - 42);
    graphics.lineTo(75, GAME_HEIGHT - 42);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(3, 0xc19f5f, 1);
    for (let x = 140; x < 820; x += 72) {
      graphics.lineBetween(x, 42, x - 58, GAME_HEIGHT - 42);
    }
    for (let y = 110; y < GAME_HEIGHT - 70; y += 86) {
      graphics.lineBetween(120, y, 840, y + 12);
    }

    graphics.fillStyle(0x2f693f, 1);
    graphics.fillRect(0, 42, 140, GAME_HEIGHT - 84);
    graphics.fillRect(820, 42, 140, GAME_HEIGHT - 84);

    this.drawBoqueriaMarket(graphics);
    this.drawStreetDetails(graphics);

    for (let y = 78; y < GAME_HEIGHT - 72; y += 95) {
      this.drawTree(122 - y * 0.08, y);
      this.drawTree(820 + y * 0.08, y + 36);
    }

    graphics.fillStyle(0xbe5a43, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, 42);
    graphics.fillRect(0, GAME_HEIGHT - 42, GAME_WIDTH, 42);
  }

  createPlayer() {
    this.player = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.player.add([
      this.add.ellipse(0, 24, 34, 14, 0x000000, 0.18),
      this.add.rectangle(-7, 22, 8, 18, 0x2e4b7e),
      this.add.rectangle(8, 22, 8, 18, 0x2e4b7e),
      this.add.rectangle(0, 4, 28, 34, 0xffffff),
      this.add.rectangle(-18, 6, 8, 22, 0xffcf9f),
      this.add.rectangle(17, 5, 8, 22, 0xffcf9f),
      this.add.circle(0, -18, 15, 0x2060b8),
      this.add.circle(0, -14, 10, 0xffd4a3),
    ]);
    this.player.setSize(34, 50);

    this.physics.add.existing(this.player);
    this.player.body.setSize(34, 50);
    this.player.body.setOffset(-17, -25);
    this.player.body.setCollideWorldBounds(true);

    this.waterPistol = this.add.container(this.player.x, this.player.y);
    this.waterPistol.add([
      this.add.rectangle(14, 0, 28, 7, 0x19a7ce),
      this.add.rectangle(4, 7, 9, 16, 0x0f5f75),
      this.add.rectangle(29, 0, 8, 4, 0xd9f7ff),
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

  drawBoqueriaMarket(graphics) {
    graphics.fillStyle(0x8f2e2a, 1);
    graphics.fillRect(0, 120, 142, 235);

    graphics.fillStyle(0x254a3a, 1);
    graphics.fillRect(18, 132, 106, 30);

    this.add.text(31, 137, "BOQUERIA", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f7e8bd",
      fontStyle: "bold",
    });

    const stripeColors = [0xd6342f, 0xf7e8bd];
    for (let x = 0; x < 142; x += 24) {
      graphics.fillStyle(stripeColors[(x / 24) % 2], 1);
      graphics.fillRect(x, 174, 24, 34);
    }

    graphics.fillStyle(0x3c2220, 1);
    graphics.fillRect(25, 210, 90, 122);
    graphics.fillStyle(0xf49b39, 1);
    graphics.fillCircle(44, 240, 10);
    graphics.fillCircle(70, 250, 11);
    graphics.fillCircle(96, 238, 9);
  }

  drawStreetDetails(graphics) {
    graphics.fillStyle(0x7a4e31, 1);
    graphics.fillRect(700, 104, 70, 18);
    graphics.fillRect(695, 122, 8, 20);
    graphics.fillRect(765, 122, 8, 20);

    graphics.fillStyle(0x1d2934, 1);
    graphics.fillRect(268, 286, 34, 44);
    graphics.fillStyle(0x6cbf84, 1);
    graphics.fillRect(272, 292, 26, 10);

    graphics.fillStyle(0x36454f, 1);
    graphics.fillRect(872, 320, 34, 45);
    graphics.fillStyle(0x96d2e0, 1);
    graphics.fillRect(876, 326, 26, 11);
  }

  drawTree(x, y) {
    this.add.ellipse(x + 6, y + 18, 48, 18, 0x000000, 0.15);
    this.add.rectangle(x, y + 15, 9, 28, 0x815430);
    this.add.circle(x, y, 24, 0x2f7a48);
    this.add.circle(x - 14, y + 7, 17, 0x3e8a54);
    this.add.circle(x + 15, y + 6, 18, 0x27653f);
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
      this.add.ellipse(0, 27, 36, 12, 0x000000, 0.16),
      this.add.rectangle(-6, 25, 7, 16, 0x36454f),
      this.add.rectangle(7, 25, 7, 16, 0x36454f),
      this.add.rectangle(0, 8, 28, 34, shirtColor),
      this.add.circle(0, -16, 12, skinColor),
    ]);

    if (type === "sangria") {
      npc.add([
        this.add.rectangle(19, 12, 12, 26, 0xf28e2b, 0.82),
        this.add.rectangle(19, -4, 8, 10, 0xf7f0d0, 0.9),
      ]);
    }

    if (type === "stag") {
      npc.add(this.add.text(-13, 2, "STAG", {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#ffffff",
        fontStyle: "bold",
      }));
    }

    if (type === "sandals") {
      npc.add([
        this.add.rectangle(-6, 34, 10, 5, 0xffffff),
        this.add.rectangle(8, 34, 10, 5, 0xffffff),
        this.add.rectangle(-6, 38, 12, 4, 0x8b5a2b),
        this.add.rectangle(8, 38, 12, 4, 0x8b5a2b),
      ]);
    }

    if (type === "selfie") {
      const stick = this.add.line(0, 0, 10, -18, 32, -40, 0x2b2d42, 1);
      stick.setLineWidth(3);
      npc.add([
        stick,
        this.add.rectangle(34, -42, 13, 9, 0x121826),
      ]);
    }

    if (type === "backpack") {
      npc.add([
        this.add.rectangle(-16, 7, 11, 28, 0x7057a3),
        this.add.rectangle(-18, -3, 7, 18, 0x4a3a73),
      ]);
    }

    npc.add(this.add.rectangle(14, -8, 11, 7, 0x2b2d42));
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
