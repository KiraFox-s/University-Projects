
import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { FoxMoves } from "./FoxMoves.js";
import { GameTechnic } from "./GameTechnic.js";
import { GameTimer } from "./GameTimer.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { ScoreManager } from "./ScoreManager.js";
import { formatTime } from "./TimeFormatter.js";
import { MenuMusic } from "./MenuMusic.js";

export class Level2Scene extends Phaser.Scene {
    constructor() {
        super("Level2Scene");
    }

    preload() {
        this.load.image("level2-background", "assets/images/backgrounds/level2.webp");
        this.load.image("platform-level2", "assets/images/platforms/platform-level2.webp");
        this.load.image("platform-falling", "assets/images/platforms/platform-falling.webp");
        this.load.image("crystal-green", "assets/images/crystals/crystal-green.webp");
        this.load.image("crystal-red", "assets/images/crystals/crystal-red.webp");
        this.load.image("fox-idle-left", "assets/images/fox/fox-idle-left.webp");
        this.load.image("fox-idle-right", "assets/images/fox/fox-idle-right.webp");
        this.load.image("fox-jump-right", "assets/images/fox/fox-jump-right.webp");
        this.load.image("fox-jump-left", "assets/images/fox/fox-jump-left.webp");
        this.load.image("fox-run-right-1", "assets/images/fox/fox-run-right-1.webp");
        this.load.image("fox-run-right-2", "assets/images/fox/fox-run-right-2.webp");
        this.load.image("fox-run-left-1", "assets/images/fox/fox-run-left-1.webp");
        this.load.image("fox-run-left-2", "assets/images/fox/fox-run-left-2.webp");
        this.load.image("spikes", "assets/images/spikes.webp");
        this.load.image("bat-left-up", "assets/images/enemies/bat-left-up.webp");
        this.load.image("bat-left-down", "assets/images/enemies/bat-left-down.webp");
        this.load.image("bat-right-up", "assets/images/enemies/bat-right-up.webp");
        this.load.image("bat-right-down", "assets/images/enemies/bat-right-down.webp");
        this.load.image("portal-level2", "assets/images/portal/portal-level2.webp");
        this.load.audio("level2-music", "assets/audio/level2.mp3");
        this.load.audio("hit-sound", "assets/audio/hit.mp3");
        this.load.audio("game-over-music", "assets/audio/game-over.mp3");
        this.load.audio("collect-sound", "assets/audio/collect.mp3");
        this.load.audio("teleport-sound", "assets/audio/teleport.mp3");
    }

    create() {
        MenuMusic.stop();

        this.levelMusic = this.sound.add("level2-music", {
            loop: true,
            volume: 0.35
        });

        this.levelMusic.play();
        this.popupOpen = false;
        this.levelCompleted = false;

        this.gameMode = this.registry.get("gameMode") || "story";
        this.isLevelMode = this.gameMode === "level";

        if (!this.isLevelMode && StoryModeManager.active) {
            StoryModeManager.setCurrentLevel(this.scene.key);
        }

        this.createBackToMenuButton();

        if (!GameTimer.setGameMode(this.gameMode)) {
            console.error("Game mode could not be set for Level 2.");
            this.scene.start("MenuScene");
            return;
        }

        const currentTimerLevel = GameTimer.getCurrentLevel();

        if (currentTimerLevel === null) {
            GameTimer.startLevel("Level 2");
        } else if (currentTimerLevel === "Level 2") {
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

        this.timeText = this.add.text(30, 55, "Time: 00:00", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#ffffff",
            stroke: "#08051a",
            strokeThickness: 4
        })
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100);

