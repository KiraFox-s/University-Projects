
import { GAME_WIDTH, GAME_HEIGHT, ASSETS, COLORS } from "./GameData.js";
import { GameTimer } from "./GameTimer.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { GameTechnic } from "./GameTechnic.js";
import { MenuMusic } from "./MenuMusic.js";

const STORY_COMPLETED_KEY = "spiritFoxStoryCompleted";
const LEVEL_SCENES = {
    Level1Scene: true,
    Level2Scene: true,
    Level3Scene: true,
    BossLevelScene: true
};

export class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super("LevelSelectScene");
    }

    preload() {
        this.load.image("levels-background", ASSETS.menuBackground);
        this.load.image("level1-preview", ASSETS.level1Background);
        this.load.image("level2-preview", "assets/images/backgrounds/level2.webp");
        this.load.image("level3-preview", "assets/images/backgrounds/level3.webp");
        this.load.image("boss-preview", "assets/images/backgrounds/boss.webp");
    }

    create() {
        // Nollataan tila, kun kenttävalikko avataan uudelleen.
        this.isStartingLevel = false;

        // Estetään Level Selectin avaaminen ennen Story Moden läpäisyä.
        let storyCompleted = false;
        try {
            storyCompleted =
                localStorage.getItem(STORY_COMPLETED_KEY) === "true";
        } catch (error) {
            console.warn("Story Moden tilaa ei voitu lukea:", error);
        }

        if (!storyCompleted) {
            this.scene.start("MenuScene");
            return;
        }

        // Taustakuva.
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "levels-background"
        ).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        // Tumma kerros taustan päällä.
        this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x05091c,
            0.55
        );

        // Otsikko.
        this.add.text(
            GAME_WIDTH / 2,
            90,
            "SELECT YOUR LEVEL",
            {
                fontFamily: "Georgia, serif",
                fontSize: "42px",
                color: COLORS.lightBlue,
                stroke: "#07133d",
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Alaotsikko.
        this.add.text(
            GAME_WIDTH / 2,
            140,
            "Choose your next adventure",
            {
                fontFamily: "Georgia, serif",
                fontSize: "23px",
                color: COLORS.white
            }
        ).setOrigin(0.5);

        // Koristeviiva.
        this.add.rectangle(
            GAME_WIDTH / 2,
            165,
            360,
            2,
            0x65f5ff,
            0.9
        );

        // Ohjeet.
        const instructions = [
            "Collect all crystals as quickly as possible.",
            "Defeat Shadow Eagle as fast as you can.",
            "Set new records and claim your place in the Top 3!"
        ];

        instructions.forEach((instruction, index) => {
            this.add.text(
                GAME_WIDTH / 2,
                190 + index * 25,
                instruction,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "20px",
                    color: "#baf5ff",
                    align: "center"
                }
            ).setOrigin(0.5);
        });

        // Level 1.
        this.createLevelButton(
            500,
            360,
            "LEVEL 1",
            "AVAILABLE",
            () => this.startLevelMode("Level1Scene"),
            "level1-preview"
        );

        // Level 2.
        this.createLevelButton(
            780,
            360,
            "LEVEL 2",
            "AVAILABLE",
            () => this.startLevelMode("Level2Scene"),
            "level2-preview"
        );

        // Level 3.
        this.createLevelButton(
            500,
            510,
            "LEVEL 3",
            "THE ABYSS",
            () => this.startLevelMode("Level3Scene"),
            "level3-preview"
        );

        // Boss Level.
        this.createLevelButton(
            780,
            510,
            "BOSS LEVEL",
            "SHADOW EAGLE",
            () => this.startLevelMode("BossLevelScene"),
            "boss-preview"
        );

        // Takaisin päävalikkoon.
        this.createButton(
            GAME_WIDTH / 2,
            630,
            "BACK TO MENU",
            () => this.scene.start("MenuScene")
        );
    }

    // Asetetaan Level Mode ennen tason käynnistämistä.
    startLevelMode(sceneKey) {
        if (this.isStartingLevel) {
            return;
        }

        if (!Object.hasOwn(LEVEL_SCENES, sceneKey)) {
            console.error("Tuntematon kenttä:", sceneKey);
            return;
        }

        this.isStartingLevel = true;

        // Lopetetaan mahdollinen aiempi tarinatilan ajanotto.
        StoryModeManager.pauseTimer();
        StoryModeManager.reset();

        // Aloitetaan uusi, erillinen Level Mode -ajanotto.
        GameTimer.reset();

        if (!GameTimer.setGameMode("level")) {
            console.error("Level Mode -pelitilaa ei voitu asettaa.");
            this.isStartingLevel = false;
            return;
        }

        this.registry.set("gameMode", "level");
        GameTechnic.lives = 3;

        MenuMusic.stop();
        this.scene.start(sceneKey);
    }

    createLevelButton(
        x,
        y,
        title,
        status,
        callback,
        imageKey
    ) {
        const panelColor = 0x153d52;

        // Tason esikatselukuva.
        this.add.image(x, y, imageKey)
            .setDisplaySize(230, 100)
            .setDepth(1);

        // Painikkeen paneeli.
        const panel = this.add.rectangle(
            x,
            y,
            230,
            100,
            panelColor,
            0.65
        )
            .setStrokeStyle(2, 0x65f5ff)
            .setDepth(2)
            .setInteractive({ useHandCursor: true });

        panel.on("pointerover", () => {
            panel.setFillStyle(0x20566b, 0.8);
        });

        panel.on("pointerout", () => {
            panel.setFillStyle(panelColor, 0.65);
        });

        panel.on("pointerdown", callback);

        // Tason nimi.
        this.add.text(
            x,
            y - 12,
            title,
            {
                fontFamily: "Georgia, serif",
                fontSize: "25px",
                color: "#baf5ff",
                stroke: "#07133d",
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(3);

        // Tason kuvaus.
        this.add.text(
            x,
            y + 22,
            status,
            {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#8fe5b4",
                stroke: "#07133d",
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(3);
    }

    createButton(x, y, label, callback) {
        const button = this.add.text(
            x,
            y,
            label,
            {
                fontFamily: "Georgia, serif",
                fontSize: "21px",
                color: "#ffffff",
                backgroundColor: "#102a57",
                padding: {
                    left: 24,
                    right: 24,
                    top: 10,
                    bottom: 10
                }
            }
        )
            .setOrigin(0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true });

        button.on("pointerover", () => {
            button.setStyle({
                color: "#65f5ff",
                backgroundColor: "#1b4380"
            });
        });

        button.on("pointerout", () => {
            button.setStyle({
                color: "#ffffff",
                backgroundColor: "#102a57"
            });
        });

        button.on("pointerdown", callback);
    }
}
