import { GAME_WIDTH, GAME_HEIGHT } from "./GameData.js";
import { ScoreManager } from "./ScoreManager.js";
import { GameTimer } from "./GameTimer.js";
import { formatTime } from "./TimeFormatter.js";

const BOSS_LEVEL_ID = "Boss Level: Shadow Eagle";

export class ResultsScene extends Phaser.Scene {
    constructor() {
        super("ResultsScene");
        this.selectedLevel = "Level 1";
        this.levelButtons = {};
        this.storyScrollY = 0;
        this.maxStoryScroll = 0;
        this.storyList = null;
        this.storyMask = null;
    }

    preload() {
        this.load.image("score-background", "assets/images/backgrounds/Score.webp");
    }

    create() {
        this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            "score-background"
        )
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(0);

        this.add.graphics()
            .fillStyle(0x080d25, 0.72)
            .fillRoundedRect(150, 20, 980, 680, 22)
            .setDepth(1);

        const titleStyle = {
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            color: "#baf5ff",
            stroke: "#080d25",
            strokeThickness: 4
        };

        const headerStyle = {
            fontFamily: "Georgia, serif",
            fontSize: "23px",
            color: "#baf5ff",
            stroke: "#080d25",
            strokeThickness: 2
        };

        const textStyle = {
            fontFamily: "Georgia, serif",
            fontSize: "17px",
            color: "#ffffff",
            stroke: "#080d25",
            strokeThickness: 1
        };

        this.add.text(GAME_WIDTH / 2, 43, "SCORE", titleStyle)
            .setOrigin(0.5)
            .setDepth(2);

        // STORY MODE
        this.add.graphics()
            .fillStyle(0x142b43, 0.9)
            .fillRoundedRect(230, 75, 820, 230, 16)
            .setDepth(1);

        this.add.text(240, 80, "STORY MODE", headerStyle)
            .setDepth(2);

        this.add.text(245, 110, "All completed story runs", {
            ...textStyle,
            color: "#d4e5f4",
            fontSize: "16px"
        }).setDepth(2);

        this.add.graphics()
            .lineStyle(1, 0x45627e, 1)
            .lineBetween(230, 150, 1050, 150)
            .setDepth(2);

        this.storyViewport = {
            x: 200,
            y: 160,
            width: 840,
            height: 140
        };

        this.storyList = this.add.container(0, 0)
            .setDepth(2);

        this.add.text(650, 125, "TOTAL SCORE", {
            fontFamily: "Georgia, serif",
            fontSize: "15px",
            color: "#baf5ff"
        }).setOrigin(0.5, 0).setDepth(3);

        this.add.text(900, 125, "TOTAL TIME", {
            fontFamily: "Georgia, serif",
            fontSize: "15px",
            color: "#baf5ff"
        }).setOrigin(0.5, 0).setDepth(3);

        this.storyMaskGraphics = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        this.storyMaskGraphics.fillRect(
            this.storyViewport.x,
            this.storyViewport.y,
            this.storyViewport.width,
            this.storyViewport.height
        );

        this.storyMask = this.storyMaskGraphics.createGeometryMask();
        this.storyList.setMask(this.storyMask);

        this.refreshStoryResults();

        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            const area = this.storyViewport;

            const insideStory =
                pointer.x >= area.x &&
                pointer.x <= area.x + area.width &&
                pointer.y >= area.y &&
                pointer.y <= area.y + area.height;

            if (!insideStory || this.maxStoryScroll <= 0) return;

            this.storyScrollY = Phaser.Math.Clamp(
                this.storyScrollY + deltaY * 0.5,
                0,
                this.maxStoryScroll
            );

