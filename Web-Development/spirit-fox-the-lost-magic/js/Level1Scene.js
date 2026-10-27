
import { GAME_WIDTH, GAME_HEIGHT, ASSETS } from "./GameData.js";
import { FoxMoves } from "./FoxMoves.js";
import { GameTechnic } from "./GameTechnic.js";
import { GameTimer } from "./GameTimer.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { ScoreManager } from "./ScoreManager.js";
import { formatTime } from "./TimeFormatter.js";
import { MenuMusic } from "./MenuMusic.js";

export class Level1Scene extends Phaser.Scene {
    constructor() {
        super("Level1Scene");
    }

    preload() {
        this.load.image("level1-background", ASSETS.level1Background);
        this.load.image("ground", "assets/images/ground.webp");
        this.load.image("platform-crystal", "assets/images/platforms/platform-crystal.webp");
        this.load.image("platform-crystal2", "assets/images/platforms/platform-crystal2.webp");
        this.load.image("fox-idle-left", "assets/images/fox/fox-idle-left.webp");
        this.load.image("fox-idle-right", "assets/images/fox/fox-idle-right.webp");
        this.load.image("fox-jump-right", ASSETS.foxJumpRight);
        this.load.image("fox-jump-left", ASSETS.foxJumpLeft);
        this.load.image("fox-run-right-1", "assets/images/fox/fox-run-right-1.webp");
        this.load.image("fox-run-right-2", "assets/images/fox/fox-run-right-2.webp");
        this.load.image("fox-run-left-1", "assets/images/fox/fox-run-left-1.webp");
        this.load.image("fox-run-left-2", "assets/images/fox/fox-run-left-2.webp");
        this.load.image("portal-level1", "assets/images/portal/portal-level1.webp");
        this.load.image("crystal-green", "assets/images/crystals/crystal-green.webp");
        this.load.image("crystal-red", "assets/images/crystals/crystal-red.webp");
        this.load.audio("level1-music", "assets/audio/level1.mp3");
        this.load.audio("collect-sound", "assets/audio/collect.mp3");
        this.load.audio("teleport-sound", "assets/audio/teleport.mp3");
    }

    create() {
        this.popupOpen = false;
        this.levelCompleted = false;

        this.gameMode = this.registry.get("gameMode") || "story";
        this.isLevelMode = this.gameMode === "level";

        if (!this.isLevelMode && StoryModeManager.active) {
            StoryModeManager.setCurrentLevel(this.scene.key);
        }

        this.createBackToMenuButton();

        if (!GameTimer.setGameMode(this.gameMode)) {
            console.error("Level 1: pelitilan asettaminen epäonnistui.");
            this.scene.start("MenuScene");
            return;
        }

        const currentTimerLevel = GameTimer.getCurrentLevel();
        if (currentTimerLevel === null) {
            GameTimer.startLevel("Level 1");
        } else if (currentTimerLevel === "Level 1") {
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

        // Pysäytetään päävalikon musiikki.
        MenuMusic.stop();
        // Käynnistetään Level 1:n musiikki.
        this.levelMusic = this.sound.add("level1-music", {
            loop: true,
            volume: 0.35
        });
        this.levelMusic.play();

        // Ajastimen näyttö.
        this.timeText = this.add.text(
            30,
            55,
            "Time: 00:00",
            {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#ffffff",
                stroke: "#080d25",
                strokeThickness: 4
            }
        )
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
            GameTimer.pause();

            if (this.levelMusic) {
                this.levelMusic.stop();
                this.levelMusic.destroy();
                this.levelMusic = null;
            }
        });

