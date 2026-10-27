import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { ScoreManager } from "./ScoreManager.js";

export class EndingScene extends Phaser.Scene {
    constructor() {
        super("EndingScene");
        this.transitionStarted = false;
        this.fireflies = [];
        this.sadAnimals = [];
        this.storyScoreSaved = false;
        this.leavingSummary = false;
        this.namePopupOpen = false;
        this.nameInputElement = null;
    }

    preload() {
        this.load.image("ending-altar", "assets/images/backgrounds/ending-altar.webp");
        this.load.image("fox-sit-back", "assets/images/fox/fox-sit-back.webp");
        this.load.image("fox-avatar", "assets/images/fox/fox-avatar.webp");
        this.load.image("ending-final", "assets/images/backgrounds/ending-final.webp");
        this.load.image("dark-forest", "assets/images/dark-forest.webp");
        this.load.image("forest-heart", "assets/images/forest-heart.webp");

        this.load.image("wolf-sad", "assets/images/wolf/wolf-sad.webp");
        this.load.image("owl-sad", "assets/images/owl/owl-sad.webp");
        this.load.image("rabbit-sad", "assets/images/rabbit/rabbit-sad.webp");
        this.load.image("deer-sad", "assets/images/deer/deer-sad.webp");
        this.load.image("thank-you", "assets/images/backgrounds/thank-you.webp");
        // EndingScene-musiikit
        this.load.audio("cave-music", "assets/audio/cave.mp3");
        this.load.audio("end-sad-music", "assets/audio/end-sad.mp3");
        this.load.audio("forest-heart-music", "assets/audio/forest-heart.mp3");
        // EndingScene-äänitehosteet
        this.load.audio("flash-sound", "assets/audio/flash.mp3");
        this.load.audio("rockfall1-sound", "assets/audio/rockfall1.mp3");
        this.load.audio("rockfall2-sound", "assets/audio/rockfall2.mp3");

        for (let i = 1; i <= 4; i++) {
            const frame = String(i).padStart(2, "0");
            this.load.image(
                `deer-${frame}`,
                `assets/images/deer/deer-${frame}.webp`
            );
        }

        for (let i = 1; i <= 6; i++) {
            const frame = String(i).padStart(2, "0");
            this.load.image(
                `owl-${frame}`,
                `assets/images/owl/owl-${frame}.webp`
            );
        }

        for (let i = 1; i <= 3; i++) {
            const frame = String(i).padStart(2, "0");

            this.load.image(
                `rabbit-${frame}`,
                `assets/images/rabbit/rabbit-${frame}.webp`
            );

            this.load.image(
                `wolf-${frame}`,
                `assets/images/wolf/wolf-${frame}.webp`
            );
        }

        this.load.on("loaderror", (file) => {
            console.error(
                "EndingScene-kuvan lataaminen epäonnistui:",
                file.key,
                file.src
            );
        });
    }

    create() {
        this.transitionStarted = false;
        this.fireflies = [];
        this.sadAnimals = [];
        this.storyScoreSaved = false;
        this.leavingSummary = false;
        this.namePopupOpen = false;
        this.nameInputElement = null;
        this.scoreSummaryShown = false;
        this.endingSkipped = false;
        this.theEndStarted = false;
        // Käynnistetään luolamusiikki EndingScenen alussa.
        this.caveMusic = this.sound.add("cave-music", {
            loop: true,
            volume: 0.5
        });

        this.caveMusic.play();

        this.input.keyboard.on("keydown-ESC", () => this.skipEnding());

        const blackScreen = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000
        )
            .setDepth(100)
            .setAlpha(1);