            this.storyList.y = -this.storyScrollY;
        });

        // LEVEL MODE
        this.add.graphics()
            .fillStyle(0x142b43, 0.9)
            .fillRoundedRect(230, 315, 820, 310, 16)
            .setDepth(1);

        this.add.text(GAME_WIDTH / 2, 335, "LEVEL MODE", headerStyle)
            .setOrigin(0.5)
            .setDepth(2);

        this.add.graphics()
            .lineStyle(1, 0x45627e, 1)
            .lineBetween(230, 410, 1050, 410)
            .setDepth(2);

        this.add.text(240, 420, "TOP 3", {
            ...textStyle,
            color: "#baf5ff"
        }).setDepth(2);

        this.add.text(250, 450, "PLAYER NAME", {
            ...textStyle,
            fontSize: "15px",
            color: "#baf5ff"
        }).setDepth(2);

        this.add.text(960, 450, "BEST TIME", {
            ...textStyle,
            fontSize: "15px",
            color: "#baf5ff"
        }).setOrigin(1, 0).setDepth(2);

        this.add.graphics()
            .lineStyle(1, 0x45627e, 1)
            .lineBetween(240, 480, 1040, 480)
            .setDepth(2);

        const levels = [
            { id: "Level 1", label: "Level 1", x: 310, width: 150 },
            { id: "Level 2", label: "Level 2", x: 480, width: 150 },
            { id: "Level 3", label: "Level 3", x: 650, width: 150 },
            {
                id: BOSS_LEVEL_ID,
                label: "Boss",
                x: 820,
                width: 150
            }
        ];

        levels.forEach(level => {
            this.levelButtons[level.id] = this.createLevelButton(
                level.x,
                355,
                level.width,
                42,
                level.id,
                level.label
            );
        });

        this.levelRecordText = this.add.text(240, 500, "", {
            ...textStyle,
            fontSize: "25px",
            align: "left",
            color: "#ffffff",
            lineSpacing: 8
        }).setDepth(2);

        this.levelRecordTimeText = this.add.text(950, 500, "", {
            ...textStyle,
            fontSize: "25px",
            align: "right",
            color: "#ffffff",
            lineSpacing: 8
        }).setOrigin(1, 0).setDepth(2);

        this.refreshLevelRecord();

        const pendingResult = GameTimer.getPendingResult();
        if (
            pendingResult &&
            pendingResult.gameMode === "level" &&
            pendingResult.level === BOSS_LEVEL_ID
        ) {
            this.showBossRecordPrompt();
        }

        const menuButton = this.add.text(
            GAME_WIDTH / 2,
            665,
            "BACK TO MENU",
            {
                ...textStyle,
                fontSize: "19px",
                backgroundColor: "#24506b",
                padding: { x: 20, y: 10 }
            }
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2);

        menuButton.on("pointerover", () => {
            menuButton.setStyle({
                backgroundColor: "#34728c",
                color: "#baf5ff"
            });
        });

        menuButton.on("pointerout", () => {
            menuButton.setStyle({
                backgroundColor: "#24506b",
                color: "#ffffff"
            });
        });

        menuButton.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.cleanup,
            this
        );
    }

        createLevelButton(x, y, width, height, levelId, label = levelId) {
        const background = this.add.rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            levelId === this.selectedLevel ? 0x285b68 : 0x203c58,
            1
        )
            .setInteractive({ useHandCursor: true })
            .setDepth(2);

        const labelText = this.add.text(
            x + width / 2,
            y + height / 2,
            label,
            {
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#ffffff",
                align: "center"
            }
        )
            .setOrigin(0.5)
            .setDepth(3);

        const selectLevel = () => {
            this.selectedLevel = levelId;
            this.updateLevelButtonStyles();
            this.refreshLevelRecord();
        };

        background.on("pointerover", () => {
            background.setFillStyle(0x285b68, 1);
        });

        background.on("pointerout", () => {
            this.updateLevelButtonStyles();
        });

        background.on("pointerdown", selectLevel);

        labelText.setInteractive({ useHandCursor: true });
        labelText.on("pointerdown", selectLevel);

        return {
            background,
            label: labelText,
            levelId
        };
    }

    updateLevelButtonStyles() {
        Object.entries(this.levelButtons).forEach(([levelId, button]) => {
            button.background.setFillStyle(
                levelId === this.selectedLevel ? 0x285b68 : 0x203c58,
                1
            );
        });
    }

    refreshStoryResults() {
        this.storyList.removeAll(true);
        this.storyList.y = 0;
        this.storyScrollY = 0;

        const results = ScoreManager.getStoryResults();

        if (!Array.isArray(results) || results.length === 0) {
            this.maxStoryScroll = 0;

            this.storyList.add(this.add.text(
                240,
                205,
                "No saved story results yet.",
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "17px",
                    color: "#ffffff"
                }
            ));

            return;
        }

        const rowHeight = 65;
        const firstRowY = 165;

        this.maxStoryScroll = Math.max(
            0,
            results.length * rowHeight - this.storyViewport.height
        );

        results.forEach((result, index) => {
            const y = firstRowY + index * rowHeight;

            const date = result.completedAt
                ? new Date(result.completedAt).toLocaleDateString("fi-FI")
                : "";

            const name = this.add.text(
                240,
                y + 2,
                result.playerName || "Forest Fox",
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "24px",
                    color: "#ffffff"
                }
            );

            const score = this.add.text(
                650,
                y + 5,
                String(result.totalScore ?? 0),
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "21px",
                    color: "#baf5ff"
                }
            ).setOrigin(0.5, 0);

            const dateText = this.add.text(
                240,
                y + 37,
                date,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "18px",
                    color: "#d4e5f4"
                }
            );

            const time = this.add.text(
                900,
                y + 5,
                formatTime(result.totalTime),
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "21px",
                    color: "#ffffff"
                }
            ).setOrigin(0.5, 0);

            const arrow = this.add.text(
                1050,
                y + 5,
                "›",
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "30px",
                    color: "#baf5ff"
                }
            ).setOrigin(0.5, 0);

            const hitArea = this.add.rectangle(
                640,
                y + 25,
                880,
                62,
                0xffffff,
                0.001
            ).setInteractive({ useHandCursor: true });

            hitArea.on("pointerdown", () => {
                this.showStoryDetails(result);
            });

            this.storyList.add([
                name,
                score,
                dateText,
                time,
                arrow,
                hitArea
            ]);

            if (index < results.length - 1) {
                const divider = this.add.graphics()
                    .lineStyle(1, 0x45627e, 1)
                    .lineBetween(240, y + 65, 1100, y + 65);

                this.storyList.add(divider);
            }
        });
    }

    showStoryDetails(result) {
        const lines = [
            `Player: ${result.playerName || "Forest Fox"}`,
            `Total time: ${formatTime(result.totalTime)}`,
            `Total score: ${result.totalScore ?? 0}`
        ];

        const levelResults = Array.isArray(result.levelResults)
            ? result.levelResults
            : [];

        levelResults.forEach((level, index) => {
            lines.push(
                `${level.level || `Level ${index + 1}`}: ` +
                `${formatTime(level.time)} | Score: ${level.score ?? 0}`
            );
        });

        const overlay = this.add.container(0, 0).setDepth(20);

        const backdrop = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.65
        ).setInteractive();

        const panel = this.add.graphics();
        panel.fillStyle(0x101b3a, 0.98);
        panel.lineStyle(3, 0x65d8f2, 1);
        panel.fillRoundedRect(
            GAME_WIDTH / 2 - 260,
            GAME_HEIGHT / 2 - 150,
            520,
            300,
            2
        );

        panel.strokeRoundedRect(
            GAME_WIDTH / 2 - 260,
            GAME_HEIGHT / 2 - 150,
            520,
            300,
            2
        );

        // Sisäkehys kuten muissa leveleissä
        panel.lineStyle(2, 0x65d8f2, 1);

        panel.strokeRect(
            GAME_WIDTH / 2 - 240,
            GAME_HEIGHT / 2 - 130,
            480,
            260
        );

        const details = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 155,
            lines.join("\n"),
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff",
                align: "center",
                lineSpacing: 8,
                wordWrap: { width: 540 }
            }
        ).setOrigin(0.5, 0);

        const closeButton = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 135,
            "CLOSE",
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: "#ffffff",
                backgroundColor: "#24506b",
                padding: { x: 18, y: 10 }
            }
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const close = () => overlay.destroy(true);

        closeButton.on("pointerdown", close);
        backdrop.on("pointerdown", close);

        overlay.add([
            backdrop,
            panel,
            details,
            closeButton
        ]);
    }

        refreshLevelRecord() {
        const records = ScoreManager.getLevelTop3(this.selectedLevel);

        if (!Array.isArray(records) || records.length === 0) {
            this.levelRecordText.setText("No records yet.");
            this.levelRecordTimeText.setText("");
            return;
        }

        this.levelRecordText.setText(
            records.map((record, index) => {
                const name = record.playerName || "Forest Fox";
                return `${index + 1}.  ${name}`;
            }).join("\n")
        );

        this.levelRecordTimeText.setText(
            records.map(record => formatTime(record.bestTime)).join("\n")
        );
    }

    showBossRecordPrompt() {
        const pendingResult = GameTimer.getPendingResult();

        if (!pendingResult) return;

        const qualifies = ScoreManager.qualifiesForLevelTop3(
            BOSS_LEVEL_ID,
            pendingResult.time
        );

        if (!qualifies) {
            GameTimer.discardPendingResult();
            return;
        }

        const overlay = this.add.container(0, 0).setDepth(30);

        const backdrop = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.75
        ).setInteractive();

        const panel = this.add.graphics();
        panel.fillStyle(0x142b43, 0.98);
        panel.lineStyle(3, 0x65d8f2, 1);
        panel.fillRoundedRect(
            GAME_WIDTH / 2 - 260,
            GAME_HEIGHT / 2 - 150,
            520,
            300,
            18
        );
        panel.strokeRoundedRect(
            GAME_WIDTH / 2 - 260,
            GAME_HEIGHT / 2 - 150,
            520,
            300,
            18
        );

        const title = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 105,
            "NEW HIGH SCORE!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "30px",
                color: "#baf5ff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        const message = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 55,
            "You made it into the TOP 3!",
            {
                fontFamily: "Georgia, serif",
                fontSize: "17px",
                color: "#ffffff",
                align: "center",
                lineSpacing: 8
            }
        ).setOrigin(0.5);

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 20;
        input.placeholder = "Player name";
        input.value = ScoreManager.getPlayerName() || "";
        input.autocomplete = "off";

        Object.assign(input.style, {
            position: "absolute",
            left: "50%",
            top: "47%",
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

        const errorText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 30,
            "",
            {
                fontFamily: "Georgia, serif",
                fontSize: "15px",
                color: "#ffaaaa",
                align: "center"
            }
        ).setOrigin(0.5);

        const saveButton = this.add.text(
            GAME_WIDTH / 2 - 75,
            GAME_HEIGHT / 2 + 85,
            "SAVE",
            {
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#24506b",
                padding: { x: 14, y: 8 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const cancelButton = this.add.text(
            GAME_WIDTH / 2 + 85,
            GAME_HEIGHT / 2 + 85,
            "CANCEL",
            {
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#24506b",
                padding: { x: 18, y: 8 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const close = () => {
            input.remove();
            overlay.destroy(true);
        };

        saveButton.on("pointerdown", () => {
            const playerName = input.value.trim();

            if (!playerName) {
                errorText.setText("Please enter your name.");
                return;
            }

            const saved = GameTimer.savePendingResult(playerName);

            if (!saved) {
                errorText.setText("Could not save the record.");
                return;
            }

            this.selectedLevel = BOSS_LEVEL_ID;
            this.updateLevelButtonStyles();
            this.refreshLevelRecord();
            close();
        });

        cancelButton.on("pointerdown", () => {
            GameTimer.discardPendingResult();
            close();
        });

        overlay.add([
            backdrop,
            panel,
            title,
            message,
            errorText,
            saveButton,
            cancelButton
        ]);

        input.focus();

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            () => input.remove()
        );
    }

    cleanup() {
        this.input.off("wheel");
        this.storyList?.clearMask(true);
        this.storyMask?.destroy();
        this.storyMask = null;

        this.storyMaskGraphics?.destroy();
        this.storyMaskGraphics = null;
    }
}