import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { GameTimer } from "./GameTimer.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { GameTechnic } from "./GameTechnic.js";
import { MenuMusic } from "./MenuMusic.js";

const STORY_COMPLETED_KEY = "spiritFoxStoryCompleted";

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {
        this.load.image("menu-night", "assets/images/backgrounds/menu.webp");
        this.load.image("menu-morning", "assets/images/backgrounds/menu-morning.webp");
        this.load.image("menu-day", "assets/images/backgrounds/menu-day.webp");
        this.load.image("menu-evening", "assets/images/backgrounds/menu-evening.webp");
        this.load.audio( "main-menu-music", "assets/audio/main-menu-music.mp3");
    }

    async fetchSunTimes() {
        const url =
            "https://api.sunrise-sunset.org/json" +
            "?lat=61.0587&lng=28.1887&formatted=0";

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API-virhe: ${response.status}`);
            }

            const data = await response.json();

            if (data.status !== "OK") {
                throw new Error("Auringonaikojen haku epäonnistui.");
            }

            return {
                sunrise: new Date(data.results.sunrise),
                sunset: new Date(data.results.sunset)
            };
        } catch (error) {
            console.warn(
                "Auringonaikoja ei saatu haettua API:sta:",
                error
            );

            return null;
        }
    }

    getBackgroundKey(sunrise, sunset) {
    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const sunriseMinutes =
        sunrise.getHours() * 60 + sunrise.getMinutes();

    const sunsetMinutes =
        sunset.getHours() * 60 + sunset.getMinutes();

    const daylightMinutes = sunsetMinutes - sunriseMinutes;

    // Jos API:n ajat eivät ole käyttökelpoisia,
    // käytetään kellonaikaan perustuvaa vararatkaisua.
    if (daylightMinutes <= 0) {
        return this.getFallbackBackgroundKey(currentMinutes);
    }

    const morningEnd = sunriseMinutes + daylightMinutes / 3;
    const eveningStart = sunriseMinutes + daylightMinutes * 2 / 3;

    if (
        currentMinutes < sunriseMinutes ||
        currentMinutes >= sunsetMinutes
    ) {
        return "menu-night";
    }

    if (currentMinutes < morningEnd) {
        return "menu-morning";
    }

    if (currentMinutes < eveningStart) {
        return "menu-day";
    }

    return "menu-evening";
}

    getFallbackBackgroundKey(currentMinutes) {
        const hour = currentMinutes / 60;

        if (hour >= 6 && hour < 11) {
            return "menu-morning";
        }

        if (hour >= 11 && hour < 17) {
            return "menu-day";
        }

        if (hour >= 17 && hour < 21) {
            return "menu-evening";
        }

        return "menu-night";
    }

    create() {
        MenuMusic.play(this);

        // Tarkistetaan, onko Story Mode läpäisty.
        try {
            this.storyCompleted =
                localStorage.getItem(STORY_COMPLETED_KEY) === "true";
        } catch (error) {
            console.warn("Story Moden tilaa ei voitu lukea:", error);
            this.storyCompleted = false;
        }

        // Tausta.
        // Luodaan tausta ensin yökuvalla, se toimii varataustana API-haun aikana.
        this.menuBackground = this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "menu-night"
        ).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        // Pidetään tausta muiden valikkosisältöjen takana.
        this.menuBackground.setDepth(-10);

        // Haetaan oikeat auringonnousu- ja auringonlaskuajat.
        this.fetchSunTimes().then((sunTimes) => {
            let backgroundKey;

            if (sunTimes) {
                backgroundKey = this.getBackgroundKey(
                    sunTimes.sunrise,
                    sunTimes.sunset
                );
            } else {
                const now = new Date();
                const currentMinutes =
                    now.getHours() * 60 + now.getMinutes();

                backgroundKey =
                    this.getFallbackBackgroundKey(currentMinutes);
            }

            // Vaihdetaan tausta API:n tietojen perusteella.
            if (this.menuBackground?.active && this.scene.isActive()) {
                this.menuBackground.setTexture(backgroundKey);
            }
        });

        // Otsikko.
        this.add.text(430, 110, "SPIRIT FOX", {
            fontFamily: "Georgia, serif",
            fontSize: "56px",
            color: "#baf5ff",
            stroke: "#080d25",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(430, 165, "THE LOST MAGIC", {
            fontFamily: "Georgia, serif",
            fontSize: "28px",
            color: "#e5baff",
            stroke: "#080d25",
            strokeThickness: 4
        }).setOrigin(0.5);

        // STORY: aloitetaan kokonaan uusi Story Mode -kierros.
        this.createButton(430, 260, "STORY", () => {
            GameTimer.reset();
            if (!GameTimer.setGameMode("story")) {
                console.error("Story Mode -pelitilaa ei voitu asettaa.");
                return;
            }
            this.registry.set("gameMode", "story");
            StoryModeManager.start(3);
            GameTechnic.lives = 3;
            MenuMusic.stop();
            this.scene.start("IntroScene");
        });

        // LOAD.
        this.createButton(430, 340, "LOAD", () => {
            this.scene.start("LoadScene");
        });

        // CONTROLS.
        this.createButton(430, 420, "CONTROLS", () => {
            this.scene.start("ControlsScene");
        });

        // LEVELS: lukittu ennen Story Moden läpäisyä.
        this.createButton(
            430,
            500,
            "LEVELS",
            () => {
                if (!this.storyCompleted) {
                    this.showLockedMessage();
                    return;
                }

                this.scene.start("LevelSelectScene");
            },
            this.storyCompleted
        );

        // SCORE: lukittu ennen Story Moden läpäisyä.
        this.createButton(
            430,
            580,
            "SCORE",
            () => {
                if (!this.storyCompleted) {
                    this.showLockedMessage();
                    return;
                }

                this.scene.start("ResultsScene");
            },
            this.storyCompleted
        );

        // Animoidut tulikärpäset.
        this.createFireflies(24);
        // Kosketusohjauksen asetus.
        this.createTouchControlsSetting();
    }

    createTouchControlsSetting() {
        const storageKey = "spiritFoxTouchControls";

        // Tunnistetaan kosketusta tukeva laite.
        const supportsTouch =
            this.sys.game.device.input.touch ||
            (navigator.maxTouchPoints || 0) > 0;

        // Luetaan aiempi valinta tai käytetään laitteen oletusta.
        let enabled = supportsTouch;

        try {
            const saved = localStorage.getItem(storageKey);

            if (saved !== null) {
                enabled = saved === "true";
            }
        } catch (error) {
            console.warn("Kosketusasetusta ei voitu lukea:", error);
        }

        this.registry.set("touchControlsEnabled", enabled);

        const label = () =>
            `TOUCH CONTROLS: ${enabled ? "ON" : "OFF"}`;

        const setting = this.add.text(
            GAME_WIDTH - 18,
            GAME_HEIGHT - 18,
            label(),
            {
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                color: "#baf5ff",
                backgroundColor: "#102a3b",
                padding: {
                    x: 12,
                    y: 9
                },
                stroke: "#080d25",
                strokeThickness: 2
            }
        )
            .setOrigin(1, 1)
            .setDepth(20)
            .setInteractive({ useHandCursor: true });

        setting.on("pointerdown", () => {
            enabled = !enabled;

            this.registry.set("touchControlsEnabled", enabled);
            setting.setText(label());

            try {
                localStorage.setItem(storageKey, String(enabled));
            } catch (error) {
                console.warn("Kosketusasetusta ei voitu tallentaa:", error);
            }
        });
    }

    createButton(x, y, label, callback, unlocked = true) {
        const button = this.add.text(x, y, label, {
            fontFamily: "Georgia, serif",
            fontSize: "28px",
            color: unlocked ? "#ffffff" : "#a0a0a0",
            backgroundColor: unlocked ? "#183b45" : "#292d3b",
            padding: {
                x: 28,
                y: 12
            },
            stroke: "#080d25",
            strokeThickness: 2
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        
        button.on("pointerover", () => {
            if (!unlocked) {
                return;
            }
            button.setStyle({
                color: "#baf5ff",
                backgroundColor: "#285b68"
            });
        });

        button.on("pointerout", () => {
            button.setStyle({
                color: unlocked ? "#ffffff" : "#a0a0a0",
                backgroundColor: unlocked ? "#183b45" : "#292d3b"
            });
        });

        button.on("pointerdown", callback);
    }

    showLockedMessage() {
        const message = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 55,
            "Complete Story Mode to unlock this feature!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "20px",
                color: "#baf5ff",
                backgroundColor: "#080d25",
                padding: {
                    x: 16,
                    y: 10
                },
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setDepth(20);

        this.time.delayedCall(2500, () => {
            if (message.active) {
                message.destroy();
            }
        });
    }

    createFireflies(count) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
            const y = Phaser.Math.Between(20, GAME_HEIGHT - 20);

            const firefly = this.add.circle(
                x,
                y,
                Phaser.Math.Between(1, 3),
                0xbaf5ff,
                Phaser.Math.FloatBetween(0.3, 0.9)
            );

            firefly.setDepth(5);

            this.tweens.add({
                targets: firefly,
                alpha: 0.1,
                scale: 1.8,
                duration: Phaser.Math.Between(800, 1800),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 1500),
                ease: "Sine.easeInOut"
            });

            this.tweens.add({
                targets: firefly,
                x: x + Phaser.Math.Between(-25, 25),
                y: y + Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(2000, 4500),
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        }
    }
}