        this.altar = this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "ending-altar"
        )
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(0)
            .setAlpha(0);

        this.crystalGlow = this.add.ellipse(
            640, 355, 90, 130, 0xff1738, 0.25
        )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(1)
            .setAlpha(0);

        this.crystalCore = this.add.ellipse(
            640, 335, 35, 70, 0xff334f, 0.2
        )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(2)
            .setAlpha(0);

        this.fox = this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT * 0.75,
            "fox-sit-back"
        )
            .setOrigin(0.5, 0.5)
            .setDepth(5)
            .setAlpha(0)
            .setScale(0.13);

        this.tweens.add({
            targets: this.fox,
            y: this.fox.y - 5,
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });

        this.tweens.add({
            targets: blackScreen,
            alpha: 0,
            duration: 1800,
            ease: "Sine.easeInOut",
            onComplete: () => blackScreen.destroy()
        });

        this.tweens.add({
            targets: this.altar,
            alpha: 1,
            duration: 2200,
            ease: "Sine.easeInOut",
            onComplete: () => this.startCrystalAnimation()
        });

        this.tweens.add({
            targets: this.fox,
            alpha: 1,
            duration: 1800,
            delay: 1000,
            ease: "Sine.easeInOut"
        });

        this.createBirdEyeGlow();
        this.createAltarFlames();

        this.time.delayedCall(5000, () => {
            this.showEndingStory();
        });

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.cleanup,
            this
        );
    }

    skipEnding() {
        if (this.endingSkipped || this.scoreSummaryShown) return;

        this.endingSkipped = true;

        // Pysäytetään animaatiot ja ajastimet.
        this.tweens.killAll();
        this.time.removeAllEvents();

        // Pysäytetään loppukohtauksen musiikit.
        this.caveMusic?.stop();
        this.sadMusic?.stop();
        this.forestHeartMusic?.stop();

        // Poistetaan vanhat tarinaelementit näkyvistä.
        this.children.list.forEach(child => {
            if (child.active) {
                child.setVisible(false);
            }
        });

        // Näytetään THE END ja jatketaan normaalisti.
        this.showTheEnd();
    }

    // SURULLISET ELÄIMET
    createSadAnimals() {
        this.destroySadAnimals();

        const animals = [
            { key: "deer-sad", x: 1120, y: 578, scale: 0.13 },
            { key: "owl-sad", x: 880, y: 180, scale: 0.04 },
            { key: "rabbit-sad", x: 160, y: 510, scale: 0.05 },
            { key: "wolf-sad", x: 400, y: 510, scale: 0.09 }
        ];

        animals.forEach((animal, index) => {
            const sprite = this.add.image(
                animal.x,
                animal.y,
                animal.key
            )
                .setScale(animal.scale)
                .setOrigin(0.5, 1)
                .setDepth(2)
                .setAlpha(0);

            this.sadAnimals.push(sprite);

            this.tweens.add({
                targets: sprite,
                alpha: 1,
                duration: 1200,
                delay: index * 250,
                ease: "Sine.easeInOut"
            });

            this.tweens.add({
                targets: sprite,
                y: sprite.y - 5,
                duration: 4000,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        });
    }

    destroySadAnimals() {
        if (!this.sadAnimals) return;

        this.sadAnimals.forEach(animal => {
            if (animal?.active) {
                animal.destroy();
            }
        });

        this.sadAnimals = [];
    }

    // KETUN ILMESTYMINEN
    showFoxArrival() {
        const x = 770;
        const y = 665;

        if (this.fox?.active) {
            this.fox.destroy();
        }

        const flash = this.add.circle(
            x,
            y - 35,
            18,
            0x65dfff,
            1
        )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(6);

        this.tweens.add({
            targets: flash,
            scale: 7,
            alpha: 0,
            duration: 900,
            ease: "Sine.easeOut",

            onComplete: () => {
                flash.destroy();

                this.fox = this.add.image(
                    x,
                    y,
                    "fox-sit-back"
                )
                    .setOrigin(0.5, 1)
                    .setScale(0.13)
                    .setAlpha(0)
                    .setDepth(5);

                this.tweens.add({
                    targets: this.fox,
                    y: y - 5,
                    duration: 4000,
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut"
                });

                this.tweens.add({
                    targets: this.fox,
                    alpha: 1,
                    duration: 2000,
                    ease: "Sine.easeInOut",

                    onComplete: () => {
                        this.time.delayedCall(500, () => {
                            this.showEndingFinalStory();
                        });
                    }
                });
            }
        });
    }

    // ==========================================
    // PUNAISEN SILMÄHEHKUN ANIMAATIO
    createBirdEyeGlow() {
        const eyes = [
            { x: 620, y: 206 },
            { x: 665, y: 206 }
        ];

        eyes.forEach((eye, index) => {
            const glow = this.add.ellipse(
                eye.x,
                eye.y,
                18,
                12,
                0xff1738,
                0.45
            )
                .setDepth(4)
                .setBlendMode(Phaser.BlendModes.ADD);

            const core = this.add.ellipse(
                eye.x,
                eye.y,
                7,
                5,
                0xff526b,
                0.7
            )
                .setDepth(5)
                .setBlendMode(Phaser.BlendModes.ADD);

            this.tweens.add({
                targets: glow,
                alpha: { from: 0.2, to: 0.6 },
                scaleX: { from: 0.85, to: 1.15 },
                duration: 1800 + index * 250,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });

            this.tweens.add({
                targets: core,
                alpha: { from: 0.45, to: 0.85 },
                duration: 1600 + index * 200,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        });
    }

    createAltarFlames() {
        this.altarFlames = [];

        const braziers = [
            { x: 435, y: 385 },
            { x: 845, y: 385 }
        ];

        braziers.forEach((brazier, index) => {
            const outerFlame = this.add.ellipse(
                brazier.x,
                brazier.y,
                24,
                48,
                0xff4b12,
                0.4
            )
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(3);

            const innerFlame = this.add.ellipse(
                brazier.x,
                brazier.y + 4,
                12,
                30,
                0xffd45c,
                0.55
            )
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(4);

            this.altarFlames.push(outerFlame, innerFlame);

            this.tweens.add({
                targets: outerFlame,
                scaleX: { from: 0.9, to: 1.08 },
                scaleY: { from: 0.92, to: 1.08 },
                alpha: { from: 0.25, to: 0.5 },
                duration: 1000 + index * 150,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });

            this.tweens.add({
                targets: innerFlame,
                scaleX: { from: 0.9, to: 1.05 },
                scaleY: { from: 0.9, to: 1.1 },
                alpha: { from: 0.35, to: 0.65 },
                y: brazier.y - 2,
                duration: 850 + index * 120,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        });
    }

    startCrystalAnimation() {
        this.tweens.add({
            targets: [this.crystalGlow, this.crystalCore],
            alpha: { from: 0.15, to: 0.8 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
    }

    // ENSIMMÄINEN TARINALAATIKKO
    showEndingStory() {
        const x = GAME_WIDTH / 2;
        const y = 590;
        const width = 780;
        const height = 150;

        const box = this.add.rectangle(
            x, y, width, height, 0x10172b, 0.95
        )
            .setStrokeStyle(2, 0x8ca9e8, 0.9)
            .setDepth(1000);

        const text = this.add.text(
            x,
            y - 12,
            "At last, it's all over. Now I must take the crystal\n" +
            "and escape before everything collapses!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "19px",
                color: "#f0f4ff",
                align: "center",
                lineSpacing: 5,
                wordWrap: { width: width - 50 }
            }
        )
            .setOrigin(0.5)
            .setDepth(1001);

        const avatar = this.add.image(
            155, y - 25, "fox-avatar"
        )
            .setScale(0.15)
            .setDepth(1002);

        const hint = this.add.text(
            x + width / 2 - 18,
            y + height / 2 - 20,
            "ENTER ↵",
            {
                fontFamily: "Arial",
                fontSize: "13px",
                color: "#b9c8f5"
            }
        )
            .setOrigin(1, 0.5)
            .setDepth(1001);

        this.input.keyboard.once("keydown-ENTER", () => {
            if (this.transitionStarted) return;
            this.transitionStarted = true;

            box.destroy();
            text.destroy();
            avatar.destroy();
            hint.destroy();

            this.input.keyboard.enabled = false;

            const flash = this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                GAME_WIDTH,
                GAME_HEIGHT,
                0x65dfff
            )
                .setAlpha(0)
                .setDepth(2000);

            this.sound.play("flash-sound");
            this.tweens.add({
                targets: flash,
                alpha: 1,
                duration: 200,
                yoyo: true,
                hold: 100,

                onComplete: () => {
                    flash.destroy();

                    this.altar
                        .setTexture("ending-final")
                        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
                        .setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
                        .setDepth(0)
                        .setVisible(true)
                        .setAlpha(1);

                    if (this.altarFlames) {
                        this.altarFlames.forEach(flame => {
                            if (flame?.active) {
                                this.tweens.killTweensOf(flame);
                                flame.destroy();
                            }
                        });

                        this.altarFlames = [];
                    }

                    this.children.list.forEach(child => {
                        if (child !== this.altar && child !== this.fox) {
                            child.setVisible(false);
                        }
                    });

                    this.cameras.main.shake(2500, 0.008);
                    // Kallionsortuman äänet alkavat tärinän kanssa.
                    this.sound.play("rockfall1-sound");

                    this.time.delayedCall(100, () => {
                        this.sound.play("rockfall2-sound");
                    });

                    this.time.delayedCall(2500, () => {
                        const blackScreen = this.add.rectangle(
                            GAME_WIDTH / 2,
                            GAME_HEIGHT / 2,
                            GAME_WIDTH,
                            GAME_HEIGHT,
                            0x000000
                        )
                            .setAlpha(0)
                            .setDepth(2001);

                        this.tweens.add({
                            targets: blackScreen,
                            alpha: 1,
                            duration: 700,
                            ease: "Sine.easeIn",

                            onComplete: () => {
                                this.fox.setVisible(false);

                                this.altar
                                    .setTexture("dark-forest")
                                    .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
                                    .setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
                                    .setAlpha(1)
                                    .setVisible(true);

                                // Vaihdetaan surulliseen musiikkiin.
                                this.caveMusic?.stop();
                                this.sadMusic = this.sound.add("end-sad-music", {
                                    loop: true,
                                    volume: 0.5
                                });

                                this.sadMusic.play();
                                this.createSadAnimals();

                                this.tweens.add({
                                    targets: blackScreen,
                                    alpha: 0,
                                    duration: 3000,
                                    ease: "Sine.easeInOut",
                                    onComplete: () => blackScreen.destroy()
                                });

                                this.time.delayedCall(3000, () => {
                                    this.showFoxArrival();
                                });
                            }
                        });
                    });
                }
            });
        });
    }

    // LOPPUTARINA JA PALUU ELÄVÄÄN METSÄÄN
    showEndingFinalStory() {
        const x = GAME_WIDTH / 2;
        const y = 590;
        const width = 780;
        const height = 150;

        const box = this.add.rectangle(
            x, y, width, height, 0x10172b, 0.95
        )
            .setStrokeStyle(2, 0x8ca9e8, 0.9)
            .setDepth(1000)
            .setAlpha(0);

        const text = this.add.text(
            x,
            y - 12,
            "The forest creatures had feared the worst, but their Guardian had returned alive, carrying the Crystal with them.\n" +
            "Now, it was time to restore the Crystal to its rightful place and bring the magic back to the forest.",
            {
                fontFamily: "Georgia, serif",
                fontSize: "19px",
                color: "#f0f4ff",
                align: "center",
                lineSpacing: 5,
                wordWrap: { width: width - 50 }
            }
        )
            .setOrigin(0.5)
            .setDepth(1001)
            .setAlpha(0);

        const hint = this.add.text(
            x + width / 2 - 18,
            y + height / 2 - 20,
            "ENTER ↵",
            {
                fontFamily: "Arial",
                fontSize: "13px",
                color: "#b9c8f5"
            }
        )
            .setOrigin(1, 0.5)
            .setDepth(1001)
            .setAlpha(0);

        this.tweens.add({
            targets: [box, text, hint],
            alpha: 1,
            duration: 800,
            ease: "Sine.easeInOut"
        });

        this.input.keyboard.enabled = true;

        this.input.keyboard.once("keydown-ENTER", () => {
            box.destroy();
            text.destroy();
            hint.destroy();

            this.input.keyboard.enabled = false;

            const flash = this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                GAME_WIDTH,
                GAME_HEIGHT,
                0x8af5ff,
                0
            )
                .setScrollFactor(0)
                .setDepth(2000);

            this.tweens.add({
                targets: flash,
                alpha: 1,
                duration: 600,
                ease: "Sine.easeOut",

                onComplete: () => {
                    this.altar
                        .setTexture("forest-heart")
                        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
                        .setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
                        .setDepth(0)
                        .setVisible(true)
                        .setAlpha(1);

                    // Häivytetään surullinen musiikki hitaasti pois.
                    if (this.sadMusic?.isPlaying) {
                        this.tweens.add({
                            targets: this.sadMusic,
                            volume: 0,
                            duration: 2500,
                            ease: "Sine.easeInOut",
                            onComplete: () => {
                                this.sadMusic.stop();
                            }
                        });
                    }

                    // Uusi musiikki alkaa hiljaa ja voimistuu vähitellen.
                    this.forestHeartMusic = this.sound.add("forest-heart-music", {
                        loop: true,
                        volume: 0
                    });

                    this.forestHeartMusic.play();

                    this.tweens.add({
                        targets: this.forestHeartMusic,
                        volume: 0.5,
                        duration: 3500,
                        ease: "Sine.easeInOut"
                    });


                    this.destroySadAnimals();
                    [
                        this.deerPair,
                        this.owl,
                        this.rabbit,
                        this.wolf
                    ].forEach(animal => {
                        if (animal?.active) {
                            animal.destroy();
                        }
                    });

                    this.createAnimalAnimations();
                    this.createForestAnimals();
                    this.createFireflies();

                    this.time.delayedCall(250, () => {
                        this.tweens.add({
                            targets: flash,
                            alpha: 0,
                            duration: 1500,
                            ease: "Sine.easeInOut",
                            onComplete: () => {
                                flash.destroy();
                                this.input.keyboard.enabled = true;
                                this.showRestoredForestStory();
                            }
                        });
                    });
                }
            });
        });
    }

    showRestoredForestStory() {
        const x = GAME_WIDTH / 2;
        const y = 570;
        const width = 900;
        const height = 190;

        const box = this.add.rectangle(
            x, y, width, height, 0x10172b, 0.95
        )
            .setStrokeStyle(2, 0x8ca9e8, 0.9)
            .setDepth(1000)
            .setAlpha(0);

        const text = this.add.text(
            x,
            y - 15,
            "With the Crystal restored, magic once again flowed through the forest. " +
            "The trees glowed with life, and the creatures rejoiced, knowing their home was safe.\n\n" +
            "The Guardian had fulfilled their promise. And so, peace returned to the enchanted forest.",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#f0f4ff",
                align: "center",
                lineSpacing: 5,
                wordWrap: { width: width - 70 }
            }
        )
            .setOrigin(0.5)
            .setDepth(1001)
            .setAlpha(0);

        const hint = this.add.text(
            x + width / 2 - 20,
            y + height / 2 - 18,
            "ENTER ↵",
            {
                fontFamily: "Arial",
                fontSize: "13px",
                color: "#b9c8f5"
            }
        )
            .setOrigin(1, 0.5)
            .setDepth(1001)
            .setAlpha(0);

        this.tweens.add({
            targets: [box, text, hint],
            alpha: 1,
            duration: 900,
            ease: "Sine.easeInOut"
        });

        this.input.keyboard.enabled = true;

        this.input.keyboard.once("keydown-ENTER", () => {
            box.destroy();
            text.destroy();
            hint.destroy();

            this.input.keyboard.enabled = false;
            this.showTheEnd();
        });
    }

    showTheEnd() {
        if (this.theEndStarted) return;
        this.theEndStarted = true;
        // Häivytetään nykyinen musiikki THE END -kohdassa.
        const currentMusic = this.forestHeartMusic;

        if (currentMusic?.isPlaying) {
            this.tweens.add({
                targets: currentMusic,
                volume: 0,
                duration: 2000,
                ease: "Sine.easeInOut",
                onComplete: () => {
                    currentMusic.stop();
                }
            });
        }
        const blackScreen = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000
        )
            .setDepth(2000)
            .setAlpha(0);

        const title = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "THE END",
            {
                fontFamily: "Georgia, serif",
                fontSize: "64px",
                color: "#d9f6ff",
                fontStyle: "bold",
                stroke: "#4b8cff",
                strokeThickness: 3,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: "#65dfff",
                    blur: 25,
                    fill: true
                }
            }
        )
            .setOrigin(0.5)
            .setDepth(2001)
            .setAlpha(0)
            .setScale(0.8);

        this.tweens.add({
            targets: blackScreen,
            alpha: 1,
            duration: 1000,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.tweens.add({
                    targets: title,
                    alpha: 1,
                    scale: 1,
                    duration: 1800,
                    ease: "Sine.easeOut",
                    onComplete: () => {
                        this.time.delayedCall(2500, () => {
                            this.children.list.forEach(child => {
                                if (child !== blackScreen && child !== title) {
                                    child.setVisible(false);
                                }
                            });

                            this.showThankYouScreen(blackScreen, title);
                        });
                    }
                });
            }
        });
    }

    showThankYouScreen(blackScreen, title) {
        blackScreen.destroy();
        title.destroy();

        const thankYou = this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "thank-you"
        )
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(2100)
            .setAlpha(0);

        this.tweens.add({
            targets: thankYou,
            alpha: 1,
            duration: 500,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.time.delayedCall(2500, () => {
                    this.showScoreSummary();
                });
            }
        });
    }

    // ==========================================
    // LOPPUTULOS JA TALLENNUS
    // ==========================================

    showScoreSummary() {
        if (this.scoreSummaryShown) return;
        this.scoreSummaryShown = true;

        // Pysäytetään Story Moden kokonaisaika.
        StoryModeManager.pauseTimer();
                try {
            localStorage.setItem("spiritFoxStoryCompleted", "true");
        } catch (error) {
            console.warn("Story Moden suorittamista ei voitu tallentaa:", error);
        }
        const summary = StoryModeManager.getSummary();


        this.summaryObjects = [];

        const add = (object) => {
            object.setDepth(2200);
            this.summaryObjects.push(object);
            return object;
        };

        add(
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                900,
                610,
                0x10172b,
                0.78
            ).setStrokeStyle(2, 0x5797d1, 0.75)
        );

        add(this.add.text(
            GAME_WIDTH / 2,
            80,
            "✦ SPIRIT FOX: THE LOST MAGIC ✦",
            {
                fontFamily: "Arial",
                fontSize: "21px",
                color: "#8feaff"
            }
        ).setOrigin(0.5));

        add(this.add.text(
            GAME_WIDTH / 2,
            130,
            "Adventure Complete!",
            {
                fontFamily: "Arial",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#e5f5ff"
            }
        ).setOrigin(0.5));

        add(this.add.text(
            GAME_WIDTH / 2,
            190,
            "The forest is magical again.",
            {
                fontFamily: "Arial",
                fontSize: "23px",
                color: "#b9c8e8"
            }
        ).setOrigin(0.5));

        add(this.add.rectangle(
            GAME_WIDTH / 2,
            235,
            830,
            2,
            0x456b96
        ));

        // Pistekortti.
        add(this.add.rectangle(
            390,
            340,
            340,
            120,
            0x111c32,
            0.82
        ).setStrokeStyle(2, 0x3976a7, 0.8));

        add(this.add.text(390, 300, "◇", {
            fontSize: "28px",
            color: "#65eaff"
        }).setOrigin(0.5));

        add(this.add.text(390, 330, "YOUR FINAL SCORE", {
            fontSize: "16px",
            color: "#b9c8e8"
        }).setOrigin(0.5));

        add(this.add.text(390, 370,
            `${Number(summary.totalScore || 0).toLocaleString("en-US")} / 295`, {
                fontSize: "34px",
                fontStyle: "bold",
                color: "#83eaff"
            }).setOrigin(0.5));

        // Peliaikakortti.
        add(this.add.rectangle(
            850,
            340,
            340,
            120,
            0x111c32,
            0.82
        ).setStrokeStyle(2, 0x7862ad, 0.8));

        add(this.add.text(850, 300, "◷", {
            fontSize: "28px",
            color: "#bca6ff"
        }).setOrigin(0.5));

        add(this.add.text(850, 330, "TIME PLAYED", {
            fontSize: "16px",
            color: "#b9c8e8"
        }).setOrigin(0.5));

        add(this.add.text(
            850,
            370,
            summary.formattedTime || "00:00",
            {
                fontSize: "28px",
                fontStyle: "bold",
                color: "#d7c5ff"
            }
        ).setOrigin(0.5));

        add(this.add.text(
            GAME_WIDTH / 2,
            445,
            "Add your score to the leaderboard?",
            {
                fontSize: "25px",
                color: "#eee0ff"
            }
        ).setOrigin(0.5));

        const yesButton = add(this.add.rectangle(
            GAME_WIDTH / 2,
            505,
            800,
            60,
            0x285d86
        ).setInteractive({ useHandCursor: true }));

        const yesText = add(this.add.text(
            GAME_WIDTH / 2,
            512,
            "✦ YES, SAVE MY SCORE",
            {
                fontSize: "25px",
                color: "#ffffff"
            }
        ).setOrigin(0.5));

        yesButton.on("pointerover", () => yesButton.setFillStyle(0x3677a8));
        yesButton.on("pointerout", () => yesButton.setFillStyle(0x285d86));
        yesButton.on("pointerdown", () => this.showNamePopup());

        yesText.setInteractive({ useHandCursor: true });
        yesText.on("pointerdown", () => this.showNamePopup());

        const noButton = add(this.add.rectangle(
            GAME_WIDTH / 2,
            585,
            800,
            60,
            0x10172b
        ).setStrokeStyle(2, 0x7b8aa8)
        .setInteractive({ useHandCursor: true }));

        const noText = add(this.add.text(
            GAME_WIDTH / 2,
            589,
            "NO, THANK YOU",
            {
                fontSize: "25px",
                color: "#d6e0f3"
            }
        ).setOrigin(0.5));

        const returnToMenu = () => {
            if (this.leavingSummary) return;

            this.leavingSummary = true;
            StoryModeManager.pauseTimer();
            StoryModeManager.active = false;

            // Pysäytetään EndingScenen musiikit.
            this.caveMusic?.stop();
            this.sadMusic?.stop();
            this.forestHeartMusic?.stop();

            this.scene.start("MenuScene");
        };

        noButton.on("pointerdown", returnToMenu);
        noText.setInteractive({ useHandCursor: true });
        noText.on("pointerdown", returnToMenu);
    }

        showNamePopup() {
        if (this.namePopupOpen || this.storyScoreSaved) return;

        this.namePopupOpen = true;
        this.namePopupObjects = [];

        const add = (object) => {
            object.setDepth(2300);
            this.namePopupObjects.push(object);
            return object;
        };

        add(this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x050914,
            0.8
        ));

        add(this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            620,
            350,
            0x17213a,
            1
        ).setStrokeStyle(2, 0x5797d1));

        add(this.add.text(
            GAME_WIDTH / 2,
            280,
            "SAVE YOUR SCORE",
            {
                fontSize: "30px",
                fontStyle: "bold",
                color: "#baf5ff"
            }
        ).setOrigin(0.5));

        add(this.add.text(
            GAME_WIDTH / 2,
            330,
            "Enter your name for the leaderboard:",
            {
                fontSize: "18px",
                color: "#d7e5ff"
            }
        ).setOrigin(0.5));

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 20;
        input.placeholder = "Your name";
        input.autocomplete = "off";

        Object.assign(input.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "280px",
            padding: "12px",
            fontSize: "18px",
            textAlign: "center",
            color: "#ffffff",
            background: "#10172b",
            border: "2px solid #5797d1",
            borderRadius: "8px",
            outline: "none",
            zIndex: "10000"
        });

        document.body.appendChild(input);
        this.nameInputElement = input;

        // Estetään Phaserin näppäimistökäsittelyä häiritsemästä
        // HTML-tekstikentän kirjoittamista.
        const stopKeyboardPropagation = (event) => {
            event.stopPropagation();
        };

        [
            "keydown",
            "keyup",
            "keypress"
        ].forEach(eventName => {
            input.addEventListener(eventName, stopKeyboardPropagation);
        });

        input.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
        });

        input.focus();

        const closePopup = () => {
            this.namePopupObjects.forEach(object => {
                if (object?.active) object.destroy();
            });

            this.namePopupObjects = [];

            this.nameInputElement?.remove();
            this.nameInputElement = null;
            this.namePopupOpen = false;
        };

        const saveButton = add(this.add.rectangle(
            GAME_WIDTH / 2 - 115,
            480,
            200,
            55,
            0x285d86
        ).setInteractive({ useHandCursor: true }));

        const saveText = add(this.add.text(
            GAME_WIDTH / 2 - 115,
            480,
            "SAVE",
            {
                fontSize: "21px",
                color: "#ffffff"
            }
        ).setOrigin(0.5));

        const cancelButton = add(this.add.rectangle(
            GAME_WIDTH / 2 + 115,
            480,
            200,
            55,
            0x263149
        ).setStrokeStyle(2, 0x7b8aa8)
        .setInteractive({ useHandCursor: true }));

        const cancelText = add(this.add.text(
            GAME_WIDTH / 2 + 115,
            480,
            "CANCEL",
            {
                fontSize: "21px",
                color: "#ffffff"
            }
        ).setOrigin(0.5));

        const saveScore = () => {
            if (this.storyScoreSaved) return;

            const playerName = input.value.trim();

            if (!playerName) {
                input.focus();
                input.placeholder = "Please enter your name";
                return;
            }

            const summary = StoryModeManager.getSummary();

            const saved = ScoreManager.saveStoryResult(
                summary.totalTime,
                summary.totalScore,
                summary.levelResults,
                playerName
            );

            if (!saved) {
                input.placeholder = "Saving failed. Try again.";
                input.focus();
                return;
            }

            this.storyScoreSaved = true;
            StoryModeManager.pauseTimer();
            StoryModeManager.active = false;

            closePopup();
            this.scene.start("MenuScene");
        };

        saveButton.on("pointerdown", saveScore);
        saveText.setInteractive({ useHandCursor: true });
        saveText.on("pointerdown", saveScore);

        const cancel = () => {
            closePopup();
        };

        cancelButton.on("pointerdown", cancel);
        cancelText.setInteractive({ useHandCursor: true });
        cancelText.on("pointerdown", cancel);

        input.focus();
    }

    // ==========================================
    // ELÄINTEN ANIMAATIOT
    // ==========================================

    createAnimalAnimations() {
        const animations = [
            {
                key: "deer-nuzzle",
                frames: [
                    "deer-01", "deer-02", "deer-03",
                    "deer-04", "deer-03", "deer-02"
                ],
                frameRate: 1
            },
            {
                key: "owl-look",
                frames: [
                    "owl-01", "owl-02", "owl-03",
                    "owl-04", "owl-05", "owl-06", "owl-01"
                ],
                frameRate: 1
            },
            {
                key: "rabbit-idle",
                frames: [
                    "rabbit-01", "rabbit-02", "rabbit-01",
                    "rabbit-03", "rabbit-01"
                ],
                frameRate: 0.5
            },
            {
                key: "wolf-tail",
                frames: [
                    "wolf-01", "wolf-02", "wolf-02",
                    "wolf-01", "wolf-02", "wolf-03",
                    "wolf-02", "wolf-03", "wolf-02"
                ],
                frameRate: 1
            }
        ];

        for (const anim of animations) {
            if (!this.anims.exists(anim.key)) {
                this.anims.create({
                    key: anim.key,
                    frames: anim.frames.map(key => ({ key })),
                    frameRate: anim.frameRate,
                    repeat: -1
                });
            }
        }
    }

    createForestAnimals() {
        this.deerPair = this.add.sprite(
            1120, 570, "deer-01"
        )
            .setScale(0.13)
            .setOrigin(0.5, 1)
            .setDepth(2)
            .play("deer-nuzzle");

        this.owl = this.add.sprite(
            880, 160, "owl-01"
        )
            .setScale(0.04)
            .setDepth(2)
            .play("owl-look");

        this.rabbit = this.add.sprite(
            160, 470, "rabbit-01"
        )
            .setScale(0.05)
            .setDepth(2)
            .play("rabbit-idle");

        this.wolf = this.add.sprite(
            400, 450, "wolf-01"
        )
            .setScale(0.09)
            .setDepth(2)
            .play("wolf-tail");
    }

    // ==========================================
    // LENTÄVÄT VALOT
    // ==========================================

    createFireflies() {
        this.destroyFireflies();
        this.fireflies = [];

        for (let i = 0; i < 28; i++) {
            const x = Phaser.Math.Between(100, 1180);
            const y = Phaser.Math.Between(180, 650);
            const radius = Phaser.Math.FloatBetween(2.5, 4);

            const glow = this.add.circle(
                x, y, radius * 5, 0x36ffe0, 0.4
            )
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(3);

            const light = this.add.circle(
                x, y, radius, 0xbafff5, 1
            )
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(4);

            this.fireflies.push({
                glow,
                light,
                startX: x,
                startY: y,
                phase: Math.random() * Math.PI * 2,
                speed: Phaser.Math.FloatBetween(0.8, 1.4),
                drift: Phaser.Math.FloatBetween(25, 50)
            });
        }
    }

    destroyFireflies() {
        if (!this.fireflies) return;

        this.fireflies.forEach(fly => {
            if (fly.glow?.active) fly.glow.destroy();
            if (fly.light?.active) fly.light.destroy();
        });

        this.fireflies = [];
    }

    update(time) {
        if (!this.fireflies) return;

        this.fireflies.forEach(fly => {
            if (!fly.glow?.active || !fly.light?.active) return;

            const t = time / 1000 * fly.speed + fly.phase;
            const x = fly.startX + Math.sin(t) * fly.drift;
            const y = fly.startY + Math.cos(t * 0.7) * fly.drift;
            const pulse = (Math.sin(t * 2) + 1) / 2;

            fly.light
                .setPosition(x, y)
                .setAlpha(0.5 + pulse * 0.5);

            fly.glow
                .setPosition(x, y)
                .setAlpha(0.3 + pulse * 0.7)
                .setScale(0.8 + pulse * 0.7);
        });
    }

    // ==========================================
    // KOHTAUKSEN SIIVOUS
    // ==========================================

    cleanup() {
        this.tweens.killAll();
        this.time.removeAllEvents();

        this.nameInputElement?.remove();
        this.nameInputElement = null;
        this.namePopupOpen = false;

        this.destroyFireflies();
        this.destroySadAnimals();
    }
}