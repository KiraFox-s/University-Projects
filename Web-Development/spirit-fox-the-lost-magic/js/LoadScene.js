import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { StoryModeManager } from "./StoryModeManager.js";
import { GameTimer } from "./GameTimer.js";
import { GameTechnic } from "./GameTechnic.js";

const STORY_SAVE_KEY = "spiritFoxStorySave";

const LEVELS = {
    Level1Scene: {
        name: "Level 1",
        preview: "load-level1-preview"
    },
    Level2Scene: {
        name: "Level 2",
        preview: "load-level2-preview"
    },
    Level3Scene: {
        name: "Level 3",
        preview: "load-level3-preview"
    },
    BossLevelScene: {
        name: "Boss Level",
        preview: "load-boss-preview"
    }
};

export class LoadScene extends Phaser.Scene {
    constructor() {
        super("LoadScene");
    }

    preload() {
        this.load.image(
            "load-background",
            "assets/images/backgrounds/load.webp"
        );

        this.load.image(
            "load-level1-preview",
            "assets/images/backgrounds/level1.webp"
        );

        this.load.image(
            "load-level2-preview",
            "assets/images/backgrounds/level2.webp"
        );

        this.load.image(
            "load-level3-preview",
            "assets/images/backgrounds/level3.webp"
        );

        this.load.image(
            "load-boss-preview",
            "assets/images/backgrounds/boss.webp"
        );
    }

