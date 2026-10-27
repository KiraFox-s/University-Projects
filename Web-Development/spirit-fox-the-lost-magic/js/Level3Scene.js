
import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { FoxMoves } from "./FoxMoves.js";
import { GameTechnic } from "./GameTechnic.js";
import { GameTimer } from "./GameTimer.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { ScoreManager } from "./ScoreManager.js";
import { formatTime } from "./TimeFormatter.js";
import { MenuMusic } from "./MenuMusic.js";

export class Level3Scene extends Phaser.Scene {
    constructor() {
        super("Level3Scene");
    }

    preload() {
        this.load.image("level3-background", "assets/images/backgrounds/level3.webp");
        this.load.image("platform-red1", "assets/images/platforms/platform-red1.webp");
        this.load.image("platform-red2", "assets/images/platforms/platform-red2.webp");
        this.load.image("fox-idle-left", "assets/images/fox/fox-idle-left.webp");
        this.load.image("fox-idle-right", "assets/images/fox/fox-idle-right.webp");
        this.load.image("fox-jump-left", "assets/images/fox/fox-jump-left.webp");
        this.load.image("fox-jump-right", "assets/images/fox/fox-jump-right.webp");
        this.load.image("fox-run-right-1", "assets/images/fox/fox-run-right-1.webp");
        this.load.image("fox-run-right-2", "assets/images/fox/fox-run-right-2.webp");
        this.load.image("fox-run-left-1", "assets/images/fox/fox-run-left-1.webp");
        this.load.image("fox-run-left-2", "assets/images/fox/fox-run-left-2.webp");
        this.load.image("spikes3", "assets/images/spikes.webp");
        this.load.image("bat-left-up", "assets/images/enemies/bat-left-up.webp");
        this.load.image("bat-left-down", "assets/images/enemies/bat-left-down.webp");
        this.load.image("bat-right-up", "assets/images/enemies/bat-right-up.webp");
        this.load.image("bat-right-down", "assets/images/enemies/bat-right-down.webp");
        this.load.image("fox-shot", "assets/images/fox-shot.webp");
        this.load.image("crystal-green", "assets/images/crystals/crystal-green.webp");
        this.load.image("crystal-red", "assets/images/crystals/crystal-red.webp");
        this.load.audio("level3-music", "assets/audio/level3.mp3");
        this.load.audio("hit-sound", "assets/audio/hit.mp3");
        this.load.audio("game-over-music", "assets/audio/game-over.mp3");
        this.load.audio("collect-sound", "assets/audio/collect.mp3");
        this.load.audio("teleport-sound", "assets/audio/teleport.mp3");
        this.load.audio("villain-dead-sound", "assets/audio/villain-dead.mp3");
    }

    create() {
        MenuMusic.stop();

        this.levelMusic = this.sound.add("level3-music", {
            loop: true,
            volume: 0.35
        });

        this.levelMusic.play();
        this.gameMode = this.registry.get("gameMode") || "story";
        this.isLevelMode = this.gameMode === "level";

        if (!this.isLevelMode && StoryModeManager.active) {
            StoryModeManager.setCurrentLevel(this.scene.key);
        }

        this.gameOver = false;
        this.popupOpen = false;
        this.teleporting = false;
        this.levelCompleted = false;
        this.gameOverElements = [];
        this.shuttingDown = false;

        if (!GameTimer.setGameMode(this.gameMode)) {
            console.error("Game mode could not be set for Level 3.");
            this.scene.start("MenuScene");
            return;
        }

        const currentTimerLevel = GameTimer.getCurrentLevel();

        if (currentTimerLevel === null) {
            if (!GameTimer.startLevel("Level 3")) {
                console.error("Level 3 timer could not be started.");
                this.scene.start("MenuScene");
                return;
            }
        } else if (currentTimerLevel === "Level 3") {
            if (!GameTimer.isRunning()) {
                GameTimer.resume();
            }
        } else {
            console.error(
                "Ajastimen taso ei vastaa käynnistettävää tasoa:",
                currentTimerLevel
            );
            this.scene.start("MenuScene");
            return;
        }

        this.createBackToMenuButton();

        this.timeText = this.add.text(30, 55, "Time: 00:00", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#ffffff",
            stroke: "#24091d",
            strokeThickness: 4
        })
            .setScrollFactor(0)
            .setDepth(1000);