        // Tausta.
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "level1-background"
        ).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        // Näkyvä maataso.
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 75,
            "ground"
        )
            .setDisplaySize(GAME_WIDTH, 300)
            .setDepth(1);

        // Maatason fysiikka.
        this.ground = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 20,
            GAME_WIDTH,
            40,
            0xff00ff,
            0
        );

        this.physics.add.existing(this.ground, true);

        // Hyppytasot.
        this.platforms = this.physics.add.staticGroup();

        this.addPlatform(350, 540, "platform-crystal", 420, 100);
        this.addPlatform(1060, 590, "platform-crystal", 280, 70);
        this.addPlatform(270, 350, "platform-crystal", 300, 75);
        this.addPlatform(550, 210, "platform-crystal2", 280, 70);
        this.addPlatform(690, 460, "platform-crystal2", 340, 80);
        this.addPlatform(1040, 260, "platform-crystal2", 300, 75);

        // Tason portaali.
        this.portal = this.add.image(1100, 155, "portal-level1");
        this.portal.setDisplaySize(130, 150);
        this.portal.setDepth(4);

        // Vihreät kristallit (+10 pistettä).
        this.greenCrystals = this.physics.add.staticGroup();

        const greenCrystalPositions = [
            { x: 100, y: 280 },
            { x: 200, y: 430 },
            { x: 500, y: 100 },
            { x: 610, y: 380 },
            { x: 740, y: 250 },
            { x: 850, y: 535 }
        ];

        greenCrystalPositions.forEach((position, index) => {
            const crystal = this.greenCrystals.create(
                position.x,
                position.y,
                "crystal-green"
            );

            crystal.setName(`green-${index}`);

            crystal.setScale(0.06);
            crystal.setDepth(10);
            crystal.setVisible(true);
            crystal.setAlpha(1);
            crystal.refreshBody();
        });

        // Punaiset kristallit (+15 pistettä).
        this.redCrystals = this.physics.add.staticGroup();

        const redCrystalPositions = [
            { x: 730, y: 50 },
            { x: 1050, y: 300 }
        ];

        redCrystalPositions.forEach((position, index) => {
            const crystal = this.redCrystals.create(
                position.x,
                position.y,
                "crystal-red"
            );

            crystal.setName(`red-${index}`);
            crystal.setScale(0.06);
            crystal.refreshBody();
        });

        // Pelaajahahmo.
        const savedState = StoryModeManager.getLevelState(this.scene.key);

        const foxX = Number.isFinite(savedState?.x)
            ? savedState.x
            : 100;

        const foxY = Number.isFinite(savedState?.y)
            ? savedState.y
            : 600;

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

        // Elämiä ei nollata tässä. Uuden pelikierroksen alustus
        // tehdään erikseen ennen ensimmäisen tason käynnistämistä.
        this.gameTechnic = new GameTechnic(
            this,
            this.fox,
            this.greenCrystals,
            this.redCrystals
        );

        // Ohjeteksti.
        this.crystalHintText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 35,
            "Collect all crystals to unlock the portal!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffe9a8",
                stroke: "#080d25",
                strokeThickness: 4,
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(100);

        this.crystalHintText.setVisible(this.isLevelMode);

        // Portaalin fysiikka.
        this.physics.add.existing(this.portal, true);

        this.portalZone = this.add.rectangle(
            1100,
            155,
            55,
            90,
            0x00ff00,
            0
        );

        this.physics.add.existing(this.portalZone, true);

        // Portaalin käyttäminen.
        this.physics.add.overlap(
            this.fox,
            this.portalZone,
            () => {
                if (this.levelCompleted || this.popupOpen) {
                    return;
                }

                // Level Modessa kaikki kahdeksan kristallia
                // on kerättävä ennen portaalin käyttämistä.
                if (this.isLevelMode) {
                    const greenRemaining =
                        this.greenCrystals.countActive(true);

                    const redRemaining =
                        this.redCrystals.countActive(true);

                    const remaining = greenRemaining + redRemaining;

                    if (remaining > 0) {
                        this.crystalHintText.setText(
                            `Collect ${remaining} more crystal${remaining === 1 ? "" : "s"}!`
                        );

                        this.crystalHintText.setVisible(true);
                        return;
                    }
                }

                const result = GameTimer.finishLevel(
                    this.gameTechnic.score
                );
                if (!result) {
                    return;
                }
                this.levelCompleted = true;
                this.levelMusic?.stop();

                if (this.isLevelMode) {
                    this.showLevelCompletion(result);
                    return;
                }

                // Story Moden tulos lisätään kokonaisyhteenvetoon.
                StoryModeManager.addLevelResult(
                    "Level 1",
                    result.score,
                    result.time
                );

                this.sound.play("teleport-sound");
                this.time.delayedCall(500, () => {
                    this.scene.start("Level2Scene");
                });
            }
        );

        // Törmäykset maahan.
        this.physics.add.collider(this.fox, this.ground);

        // Törmäykset tasoihin.
        this.physics.add.collider(this.fox, this.platforms);

        // Tason otsikko.
        this.add.text(
            30,
            25,
            "LEVEL 1: THE ENCHANTED FOREST",
            {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#baf5ff",
                stroke: "#080d25",
                strokeThickness: 4
            }
        ).setDepth(10);
    }

    // Näytetään tulosikkuna Level Modessa.
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
            canSave ? 350 : 300,
            0x101b3a,
            0.98
        )
            .setStrokeStyle(3, 0x65d8f2)
            .setScrollFactor(0)
            .setDepth(2000);

        items.push(panel);

        const addText = (x, y, text, style = {}) => {
            const object = this.add.text(x, y, text, {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#ffffff",
                align: "center",
                stroke: "#080d25",
                strokeThickness: 2,
                ...style
            })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2001);

            items.push(object);
            return object;
        };

        addText(
            centerX,
            centerY - 115,
            "LEVEL 1 COMPLETED!",
            {
                fontSize: "30px",
                color: "#8be9f7",
                fontStyle: "bold"
            }
        );

        addText(
            centerX,
            centerY - 55,
            `Time: ${formatTime(result.time)}`
        );

        addText(
            centerX,
            centerY - 15,
            `Score: ${result.score}`
        );

        if (canSave) {
            addText(
                centerX,
                centerY + 30,
                "Your time qualifies for the Top 3!",
                {
                    fontSize: "18px",
                    color: "#baf5ff"
                }
            );
        } else {
            addText(
                centerX,
                centerY + 30,
                "Your time does not qualify for the Top 3.",
                {
                    fontSize: "17px",
                    color: "#d0d7e8"
                }
            );
        }

        const addButton = (x, y, label, callback) => {
            const button = this.add.text(x, y, label, {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff",
                backgroundColor: "#244b72",
                padding: { x: 16, y: 10 }
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
            return button;
        };

        const closeResultWindow = () => {
            items.forEach(item => {
                if (item?.active) {
                    item.destroy();
                }
            });
        };

        const returnToMenu = () => {
            closeResultWindow();
            GameTimer.discardPendingResult();
            this.scene.start("MenuScene");
        };

        if (canSave) {
            addButton(
                centerX - 115,
                centerY + 100,
                "SAVE RECORD",
                () => {
                    this.showNameEntry(
                        (cleanName) => {
                            const saved = GameTimer.savePendingResult(cleanName);

                            if (!saved) {
                                this.showLevelCompletion(result);
                                return;
                            }

                            closeResultWindow();
                            this.showRecordSavedMessage();
                        },
                        () => {
                            // CANCEL: jätetään tulosikkuna näkyviin.
                        }
                    );
                }
            );

            addButton(
                centerX + 135,
                centerY + 100,
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

    addPlatform(x, y, texture, width, height) {
        this.add.image(
            x,
            y - 25,
            texture
        )
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
            backButton.setStyle({ color: "#b8f5d0" });
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

        // HTML-kenttä mahdollistaa nimen kirjoittamisen selaimessa
        // ilman selaimen omaa prompt-ikkunaa.
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

            button.on("pointerover", () =>
                button.setStyle({ backgroundColor: "#376a96" })
            );
            button.on("pointerout", () =>
                button.setStyle({ backgroundColor: "#244b72" })
            );
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

    update() {
        this.foxMoves?.update();
    }
}
