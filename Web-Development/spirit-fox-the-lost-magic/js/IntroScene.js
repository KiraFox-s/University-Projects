import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { StoryModeManager } from "./StoryModeManager.js";

/**
 * Spirit Fox: The Lost Magic — alkuanimaatio.
 * Enter etenee dialogista seuraavaan tarinavaiheeseen.
 * Animaatiot ja ajastetut tapahtumat jatkuvat dialogin aikana.
 */
export class IntroScene extends Phaser.Scene {
    constructor() {
        super("IntroScene");
    }

    preload() {
        const image = (key, path) => this.load.image(key, path);

        image("forest-heart", "assets/images/forest-heart.webp");
        image("dark-forest", "assets/images/dark-forest.webp");
        image("tempel", "assets/images/tempel.webp");
        image("awake", "assets/images/awake.webp");
        image("owl-avatar", "assets/images/owl/owl-avatar.webp");
        image("owl-scary", "assets/images/owl/owl-scary.webp");
        image("fox-avatar", "assets/images/fox/fox-avatar.webp");
        image("fox-sit-1", "assets/images/fox/fox-sit-1.webp");
        image("fox-sit-2", "assets/images/fox/fox-sit-2.webp");
        // Intro-musiikit
        this.load.audio("forest-heart-music", "assets/audio/forest-heart.mp3");
        this.load.audio("danger-coming-music", "assets/audio/danger-coming.mp3");
        this.load.audio("thunder-sound", "assets/audio/thunder.mp3");
        this.load.audio("forest-after-music", "assets/audio/forest-after.mp3");
        this.load.audio("fox-crashing-sound", "assets/audio/fox-crashing.mp3");

        for (let i = 1; i <= 4; i++) {
            const frame = String(i).padStart(2, "0");
            image(`deer-${frame}`, `assets/images/deer/deer-${frame}.webp`);
        }

        image("deer-scary-01", "assets/images/deer/deer-scared-01.webp");
        image("deer-scary-02", "assets/images/deer/deer-scared-02.webp");

        for (let i = 1; i <= 6; i++) {
            const frame = String(i).padStart(2, "0");
            image(`owl-${frame}`, `assets/images/owl/owl-${frame}.webp`);
        }

        for (let i = 1; i <= 3; i++) {
            const frame = String(i).padStart(2, "0");
            image(`rabbit-${frame}`, `assets/images/rabbit/rabbit-${frame}.webp`);
        }

        image("rabbit-scary", "assets/images/rabbit/rabbit-scary.webp");

        for (let i = 1; i <= 3; i++) {
            const frame = String(i).padStart(2, "0");
            image(`wolf-${i}`, `assets/images/wolf/wolf-${frame}.webp`);
        }

        image("wolf-scary", "assets/images/wolf/wolf-scary.webp");

        for (let i = 1; i <= 2; i++) {
            const frame = String(i).padStart(2, "0");
            image(`rabbit2-${frame}`, `assets/images/rabbit2/rabbit2-${frame}.webp`);
        }

        image("rabbit2-scary", "assets/images/rabbit2/rabbit2-scary.webp");

        image("moon-cloud", "assets/images/clouds/moon-cloud.webp");
        image("cloud-up-left", "assets/images/clouds/cloud-up-left.webp");
        image("cloud-up-right", "assets/images/clouds/cloud-up-right.webp");
        image("cloud-down-left", "assets/images/clouds/cloud-down-left.webp");
        image("cloud-down-right", "assets/images/clouds/cloud-down-right.webp");

        image("villain01", "assets/images/villain/villain01.webp");
        image("villain02", "assets/images/villain/villain02.webp");

        this.load.on("loaderror", (file) => {
            console.error(
                "Intro-kuvan lataaminen epäonnistui:",
                file.key,
                file.src
            );
        });
    }

