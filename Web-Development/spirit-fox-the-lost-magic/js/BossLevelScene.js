
import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { FoxMoves } from "./FoxMoves.js";
import { GameTimer } from "./GameTimer.js";
import { GameTechnic } from "./GameTechnic.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { BossMechanics } from "./BossMechanics.js";
import { MenuMusic } from "./MenuMusic.js";

export class BossLevelScene extends Phaser.Scene {
    constructor() {
        super("BossLevelScene");
    }

    preload() {
        this.load.image("boss-background", "assets/images/backgrounds/boss.webp");
        this.load.image("boss-platform-1", "assets/images/platforms/platform-boss1.webp");
        this.load.image("boss-platform-2", "assets/images/platforms/platform-boss2.webp");
        this.load.image("fox-idle-right", "assets/images/fox/fox-idle-right.webp");
        this.load.image("fox-idle-left", "assets/images/fox/fox-idle-left.webp");
        this.load.image("fox-run-right-1", "assets/images/fox/fox-run-right-1.webp");
        this.load.image("fox-run-right-2", "assets/images/fox/fox-run-right-2.webp");
        this.load.image("fox-run-left-1", "assets/images/fox/fox-run-left-1.webp");
        this.load.image("fox-run-left-2", "assets/images/fox/fox-run-left-2.webp");
        this.load.image("fox-jump-right", "assets/images/fox/fox-jump-right.webp");
        this.load.image("fox-jump-left", "assets/images/fox/fox-jump-left.webp");
        this.load.image("shadow-eagle-1", "assets/images/villain/villain01.webp");
        this.load.image("shadow-eagle-2", "assets/images/villain/villain02.webp");
        this.load.image("fox-shot", "assets/images/fox-shot.webp");
        this.load.audio("boss-level-music", "assets/audio/boss-level.mp3");
        this.load.audio("hit-sound", "assets/audio/hit.mp3");
        this.load.audio("game-over-music", "assets/audio/game-over.mp3");
        this.load.audio("eagle-sound", "assets/audio/eagle.mp3");
        this.load.audio("victory-sound", "assets/audio/victory.mp3");
    }