    create() {
        this.isLoading = false;

        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "load-background"
        ).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x05091c,
            0.48
        );

        this.add.text(
            GAME_WIDTH / 2,
            85,
            "LOAD GAME",
            {
                fontFamily: "Georgia, serif",
                fontSize: "46px",
                color: "#baf5ff",
                stroke: "#080d25",
                strokeThickness: 5
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            135,
            "Continue your adventure",
            {
                fontFamily: "Georgia, serif",
                fontSize: "21px",
                color: "#e5baff",
                stroke: "#080d25",
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        this.add.rectangle(
            GAME_WIDTH / 2,
            170,
            360,
            2,
            0x65f5ff,
            0.9
        );

        const cardX = GAME_WIDTH / 2;
        const cardY = 315;
        const cardWidth = 700;
        const cardHeight = 190;

        this.add.graphics()
            .fillStyle(0x193b59, 0.94)
            .fillRoundedRect(
                cardX - cardWidth / 2,
                cardY - cardHeight / 2,
                cardWidth,
                cardHeight,
                14
            )
            .setDepth(1);

        this.save = this.getStorySave();

        if (this.save && this.isValidSave(this.save)) {
            this.showSaveCard(this.save, cardX, cardY);
        } else {
            this.save = null;
            this.showEmptySave(cardX, cardY);
        }

        this.continueButton = this.createButton(
            GAME_WIDTH / 2,
            485,
            "CONTINUE STORY",
            () => this.continueStory()
        );

        this.createButton(
            GAME_WIDTH / 2,
            565,
            "BACK TO MENU",
            () => this.scene.start("MenuScene")
        );

        this.continueButton.setVisible(Boolean(this.save));

        this.createFireflies(20);
    }

    getStorySave() {
        try {
            const savedData = localStorage.getItem(STORY_SAVE_KEY);

            if (!savedData) {
                return null;
            }

            return JSON.parse(savedData);
        } catch (error) {
            console.error(
                "Story Moden tallennuksen lukeminen epäonnistui:",
                error
            );

            return null;
        }
    }

    isValidSave(save) {
        if (
            !save ||
            save.gameMode !== "story" ||
            !LEVELS[save.currentLevel] ||
            !Number.isFinite(save.totalTime) ||
            save.totalTime < 0 ||
            !Number.isFinite(save.totalScore) ||
            save.totalScore < 0 ||
            !Number.isInteger(save.lives) ||
            save.lives < 0 ||
            save.lives > 3 ||
            !Array.isArray(save.completedLevels) ||
            !Array.isArray(save.levelResults)
        ) {
            return false;
        }

        return true;
    }

    showSaveCard(save, cardX, cardY) {
        const level = LEVELS[save.currentLevel];

        this.add.image(
            cardX - 225,
            cardY,
            level.preview
        )
            .setDisplaySize(220, 140)
            .setDepth(2);

        this.add.text(
            cardX - 80,
            cardY - 72,
            "STORY MODE",
            {
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                color: "#baf5ff",
                stroke: "#080d25",
                strokeThickness: 2
            }
        ).setDepth(2);

        this.add.text(
            cardX - 80,
            cardY - 35,
            `Current level: ${level.name}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff"
            }
        ).setDepth(2);

        this.add.text(
            cardX - 80,
            cardY,
            `Completed levels: ${
                Array.isArray(save.completedLevels)
                    ? save.completedLevels.length
                    : 0
            } / 4`,
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#baf5ff"
            }
        ).setDepth(2);

        this.add.text(
            cardX - 80,
            cardY + 32,
            `Score: ${Number(save.totalScore) || 0}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: "17px",
                color: "#c4d4e9"
            }
        ).setDepth(2);

        this.add.text(
            cardX - 80,
            cardY + 57,
            `Saved: ${this.formatSavedDate(save.savedAt)}`,
            {
                fontFamily: "Arial",
                fontSize: "13px",
                color: "#c4d4e9"
            }
        ).setDepth(2);
    }

    formatSavedDate(value) {
        if (!value) {
            return "Unknown";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleString();
    }

    showEmptySave(cardX, cardY) {
        this.add.text(
            cardX,
            cardY - 25,
            "NO SAVED GAME YET",
            {
                fontFamily: "Georgia, serif",
                fontSize: "25px",
                color: "#baf5ff",
                stroke: "#080d25",
                strokeThickness: 2,
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setDepth(2);

        this.add.text(
            cardX,
            cardY + 20,
            "Start Story Mode to begin your adventure.",
            {
                fontFamily: "Georgia, serif",
                fontSize: "17px",
                color: "#ffffff",
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setDepth(2);
    }

    continueStory() {
        if (this.isLoading || !this.save) {
            return;
        }

        const save = this.getStorySave();

        if (!this.isValidSave(save)) {
            this.save = null;
            this.continueButton.setVisible(false);

            this.showMessage(
                "The save is missing or invalid. Start a new story."
            );

            return;
        }

        this.isLoading = true;

        // Palautetaan Story Moden kokonaisaika, pisteet,
        // tasotulokset ja elämäpisteet.
        let restored = false;

        try {
            restored = StoryModeManager.loadProgress(save);
        } catch (error) {
            console.error(
                "Story Moden palauttaminen epäonnistui:",
                error
            );
        }

        if (!restored) {
            this.isLoading = false;

            this.showMessage(
                "The saved game could not be restored."
            );

            return;
        }

        // Asetetaan Story Mode ennen tason käynnistämistä.
        GameTimer.reset();
        GameTimer.setGameMode("story");

        // Palautetaan tallennettu tason ajastin.
        const timer = save.gameTimer;
        const timerLevel = StoryModeManager.getTimerLevelName(
            save.currentLevel
        );

        if (
            timer &&
            timer.currentLevel === timerLevel &&
            Number.isFinite(timer.elapsed) &&
            timer.elapsed >= 0
        ) {
            GameTimer.restoreLevel(
                timer.currentLevel,
                timer.elapsed,
                true
            );
        }

        GameTechnic.lives = StoryModeManager.lives;

        this.registry.set("gameMode", "story");

        // Merkitään jatkettava taso ennen kohtaussiirtymää.
        StoryModeManager.setCurrentLevel(save.currentLevel);

        this.scene.start(save.currentLevel);
    }

    showMessage(message) {
        const text = this.add.text(
            GAME_WIDTH / 2,
            625,
            message,
            {
                fontFamily: "Georgia, serif",
                fontSize: "17px",
                color: "#baf5ff",
                backgroundColor: "#08152d",
                padding: {
                    x: 12,
                    y: 8
                },
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setDepth(10);

        this.time.delayedCall(2500, () => {
            if (text.active) {
                text.destroy();
            }
        });
    }

    createButton(x, y, label, callback) {
        const button = this.add.text(x, y, label, {
            fontFamily: "Georgia, serif",
            fontSize: "23px",
            color: "#ffffff",
            backgroundColor: "#183b45",
            padding: {
                x: 26,
                y: 11
            },
            stroke: "#080d25",
            strokeThickness: 2
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on("pointerover", () => {
            if (button.input?.enabled) {
                button.setStyle({
                    color: "#baf5ff",
                    backgroundColor: "#285b68"
                });
            }
        });

        button.on("pointerout", () => {
            button.setStyle({
                color: "#ffffff",
                backgroundColor: "#183b45"
            });
        });

        button.on("pointerdown", callback);

        return button;
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
                Phaser.Math.FloatBetween(0.3, 0.8)
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