        this.timerEvent = this.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => {
                this.timeText.setText(
                    "Time: " + GameTimer.getFormattedTime()
                );
            }
        });

        this.events.on(Phaser.Scenes.Events.PAUSE, () => {
            GameTimer.pause();

            if (!this.isLevelMode) {
                StoryModeManager.pauseTimer();
            }
        });

        this.events.on(Phaser.Scenes.Events.RESUME, () => {
            GameTimer.resume();

            if (!this.isLevelMode) {
                StoryModeManager.resumeTimer();
            }
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.levelMusic?.stop();
            GameTimer.pause();
        });

        // Tausta.
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "level2-background"
        ).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        // Portaali.
        this.portal = this.add.image(1150, 185, "portal-level2")
            .setScale(0.12)
            .setDepth(4);

        // Lepakoiden animaatiot.
        if (!this.anims.exists("bat-left-fly")) {
            this.anims.create({
                key: "bat-left-fly",
                frames: [
                    { key: "bat-left-up" },
                    { key: "bat-left-down" }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.anims.exists("bat-right-fly")) {
            this.anims.create({
                key: "bat-right-fly",
                frames: [
                    { key: "bat-right-up" },
                    { key: "bat-right-down" }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        // Lepakko 1.
        this.bat1 = this.add.sprite(100, 260, "bat-right-up")
            .setScale(0.06)
            .setDepth(5);

        this.bat1.play("bat-right-fly");

        this.tweens.add({
            targets: this.bat1,
            x: 200,
            duration: 1800,
            ease: "Linear",
            yoyo: true,
            repeat: -1,
            onYoyo: () => this.bat1?.play("bat-left-fly"),
            onRepeat: () => this.bat1?.play("bat-right-fly")
        });

        // Lepakko 2.
        this.bat2 = this.add.sprite(950, 400, "bat-left-up")
            .setScale(0.06)
            .setDepth(5);

        this.bat2.play("bat-left-fly");

        this.tweens.add({
            targets: this.bat2,
            x: 1100,
            duration: 2200,
            ease: "Linear",
            yoyo: true,
            repeat: -1,
            onYoyo: () => this.bat2?.play("bat-left-fly"),
            onRepeat: () => this.bat2?.play("bat-right-fly")
        });

        // Piikkiansa.
        this.spikes = this.add.image(750, 720, "spikes")
            .setDisplaySize(160, 90)
            .setOrigin(0.5, 1)
            .setDepth(10);

        // Maatason fysiikka.
        this.ground = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 20,
            GAME_WIDTH,
            40,
            0x000000,
            0
        );

        this.physics.add.existing(this.ground, true);

        // Tavalliset tasot.
        this.platforms = this.physics.add.staticGroup();

        this.addPlatform(180, 580, "platform-level2", 300, 75);
        this.addPlatform(180, 330, "platform-level2", 320, 65);
        this.addPlatform(500, 230, "platform-level2", 240, 65);
        this.addPlatform(560, 450, "platform-level2", 260, 65);
        this.addPlatform(730, 150, "platform-level2", 240, 65);
        this.addPlatform(1100, 280, "platform-level2", 260, 65);
        this.addPlatform(1050, 470, "platform-level2", 230, 65);

        // Putoava taso.
        this.createFallingPlatform(840, 570);

        // Kettu.
        // Kettu: palautetaan tallennettu sijainti, jos sellainen on.
        const savedState = StoryModeManager.getLevelState(this.scene.key);

        const foxX = Number.isFinite(savedState?.x)
            ? savedState.x
            : 80;

        const foxY = Number.isFinite(savedState?.y)
            ? savedState.y
            : 620;

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

        this.physics.add.collider(this.fox, this.ground);
        this.physics.add.collider(this.fox, this.platforms);

        // Tason otsikko.
        this.add.text(30, 25, "LEVEL 2: THE DARK FOREST", {
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#e5baff",
            stroke: "#08051a",
            strokeThickness: 4
        }).setDepth(10);

        // Kristallit.
        this.greenCrystals = this.physics.add.staticGroup();
        this.redCrystals = this.physics.add.staticGroup();

        const greenPositions = [
            { x: 50, y: 380 },
            { x: 380, y: 150 },
            { x: 500, y: 290 },
            { x: 900, y: 310 },
            { x: 1000, y: 650 }
        ];

        greenPositions.forEach(({ x, y }, index) => {
            const crystal = this.greenCrystals.create(
                x,
                y,
                "crystal-green"
            );

            crystal.name = `green-${index}`;
            crystal.setScale(0.06);
            crystal.setDepth(10);
            crystal.refreshBody();
        });

        const redPositions = [
            { x: 1200, y: 350 },
            { x: 500, y: 480 }
        ];

        redPositions.forEach(({ x, y }, index) => {
            const crystal = this.redCrystals.create(
                x,
                y,
                "crystal-red"
            );

            crystal.name = `red-${index}`;
            crystal.setScale(0.06);
            crystal.setDepth(10);
            crystal.refreshBody();
        });

        // Pisteytys ja kristallien kerääminen.
        this.gameTechnic = new GameTechnic(
            this,
            this.fox,
            this.greenCrystals,
            this.redCrystals
        );

        this.createDangerVignette();

        // Level Moden ohjeteksti.
        this.crystalHintText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 35,
            "Collect all crystals to unlock the portal!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffe9a8",
                stroke: "#08051a",
                strokeThickness: 4,
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(100);

        this.crystalHintText.setVisible(this.isLevelMode);

        // Piikkiansan törmäysalue.
        this.spikesHitbox = this.add.rectangle(
            750,
            690,
            75,
            45,
            0xff0000,
            0
        );

        this.physics.add.existing(this.spikesHitbox, true);

        this.physics.add.overlap(
            this.fox,
            this.spikesHitbox,
            () => {
                this.sound.play("hit-sound", { volume: 0.6 });
                this.gameTechnic.loseLife();
            },
            null,
            this
        );

        // Lepakoiden fysiikka.
        this.physics.add.existing(this.bat1);
        this.bat1.body.setAllowGravity(false);
        this.bat1.body.setImmovable(true);

        this.physics.add.existing(this.bat2);
        this.bat2.body.setAllowGravity(false);
        this.bat2.body.setImmovable(true);

        this.physics.add.overlap(
            this.fox,
            this.bat1,
            () => {
                this.sound.play("hit-sound", { volume: 0.6 });
                this.gameTechnic.loseLife();
            },
            null,
            this
        );

        this.physics.add.overlap(
            this.fox,
            this.bat2,
            () => {
                this.sound.play("hit-sound", { volume: 0.6 });
                this.gameTechnic.loseLife();
            },
            null,
            this
        );

        // Putoavan tason törmäys.
        this.fallingCollider = this.physics.add.collider(
            this.fox,
            this.fallingPlatform,
            this.triggerPlatformFall,
            null,
            this
        );

        // Portaalin fysiikka.
        this.physics.add.existing(this.portal, true);

        // Portaalista Level 3:een.
        this.physics.add.overlap(
            this.fox,
            this.portal,
            () => {
                if (this.levelCompleted || this.popupOpen) {
                    return;
                }

                // Level Modessa kaikki seitsemän kristallia vaaditaan.
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

                const result = GameTimer.finishLevel(
                    this.gameTechnic.score
                );

                if (!result) {
                    this.levelCompleted = false;
                    return;
                }

                this.levelMusic?.stop();

                if (this.isLevelMode) {
                    this.showLevelCompletion(result);
                    return;
                }

                // Story Moden tasotulos lisätään kokonaispisteisiin.
                StoryModeManager.addLevelResult(
                    "Level 2",
                    result.score,
                    result.time
                );

                this.sound.play("teleport-sound");
                this.time.delayedCall(500, () => {
                    this.scene.start("Level3Scene");
                });
            },
            null,
            this
        );
    }

    addPlatform(x, y, texture, width, height) {
        this.add.image(x, y - 30, texture)
            .setDisplaySize(width, height)
            .setDepth(3);

        const hitbox = this.add.rectangle(
            x,
            y - height / 2 + 8,
            width,
            16,
            0x000000,
            0
        );

        this.physics.add.existing(hitbox, true);
        this.platforms.add(hitbox);
    }

    createFallingPlatform(x, y) {
        const savedState = StoryModeManager.getLevelState(
            this.scene.key
        );

        // Jos taso oli jo pudonnut, älä luo sitä uudelleen.
        if (savedState?.fallingPlatformFallen === true) {
            this.fallingPlatformImage = null;
            this.fallingPlatform = null;
            return;
        }

        this.fallingPlatformImage = this.add.image(
            x,
            y - 10,
            "platform-falling"
        )
            .setDisplaySize(260, 70)
            .setDepth(3);

        this.fallingPlatform = this.add.rectangle(
            x,
            y,
            260,
            16,
            0x000000,
            0
        );

        this.physics.add.existing(this.fallingPlatform, true);
        this.fallingPlatform.setData("falling", false);
    }

    triggerPlatformFall(fox, platform) {
        if (
            !this.fallingPlatformImage ||
            !platform ||
            platform.getData("falling")
        ) {
            return;
        }

        platform.setData("falling", true);

        // Tallennetaan tieto, että putoava taso on aktivoitu.
        const previousState =
            StoryModeManager.getLevelState(this.scene.key) ?? {};

        StoryModeManager.saveLevelState(this.scene.key, {
            ...previousState,
            fallingPlatformFallen: true
        });

        if (this.fallingCollider) {
            this.fallingCollider.destroy();
            this.fallingCollider = null;
        }

        this.tweens.add({
            targets: this.fallingPlatformImage,
            y: GAME_HEIGHT + 150,
            duration: 1200,
            ease: "Cubic.easeIn",
            onComplete: () => {
                this.fallingPlatformImage?.destroy();
                this.fallingPlatform?.destroy();

                this.fallingPlatformImage = null;
                this.fallingPlatform = null;
            }
        });
    }
    
    showGameOver(message = "YOU DIED") {
        if (this.gameOver) return;

        this.gameOver = true;
        this.sound.play("game-over-music", {
            volume: 0.5,
            loop: false
        });
        this.popupOpen = true;

        GameTimer.pause();

        if (!this.isLevelMode) {
            StoryModeManager.pauseTimer();
        }

        this.physics.pause();
        this.tweens.killAll();

        const centerX = GAME_WIDTH / 2;

        this.add.rectangle(
            centerX,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x08040d,
            0.85
        ).setDepth(100);

        this.add.text(centerX, 250, "GAME OVER", {
            fontFamily: "Georgia, serif",
            fontSize: "48px",
            color: "#ff6b91",
            stroke: "#210713",
            strokeThickness: 6
        })
            .setOrigin(0.5)
            .setDepth(101);

        this.add.text(centerX, 320, message, {
            fontFamily: "Georgia, serif",
            fontSize: "24px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 850 }
        })
            .setOrigin(0.5)
            .setDepth(101);

        const addButton = (y, label, callback) => {
            const button = this.add.text(centerX, y, label, {
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
        };

        addButton(410, "RESTART", () => {
            GameTimer.reset();
            GameTechnic.lives = 3;

            if (this.isLevelMode) {
                this.scene.restart();
            } else {
                StoryModeManager.start(3);
                this.scene.start("Level1Scene");
            }
        });

        addButton(475, "BACK TO MENU", () => {
            GameTimer.reset();

            if (!this.isLevelMode) {
                StoryModeManager.reset();
            }

            this.scene.start("MenuScene");
        });
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

        addText(centerY - 105, "LEVEL 2 COMPLETED!", {
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
            
            addButton(
                centerX - 115,
                centerY + 95,
                "SAVE RECORD",
                () => {
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
                }
            );

            addButton(
                centerX + 135,
                centerY + 95,
                "BACK TO MENU",
                returnToMenu
            );
        } else {
            addButton(
                centerX,
                centerY + 90,
                "BACK TO MENU",
                returnToMenu
            );
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
                if (item?.active) item.destroy();
            });
            input.remove();
        };

        const addButton = (x, label, callback) => {
            const button = this.add.text(x, centerY + 85, label, {
                fontFamily: "Georgia, serif",
                fontSize: "17px",
                color: "#ffffff",
                backgroundColor: "#244b72",
                padding: { x: 16, y: 10 }
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2201)
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
            backButton.setStyle({ color: "#b8f5f7" });
        });

        backButton.on("pointerout", () => {
            backButton.setStyle({ color: "#ffffff" });
        });

        backButton.on("pointerdown", () => {
            if (this.popupOpen) {
                return;
            }

            this.popupOpen = true;
            this.physics.pause();
            GameTimer.pause();

            if (!this.isLevelMode) {
                StoryModeManager.pauseTimer();
            }

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

            const addButton = (y, label, callback) => {
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
                this.physics.resume();
                GameTimer.resume();

                if (!this.isLevelMode) {
                    StoryModeManager.resumeTimer();
                }
            };

            addButton(
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

            addButton(
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

            addButton(
                GAME_HEIGHT / 2 + 90,
                "CANCEL",
                closePopup
            );
        });
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
        this.foxMoves?.update();
        this.updateDangerVignette();
    }
}