    create() {
        MenuMusic.stop();

        this.levelMusic = this.sound.add("boss-level-music", {
            loop: true,
            volume: 0.35
        });

        this.levelMusic.play();

        this.gameMode = this.registry.get("gameMode") || "story";
        this.isLevelMode = this.gameMode === "level";

        if (!this.isLevelMode && StoryModeManager.active) {
            StoryModeManager.setCurrentLevel(this.scene.key);
        }

        
        const savedState = !this.isLevelMode && StoryModeManager.active
            ? StoryModeManager.getLevelState(this.scene.key)
            : null;

        this.gameOver = false;
        this.popupOpen = false;
        this.bossDefeated = savedState?.bossDefeated ?? false;
        this.playerInvulnerable = false;
        this.bossInvulnerable = false;
        this.playerFacing = savedState?.playerFacing ?? 1;
        this.bossLives = Number.isFinite(savedState?.bossLives)
            ? Math.max(0, Math.min(5, savedState.bossLives))
            : 5;
        this.playerLives = Number.isFinite(savedState?.playerLives)
            ? Math.max(0, Math.min(3, savedState.playerLives))
            : GameTechnic.lives;
        this.bonusHeartCollected =
            savedState?.bonusHeartCollected ?? false;
        this.score = Number.isFinite(savedState?.score)
            ? savedState.score
            : 0;

        GameTechnic.lives = this.playerLives;


        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (!GameTimer.setGameMode(this.gameMode)) {
            console.error("Game mode could not be set for Boss Level.");
            this.scene.start("MenuScene");
            return;
        }

        const bossTimerLevel = "Boss Level: Shadow Eagle";
        const currentTimerLevel = GameTimer.getCurrentLevel();

        if (currentTimerLevel === null) {
            if (!GameTimer.startLevel(bossTimerLevel)) {
                console.error("Boss Level timer could not be started.");
                this.scene.start("MenuScene");
                return;
            }
        } else if (currentTimerLevel === bossTimerLevel) {
            if (!GameTimer.isRunning()) {
                GameTimer.resume();
            }
        } else {
            console.error(
                "Unexpected timer level:",
                currentTimerLevel
            );
            this.scene.start("MenuScene");
            return;
        }

        this.add.text(30, 25, "BOSS LEVEL: SHADOW EAGLE", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#e5baff",
            stroke: "#08051a",
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);

        this.timeText = this.add.text(30, 55, "Time: 00:00", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#ffffff",
            stroke: "#08051a",
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);

        this.add.text(30, 80, "Score: 0", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#ffffff",
            stroke: "#08051a",
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);

        this.lifeDisplay = GameTechnic.createLivesDisplay(this, 30, 105);
        this.livesText = this.lifeDisplay.livesText;

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

        this.events.on(Phaser.Scenes.Events.PAUSE, () => {
            GameTimer.pause();

            if (!this.isLevelMode) {
                StoryModeManager.pauseTimer();
            }
        });

        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            if (this.gameOver || this.bossDefeated) return;

            GameTimer.resume();

            if (!this.isLevelMode) {
                StoryModeManager.resumeTimer();
            }
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.levelMusic?.stop();
            GameTimer.pause();
            this.cleanup();
        });

        // Tausta.
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "boss-background"
        )
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(0);

        this.platformHitboxes = [];

        // Alustat.
        this.createPlatform("boss-platform-1", GAME_WIDTH * 0.80, GAME_HEIGHT * 0.34, 0.18, 0.15);
        this.createPlatform("boss-platform-2", GAME_WIDTH * 0.50, GAME_HEIGHT * 0.45, 0.12, 0.10);
        this.createPlatform("boss-platform-2", GAME_WIDTH * 0.45, GAME_HEIGHT * 0.90, 0.12, 0.10);
        this.createPlatform("boss-platform-2", GAME_WIDTH * 0.75, GAME_HEIGHT * 0.55, 0.12, 0.10);
        this.createPlatform("boss-platform-1", GAME_WIDTH * 0.18, GAME_HEIGHT * 0.82, 0.18, 0.15);
        this.createPlatform("boss-platform-1", GAME_WIDTH * 0.25, GAME_HEIGHT * 0.35, 0.18, 0.15);
        this.createPlatform("boss-platform-1", GAME_WIDTH * 0.48, GAME_HEIGHT * 0.70, 0.18, 0.15);
        this.createPlatform("boss-platform-1", GAME_WIDTH * 0.75, GAME_HEIGHT * 0.82, 0.18, 0.15);

        // Kettu.
        const foxX = Number.isFinite(savedState?.x)
            ? savedState.x
            : GAME_WIDTH * 0.18;

        const foxY = Number.isFinite(savedState?.y)
            ? savedState.y
            : GAME_HEIGHT - 105;

        this.foxMoves = new FoxMoves(this, foxX, foxY);

        this.fox = this.foxMoves.getSprite();
        this.fox.body.setGravityY(900);
        this.foxMoves.jumpForce = 600;
        this.platformHitboxes.forEach(hitbox => {
            this.physics.add.collider(this.fox, hitbox);
        });

        // Bonuselämä näkyy vain Story Modessa,
        // jos Boss Level alkaa yhdellä elämällä.
        if (
            !this.isLevelMode &&
            this.playerLives === 1 &&
            !this.bonusHeartCollected
        ) {
            this.createBonusLifeHeart();
        }

        // Shadow Eagle.
        this.boss = this.add.sprite(
            Number.isFinite(savedState?.bossX)
                ? savedState.bossX
                : GAME_WIDTH * 0.72,
            Number.isFinite(savedState?.bossY)
                ? savedState.bossY
                : GAME_HEIGHT * 0.28,
            "shadow-eagle-1"
        )
            .setScale(0.22)
            .setDepth(12)
            .setOrigin(0.5);

        if (!this.anims.exists("shadow-eagle-fly")) {
            this.anims.create({
                key: "shadow-eagle-fly",
                frames: [
                    { key: "shadow-eagle-1" },
                    { key: "shadow-eagle-2" }
                ],
                frameRate: 2,
                repeat: -1
            });
        }

        this.boss.play("shadow-eagle-fly");
        this.bossMechanics = new BossMechanics(this);

        this.createDangerVignette();

        // Pomon elämäpalkki.
        this.add.text(GAME_WIDTH / 2, 24, "SHADOW EAGLE", {
            fontFamily: "Arial",
            fontSize: "20px",
            color: "#ffd9e1",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(30);

        this.bossHpBack = this.add.rectangle(
            GAME_WIDTH / 2, 55, 300, 18, 0x251321
        ).setStrokeStyle(2, 0xff526c).setDepth(30);

        this.bossHpFill = this.add.rectangle(
            GAME_WIDTH / 2 - 148,
            55,
            296 * (this.bossLives / 5),
            12,
            0xf02c4f
        ).setOrigin(0, 0.5).setDepth(31);

        // Pomon osuma-alue.
        this.bossHitbox = this.add.zone(
            this.boss.x,
            this.boss.y,
            150,
            110
        );

        this.physics.add.existing(this.bossHitbox);
        this.bossHitbox.body.setAllowGravity(false);
        this.bossHitbox.body.setImmovable(true);

        // Ammukset.
        this.playerBullets = this.add.group({ maxSize: 30 });

        this.enemyBullets = this.physics.add.group({
            maxSize: 50,
            allowGravity: false,
            runChildUpdate: true
        });

        // Ketun ja pomon törmäykset ammuksiin.
        this.physics.add.overlap(
            this.fox,
            this.enemyBullets,
            (fox, bullet) => {
                if (
                    !bullet.active ||
                    this.playerInvulnerable ||
                    this.bossDefeated ||
                    this.gameOver
                ) return;

                console.log("Enemy bullet hit fox");
                bullet.destroy();
                this.damagePlayer();
            }
        );

        // Näppäimet.
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("A,D,W,SPACE,R,ESC");

        this.input.on("pointerdown", this.shoot, this);
        this.createBackToMenuButton();

        // BossMechanics hallitsee kaikkia pomon hyökkäyksiä.
        this.bossMechanics.start();
    }

    createPlatform(texture, x, y, scaleX, scaleY = scaleX) {
        const platform = this.add.image(x, y, texture)
            .setScale(scaleX, scaleY)
            .setDepth(5);

        const hitbox = this.add.rectangle(
            x,
            y - platform.displayHeight / 2 + 34,
            platform.displayWidth,
            8,
            0x00ff00,
            0
        );
        this.physics.add.existing(hitbox, true);
        this.platformHitboxes.push(hitbox);
        return { platform, hitbox };
    }


    createDangerVignette() {
        this.dangerFrame = this.add.graphics();

        const layers = [
            { inset: 8, width: 46, alpha: 0.035 },
            { inset: 16, width: 38, alpha: 0.045 },
            { inset: 24, width: 30, alpha: 0.055 },
            { inset: 32, width: 23, alpha: 0.070 },
            { inset: 40, width: 17, alpha: 0.085 },
            { inset: 48, width: 11, alpha: 0.11 },
            { inset: 55, width: 6, alpha: 0.15 }
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

        this.dangerFrame
            .setScrollFactor(0)
            .setDepth(90)
            .setAlpha(0);

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
            !this.bossDefeated &&
            !this.popupOpen;

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

    update(time, delta) {
        this.updateDangerVignette();

        if (!this.fox?.body) return;

        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
                this.restartBossLevel();
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
                this.exitWithoutSaving();
            }

            return;
        }

        if (this.bossDefeated || this.popupOpen) return;

        this.foxMoves.update();

        if (this.fox.body.velocity.x < 0) {
            this.playerFacing = -1;
        } else if (this.fox.body.velocity.x > 0) {
            this.playerFacing = 1;
        }

        // Pomon osuma-alue seuraa pomoa.
        if (this.bossHitbox?.body && this.boss?.active) {
            this.bossHitbox.setPosition(this.boss.x, this.boss.y);
            this.bossHitbox.body.updateFromGameObject();
        }

        // Ketun ammukset liikkuvat vaakasuoraan.
        this.playerBullets.getChildren().forEach(bullet => {
            if (!bullet.active) return;

            bullet.x += bullet.speedX * (delta / 1000);
            bullet.y = bullet.fixedY;

            if (
                this.bossHitbox?.active &&
                Phaser.Geom.Rectangle.Contains(
                    this.bossHitbox.getBounds(),
                    bullet.x,
                    bullet.y
                )
            ) {
                bullet.destroy();
                this.damageBoss();
            }
        });

        // Poistetaan kentän ulkopuolelle menneet ammukset.
        [
            ...this.playerBullets.getChildren(),
            ...this.enemyBullets.getChildren()
        ].forEach(bullet => {
            if (
                bullet.active &&
                (
                    bullet.x < -50 ||
                    bullet.x > GAME_WIDTH + 50 ||
                    bullet.y < -50 ||
                    bullet.y > GAME_HEIGHT + 50
                )
            ) {
                bullet.destroy();
            }
        });
    }

    shoot() {
        if (
            this.gameOver ||
            this.popupOpen ||
            this.bossDefeated ||
            !this.fox?.active
        ) return;

        const direction = this.playerFacing < 0 ? -1 : 1;

        const bullet = this.add.image(
            this.fox.x + direction * 35,
            this.fox.y,
            "fox-shot"
        )
            .setDepth(15)
            .setDisplaySize(40, 28)
            .setFlipX(direction === -1);

        bullet.speedX = direction * 400;
        bullet.fixedY = bullet.y;

        this.playerBullets.add(bullet);
    }

    
    fireEnemyBullet(x, y, velocityX, velocityY, radius = 9) {
        if (this.bossDefeated || this.gameOver) return null;

        const bullet = this.add.circle(
            x,
            y,
            radius,
            0xff294f
        )
            .setStrokeStyle(2, 0xff9aaa)
            .setDepth(14);

        this.physics.add.existing(bullet);

        bullet.body.setAllowGravity(false);
        bullet.body.setImmovable(true);
        bullet.body.enable = true;

        this.enemyBullets.add(bullet);

        bullet.body.reset(x, y);
        bullet.body.setVelocity(velocityX, velocityY);

        return bullet;
    }


    damageBoss() {
        if (
            this.bossInvulnerable ||
            this.bossDefeated ||
            this.gameOver
        ) return;

        this.bossLives -= 1;

        this.bossHpFill.width = Math.max(
            0,
            296 * (this.bossLives / 5)
        );

        this.bossInvulnerable = true;

        this.tweens.add({
            targets: this.boss,
            alpha: 0.25,
            duration: 70,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                if (this.boss?.active) this.boss.setAlpha(1);
                this.bossInvulnerable = false;
            }
        });

        if (this.bossLives <= 0) {
            this.defeatBoss();
        }
    }

    defeatBoss() {
        if (this.bossDefeated) return;

        this.bossDefeated = true;

        this.levelMusic?.stop();
        this.bossMechanics?.stop();
        this.sound.play("victory-sound");

        const result = GameTimer.finishLevel(20);

        if (!result) {
            GameTimer.pause();
            console.error("Boss Level result could not be finalized.");
        }

        if (!this.isLevelMode) {
            StoryModeManager.addLevelResult(
                "Boss Level: Shadow Eagle",
                20,
                result?.time ?? 0
            );
        }

        this.enemyBullets.clear(true, true);
        this.playerBullets.clear(true, true);
        this.physics.pause();
        this.tweens.killAll();
        this.time.removeAllEvents();

        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "SHADOW EAGLE DEFEATED! +20 POINTS",
            {
                fontFamily: "Arial",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#baf5ff",
                stroke: "#10101c",
                strokeThickness: 5
            }
        )
            .setOrigin(0.5)
            .setDepth(50);

        this.time.delayedCall(1800, () => {
            if (!this.scene.isActive()) return;

            if (this.isLevelMode) {
                this.scene.start("ResultsScene");
            } else {
                this.scene.start("EndingScene");
            }
        });
    }

    damagePlayer() {
        if (
            this.playerInvulnerable ||
            this.gameOver ||
            this.bossDefeated
        ) return;

        this.sound.play("hit-sound", { volume: 0.6 });
        this.playerLives -= 1;
        GameTechnic.lives = Math.max(0, this.playerLives);

        this.lifeDisplay.update();
        this.playerInvulnerable = true;

        this.tweens.add({
            targets: this.fox,
            alpha: 0.25,
            duration: 90,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                if (this.fox?.active) this.fox.setAlpha(1);
                this.playerInvulnerable = false;
            }
        });
        if (this.playerLives <= 0) {
            this.showGameOver();
            this.gameOver = true;
            // Pysäytetään musiikki myös GAME OVER -tilanteessa.
            this.levelMusic?.stop();
            this.bossMechanics?.stop();
        }
    }

    createBonusLifeHeart() {
        // Sydän lähelle oikeaa reunaa, maatason yläpuolelle.
        this.bonusHeart = this.add.text(
            GAME_WIDTH - 110,
            GAME_HEIGHT - 80,
            "♥",
            {
                fontFamily: "Arial",
                fontSize: "52px",
                color: "#ff3158",
                stroke: "#ffffff",
                strokeThickness: 2
            }
        )
            .setOrigin(0.5)
            .setDepth(20);

        // Sydän ei putoa painovoiman vaikutuksesta.
        this.physics.add.existing(this.bonusHeart);

        this.bonusHeart.body
            .setAllowGravity(false)
            .setImmovable(true);

        // Pelaaja kerää sydämen koskettamalla sitä.
        this.physics.add.overlap(
            this.fox,
            this.bonusHeart,
            () => {
                if (
                    !this.bonusHeart?.active ||
                    this.gameOver ||
                    this.bossDefeated
                ) {
                    return;
                }

                // Poistetaan sydän heti, jotta sitä ei voi kerätä uudelleen.
                this.bonusHeart.destroy();
                this.bonusHeart = null;
                this.bonusHeartCollected = true;

                // Lisätään yksi elämä.
                this.playerLives = Math.min(3, this.playerLives + 1);
                GameTechnic.lives = this.playerLives;

                // Päivitetään sydänkuvakkeet HUDissa.
                this.lifeDisplay.update();
            }
        );

        // Kevyt sykkivä animaatio.
        this.tweens.add({
            targets: this.bonusHeart,
            scale: 1.2,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
    }

    showGameOver() {
        if (this.gameOver || this.bossDefeated) return;
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
        this.enemyBullets.clear(true, true);
        this.playerBullets.clear(true, true);
        this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x08040d,
            0.85
        ).setDepth(49);
        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 70,
            "GAME OVER",
            {
                fontFamily: "Arial",
                fontSize: "48px",
                fontStyle: "bold",
                color: "#ff536e",
                stroke: "#10101c",
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(50);
        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 10,
            "The Shadow Eagle defeated you.",
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#ffffff"
            }
        ).setOrigin(0.5).setDepth(50);
        this.createButton(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 55,
            "RETRY",
            () => this.restartBossLevel()
        );
        this.createButton(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 115,
            "BACK TO MENU",
            () => this.exitWithoutSaving()
        );
    }

    createButton(x, y, label, callback) {
        const button = this.add.text(x, y, label, {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
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
        return button;
    }

    createBackToMenuButton() {
        const button = this.add.text(
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
        button.on("pointerover", () => {
            button.setStyle({ color: "#8be9f7" });
        });
        button.on("pointerout", () => {
            button.setStyle({ color: "#ffffff" });
        });
        button.on("pointerdown", () => {
            if (
                this.popupOpen ||
                this.gameOver ||
                this.bossDefeated
            ) return;
            this.showSavePopup();
        });
    }

    saveBossState() {
        console.log("StoryMode active:", StoryModeManager.active);
        console.log("Level mode:", this.isLevelMode);
        console.log("Current level:", StoryModeManager.currentLevel);
        console.log("Boss lives:", this.bossLives);

        if (this.isLevelMode || !StoryModeManager.active) {
            console.error("Boss state cannot be saved: Story Mode is not active.");
            return false;
        }

        const bossTimerLevel = "Boss Level: Shadow Eagle";
        const currentTimerLevel = GameTimer.getCurrentLevel();

        console.log("CURRENT TIMER:", GameTimer.currentLevel);
        console.log("TIMER RUNNING:", GameTimer.running);
        console.log("GAME MODE:", GameTimer.gameMode);
        console.log(
            "Ajastimen taso boss levelin alussa:",
            currentTimerLevel,
            "| Pelimuoto:",
            GameTimer.getGameMode()
        );

        if (currentTimerLevel === null) {
            if (!GameTimer.startLevel(bossTimerLevel)) {
                console.error("Boss Level timer could not be started.");
                this.scene.start("MenuScene");
                return;
            }
        } else if (currentTimerLevel === bossTimerLevel) {
            if (!GameTimer.isRunning()) {
                GameTimer.resume();
            }
        } else {
            console.error(
                "Unexpected timer level:",
                currentTimerLevel
            );
            this.scene.start("MenuScene");
            return;
        }


        const previousState =
            StoryModeManager.getLevelState(this.scene.key) ?? {};

        return StoryModeManager.saveLevelState(this.scene.key, {
            ...previousState,
            x: this.fox?.x ?? previousState.x ?? GAME_WIDTH * 0.18,
            y: this.fox?.y ?? previousState.y ?? GAME_HEIGHT - 105,
            playerFacing: this.playerFacing,
            playerLives: this.playerLives,
            bonusHeartCollected: this.bonusHeartCollected,
            score: this.score,
            bossX: this.boss?.x ?? previousState.bossX ?? GAME_WIDTH * 0.72,
            bossY: this.boss?.y ?? previousState.bossY ?? GAME_HEIGHT * 0.28,
            bossLives: this.bossLives,
            bossDefeated: this.bossDefeated,
            bossInvulnerable: false,
            playerInvulnerable: false
        });
    }

    showSavePopup() {
        if (this.popupOpen) return;
        this.popupOpen = true;
        GameTimer.pause();
        if (!this.isLevelMode) {
            StoryModeManager.pauseTimer();
        }
        this.physics.pause();

        const items = [];

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
        items.push(panel);

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
        items.push(title);

        const closePopup = () => {
            items.forEach(item => item.destroy());
            this.popupOpen = false;
            this.bossMechanics?.resume();
            if (!this.gameOver) {
                this.physics.resume();
                GameTimer.resume();
                if (!this.isLevelMode) {
                    StoryModeManager.resumeTimer();
                }
            }
        };

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
            items.push(button);
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

                    const stateSaved = this.saveBossState();

                    if (!stateSaved) {
                        window.alert("Boss Level -tilan tallentaminen epäonnistui.");
                        closePopup();
                        return;
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
            () => this.exitWithoutSaving()
        );
        addPopupButton(
            GAME_HEIGHT / 2 + 90,
            "CANCEL",
            closePopup
        );
    }
    
    restartBossLevel() {
        GameTimer.reset();
        GameTechnic.lives = 3;

        if (this.isLevelMode) {
            this.scene.restart();
        } else {
            StoryModeManager.start(3);
            this.scene.start("Level1Scene");
        }
    }

    exitWithoutSaving() {
        if (this.levelMusic) {
            this.levelMusic.stop();
        }
        GameTimer.reset();
        if (!this.isLevelMode) {
            StoryModeManager.reset();
        }
        this.scene.start("MenuScene");
    }

    cleanup() {
        this.bossMechanics?.stop();
        this.input.off("pointerdown", this.shoot, this);
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.enemyBullets?.children?.entries?.slice().forEach(bullet => {
            bullet.destroy();
        });
        this.playerBullets?.children?.entries?.slice().forEach(bullet => {
            bullet.destroy();
        });
    }

}