        this.timerEvent = this.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => {
                if (this.timeText?.active) {
                    this.timeText.setText(
                        "Time: " + GameTimer.getFormattedTime()
                    );
                }
            }
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.shuttingDown = true;
            this.levelMusic?.stop();
            GameTimer.pause();

            this.shooters?.forEach(data => {
                data.sprite?.shootTimer?.remove();
            });

            this.input.off("pointerdown", this.shootHandler, this);
        });

        this.events.on(Phaser.Scenes.Events.PAUSE, () => {
            GameTimer.pause();

            if (!this.isLevelMode) {
                StoryModeManager.pauseTimer();
            }
        });

        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            if (this.gameOver || this.levelCompleted) {
                return;
            }

            GameTimer.resume();

            if (!this.isLevelMode) {
                StoryModeManager.resumeTimer();
            }
        });

        // Tausta.
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "level3-background"
        )
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(0);

        // Tasot ja törmäyspinnat.
        this.platforms = this.physics.add.staticGroup();

        this.addPlatform(1120, 620, "platform-red1", 200, 65);
        this.portal = this.add.zone(1200, 620, 90, 110);
        this.physics.add.existing(this.portal, true);

        this.addPlatform(150, 170, "platform-red1", 300, 65);
        this.addPlatform(220, 520, "platform-red1", 220, 75);
        this.addPlatform(630, 570, "platform-red1", 220, 75);
        this.addPlatform(780, 320, "platform-red1", 220, 75);
        this.addPlatform(1080, 230, "platform-red1", 220, 75);

        this.addPlatform(420, 620, "platform-red2", 135, 55);
        this.addPlatform(500, 400, "platform-red2", 135, 55);
        this.addPlatform(680, 170, "platform-red2", 135, 55);
        this.addPlatform(930, 500, "platform-red2", 135, 55);

        // Kettu.
        const savedState = StoryModeManager.getLevelState(this.scene.key);
        const foxX = Number.isFinite(savedState?.x)
            ? savedState.x
            : 100;

        const foxY = Number.isFinite(savedState?.y)
            ? savedState.y
            : 100;

        this.foxMoves = new FoxMoves(this, foxX, foxY);
        this.fox = this.foxMoves.getSprite();

        if (
            savedState?.facing === "left" ||
            savedState?.facing === "right"
        ) {
            this.foxMoves.facing = savedState.facing;

            this.fox.setTexture(
                savedState.facing === "left"
                    ? "fox-idle-left"
                    : "fox-idle-right"
            );
        }

        this.physics.add.collider(this.fox, this.platforms);

        // Ketun ammukset.
        this.foxBullets = this.physics.add.group({
            allowGravity: false
        });

        this.shootHandler = () => {
            if (this.gameOver || this.popupOpen || this.levelCompleted) {
                return;
            }

            this.shootFoxBullet();
        };

        this.input.on("pointerdown", this.shootHandler, this);
        this.createShootTouchButton();

        // Kristallit.
        this.greenCrystals = this.physics.add.staticGroup();
        this.redCrystals = this.physics.add.staticGroup();

        const greenCrystalPositions = [
            { x: 220, y: 465 },
            { x: 420, y: 565 },
            { x: 500, y: 345 },
            { x: 540, y: 135 },
            { x: 1200, y: 155 },
            { x: 970, y: 380 }
        ];

        greenCrystalPositions.forEach(({ x, y }, index) => {
            const crystal = this.greenCrystals.create(
                x,
                y,
                "crystal-green"
            );

            crystal.name = `green-${index}`;
            crystal.setScale(0.06);
            crystal.setDepth(8);
            crystal.refreshBody();
        });

        const redCrystalPositions = [
            { x: 185, y: 320 },
            { x: 630, y: 515 },
            { x: 1080, y: 320 }
        ];

        redCrystalPositions.forEach(({ x, y }, index) => {
            const crystal = this.redCrystals.create(
                x,
                y,
                "crystal-red"
            );

            crystal.name = `red-${index}`;
            crystal.setScale(0.06);
            crystal.setDepth(8);
            crystal.refreshBody();
        });

        this.gameTechnic = new GameTechnic(
            this,
            this.fox,
            this.greenCrystals,
            this.redCrystals
        );

        this.createDangerVignette();

        this.crystalHintText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 35,
            "Collect all crystals to unlock the portal!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffe9a8",
                stroke: "#24091d",
                strokeThickness: 4,
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000);

        this.crystalHintText.setVisible(this.isLevelMode);

        // Portaalin käyttö.
        this.physics.add.overlap(
            this.fox,
            this.portal,
            () => this.handlePortal(),
            null,
            this
        );

        // Piikkiansat.
        this.spikes = this.physics.add.staticGroup();

        const spikePositions = [
            { x: 150, y: 500, hitboxOffsetY: -5 },
            { x: 680, y: 545, hitboxOffsetY: 12 },
            { x: 885, y: 485, hitboxOffsetY: 12 }
        ];

        spikePositions.forEach(pos => {
            this.add.image(pos.x, pos.y, "spikes3")
                .setDisplaySize(110, 55)
                .setDepth(4);

            const hitbox = this.add.rectangle(
                pos.x,
                pos.y + pos.hitboxOffsetY,
                45,
                14,
                0xff0000,
                0
            );

            this.physics.add.existing(hitbox, true);
            this.spikes.add(hitbox);
        });

        this.physics.add.overlap(
            this.fox,
            this.spikes,
            () => {
                if (!this.gameOver && !this.popupOpen) {
                    this.sound.play("hit-sound", { volume: 0.6 });
                    this.gameTechnic.loseLife();
                }
            },
            null,
            this
        );

        this.createEnemies();
        this.createBulletCollisions();

        this.add.text(30, 25, "LEVEL 3: THE ABYSS", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#ffb3d9",
            stroke: "#24091d",
            strokeThickness: 4
        }).setDepth(10);
    }

    handlePortal() {
        if (
            this.gameOver ||
            this.popupOpen ||
            this.teleporting ||
            this.levelCompleted
        ) {
            return;
        }

        if (this.isLevelMode) {
            const remaining =
                this.greenCrystals.countActive(true) +
                this.redCrystals.countActive(true);

            if (remaining > 0) {
                this.crystalHintText.setText(
                    `Collect ${remaining} more crystal${remaining === 1 ? "" : "s"}!`
                );

                this.crystalHintText.setVisible(true);
                return;
            }
        }

        this.levelCompleted = true;

        const result = GameTimer.finishLevel(this.gameTechnic.score);

        if (!result) {
            this.levelCompleted = false;
            return;
        }

        this.levelMusic?.stop();

        if (this.isLevelMode) {
            this.showLevelCompletion(result);
            return;
        }

        StoryModeManager.addLevelResult(
            "Level 3",
            result.score,
            result.time
        );

        this.teleporting = true;
        this.physics.pause();

        this.cameras.main.fadeOut(700, 10, 5, 25);

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                console.log(
                    "Ennen Boss Leveliin siirtymistä:",
                    "StoryMode active =", StoryModeManager.active,
                    "| Current level =", StoryModeManager.currentLevel,
                    "| Game mode =", this.registry.get("gameMode")
                );

                this.sound.play("teleport-sound");
                this.time.delayedCall(500, () => {
                    this.sound.stopAll();
                    this.scene.start("BossLevelScene");
                });
            }
        );
    }

    createEnemies() {
        if (!this.anims.exists("level3-bat-left")) {
            this.anims.create({
                key: "level3-bat-left",
                frames: [
                    { key: "bat-left-up" },
                    { key: "bat-left-down" }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.anims.exists("level3-bat-right")) {
            this.anims.create({
                key: "level3-bat-right",
                frames: [
                    { key: "bat-right-up" },
                    { key: "bat-right-down" }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        const bulletGraphics = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        bulletGraphics.fillStyle(0xff3030, 1);
        bulletGraphics.fillCircle(8, 8, 7);
        bulletGraphics.generateTexture("level3-enemy-bullet", 16, 16);
        bulletGraphics.destroy();

        this.enemyBullets = this.physics.add.group({
            allowGravity: false
        });

        this.enemies = this.physics.add.group();

        this.shooters = [
            {
                id: "bat-1",
                x: 150,
                y: 470,
                direction: 1,
                leftLimit: 100,
                rightLimit: 300,
                animation: "level3-bat-right",
                texture: "bat-right-up"
            },
            {
                id: "bat-2",
                x: 1150,
                y: 180,
                direction: -1,
                leftLimit: 850,
                rightLimit: 1150,
                animation: "level3-bat-left",
                texture: "bat-left-up"
            }
        ];

        this.shooters.forEach(data => {
            const savedState = StoryModeManager.getLevelState(
                this.scene.key
            );

            if (savedState?.defeatedEnemies?.includes(data.id)) {
                data.sprite = null;
                return;
            }

            const enemy = this.physics.add.sprite(
                data.x,
                data.y,
                data.texture
            );

            this.enemies.add(enemy);

            enemy.body.setAllowGravity(false);
            enemy.setImmovable(true);
            enemy.setScale(0.06);
            enemy.setDepth(6);

            enemy.speed = 80;
            enemy.direction = data.direction;
            enemy.leftLimit = data.leftLimit;
            enemy.rightLimit = data.rightLimit;
            enemy.alive = true;

            enemy.play(data.animation);
            data.sprite = enemy;

            enemy.shootTimer = this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    if (
                        !enemy.active ||
                        !enemy.alive ||
                        this.gameOver ||
                        this.popupOpen ||
                        this.levelCompleted
                    ) {
                        return;
                    }

                    this.shootBullet(enemy);
                }
            });
        });
    }

    createBulletCollisions() {
        this.physics.add.overlap(
            this.fox,
            this.enemyBullets,
            (fox, bullet) => {
                if (
                    !bullet.active ||
                    this.gameOver ||
                    this.popupOpen
                ) {
                    return;
                }

                bullet.destroy();
                this.sound.play("hit-sound", { volume: 0.6 });
                this.gameTechnic.loseLife();
            },
            null,
            this
        );

        this.physics.add.overlap(
            this.foxBullets,
            this.enemies,
            (bullet, enemy) => {
                if (
                    !bullet.active ||
                    !enemy.active ||
                    this.gameOver ||
                    this.popupOpen
                ) {
                    return;
                }

                bullet.destroy();
                this.sound.play("hit-sound", { volume: 0.6 });

                const enemyData = this.shooters.find(
                    data => data.sprite === enemy
                );

                if (enemyData) {
                    enemyData.sprite.shootTimer?.remove();
                    enemyData.sprite.alive = false;

                    const previousState =
                        StoryModeManager.getLevelState(this.scene.key) ?? {};

                    const defeatedEnemies = Array.isArray(
                        previousState.defeatedEnemies
                    )
                        ? [...previousState.defeatedEnemies]
                        : [];

                    if (!defeatedEnemies.includes(enemyData.id)) {
                        defeatedEnemies.push(enemyData.id);
                    }

                    StoryModeManager.saveLevelState(this.scene.key, {
                        ...previousState,
                        defeatedEnemies
                    });
                }

                enemy.destroy();
                this.sound.play("villain-dead-sound");

            },
            null,
            this
        );
    }

    shootBullet(enemy) {
        if (!enemy?.active || !enemy.body || this.gameOver) {
            return;
        }

        const direction = enemy.direction || -1;

        const bullet = this.enemyBullets.create(
            enemy.x + direction * 25,
            enemy.y,
            "level3-enemy-bullet"
        );

        if (!bullet) {
            return;
        }

        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setTint(0xff3030);
        bullet.setDepth(7);

        bullet.body.setAllowGravity(false);
        bullet.body.setVelocity(direction * 300, 0);
    }

    shootFoxBullet() {
        if (
            this.gameOver ||
            this.popupOpen ||
            this.levelCompleted ||
            !this.fox?.active ||
            !this.fox.body
        ) {
            return;
        }

        const direction =
            this.foxMoves?.facing === "left" ? -1 : 1;

        const bullet = this.foxBullets.create(
            this.fox.x + direction * 30,
            this.fox.y,
            "fox-shot"
        );

        if (!bullet) {
            return;
        }

        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setDepth(7);
        bullet.setDisplaySize(64, 42);
        bullet.setFlipX(direction === -1);

        bullet.body.setAllowGravity(false);
        bullet.body.setVelocity(direction * 450, 0);
    }

    
    createShootTouchButton() {
        const controlsEnabled =
            this.registry.get("touchControlsEnabled") ?? false;

        if (!controlsEnabled) {
            return;
        }

        const button = this.add.text(
            GAME_WIDTH - 205,
            GAME_HEIGHT - 95,
            "✦",
            {
                fontFamily: "Arial",
                fontSize: "42px",
                color: "#ffffff",
                backgroundColor: "#8b294dcc",
                padding: { x: 20, y: 14 }
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setAlpha(0.85)
            .setInteractive();

        button.on("pointerdown", () => {
            if (!this.gameOver && !this.popupOpen && !this.levelCompleted) {
                this.shootFoxBullet();
            }

            button.setAlpha(1);
        });

        const release = () => button.setAlpha(0.85);

        button.on("pointerup", release);
        button.on("pointerout", release);
    }


    addPlatform(x, y, texture, width, height) {
        const platformImage = this.add.image(x, y, texture)
            .setDisplaySize(width, height)
            .setDepth(3);

        const hitbox = this.add.rectangle(
            x,
            y - height / 2 + 25,
            width * 0.9,
            12,
            0x000000,
            0
        );

        this.physics.add.existing(hitbox, true);
        this.platforms.add(hitbox);

        return { platformImage, hitbox };
    }


    // Luo pehmeän punaisen hehkun näytön reunoille.
    createDangerVignette() {
        this.dangerFrame = this.add.graphics();

        const layers = [
            { inset: 8,  width: 46, alpha: 0.035 },
            { inset: 16, width: 38, alpha: 0.045 },
            { inset: 24, width: 30, alpha: 0.055 },
            { inset: 32, width: 23, alpha: 0.070 },
            { inset: 40, width: 17, alpha: 0.085 },
            { inset: 48, width: 11, alpha: 0.11 },
            { inset: 55, width: 6,  alpha: 0.15 }
        ];

        layers.forEach(({ inset, width, alpha }) => {
            this.dangerFrame.lineStyle(width, 0xff172b, alpha);
            this.dangerFrame.strokeRect(
                inset,
                inset,
                GAME_WIDTH - inset * 2,
                GAME_HEIGHT - inset * 2
            );
        });

        this.dangerFrame.setScrollFactor(0);
        this.dangerFrame.setDepth(90);
        this.dangerFrame.setAlpha(0);

        this.dangerTween = null;
        this.dangerActive = false;
    }

    updateDangerVignette() {
        const lives = Math.max(
            0,
            Math.floor(Number(GameTechnic.lives) || 0)
        );

        const shouldShow =
            lives === 1 &&
            !this.gameOver &&
            !this.popupOpen &&
            !this.levelCompleted;

        if (shouldShow && !this.dangerActive) {
            this.dangerActive = true;
            this.dangerFrame.setAlpha(0.45);

            this.dangerTween = this.tweens.add({
                targets: this.dangerFrame,
                alpha: 1,
                duration: 850,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1
            });
        }

        if (!shouldShow && this.dangerActive) {
            this.dangerActive = false;

            if (this.dangerTween) {
                this.dangerTween.stop();
                this.dangerTween = null;
            }

            this.dangerFrame.setAlpha(0);
        }
    }

    
    update() {
        // Päivitetään vaarareuna myös silloin, kun peli pysähtyy.
        this.updateDangerVignette();

        if (this.gameOver || this.popupOpen || this.levelCompleted) {
            return;
        }

        this.foxMoves?.update();

        this.removeOffscreenBullets(this.enemyBullets);
        this.removeOffscreenBullets(this.foxBullets);

        if (this.fox && this.fox.body && this.fox.body.blocked.down) {
            if (this.fox.y >= GAME_HEIGHT - 80) {
                this.showGameOver("YOU FELL INTO THE ABYSS...");
                return;
            }
        }

        this.shooters?.forEach(data => {
            const enemy = data.sprite;

            if (!enemy?.active || !enemy.alive || !enemy.body) {
                return;
            }

            if (enemy.x <= enemy.leftLimit) {
                enemy.setX(enemy.leftLimit);
                enemy.direction = 1;
                enemy.play("level3-bat-right", true);
            } else if (enemy.x >= enemy.rightLimit) {
                enemy.setX(enemy.rightLimit);
                enemy.direction = -1;
                enemy.play("level3-bat-left", true);
            }

            enemy.setVelocityX(enemy.direction * enemy.speed);
            enemy.setVelocityY(0);
        });
    }

    removeOffscreenBullets(group) {
        group?.getChildren().forEach(bullet => {
            if (
                bullet.active &&
                (
                    bullet.x < -30 ||
                    bullet.x > GAME_WIDTH + 30 ||
                    bullet.y < -30 ||
                    bullet.y > GAME_HEIGHT + 30
                )
            ) {
                bullet.destroy();
            }
        });
    }

    showGameOver(message) {
        if (this.gameOver || this.levelCompleted) {
            return;
        }

        this.gameOver = true;
        this.sound.stopAll();
        this.sound.play("game-over-music", {
            volume: 0.5,
            loop: false
        });
        GameTimer.pause();

        if (!this.isLevelMode) {
            StoryModeManager.pauseTimer();
        }

        this.physics.pause();

        this.shooters?.forEach(data => {
            if (data.sprite?.shootTimer) {
                data.sprite.shootTimer.paused = true;
            }
        });

        const overlay = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x08040d,
            0.85
        ).setDepth(100);

        this.gameOverElements.push(overlay);

        const title = this.add.text(
            GAME_WIDTH / 2,
            250,
            "GAME OVER",
            {
                fontFamily: "Georgia, serif",
                fontSize: "48px",
                color: "#ff6b91",
                stroke: "#210713",
                strokeThickness: 6
            }
        )
            .setOrigin(0.5)
            .setDepth(101);

        this.gameOverElements.push(title);

        const reason = this.add.text(
            GAME_WIDTH / 2,
            320,
            message,
            {
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 850 }
            }
        )
            .setOrigin(0.5)
            .setDepth(101);

        this.gameOverElements.push(reason);

        this.createButton(GAME_WIDTH / 2, 410, "RESTART", () => {
            GameTimer.reset();
            GameTechnic.lives = 3;

            if (this.isLevelMode) {
                this.scene.restart();
            } else {
                StoryModeManager.start(3);
                this.scene.start("Level1Scene");
            }
        });

        this.createButton(
            GAME_WIDTH / 2,
            475,
            "BACK TO MENU",
            () => this.showSavePopup(true)
        );
    }

    createButton(x, y, label, callback) {
        const button = this.add.text(x, y, label, {
            fontFamily: "Georgia, serif",
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#244b72",
            padding: { x: 24, y: 12 }
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(102)
            .setInteractive({ useHandCursor: true });

        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: "#376a96" });
        });

        button.on("pointerout", () => {
            button.setStyle({ backgroundColor: "#244b72" });
        });

        button.on("pointerdown", callback);
        this.gameOverElements.push(button);

        return button;
    }

    createBackToMenuButton() {
        const backButton = this.add.text(
            GAME_WIDTH - 20,
            20,
            "BACK TO MENU",
            {
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                color: "#ffffff",
                stroke: "#10251e",
                strokeThickness: 3
            }
        )
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(1000)
            .setInteractive({ useHandCursor: true });

        backButton.on("pointerover", () => {
            backButton.setStyle({ color: "#8be9f7" });
        });

        backButton.on("pointerout", () => {
            backButton.setStyle({ color: "#ffffff" });
        });

        backButton.on("pointerdown", () => {
            if (this.popupOpen || this.gameOver || this.levelCompleted) {
                return;
            }

            this.showSavePopup(false);
        });
    }

    showSavePopup(fromGameOver = false) {
        if (this.popupOpen) {
            return;
        }

        this.popupOpen = true;
        GameTimer.pause();

        if (!this.isLevelMode) {
            StoryModeManager.pauseTimer();
        }

        this.physics.pause();

        const popupItems = [];

        const panel = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            520,
            300,
            0x101b3a,
            0.97
        )
            .setStrokeStyle(3, 0x65d8f2)
            .setScrollFactor(0)
            .setDepth(1100);

        popupItems.push(panel);

        const title = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 95,
            "SAVE GAME?",
            {
                fontFamily: "Georgia, serif",
                fontSize: "30px",
                color: "#8be9f7"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1101);

        popupItems.push(title);

        const addPopupButton = (y, label, callback) => {
            const button = this.add.text(
                GAME_WIDTH / 2,
                y,
                label,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "18px",
                    color: "#ffffff",
                    backgroundColor: "#244b72",
                    padding: { x: 16, y: 8 }
                }
            )
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(1101)
                .setInteractive({ useHandCursor: true });

            button.on("pointerover", () => {
                button.setStyle({ backgroundColor: "#376a96" });
            });

            button.on("pointerout", () => {
                button.setStyle({ backgroundColor: "#244b72" });
            });

            button.on("pointerdown", callback);
            popupItems.push(button);
        };

        const closePopup = () => {
            popupItems.forEach(item => {
                if (item?.active) {
                    item.destroy();
                }
            });

            this.popupOpen = false;

            if (!fromGameOver && !this.gameOver) {
                this.physics.resume();
                GameTimer.resume();

                if (!this.isLevelMode) {
                    StoryModeManager.resumeTimer();
                }
            }
        };

        addPopupButton(
            GAME_HEIGHT / 2 - 30,
            "SAVE & EXIT",
            () => {
                try {

                    if (this.levelMusic) {
                        this.levelMusic.stop();
                    }
                    if (this.isLevelMode) {
                        window.alert(
                            "Saving progress is available only in Story Mode."
                        );
                        return;
                    }

                    const fox = this.fox;

                    if (fox) {
                        const previousState =
                            StoryModeManager.getLevelState(this.scene.key) ?? {};

                        StoryModeManager.saveLevelState(this.scene.key, {
                            ...previousState,
                            x: fox.x,
                            y: fox.y,
                            facing: this.foxMoves.facing,
                            score: this.gameTechnic.score,
                            collectedCrystals: [
                                ...this.gameTechnic.collectedCrystals
                            ]
                        });
                    }

                    const saved = StoryModeManager.saveProgress(
                        this.scene.key
                    );

                    if (!saved) {
                        window.alert(
                            "The game could not be saved. Please try again."
                        );

                        closePopup();
                        return;
                    }

                    GameTimer.reset();
                    this.scene.start("MenuScene");
                } catch (error) {
                    console.error("Game save failed:", error);

                    window.alert(
                        "The game could not be saved. Please try again."
                    );

                    closePopup();
                }
            }
        );

        addPopupButton(
            GAME_HEIGHT / 2 + 30,
            "EXIT WITHOUT SAVING",
            () => {
                GameTimer.reset();

                if (this.levelMusic) {
                    this.levelMusic.stop();
                }

                if (!this.isLevelMode) {
                    StoryModeManager.reset();
                }

                this.scene.start("MenuScene");
            }
        );

        addPopupButton(
            GAME_HEIGHT / 2 + 90,
            "CANCEL",
            closePopup
        );
    }

    showLevelCompletion(result) {
        this.physics.pause();

        const canSave = ScoreManager.qualifiesForLevelTop3(
            result.level,
            result.time
        );

        const items = [];
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        const panel = this.add.rectangle(
            centerX,
            centerY,
            590,
            340,
            0x101b3a,
            0.98
        )
            .setStrokeStyle(3, 0x65d8f2)
            .setScrollFactor(0)
            .setDepth(2000);

        items.push(panel);

        const addText = (y, text, style = {}) => {
            const object = this.add.text(centerX, y, text, {
                fontFamily: "Georgia, serif",
                fontSize: "21px",
                color: "#ffffff",
                align: "center",
                stroke: "#08051a",
                strokeThickness: 2,
                ...style
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2001);

            items.push(object);
        };

        addText(centerY - 105, "LEVEL 3 COMPLETED!", {
            fontSize: "30px",
            color: "#baf5ff",
            fontStyle: "bold"
        });

        addText(centerY - 50, `Time: ${formatTime(result.time)}`);
        addText(centerY - 10, `Score: ${result.score}`);

        addText(
            centerY + 30,
            canSave
                ? "Your time qualifies for the Top 3!"
                : "Your time does not qualify for the Top 3.",
            {
                fontSize: "17px",
                color: canSave ? "#baf5ff" : "#d0d7e8"
            }
        );

        const closeItems = () => {
            items.forEach(item => {
                if (item?.active) {
                    item.destroy();
                }
            });
        };

        const addButton = (x, y, label, callback) => {
            const button = this.add.text(x, y, label, {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff",
                backgroundColor: "#244b72",
                padding: { x: 14, y: 9 }
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2002)
                .setInteractive({ useHandCursor: true });

            button.on("pointerover", () => {
                button.setStyle({ backgroundColor: "#376a96" });
            });

            button.on("pointerout", () => {
                button.setStyle({ backgroundColor: "#244b72" });
            });

            button.on("pointerdown", callback);
            items.push(button);
        };

        const returnToMenu = () => {
            closeItems();
            GameTimer.discardPendingResult();
            this.scene.start("MenuScene");
        };

        if (canSave) {
            addButton(centerX - 115, centerY + 95, "SAVE RECORD", () => {
                this.showNameEntry(
                    (cleanName) => {
                        const saved = GameTimer.savePendingResult(cleanName);

                        if (!saved) {
                            window.alert(
                                "The record could not be saved. It may no longer qualify for the Top 3."
                            );
                            return;
                        }

                        closeItems();
                        this.showRecordSavedMessage();
                    },
                    () => {
                        // CANCEL: palataan tulosikkunaan.
                    }
                );
            });

            addButton(centerX + 135, centerY + 95, "BACK TO MENU", returnToMenu);
        } else {
            addButton(centerX, centerY + 90, "BACK TO MENU", returnToMenu);
        }
    }

    showRecordSavedMessage() {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        const items = [];

        const panel = this.add.rectangle(
            centerX,
            centerY,
            500,
            220,
            0x101b3a,
            0.98
        )
            .setStrokeStyle(3, 0x65d8f2)
            .setScrollFactor(0)
            .setDepth(2100);

        items.push(panel);

        const message = this.add.text(
            centerX,
            centerY - 35,
            "RECORD SAVED!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "30px",
                color: "#8be9f7",
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2101);

        items.push(message);

        const button = this.add.text(
            centerX,
            centerY + 45,
            "BACK TO MENU",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff",
                backgroundColor: "#244b72",
                padding: { x: 16, y: 10 }
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2101)
            .setInteractive({ useHandCursor: true });

        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: "#376a96" });
        });

        button.on("pointerout", () => {
            button.setStyle({ backgroundColor: "#244b72" });
        });

        button.on("pointerdown", () => {
            items.forEach(item => {
                if (item?.active) {
                    item.destroy();
                }
            });

            this.scene.start("MenuScene");
        });

        items.push(button);
    }

    showNameEntry(onSave, onCancel) {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        const items = [];

        const panel = this.add.rectangle(
            centerX, centerY, 520, 300, 0x101b3a, 0.99
        )
            .setStrokeStyle(3, 0x65d8f2)
            .setScrollFactor(0)
            .setDepth(2200);

        items.push(panel);

        const title = this.add.text(
            centerX, centerY - 100, "NEW HIGH SCORE!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "30px",
                color: "#8be9f7",
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2201);

        items.push(title);

        const message = this.add.text(
            centerX, centerY - 55,
            "You made it into the TOP 3!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff",
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2201);

        items.push(message);

        // HTML-kenttä nimen kirjoittamiseen.
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 24;
        input.placeholder = "Enter your name...";
        input.value = ScoreManager.getPlayerName() || "";
        input.setAttribute("aria-label", "Player name");

        Object.assign(input.style, {
            position: "absolute",
            left: "50%",
            top: "45%",
            transform: "translate(-50%, 10px)",
            width: "280px",
            padding: "10px",
            boxSizing: "border-box",
            background: "#0b1530",
            color: "#ffffff",
            border: "2px solid #65d8f2",
            borderRadius: "3px",
            fontFamily: "Georgia, serif",
            fontSize: "16px",
            outline: "none",
            zIndex: "10000"
        });

        document.body.appendChild(input);

        const cleanup = () => {
            items.forEach(item => {
                if (item?.active) {
                    item.destroy();
                }
            });

            input.remove();
        };

        const addButton = (x, label, callback) => {
            const button = this.add.text(
                x, centerY + 85, label,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "17px",
                    color: "#ffffff",
                    backgroundColor: "#244b72",
                    padding: { x: 16, y: 10 }
                }
            )
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2201)
                .setInteractive({ useHandCursor: true });

            button.on("pointerover", () => {
                button.setStyle({
                    backgroundColor: "#376a96"
                });
            });

            button.on("pointerout", () => {
                button.setStyle({
                    backgroundColor: "#244b72"
                });
            });

            button.on("pointerdown", callback);

            items.push(button);
        };

        addButton(centerX - 85, "SAVE RECORD", () => {
            const name = input.value.trim().slice(0, 24);

            if (!name) {
                message.setText("Please enter your name.");
                input.focus();
                return;
            }

            cleanup();
            onSave(name);
        });

        addButton(centerX + 105, "CANCEL", () => {
            cleanup();
            onCancel();
        });

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();

                const name = input.value.trim().slice(0, 24);

                if (!name) {
                    message.setText("Please enter your name.");
                    input.focus();
                    return;
                }

                cleanup();
                onSave(name);
            }

            if (event.key === "Escape") {
                cleanup();
                onCancel();
            }
        });

        input.focus();
    }
}
