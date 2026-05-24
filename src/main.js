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
    this.cameras.main.setBackgroundColor("#6ec6d9");

    const graphics = this.add.graphics();
    graphics.fillStyle(0xf2d38b, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(0xd4553f, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, 42);
    graphics.fillRect(0, GAME_HEIGHT - 42, GAME_WIDTH, 42);

    graphics.fillStyle(0x4f8b52, 1);
    for (let x = 110; x < GAME_WIDTH; x += 160) {
      graphics.fillCircle(x, 74, 24);
      graphics.fillCircle(x + 36, GAME_HEIGHT - 74, 24);
    }

    graphics.lineStyle(4, 0xd0a862, 1);
    for (let x = 80; x < GAME_WIDTH; x += 80) {
      graphics.lineBetween(x, 42, x + 30, GAME_HEIGHT - 42);
    }
  }

  createPlayer() {
    this.player = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.player.add([
      this.add.rectangle(0, 11, 26, 34, 0xffffff),
      this.add.circle(0, -14, 15, 0x2060b8),
    ]);
    this.player.setSize(34, 50);

    this.physics.add.existing(this.player);
    this.player.body.setSize(34, 50);
    this.player.body.setOffset(-17, -25);
    this.player.body.setCollideWorldBounds(true);

    this.aimIndicator = this.add.rectangle(this.player.x, this.player.y, 24, 5, 0x10202b, 0.85);
    this.aimIndicator.setOrigin(0, 0.5);
  }

  createNpcs() {
    this.npcs = this.physics.add.group();

    const npcPositions = [
      { x: 150, y: 145 },
      { x: 275, y: 500 },
      { x: 430, y: 180 },
      { x: 610, y: 475 },
      { x: 770, y: 210 },
      { x: 835, y: 525 },
    ];

    this.npcGoal = npcPositions.length;

    npcPositions.forEach((position, index) => {
      const npc = this.add.container(position.x, position.y);
      const shirtColor = index % 2 === 0 ? 0xffd166 : 0xff7f50;
      const body = this.add.rectangle(0, 10, 26, 32, shirtColor);
      const head = this.add.circle(0, -15, 12, 0xffd6a5);
      const camera = this.add.rectangle(13, -8, 11, 7, 0x2b2d42);

      npc.add([body, head, camera]);
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
    this.aimIndicator.setPosition(
      this.player.x + this.lastAim.x * 14,
      this.player.y + this.lastAim.y * 14,
    );
    this.aimIndicator.setRotation(this.lastAim.angle());
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

    spray.lineStyle(8, 0x45b6fe, 0.55);
    spray.lineBetween(startX, startY, endX, endY);

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