    create() {
        this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        this.sceneEnded = false;
        this.crystalFlickering = false;
        this.forestHeartMusic = this.sound.add("forest-heart-music", {
            volume: 0.5,
            loop: true
        });

        this.forestHeartMusic.play();
        this.flashInProgress = false;
        this.bloodwing = null;
        this.bloodwingAnimation = null;
        this.currentStoryObjects = [];
        this.fireflies = [];

        this.forestBackground = this.add.image(640, 360, "forest-heart")
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(0);

        this.crystalGlow = this.add.ellipse(
            660, 410, 100, 150, 0x20ffe0, 0.35
        )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(1);

        this.crystalCore = this.add.ellipse(
            660, 410, 48, 95, 0x75fff0, 0.4
        )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(1);

        this.createAnimations();
        this.createAnimals();
        this.createFireflies();

        this.input.keyboard.on("keydown-ESC", () => this.skipIntro());
        this.input.keyboard.on("keydown-ENTER", () => {
            this.continueCurrentStory();
        });

        this.input.on("pointerdown", () => {
            if (this.registry.get("touchControlsEnabled") === true) {
                this.continueCurrentStory();
            }
        });
        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.cleanup,
            this
        );

        this.showStory(
            "Once upon a time, there was an enchanted forest where magic flowed through every living thing.\n" +
            "Its creatures lived in harmony with the ancient magic that protected their home.\n" +
            "Hidden from humankind, this was a world no human had ever entered… nor ever would.",
            170,
            () => this.showCrystalStory()
        );
    }

    // ==================================================
    // ELÄINTEN ANIMAATIOT
    // ==================================================

    createAnimations() {
        const animations = [
            {
                key: "deer-nuzzle",
                frames: [
                    "deer-01", "deer-02", "deer-03",
                    "deer-04", "deer-03", "deer-02"
                ],
                rate: 1
            },
            {
                key: "owl-look",
                frames: [
                    "owl-01", "owl-02", "owl-03", "owl-04",
                    "owl-05", "owl-06", "owl-01"
                ],
                rate: 1
            },
            {
                key: "rabbit-idle",
                frames: [
                    "rabbit-01", "rabbit-02", "rabbit-01",
                    "rabbit-03", "rabbit-01"
                ],
                rate: 0.5
            },
            {
                key: "wolf-tail",
                frames: [
                    "wolf-1", "wolf-2", "wolf-2",
                    "wolf-1", "wolf-2", "wolf-3",
                    "wolf-2", "wolf-3", "wolf-2"
                ],
                rate: 1
            },
            {
                key: "rabbit2-idle",
                frames: ["rabbit2-01", "rabbit2-01", "rabbit2-02"],
                rate: 0.5
            }
        ];

        for (const anim of animations) {
            if (!this.anims.exists(anim.key)) {
                this.anims.create({
                    key: anim.key,
                    frames: anim.frames.map(key => ({ key })),
                    frameRate: anim.rate,
                    repeat: -1
                });
            }
        }
    }

    createAnimals() {
        this.deerPair = this.add.sprite(1120, 570, "deer-01")
            .setScale(0.13)
            .setOrigin(0.5, 1)
            .setDepth(2)
            .play("deer-nuzzle");

        this.owl = this.add.sprite(880, 160, "owl-01")
            .setScale(0.04)
            .setDepth(2)
            .play("owl-look");

        this.rabbit = this.add.sprite(160, 470, "rabbit-01")
            .setScale(0.05)
            .setDepth(2)
            .play("rabbit-idle");

        this.wolf = this.add.sprite(400, 450, "wolf-1")
            .setScale(0.09)
            .setDepth(2)
            .play("wolf-tail");

        this.rabbit2 = this.add.sprite(750, 640, "rabbit2-01")
            .setScale(0.05)
            .setDepth(2)
            .play("rabbit2-idle");
    }

    // ==================================================
    // KIILLOMADOT
    // ==================================================

    createFireflies() {
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

    continueCurrentStory() {
        if (
            this.sceneEnded ||
            !this.currentStoryBox ||
            !this.currentStoryContinue
        ) {
            return;
        }

        const continueCallback = this.currentStoryContinue;
        this.currentStoryContinue = null;

        this.destroyStory();
        continueCallback();
    }

    // ==================================================
    // TARINALAATIKKO
    // ==================================================

    showStory(
        message,
        boxHeight = 150,
        onEnter = () => {},
        baseY = 590,
        avatarKey = null,
        textColor = "#f0f4ff"
    ) {
        this.destroyStory();

        if (this.sceneEnded) return;

        const zoomed = this.cameras.main.zoom > 1.1;

        const width = zoomed ? 500 :780;
        const x = GAME_WIDTH / 2;
        const y = zoomed ? 545 : baseY;
        const actualBoxHeight = zoomed ? 110 : boxHeight;

        const box = this.add.rectangle(
            x, y, width, actualBoxHeight, 0x10172b, 0.95
        )
            .setStrokeStyle(2, 0x8ca9e8, 0.9)
            .setDepth(1000);

        const text = this.add.text(x, y - 12, message, {
            fontFamily: "Georgia, serif",
            fontSize: zoomed ? "13px" : "19px",
            color: textColor,
            align: "center",
            lineSpacing: 5,
            resolution: 2,
            wordWrap: { width: width - (zoomed ? 60 : 50) }
        })
            .setOrigin(0.5)
            .setDepth(1001);

        const hint = this.add.text(
            x + width / 2 - 18,
            y + actualBoxHeight / 2 - 20,
            "ENTER ↵",
            {
                fontFamily: "Arial",
                fontSize: zoomed ? "11px" : "13px",
                color: "#b9c8f5"
            }
        )
            .setOrigin(1, 0.5)
            .setDepth(1001);

        let avatar = null;

        if (avatarKey && this.textures.exists(avatarKey)) {
            const isFox = avatarKey === "fox-avatar";
            const avatarSize = isFox ? 210 : 150;

            avatar = this.add.image(
                isFox ? 155 : 150,
                y - 25,
                avatarKey
            )
                .setDisplaySize(
                    avatarSize,
                    avatarSize * (
                        this.textures.get(avatarKey).getSourceImage().height /
                        this.textures.get(avatarKey).getSourceImage().width
                    )
                )
                .setDepth(1002);
        }

        this.currentStoryObjects = [box, text, hint, avatar].filter(Boolean);
        this.currentStoryBox = box;
        this.currentStoryText = text;
        this.currentStoryHint = hint;
        this.currentStoryAvatar = avatar;

        // Tallennetaan tämän tarinavaiheen jatkotoiminto.
        this.currentStoryContinue = onEnter;

        // Näytetään kosketusohje vain, kun kosketusohjaimet ovat päällä.
        const touchControlsEnabled =
            this.registry.get("touchControlsEnabled") ?? false;

        if (touchControlsEnabled) {
            hint
                .setText("TAP TO CONTINUE")
                .setOrigin(0.5, 0.5)
                .setPosition(x, y + actualBoxHeight / 2 - 15);
        }
    }

    destroyStory() {
        if (this.currentStoryObjects) {
            this.currentStoryObjects.forEach(object => {
                if (object && object.active) object.destroy();
            });
        }

        this.currentStoryObjects = [];
        this.currentStoryBox = null;
        this.currentStoryText = null;
        this.currentStoryHint = null;
        this.currentStoryAvatar = null;
    }

    
    transitionToLevel1() {
        if (this.sceneEnded) return;

        this.forestHeartMusic?.stop();
        this.dangerComingMusic?.stop();
        this.forestAfterMusic?.stop();
        this.sound.stopAll();
        this.sceneEnded = true;
        this.destroyStory();

        // Merkitään Story Moden ensimmäinen taso aktiiviseksi.
        // Kokonaisaikaa ei nollata eikä käynnistetä uudelleen.
        if (StoryModeManager.active) {
            StoryModeManager.setCurrentLevel("Level1Scene");
            StoryModeManager.resumeTimer();
        }

        const flash = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0xbaf5ff,
            0
        )
            .setScrollFactor(0)
            .setDepth(2000);

        this.tweens.add({
            targets: flash,
            alpha: 1,
            duration: 1000,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.time.delayedCall(250, () => {
                    if (this.scene.isActive()) {
                        this.scene.start("Level1Scene");
                    }
                });
            }
        });
    }

    // ==================================================
    // TARINAN ALKU JA METSÄN SYDÄN
    // ==================================================

    showCrystalStory() {
        this.cameras.main.pan(650, 400, 2200, "Sine.easeInOut");
        this.cameras.main.zoomTo(1.6, 2200, "Sine.easeInOut");

        this.time.delayedCall(2300, () => {
            if (this.sceneEnded) return;

            this.showStory(
                "At the heart of the forest stood an ancient crystal, the source of all its magic.\n" +
                "Its light protected every creature and kept the balance between nature and magic.\n" +
                "As long as the crystal shone, the forest would remain safe.",
                170,
                () => {
                    this.startCrystalFlashing();

                    this.cameras.main.pan(640, 360, 1800, "Sine.easeInOut");
                    this.cameras.main.zoomTo(1, 1800, "Sine.easeInOut");

                    this.time.delayedCall(1900, () => {
                        if (this.sceneEnded) return;

                        this.showStory(
                            "But one night, the ancient crystal began to tremble.",
                            130,
                            () => this.startScaryScene()
                        );
                    });
                }
            );
        });
    }

    startCrystalFlashing() {
        this.crystalFlickering = true;
        // Danger-coming alkaa forest-heartin päälle.
        this.dangerComingMusic = this.sound.add("danger-coming-music", {
            volume: 0,
            loop: true
        });

        this.dangerComingMusic.play();

        // Danger-coming voimistuu samalla, kun forest-heart hiljenee.
        this.tweens.add({
            targets: this.forestHeartMusic,
            volume: 0,
            duration: 1000,
            ease: "Linear",
            onComplete: () => {
                this.forestHeartMusic?.stop();
            }
        });

        this.tweens.add({
            targets: this.dangerComingMusic,
            volume: 0.5,
            duration: 1000,
            ease: "Linear"
        });

        const flash = () => {
            if (
                !this.crystalFlickering ||
                this.sceneEnded ||
                !this.crystalGlow ||
                !this.crystalCore
            ) {
                return;
            }

            this.tweens.add({
                targets: [this.crystalGlow, this.crystalCore],
                alpha: 1,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 100,
                yoyo: true,
                repeat: 2,
                repeatDelay: 100,
                ease: "Linear",
                onComplete: () => {
                    if (this.crystalFlickering && !this.sceneEnded) {
                        this.time.delayedCall(250, flash);
                    }
                }
            });
        };

        flash();
    }

    // ==================================================
    // ELÄIMET SÄIKÄHTÄVÄT
    // ==================================================

    startScaryScene() {
        this.cameras.main.shake(3000, 0.008, false);

        const animals = [
            [this.deerPair, "deer-scary-01"],
            [this.owl, "owl-scary"],
            [this.rabbit, "rabbit-scary"],
            [this.wolf, "wolf-scary"],
            [this.rabbit2, "rabbit2-scary"]
        ];

        if (this.owl?.active) this.owl.y -= 15;
        if (this.rabbit?.active) this.rabbit.y += 20;
        if (this.wolf?.active) this.wolf.y += 15;
        if (this.rabbit2?.active) this.rabbit2.y += 10;
        if (this.deerPair?.active) this.deerPair.y += 15;

        for (const [animal, texture] of animals) {
            if (animal?.active && this.textures.exists(texture)) {
                animal.anims.stop();
                animal.setTexture(texture);
            }
        }

        if (
            this.textures.exists("deer-scary-01") &&
            this.textures.exists("deer-scary-02")
        ) {
            if (!this.anims.exists("deer-scared")) {
                this.anims.create({
                    key: "deer-scared",
                    frames: [
                        { key: "deer-scary-01" },
                        { key: "deer-scary-02" }
                    ],
                    frameRate: 1,
                    repeat: -1
                });
            }

            this.deerPair?.play("deer-scared");
        }

        this.fireflies.forEach(fly => {
            this.tweens.add({
                targets: [fly.glow, fly.light],
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    fly.glow.destroy();
                    fly.light.destroy();
                }
            });
        });

        this.fireflies = [];

        this.time.delayedCall(3000, () => this.showDarkClouds());
    }

    // ==================================================
    // TUMMAT PILVET
    // ==================================================

    showDarkClouds() {
        if (this.sceneEnded) return;
        this.sound.play("thunder-sound", {
            volume: 0.7,
            loop: false
        });

        const cloud = this.add.image(1450, 180, "moon-cloud")
            .setScale(0.30)
            .setAlpha(0)
            .setDepth(10);

        this.tweens.add({
            targets: cloud,
            x: 950,
            y: 180,
            alpha: 1,
            duration: 3500,
            ease: "Sine.easeInOut",
            onStart: () => this.showEdgeClouds()
        });
    }

    showEdgeClouds() {
        const positions = [
            {
                key: "cloud-up-left",
                x: -350,
                y: -100,
                targetX: 250,
                targetY: 180
            },
            {
                key: "cloud-up-right",
                x: 1550,
                y: -100,
                targetX: 1030,
                targetY: 180
            },
            {
                key: "cloud-down-left",
                x: -350,
                y: 820,
                targetX: 250,
                targetY: 530
            },
            {
                key: "cloud-down-right",
                x: 1550,
                y: 820,
                targetX: 1030,
                targetY: 530
            }
        ];

        let completed = 0;

        positions.forEach((position, index) => {
            const cloud = this.add.image(
                position.x,
                position.y,
                position.key
            )
                .setScale(0.5)
                .setAlpha(0)
                .setDepth(11 + index);

            this.tweens.add({
                targets: cloud,
                x: position.targetX,
                y: position.targetY,
                alpha: 1,
                duration: 3500,
                delay: index * 100,
                ease: "Sine.easeInOut",
                onComplete: () => {
                    completed++;

                    if (completed === positions.length && !this.sceneEnded) {
                        this.time.delayedCall(300, () => {
                            this.showStory(
                                "A dark presence had awakened deep within the forest.\n" +
                                "The magic that once protected the land was about to be tested.",
                                150,
                                () => this.showBloodwing()
                            );
                        });
                    }
                }
            });
        });
    }

    // ==================================================
    // BLOODWING ILMESTYY
    // ==================================================

    showBloodwing() {
        if (this.sceneEnded) return;

        const villain = this.add.image(980, 200, "villain01")
            .setScale(0.25)
            .setAlpha(0)
            .setDepth(20);

        this.bloodwing = villain;

        this.tweens.add({
            targets: villain,
            alpha: 1,
            duration: 1000,
            ease: "Sine.easeInOut"
        });

        this.bloodwingAnimation = this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                if (!villain.active) return;

                villain.setTexture(
                    villain.texture.key === "villain01"
                        ? "villain02"
                        : "villain01"
                );
            }
        });

        this.time.delayedCall(1800, () => {
            if (this.sceneEnded) return;

            this.showStory(
                "Oh no! The evil of the past has awakened...\nand it seeks to steal the Crystal!",
                150,
                () => this.startCrystalFlash()
            );
        });
    }

    // ==================================================
    // KRISTALLIN VARASTAMINEN JA TAUSTAN VAIHTO
    // ==================================================

    startCrystalFlash() {
        if (this.flashInProgress || this.sceneEnded) return;

        this.flashInProgress = true;

        const flash = this.add.circle(660, 410, 20, 0x75fff0)
            .setAlpha(0)
            .setDepth(2000);

        this.tweens.add({
            targets: flash,
            scale: 100,
            alpha: 1,
            duration: 800,
            ease: "Quad.easeIn",

            onComplete: () => {
                this.children.list
                    .filter(object => object.texture?.key === "forest-heart")
                    .forEach(object => object.destroy());

                this.forestBackground = null;

                this.add.image(640, 360, "dark-forest")
                    .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
                    .setDepth(0);

                this.crystalGlow?.destroy();
                this.crystalCore?.destroy();

                this.crystalGlow = null;
                this.crystalCore = null;
                this.crystalFlickering = false;

                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 500,

                    onComplete: () => {
                        flash.destroy();

                        this.time.delayedCall(400, () => {
                            this.startBloodwingFlash();
                        });
                    }
                });
            }
        });
    }

    startBloodwingFlash() {
        if (!this.bloodwing?.active) {
            this.flashInProgress = false;
            return;
        }

        const villain = this.bloodwing;

        this.bloodwingAnimation?.remove();
        this.bloodwingAnimation = null;

        const redFlash = this.add.circle(
            villain.x,
            villain.y,
            35,
            0xff2020
        )
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0)
            .setDepth(2001);

        this.tweens.add({
            targets: redFlash,
            scale: 9,
            alpha: 1,
            duration: 250,
            ease: "Quad.easeOut"
        });

        this.tweens.add({
            targets: villain,
            alpha: 0,
            scale: villain.scaleX * 0.7,
            duration: 350,
            ease: "Quad.easeIn",

            onComplete: () => {
                villain.destroy();
                this.bloodwing = null;

                // Danger-coming loppuu, forest-after alkaa.
                if (!this.forestAfterMusic) {
                    this.forestAfterMusic = this.sound.add("forest-after-music", {
                        volume: 0,
                        loop: true
                    });
                }

                this.forestAfterMusic.play();

                // Danger-coming hiljenee yhden sekunnin aikana.
                if (this.dangerComingMusic) {
                    this.tweens.add({
                        targets: this.dangerComingMusic,
                        volume: 0,
                        duration: 1000,
                        ease: "Linear",
                        onComplete: () => {
                            this.dangerComingMusic?.stop();
                        }
                    });
                }

// Forest-after voimistuu samanaikaisesti.
this.tweens.add({
    targets: this.forestAfterMusic,
    volume: 0.5,
    duration: 1000,
    ease: "Linear"
});

                this.children.list
                    .filter(object =>
                        object.active &&
                        object.texture?.key?.includes("cloud")
                    )
                    .forEach(cloud => {
                        this.tweens.add({
                            targets: cloud,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => cloud.destroy()
                        });
                    });

                this.tweens.add({
                    targets: redFlash,
                    alpha: 0,
                    duration: 400,

                    onComplete: () => {
                        redFlash.destroy();
                        this.flashInProgress = false;

                        this.time.delayedCall(700, () => {
                            this.showStory(
                                "Oh no! The Forest Crystal has been stolen! " +
                                "We must wake up the Forest Guardian as soon as possible!",
                                150,
                                () => this.transitionToTemple(),
                                590,
                                "owl-avatar"
                            );
                        });
                    }
                });
            }
        });
    }

    // ==================================================
    // SIIRTYMINEN TEMPPELIIN
    // ==================================================

    transitionToTemple() {
        const blackScreen = this.add.rectangle(
            640, 360, GAME_WIDTH, GAME_HEIGHT, 0x000000
        )
            .setScrollFactor(0)
            .setDepth(3000);

        this.time.delayedCall(1000, () => {
            this.children.list
                .filter(object => object.texture?.key === "dark-forest")
                .forEach(object => object.destroy());

            [
                this.deerPair,
                this.owl,
                this.rabbit,
                this.wolf,
                this.rabbit2
            ].forEach(animal => {
                if (animal?.active) animal.destroy();
            });

            this.fireflies.forEach(fly => {
                if (fly.glow?.active) fly.glow.destroy();
                if (fly.light?.active) fly.light.destroy();
            });

            this.fireflies = [];

            this.add.image(640, 360, "tempel")
                .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
                .setDepth(0);

            blackScreen.destroy();

            this.showStory(
                "This is the Ancient Temple. The Forest Guardian rests within these ruins.",
                150,
                () => {
                    this.showStory(
                        "I must awaken our Guardian. Only they can save our enchanted forest!",
                        150,
                        () => this.startGuardianAwakening(),
                        590,
                        "owl-avatar"
                    );
                },
                590,
                "owl-avatar"
            );
        });
    }

    // ==================================================
    // VARTIJAN HERÄTTÄMINEN
    // ==================================================

    startGuardianAwakening() {
        const cracks = this.add.graphics()
            .setPosition(25, -70)
            .setDepth(50);

        const crackPaths = [
            [[625, 285], [605, 300], [585, 295], [565, 310]],
            [[625, 285], [645, 300], [665, 290], [685, 305]],
            [[605, 300], [590, 320], [565, 325], [550, 345]],
            [[645, 300], [665, 320], [690, 325], [710, 345]],
            [[590, 320], [570, 345], [580, 365], [555, 385]],
            [[665, 320], [685, 345], [675, 365], [700, 385]],
            [[625, 325], [610, 350], [625, 370], [610, 395]],
            [[610, 395], [585, 400], [565, 420], [540, 415]],
            [[625, 370], [650, 390], [680, 400], [705, 420]],
            [[610, 395], [630, 420], [610, 445], [635, 465]],
            [[565, 420], [550, 445], [565, 465], [545, 485]],
            [[680, 400], [700, 430], [685, 455], [710, 475]],
            [[610, 445], [590, 470], [600, 495], [580, 515]],
            [[635, 465], [655, 485], [645, 510], [665, 525]]
        ];

        let drawnPaths = 0;

        this.cameras.main.shake(900, 0.003);

        this.sound.play("fox-crashing-sound", {
            volume: 0.7,
            loop: false
        });
                
        this.time.addEvent({
            delay: 300,
            repeat: crackPaths.length - 1,

            callback: () => {
                if (this.sceneEnded) return;

                const path = crackPaths[drawnPaths];
                if (!path) return;

                cracks.lineStyle(12, 0x168bff, 0.25)
                    .beginPath()
                    .moveTo(path[0][0], path[0][1]);

                for (let i = 1; i < path.length; i++) {
                    cracks.lineTo(path[i][0], path[i][1]);
                }

                cracks.strokePath();

                cracks.lineStyle(5, 0x35eaff, 1)
                    .beginPath()
                    .moveTo(path[0][0], path[0][1]);

                for (let i = 1; i < path.length; i++) {
                    cracks.lineTo(path[i][0], path[i][1]);
                }

                cracks.strokePath();
                drawnPaths++;
            }
        });

        this.time.delayedCall(2300, () => {
            if (this.sceneEnded) return;

            const flash = this.add.rectangle(
                640, 360, GAME_WIDTH, GAME_HEIGHT, 0x45eaff
            )
                .setScrollFactor(0)
                .setAlpha(0)
                .setDepth(3000);

            this.tweens.add({
                targets: flash,
                alpha: 1,
                duration: 150,
                yoyo: true,
                hold: 200,

                onComplete: () => {
                    this.children.list
                        .filter(object => object.texture?.key === "tempel")
                        .forEach(object => object.destroy());

                    this.add.image(640, 360, "awake")
                        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
                        .setDepth(0);

                    if (cracks.active) cracks.destroy();
                    flash.destroy();

                    const guardian = this.add.image(
                        650, 280, "fox-sit-1"
                    )
                        .setDisplaySize(300, 300)
                        .setDepth(10);

                    this.time.addEvent({
                        delay: 1200,
                        loop: true,

                        callback: () => {
                            if (!guardian.active) return;

                            guardian.setTexture(
                                guardian.texture.key === "fox-sit-1"
                                    ? "fox-sit-2"
                                    : "fox-sit-1"
                            );
                        }
                    });

                    this.time.delayedCall(1500, () => {
                        if (this.sceneEnded) return;

                        this.showStory(
                            "Guardian! You have finally awakened! The forest needs you!",
                            150,
                            () => {
                                this.showStory(
                                    "Understood.",
                                    150,
                                    () => this.transitionToLevel1(),
                                    590,
                                    "fox-avatar",
                                    "#65f5ff"
                                );
                            },
                            590,
                            "owl-avatar"
                        );
                    });
                }
            });
        });
    }

    // ==================================================
    // PELIN PÄIVITYS
    // ==================================================

    update(time) {
        if (this.fireflies) {
            this.fireflies.forEach(fly => {
                if (!fly.glow.active || !fly.light.active) return;

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

        if (
            this.crystalGlow &&
            this.crystalCore &&
            !this.crystalFlickering
        ) {
            const pulse = (Math.sin(time / 300) + 1) / 2;

            this.crystalGlow
                .setAlpha(0.25 + pulse * 0.55)
                .setScale(0.9 + pulse * 0.5);

            this.crystalCore
                .setAlpha(0.3 + pulse * 0.6)
                .setScale(0.9 + pulse * 0.4);
        }
    }

    // ==================================================
    // INTRON OHITTAMINEN
    // ==================================================

    skipIntro() {
        if (this.sceneEnded) return;
        this.forestHeartMusic?.stop();
        this.dangerComingMusic?.stop();
        this.forestAfterMusic?.stop();

        this.sound.stopAll();
        this.sceneEnded = true;
        this.destroyStory();

        if (StoryModeManager.active) {
            StoryModeManager.setCurrentLevel("Level1Scene");
            StoryModeManager.resumeTimer();
        }

        this.scene.start("Level1Scene");
    }

    // ==================================================
    // KOHTAUKSEN SIIVOUS
    // ==================================================

    cleanup() {
        this.sceneEnded = true;

        if (this.bloodwingAnimation) {
            this.bloodwingAnimation.remove();
            this.bloodwingAnimation = null;
        }

        this.tweens.killAll();
        this.time.removeAllEvents();
    }
}